import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Match } from '../../utils/types/match';
import { ScoreSearchForm } from './ScoreSearchForm';
import { ScoreMatchCard } from './ScoreMatchCard';
import { MatchDetailModal } from './MatchDetailModal';
import { ComparisonSearchModal } from './ComparisonSearchModal';

interface ScoreAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match[];
  selectedLeague: string;
}

type FilterType = 'ourTeam' | 'leagueTeams' | 'otherLeagues';

// getSeasonFromDate fonksiyonunu en üste taşıyalım
const getSeasonFromDate = (excelDate: number) => {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  const year = date.getFullYear();
  const month = date.getMonth();
  const seasonStartYear = month >= 7 ? year : year - 1;
  return `${seasonStartYear}-${seasonStartYear + 1}`;
};

interface SeasonSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  seasons: string[];
  currentSeason: string;
  onSelect: (season: string) => void;
  searchResults: Match[] | null;
  selectedTeam: string;
  selectedScore: [number, number] | null;
  activeFilter: FilterType;
  matchData: Match[];
  selectedLeague: string;
}

function SeasonSelector({ 
  isOpen, 
  onClose, 
  seasons, 
  currentSeason,
  onSelect,
  searchResults,
  selectedTeam,
  selectedScore,
  activeFilter,
  matchData,
  selectedLeague
}: SeasonSelectorProps) {
  // Her sezon için skor kontrolü yap
  const getSeasonHasMatches = (season: string): boolean => {
    if (!selectedTeam || !selectedScore) return false;
    
    const [homeScore, awayScore] = selectedScore;
    const seasonMatches = matchData.filter(match => 
      getSeasonFromDate(Number(match.Date)) === season
    );

    const scoreMatches = seasonMatches.filter(match => 
      (match.FTHG === homeScore && match.FTAG === awayScore) ||
      (match.FTHG === awayScore && match.FTAG === homeScore)
    );

    let filteredResults: Match[] = [];
    switch (activeFilter) {
      case 'ourTeam':
        filteredResults = scoreMatches.filter(match => 
          match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam
        );
        break;
      case 'leagueTeams':
        filteredResults = scoreMatches.filter(match => 
          match.Div === selectedLeague && 
          match.HomeTeam !== selectedTeam && 
          match.AwayTeam !== selectedTeam
        );
        break;
      case 'otherLeagues':
        filteredResults = scoreMatches.filter(match => 
          match.Div !== selectedLeague
        );
        break;
    }

    return filteredResults.length > 0;
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">
                Sezon Seçin
              </Dialog.Title>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {seasons.map(season => {
                const hasMatches = getSeasonHasMatches(season);
                return (
                  <button
                    key={season}
                    onClick={() => {
                      onSelect(season);
                      onClose();
                    }}
                    disabled={!hasMatches}
                    className={`p-3 rounded-lg text-center transition-colors
                      ${season === currentSeason ? 'ring-2 ring-emerald-500' : ''}
                      ${hasMatches 
                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}

export function ScoreAnalysisModal({ isOpen, onClose, matchData, selectedLeague }: ScoreAnalysisModalProps) {
  const [searchResults, setSearchResults] = useState<Match[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ourTeam');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedScore, setSelectedScore] = useState<[number, number] | null>(null);
  const [isSeasonSelectorOpen, setIsSeasonSelectorOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [comparisonMatch, setComparisonMatch] = useState<Match | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Mevcut sezonu bul
  const getCurrentSeason = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  const [currentSeason, setCurrentSeason] = useState(getCurrentSeason());

  // Mevcut maçlardan sezonları bul
  const availableSeasons = useMemo(() => {
    const seasons = new Set(
      matchData.map(match => getSeasonFromDate(Number(match.Date)))
    );
    return Array.from(seasons).sort().reverse();
  }, [matchData]);

  // Mevcut sezonun maçlarını memorize edelim
  const currentSeasonMatches = useMemo(() => {
    return matchData.filter(match => 
      getSeasonFromDate(Number(match.Date)) === currentSeason
    );
  }, [matchData, currentSeason]);

  // Sürpriz maç kontrolü için yardımcı fonksiyon - Komponentin içine taşıdık
  const isSurpriseMatch = useCallback((match: Match): boolean => {
    // İlk yarı sonucu
    const htr = match.HTHG > match.HTAG ? 'H' : match.HTHG < match.HTAG ? 'A' : 'D';
    // Maç sonu sonucu
    const ftr = match.FTHG > match.FTAG ? 'H' : match.FTHG < match.FTAG ? 'A' : 'D';

    // İlk yarı deplasman kazanıp maçı ev sahibi kazandıysa
    // VEYA ilk yarı ev sahibi kazanıp maçı deplasman kazandıysa
    return (htr === 'A' && ftr === 'H') || (htr === 'H' && ftr === 'A');
  }, []);

  // Sezon değiştirme fonksiyonları
  const handleNextSeason = () => {
    const currentIndex = availableSeasons.indexOf(currentSeason);
    if (currentIndex > 0) {
      setCurrentSeason(availableSeasons[currentIndex - 1]);
      if (selectedTeam && selectedScore) {
        handleSearch(selectedTeam, selectedScore);
      }
    }
  };

  const handlePrevSeason = () => {
    const currentIndex = availableSeasons.indexOf(currentSeason);
    if (currentIndex < availableSeasons.length - 1) {
      setCurrentSeason(availableSeasons[currentIndex + 1]);
      if (selectedTeam && selectedScore) {
        handleSearch(selectedTeam, selectedScore);
      }
    }
  };

  // Filtreleme fonksiyonunu optimize edelim
  const handleSearch = useCallback((team: string, score: [number, number]) => {
    setSelectedTeam(team);
    setSelectedScore(score);
    
    const [homeScore, awayScore] = score;
    
    // Önceden filtrelenmiş sezon maçlarını kullan
    const scoreMatches = currentSeasonMatches.filter(match => 
      (match.FTHG === homeScore && match.FTAG === awayScore) ||
      (match.FTHG === awayScore && match.FTAG === homeScore)
    );

    // Aktif filtreye göre sonuçları filtrele
    let filteredResults: Match[] = [];
    switch (activeFilter) {
      case 'ourTeam':
        filteredResults = scoreMatches.filter(match => 
          match.HomeTeam === team || match.AwayTeam === team
        );
        break;
      case 'leagueTeams':
        filteredResults = scoreMatches.filter(match => 
          match.Div === selectedLeague && 
          match.HomeTeam !== team && 
          match.AwayTeam !== team
        );
        break;
      case 'otherLeagues':
        filteredResults = scoreMatches.filter(match => 
          match.Div !== selectedLeague
        );
        break;
    }

    // Tarihe göre sırala (yeniden eskiye)
    const sortedResults = filteredResults.sort((a, b) => {
      const dateA = Number(a.Date);
      const dateB = Number(b.Date);
      return dateB - dateA; // Yeniden eskiye sıralama
    });

    setSearchResults(sortedResults);
  }, [currentSeasonMatches, activeFilter, selectedLeague]);

  // Filtre değişimini debounce edelim
  const handleFilterChange = useCallback(
    debounce((filter: FilterType) => {
      setSearchResults(null);
      setActiveFilter(filter);
      setCurrentPage(1);
      if (selectedTeam && selectedScore) {
        handleSearch(selectedTeam, selectedScore);
      }
    }, 300),
    [handleSearch, selectedTeam, selectedScore]
  );

  // Sayfalama için sonuçları böl
  const paginatedResults = useMemo(() => {
    if (!searchResults) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [searchResults, currentPage]);

  const totalPages = useMemo(() => {
    if (!searchResults) return 0;
    return Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  }, [searchResults]);

  const handleCompare = () => {
    setIsComparing(true);
  };

  return (
    <>
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-6xl rounded-lg bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium">
                Skor Analizi
              </Dialog.Title>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Filtre Butonları ve Sezon Seçimi */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('ourTeam')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'ourTeam'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Bizim Takım
                  </button>
                  <button
                    onClick={() => handleFilterChange('leagueTeams')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'leagueTeams'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Ligdeki Diğer Takımlar
                  </button>
                  <button
                    onClick={() => handleFilterChange('otherLeagues')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'otherLeagues'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Diğer Ligler
                  </button>
                </div>

                {/* Sezon Seçimi */}
                <button
                  onClick={() => setIsSeasonSelectorOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 
                    dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span className={`text-lg font-medium ${
                    searchResults?.length ? 'text-emerald-500' : ''
                  }`}>
                    {currentSeason}
                  </span>
                </button>

                <SeasonSelector 
                  isOpen={isSeasonSelectorOpen}
                  onClose={() => setIsSeasonSelectorOpen(false)}
                  seasons={availableSeasons}
                  currentSeason={currentSeason}
                  onSelect={(season) => {
                    setCurrentSeason(season);
                    if (selectedTeam && selectedScore) {
                      handleSearch(selectedTeam, selectedScore);
                    }
                  }}
                  searchResults={searchResults}
                  selectedTeam={selectedTeam}
                  selectedScore={selectedScore}
                  activeFilter={activeFilter}
                  matchData={matchData}
                  selectedLeague={selectedLeague}
                />
              </div>

              {/* Takım ve Skor Seçimi */}
              <ScoreSearchForm 
                onSearch={handleSearch} 
                matchData={matchData}
                selectedLeague={selectedLeague}
                onTeamSelect={(team) => {
                  setSelectedTeam(team);
                  // Takım seçildiğinde önceki sonuçları temizle
                  setSearchResults(null);
                }}
              />
              
              {/* Sonuçlar */}
              {searchResults && (
                <div className="mt-6">
                  <div className="space-y-4 min-h-[400px]">
                    {paginatedResults.length > 0 ? (
                      paginatedResults.map((match, index) => (
                        <ScoreMatchCard 
                          key={`${selectedLeague}-${match.HomeTeam}-${match.AwayTeam}-${match.Date}-${index}`}
                          match={match}
                          isSurprise={isSurpriseMatch(match)}
                          onClick={() => setSelectedMatch(match)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Bu kriterlere uygun maç bulunamadı
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-colors ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium">
                        Sayfa {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-colors ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Maç Detay Modalı */}
      {selectedMatch && (
        <MatchDetailModal
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
          match={selectedMatch}
          seasonMatches={currentSeasonMatches}
          position="left"
          onCompare={handleCompare}
          isComparing={isComparing}
        />
      )}

      {/* Karşılaştırma Modalı */}
      {isComparing && selectedMatch && selectedScore && (
        <ComparisonSearchModal
          isOpen={isComparing}
          onClose={() => setIsComparing(false)}
          onSelect={(match) => {
            setComparisonMatch(match);
            setIsComparing(false);
          }}
          matchData={matchData}
          selectedLeague={selectedLeague}
          initialScore={selectedScore}
        />
      )}

      {/* Karşılaştırılan Maç Detay Modalı */}
      {comparisonMatch && (
        <MatchDetailModal
          isOpen={!!comparisonMatch}
          onClose={() => {
            setComparisonMatch(null);
            setIsComparing(false);
          }}
          match={comparisonMatch}
          seasonMatches={currentSeasonMatches}
          position="right"
          isComparing={true}
        />
      )}
    </>
  );
}

// Debounce yardımcı fonksiyonu
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 