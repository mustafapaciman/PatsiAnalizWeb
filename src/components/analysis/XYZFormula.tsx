import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';

// Yardımcı fonksiyonları doğrudan burada tanımla
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
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

interface XYZFormulaProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    surpriseTeam: string;  // M takımı
    surpriseMatch: {       // M vs Y maçı
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
        isHome: boolean;
    };
    previousMatch: {       // M vs X maçı
        date: string;
        opponent: string;  // X takımı
        score: string;
    };
    opponentLastMatch: {   // Y'nin son maçı
        date: string;
        opponent: string;
        score: string;
    };
}

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
                {/* Header - Sabit kalacak */}
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <p className="text-gray-400 mt-2">
                        {selectedTeams.length === 0 ? "X Takımını Seçin" : "Y Takımını Seçin"}
                    </p>
                </div>

                {/* Takım Grid - Scrollable alan */}
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
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ teamX, teamY, results, onBack, isAnalyzing }) => (
    <div className="h-screen flex flex-col">
        {/* Header */}
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
                <div className="flex items-center gap-4">
                    <TeamLogo name={teamX} className="w-16 h-16" />
                    <ArrowRight className="w-6 h-6 text-blue-300" />
                    <TeamLogo name={teamY} className="w-16 h-16" />
                </div>
                <div className="relative">
                    <h2 className="text-3xl font-bold text-white">Ardışık Rakip Analizi</h2>
                    <p className="text-blue-200 mt-1">
                        {teamY} ile sürpriz yapan takımların {teamX} maçları
                    </p>
                </div>
            </div>
        </div>

        {/* Sonuçlar */}
        <div className="flex-1 overflow-auto mt-8 px-2">
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400">Analiz yapılıyor...</p>
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-6 pb-8">
                    {results.map((result, idx) => (
                        <div key={idx} 
                             className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                      border border-gray-700/30 hover:border-blue-500/30 
                                      transition-all duration-300 p-6">
                            {/* Sürpriz Maç */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <TeamLogo name={result.surpriseMatch.homeTeam} className="w-12 h-12" />
                                    <div className="text-2xl font-bold text-white">vs</div>
                                    <TeamLogo name={result.surpriseMatch.awayTeam} className="w-12 h-12" />
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-400">{result.surpriseMatch.date}</div>
                                    <div className="text-lg">
                                        <span className="text-yellow-500">{result.surpriseMatch.htScore}</span>
                                        {' → '}
                                        <span className="text-green-500">{result.surpriseMatch.ftScore}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Önceki Maçlar */}
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {/* X ile Maç */}
                                <div className="bg-black/20 rounded-lg p-4">
                                    <div className="text-sm text-blue-400 mb-2">
                                        {`${teamY} maçından önceki son rakip:`}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TeamLogo name={result.previousMatch.opponent} className="w-8 h-8" />
                                            <span className="text-gray-300">{result.previousMatch.opponent}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400">{result.previousMatch.date}</div>
                                            <div className="text-white">{result.previousMatch.score}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Y'nin Son Maçı */}
                                <div className="bg-black/20 rounded-lg p-4">
                                    <div className="text-sm text-blue-400 mb-2">
                                        {`${teamY}'nin son maçı:`}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <TeamLogo name={result.opponentLastMatch.opponent} className="w-8 h-8" />
                                            <span className="text-gray-300">{result.opponentLastMatch.opponent}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-400">{result.opponentLastMatch.date}</div>
                                            <div className="text-white">{result.opponentLastMatch.score}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-gray-400">
                                <span className="text-blue-400">{result.surpriseTeam}</span> takımı,{' '}
                                <span className="text-yellow-400">{teamX}</span> ile oynadıktan hemen sonra{' '}
                                <span className="text-green-400">{teamY}</span> ile sürpriz yaptı.
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                    <p className="text-gray-400">Eşleşen sonuç bulunamadı.</p>
                </div>
            )}
        </div>
    </div>
);

// Analiz Fonksiyonu
const analyzeXYZFormula = (
    teamX: string,
    teamY: string,
    matchData: any[]
): AnalysisResult[] => {
    const results: AnalysisResult[] = [];

    // Tüm maçları tarihe göre sırala
    const sortedMatches = [...matchData].sort((a, b) => Number(a.Date) - Number(b.Date));

    // Her maç için kontrol
    sortedMatches.forEach((match, index) => {
        // Y ile yapılan sürpriz maç mı kontrol et
        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                          (match.HTR === 'A' && match.FTR === 'H');

        if (!isSurprise) return;

        // Y takımı bu maçta var mı?
        if (match.HomeTeam !== teamY && match.AwayTeam !== teamY) return;

        // M takımını belirle (Y'nin rakibi)
        const surpriseTeam = match.HomeTeam === teamY ? match.AwayTeam : match.HomeTeam;

        // M takımı X veya Y olmamalı
        if (surpriseTeam === teamX || surpriseTeam === teamY) return;

        // M'nin önceki maçlarını bul
        const previousMatches = sortedMatches
            .slice(0, index)
            .reverse();

        // M'nin son maçını bul (X ile olmalı)
        const lastMatchOfM = previousMatches.find(m => 
            (m.HomeTeam === surpriseTeam || m.AwayTeam === surpriseTeam)
        );

        // M'nin son maçı X ile değilse veya araya başka maç girmişse atla
        if (!lastMatchOfM || 
            (lastMatchOfM.HomeTeam !== teamX && lastMatchOfM.AwayTeam !== teamX)) return;

        // Y'nin son maçını bul
        const lastMatchOfY = previousMatches.find(m => 
            (m.HomeTeam === teamY || m.AwayTeam === teamY) &&
            Number(m.Date) < Number(match.Date)
        );

        if (!lastMatchOfY) return;

        // M'nin X maçı ile Y maçı arasında başka maç olmadığından emin ol
        const hasMatchBetween = sortedMatches.some(m => 
            (m.HomeTeam === surpriseTeam || m.AwayTeam === surpriseTeam) &&
            Number(m.Date) > Number(lastMatchOfM.Date) &&
            Number(m.Date) < Number(match.Date)
        );

        if (hasMatchBetween) return;

        // Sonuçları ekle
        results.push({
            surpriseTeam,
            surpriseMatch: {
                date: formatDate(Number(match.Date)),
                homeTeam: match.HomeTeam,
                awayTeam: match.AwayTeam,
                htScore: `${match.HTHG}-${match.HTAG}`,
                ftScore: `${match.FTHG}-${match.FTAG}`,
                isHome: match.HomeTeam === surpriseTeam
            },
            previousMatch: {
                date: formatDate(Number(lastMatchOfM.Date)),
                opponent: teamX,
                score: `${lastMatchOfM.FTHG}-${lastMatchOfM.FTAG}`
            },
            opponentLastMatch: {
                date: formatDate(Number(lastMatchOfY.Date)),
                opponent: lastMatchOfY.HomeTeam === teamY ? 
                         lastMatchOfY.AwayTeam : lastMatchOfY.HomeTeam,
                score: `${lastMatchOfY.FTHG}-${lastMatchOfY.FTAG}`
            }
        });
    });

    return results;
};

// Ana Komponent
export const XYZFormula: React.FC<XYZFormulaProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            
            setTimeout(() => {
                const analysisResults = analyzeXYZFormula(
                    newSelectedTeams[0],
                    newSelectedTeams[1],
                    matchData
                );
                setResults(analysisResults);
                setIsAnalyzing(false);
            }, 100);
        }
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
                title="X-Y-Z Formülü için Takım Seçin"
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