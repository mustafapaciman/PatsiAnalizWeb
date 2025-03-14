import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2, ArrowLeft, Camera } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';
import html2canvas from 'html2canvas';

interface WeekAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface TeamMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    isSurprise: boolean;
    matchNumber: number;
}

interface SurpriseMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    matchNumber: number;
    season: string;
}

interface HistoricalSurprise {
    team: string;
    season: string;
    date: string;
    isHome: boolean;
    opponent: string;
    htScore: string;
    ftScore: string;
}

interface WeekGroup {
    weekNumber: number;
    matches: SurpriseMatch[];
    historicalMatches?: HistoricalSurprise[];
}

// Yardımcı fonksiyonlar
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const analyzeWeeks = (matchData: any[], league: string, currentSeason: string): WeekGroup[] => {
    // Sezon maçlarını filtrele
    const seasonMatches = matchData.filter(m => 
        m.Div === league && 
        getSeasonFromDate(Number(m.Date)) === currentSeason
    ).sort((a, b) => Number(a.Date) - Number(b.Date));

    // Tüm sezonların maçlarını grupla
    const allSeasonMatches = matchData.filter(m => m.Div === league)
        .reduce((acc, match) => {
            const season = getSeasonFromDate(Number(match.Date));
            if (!acc[season]) acc[season] = [];
            acc[season].push(match);
            return acc;
        }, {} as { [key: string]: any[] });

    // Takım bazlı maç sayılarını takip et
    const teamMatchCounts: { [key: string]: number } = {};
    const surprisesByWeek: { [key: number]: SurpriseMatch[] } = {};
    const historicalSurprises: { [key: number]: HistoricalSurprise[] } = {};

    // Önce mevcut sezon sürprizlerini bul
    seasonMatches.forEach(match => {
        const homeTeam = match.HomeTeam;
        const awayTeam = match.AwayTeam;

        teamMatchCounts[homeTeam] = (teamMatchCounts[homeTeam] || 0) + 1;
        teamMatchCounts[awayTeam] = (teamMatchCounts[awayTeam] || 0) + 1;

        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                          (match.HTR === 'A' && match.FTR === 'H');

        if (isSurprise) {
            const weekNumber = teamMatchCounts[homeTeam];
            if (!surprisesByWeek[weekNumber]) {
                surprisesByWeek[weekNumber] = [];
            }

            surprisesByWeek[weekNumber].push({
                date: formatDate(Number(match.Date)),
                homeTeam: match.HomeTeam,
                awayTeam: match.AwayTeam,
                htScore: `${match.HTHG}-${match.HTAG}`,
                ftScore: `${match.FTHG}-${match.FTAG}`,
                matchNumber: weekNumber,
                season: currentSeason
            });
        }
    });

    // Diğer sezonlardaki aynı hafta sürprizlerini bul
    Object.entries(allSeasonMatches).forEach(([season, matches]) => {
        if (season === currentSeason) return;

        const seasonTeamCounts: { [key: string]: number } = {};
        matches.sort((a, b) => Number(a.Date) - Number(b.Date))
              .forEach(match => {
                  const homeTeam = match.HomeTeam;
                  const awayTeam = match.AwayTeam;

                  seasonTeamCounts[homeTeam] = (seasonTeamCounts[homeTeam] || 0) + 1;
                  seasonTeamCounts[awayTeam] = (seasonTeamCounts[awayTeam] || 0) + 1;

                  const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                   (match.HTR === 'A' && match.FTR === 'H');

                  if (isSurprise) {
                      const weekNumber = seasonTeamCounts[homeTeam];
                      if (!historicalSurprises[weekNumber]) {
                          historicalSurprises[weekNumber] = [];
                      }

                      historicalSurprises[weekNumber].push({
                          team: match.HomeTeam,
                          season,
                          date: formatDate(Number(match.Date)),
                          isHome: true,
                          opponent: match.AwayTeam,
                          htScore: `${match.HTHG}-${match.HTAG}`,
                          ftScore: `${match.FTHG}-${match.FTAG}`
                      });
                  }
              });
    });

    // Tüm maç sayılarını bulmak için set oluştur
    const allWeekNumbers = new Set<number>();
    
    // Mevcut sezon sürprizlerinin maç sayılarını ekle
    Object.keys(surprisesByWeek).forEach(week => {
        allWeekNumbers.add(Number(week));
    });

    // Diğer sezonlardaki sürprizlerin maç sayılarını ekle
    Object.keys(historicalSurprises).forEach(week => {
        allWeekNumbers.add(Number(week));
    });

    // Tüm maç sayılarını içeren WeekGroup dizisi oluştur
    return Array.from(allWeekNumbers)
        .sort((a, b) => a - b)
        .map(weekNumber => ({
            weekNumber,
            matches: surprisesByWeek[weekNumber] || [],
            historicalMatches: historicalSurprises[weekNumber] || []
        }));
};

