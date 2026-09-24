import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { Navigation } from './components/Navigation';
import { FixtureList } from './components/FixtureList';
import { Statistics } from './components/Statistics';
import { SimilarMatches } from './components/SimilarMatches';
import { MatchCount } from './components/MatchCount';
import { FixtureDownload } from './components/FixtureDownload';
import { TeamLogoUpload } from './components/TeamLogoUpload';
import { MatchHeader } from './components/MatchHeader';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Database, Trophy, Save, RotateCw, Settings, Moon, Sun } from 'lucide-react';
import { Match } from './utils/types/match';
import { Team, TeamMapping } from './utils/types/team';
import { analyzeMatches } from './utils/matchAnalysis';
import { loadMatchData } from './utils/teamDataLoader';
import type { AnalysisResult } from './utils/matchAnalysis';
import SpecialAnalysis from './components/SpecialAnalysis';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import MatchSchedule from './components/MatchSchedule';
import * as XLSX from 'xlsx';
import { PatternDetail } from './components/analysis/PatternDetail';
import { matchDB } from './services/indexedDB';
import { loadEffectiveTeamLogos, saveUploadedTeamLogos } from './utils/teamLogoLoader';
import { toast } from 'react-hot-toast';
import './styles/darkMode.css';

// Sekme tipine MatchSchedule'ı ekle
type ActiveTab = 'fixtures' | 'specialAnalysis' | 'matchSchedule';

// Sekme listesine Maç Programı'nı ekle
const tabs = [
  { id: 'fixtures', name: 'Maçlar' },
  { id: 'specialAnalysis', name: 'Özel Analiz' },
  { id: 'matchSchedule', name: 'Maç Programı' }
] as const;

const MATCH_DATA_VERSION = '2026-2027-v1';

