import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2, X } from 'lucide-react';

interface StartWeekPartnershipAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    team: string;
    season: string;
    firstMatch: {
        date: string;
        score: string;
        isHome: boolean;
    };
    surpriseMatch: {
        matchNumber: number;
        opponent: string;
        date: string;
        htScore: string;
        ftScore: string;
        isHome: boolean;
    };
}

// Takım Seçme Modalı
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
}> = ({ isOpen, onClose, teams, onSelect }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Takım Seçin</h2>
                <div className="grid grid-cols-4 gap-4">
                    {teams.map(team => (
                        <button
                            key={team}
                            onClick={() => onSelect(team)}
                            className="flex flex-col items-center p-4 rounded-xl 
                                     bg-gray-800/50 hover:bg-gray-800/70 transition-all
                                     hover:scale-105 hover:shadow-lg"
                        >
                            <TeamLogo name={team} className="w-16 h-16 mb-2" />
                            <span className="text-sm text-gray-300">{team}</span>
                        </button>
                    ))}
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// TeamInfoModal bileşenini düzeltelim
const TeamInfoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    team: string;
    season: string;
    matchData: any[];
}> = ({ isOpen, onClose, team, season, matchData }) => {
    // Takımın o sezondaki sürpriz maçlarını bul
    const surpriseMatches = useMemo(() => {
        return matchData
            .filter(m => {
                // Aynı sezon kontrolü
                if (getSeasonFromDate(Number(m.Date)) !== season) return false;
                
                // Takımın maçı mı kontrolü
                if (m.HomeTeam !== team && m.AwayTeam !== team) return false;
                
                // Sürpriz maç kontrolü
                const isHome = m.HomeTeam === team;
                const htHome = Number(m.HTHG);
                const htAway = Number(m.HTAG);
                const ftHome = Number(m.FTHG);
                const ftAway = Number(m.FTAG);
                
                if (isHome) {
                    return (htHome > htAway && ftHome < ftAway) || 
                           (htHome < htAway && ftHome > ftAway);
                } else {
                    return (htHome < htAway && ftHome > ftAway) || 
                           (htHome > htAway && ftHome < ftAway);
                }
            })
            .sort((a, b) => Number(a.Date) - Number(b.Date))
            .map(m => ({
                date: formatDate(Number(m.Date)),
                opponent: m.HomeTeam === team ? m.AwayTeam : m.HomeTeam,
                isHome: m.HomeTeam === team,
                htScore: `${m.HTHG}-${m.HTAG}`,
                ftScore: `${m.FTHG}-${m.FTAG}`
            }));
    }, [team, season, matchData]);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl bg-gray-900 rounded-xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <TeamLogo name={team} className="w-10 h-10" />
                                <h2 className="text-xl font-semibold text-white">
                                    {team} - {season} Sezonu Sürprizleri
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                            {surpriseMatches.length > 0 ? (
                                <div className="space-y-4">
                                    {surpriseMatches.map((match, idx) => (
                                        <div key={idx} className="p-4 bg-gray-800/50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-400">{match.date}</span>
                                                <span className="text-sm px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                                    {match.isHome ? 'Ev Sahibi' : 'Deplasman'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <TeamLogo name={match.opponent} className="w-6 h-6" />
                                                <span className="text-white">{match.opponent}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="p-2 bg-gray-900/50 rounded">
                                                    <span className="text-gray-400">Devre Arası: </span>
                                                    <span className="text-white">{match.htScore}</span>
                                                </div>
                                                <div className="p-2 bg-gray-900/50 rounded">
                                                    <span className="text-gray-400">Maç Sonu: </span>
                                                    <span className="text-white">{match.ftScore}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-400 py-8">
                                    Bu sezonda sürpriz maç bulunamadı
                                </div>
                            )}
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
    matchData: any[];
}> = ({ selectedTeam, results, onBack, isAnalyzing, matchData }) => {
    const [selectedInfo, setSelectedInfo] = useState<{team: string; season: string} | null>(null);
    const [showAllResults, setShowAllResults] = useState(false);

    // Sonuçları maç numarasına göre grupla
    const groupedResults = results.reduce((groups, result) => {
        const matchNumber = result.surpriseMatch.matchNumber;
        if (!groups[matchNumber]) {
            groups[matchNumber] = [];
        }
        groups[matchNumber].push(result);
        return groups;
    }, {} as Record<number, AnalysisResult[]>);

    // Grupları maç numarasına göre sırala ve filtreleme yap
    const sortedGroups = Object.entries(groupedResults)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        // showAllResults true ise tüm grupları göster, false ise sadece 2 ve üzeri olanları göster
        .filter(([_, group]) => showAllResults || group.length >= 2);

    return (
        <div className="h-screen flex flex-col">
            {/* Header - sabit kalacak */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
                          rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                
                <button 
                    onClick={onBack}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-black/20 
                             hover:bg-black/30 transition-colors text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 mt-6">
                    <div className="relative">
                        <TeamLogo name={selectedTeam} 
                                 className="w-24 h-24 transform hover:scale-105 transition-transform" />
                    </div>
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-white">{selectedTeam}</h2>
                        <p className="text-blue-200 mt-1">Başlangıç-Hafta Ortaklığı Analizi</p>
                    </div>
                </div>
            </div>

            {/* Sonuçlar - scrollable alan */}
            <div className="flex-1 overflow-auto mt-8 px-2">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Analiz yapılıyor...</p>
                    </div>
                ) : (
                    <div className="space-y-6 pb-8">
                        {/* Toggle Butonu - her zaman göster */}
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowAllResults(!showAllResults)}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 
                                         transition-colors text-white text-sm flex items-center gap-2"
                            >
                                {showAllResults ? (
                                    <>
                                        <span>Sadece Ortak Maçları Göster</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Tüm Maç Sayılarını Göster</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* TeamInfoModal'ı ekleyelim */}
                        {selectedInfo && (
                            <TeamInfoModal
                                isOpen={!!selectedInfo}
                                onClose={() => setSelectedInfo(null)}
                                team={selectedInfo.team}
                                season={selectedInfo.season}
                                matchData={matchData}
                            />
                        )}

                        {/* Sonuç Kartları */}
                        {sortedGroups.length > 0 ? (
                            sortedGroups.map(([matchNumber, groupResults]) => (
                                <div key={matchNumber} 
                                     className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                              border border-gray-700/30 hover:border-blue-500/30 
                                              transition-all duration-300 p-6
                                              ${groupResults.length < 2 ? 'opacity-70' : ''}`}>
                                    <h3 className="text-xl font-bold text-blue-400 mb-4">
                                        {matchNumber}. Maç Günü Sürprizleri
                                        <span className="text-sm font-normal text-gray-400 ml-2">
                                            ({groupResults.length} takım)
                                        </span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {groupResults.map((result, idx) => (
                                            <div key={idx} className="bg-black/20 rounded-lg p-4">
                                                <div 
                                                    onClick={() => setSelectedInfo({
                                                        team: result.team,
                                                        season: result.season
                                                    })}
                                                    className="flex items-center gap-2 cursor-pointer 
                                                             hover:bg-gray-800/50 p-2 rounded-lg transition-colors"
                                                >
                                                    <TeamLogo name={result.team} className="w-8 h-8" />
                                                    <div>
                                                        <div className="font-medium text-white">{result.team}</div>
                                                        <div className="text-sm text-gray-400">{result.season}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="text-gray-400">
                                                        <span className="text-blue-400">İlk Maç:</span> {result.firstMatch.date}
                                                        {result.firstMatch.isHome ? ' (E) ' : ' (D) '}
                                                        {result.firstMatch.score}
                                                    </div>
                                                    <div className="text-gray-400">
                                                        <span className="text-green-400">Sürpriz Maç:</span> {result.surpriseMatch.date}
                                                        {result.surpriseMatch.isHome ? ' (E) ' : ' (D) '}
                                                        vs {result.surpriseMatch.opponent}
                                                        <div className="mt-1">
                                                            <span className="text-yellow-500">İY: {result.surpriseMatch.htScore}</span>
                                                            {' → '}
                                                            <span className="text-green-500">MS: {result.surpriseMatch.ftScore}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : showAllResults ? (
                            <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                <p className="text-gray-400">Hiç sürpriz maç bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                <p className="text-gray-400">
                                    Ortak maç sayısı bulunamadı. 
                                    <br />
                                    Tüm maç sayılarını görmek için yukarıdaki butonu kullanabilirsiniz.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Analiz fonksiyonu
const analyzeStartWeekPartnership = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): AnalysisResult[] => {
    const results: AnalysisResult[] = [];
    
    console.log('Analiz başlıyor:', {
        selectedTeam,
        league,
        season,
        totalMatches: matchData.length
    });

    // Tüm sezonları bul
    const allSeasons = new Set(matchData
        .filter(m => m.Div === league)
        .map(m => getSeasonFromDate(Number(m.Date)))
    );

    // Her sezon için X takımlarını kontrol et
    allSeasons.forEach(checkingSeason => {
        console.log(`\n${checkingSeason} sezonu analiz ediliyor...`);
        
        // O sezondaki tüm takımları bul (X takımları)
        const seasonTeams = new Set(matchData
            .filter(m => 
                m.Div === league && 
                getSeasonFromDate(Number(m.Date)) === checkingSeason
            )
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
        );

        // Her X takımı için kontrol et
        seasonTeams.forEach(team => {
            if (team === selectedTeam) return; // Y takımını atla

            // X takımının ilk maçını bul
            const firstMatch = matchData
                .filter(m => 
                    m.Div === league && 
                    getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                    (m.HomeTeam === team || m.AwayTeam === team)
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date))[0];

            if (!firstMatch) return;

            // İlk maç Y takımı ile mi?
            if (firstMatch.HomeTeam !== selectedTeam && firstMatch.AwayTeam !== selectedTeam) {
                return;
            }

            // X takımının tüm maçlarını sırala
            const teamMatches = matchData
                .filter(m => 
                    m.Div === league && 
                    getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                    (m.HomeTeam === team || m.AwayTeam === team)
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date));

            // X takımının sürpriz maçlarını bul
            const surpriseMatches = teamMatches.filter(m => 
                (m.HTR === 'H' && m.FTR === 'A') || 
                (m.HTR === 'A' && m.FTR === 'H')
            );

            // Her sürpriz maç için
            surpriseMatches.forEach(surpriseMatch => {
                const matchNumber = teamMatches.findIndex(m => m === surpriseMatch) + 1;

                // Sonuçlara ekle
                results.push({
                    team,
                    season: checkingSeason,
                    firstMatch: {
                        date: formatDate(Number(firstMatch.Date)),
                        score: `${firstMatch.FTHG}-${firstMatch.FTAG}`,
                        isHome: firstMatch.HomeTeam === team
                    },
                    surpriseMatch: {
                        matchNumber,
                        opponent: surpriseMatch.HomeTeam === team 
                            ? surpriseMatch.AwayTeam 
                            : surpriseMatch.HomeTeam,
                        date: formatDate(Number(surpriseMatch.Date)),
                        htScore: `${surpriseMatch.HTHG}-${surpriseMatch.HTAG}`,
                        ftScore: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`,
                        isHome: surpriseMatch.HomeTeam === team
                    }
                });
            });
        });
    });

    // Maç numaralarına göre grupla ve filtreleme yapmadan direkt sonuçları döndür
    console.log('\nAnaliz tamamlandı:', {
        toplamSonuç: results.length
    });

    return results; // Tüm sonuçları döndür, filtreleme yapma
};

// Yardımcı fonksiyonlar
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Ana komponent
export const StartWeekPartnershipAnalysis: React.FC<StartWeekPartnershipAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Ligin tüm takımlarını al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .forEach(m => {
                teamSet.add(m.HomeTeam);
                teamSet.add(m.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league, season]);

    const handleTeamSelect = async (team: string) => {
        setSelectedTeam(team);
        setShowTeamSelection(false);
        setIsAnalyzing(true);
        
        setTimeout(() => {
            const analysisResults = analyzeStartWeekPartnership(team, league, season, matchData);
            setResults(analysisResults);
            setIsAnalyzing(false);
        }, 100);
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setResults([]);
        setShowTeamSelection(true);
    };

    return (
        <>
            <TeamSelectionModal
                isOpen={showTeamSelection}
                onClose={onClose}
                teams={teams}
                onSelect={handleTeamSelect}
            />

            {!showTeamSelection && selectedTeam && (
                <div className="p-6">
                    <ResultsDisplay
                        selectedTeam={selectedTeam}
                        results={results}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                        matchData={matchData}
                    />
                </div>
            )}
        </>
    );
}; 