export const WeekAnalysis: React.FC<WeekAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const resultsRef = useRef<HTMLDivElement>(null);
    const [results, setResults] = useState<WeekGroup[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showAllWeeks, setShowAllWeeks] = useState(false);
    
    // Yeni state'ler
    const [showCalculator, setShowCalculator] = useState(false);
    const [selectedTeamX, setSelectedTeamX] = useState('');
    const [selectedTeamY, setSelectedTeamY] = useState('');
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [calculatedMatches, setCalculatedMatches] = useState<TeamMatch[]>([]);

    // Takım listesini al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData.filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
                .forEach(m => {
                    teamSet.add(m.HomeTeam);
                    teamSet.add(m.AwayTeam);
                });
        return Array.from(teamSet).sort();
    }, [matchData, league, season]);

    // Maç sayısı hesaplama fonksiyonu
    const calculateMatchesForWeek = (teamX: string, teamY: string, weekNumber: number) => {
        console.log("Hesaplama başlıyor:", { teamX, teamY, weekNumber });
        
        const matches: TeamMatch[] = [];
        const teamCounts: { [key: string]: number } = {};

        // X ve Y arasındaki maçları bul
        const headToHeadMatches = matchData
            .filter(m => 
                m.Div === league && 
                getSeasonFromDate(Number(m.Date)) === season &&
                ((m.HomeTeam === teamX && m.AwayTeam === teamY) ||
                 (m.HomeTeam === teamY && m.AwayTeam === teamX))
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        console.log("X ve Y arasındaki tüm maçlar:", headToHeadMatches.map(m => ({
            date: formatDate(Number(m.Date)),
            match: `${m.HomeTeam} vs ${m.AwayTeam}`,
            score: `${m.HTHG}-${m.HTAG} → ${m.FTHG}-${m.FTAG}`
        })));

        // Her takımın maç sayısını hesapla
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .sort((a, b) => Number(a.Date) - Number(b.Date))
            .forEach(match => {
                // X takımının maç sayısını hesapla
                if (match.HomeTeam === teamX || match.AwayTeam === teamX) {
                    teamCounts[teamX] = (teamCounts[teamX] || 0) + 1;
                    console.log(`${teamX} maç sayısı: ${teamCounts[teamX]}`);
                }
                // Y takımının maç sayısını hesapla
                if (match.HomeTeam === teamY || match.AwayTeam === teamY) {
                    teamCounts[teamY] = (teamCounts[teamY] || 0) + 1;
                    console.log(`${teamY} maç sayısı: ${teamCounts[teamY]}`);
                }

                // X ve Y arasındaki maçları kontrol et
                if ((match.HomeTeam === teamX && match.AwayTeam === teamY) ||
                    (match.HomeTeam === teamY && match.AwayTeam === teamX)) {
                    const xCount = teamCounts[teamX] || 0;
                    const yCount = teamCounts[teamY] || 0;

                    console.log("Karşılaşma bulundu:", {
                        date: formatDate(Number(match.Date)),
                        match: `${match.HomeTeam} vs ${match.AwayTeam}`,
                        score: `${match.HTHG}-${match.HTAG} → ${match.FTHG}-${match.FTAG}`,
                        xCount,
                        yCount,
                        targetWeek: weekNumber
                    });

                    // Eğer her iki takım da istenen maç sayısına ulaştıysa
                    if (xCount === weekNumber || yCount === weekNumber) {
                        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                         (match.HTR === 'A' && match.FTR === 'H');

                        console.log("Maç ekleniyor:", {
                            date: formatDate(Number(match.Date)),
                            match: `${match.HomeTeam} vs ${match.AwayTeam}`,
                            score: `${match.HTHG}-${match.HTAG} → ${match.FTHG}-${match.FTAG}`,
                            isSurprise
                        });

                        matches.push({
                            date: formatDate(Number(match.Date)),
                            homeTeam: match.HomeTeam,
                            awayTeam: match.AwayTeam,
                            htScore: `${match.HTHG}-${match.HTAG}`,
                            ftScore: `${match.FTHG}-${match.FTAG}`,
                            isSurprise,
                            matchNumber: weekNumber
                        });
                    }
                }
            });

        console.log("Hesaplama tamamlandı. Bulunan maçlar:", matches);
        return matches;
    };

    // Ekran görüntüsü alma fonksiyonu
    const captureScreen = async () => {
        if (!resultsRef.current) return;
        
        setIsCapturing(true);
        try {
            // Geçici olarak scroll'u kaldır ve tüm içeriği göster
            if (resultsRef.current) {
                resultsRef.current.style.height = 'auto';
                resultsRef.current.style.overflow = 'visible';
            }

            const canvas = await html2canvas(resultsRef.current, {
                backgroundColor: '#111827',
                scale: 2,
                windowWidth: resultsRef.current.scrollWidth,
                windowHeight: resultsRef.current.scrollHeight,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-results-container]');
                    if (clonedElement) {
                        (clonedElement as HTMLElement).style.height = 'auto';
                        (clonedElement as HTMLElement).style.overflow = 'visible';
                    }
                }
            });

            // Orijinal scroll durumunu geri yükle
            if (resultsRef.current) {
                resultsRef.current.style.height = 'calc(100vh - 8rem)';
                resultsRef.current.style.overflow = 'hidden';
            }

            // Canvas'ı PNG olarak kaydet
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `${season}-hafta-analizi.png`;
            link.click();
        } catch (error) {
            console.error('Ekran görüntüsü alınamadı:', error);
        }
        setIsCapturing(false);
    };

    useEffect(() => {
        const analyze = async () => {
            console.log("Starting week analysis...");
            const analysisResults = analyzeWeeks(matchData, league, season);
            console.log("Analysis results:", analysisResults);
            setResults(analysisResults);
            setIsAnalyzing(false);
        };

        analyze();
    }, [matchData, league, season]);

    if (isAnalyzing) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col" ref={resultsRef}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="flex items-center text-purple-500 hover:text-purple-400"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Geri Dön
                    </button>
                    <button
                        onClick={captureScreen}
                        disabled={isCapturing}
                        className="flex items-center px-4 py-2 rounded-lg 
                                 bg-purple-500 hover:bg-purple-600 
                                 text-white transition-colors"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Ekran Görüntüsü Al
                    </button>
                    <button
                        onClick={() => setShowAllWeeks(!showAllWeeks)}
                        className={`px-4 py-2 rounded-lg transition-colors
                                  ${showAllWeeks ? 'bg-blue-500 hover:bg-blue-600' 
                                               : 'bg-gray-600 hover:bg-gray-700'} 
                                  text-white`}
                    >
                        {showAllWeeks ? 'Sadece Bu Sezon' : 'Tüm Sezonlar'}
                    </button>
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className={`px-4 py-2 rounded-lg transition-colors
                                  ${showCalculator ? 'bg-orange-500 hover:bg-orange-600' 
                                                 : 'bg-gray-600 hover:bg-gray-700'} 
                                  text-white`}
                    >
                        Hesaplama
                    </button>
                </div>
                <div className="text-lg font-semibold text-white">
                    {season} Sezonu Hafta Analizi
                </div>
            </div>

            {/* Hesaplama Paneli */}
            {showCalculator && (
                <div className="mb-6 bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-6">
                        <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-2 block">X Takımı</label>
                            <select 
                                value={selectedTeamX}
                                onChange={(e) => setSelectedTeamX(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg p-2"
                            >
                                <option value="">Takım Seçin</option>
                                {teams.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-2 block">Y Takımı</label>
                            <select 
                                value={selectedTeamY}
                                onChange={(e) => setSelectedTeamY(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg p-2"
                            >
                                <option value="">Takım Seçin</option>
                                {teams.filter(t => t !== selectedTeamX).map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-gray-400 mb-2 block">Maç Sayısı</label>
                            <input 
                                type="number"
                                value={selectedWeek || ''}
                                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                className="w-full bg-gray-700 text-white rounded-lg p-2"
                                min="1"
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (selectedTeamX && selectedTeamY && selectedWeek) {
                                    const matches = calculateMatchesForWeek(
                                        selectedTeamX, 
                                        selectedTeamY, 
                                        selectedWeek
                                    );
                                    setCalculatedMatches(matches);
                                }
                            }}
                            disabled={!selectedTeamX || !selectedTeamY || !selectedWeek}
                            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 
                                     text-white rounded-lg transition-colors 
                                     disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            Hesapla
                        </button>
                    </div>
                </div>
            )}

            {/* Sonuçlar */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" data-results-container>
                {showCalculator && calculatedMatches.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {selectedWeek}. Maç Sonuçları
                        </h3>
                        {calculatedMatches.map((match, idx) => (
                            <div 
                                key={idx} 
                                className={`rounded-lg p-4 ${
                                    match.isSurprise ? 'bg-orange-900/20' : 'bg-gray-800/30'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <TeamLogo name={match.homeTeam} className="w-8 h-8" />
                                        <span className="text-white">{match.homeTeam}</span>
                                        <span className="text-gray-400">vs</span>
                                        <TeamLogo name={match.awayTeam} className="w-8 h-8" />
                                        <span className="text-white">{match.awayTeam}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400">{match.date}</div>
                                        <div className="text-white">
                                            <span className="text-sm text-gray-400">HT: </span>
                                            {match.htScore}
                                            <span className="text-sm text-gray-400 ml-2">FT: </span>
                                            {match.ftScore}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 pb-6">
                        {results.map((group) => (
                            <div key={group.weekNumber} 
                                 className={`rounded-xl p-4 ${
                                     group.matches.length > 0 
                                         ? 'bg-gray-800/30' 
                                         : showAllWeeks && group.historicalMatches.length > 0 
                                             ? 'bg-gray-800/10' 
                                             : 'hidden'
                                 }`}
                            >
                                <h3 className={`text-lg font-semibold mb-3 ${
                                    group.matches.length > 0 ? 'text-white' : 'text-gray-400'
                                }`}>
                                    {group.weekNumber}. Maç Sayısı Haftası
                                    {group.matches.length === 0 && (
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            (Bu sezonda sürpriz yok)
                                        </span>
                                    )}
                                </h3>

                                <div className="space-y-3">
                                    {/* Mevcut sezon maçları */}
                                    {group.matches.map((match, idx) => (
                                        <div key={idx} className="bg-gray-700/30 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-2">
                                                            <TeamLogo name={match.homeTeam} className="w-6 h-6" />
                                                            <span className={`text-sm ${
                                                                group.historicalMatches?.some(h => 
                                                                    h.team === match.homeTeam
                                                                ) ? 'text-orange-400' : 'text-white'
                                                            }`}>
                                                                {match.homeTeam}
                                                            </span>
                                                        </div>
                                                        {group.historicalMatches?.some(h => h.team === match.homeTeam) && (
                                                            <span className="text-xs text-orange-400/70 mt-1">
                                                                {group.historicalMatches
                                                                    .filter(h => h.team === match.homeTeam)
                                                                    .map(h => h.season)
                                                                    .join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-gray-400 text-sm">vs</span>
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-2">
                                                            <TeamLogo name={match.awayTeam} className="w-6 h-6" />
                                                            <span className={`text-sm ${
                                                                group.historicalMatches?.some(h => 
                                                                    h.team === match.awayTeam
                                                                ) ? 'text-orange-400' : 'text-white'
                                                            }`}>
                                                                {match.awayTeam}
                                                            </span>
                                                        </div>
                                                        {group.historicalMatches?.some(h => h.team === match.awayTeam) && (
                                                            <span className="text-xs text-orange-400/70 mt-1">
                                                                {group.historicalMatches
                                                                    .filter(h => h.team === match.awayTeam)
                                                                    .map(h => h.season)
                                                                    .join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400">{match.date}</div>
                                                    <div className="text-sm text-white">
                                                        <span className="text-xs text-gray-400">HT: </span>
                                                        {match.htScore}
                                                        <span className="text-xs text-gray-400 ml-2">FT: </span>
                                                        {match.ftScore}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Diğer sezonlardaki maçlar */}
                                    {showAllWeeks && group.historicalMatches.length > 0 && (
                                        <div className={`${group.matches.length > 0 ? 'mt-4 pt-4 border-t border-gray-700' : ''}`}>
                                            <h4 className="text-sm font-medium text-blue-400 mb-3">
                                                {group.matches.length === 0 ? 'Diğer Sezonlardaki Sürprizler' : 'Aynı Haftadaki Geçmiş Sürprizler'}
                                            </h4>
                                            <div className="space-y-2">
                                                {group.historicalMatches.map((match, idx) => (
                                                    <div key={idx} className="bg-blue-900/20 rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <TeamLogo name={match.team} className="w-5 h-5" />
                                                                <span className="text-sm text-blue-300">
                                                                    {match.team}
                                                                </span>
                                                                <span className="text-xs text-blue-400">vs</span>
                                                                <TeamLogo name={match.opponent} className="w-5 h-5" />
                                                                <span className="text-sm text-blue-300">
                                                                    {match.opponent}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-blue-400/70">
                                                                    {match.season}
                                                                </div>
                                                                <div className="text-sm text-blue-300">
                                                                    <span className="text-xs text-blue-400">HT: </span>
                                                                    {match.htScore}
                                                                    <span className="text-xs text-blue-400 ml-2">FT: </span>
                                                                    {match.ftScore}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}; 