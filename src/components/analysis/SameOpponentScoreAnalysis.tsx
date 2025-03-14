import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Loader2, Calendar, X } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';

interface AnalysisResult {
    team: string;
    currentMatch: {
        season: string;
        date: string;
        opponent: string;
        score: string;
        isHome: boolean;
    };
    historicalPattern: {
        season: string;
        date: string;
        opponent: string;
        score: string;
        isHome: boolean;
        matchesUntilSurprise: number;
        surpriseMatch: {
            opponent: string;
            date: string;
            score: string;
            htScore: string;
            isHome: boolean;
        };
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

// Takım Seçim Modalı
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
    selectedTeams: string[];
    title: string;
}> = ({ isOpen, onClose, teams, onSelect, selectedTeams, title }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTeams = teams
        .filter(team => !selectedTeams.includes(team))
        .filter(team => 
            team.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white">{title}</h2>
                        <p className="text-gray-400 mt-2">
                            {selectedTeams.length === 0 ? "X Takımını Seçin" : "Y Takımını Seçin"}
                        </p>

                        {/* Arama Kutusu */}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Takım ara..."
                            className="w-full mt-4 px-4 py-2 bg-gray-800 border border-gray-700 
                                     rounded-lg text-white placeholder-gray-500"
                        />
                    </div>

                    {/* Takım Grid - Scrollable alan */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-4 gap-4">
                            {filteredTeams.map(team => (
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
};

// LoadingSpinner komponentini ekleyelim
const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
    </div>
);

// NoResults komponentini de ekleyelim
const NoResults: React.FC<{ teamX: string; teamY: string }> = ({ teamX, teamY }) => (
    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
        <p className="text-gray-400">
            {teamX} ve {teamY} arasında sürpriz maç bulunamadı.
        </p>
    </div>
);

// Pattern interface'ini güncelle
interface PatternMatch {
    season: string;
    date: string;
    score: string;
    isHome: boolean;
    matchesUntilSurprise?: number;
    isSurprise?: boolean; // Sürpriz maç kontrolü için
    isCurrentSeason?: boolean; // Güncel sezon kontrolü için
}

interface Pattern {
    opponent: string;
    matches: PatternMatch[];
}

// Header komponentini ekle
const Header: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="flex items-center justify-between p-6 border-b border-gray-800">
        <div>
            <h2 className="text-xl font-semibold text-white">
                Aynı Rakipten Gelen Skor Analizi
            </h2>
            <p className="text-sm text-gray-400 mt-1">
                Seçilen tarihe kadar olan maçlarda benzer skor örüntülerini analiz eder
            </p>
        </div>
        <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-400 transition-colors"
        >
            <X className="w-6 h-6" />
        </button>
    </div>
);

// calculateMatchesBetween fonksiyonunu düzelt
const calculateMatchesBetween = (
    team: string,
    startDate: number,
    endDate: number,
    season: string,
    matches: any[]
): number => {
    // Sadece belirtilen tarihler arasındaki maçları al
    const teamMatches = matches.filter(m => {
        const matchDate = Number(m.Date);
        const isTeamMatch = m.HomeTeam === team || m.AwayTeam === team;
        const isInDateRange = matchDate > startDate && matchDate < endDate;
        const isSameSeason = getSeasonFromDate(matchDate) === season;
        
        return isTeamMatch && isInDateRange && isSameSeason;
    }).sort((a, b) => Number(a.Date) - Number(b.Date));

    // Debug için maçları logla
    console.log('Aradaki Maçlar:', {
        team,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        matches: teamMatches.map(m => ({
            date: formatDate(Number(m.Date)),
            match: `${m.HomeTeam} vs ${m.AwayTeam}`,
            count: teamMatches.indexOf(m) + 1
        }))
    });

    return teamMatches.length;
};

// Skor eşleşme kontrolünü kaldıralım ve sadece rakip kontrolü yapalım
const analyzePotentialSurprise = (
    teamX: string,
    teamY: string,
    matchData: any[],
    targetDate: number,
    matchCounts?: {[key: string]: number}
) => {
    const sortedMatches = [...matchData].sort((a, b) => Number(a.Date) - Number(b.Date));
    const currentSeason = getSeasonFromDate(targetDate);

    const results: AnalysisResult[] = [];

    [teamX, teamY].forEach(team => {
        const currentMatchCount = matchCounts ? matchCounts[team] : 
            matchData.filter(m => 
                (m.HomeTeam === team || m.AwayTeam === team) &&
                getSeasonFromDate(Number(m.Date)) === currentSeason &&
                Number(m.Date) <= targetDate
            ).length;

        // Hedef tarihe kadar olan maç sayısını hesapla
        const currentSeasonMatches = sortedMatches.filter(m =>
            (m.HomeTeam === team || m.AwayTeam === team) &&
            getSeasonFromDate(Number(m.Date)) === currentSeason &&
            Number(m.Date) < targetDate
        );

        console.log(`${team} için bu sezon maçları:`, {
            matchCount: currentSeasonMatches.length,
            matches: currentSeasonMatches.map(m => ({
                date: formatDate(Number(m.Date)),
                opponent: m.HomeTeam === team ? m.AwayTeam : m.HomeTeam,
                score: `${m.FTHG}-${m.FTAG}`
            }))
        });

        currentSeasonMatches.forEach(currentMatch => {
            const opponent = currentMatch.HomeTeam === team ? 
                currentMatch.AwayTeam : currentMatch.HomeTeam;
            const isHome = currentMatch.HomeTeam === team;

            // Geçmiş sezonlardaki aynı rakiple olan maçları bul
            const historicalMatches = sortedMatches.filter(m => {
                const sameTeams = (m.HomeTeam === team && m.AwayTeam === opponent) ||
                                (m.AwayTeam === team && m.HomeTeam === opponent);
                const differentSeason = getSeasonFromDate(Number(m.Date)) !== currentSeason;
                return sameTeams && differentSeason;
            });

            console.log(`${team} - ${opponent} maçı için pattern aranıyor:`, {
                historicalMatchCount: historicalMatches.length,
                currentMatchCount
            });

            historicalMatches.forEach(historicalMatch => {
                const historicalSeason = getSeasonFromDate(Number(historicalMatch.Date));
                
                const nextSurprise = sortedMatches.find(m => {
                    const isAfter = Number(m.Date) > Number(historicalMatch.Date);
                    const sameSeason = getSeasonFromDate(Number(m.Date)) === historicalSeason;
                    const isTeamInvolved = m.HomeTeam === team || m.AwayTeam === team;
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || 
                                     (m.HTR === 'A' && m.FTR === 'H');
                    return isAfter && sameSeason && isTeamInvolved && isSurprise;
                });

                if (nextSurprise) {
                    const matchesUntilSurprise = calculateMatchesBetween(
                        team,
                        Number(historicalMatch.Date),
                        Number(nextSurprise.Date),
                        historicalSeason,
                        sortedMatches
                    );

                    console.log(`${team} için detaylı maç sayısı kontrolü:`, {
                        team,
                        opponent,
                        patternDate: formatDate(Number(historicalMatch.Date)),
                        surpriseDate: formatDate(Number(nextSurprise.Date)),
                        aradakiMaçlar: sortedMatches
                            .filter(m => {
                                const matchDate = Number(m.Date);
                                const isTeamMatch = m.HomeTeam === team || m.AwayTeam === team;
                                const isInDateRange = matchDate > Number(historicalMatch.Date) && 
                                                   matchDate < Number(nextSurprise.Date);
                                const isSameSeason = getSeasonFromDate(matchDate) === historicalSeason;
                                
                                return isTeamMatch && isInDateRange && isSameSeason;
                            })
                            .map(m => ({
                                date: formatDate(Number(m.Date)),
                                opponent: m.HomeTeam === team ? m.AwayTeam : m.HomeTeam,
                                score: `${m.FTHG}-${m.FTAG}`
                            })),
                        matchesUntilSurprise,
                        currentMatchCount
                    });

                    // Sadece maç sayısı eşleşiyorsa ekle
                    if (matchesUntilSurprise === currentMatchCount) {
                        results.push({
                            team,
                            currentMatch: {
                                season: currentSeason,
                                date: formatDate(Number(currentMatch.Date)),
                                opponent,
                                score: `${currentMatch.FTHG}-${currentMatch.FTAG}`,
                                isHome
                            },
                            historicalPattern: {
                                season: historicalSeason,
                                date: formatDate(Number(historicalMatch.Date)),
                                opponent,
                                score: `${historicalMatch.FTHG}-${historicalMatch.FTAG}`,
                                isHome: historicalMatch.HomeTeam === team,
                                matchesUntilSurprise,
                                surpriseMatch: {
                                    opponent: nextSurprise.HomeTeam === team ? 
                                        nextSurprise.AwayTeam : nextSurprise.HomeTeam,
                                    date: formatDate(Number(nextSurprise.Date)),
                                    score: `${nextSurprise.FTHG}-${nextSurprise.FTAG}`,
                                    htScore: `${nextSurprise.HTHG}-${nextSurprise.HTAG}`,
                                    isHome: nextSurprise.HomeTeam === team
                                }
                            }
                        });
                    }
                }
            });
        });
    });

    return results;
};

// Pattern bulma fonksiyonunda sürpriz kontrolünü ekle
const isSurpriseMatch = (match: any) => {
    return (match.HTR === 'H' && match.FTR === 'A') || 
           (match.HTR === 'A' && match.FTR === 'H');
};

// Pattern kartını güncelleyelim
const PatternCard: React.FC<{
    match: PatternMatch;
    currentSeason: string;
}> = ({ match, currentSeason }) => {
    // Kart rengini belirle
    const getCardStyle = () => {
        if (match.isSurprise) {
            return "bg-purple-900/20 border border-purple-900/30";
        }
        if (match.isCurrentSeason) {
            return "bg-yellow-900/20 border border-yellow-900/30";
        }
        return "bg-gray-800/50 border border-gray-700/30";
    };

    // Metin rengini belirle
    const getTextStyle = () => {
        if (match.isSurprise) {
            return "text-purple-400";
        }
        if (match.isCurrentSeason) {
            return "text-yellow-400";
        }
        return "text-gray-400";
    };

    return (
        <div className={`${getCardStyle()} rounded-lg p-3 text-sm`}>
            <div className="flex justify-between items-center">
                <span className={getTextStyle()}>{match.season}</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {match.isHome ? "Ev" : "Dep"}
                    </span>
                    <span className="text-white">{match.score}</span>
                </div>
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-gray-500 text-xs">{match.date}</span>
                {match.matchesUntilSurprise !== undefined && (
                    <span className="text-xs text-gray-400">
                        {match.matchesUntilSurprise} maç sonra sürpriz
                    </span>
                )}
            </div>
        </div>
    );
};

// Pattern bulma fonksiyonunda güncellemeler
const findTeamPatterns = (
    team: string, 
    seasons: string[], 
    matches: any[],
    surpriseDate: number
) => {
    const patterns: Pattern[] = [];

    // Her sezon için takımın maçlarını bul
    const seasonMatches = seasons.map(season => {
        // O sezondaki tüm takımları bul
        const seasonTeams = new Set<string>();
        matches
            .filter(m => getSeasonFromDate(Number(m.Date)) === season)
            .forEach(m => {
                seasonTeams.add(m.HomeTeam);
                seasonTeams.add(m.AwayTeam);
            });

        return {
            season,
            teams: seasonTeams,
            matches: matches.filter(m => 
                getSeasonFromDate(Number(m.Date)) === season &&
                (m.HomeTeam === team || m.AwayTeam === team) &&
                Number(m.Date) < surpriseDate
            ).sort((a, b) => Number(a.Date) - Number(b.Date))
        };
    });

    // Her rakip için skorları karşılaştır
    const opponents = new Set(seasonMatches.flatMap(s => 
        s.matches.map(m => m.HomeTeam === team ? m.AwayTeam : m.HomeTeam)
    ));

    opponents.forEach(opponent => {
        // Her sezon için rakibin maçlarını bul
        const opponentMatches = seasonMatches
            .filter(s => s.teams.has(opponent)) // Sadece rakibin ligde olduğu sezonlar
            .map(s => ({
                season: s.season,
                match: s.matches.find(m => 
                    m.HomeTeam === opponent || m.AwayTeam === opponent
                ),
                allTeamMatches: s.matches // Maç sayısı hesabı için tüm maçlar
            }))
            .filter(m => m.match);

        if (opponentMatches.length < 2) return;

        // Skorları karşılaştır
        for (let i = 0; i < opponentMatches.length; i++) {
            for (let j = i + 1; j < opponentMatches.length; j++) {
                const match1 = opponentMatches[i].match;
                const match2 = opponentMatches[j].match;

                const score1 = `${match1.FTHG}-${match1.FTAG}`;
                const score2 = `${match2.FTHG}-${match2.FTAG}`;

                if (score1 === score2) {
                    // Sürprize kadar olan maç sayısını hesapla
                    const calculateMatchesUntil = (match: any, matches: any[]) => {
                        const matchDate = Number(match.Date);
                        return matches.filter(m => 
                            Number(m.Date) > matchDate && 
                            Number(m.Date) < surpriseDate
                        ).length;
                    };

                    // Güncel sezonu belirle
                    const currentSeason = new Date().getFullYear() + "-" + (new Date().getFullYear() + 1);
                    
                    patterns.push({
                        opponent,
                        matches: [
                            {
                                season: opponentMatches[i].season,
                                date: formatDate(Number(match1.Date)),
                                score: score1,
                                isHome: match1.HomeTeam === team,
                                matchesUntilSurprise: calculateMatchesUntil(
                                    match1, 
                                    opponentMatches[i].allTeamMatches
                                ),
                                isSurprise: isSurpriseMatch(match1),
                                isCurrentSeason: opponentMatches[i].season === currentSeason
                            },
                            {
                                season: opponentMatches[j].season,
                                date: formatDate(Number(match2.Date)),
                                score: score2,
                                isHome: match2.HomeTeam === team,
                                matchesUntilSurprise: calculateMatchesUntil(
                                    match2, 
                                    opponentMatches[j].allTeamMatches
                                ),
                                isSurprise: isSurpriseMatch(match2),
                                isCurrentSeason: opponentMatches[j].season === currentSeason
                            }
                        ]
                    });
                }
            }
        }
    });

    return patterns;
};

// ResultsDisplay komponentini güncelleyelim
const ResultsDisplay: React.FC<{
    teamX: string;
    teamY: string;
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
    matchNumber?: number | null;
}> = ({ teamX, teamY, results, onBack, isAnalyzing, matchNumber }) => {
    if (isAnalyzing) {
        return <LoadingSpinner />;
    }

    const teamXResults = results.filter(r => r.team === teamX);
    const teamYResults = results.filter(r => r.team === teamY);

    const renderResults = (results: AnalysisResult[]) => (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
            {results.map((result, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                    {/* Pattern Maçı */}
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-400">{result.historicalPattern.season}</span>
                            <span className="text-gray-400">{result.historicalPattern.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TeamLogo name={result.historicalPattern.opponent} className="w-6 h-6" />
                                <span className="text-white">{result.historicalPattern.opponent}</span>
                            </div>
                            <span className="text-white">
                                {result.historicalPattern.isHome ? result.historicalPattern.score : 
                                    result.historicalPattern.score.split('-').reverse().join('-')}
                            </span>
                        </div>
                    </div>

                    {/* Sürpriz Maç */}
                    <div className="text-sm text-gray-400">
                        {result.historicalPattern.matchesUntilSurprise} maç sonra sürpriz:
                    </div>
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2">
                                <TeamLogo name={result.historicalPattern.surpriseMatch.opponent} className="w-6 h-6" />
                                <span className="text-white">
                                    {result.historicalPattern.surpriseMatch.opponent}
                                </span>
                            </div>
                            <span className="text-gray-400">{result.historicalPattern.surpriseMatch.date}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">Devre Arası</span>
                            <span className="text-white">
                                {result.historicalPattern.surpriseMatch.isHome ? 
                                    result.historicalPattern.surpriseMatch.htScore :
                                    result.historicalPattern.surpriseMatch.htScore.split('-').reverse().join('-')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400">Maç Sonu</span>
                            <span className="text-white">
                                {result.historicalPattern.surpriseMatch.isHome ?
                                    result.historicalPattern.surpriseMatch.score :
                                    result.historicalPattern.surpriseMatch.score.split('-').reverse().join('-')}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center text-purple-500 hover:text-purple-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Geri Dön
                </button>
                {matchNumber && (
                    <div className="text-gray-400">
                        Maç Sayısı: {matchNumber}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* X Takımı Sonuçları */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TeamLogo name={teamX} className="w-6 h-6" />
                        {teamX} Sonuçları
                        <span className="text-sm font-normal text-gray-400">
                            ({teamXResults.length} sonuç)
                        </span>
                    </h3>
                    {renderResults(teamXResults)}
                </div>

                {/* Y Takımı Sonuçları */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TeamLogo name={teamY} className="w-6 h-6" />
                        {teamY} Sonuçları
                        <span className="text-sm font-normal text-gray-400">
                            ({teamYResults.length} sonuç)
                        </span>
                    </h3>
                    {renderResults(teamYResults)}
                </div>
            </div>
        </div>
    );
};

// Yeni interface'ler
interface SurpriseMatch {
    date: string;
    excelDate: number;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
}

// Gerçekleşmiş Sürprizler Modalı
const ExistingSurprisesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (match: SurpriseMatch) => void;
    matchData: any[];
    league: string;
    season: string;
}> = ({ isOpen, onClose, onSelect, matchData, league, season }) => {
    const surprises = useMemo(() => {
        const matches = matchData
            .filter(m => 
                m.Div === league && 
                getSeasonFromDate(Number(m.Date)) === season &&
                ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        return matches.map(match => {
            // Her takım için o maça kadar olan maç sayısını hesapla
            const previousMatches = matchData.filter(m => 
                (m.HomeTeam === match.HomeTeam || m.AwayTeam === match.HomeTeam ||
                 m.HomeTeam === match.AwayTeam || m.AwayTeam === match.AwayTeam) &&
                getSeasonFromDate(Number(m.Date)) === season &&
                Number(m.Date) < Number(match.Date)
            );

            return {
                date: formatDate(Number(match.Date)),
                excelDate: Number(match.Date),
                homeTeam: match.HomeTeam,
                awayTeam: match.AwayTeam,
                htScore: `${match.HTHG}-${match.HTAG}`,
                ftScore: `${match.FTHG}-${match.FTAG}`,
                previousMatchCount: previousMatches.length
            };
        });
    }, [matchData, league, season]);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white">
                            Gerçekleşmiş Sürprizler
                        </h2>
                        <p className="text-gray-400 mt-2">
                            Analiz etmek istediğiniz sürpriz maçı seçin
                        </p>
                    </div>

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-4">
                            {surprises.map((surprise, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelect({
                                        date: surprise.date,
                                        excelDate: surprise.excelDate,
                                        matchNumber: idx + 1,
                                        homeTeam: surprise.homeTeam,
                                        awayTeam: surprise.awayTeam,
                                        htScore: surprise.htScore,
                                        ftScore: surprise.ftScore
                                    })}
                                    className="w-full p-4 bg-gray-800/50 hover:bg-gray-800/70 
                                             rounded-xl transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <TeamLogo name={surprise.homeTeam} className="w-8 h-8" />
                                            <span className="text-xl text-white">vs</span>
                                            <TeamLogo name={surprise.awayTeam} className="w-8 h-8" />
                                        </div>
                                        <div className="text-right">
                                            <div>
                                                <span className="text-yellow-400">{surprise.htScore}</span>
                                                <span className="text-gray-500 mx-2">→</span>
                                                <span className="text-green-400">{surprise.ftScore}</span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {surprise.date} ({surprise.homeTeam}: {surprise.previousMatchCount}. maç)
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// DateSelectionModal yerine MatchNumberSelectionModal oluşturalım
const MatchNumberSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (date: number, matchCounts: {[key: string]: number}) => void;
    matchData: any[];
    league: string;
    season: string;
    selectedTeams: string[];
}> = ({ isOpen, onClose, onSelect, matchData, selectedTeams }) => {
    const [teamXMatchNumber, setTeamXMatchNumber] = useState<number>(0);
    const [teamYMatchNumber, setTeamYMatchNumber] = useState<number>(0);

    const handleSelect = () => {
        if (teamXMatchNumber <= 0 || teamYMatchNumber <= 0) return;

        // Şu anki tarihi Excel formatına çevir (sadece referans için)
        const currentDate = Math.floor((new Date().getTime() / 86400000) + 25569);
        
        const matchCounts = {
            [selectedTeams[0]]: teamXMatchNumber,
            [selectedTeams[1]]: teamYMatchNumber
        };

        onSelect(currentDate, matchCounts);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md bg-gray-900 rounded-xl">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Maç Numaralarını Girin
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">
                                    {selectedTeams[0]} için bu sezon kaçıncı maç olacak?
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={teamXMatchNumber || ''}
                                    onChange={(e) => setTeamXMatchNumber(Number(e.target.value))}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 
                                             rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 block mb-2">
                                    {selectedTeams[1]} için bu sezon kaçıncı maç olacak?
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={teamYMatchNumber || ''}
                                    onChange={(e) => setTeamYMatchNumber(Number(e.target.value))}
                                    className="w-full p-3 bg-gray-800 border border-gray-700 
                                             rounded-lg text-white"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSelect}
                            disabled={teamXMatchNumber <= 0 || teamYMatchNumber <= 0}
                            className="w-full py-3 mt-6 bg-purple-600 hover:bg-purple-700 
                                     disabled:bg-purple-600/50 disabled:cursor-not-allowed
                                     text-white rounded-lg transition-colors"
                        >
                            Onayla
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// Ana komponenti güncelle
export const SameOpponentScoreAnalysis: React.FC<{
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}> = ({ league, season, matchData, onClose }) => {
    const [mode, setMode] = useState<'existing' | 'potential'>('potential');
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [showDateSelection, setShowDateSelection] = useState(false);
    const [showExistingSurprises, setShowExistingSurprises] = useState(false);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [matchNumber, setMatchNumber] = useState<number | null>(null);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            if (mode === 'potential') {
                setShowTeamSelection(false);
                setShowDateSelection(true);
            } else {
                startAnalysis(newSelectedTeams[0], newSelectedTeams[1]);
            }
        }
    };

    const handleDateSelect = (date: number, matchCounts: {[key: string]: number}) => {
        setSelectedDate(date);
        // Her iki takımın maç sayısının ortalamasını al
        const avgMatchCount = Math.floor(
            (matchCounts[selectedTeams[0]] + matchCounts[selectedTeams[1]]) / 2
        );
        setMatchNumber(avgMatchCount);
        setShowDateSelection(false);
        startAnalysis(selectedTeams[0], selectedTeams[1], date, matchCounts);
    };

    const handleExistingSurpriseSelect = (surprise: SurpriseMatch) => {
        setMode('existing');
        setShowExistingSurprises(false);
        setSelectedTeams([surprise.homeTeam, surprise.awayTeam]);
        
        // Sürpriz maçından önceki son maçın tarihini bul
        const previousMatches = matchData
            .filter(m => 
                (m.HomeTeam === surprise.homeTeam || m.AwayTeam === surprise.homeTeam ||
                 m.HomeTeam === surprise.awayTeam || m.AwayTeam === surprise.awayTeam) &&
                getSeasonFromDate(Number(m.Date)) === season &&
                Number(m.Date) < surprise.excelDate
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        const lastMatchDate = previousMatches[0]?.Date || surprise.excelDate;
        
        console.log('Gerçekleşmiş Sürpriz Seçildi:', {
            surprise,
            lastMatchDate: formatDate(Number(lastMatchDate)),
            previousMatchCount: previousMatches.length
        });

        setSelectedDate(Number(lastMatchDate));
        setMatchNumber(previousMatches.length);
        startAnalysis(surprise.homeTeam, surprise.awayTeam, Number(lastMatchDate));
    };

    const startAnalysis = async (teamX: string, teamY: string, date?: number, matchCounts?: {[key: string]: number}) => {
        setIsAnalyzing(true);
        setShowTeamSelection(false);

        // Eğer matchCounts verilmişse yeni analiz mantığını kullan
        if (matchCounts) {
            const teamXResults = analyzeTeam(teamX, matchCounts[teamX], matchData);
            const teamYResults = analyzeTeam(teamY, matchCounts[teamY], matchData);
            setResults([...teamXResults, ...teamYResults]);
        } else {
            // Gerçekleşmiş sürprizler için eski analiz mantığını kullan
            const analysisResults = analyzePotentialSurprise(
                teamX,
                teamY,
                matchData,
                date || new Date().getTime()
            );
            setResults(analysisResults);
        }

        setIsAnalyzing(false);
    };

    const handleBack = () => {
        setSelectedTeams([]);
        setResults([]);
        setSelectedDate(null);
        setMatchNumber(null);
        setShowTeamSelection(true);
        setMode('potential');
    };

    // Analiz fonksiyonunu bileşen içine taşıdık
    const analyzeTeam = (team: string, currentMatchNumber: number, matchData: any[]) => {
        const results: AnalysisResult[] = [];
        
        // Son 3 sezonu hesapla
        const [currentSeasonYear] = season.split('-').map(Number);
        const lastThreeSeasons = [
            `${currentSeasonYear-2}-${currentSeasonYear-1}`,
            `${currentSeasonYear-1}-${currentSeasonYear}`,
            season
        ];

        // Bir maçın sürpriz olup olmadığını kontrol eden yardımcı fonksiyon
        const isSurpriseMatch = (match: any, isTeamHome: boolean) => {
            const [htHome, htAway] = match.HTHG !== undefined ? [Number(match.HTHG), Number(match.HTAG)] : [0, 0];
            const [ftHome, ftAway] = [Number(match.FTHG), Number(match.FTAG)];
            
            if (isTeamHome) {
                return (htHome > htAway && ftHome < ftAway) || (htHome < htAway && ftHome > ftAway);
            } else {
                return (htHome < htAway && ftHome > ftAway) || (htHome > htAway && ftHome < ftAway);
            }
        };

        // Bu sezon oynanan maçları bul
        const currentSeasonMatches = matchData
            .filter(m => 
                (m.HomeTeam === team || m.AwayTeam === team) &&
                getSeasonFromDate(Number(m.Date)) === season
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        // Her rakip için kontrol et
        const opponents = new Set(currentSeasonMatches.map(m => 
            m.HomeTeam === team ? m.AwayTeam : m.HomeTeam
        ));

        opponents.forEach(opponent => {
            // Bu sezon bu rakiple olan son maçı bul
            const currentMatch = currentSeasonMatches.find(m =>
                (m.HomeTeam === opponent || m.AwayTeam === opponent)
            );

            if (!currentMatch) return;

            // Bu maçın sezon içindeki sıra numarasını bul
            const currentMatchIndex = currentSeasonMatches.indexOf(currentMatch);
            
            // Seçilen maça kaç maç kaldığını hesapla
            const matchesUntilSelected = currentMatchNumber - (currentMatchIndex + 1);

            // Geçmiş sezonlarda aynı rakiple olan maçları bul
            const historicalMatches = matchData
                .filter(m => 
                    (m.HomeTeam === team || m.AwayTeam === team) &&
                    (m.HomeTeam === opponent || m.AwayTeam === opponent) &&
                    getSeasonFromDate(Number(m.Date)) !== season &&
                    lastThreeSeasons.includes(getSeasonFromDate(Number(m.Date))) // Son 3 sezon filtresi
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date));

            // Her geçmiş maç için kontrol et
            historicalMatches.forEach(historicalMatch => {
                const historicalSeason = getSeasonFromDate(Number(historicalMatch.Date));
                
                // O sezondaki tüm maçları bul
                const seasonMatches = matchData
                    .filter(m => 
                        (m.HomeTeam === team || m.AwayTeam === team) &&
                        getSeasonFromDate(Number(m.Date)) === historicalSeason
                    )
                    .sort((a, b) => Number(a.Date) - Number(b.Date));

                const matchIndex = seasonMatches.findIndex(m => m.Date === historicalMatch.Date);
                
                // Tam olarak matchesUntilSelected maç sonrasına bak
                if (matchIndex + matchesUntilSelected < seasonMatches.length) {
                    const surpriseMatch = seasonMatches[matchIndex + matchesUntilSelected];
                    const isTeamHome = surpriseMatch.HomeTeam === team;

                    // Sadece sürpriz maçları ve tam olarak aynı maç sayısı sonrasını ekle
                    if (isSurpriseMatch(surpriseMatch, isTeamHome)) {
                        results.push({
                            team,
                            currentMatch: {
                                season,
                                date: formatDate(Number(currentMatch.Date)),
                                opponent,
                                score: `${currentMatch.FTHG}-${currentMatch.FTAG}`,
                                isHome: currentMatch.HomeTeam === team
                            },
                            historicalPattern: {
                                season: historicalSeason,
                                date: formatDate(Number(historicalMatch.Date)),
                                opponent,
                                score: `${historicalMatch.FTHG}-${historicalMatch.FTAG}`,
                                isHome: historicalMatch.HomeTeam === team,
                                matchesUntilSurprise: matchesUntilSelected,
                                surpriseMatch: {
                                    opponent: surpriseMatch.HomeTeam === team ? 
                                        surpriseMatch.AwayTeam : surpriseMatch.HomeTeam,
                                    date: formatDate(Number(surpriseMatch.Date)),
                                    score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`,
                                    htScore: `${surpriseMatch.HTHG}-${surpriseMatch.HTAG}`,
                                    isHome: isTeamHome
                                }
                            }
                        });
                    }
                }
            });
        });

        return results;
    };

    return (
        <div className="h-full flex flex-col">
            <Header onClose={onClose} />
            
            <div className="flex-1 overflow-hidden">
                {/* Gerçekleşmiş Sürprizler Butonu */}
                <div className="p-6 border-b border-gray-800">
                    <button
                        onClick={() => setShowExistingSurprises(true)}
                        className="w-full p-4 bg-purple-600 hover:bg-purple-700 
                                 rounded-xl text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        Gerçekleşmiş Sürprizleri Göster
                    </button>
                </div>

                {/* Geri kalan içerik */}
                <div className="flex-1 overflow-auto">
                    {/* Takım seçim modalı */}
                    <TeamSelectionModal
                        isOpen={showTeamSelection}
                        onClose={onClose}
                        teams={teams}
                        onSelect={handleTeamSelect}
                        selectedTeams={selectedTeams}
                        title="Potansiyel Sürpriz için Takım Seçin"
                    />

                    {/* Diğer modallar */}
                    <ExistingSurprisesModal
                        isOpen={showExistingSurprises}
                        onClose={() => setShowExistingSurprises(false)}
                        onSelect={handleExistingSurpriseSelect}
                        matchData={matchData}
                        league={league}
                        season={season}
                    />

                    <MatchNumberSelectionModal
                        isOpen={showDateSelection}
                        onClose={() => setShowDateSelection(false)}
                        onSelect={handleDateSelect}
                        matchData={matchData}
                        league={league}
                        season={season}
                        selectedTeams={selectedTeams}
                    />

                    {/* Sonuçlar */}
                    {!showTeamSelection && selectedTeams.length === 2 && (
                        <div className="p-6">
                            <ResultsDisplay
                                teamX={selectedTeams[0]}
                                teamY={selectedTeams[1]}
                                results={results}
                                onBack={handleBack}
                                isAnalyzing={isAnalyzing}
                                matchNumber={matchNumber}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 