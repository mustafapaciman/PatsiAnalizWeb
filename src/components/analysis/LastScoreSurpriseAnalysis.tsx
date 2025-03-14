import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';
import { LEAGUE_INFO } from '../analysis/FormulaSearchModal';

interface LastScoreSurpriseAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface LastMatch {
    date: string;
    opponent: string;
    score: string;
    isSurprise?: boolean;  // Sürpriz maç mı?
}

interface AnalysisResult {
    surpriseMatch: {
        date: string;
        homeTeam: string;  // M takımı
        awayTeam: string;  // Z takımı
        htScore: string;
        ftScore: string;
        league: string;
    };
    homeLastMatch: LastMatch;      // M'nin son maçı
    awayLastMatch: LastMatch;      // Z'nin son maçı
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
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <p className="text-gray-400 mt-2">
                        {selectedTeams.length === 0 ? "X Takımını Seçin" : "Y Takımını Seçin"}
                    </p>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-4 gap-4">
                        {teams
                            .filter(team => !selectedTeams.includes(team))
                            .map(team => (
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
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    teamX: string;
    teamY: string;
    xLastScore: string;
    yLastScore: string;
    results: { direct: AnalysisResult[], cross: AnalysisResult[] };
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ teamX, teamY, xLastScore, yLastScore, results, onBack, isAnalyzing }) => {
    const ResultSection = ({ title, results }: { title: string, results: AnalysisResult[] }) => (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-blue-400">{title}</h3>
            {results.length > 0 ? (
                results.map((result, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                            border border-gray-700/30 hover:border-blue-500/30 
                                            transition-all duration-300 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-12 h-12" />
                                <div className="text-2xl font-bold text-white">vs</div>
                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-12 h-12" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 mb-1">
                                    {LEAGUE_INFO[result.surpriseMatch.league].name}
                                </div>
                                <div className="text-sm text-gray-400">{result.surpriseMatch.date}</div>
                                <div className="text-lg">
                                    <span className="text-yellow-500">{result.surpriseMatch.htScore}</span>
                                    {' → '}
                                    <span className="text-green-500">{result.surpriseMatch.ftScore}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className={`bg-black/20 rounded-lg p-4 ${
                                result.homeLastMatch.isSurprise ? 'bg-purple-900/20 border-purple-500/30' : ''
                            }`}>
                                <div className="text-sm text-blue-400 mb-2">
                                    {`${result.surpriseMatch.homeTeam}'nin son maçı:`}
                                    {result.homeLastMatch.isSurprise && (
                                        <span className="ml-2 text-purple-400">(Sürpriz)</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TeamLogo name={result.homeLastMatch.opponent} className="w-8 h-8" />
                                        <span className="text-gray-300">{result.homeLastMatch.opponent}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{result.homeLastMatch.date}</div>
                                        <div className="text-white">{result.homeLastMatch.score}</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`bg-black/20 rounded-lg p-4 ${
                                result.awayLastMatch.isSurprise ? 'bg-purple-900/20 border-purple-500/30' : ''
                            }`}>
                                <div className="text-sm text-blue-400 mb-2">
                                    {`${result.surpriseMatch.awayTeam}'nin son maçı:`}
                                    {result.awayLastMatch.isSurprise && (
                                        <span className="ml-2 text-purple-400">(Sürpriz)</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TeamLogo name={result.awayLastMatch.opponent} className="w-8 h-8" />
                                        <span className="text-gray-300">{result.awayLastMatch.opponent}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{result.awayLastMatch.date}</div>
                                        <div className="text-white">{result.awayLastMatch.score}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-6 bg-gray-800/30 rounded-xl">
                    <p className="text-gray-400">Eşleşen sonuç bulunamadı.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
                          rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                
                <button onClick={onBack} className="absolute top-4 left-4 p-2 rounded-lg bg-black/20 
                                                  hover:bg-black/30 transition-colors text-white">
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <TeamLogo name={teamX} className="w-16 h-16 mb-2" />
                            <div className="text-white font-bold">{xLastScore}</div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-blue-300" />
                        <div className="text-center">
                            <TeamLogo name={teamY} className="w-16 h-16 mb-2" />
                            <div className="text-white font-bold">{yLastScore}</div>
                        </div>
                    </div>
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-white">Son Skor ile Sürpriz</h2>
                        <p className="text-blue-200 mt-1">
                            {teamX} ({xLastScore}) ve {teamY} ({yLastScore}) son maç skorları ile eşleşen sürprizler
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto mt-8 px-2">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Analiz yapılıyor...</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-8">
                        <ResultSection 
                            title={`Direkt Eşleşmeler (${results.direct.length})`}
                            results={results.direct} 
                        />
                        
                        <ResultSection 
                            title={`Çapraz Eşleşmeler (${results.cross.length})`}
                            results={results.cross} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Sürpriz kontrolü için yardımcı fonksiyon
const isSurpriseMatch = (match: any): boolean => {
    return (match.HTR === 'H' && match.FTR === 'A') || 
           (match.HTR === 'A' && match.FTR === 'H');
};

// Analiz Fonksiyonu
const analyzeLastScoreSurprises = (
    teamX: string,
    teamY: string,
    matchData: any[],
    selectedSeason: string
): { direct: AnalysisResult[], cross: AnalysisResult[] } => {
    // X ve Y'nin seçili sezondaki son maçlarını bul
    const xLastMatch = matchData
        .filter(m => 
            (m.HomeTeam === teamX || m.AwayTeam === teamX) &&
            getSeasonFromDate(Number(m.Date)) === selectedSeason
        )
        .sort((a, b) => Number(b.Date) - Number(a.Date))[0];

    const yLastMatch = matchData
        .filter(m => 
            (m.HomeTeam === teamY || m.AwayTeam === teamY) &&
            getSeasonFromDate(Number(m.Date)) === selectedSeason
        )
        .sort((a, b) => Number(b.Date) - Number(a.Date))[0];

    if (!xLastMatch || !yLastMatch) return { direct: [], cross: [] };

    const xLastScore = `${xLastMatch.FTHG}-${xLastMatch.FTAG}`;
    const yLastScore = `${yLastMatch.FTHG}-${yLastMatch.FTAG}`;

    // Seçili sezonun maçlarını filtrele
    const seasonMatches = matchData.filter(m => 
        getSeasonFromDate(Number(m.Date)) === selectedSeason
    );

    // Tüm sürpriz maçları bul (tüm ligler için)
    const results: AnalysisResult[] = [];
    
    // Maçları tarihe göre sırala
    const sortedMatches = [...seasonMatches].sort((a, b) => Number(a.Date) - Number(b.Date));

    sortedMatches.forEach((match, index) => {
        // Sürpriz maç mı kontrol et
        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                          (match.HTR === 'A' && match.FTR === 'H');

        if (!isSurprise) return;

        // M ve Z takımlarının son maçlarını bul
        const previousMatches = sortedMatches.slice(0, index);
        
        const homeLastMatch = previousMatches
            .filter(m => m.HomeTeam === match.HomeTeam || m.AwayTeam === match.HomeTeam)
            .sort((a, b) => Number(b.Date) - Number(a.Date))[0];

        const awayLastMatch = previousMatches
            .filter(m => m.HomeTeam === match.AwayTeam || m.AwayTeam === match.AwayTeam)
            .sort((a, b) => Number(b.Date) - Number(a.Date))[0];

        if (!homeLastMatch || !awayLastMatch) return;

        // Skorları kontrol et
        const homeLastScore = `${homeLastMatch.FTHG}-${homeLastMatch.FTAG}`;
        const awayLastScore = `${awayLastMatch.FTHG}-${awayLastMatch.FTAG}`;

        // Direkt eşleşme (M->X ve Z->Y)
        if (homeLastScore === xLastScore && awayLastScore === yLastScore) {
            results.push({
                surpriseMatch: {
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    htScore: `${match.HTHG}-${match.HTAG}`,
                    ftScore: `${match.FTHG}-${match.FTAG}`,
                    league: match.Div
                },
                homeLastMatch: {
                    date: formatDate(Number(homeLastMatch.Date)),
                    opponent: homeLastMatch.HomeTeam === match.HomeTeam ? 
                             homeLastMatch.AwayTeam : homeLastMatch.HomeTeam,
                    score: homeLastScore,
                    isSurprise: isSurpriseMatch(homeLastMatch)
                },
                awayLastMatch: {
                    date: formatDate(Number(awayLastMatch.Date)),
                    opponent: awayLastMatch.HomeTeam === match.AwayTeam ? 
                             awayLastMatch.AwayTeam : awayLastMatch.HomeTeam,
                    score: awayLastScore,
                    isSurprise: isSurpriseMatch(awayLastMatch)
                }
            });
        }

        // Çapraz eşleşme (M->Y ve Z->X)
        if (homeLastScore === yLastScore && awayLastScore === xLastScore) {
            results.push({
                surpriseMatch: {
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    htScore: `${match.HTHG}-${match.HTAG}`,
                    ftScore: `${match.FTHG}-${match.FTAG}`,
                    league: match.Div
                },
                homeLastMatch: {
                    date: formatDate(Number(homeLastMatch.Date)),
                    opponent: homeLastMatch.HomeTeam === match.HomeTeam ? 
                             homeLastMatch.AwayTeam : homeLastMatch.HomeTeam,
                    score: homeLastScore,
                    isSurprise: isSurpriseMatch(homeLastMatch)
                },
                awayLastMatch: {
                    date: formatDate(Number(awayLastMatch.Date)),
                    opponent: awayLastMatch.HomeTeam === match.AwayTeam ? 
                             awayLastMatch.AwayTeam : awayLastMatch.HomeTeam,
                    score: awayLastScore,
                    isSurprise: isSurpriseMatch(awayLastMatch)
                }
            });
        }
    });

    // İki ayrı array oluştur
    const directResults: AnalysisResult[] = [];
    const crossResults: AnalysisResult[] = [];

    results.forEach((result, index) => {
        // Skorları kontrol et
        const homeLastScore = `${result.homeLastMatch.score}`;
        const awayLastScore = `${result.awayLastMatch.score}`;

        // Direkt eşleşme (M->X ve Z->Y)
        if (homeLastScore === xLastScore && awayLastScore === yLastScore) {
            directResults.push(result);
        }

        // Çapraz eşleşme (M->Y ve Z->X)
        if (homeLastScore === yLastScore && awayLastScore === xLastScore) {
            crossResults.push(result);
        }
    });

    return { 
        direct: directResults,  // Direkt eşleşmeleri döndür
        cross: crossResults    // Çapraz eşleşmeleri döndür
    };
};

// Sezon hesaplama yardımcı fonksiyonu
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Ana Komponent
export const LastScoreSurpriseAnalysis: React.FC<LastScoreSurpriseAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [results, setResults] = useState<{ direct: AnalysisResult[], cross: AnalysisResult[] }>({
        direct: [],
        cross: []
    });
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [xLastScore, setXLastScore] = useState<string>('');
    const [yLastScore, setYLastScore] = useState<string>('');

    // Ligin tüm takımlarını al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league)
            .forEach(m => {
                teamSet.add(m.HomeTeam);
                teamSet.add(m.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league]);

    const handleTeamSelect = (team: string) => {
        const newSelectedTeams = [...selectedTeams, team];
        setSelectedTeams(newSelectedTeams);

        if (newSelectedTeams.length === 2) {
            setShowTeamSelection(false);
            setIsAnalyzing(true);
            
            // Son skorları bul
            const xLastMatch = matchData
                .filter(m => m.HomeTeam === newSelectedTeams[0] || m.AwayTeam === newSelectedTeams[0])
                .sort((a, b) => Number(b.Date) - Number(a.Date))[0];

            const yLastMatch = matchData
                .filter(m => m.HomeTeam === newSelectedTeams[1] || m.AwayTeam === newSelectedTeams[1])
                .sort((a, b) => Number(b.Date) - Number(a.Date))[0];

            const xScore = `${xLastMatch.FTHG}-${xLastMatch.FTAG}`;
            const yScore = `${yLastMatch.FTHG}-${yLastMatch.FTAG}`;

            setXLastScore(xScore);
            setYLastScore(yScore);

            setTimeout(() => {
                const analysisResults = analyzeLastScoreSurprises(
                    newSelectedTeams[0],
                    newSelectedTeams[1],
                    matchData,
                    season
                );
                setResults(analysisResults);
                setIsAnalyzing(false);
            }, 100);
        }
    };

    const handleBack = () => {
        setSelectedTeams([]);
        setResults({ direct: [], cross: [] });
        setShowTeamSelection(true);
        setXLastScore('');
        setYLastScore('');
    };

    return (
        <>
            <TeamSelectionModal
                isOpen={showTeamSelection}
                onClose={onClose}
                teams={teams}
                onSelect={handleTeamSelect}
                selectedTeams={selectedTeams}
                title="Son Skor ile Sürpriz Analizi için Takım Seçin"
            />

            {!showTeamSelection && selectedTeams.length === 2 && (
                <div className="p-6">
                    <ResultsDisplay
                        teamX={selectedTeams[0]}
                        teamY={selectedTeams[1]}
                        xLastScore={xLastScore}
                        yLastScore={yLastScore}
                        results={results}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                    />
                </div>
            )}
        </>
    );
}; 