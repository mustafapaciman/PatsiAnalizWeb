import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';
import { LEAGUE_INFO } from './FormulaSearchModal';

interface BermudaTriangleV2Props {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    season: string;
    commonOpponent?: string;
    xMatch?: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
    };
    yMatch?: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
    };
    directMatch?: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
    };
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

// Takım Seçme Modalı
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
    selectedTeams: string[];
    title: string;
}> = ({ isOpen, onClose, teams, onSelect, selectedTeams, title }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <Dialog.Title className="text-xl font-semibold text-white">
                        {title}
                    </Dialog.Title>
                    <span className="text-sm text-gray-400">
                        {selectedTeams.length === 0 ? "X Takımını Seçin" : "Y Takımını Seçin"}
                    </span>
                </div>

                {/* Scroll container */}
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-4 gap-4">
                        {teams
                            .filter(team => !selectedTeams.includes(team))
                            .map((team, index) => (
                                <button
                                    key={`${team}-${index}`}
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
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Analiz fonksiyonu
const analyzeBermudaV2 = (teamX: string, teamY: string, matchData: any[]): AnalysisResult[] => {
    console.log("Analiz başlıyor:", { teamX, teamY });
    const results: AnalysisResult[] = [];
    
    // Sürpriz maç kontrolü
    const isSurpriseMatch = (match: any): boolean => {
        const htResult = match.HTHG > match.HTAG ? 'H' : match.HTHG < match.HTAG ? 'A' : 'D';
        const ftResult = match.FTHG > match.FTAG ? 'H' : match.FTHG < match.FTAG ? 'A' : 'D';
        return (htResult === 'H' && ftResult === 'A') || (htResult === 'A' && ftResult === 'H');
    };

    // Sezon bazında grupla
    const seasonMatches = matchData.reduce((acc, match) => {
        const season = getSeasonFromDate(Number(match.Date));
        if (!acc[season]) acc[season] = [];
        acc[season].push(match);
        return acc;
    }, {} as { [key: string]: any[] });

    // Her sezon için analiz yap
    Object.entries(seasonMatches).forEach(([season, matches]) => {
        if (season === 'NaN-NaN') return; // Geçersiz sezonları atla

        console.log(`\n${season} sezonu analizi başlıyor...`);

        // X ve Y arasındaki sürpriz maçları bul
        const directSurprises = matches.filter(m => 
            ((m.HomeTeam === teamX && m.AwayTeam === teamY) ||
             (m.HomeTeam === teamY && m.AwayTeam === teamX)) &&
            isSurpriseMatch(m)
        );

        // X'in sürpriz maçları
        const xSurprises = matches.filter(m => 
            (m.HomeTeam === teamX || m.AwayTeam === teamX) && 
            m.HomeTeam !== teamY && m.AwayTeam !== teamY && // Y ile olan maçları hariç tut
            isSurpriseMatch(m)
        );

        // Y'nin sürpriz maçları
        const ySurprises = matches.filter(m => 
            (m.HomeTeam === teamY || m.AwayTeam === teamY) && 
            m.HomeTeam !== teamX && m.AwayTeam !== teamX && // X ile olan maçları hariç tut
            isSurpriseMatch(m)
        );

        // Ortak rakipleri bul
        const xOpponents = xSurprises.map(m => m.HomeTeam === teamX ? m.AwayTeam : m.HomeTeam);
        const yOpponents = ySurprises.map(m => m.HomeTeam === teamY ? m.AwayTeam : m.HomeTeam);
        
        const commonOpponents = xOpponents.filter(op => yOpponents.includes(op));
        console.log("Ortak rakipler:", commonOpponents);

        // Direkt sürpriz maç varsa ekle
        if (directSurprises.length > 0) {
            const result: AnalysisResult = {
                season,
                directMatch: {
                    date: formatDate(Number(directSurprises[0].Date)),
                    homeTeam: directSurprises[0].HomeTeam,
                    awayTeam: directSurprises[0].AwayTeam,
                    htScore: `${directSurprises[0].HTHG}-${directSurprises[0].HTAG}`,
                    ftScore: `${directSurprises[0].FTHG}-${directSurprises[0].FTAG}`
                }
            };

            // Eğer ortak rakip varsa onu da ekle
            if (commonOpponents.length > 0) {
                const commonOpponent = commonOpponents[0];
                result.commonOpponent = commonOpponent;

                const xMatch = xSurprises.find(m => 
                    m.HomeTeam === commonOpponent || m.AwayTeam === commonOpponent
                );
                const yMatch = ySurprises.find(m => 
                    m.HomeTeam === commonOpponent || m.AwayTeam === commonOpponent
                );

                if (xMatch) {
                    result.xMatch = {
                        date: formatDate(Number(xMatch.Date)),
                        homeTeam: xMatch.HomeTeam,
                        awayTeam: xMatch.AwayTeam,
                        htScore: `${xMatch.HTHG}-${xMatch.HTAG}`,
                        ftScore: `${xMatch.FTHG}-${xMatch.FTAG}`
                    };
                }

                if (yMatch) {
                    result.yMatch = {
                        date: formatDate(Number(yMatch.Date)),
                        homeTeam: yMatch.HomeTeam,
                        awayTeam: yMatch.AwayTeam,
                        htScore: `${yMatch.HTHG}-${yMatch.HTAG}`,
                        ftScore: `${yMatch.FTHG}-${yMatch.FTAG}`
                    };
                }
            }

            results.push(result);
        }
        // Direkt sürpriz maç yoksa ama ortak rakibe karşı sürpriz varsa
        else if (commonOpponents.length > 0) {
            const commonOpponent = commonOpponents[0];
            const xMatch = xSurprises.find(m => 
                m.HomeTeam === commonOpponent || m.AwayTeam === commonOpponent
            );
            const yMatch = ySurprises.find(m => 
                m.HomeTeam === commonOpponent || m.AwayTeam === commonOpponent
            );

            if (xMatch && yMatch) {
                results.push({
                    season,
                    commonOpponent,
                    xMatch: {
                        date: formatDate(Number(xMatch.Date)),
                        homeTeam: xMatch.HomeTeam,
                        awayTeam: xMatch.AwayTeam,
                        htScore: `${xMatch.HTHG}-${xMatch.HTAG}`,
                        ftScore: `${xMatch.FTHG}-${xMatch.FTAG}`
                    },
                    yMatch: {
                        date: formatDate(Number(yMatch.Date)),
                        homeTeam: yMatch.HomeTeam,
                        awayTeam: yMatch.AwayTeam,
                        htScore: `${yMatch.HTHG}-${yMatch.HTAG}`,
                        ftScore: `${yMatch.FTHG}-${yMatch.FTAG}`
                    }
                });
            }
        }
    });

    console.log("Analiz tamamlandı. Bulunan sonuçlar:", results);
    return results;
};

// ResultsDisplay komponenti
const ResultsDisplay: React.FC<{
    teamX: string;
    teamY: string;
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ teamX, teamY, results, onBack, isAnalyzing }) => {
    if (isAnalyzing) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header - Sabit kalacak */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center text-purple-500 hover:text-purple-400">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Geri Dön
                </button>
                <div className="flex items-center gap-4">
                    <TeamLogo name={teamX} className="w-10 h-10" />
                    <span className="text-gray-400">vs</span>
                    <TeamLogo name={teamY} className="w-10 h-10" />
                </div>
            </div>

            {/* Sonuçlar - Scrollable alan */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {results.length === 0 ? (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                        <p className="text-gray-400">
                            {teamX} ve {teamY} arasında ortak sürpriz bulunamadı.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-6">
                        {results.map((result, idx) => (
                            <div key={idx} className="bg-gray-800/30 rounded-xl p-6 space-y-6">
                                {/* Sezon Başlığı */}
                                <div className="text-xl font-semibold text-white">
                                    {result.season} Sezonu
                                </div>

                                {/* Üçgen Görünümü */}
                                <div className="relative pt-20">
                                    {/* X Takımı - Sol Üst */}
                                    <div className="absolute top-0 left-0 w-1/3">
                                        <div className="bg-blue-900/20 rounded-lg p-4">
                                            <div className="flex flex-col items-center gap-2 mb-2">
                                                <TeamLogo name={teamX} className="w-6 h-6" />
                                                <span className="text-blue-400 font-semibold">{teamX}</span>
                                                {result.directMatch && (
                                                    <span className="text-red-500 text-sm">Aralarında Sürpriz Var!</span>
                                                )}
                                            </div>
                                            {result.xMatch && (
                                                <div className="text-sm space-y-1">
                                                    <div className="text-gray-400">{result.xMatch.date}</div>
                                                    <div className="text-white">
                                                        {result.xMatch.homeTeam} vs {result.xMatch.awayTeam}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">HT: </span>
                                                        <span className="text-white">{result.xMatch.htScore}</span>
                                                        <span className="text-gray-400 mx-2">FT: </span>
                                                        <span className="text-white">{result.xMatch.ftScore}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Y Takımı - Sağ Üst */}
                                    <div className="absolute top-0 right-0 w-1/3">
                                        <div className="bg-purple-900/20 rounded-lg p-4">
                                            <div className="flex flex-col items-center gap-2 mb-2">
                                                <TeamLogo name={teamY} className="w-6 h-6" />
                                                <span className="text-purple-400 font-semibold">{teamY}</span>
                                                {result.directMatch && (
                                                    <span className="text-red-500 text-sm">Aralarında Sürpriz Var!</span>
                                                )}
                                            </div>
                                            {result.yMatch && (
                                                <div className="text-sm space-y-1">
                                                    <div className="text-gray-400">{result.yMatch.date}</div>
                                                    <div className="text-white">
                                                        {result.yMatch.homeTeam} vs {result.yMatch.awayTeam}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">HT: </span>
                                                        <span className="text-white">{result.yMatch.htScore}</span>
                                                        <span className="text-gray-400 mx-2">FT: </span>
                                                        <span className="text-white">{result.yMatch.ftScore}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ortak Rakip - Alt Orta */}
                                    <div className="w-1/3 mx-auto mt-8">
                                        <div className="bg-green-900/20 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TeamLogo name={result.commonOpponent || ''} className="w-6 h-6" />
                                                <span className="text-green-400 font-semibold">
                                                    {result.commonOpponent}
                                                </span>
                                            </div>
                                            {result.directMatch && (
                                                <div className="text-sm space-y-1">
                                                    <div className="text-gray-400">{result.directMatch.date}</div>
                                                    <div className="text-white">
                                                        {result.directMatch.homeTeam} vs {result.directMatch.awayTeam}
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400">HT: </span>
                                                        <span className="text-white">{result.directMatch.htScore}</span>
                                                        <span className="text-gray-400 mx-2">FT: </span>
                                                        <span className="text-white">{result.directMatch.ftScore}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bağlantı Çizgileri */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <svg className="w-full h-full">
                                            <line x1="16.7%" y1="20%" x2="50%" y2="80%" 
                                                  className="stroke-blue-500/30" strokeWidth="2" />
                                            <line x1="83.3%" y1="20%" x2="50%" y2="80%" 
                                                  className="stroke-purple-500/30" strokeWidth="2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Ana Komponent
export const BermudaTriangleV2: React.FC<BermudaTriangleV2Props> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Tüm takımları al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData.forEach(m => {
            if (m.HomeTeam) teamSet.add(m.HomeTeam);
            if (m.AwayTeam) teamSet.add(m.AwayTeam);
        });
        return Array.from(teamSet).sort();
    }, [matchData]);

    const handleTeamSelect = (team: string) => {
        setSelectedTeams(prev => {
            const newTeams = [...prev, team];
            if (newTeams.length === 2) {
                setShowTeamSelection(false);
                setIsAnalyzing(true);
                
                setTimeout(() => {
                    const analysisResults = analyzeBermudaV2(
                        newTeams[0],
                        newTeams[1],
                        matchData
                    );
                    setResults(analysisResults);
                    setIsAnalyzing(false);
                }, 100);
            }
            return newTeams;
        });
    };

    const handleBack = () => {
        setSelectedTeams([]);
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
                selectedTeams={selectedTeams}
                title="Bermuda Üçgeni V2 için Takım Seçin"
            />

            {!showTeamSelection && selectedTeams.length === 2 && (
                <div className="p-6">
                    <ResultsDisplay
                        teamX={selectedTeams[0]}
                        teamY={selectedTeams[1]}
                        results={results}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                    />
                </div>
            )}
        </>
    );
}; 