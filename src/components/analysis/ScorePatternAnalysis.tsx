import React, { useState, useMemo } from 'react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, X, ChevronDown } from 'lucide-react';
import { PatternResults } from './scorePattern/PatternResults';
import { ScoreBasedAnalysis } from './scorePattern/ScoreBasedAnalysis';
import { PatternResult, ScoreBasedResult, PotentialXResult, PotentialYResult } from './scorePattern/types';

interface ScorePatternAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

type AnalysisTab = 'pattern' | 'score-based';

const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const calculateSeason = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
};

export function ScorePatternAnalysis({
    league,
    season,
    matchData,
    onClose
}: ScorePatternAnalysisProps) {
    const [selectedTeams, setSelectedTeams] = useState<[string?, string?]>([]);
    const [results, setResults] = useState<PatternResult[]>([]);
    const [step, setStep] = useState<'team-select' | 'results'>('team-select');
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const [openCards, setOpenCards] = useState<string[]>([]);
    const [potentialXResults, setPotentialXResults] = useState<PotentialXResult[]>([]);
    const [potentialYResults, setPotentialYResults] = useState<PotentialYResult[]>([]);
    const [activeTab, setActiveTab] = useState<AnalysisTab>('pattern');
    const [selectedScore, setSelectedScore] = useState<string>('');
    const [selectedOpponent, setSelectedOpponent] = useState<string | 'any'>('');
    const [scoreBasedResults, setScoreBasedResults] = useState<ScoreBasedResult[]>([]);

    // Ligteki tüm takımları al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league)
            .forEach(match => {
                teamSet.add(match.HomeTeam);
                teamSet.add(match.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league]);

    // Mevcut tüm sezonları bul
    const seasons = useMemo(() => {
        const seasonSet = new Set<string>();
        matchData.forEach(match => {
            const matchDate = new Date((match.Date - 25569) * 86400 * 1000);
            seasonSet.add(calculateSeason(matchDate));
        });
        return Array.from(seasonSet).sort().reverse(); // En yeni sezon en üstte
    }, [matchData]);

    // Sezon bazlı sonuçları grupla
    const groupedResults = useMemo(() => {
        if (!results.length) return new Map<string, PatternResult[]>();
        
        const grouped = new Map<string, PatternResult[]>();
        results.forEach(result => {
            const existing = grouped.get(result.season) || [];
            grouped.set(result.season, [...existing, result]);
        });
        return grouped;
    }, [results]);

    const handleTeamSelect = (team: string) => {
        if (selectedTeams.includes(team)) return;
        
        setSelectedTeams(prev => {
            if (prev.length >= 2) return prev;
            return [...prev, team] as [string?, string?];
        });
    };

    const removeTeam = (index: number) => {
        setSelectedTeams(prev => prev.filter((_, i) => i !== index) as [string?, string?]);
    };

    // Kart açma/kapama fonksiyonu
    const toggleCard = (cardId: string) => {
        setOpenCards(prev => 
            prev.includes(cardId) 
                ? prev.filter(id => id !== cardId)
                : [...prev, cardId]
        );
    };

    // Muhtemel X analizi
    const analyzePotentialX = (Y: string, X: string) => {
        const potentialResults: PotentialXResult[] = [];

        // Y ile sürpriz yapan diğer takımları bul
        const otherTeams = new Set<string>();
        matchData
            .filter(m => 
                (m.HomeTeam === Y || m.AwayTeam === Y) &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
            )
            .forEach(m => {
                const opponent = m.HomeTeam === Y ? m.AwayTeam : m.HomeTeam;
                if (opponent !== X) {  // X'i hariç tut
                    otherTeams.add(opponent);
                }
            });

        otherTeams.forEach(potentialX => {
            // Bu takımın Y ile sürpriz maçlarını bul
            const surpriseMatches = matchData
                .filter(m => 
                    ((m.HomeTeam === potentialX && m.AwayTeam === Y) || 
                     (m.HomeTeam === Y && m.AwayTeam === potentialX)) &&
                    ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date));

            surpriseMatches.forEach(surpriseMatch => {
                const matchDate = new Date((surpriseMatch.Date - 25569) * 86400 * 1000);
                const matchSeason = calculateSeason(matchDate);

                // Sürpriz sezonundaki maçları al
                const previousMatches = matchData
                    .filter(m => 
                        (m.HomeTeam === potentialX || m.AwayTeam === potentialX) &&
                        calculateSeason(new Date((m.Date - 25569) * 86400 * 1000)) === matchSeason &&
                        Number(m.Date) <= Number(surpriseMatch.Date)
                    )
                    .sort((a, b) => Number(b.Date) - Number(a.Date))
                    .map((match, index) => ({
                        date: formatDate(Number(match.Date)),
                        homeTeam: match.HomeTeam,
                        awayTeam: match.AwayTeam,
                        score: `${match.FTHG}-${match.FTAG}`,
                        matchNumber: index + 1
                    }));

                // X'in bu sezonki maçlarıyla karşılaştır
                const currentXMatches = matchData
                    .filter(m => 
                        m.Div === league &&
                        (m.HomeTeam === X || m.AwayTeam === X) &&
                        calculateSeason(new Date((m.Date - 25569) * 86400 * 1000)) === season
                    )
                    .sort((a, b) => Number(b.Date) - Number(a.Date))
                    .map((match, index) => ({
                        date: formatDate(Number(match.Date)),
                        homeTeam: match.HomeTeam,
                        awayTeam: match.AwayTeam,
                        score: `${match.FTHG}-${match.FTAG}`,
                        matchNumber: index + 1
                    }));

                // Eşleşen maçları bul
                const matchingMatches = currentXMatches.filter(currMatch =>
                    previousMatches.some(prevMatch =>
                        prevMatch.score === currMatch.score &&
                        ((prevMatch.homeTeam === currMatch.homeTeam && prevMatch.awayTeam === currMatch.awayTeam) ||
                         (prevMatch.homeTeam === currMatch.awayTeam && prevMatch.awayTeam === currMatch.homeTeam))
                    )
                );

                if (matchingMatches.length > 0) {
                    potentialResults.push({
                        team: potentialX,
                        season: matchSeason,
                        surpriseMatch: {
                            date: formatDate(Number(surpriseMatch.Date)),
                            score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`,
                            homeTeam: surpriseMatch.HomeTeam,
                            awayTeam: surpriseMatch.AwayTeam
                        },
                        previousMatches,
                        matchingCurrentMatches: matchingMatches
                    });
                }
            });
        });

        setPotentialXResults(potentialResults);
    };

    // Muhtemel Y analizi
    const analyzePotentialY = (X: string, Y: string) => {
        const potentialResults: PotentialYResult[] = [];

        // X'in Y dışındaki sürpriz maçlarını bul
        const surpriseMatches = matchData
            .filter(m => 
                (m.HomeTeam === X || m.AwayTeam === X) &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')) &&
                m.HomeTeam !== Y && m.AwayTeam !== Y  // Y ile olan maçları hariç tut
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        surpriseMatches.forEach(surpriseMatch => {
            const potentialY = surpriseMatch.HomeTeam === X ? surpriseMatch.AwayTeam : surpriseMatch.HomeTeam;
            const matchDate = new Date((surpriseMatch.Date - 25569) * 86400 * 1000);
            const matchSeason = calculateSeason(matchDate);

            // Sürpriz sezonundaki maçları al
            const previousMatches = matchData
                .filter(m => 
                    (m.HomeTeam === X || m.AwayTeam === X) &&
                    calculateSeason(new Date((m.Date - 25569) * 86400 * 1000)) === matchSeason &&
                    Number(m.Date) <= Number(surpriseMatch.Date)
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date))
                .map((match, index) => ({
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    score: `${match.FTHG}-${match.FTAG}`,
                    matchNumber: index + 1
                }));

            // X'in bu sezonki maçlarıyla karşılaştır
            const currentMatches = matchData
                .filter(m => 
                    m.Div === league &&
                    (m.HomeTeam === X || m.AwayTeam === X) &&
                    calculateSeason(new Date((m.Date - 25569) * 86400 * 1000)) === season
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date))
                .map((match, index) => ({
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    score: `${match.FTHG}-${match.FTAG}`,
                    matchNumber: index + 1
                }));

            // Eşleşen maçları bul
            const matchingMatches = currentMatches.filter(currMatch =>
                previousMatches.some(prevMatch =>
                    prevMatch.score === currMatch.score &&
                    ((prevMatch.homeTeam === currMatch.homeTeam && prevMatch.awayTeam === currMatch.awayTeam) ||
                     (prevMatch.homeTeam === currMatch.awayTeam && prevMatch.awayTeam === currMatch.homeTeam))
                )
            );

            if (matchingMatches.length > 0) {
                potentialResults.push({
                    team: potentialY,
                    season: matchSeason,
                    surpriseMatch: {
                        date: formatDate(Number(surpriseMatch.Date)),
                        score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`,
                        homeTeam: surpriseMatch.HomeTeam,
                        awayTeam: surpriseMatch.AwayTeam
                    },
                    previousMatches,
                    matchingCurrentMatches: matchingMatches
                });
            }
        });

        setPotentialYResults(potentialResults);
    };

    const startAnalysis = () => {
        if (selectedTeams.length !== 2) return;
        const [X, Y] = selectedTeams;
        const newResults: PatternResult[] = [];  // results yerine yeni bir array oluştur

        // X'in Y ile olan sürpriz maçlarını bul
        const surpriseMatches = matchData
            .filter(m => 
                ((m.HomeTeam === X && m.AwayTeam === Y) || 
                 (m.HomeTeam === Y && m.AwayTeam === X)) &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        surpriseMatches.forEach(surpriseMatch => {
            const matchDate = new Date((surpriseMatch.Date - 25569) * 86400 * 1000);
            const matchSeason = calculateSeason(matchDate);

            // Sürpriz sezonundaki X'in tüm maçlarını al
            const previousMatches = matchData
                .filter(m => 
                    (m.HomeTeam === X || m.AwayTeam === X) &&
                    calculateSeason(new Date((m.Date - 25569) * 86400 * 1000)) === matchSeason &&
                    Number(m.Date) <= Number(surpriseMatch.Date)
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date))
                .map((match, index) => ({
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    score: `${match.FTHG}-${match.FTAG}`,
                    matchNumber: index + 1
                }));

            // Güncel sezonun maçlarını al
            const currentSeasonMatches = matchData
                .filter(m => 
                    m.Div === league &&
                    (m.HomeTeam === X || m.AwayTeam === X) &&
                    calculateSeason(new Date((m.Date - 25569) * 86400 * 1000)) === season
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date))
                .map((match, index) => ({
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    score: `${match.FTHG}-${match.FTAG}`,
                    matchNumber: index + 1
                }));

            // Skor ve rakip eşleşmelerini bul
            const matchingPairs: {previous: number, current: number}[] = [];
            
            previousMatches.forEach(prevMatch => {
                currentSeasonMatches.forEach(currMatch => {
                    if (
                        prevMatch.score === currMatch.score &&
                        ((prevMatch.homeTeam === currMatch.homeTeam && prevMatch.awayTeam === currMatch.awayTeam) ||
                         (prevMatch.homeTeam === currMatch.awayTeam && prevMatch.awayTeam === currMatch.homeTeam))
                    ) {
                        matchingPairs.push({
                            previous: prevMatch.matchNumber,
                            current: currMatch.matchNumber
                        });
                    }
                });
            });

            if (matchingPairs.length > 0) {
                newResults.push({
                    season: matchSeason,
                    surpriseMatch: {
                        date: formatDate(Number(surpriseMatch.Date)),
                        score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`,
                        homeTeam: surpriseMatch.HomeTeam,
                        awayTeam: surpriseMatch.AwayTeam
                    },
                    previousMatches,
                    currentSeasonMatches,
                    matchingPairs
                });
            }
        });

        setResults(newResults);  // Yeni sonuçları state'e kaydet
        if (selectedTeams.length === 2) {
            analyzePotentialX(selectedTeams[1]!, selectedTeams[0]!);
            analyzePotentialY(selectedTeams[0]!, selectedTeams[1]!);
        }
        setStep('results');
    };

    // Sezon seçici kısmı
    const seasonOptions = useMemo(() => {
        return seasons.map(season => ({
            value: season,
            label: `${season} ${results.some(r => r.season === season) ? '(Sürpriz Var)' : ''}`
        }));
    }, [seasons, results]);

    // Skor bazlı analiz
    const analyzeByScore = () => {
        if (!selectedScore || !selectedOpponent || !selectedTeams[0]) return;
        
        const X = selectedTeams[0];
        const results: ScoreBasedResult[] = [];

        // X'in tüm sezonlardaki maçlarını al
        const allMatches = matchData
            .filter(m => m.HomeTeam === X || m.AwayTeam === X)
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        // Her maç için kontrol et
        allMatches.forEach((match, idx) => {
            const score = `${match.FTHG}-${match.FTAG}`;
            const opponent = match.HomeTeam === X ? match.AwayTeam : match.HomeTeam;
            
            // Skor ve rakip eşleşiyor mu?
            if (score === selectedScore && 
                (selectedOpponent === 'any' || opponent === selectedOpponent)) {
                
                // Bu maçtan sonraki sürpriz maçı bul
                const matchDate = Number(match.Date);
                const seasonEndDate = matchDate + 200; // Yaklaşık bir sezon
                
                const nextSurprise = allMatches.find((m, nextIdx) => {
                    if (nextIdx <= idx) return false;
                    if (Number(m.Date) > seasonEndDate) return false;
                    
                    return (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                });

                if (nextSurprise) {
                    // Kaç maç sonra sürpriz olmuş?
                    const matchesBetween = allMatches
                        .filter(m => 
                            Number(m.Date) > matchDate && 
                            Number(m.Date) <= Number(nextSurprise.Date)
                        ).length;

                    results.push({
                        team: X,
                        season: calculateSeason(new Date((match.Date - 25569) * 86400 * 1000)),
                        matchWithScore: {
                            date: formatDate(Number(match.Date)),
                            homeTeam: match.HomeTeam,
                            awayTeam: match.AwayTeam,
                            score,
                            opponent
                        },
                        surpriseMatch: {
                            date: formatDate(Number(nextSurprise.Date)),
                            homeTeam: nextSurprise.HomeTeam,
                            awayTeam: nextSurprise.AwayTeam,
                            score: `${nextSurprise.FTHG}-${nextSurprise.FTAG}`,
                            matchesAfter: matchesBetween
                        }
                    });
                }
            }
        });

        setScoreBasedResults(results);
    };

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col">
            <div className="flex-none">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={step === 'team-select' ? onClose : () => setStep('team-select')}
                        className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h2 className="text-xl font-semibold text-white">
                        Skor Örüntüsü Analizi
                    </h2>
                </div>

                {step === 'results' && (
                    <div className="mb-6">
                        <select
                            value={selectedSeason || ''}
                            onChange={(e) => setSelectedSeason(e.target.value || null)}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500"
                        >
                            <option value="">Tüm Sezonlar</option>
                            {seasonOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Sekmeler */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('pattern')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'pattern' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    Örüntü Analizi
                </button>
                <button
                    onClick={() => setActiveTab('score-based')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'score-based' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                    Skor Bazlı Analiz
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'pattern' ? (
                    <PatternResults 
                        step={step}
                        teams={teams}
                        selectedTeams={selectedTeams}
                        results={results}
                        selectedSeason={selectedSeason}
                        season={season}
                        openCards={openCards}
                        onTeamSelect={handleTeamSelect}
                        onTeamRemove={removeTeam}
                        onAnalyze={startAnalysis}
                        toggleCard={toggleCard}
                        groupedResults={groupedResults}
                    />
                ) : (
                    <ScoreBasedAnalysis 
                        teams={teams}
                        selectedScore={selectedScore}
                        selectedOpponent={selectedOpponent}
                        scoreBasedResults={scoreBasedResults}
                        onScoreChange={setSelectedScore}
                        onOpponentChange={setSelectedOpponent}
                        onAnalyze={analyzeByScore}
                        selectedTeams={selectedTeams}
                    />
                )}
            </div>
        </div>
    );
} 