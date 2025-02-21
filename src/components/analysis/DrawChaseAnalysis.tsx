import React, { useState, useMemo } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Interface'leri kopyalayıp draw/beraberlik olarak güncelleyelim
interface DrawChaseResult {
    similarTeam: string;
    season: string;
    commonDraws: string[];  // commonSurprises -> commonDraws
    firstOpponent: string;
}

interface FixtureTriggerResult {
    triggerTeam: string;
    matches: {
        season: string;
        isHome: boolean;
        matchesUntilDraw: number;  // matchesUntilSurprise -> matchesUntilDraw
        drawOpponent: string;      // surpriseOpponent -> drawOpponent
        isException?: boolean;
    }[];
}

interface RecentPatternResult {
    triggerTeam: string;
    matches: {
        season: string;
        isHome: boolean;
        matchesUntilDraw: number;  // matchesUntilSurprise -> matchesUntilDraw
        drawOpponent: string;      // surpriseOpponent -> drawOpponent
    }[];
    repeatCount: number;
}

interface SingleTimePattern {
    triggerTeam: string;
    historicalMatch: {
        season: string;
        isHome: boolean;
        matchesUntilDraw: number;  // matchesUntilSurprise -> matchesUntilDraw
        drawOpponent: string;      // surpriseOpponent -> drawOpponent
    };
    currentMatch: {
        matchesPlayed: number;
        isHome: boolean;
    };
}

