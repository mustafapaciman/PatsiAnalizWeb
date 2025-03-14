import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface SameOpponentMatchNumberAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    team: string;
    season: string;
    firstMatchDate: string;
    surpriseMatch: {
        date: string;
        htScore: string;
        ftScore: string;
        isHome: boolean;
        matchNumber: number;
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

// Maç Sayısı Seçme Modalı
const MatchNumberSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (number: number) => void;
}> = ({ isOpen, onClose, onSelect }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Maç Sayısı Seçin</h2>
                <div className="grid grid-cols-8 gap-3">
                    {Array.from({ length: 40 }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            onClick={() => onSelect(num)}
                            className="flex items-center justify-center p-3 rounded-lg
                                     bg-gray-800/50 hover:bg-gray-800/70 transition-all
                                     hover:scale-105 hover:shadow-lg text-white"
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    selectedNumber: number;
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ selectedTeam, selectedNumber, results, onBack, isAnalyzing }) => {
    return (
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
                        <TeamLogo name={selectedTeam} 
                                 className="w-24 h-24 transform hover:scale-105 transition-transform" />
                    </div>
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-white">{selectedTeam}</h2>
                        <p className="text-blue-200 mt-1">
                            {selectedNumber}. Maç Günü Sürpriz Analizi
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
                ) : (
                    <div className="space-y-6 pb-8">
                        {results.length > 0 ? (
                            results.map((result, idx) => (
                                <div key={idx} 
                                     className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                              border border-gray-700/30 hover:border-blue-500/30 
                                              transition-all duration-300 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <TeamLogo name={result.team} className="w-12 h-12" />
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{result.team}</h3>
                                            <p className="text-sm text-gray-400">{result.season} Sezonu</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-4">
                                        <div className="space-y-2">
                                            <div className="text-gray-400">
                                                <span className="text-blue-400">Sezon İlk Maçı:</span> {result.firstMatchDate}
                                            </div>
                                            <div className="text-gray-400">
                                                <span className="text-green-400">Sürpriz Maç:</span> {result.surpriseMatch.date}
                                                {result.surpriseMatch.isHome ? ' (E) ' : ' (D) '}
                                                <div className="mt-1">
                                                    <span className="text-yellow-500">
                                                        İY: {result.surpriseMatch.htScore}
                                                    </span>
                                                    {' → '}
                                                    <span className="text-green-500">
                                                        MS: {result.surpriseMatch.ftScore}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                <p className="text-gray-400">
                                    {selectedNumber}. maç gününde sürpriz yapan takım bulunamadı.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Analiz fonksiyonunu güncelliyorum
const analyzeSameOpponentMatchNumber = (
    selectedTeam: string,
    selectedNumber: number,
    league: string,
    matchData: any[]
): AnalysisResult[] => {
    const results: AnalysisResult[] = [];
    console.log('Analiz başlıyor:', { selectedTeam, selectedNumber, league });

    // Tüm sezonları bul
    const allSeasons = new Set(matchData
        .filter(m => m.Div === league)
        .map(m => getSeasonFromDate(Number(m.Date)))
    );
    console.log('Bulunan sezonlar:', Array.from(allSeasons));

    // Her sezon için analiz yap
    allSeasons.forEach(season => {
        console.log(`\n${season} sezonu analiz ediliyor...`);
        
        // Sezon başlangıç tarihini bul (o sezonun ilk maçı)
        let seasonFirstMatch = matchData
            .filter(m => 
                m.Div === league && 
                getSeasonFromDate(Number(m.Date)) === season
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date))[0];

        // COVID-19 sezonu için özel kontrol
        if (season === '2020-2021') {
            // Temmuz'dan önceki maçları filtrele (Ağustos ve sonrasını al)
            seasonFirstMatch = matchData
                .filter(m => 
                    m.Div === league && 
                    getSeasonFromDate(Number(m.Date)) === season &&
                    new Date((Number(m.Date) - 25569) * 86400 * 1000).getMonth() >= 7 // Ağustos ve sonrası
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date))[0];
        }

        const seasonStartDate = seasonFirstMatch ? Number(seasonFirstMatch.Date) : 0;
        console.log(`Sezon başlangıç tarihi: ${formatDate(seasonStartDate)}`);
        
        // O sezondaki tüm takımları bul
        const seasonTeams = new Set(matchData
            .filter(m => 
                m.Div === league && 
                getSeasonFromDate(Number(m.Date)) === season &&
                Number(m.Date) >= seasonStartDate // Sezon başlangıcından sonraki maçlar
            )
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
        );

        // Her takım için kontrol et
        seasonTeams.forEach(team => {
            if (team === selectedTeam) return; // X takımını atla

            // Takımın sezon maçlarını bul (TÜM maçları)
            const teamMatches = matchData
                .filter(m => 
                    m.Div === league && 
                    getSeasonFromDate(Number(m.Date)) === season &&
                    Number(m.Date) >= seasonStartDate && // Sezon başlangıcından sonraki maçlar
                    (m.HomeTeam === team || m.AwayTeam === team)
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date));

            // X takımı ile olan maçları bul
            const matchesWithSelectedTeam = teamMatches.filter(m =>
                (m.HomeTeam === selectedTeam && m.AwayTeam === team) ||
                (m.AwayTeam === selectedTeam && m.HomeTeam === team)
            );

            matchesWithSelectedTeam.forEach(matchWithSelected => {
                // Bu maç, takımın kaçıncı maçı?
                const matchNumber = teamMatches.findIndex(m => m === matchWithSelected) + 1;

                console.log(`${team} takımının ${selectedTeam} ile ${matchNumber}. maçı kontrol ediliyor:`, {
                    date: formatDate(Number(matchWithSelected.Date)),
                    score: `${matchWithSelected.HTHG}-${matchWithSelected.HTAG} → ${matchWithSelected.FTHG}-${matchWithSelected.FTAG}`,
                    HTR: matchWithSelected.HTR,
                    FTR: matchWithSelected.FTR,
                    sezonBaşlangıcı: formatDate(seasonStartDate)
                });

                // Seçilen maç sayısına eşit mi ve sürpriz maç mı?
                if (matchNumber === selectedNumber && 
                    ((matchWithSelected.HTR === 'H' && matchWithSelected.FTR === 'A') || 
                     (matchWithSelected.HTR === 'A' && matchWithSelected.FTR === 'H'))) {
                    
                    console.log(`✅ Sürpriz maç bulundu! ${team} vs ${selectedTeam}`);
                    
                    // Takımın sezon ilk maçını bul
                    const firstMatch = teamMatches[0];
                    
                    results.push({
                        team,
                        season,
                        firstMatchDate: formatDate(Number(firstMatch.Date)),
                        surpriseMatch: {
                            date: formatDate(Number(matchWithSelected.Date)),
                            htScore: `${matchWithSelected.HTHG}-${matchWithSelected.HTAG}`,
                            ftScore: `${matchWithSelected.FTHG}-${matchWithSelected.FTAG}`,
                            isHome: matchWithSelected.HomeTeam === team,
                            matchNumber
                        }
                    });
                }
            });
        });
    });

    console.log('\nAnaliz tamamlandı:', {
        toplamSonuç: results.length,
        sonuçlar: results.map(r => ({
            team: r.team,
            season: r.season,
            date: r.surpriseMatch.date,
            score: `${r.surpriseMatch.htScore} → ${r.surpriseMatch.ftScore}`
        }))
    });

    return results;
};

// Yardımcı fonksiyonlar
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();

    // COVID-19 sezonu için özel kontrol (2020-2021 sezonu)
    if (year === 2020 && month >= 8 && month <= 11) { // Eylül-Aralık arası
        return '2020-2021';
    }

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
export const SameOpponentMatchNumberAnalysis: React.FC<SameOpponentMatchNumberAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [showNumberSelection, setShowNumberSelection] = useState(false);
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

    const handleTeamSelect = (team: string) => {
        setSelectedTeam(team);
        setShowTeamSelection(false);
        setShowNumberSelection(true);
    };

    const handleNumberSelect = async (number: number) => {
        setSelectedNumber(number);
        setShowNumberSelection(false);
        setIsAnalyzing(true);
        
        setTimeout(() => {
            const analysisResults = analyzeSameOpponentMatchNumber(
                selectedTeam!,
                number,
                league,
                matchData
            );
            setResults(analysisResults);
            setIsAnalyzing(false);
        }, 100);
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setSelectedNumber(null);
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

            <MatchNumberSelectionModal
                isOpen={showNumberSelection}
                onClose={() => setShowTeamSelection(true)}
                onSelect={handleNumberSelect}
            />

            {!showTeamSelection && !showNumberSelection && selectedTeam && selectedNumber && (
                <div className="p-6">
                    <ResultsDisplay
                        selectedTeam={selectedTeam}
                        selectedNumber={selectedNumber}
                        results={results}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                    />
                </div>
            )}
        </>
    );
}; 