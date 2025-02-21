import React, { useState } from 'react';
import { TeamLogo } from '../TeamLogo';
import { 
    ArrowLeft, 
    ChevronDown, 
    ChevronUp, 
    Network, 
    GitBranch,
    FlipHorizontal,
    Footprints
} from 'lucide-react';

// formatDate fonksiyonunu ekleyelim
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// calculateSeason fonksiyonunu ekleyelim
const calculateSeason = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
};

interface SassuoloPatternAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface PatternResult {
    team: string;
    season: string;  // Sezon bilgisini ekledik
    surpriseMatch: {
        date: string;
        opponent: string;
        score: string;
    };
    patternMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        isHome: boolean;
        isSurprise?: boolean;  // Sürpriz maç kontrolü için
    }[];
}

type PatternType = 'sassuolo' | 'domino' | 'bridge' | 'rhythm';

export function SassuoloPatternAnalysis({ 
    league, 
    season, 
    matchData, 
    onClose 
}: SassuoloPatternAnalysisProps) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<PatternResult[]>([]);
    const [step, setStep] = useState<'team-select' | 'results'>('team-select');
    const [openResults, setOpenResults] = useState<number[]>([]);
    const [activePattern, setActivePattern] = useState<PatternType>('sassuolo');

    // Toggle fonksiyonu
    const toggleResult = (index: number) => {
        setOpenResults(prev => 
            prev.includes(index) 
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    // Ligteki tüm takımları al
    const teams = React.useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league)
            .forEach(match => {
                teamSet.add(match.HomeTeam);
                teamSet.add(match.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league]);

    // Pattern analizi - tüm sonuçları döndürecek şekilde güncellendi
    const analyzeSassuoloPattern = (team: string): PatternResult[] => {
        const results: PatternResult[] = [];
        
        const surpriseMatches = matchData
            .filter(m => 
                (m.HomeTeam === team || m.AwayTeam === team) &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        for (const surpriseMatch of surpriseMatches) {
            const nextMatches = matchData
                .filter(m => 
                    (m.HomeTeam === team || m.AwayTeam === team) &&
                    Number(m.Date) > Number(surpriseMatch.Date)
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date))
                .slice(0, 7);

            if (nextMatches.length < 7) continue;

            const hasInitialDraw = nextMatches[0].FTR === 'D';
            const positions = nextMatches.map(m => m.HomeTeam === team ? 'H' : 'A');
            const hasFirstPair = positions[1] === positions[2];
            const hasSecondPair = positions[5] === positions[6];

            if (hasFirstPair && hasSecondPair) {
                // Sezon bilgisini hesapla
                const matchDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                const season = calculateSeason(matchDate);

                results.push({
                    team,
                    season,  // Sezon bilgisini ekledik
                    surpriseMatch: {
                        date: formatDate(Number(surpriseMatch.Date)),
                        opponent: surpriseMatch.HomeTeam === team ? 
                            surpriseMatch.AwayTeam : surpriseMatch.HomeTeam,
                        score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`
                    },
                    patternMatches: nextMatches.map(m => ({
                        date: formatDate(Number(m.Date)),
                        homeTeam: m.HomeTeam,
                        awayTeam: m.AwayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        isHome: m.HomeTeam === team,
                        isSurprise: (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
                    }))
                });
            }
        }
        return results;
    };

    const handlePatternSelect = (pattern: PatternType) => {
        if (!selectedTeam) return;
        
        setActivePattern(pattern);
        let results: PatternResult[] = [];

        switch (pattern) {
            case 'sassuolo':
                results = analyzeSassuoloPattern(selectedTeam);
                break;
            case 'domino':
                results = analyzeDominoPattern(selectedTeam);
                break;
            case 'bridge':
                results = analyzeBridgePattern(selectedTeam);
                break;
            case 'rhythm':
                results = analyzeRhythmPattern(selectedTeam);
                break;
        }

        setAnalysisResults(results);
        setOpenResults([]);
    };

    const handleTeamSelect = (team: string) => {
        setSelectedTeam(team);
        const results = analyzeSassuoloPattern(team);
        setAnalysisResults(results);
        setOpenResults([]); // Tüm sonuçları kapalı başlat
        setStep('results');
    };

    // Ritim Pattern Analizi
    const analyzeRhythmPattern = (team: string): PatternResult[] => {
        const results: PatternResult[] = [];
        
        // Önce takımın tüm sürpriz maçlarını bul ve tarih sırasına göre sırala
        const surpriseMatches = matchData
            .filter(m => 
                (m.HomeTeam === team || m.AwayTeam === team) &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        // Her üç ardışık sürpriz maç için kontrol yap
        for (let i = 0; i < surpriseMatches.length - 2; i++) {
            const firstSurprise = surpriseMatches[i];
            const secondSurprise = surpriseMatches[i + 1];
            const thirdSurprise = surpriseMatches[i + 2];

            // İki sürpriz arasındaki maçları bul
            const matchesBetweenFirstAndSecond = matchData
                .filter(m => 
                    (m.HomeTeam === team || m.AwayTeam === team) &&
                    Number(m.Date) > Number(firstSurprise.Date) &&
                    Number(m.Date) < Number(secondSurprise.Date)
                );

            const matchesBetweenSecondAndThird = matchData
                .filter(m => 
                    (m.HomeTeam === team || m.AwayTeam === team) &&
                    Number(m.Date) > Number(secondSurprise.Date) &&
                    Number(m.Date) < Number(thirdSurprise.Date)
                );

            // Aralıkların uzunluğu eşit ve 3-5 maç arasında mı kontrol et
            if (matchesBetweenFirstAndSecond.length === matchesBetweenSecondAndThird.length &&
                matchesBetweenFirstAndSecond.length >= 3 &&
                matchesBetweenFirstAndSecond.length <= 5) {

                // Tüm maçları sıralı olarak birleştir
                const allMatches = [
                    firstSurprise,
                    ...matchesBetweenFirstAndSecond,
                    secondSurprise,
                    ...matchesBetweenSecondAndThird,
                    thirdSurprise
                ];

                const matchDate = new Date((Number(firstSurprise.Date) - 25569) * 86400 * 1000);
                results.push({
                    team,
                    season: calculateSeason(matchDate),
                    surpriseMatch: {
                        date: formatDate(Number(firstSurprise.Date)),
                        opponent: firstSurprise.HomeTeam === team ? 
                            firstSurprise.AwayTeam : firstSurprise.HomeTeam,
                        score: `${firstSurprise.FTHG}-${firstSurprise.FTAG}`
                    },
                    patternMatches: allMatches.map(m => ({
                        date: formatDate(Number(m.Date)),
                        homeTeam: m.HomeTeam,
                        awayTeam: m.AwayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        isHome: m.HomeTeam === team,
                        isSurprise: (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
                    }))
                });
            }
        }
        return results;
    };

    // Domino Pattern Analizi
    const analyzeDominoPattern = (team: string): PatternResult[] => {
        const results: PatternResult[] = [];
        
        // Takımın sürpriz maçlarını bul
        const surpriseMatches = matchData
            .filter(m => 
                (m.HomeTeam === team || m.AwayTeam === team) &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        for (const surpriseMatch of surpriseMatches) {
            // Sürpriz maçtaki rakibi bul
            const opponent = surpriseMatch.HomeTeam === team ? surpriseMatch.AwayTeam : surpriseMatch.HomeTeam;
            
            // Rakibin sonraki 3 maçını bul
            const opponentNextMatches = matchData
                .filter(m => 
                    (m.HomeTeam === opponent || m.AwayTeam === opponent) &&
                    Number(m.Date) > Number(surpriseMatch.Date)
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date))
                .slice(0, 3);

            // Eğer bu 3 maçta en az bir sürpriz varsa pattern'i kaydet
            if (opponentNextMatches.some(m => 
                (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
            )) {
                const matchDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                results.push({
                    team,
                    season: calculateSeason(matchDate),
                    surpriseMatch: {
                        date: formatDate(Number(surpriseMatch.Date)),
                        opponent,
                        score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`
                    },
                    patternMatches: opponentNextMatches.map(m => ({
                        date: formatDate(Number(m.Date)),
                        homeTeam: m.HomeTeam,
                        awayTeam: m.AwayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        isHome: m.HomeTeam === opponent,
                        isSurprise: (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
                    }))
                });
            }
        }
        return results;
    };

    // Köprü Pattern Analizi
    const analyzeBridgePattern = (team: string): PatternResult[] => {
        const results: PatternResult[] = [];
        
        // Tüm maçları tarih sırasına göre al
        const teamMatches = matchData
            .filter(m => m.HomeTeam === team || m.AwayTeam === team)
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        for (let i = 0; i < teamMatches.length - 4; i++) {
            const fiveMatches = teamMatches.slice(i, i + 5);
            const positions = fiveMatches.map(m => m.HomeTeam === team ? 'H' : 'A');

            // İlk 2 maç ve son 2 maç aynı konumda mı kontrol et
            if (
                positions[0] === positions[1] && // İlk 2 maç aynı
                positions[3] === positions[4] && // Son 2 maç aynı
                positions[1] !== positions[2] && // Orta maç farklı
                positions[2] !== positions[3]    // Orta maç son 2'den farklı
            ) {
                // Sürpriz maç var mı kontrol et
                const hasSurprise = fiveMatches.some(m => 
                    (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
                );

                if (hasSurprise) {
                    const matchDate = new Date((Number(fiveMatches[0].Date) - 25569) * 86400 * 1000);
                    results.push({
                        team,
                        season: calculateSeason(matchDate),
                        surpriseMatch: {
                            date: formatDate(Number(fiveMatches[0].Date)),
                            opponent: fiveMatches[0].HomeTeam === team ? 
                                fiveMatches[0].AwayTeam : fiveMatches[0].HomeTeam,
                            score: `${fiveMatches[0].FTHG}-${fiveMatches[0].FTAG}`
                        },
                        patternMatches: fiveMatches.map(m => ({
                            date: formatDate(Number(m.Date)),
                            homeTeam: m.HomeTeam,
                            awayTeam: m.AwayTeam,
                            score: `${m.FTHG}-${m.FTAG}`,
                            isHome: m.HomeTeam === team,
                            isSurprise: (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
                        }))
                    });
                }
            }
        }
        return results;
    };

    return (
        <div className="space-y-6">
            {/* Ana Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={step === 'team-select' ? onClose : () => setStep('team-select')}
                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h2 className="text-xl font-semibold text-white">
                    Pattern Analizleri
                </h2>
            </div>

            {step === 'team-select' ? (
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    <div className="grid grid-cols-6 gap-4">
                        {teams.map(team => (
                            <button
                                key={team}
                                onClick={() => handleTeamSelect(team)}
                                className="p-4 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl 
                                         transition-all flex flex-col items-center gap-2"
                            >
                                <TeamLogo name={team} className="w-16 h-16" />
                                <span className="text-sm text-gray-300 text-center">
                                    {team}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    {/* Pattern Seçim Header'ı - 4 seçenek */}
                    <div className="mb-6 bg-gray-800/30 rounded-xl p-2">
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => handlePatternSelect('sassuolo')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                                    ${activePattern === 'sassuolo' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                            >
                                <Footprints className="w-5 h-5" />
                                <span>Fikstür</span>
                            </button>
                            <button
                                onClick={() => handlePatternSelect('domino')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                                    ${activePattern === 'domino' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                            >
                                <Network className="w-5 h-5" />
                                <span>Domino</span>
                            </button>
                            <button
                                onClick={() => handlePatternSelect('bridge')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                                    ${activePattern === 'bridge' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                            >
                                <GitBranch className="w-5 h-5" />
                                <span>Köprü</span>
                            </button>
                            <button
                                onClick={() => handlePatternSelect('rhythm')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                                    ${activePattern === 'rhythm' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'}`}
                            >
                                <FlipHorizontal className="w-5 h-5" />
                                <span>Ritim</span>
                            </button>
                        </div>
                    </div>

                    {/* Sonuçlar Listesi */}
                    <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                        {analysisResults.length > 0 ? (
                            <div className="space-y-4">
                                {analysisResults.map((result, resultIndex) => (
                                    <div key={resultIndex} className="bg-gray-800/50 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => toggleResult(resultIndex)}
                                            className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <TeamLogo name={result.team} className="w-16 h-16" />
                                                <div>
                                                    <h3 className="text-xl font-semibold text-white">
                                                        {result.team}
                                                    </h3>
                                                    <p className="text-gray-400">{result.season} Sezonu</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-gray-300">
                                                        Sürpriz Maç: {result.surpriseMatch.date}
                                                    </p>
                                                    <p className="text-gray-400">
                                                        vs {result.surpriseMatch.opponent}
                                                    </p>
                                                    <p className="text-gray-400">
                                                        {result.surpriseMatch.score}
                                                    </p>
                                                </div>
                                                {openResults.includes(resultIndex) ? 
                                                    <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                                                    <ChevronDown className="w-6 h-6 text-gray-400" />
                                                }
                                            </div>
                                        </button>

                                        {openResults.includes(resultIndex) && (
                                            <div className="p-6 pt-0 space-y-3">
                                                {result.patternMatches.map((match, index) => (
                                                    <div 
                                                        key={index}
                                                        className={`flex items-center justify-between p-4 rounded-lg
                                                            ${match.isSurprise ? 'bg-purple-900/20 border border-purple-900/30' :
                                                              index === 0 ? 'bg-yellow-900/20 border border-yellow-900/30' : 
                                                              (index === 1 || index === 2 || index === 5 || index === 6) ? 
                                                              'bg-blue-900/20 border border-blue-900/30' : 
                                                              'bg-gray-800/50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-gray-400 w-6">{index + 1}.</span>
                                                            <TeamLogo name={match.homeTeam} className="w-8 h-8" />
                                                            <span className="text-white">{match.score}</span>
                                                            <TeamLogo name={match.awayTeam} className="w-8 h-8" />
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-gray-400">{match.date}</span>
                                                            <span className="ml-3 text-sm text-gray-500">
                                                                {match.isHome ? 'Ev' : 'Dep'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400">
                                    {selectedTeam} için Sassuolo Pattern sonucu bulunamadı.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 