// DO NOT DELETE START - Main App Component
export default function App() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<'fixtures' | 'analysis'>('fixtures');
  const [matchData, setMatchData] = useState<Match[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [searchResults, setSearchResults] = useState<AnalysisResult | null>(null);
  const [teamData, setTeamData] = useState<TeamMapping>(loadEffectiveTeamLogos);

  const handleTeamDataLoad = (logos: TeamMapping) => {
    try {
      saveUploadedTeamLogos(logos);
      setTeamData(loadEffectiveTeamLogos());
      toast.success('Takım logoları yüklendi ve bu tarayıcıya kaydedildi');
    } catch (error) {
      console.error('Logo kaydetme hatası:', error);
      toast.error('Logo dosyası kaydedilemedi');
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // localStorage'dan dark mode tercihini al
    const savedMode = localStorage.getItem('darkMode');
    // Eğer kayıtlı değer varsa onu kullan, yoksa false döndür
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Dark mode değiştiğinde localStorage'a kaydet ve HTML class'ını güncelle
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Tema değiştirme butonu için
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleUEFAFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const newMatches: Match[] = [];
        
        // Mevcut takımların listesini oluştur
        const existingTeams = new Set<string>();
        matchData.forEach(match => {
          existingTeams.add(match.HomeTeam);
          existingTeams.add(match.AwayTeam);
        });
        console.log('Mevcut takımlar:', Array.from(existingTeams));

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          console.log('Yüklenen UEFA maçı örneği:', jsonData[0]);
          
          const processedMatches = jsonData.map((match: any) => {
            // Takım isimlerini kontrol et
            console.log('Kontrol edilen takımlar:', match.HomeTeam, match.AwayTeam);
            
            // Sadece mevcut takımların maçlarını al
            if (!existingTeams.has(match.HomeTeam) && !existingTeams.has(match.AwayTeam)) {
              console.log('Eşleşmeyen takımlar:', match.HomeTeam, match.AwayTeam);
              return null;
            }
            
            // Tarihi normalize et
            let normalizedDate;
            if (typeof match.Date === 'string') {
              // String tarihi işle (format: DD.MM.YYYY veya YYYY-MM-DD)
              const parts = match.Date.includes('.') ? 
                match.Date.split('.').reverse() : 
                match.Date.split('-');
              normalizedDate = new Date(parts.join('-')).getTime() / 86400000 + 25569;
            } else {
              normalizedDate = match.Date;
            }
            console.log('Orijinal tarih:', match.Date, 'Normalize edilmiş:', normalizedDate);
            
            // FTR hesapla
            let ftr = null;
            if (match.FTHG > match.FTAG) ftr = 'H';
            else if (match.FTHG < match.FTAG) ftr = 'A';
            else ftr = 'D';
            
            // HTR hesapla
            let htr = null;
            if (match.HTHG > match.HTAG) htr = 'H';
            else if (match.HTHG < match.HTAG) htr = 'A';
            else htr = 'D';
            
            return {
              ...match,
              FTR: ftr,
              HTR: htr,
              Date: normalizedDate,
              Div: match.Div || 'UEFA',
              isUEFA: true
            };
          }).filter(Boolean);

          console.log('İşlenen maç sayısı:', processedMatches.length);
          newMatches.push(...processedMatches);
        });

        const allMatches = [...matchData, ...newMatches].sort((a, b) => {
          // Excel tarih formatını karşılaştır
          const dateA = Number(a.Date);
          const dateB = Number(b.Date);
          return dateA - dateB;
        });

        console.log('Toplam maç sayısı:', allMatches.length);
        console.log('Eklenen UEFA maçı örneği:', newMatches[0]);
        setMatchData(allMatches);
        console.log('UEFA maçları başarıyla yüklendi');
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('UEFA maç verisi yükleme hatası:', error);
    }
  };

  // DO NOT DELETE START - Initial Data Loading
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            setIsLoading(true);
            setProgress(0);
            console.log('Checking IndexedDB for cached data...');

            // Önce IndexedDB'den veri yüklemeyi dene
            const cachedData = await matchDB.getMatches();
            
            if (cachedData && cachedData.length > 0 && localStorage.getItem('patsiMatchDataVersion') === MATCH_DATA_VERSION) {
                console.log('Loading data from IndexedDB cache...');
                setProgress(50);
                setMatchData(cachedData);
                setProgress(100);
                console.log('Data loaded from cache successfully');
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('No cached data found, loading from GitHub...');
                // Başlangıç animasyonu
                await new Promise(resolve => setTimeout(resolve, 500));
                setProgress(10);

                // Veri yükleme başlangıcı
                await new Promise(resolve => setTimeout(resolve, 300));
                setProgress(30);

                // GitHub'dan veri yükleme
                const data = await loadMatchData();
                setProgress(60);

                // Veri işleme
                await new Promise(resolve => setTimeout(resolve, 300));
                setProgress(80);

                // Verileri state'e kaydetme
                setMatchData(data);
                
                // Verileri IndexedDB'ye de kaydet
                await matchDB.saveMatches(data);
                localStorage.setItem('patsiMatchDataVersion', MATCH_DATA_VERSION);
                
                setProgress(90);

                // Tamamlanma animasyonu
                await new Promise(resolve => setTimeout(resolve, 300));
                setProgress(100);
                
                console.log('Initial match data loaded and cached successfully');
                
                // Tamamlandı mesajını göster
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error('Error loading initial match data:', error);
            toast.error('Veri yüklenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };

    loadInitialData();
  }, []);
  // DO NOT DELETE END - Initial Data Loading

  // DO NOT DELETE START - Core Match Selection Handler
  const handleFixtureSelect = (match: Match) => {
    setSelectedMatch(match);
    // Store selected match in localStorage
    localStorage.setItem('selectedMatch', JSON.stringify(match));
    const results = analyzeMatches(matchData, match);
    setSearchResults(results);
    navigate('/surpriz-analiz');
  };
  // DO NOT DELETE END - Core Match Selection Handler

  // Load selected match from localStorage on app start
  useEffect(() => {
    const savedMatch = localStorage.getItem('selectedMatch');
    if (savedMatch) {
      try {
        const match = JSON.parse(savedMatch);
        setSelectedMatch(match);
      } catch (error) {
        console.error('Error loading saved match:', error);
      }
    }
  }, []);

  const handlePageChange = (page: 'fixtures' | 'analysis') => {
    setActivePage(page);
    if (page === 'fixtures') {
      navigate('/');
    } else {
      navigate('/surpriz-analiz');
    }
  };

  useEffect(() => {
    console.log('matchData updated:', matchData);
  }, [matchData]);

  // Kaydetme fonksiyonu
  const handleSaveData = async () => {
    try {
      setIsSaving(true);
      await matchDB.saveMatches(matchData);
      toast.success('Veriler başarıyla kaydedildi!');
    } catch (error) {
      console.error('Veri kaydetme hatası:', error);
      toast.error('Veriler kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  // Yükleme fonksiyonu
  const handleLoadData = async () => {
    try {
      setIsLoading(true);
      
      // Önce GitHub'dan yeni verileri çek
      const data = await loadMatchData();
      
      // Verileri state'e ve IndexedDB'ye kaydet
      setMatchData(data);
      await matchDB.saveMatches(data);
      localStorage.setItem('patsiMatchDataVersion', MATCH_DATA_VERSION);
      
      toast.success('Veriler başarıyla güncellendi!');
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      
      // Hata durumunda IndexedDB'den yüklemeyi dene
      try {
        const savedMatches = await matchDB.getMatches();
        if (savedMatches && savedMatches.length > 0) {
          setMatchData(savedMatches);
          toast.warning('GitHub\'dan yüklenemedi, önbellek kullanıldı');
        } else {
          toast.error('Veriler yüklenemedi ve önbellek bulunamadı');
        }
      } catch (dbError) {
        toast.error('Veriler yüklenirken bir hata oluştu');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // DO NOT DELETE START - Main App Layout
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <LoadingOverlay isLoading={isLoading} progress={progress} />
      
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={24} className="text-yellow-400" />
            <h1 className="text-2xl font-bold">PATSI'S PREDICTIONS</h1>
          </div>
          
          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 transition-colors"
            >
              <Settings size={18} />
              <span>Ayarlar</span>
            </button>

            {/* Dropdown Menu */}
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-gray-800 dark:bg-gray-900 rounded-lg shadow-xl z-50 py-2">
                <div className="p-3 space-y-3">
                  <button
                    onClick={handleSaveData}
                    disabled={isSaving || matchData.length === 0}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${isSaving ? 'bg-blue-800/50 cursor-not-allowed' : 'bg-blue-700/50 hover:bg-blue-600'}`}
                  >
                    <Save size={18} />
                    {isSaving ? 'Kaydediliyor...' : 'Verileri Kaydet'}
                  </button>

                  <button
                    onClick={handleLoadData}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                      ${isLoading ? 'bg-blue-800/50 cursor-not-allowed' : 'bg-blue-700/50 hover:bg-blue-600'}`}
                  >
                    <RotateCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    {isLoading ? 'Yükleniyor...' : 'Verileri Yenile'}
                  </button>

                  <div className="pt-2 border-t border-gray-700">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleUEFAFileUpload}
                      className="w-full text-sm text-gray-300
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-700/50 file:text-white
                        hover:file:bg-blue-600
                        cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <button
                      onClick={toggleDarkMode}
                      className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700"
                    >
                      <span className="flex items-center gap-2">
                        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                        Tema
                      </span>
                      <span className="text-sm text-gray-400">
                        {isDarkMode ? 'Koyu' : 'Açık'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Navigation 
          activePage={activePage} 
          onPageChange={handlePageChange}
          onDataLoad={setMatchData}
          onTeamDataLoad={handleTeamDataLoad}
          onFixturesLoad={setFixtures}
          className="bg-white dark:bg-gray-800 shadow-lg rounded-lg"
        />
        
        <Routes>
          <Route path="/" element={
            <>
              <MatchCount count={matchData.length} />
              {fixtures.length > 0 && (
                <FixtureList 
                  fixtures={fixtures}
                  onSelectMatch={handleFixtureSelect}
                  selectedMatch={selectedMatch}
                  teamData={teamData}
                  matchData={matchData}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              )}
            </>
          } />
          
          <Route path="/surpriz-analiz" element={
            searchResults && selectedMatch && (
              <div className="space-y-6">
                <MatchHeader 
                  match={selectedMatch} 
                  teamData={teamData}
                  className="bg-white dark:bg-gray-800 shadow-lg rounded-lg" 
                />
                <Statistics 
                  data={searchResults} 
                  selectedMatch={selectedMatch}
                  allMatches={matchData}
                  teamData={teamData}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <SimilarMatches 
                  matches={searchResults.matches} 
                  selectedMatch={selectedMatch}
                  teamData={teamData}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )
          } />
          
          <Route path="/ozel-analiz" element={
            <SpecialAnalysis 
              matchData={matchData}
              teamData={teamData}
              selectedMatch={selectedMatch}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          } />
          
          <Route path="/match-schedule" element={
            <MatchSchedule
              matchData={matchData}
              teamData={teamData}
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          } />
          
          <Route path="/analysis/pattern/:patternData" element={<PatternDetail />} />
        </Routes>
      </main>
    </div>
    // DO NOT DELETE END - Main App Layout
  );
}
// DO NOT DELETE END - Main App Component