interface DrawChaseAnalysisProps {  // SimilarityChaseAnalysisProps -> DrawChaseAnalysisProps
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

// TeamSelectionModal komponentini tamamla
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

// Yeni bir tip tanımlayalım
type GroupedPattern = {
    triggerTeam: string;
    mainPatterns: FixtureTriggerResult['matches'];
    recentPatterns: RecentPatternResult['matches'];
    singleTimePatterns: SingleTimePattern[];
};

// ResultsDisplay komponentini güncelle
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    drawResults: DrawChaseResult[];
    triggerResults: { mainResults: FixtureTriggerResult[], recentPatterns: RecentPatternResult[] };
    singleTimePatterns: SingleTimePattern[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ selectedTeam, drawResults, triggerResults, singleTimePatterns, onBack, isAnalyzing }) => {
    // Pattern'leri tetikleyici takımlara göre grupla
    const groupedPatterns = useMemo(() => {
        const groups = new Map<string, GroupedPattern>();

        // Ana pattern'leri ekle
        triggerResults.mainResults.forEach(result => {
            if (!groups.has(result.triggerTeam)) {
                groups.set(result.triggerTeam, {
                    triggerTeam: result.triggerTeam,
                    mainPatterns: [],
                    recentPatterns: [],
                    singleTimePatterns: []
                });
            }
            groups.get(result.triggerTeam)!.mainPatterns = result.matches;
        });

        // Son seneler pattern'lerini ekle
        triggerResults.recentPatterns.forEach(pattern => {
            if (!groups.has(pattern.triggerTeam)) {
                groups.set(pattern.triggerTeam, {
                    triggerTeam: pattern.triggerTeam,
                    mainPatterns: [],
                    recentPatterns: [],
                    singleTimePatterns: []
                });
            }
            groups.get(pattern.triggerTeam)!.recentPatterns = pattern.matches;
        });

        // Tek seferlik pattern'leri ekle
        singleTimePatterns.forEach(pattern => {
            if (!groups.has(pattern.triggerTeam)) {
                groups.set(pattern.triggerTeam, {
                    triggerTeam: pattern.triggerTeam,
                    mainPatterns: [],
                    recentPatterns: [],
                    singleTimePatterns: []
                });
            }
            groups.get(pattern.triggerTeam)!.singleTimePatterns.push(pattern);
        });

        return Array.from(groups.values());
    }, [triggerResults, singleTimePatterns]);

    return (
        <div className="space-y-8 h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
                          rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden
                          flex-shrink-0">
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
                        <p className="text-blue-200 mt-1">Beraberlik Analizi</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Analiz yapılıyor...</p>
                    </div>
                ) : groupedPatterns.length > 0 ? (
                    <div className="space-y-6">
                        {groupedPatterns.map((group, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                                                   rounded-xl p-6 border border-blue-500/20">
                                {/* Tetikleyici Başlık */}
                                <div className="flex items-center gap-4 mb-6">
                                    <TeamLogo name={group.triggerTeam} className="w-20 h-20" />
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{group.triggerTeam}</h3>
                                        <p className="text-blue-400">Muhtemel Tetikleyici</p>
                                    </div>
                                </div>

                                {/* Pattern'ler */}
                                <div className="space-y-4">
                                    {/* Ana Pattern'ler */}
                                    {group.mainPatterns.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-medium text-blue-400">3+ Tekrar</h4>
                                            {group.mainPatterns.map((match, matchIdx) => (
                                                <div key={matchIdx} className="flex items-center gap-4 p-3 bg-blue-500/10 rounded-lg">
                                                    <span className="text-gray-400">{match.season}</span>
                                                    <span className={match.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                        {match.isHome ? 'Ev' : 'Deplasman'}
                                                    </span>
                                                    <span className="text-gray-300">{match.matchesUntilDraw} maç sonra</span>
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={match.drawOpponent} className="w-5 h-5" />
                                                        <span className="text-sm text-gray-300">{match.drawOpponent}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Son Seneler */}
                                    {group.recentPatterns.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-medium text-green-400">Son 5 Sezonda 2+ Tekrar</h4>
                                            {group.recentPatterns.map((match, matchIdx) => (
                                                <div key={matchIdx} className="flex items-center gap-4 p-3 bg-green-500/10 rounded-lg">
                                                    <span className="text-gray-400">{match.season}</span>
                                                    <span className={match.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                        {match.isHome ? 'Ev' : 'Deplasman'}
                                                    </span>
                                                    <span className="text-gray-300">{match.matchesUntilDraw} maç sonra</span>
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={match.drawOpponent} className="w-5 h-5" />
                                                        <span className="text-sm text-gray-300">{match.drawOpponent}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tek Seferlik Pattern'ler */}
                                    {group.singleTimePatterns.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-medium text-purple-400">Tek Seferlik Pattern'ler</h4>
                                            {group.singleTimePatterns.map((pattern, patternIdx) => (
                                                <div key={patternIdx} className="flex items-center gap-4 p-3 bg-purple-500/10 rounded-lg">
                                                    <span className="text-gray-400">{pattern.historicalMatch.season}</span>
                                                    <span className={pattern.historicalMatch.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                        {pattern.historicalMatch.isHome ? 'Ev' : 'Deplasman'}
                                                    </span>
                                                    <span className="text-gray-300">{pattern.historicalMatch.matchesUntilDraw} maç sonra</span>
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={pattern.historicalMatch.drawOpponent} className="w-5 h-5" />
                                                        <span className="text-sm text-gray-300">{pattern.historicalMatch.drawOpponent}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                        <p className="text-gray-400">Pattern bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Analiz fonksiyonlarını güncelle
const analyzeDrawChase = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): DrawChaseResult[] => {
    const results: DrawChaseResult[] = [];
    const seasonMatches = matchData
        .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    // İlk maçı bul
    const firstMatch = seasonMatches.find(m => 
        m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam
    );

    if (!firstMatch) return results;

    const firstOpponent = firstMatch.HomeTeam === selectedTeam 
        ? firstMatch.AwayTeam 
        : firstMatch.HomeTeam;

    // Bu rakiple ilk maçta karşılaşan diğer takımları bul
    const similarTeams = seasonMatches
        .filter(m => 
            (m.HomeTeam === firstOpponent || m.AwayTeam === firstOpponent) &&
            m.HomeTeam !== selectedTeam && m.AwayTeam !== selectedTeam
        )
        .map(m => m.HomeTeam === firstOpponent ? m.AwayTeam : m.HomeTeam);

    // Mevcut sezondaki takımları bul
    const currentSeasonTeams = new Set(
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
    );

    // Her benzer takım için beraberlik kontrolü yap
    similarTeams.forEach(team => {
        // Eğer takım mevcut sezonda yoksa atla
        if (!currentSeasonTeams.has(team)) return;

        const teamDraws = seasonMatches
            .filter(m => 
                ((m.HomeTeam === team || m.AwayTeam === team) &&
                 ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D')))
            )
            .map(m => m.HomeTeam === team ? m.AwayTeam : m.HomeTeam);

        const selectedTeamDraws = seasonMatches
            .filter(m => 
                ((m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam) &&
                 ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D')))
            )
            .map(m => m.HomeTeam === selectedTeam ? m.AwayTeam : m.HomeTeam);

        const commonDraws = teamDraws.filter(t => selectedTeamDraws.includes(t));

        if (commonDraws.length > 0) {
            results.push({
                similarTeam: team,
                season,
                commonDraws,
                firstOpponent
            });
        }
    });

    return results;
};

const analyzeFixtureTriggers = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): { mainResults: FixtureTriggerResult[], recentPatterns: RecentPatternResult[] } => {
    const mainResults: FixtureTriggerResult[] = [];
    const recentPatterns: RecentPatternResult[] = [];

    // Mevcut sezondaki takımları bul
    const currentSeasonTeams = new Set(
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
    );

    // Tüm sezonları bul
    const allSeasons = [...new Set(
        matchData
            .filter(m => m.Div === league)
            .map(m => getSeasonFromDate(Number(m.Date)))
    )].sort();

    // Her sezon için pattern ara
    allSeasons.forEach(checkingSeason => {
        const seasonMatches = matchData
            .filter(m => 
                m.Div === league && 
                getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        seasonMatches.forEach(triggerMatch => {
            const opponent = triggerMatch.HomeTeam === selectedTeam 
                ? triggerMatch.AwayTeam 
                : triggerMatch.HomeTeam;

            // Bu maçtan sonraki beraberliği bul
            const drawMatch = seasonMatches.find(m => 
                Number(m.Date) > Number(triggerMatch.Date) &&
                ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D'))
            );

            if (drawMatch) {
                const matchesBetween = seasonMatches
                    .filter(m => 
                        Number(m.Date) > Number(triggerMatch.Date) &&
                        Number(m.Date) < Number(drawMatch.Date)
                    ).length;

                // Bu pattern'i diğer sezonlarda ara
                const patternMatches = allSeasons.map(s => {
                    const matches = matchData
                        .filter(m => 
                            m.Div === league &&
                            getSeasonFromDate(Number(m.Date)) === s &&
                            (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
                        )
                        .sort((a, b) => Number(a.Date) - Number(b.Date));

                    const trigger = matches.find(m =>
                        (m.HomeTeam === opponent && m.AwayTeam === selectedTeam) ||
                        (m.HomeTeam === selectedTeam && m.AwayTeam === opponent)
                    );

                    if (!trigger) return null;

                    const draw = matches.find(m =>
                        Number(m.Date) > Number(trigger.Date) &&
                        ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D'))
                    );

                    if (!draw) return null;

                    const betweenCount = matches
                        .filter(m =>
                            Number(m.Date) > Number(trigger.Date) &&
                            Number(m.Date) < Number(draw.Date)
                        ).length;

                    if (betweenCount !== matchesBetween) return null;

                    return {
                        season: s,
                        isHome: trigger.HomeTeam === selectedTeam,
                        matchesUntilDraw: matchesBetween,
                        drawOpponent: draw.HomeTeam === selectedTeam ? draw.AwayTeam : draw.HomeTeam
                    };
                }).filter(Boolean);

                // Pattern'i eklerken kontrol et
                if (patternMatches.length >= 3 && currentSeasonTeams.has(opponent)) {
                    mainResults.push({
                        triggerTeam: opponent,
                        matches: patternMatches as any[]
                    });
                } else if (patternMatches.length >= 2 && 
                          patternMatches.some(m => allSeasons.indexOf(m!.season) >= allSeasons.length - 5) &&
                          currentSeasonTeams.has(opponent)) {
                    recentPatterns.push({
                        triggerTeam: opponent,
                        matches: patternMatches as any[],
                        repeatCount: patternMatches.length
                    });
                }
            }
        });
    });

    return { mainResults, recentPatterns };
};

const analyzeSingleTimePatterns = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): SingleTimePattern[] => {
    const results: SingleTimePattern[] = [];

    // Mevcut sezondaki takımları bul
    const currentSeasonTeams = new Set(
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
    );

    // Tüm sezonları bul ve sırala (mevcut sezon hariç)
    const allSeasons = [...new Set(
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) !== season)
            .map(m => getSeasonFromDate(Number(m.Date)))
    )].sort((a, b) => {
        const yearA = parseInt(a.split('-')[0]);
        const yearB = parseInt(b.split('-')[0]);
        return yearB - yearA; // En yeniden eskiye
    });

    // Her sezonu kontrol et
    allSeasons.forEach(checkingSeason => {
        // Bu sezondaki beraberlik maçlarını bul
        const seasonDraws = matchData.filter(m => 
            m.Div === league &&
            getSeasonFromDate(Number(m.Date)) === checkingSeason &&
            ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D'))
        );

        // Her beraberlik maçı için
        seasonDraws.forEach(drawMatch => {
            const drawTeam = drawMatch.HomeTeam === selectedTeam 
                ? drawMatch.HomeTeam 
                : drawMatch.AwayTeam === selectedTeam 
                    ? drawMatch.AwayTeam 
                    : null;

            if (!drawTeam) return;

            // Beraberlikten önceki maçları bul
            const previousMatches = matchData
                .filter(m => 
                    m.Div === league &&
                    getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                    Number(m.Date) < Number(drawMatch.Date) &&
                    (m.HomeTeam === drawTeam || m.AwayTeam === drawTeam)
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date));

            // Her önceki maç için
            previousMatches.forEach(triggerMatch => {
                const triggerOpponent = triggerMatch.HomeTeam === drawTeam 
                    ? triggerMatch.AwayTeam 
                    : triggerMatch.HomeTeam;

                // Eğer tetikleyici takım bu sezon ligde yoksa atla
                if (!currentSeasonTeams.has(triggerOpponent)) return;

                // Aradaki maç sayısını hesapla
                const matchesBetween = matchData
                    .filter(m => 
                        m.Div === league &&
                        getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                        Number(m.Date) > Number(triggerMatch.Date) &&
                        Number(m.Date) < Number(drawMatch.Date) &&
                        (m.HomeTeam === drawTeam || m.AwayTeam === drawTeam)
                    ).length;

                // Bu pattern'in diğer sezonlarda kullanılıp kullanılmadığını kontrol et
                const isUsedInOtherSeasons = allSeasons
                    .filter(s => s !== checkingSeason)
                    .some(otherSeason => {
                        // Önce bu rakiple maç var mı
                        const triggerExists = matchData.some(m =>
                            m.Div === league &&
                            getSeasonFromDate(Number(m.Date)) === otherSeason &&
                            ((m.HomeTeam === drawTeam && m.AwayTeam === triggerOpponent) ||
                             (m.AwayTeam === drawTeam && m.HomeTeam === triggerOpponent))
                        );

                        if (!triggerExists) return false;

                        // Sonra benzer pattern var mı
                        return matchData.some(m =>
                            m.Div === league &&
                            getSeasonFromDate(Number(m.Date)) === otherSeason &&
                            ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D')) &&
                            (m.HomeTeam === drawTeam || m.AwayTeam === drawTeam)
                        );
                    });

                // Eğer başka sezonlarda kullanılmamışsa ekle
                if (!isUsedInOtherSeasons) {
                    results.push({
                        triggerTeam: triggerOpponent,
                        historicalMatch: {
                            season: checkingSeason,
                            isHome: triggerMatch.HomeTeam === drawTeam,
                            matchesUntilDraw: matchesBetween,
                            drawOpponent: drawMatch.HomeTeam === drawTeam 
                                ? drawMatch.AwayTeam 
                                : drawMatch.HomeTeam
                        },
                        currentMatch: {
                            matchesPlayed: matchesBetween,
                            isHome: triggerMatch.HomeTeam === drawTeam
                        }
                    });
                }
            });
        });
    });

    return results;
};

// Yardımcı fonksiyonlar aynı kalabilir
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Ana komponenti tamamla
export const DrawChaseAnalysis: React.FC<DrawChaseAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [drawResults, setDrawResults] = useState<DrawChaseResult[]>([]);
    const [triggerResults, setTriggerResults] = useState<{ mainResults: FixtureTriggerResult[], recentPatterns: RecentPatternResult[] }>({ mainResults: [], recentPatterns: [] });
    const [singleTimePatterns, setSingleTimePatterns] = useState<SingleTimePattern[]>([]);
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
            const similarity = analyzeDrawChase(team, league, season, matchData);
            const triggers = analyzeFixtureTriggers(team, league, season, matchData);
            const singleTime = analyzeSingleTimePatterns(team, league, season, matchData);
            setDrawResults(similarity);
            setTriggerResults(triggers);
            setSingleTimePatterns(singleTime);
            setIsAnalyzing(false);
        }, 100);
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setDrawResults([]);
        setTriggerResults({ mainResults: [], recentPatterns: [] });
        setSingleTimePatterns([]);
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
                <div className="p-6 h-screen">
                    <ResultsDisplay
                        selectedTeam={selectedTeam}
                        drawResults={drawResults}
                        triggerResults={triggerResults}
                        singleTimePatterns={singleTimePatterns}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                    />
                </div>
            )}
        </>
    );
}; 