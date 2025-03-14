import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';

interface SameMatchNumberAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    matchNumber: number;  // Kaçıncı maç
    teams: {
        name: string;
        season: string;
        surpriseMatch: {
            date: string;
            opponent: string;
            htScore: string;
            ftScore: string;
            isHome: boolean;
        };
    }[];
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
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl">
                {/* Header - Sabit kalacak */}
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">Takım Seçin</h2>
                    <p className="text-gray-400 mt-2">
                        Referans takımı seçin
                    </p>
                </div>

                {/* Takım Grid - Scrollable alan */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
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
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ selectedTeam, results, onBack, isAnalyzing }) => (
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
                <div className="relative">
                    <TeamLogo name={selectedTeam} className="w-24 h-24" />
                </div>
                <div className="relative">
                    <h2 className="text-3xl font-bold text-white">{selectedTeam}</h2>
                    <p className="text-blue-200 mt-1">Aynı Maç Sayısı Sürpriz Analizi</p>
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
                            <h3 className="text-xl font-bold text-blue-400 mb-4">
                                {result.matchNumber}. Maç Sürprizleri
                                <span className="text-sm font-normal text-gray-400 ml-2">
                                    ({result.teams.length} takım)
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {result.teams.map((team, teamIdx) => (
                                    <div key={teamIdx} className="bg-black/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <TeamLogo name={team.name} className="w-8 h-8" />
                                            <div>
                                                <div className="font-medium text-white">{team.name}</div>
                                                <div className="text-sm text-gray-400">{team.season}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="text-gray-400">
                                                <span className="text-green-400">Sürpriz Maç:</span> {team.surpriseMatch.date}
                                                {team.surpriseMatch.isHome ? ' (E) ' : ' (D) '}
                                                vs {team.surpriseMatch.opponent}
                                                <div className="mt-1">
                                                    <span className="text-yellow-500">
                                                        İY: {team.surpriseMatch.htScore}
                                                    </span>
                                                    {' → '}
                                                    <span className="text-green-500">
                                                        MS: {team.surpriseMatch.ftScore}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
const analyzeSameMatchNumbers = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): AnalysisResult[] => {
    // Seçili takımın seçili sezondaki sürpriz maç numaralarını bul
    const selectedTeamMatches = matchData
        .filter(m => 
            m.Div === league && 
            getSeasonFromDate(Number(m.Date)) === season &&
            (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
        )
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    const surpriseMatchNumbers = selectedTeamMatches
        .map((match, index) => {
            if ((match.HTR === 'H' && match.FTR === 'A') || 
                (match.HTR === 'A' && match.FTR === 'H')) {
                return index + 1; // 1-based match number
            }
            return null;
        })
        .filter(num => num !== null);

    // Her sürpriz maç numarası için diğer takımları kontrol et
    const results: AnalysisResult[] = [];

    surpriseMatchNumbers.forEach(matchNumber => {
        const matchingTeams = [];

        // Tüm sezonları ve takımları kontrol et
        const allSeasons = new Set(matchData
            .filter(m => m.Div === league)
            .map(m => getSeasonFromDate(Number(m.Date)))
        );

        allSeasons.forEach(checkingSeason => {
            if (checkingSeason === season) return; // Seçili sezonu atla

            // O sezondaki tüm takımları bul
            const seasonTeams = new Set(matchData
                .filter(m => 
                    m.Div === league && 
                    getSeasonFromDate(Number(m.Date)) === checkingSeason
                )
                .flatMap(m => [m.HomeTeam, m.AwayTeam])
            );

            seasonTeams.forEach(team => {
                if (team === selectedTeam) return; // Seçili takımı atla

                // Takımın o sezondaki maçlarını sırala
                const teamMatches = matchData
                    .filter(m => 
                        m.Div === league && 
                        getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                        (m.HomeTeam === team || m.AwayTeam === team)
                    )
                    .sort((a, b) => Number(a.Date) - Number(b.Date));

                // matchNumber'daki maç sürpriz mi kontrol et
                const matchToCheck = teamMatches[matchNumber - 1];
                if (matchToCheck && 
                    ((matchToCheck.HTR === 'H' && matchToCheck.FTR === 'A') || 
                     (matchToCheck.HTR === 'A' && matchToCheck.FTR === 'H'))) {
                    matchingTeams.push({
                        name: team,
                        season: checkingSeason,
                        surpriseMatch: {
                            date: formatDate(Number(matchToCheck.Date)),
                            opponent: matchToCheck.HomeTeam === team ? 
                                    matchToCheck.AwayTeam : matchToCheck.HomeTeam,
                            htScore: `${matchToCheck.HTHG}-${matchToCheck.HTAG}`,
                            ftScore: `${matchToCheck.FTHG}-${matchToCheck.FTAG}`,
                            isHome: matchToCheck.HomeTeam === team
                        }
                    });
                }
            });
        });

        if (matchingTeams.length > 0) {
            results.push({
                matchNumber,
                teams: matchingTeams
            });
        }
    });

    return results.sort((a, b) => a.matchNumber - b.matchNumber);
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

// Ana Komponent
export const SameMatchNumberAnalysis: React.FC<SameMatchNumberAnalysisProps> = ({
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
            const analysisResults = analyzeSameMatchNumbers(team, league, season, matchData);
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
                    />
                </div>
            )}
        </>
    );
}; 