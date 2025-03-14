import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Search, Calendar } from 'lucide-react';
import { LEAGUE_INFO } from './FormulaSearchModal';

// Helper functions
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getDayName = (date: Date): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
};

interface DayTeamTriggerAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface PatternHistory {
    season: string;
    date: string;
    type: 'same' | 'next' | 'twoNext';
    referenceMatch: {
        date: string;
        dayOfWeek: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
    };
}

interface SurpriseMatch {
    date: string;
    rawDate: Date;
    dayOfWeek: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    htScore: string;
    homeTeamPatternHistory?: PatternHistory; // Separate pattern history for home team
    awayTeamPatternHistory?: PatternHistory; // Separate pattern history for away team
}

interface DayAnalysis {
    triggerMatch: SurpriseMatch; // X takımının sürprizi
    sameDaySurprises: SurpriseMatch[]; // Aynı gün diğer sürprizler
    nextDaySurprises: SurpriseMatch[]; // Ertesi gün sürprizler
    twoNextDaySurprises: SurpriseMatch[]; // İki gün sonraki sürprizler
}

// Season Selection Modal
const SeasonSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    seasons: string[];
    onSelect: (season: string) => void;
}> = ({ isOpen, onClose, seasons, onSelect }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md bg-gray-900 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Sezon Seçin</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {seasons.map(season => (
                            <button
                                key={season}
                                onClick={() => onSelect(season)}
                                className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 
                                         transition-all hover:scale-105 text-white"
                            >
                                {season}
                            </button>
                        ))}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// Team Selection Modal
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
}> = ({ isOpen, onClose, teams, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredTeams = useMemo(() => {
        if (!searchQuery) return teams;
        return teams.filter(team => 
            team.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teams, searchQuery]);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-6">Takım Seçin</h2>
                    
                    {/* Search Input */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Takım ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                                     text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Teams Grid */}
                    <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
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
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// Team Pair Selection Modal
const TeamPairSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (teamY: string, teamA: string) => void;
    excludeTeam?: string;
}> = ({ isOpen, onClose, teams, onSelect, excludeTeam }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeamY, setSelectedTeamY] = useState<string | null>(null);
    
    const filteredTeams = useMemo(() => {
        const availableTeams = teams.filter(team => team !== excludeTeam);
        if (!searchQuery) return availableTeams;
        return availableTeams.filter(team => 
            team.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [teams, searchQuery, excludeTeam]);

    const handleTeamSelect = (team: string) => {
        if (!selectedTeamY) {
            setSelectedTeamY(team);
        } else {
            onSelect(selectedTeamY, team);
            setSelectedTeamY(null);
            setSearchQuery('');
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-2">
                        {selectedTeamY ? 'İkinci Takımı Seçin (A)' : 'İlk Takımı Seçin (Y)'}
                    </h2>
                    {selectedTeamY && (
                        <p className="text-purple-400 mb-4">Seçilen Y Takımı: {selectedTeamY}</p>
                    )}
                    
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Takım ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                                     text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredTeams.map(team => (
                            <button
                                key={team}
                                onClick={() => handleTeamSelect(team)}
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
};

// Results Display Component
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    selectedSeason: string;
    results: DayAnalysis[];
    onBack: () => void;
    onCalculateTeamPair: () => void;
}> = ({ selectedTeam, selectedSeason, results, onBack, onCalculateTeamPair }) => {
    return (
        <div className="space-y-8 h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 
                          rounded-2xl p-8 shadow-xl shadow-purple-900/20 relative">
                
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                
                <div className="relative flex justify-between items-center mb-6">
                    <button 
                        onClick={onBack}
                        className="p-2 rounded-lg bg-black/20 
                                 hover:bg-black/30 transition-colors text-white z-10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={onCalculateTeamPair}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 
                                 transition-colors rounded-lg text-white font-medium
                                 shadow-lg hover:shadow-xl z-10"
                    >
                        Muhtemel Takım Hesapla
                    </button>
                </div>

                <div className="relative flex items-center gap-4">
                    <TeamLogo name={selectedTeam} className="w-16 h-16" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">{selectedTeam}</h2>
                        <p className="text-purple-200">
                            {selectedSeason} Sezonu Gün-Takım Tetikleyici Analizi
                        </p>
                    </div>
                </div>
            </div>

            {/* Results Content */}
            <div className="flex flex-col gap-8 overflow-y-auto flex-1 pb-6">
                {results.map((analysis, idx) => (
                    <div key={idx} className="space-y-6">
                        {/* Trigger Match */}
                        <div className="bg-purple-900/20 border border-purple-900/30 rounded-xl p-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                {analysis.triggerMatch.dayOfWeek} - {analysis.triggerMatch.date}
                            </h3>
                            <MatchDisplay match={analysis.triggerMatch} variant="purple" />
                        </div>

                        {/* Same Day Surprises */}
                        {analysis.sameDaySurprises.length > 0 && (
                            <div className="ml-8 space-y-4">
                                <h4 className="text-lg font-medium text-white">
                                    Aynı Gün Sürprizler
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis.sameDaySurprises.map((match, midx) => (
                                        <MatchDisplay key={midx} match={match} variant="blue" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next Day Surprises */}
                        {analysis.nextDaySurprises.length > 0 && (
                            <div className="ml-8 space-y-4">
                                <h4 className="text-lg font-medium text-white">
                                    Ertesi Gün Sürprizler
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis.nextDaySurprises.map((match, midx) => (
                                        <MatchDisplay key={midx} match={match} variant="green" />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Two Days After Surprises */}
                        {analysis.twoNextDaySurprises.length > 0 && (
                            <div className="ml-8 space-y-4">
                                <h4 className="text-lg font-medium text-white">
                                    İki Gün Sonraki Sürprizler
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis.twoNextDaySurprises.map((match, midx) => (
                                        <MatchDisplay key={midx} match={match} variant="orange" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export function DayTeamTriggerAnalysis({
    league,
    season,
    matchData,
    onClose
}: DayTeamTriggerAnalysisProps) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [showSeasonSelection, setShowSeasonSelection] = useState(false);
    const [showTeamPairSelection, setShowTeamPairSelection] = useState(false);
    const [results, setResults] = useState<DayAnalysis[] | null>(null);

    // Get all seasons
    const seasons = useMemo(() => {
        const seasonSet = new Set<string>();
        matchData.forEach(m => {
            const date = new Date((Number(m.Date) - 25569) * 86400 * 1000);
            const year = date.getFullYear();
            const month = date.getMonth();
            const season = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
            seasonSet.add(season);
        });
        return Array.from(seasonSet).sort().reverse();
    }, [matchData]);

    // Get all teams
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData.forEach(m => {
            if (m.HomeTeam) teamSet.add(m.HomeTeam);
            if (m.AwayTeam) teamSet.add(m.AwayTeam);
        });
        return Array.from(teamSet).sort();
    }, [matchData]);

    const handleTeamSelect = (team: string) => {
        setSelectedTeam(team);
        setShowTeamSelection(false);
        setShowSeasonSelection(true);
    };

    const handleSeasonSelect = (season: string) => {
        setSelectedSeason(season);
        setShowSeasonSelection(false);
        analyzeTeam(selectedTeam!, season);
    };

    const analyzeTeam = (team: string, selectedSeason: string) => {
        // Filter matches for selected season
        const seasonMatches = matchData.filter(m => {
            const date = new Date((Number(m.Date) - 25569) * 86400 * 1000);
            const year = date.getFullYear();
            const month = date.getMonth();
            const season = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
            return season === selectedSeason;
        });

        // Helper function to check pattern history
        const findPatternHistory = (teamToCheck: string, referenceDate: Date, currentSeason: string, referenceMatch: any, patternType: 'same' | 'next' | 'twoNext'): PatternHistory | undefined => {
            // Get X team's surprise matches from previous seasons
            const xTeamPreviousSurprises = matchData.filter(m => {
                const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                const matchSeason = matchDate.getMonth() >= 6 ? 
                    `${matchDate.getFullYear()}-${matchDate.getFullYear() + 1}` : 
                    `${matchDate.getFullYear()-1}-${matchDate.getFullYear()}`;
                const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                const isXTeam = m.HomeTeam === team || m.AwayTeam === team;
                
                return matchSeason !== currentSeason && isSurprise && isXTeam;
            });

            // For each X team surprise, check if the teamToCheck had a matching pattern
            for (const xSurprise of xTeamPreviousSurprises) {
                const xSurpriseDate = new Date((Number(xSurprise.Date) - 25569) * 86400 * 1000);
                
                // Calculate expected match date based on pattern type
                const expectedDate = new Date(xSurpriseDate);
                if (patternType === 'next') {
                    expectedDate.setDate(expectedDate.getDate() + 1);
                } else if (patternType === 'twoNext') {
                    expectedDate.setDate(expectedDate.getDate() + 2);
                }

                // Look for exact day match for teamToCheck
                const teamSurprises = matchData.filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    const involvesTeam = m.HomeTeam === teamToCheck || m.AwayTeam === teamToCheck;
                    
                    if (!isSurprise || !involvesTeam) return false;

                    // Check for exact date match based on pattern type
                    return matchDate.toDateString() === expectedDate.toDateString();
                });

                if (teamSurprises.length > 0) {
                    const matchSeason = xSurpriseDate.getMonth() >= 6 ? 
                        `${xSurpriseDate.getFullYear()}-${xSurpriseDate.getFullYear() + 1}` : 
                        `${xSurpriseDate.getFullYear()-1}-${xSurpriseDate.getFullYear()}`;

                    return {
                        season: matchSeason,
                        date: formatDate(Number(xSurprise.Date)),
                        type: patternType,
                        referenceMatch: {
                            date: formatDate(Number(xSurprise.Date)),
                            dayOfWeek: getDayName(xSurpriseDate),
                            homeTeam: xSurprise.HomeTeam,
                            awayTeam: xSurprise.AwayTeam,
                            score: `${xSurprise.FTHG}-${xSurprise.FTAG}`
                        }
                    };
                }
            }

            return undefined;
        };

        // Find all surprise matches of the selected team in the selected season
        const teamSurprises = seasonMatches
            .filter(m => {
                const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                return (m.HomeTeam === team || m.AwayTeam === team) && isSurprise;
            })
            .map(m => {
                const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                return {
                    date: formatDate(Number(m.Date)),
                    rawDate,
                    dayOfWeek: getDayName(rawDate),
                    league: m.Div,
                    homeTeam: m.HomeTeam,
                    awayTeam: m.AwayTeam,
                    score: `${m.FTHG}-${m.FTAG}`,
                    htScore: `${m.HTHG}-${m.HTAG}`
                };
            });

        // For each surprise match, analyze other matches
        const analyses = teamSurprises.map(surprise => {
            // Find same day surprises in all leagues
            const sameDaySurprises = matchData
                .filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isSameDay = matchDate.toDateString() === surprise.rawDate.toDateString();
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    const isDifferentMatch = m.HomeTeam !== surprise.homeTeam || m.AwayTeam !== surprise.awayTeam;
                    return isSameDay && isSurprise && isDifferentMatch;
                })
                .map(m => {
                    const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const homeTeam = m.HomeTeam;
                    const awayTeam = m.AwayTeam;
                    
                    // Check pattern history for both teams separately with exact pattern type
                    const homeTeamHistory = findPatternHistory(homeTeam, surprise.rawDate, selectedSeason, m, 'same');
                    const awayTeamHistory = findPatternHistory(awayTeam, surprise.rawDate, selectedSeason, m, 'same');

                    return {
                        date: formatDate(Number(m.Date)),
                        rawDate,
                        dayOfWeek: getDayName(rawDate),
                        league: m.Div,
                        homeTeam,
                        awayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        htScore: `${m.HTHG}-${m.HTAG}`,
                        homeTeamPatternHistory: homeTeamHistory,
                        awayTeamPatternHistory: awayTeamHistory
                    };
                });

            // Find next day surprises with pattern history
            const nextDay = new Date(surprise.rawDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDaySurprises = matchData
                .filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isNextDay = matchDate.toDateString() === nextDay.toDateString();
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    return isNextDay && isSurprise;
                })
                .map(m => {
                    const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const homeTeam = m.HomeTeam;
                    const awayTeam = m.AwayTeam;
                    
                    const homeTeamHistory = findPatternHistory(homeTeam, surprise.rawDate, selectedSeason, m, 'next');
                    const awayTeamHistory = findPatternHistory(awayTeam, surprise.rawDate, selectedSeason, m, 'next');

                    return {
                        date: formatDate(Number(m.Date)),
                        rawDate,
                        dayOfWeek: getDayName(rawDate),
                        league: m.Div,
                        homeTeam,
                        awayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        htScore: `${m.HTHG}-${m.HTAG}`,
                        homeTeamPatternHistory: homeTeamHistory,
                        awayTeamPatternHistory: awayTeamHistory
                    };
                });

            // Find two days after surprises with pattern history
            const twoNextDay = new Date(surprise.rawDate);
            twoNextDay.setDate(twoNextDay.getDate() + 2);
            const twoNextDaySurprises = matchData
                .filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isTwoNextDay = matchDate.toDateString() === twoNextDay.toDateString();
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    return isTwoNextDay && isSurprise;
                })
                .map(m => {
                    const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const homeTeam = m.HomeTeam;
                    const awayTeam = m.AwayTeam;
                    
                    const homeTeamHistory = findPatternHistory(homeTeam, surprise.rawDate, selectedSeason, m, 'twoNext');
                    const awayTeamHistory = findPatternHistory(awayTeam, surprise.rawDate, selectedSeason, m, 'twoNext');

                    return {
                        date: formatDate(Number(m.Date)),
                        rawDate,
                        dayOfWeek: getDayName(rawDate),
                        league: m.Div,
                        homeTeam,
                        awayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        htScore: `${m.HTHG}-${m.HTAG}`,
                        homeTeamPatternHistory: homeTeamHistory,
                        awayTeamPatternHistory: awayTeamHistory
                    };
                });

            return {
                triggerMatch: surprise,
                sameDaySurprises,
                nextDaySurprises,
                twoNextDaySurprises
            };
        });

        setResults(analyses);
    };

    const handleTeamPairSelect = (teamY: string, teamA: string) => {
        setShowTeamPairSelection(false);
        
        if (!selectedTeam) return;

        // Find all surprise matches of the selected team (X) from all seasons
        const xTeamHistoricalSurprises = matchData
            .filter(m => {
                const date = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                const year = date.getFullYear();
                const month = date.getMonth();
                const matchSeason = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
                const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                const isXTeam = m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam;
                return isSurprise && isXTeam;
            })
            .map(m => {
                const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                const year = rawDate.getFullYear();
                const month = rawDate.getMonth();
                const season = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
                return {
                    date: formatDate(Number(m.Date)),
                    rawDate,
                    season,
                    dayOfWeek: getDayName(rawDate),
                    league: m.Div,
                    homeTeam: m.HomeTeam,
                    awayTeam: m.AwayTeam,
                    score: `${m.FTHG}-${m.FTAG}`,
                    htScore: `${m.HTHG}-${m.HTAG}`
                };
            });

        // For each historical X surprise, analyze Y and A team matches
        const analyses = xTeamHistoricalSurprises.map(xSurprise => {
            // Find same day surprises for Y and A teams
            const sameDaySurprises = matchData
                .filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isSameDay = matchDate.toDateString() === xSurprise.rawDate.toDateString();
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    const isYorATeam = (m.HomeTeam === teamY || m.AwayTeam === teamY) || 
                                     (m.HomeTeam === teamA || m.AwayTeam === teamA);
                    return isSameDay && isSurprise && isYorATeam;
                })
                .map(m => {
                    const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const year = rawDate.getFullYear();
                    const month = rawDate.getMonth();
                    const season = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
                    return {
                        date: formatDate(Number(m.Date)),
                        rawDate,
                        season,
                        dayOfWeek: getDayName(rawDate),
                        league: m.Div,
                        homeTeam: m.HomeTeam,
                        awayTeam: m.AwayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        htScore: `${m.HTHG}-${m.HTAG}`,
                        referenceMatch: {
                            date: xSurprise.date,
                            dayOfWeek: xSurprise.dayOfWeek,
                            homeTeam: xSurprise.homeTeam,
                            awayTeam: xSurprise.awayTeam,
                            score: xSurprise.score,
                            season: xSurprise.season
                        }
                    };
                });

            // Find next day surprises for Y and A teams
            const nextDay = new Date(xSurprise.rawDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDaySurprises = matchData
                .filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isNextDay = matchDate.toDateString() === nextDay.toDateString();
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    const isYorATeam = (m.HomeTeam === teamY || m.AwayTeam === teamY) || 
                                     (m.HomeTeam === teamA || m.AwayTeam === teamA);
                    return isNextDay && isSurprise && isYorATeam;
                })
                .map(m => {
                    const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const year = rawDate.getFullYear();
                    const month = rawDate.getMonth();
                    const season = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
                    return {
                        date: formatDate(Number(m.Date)),
                        rawDate,
                        season,
                        dayOfWeek: getDayName(rawDate),
                        league: m.Div,
                        homeTeam: m.HomeTeam,
                        awayTeam: m.AwayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        htScore: `${m.HTHG}-${m.HTAG}`,
                        referenceMatch: {
                            date: xSurprise.date,
                            dayOfWeek: xSurprise.dayOfWeek,
                            homeTeam: xSurprise.homeTeam,
                            awayTeam: xSurprise.awayTeam,
                            score: xSurprise.score,
                            season: xSurprise.season
                        }
                    };
                });

            // Find two days after surprises for Y and A teams
            const twoNextDay = new Date(xSurprise.rawDate);
            twoNextDay.setDate(twoNextDay.getDate() + 2);
            const twoNextDaySurprises = matchData
                .filter(m => {
                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const isTwoNextDay = matchDate.toDateString() === twoNextDay.toDateString();
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    const isYorATeam = (m.HomeTeam === teamY || m.AwayTeam === teamY) || 
                                     (m.HomeTeam === teamA || m.AwayTeam === teamA);
                    return isTwoNextDay && isSurprise && isYorATeam;
                })
                .map(m => {
                    const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const year = rawDate.getFullYear();
                    const month = rawDate.getMonth();
                    const season = month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
                    return {
                        date: formatDate(Number(m.Date)),
                        rawDate,
                        season,
                        dayOfWeek: getDayName(rawDate),
                        league: m.Div,
                        homeTeam: m.HomeTeam,
                        awayTeam: m.AwayTeam,
                        score: `${m.FTHG}-${m.FTAG}`,
                        htScore: `${m.HTHG}-${m.HTAG}`,
                        referenceMatch: {
                            date: xSurprise.date,
                            dayOfWeek: xSurprise.dayOfWeek,
                            homeTeam: xSurprise.homeTeam,
                            awayTeam: xSurprise.awayTeam,
                            score: xSurprise.score,
                            season: xSurprise.season
                        }
                    };
                });

            return {
                triggerMatch: xSurprise,
                sameDaySurprises,
                nextDaySurprises,
                twoNextDaySurprises
            };
        });

        // Filter out analyses with no surprises
        const filteredAnalyses = analyses.filter(analysis => 
            analysis.sameDaySurprises.length > 0 || 
            analysis.nextDaySurprises.length > 0 || 
            analysis.twoNextDaySurprises.length > 0
        );

        setResults(filteredAnalyses);
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setSelectedSeason(null);
        setResults(null);
        setShowTeamSelection(true);
        setShowSeasonSelection(false);
        setShowTeamPairSelection(false);
    };

    return (
        <>
            <TeamSelectionModal
                isOpen={showTeamSelection}
                onClose={onClose}
                teams={teams}
                onSelect={handleTeamSelect}
            />

            <SeasonSelectionModal
                isOpen={showSeasonSelection}
                onClose={() => {
                    setShowSeasonSelection(false);
                    setShowTeamSelection(true);
                }}
                seasons={seasons}
                onSelect={handleSeasonSelect}
            />

            <TeamPairSelectionModal
                isOpen={showTeamPairSelection}
                onClose={() => setShowTeamPairSelection(false)}
                teams={teams}
                onSelect={handleTeamPairSelect}
                excludeTeam={selectedTeam || undefined}
            />

            {!showTeamSelection && !showSeasonSelection && selectedTeam && selectedSeason && results && (
                <div className="p-6 h-screen">
                    <ResultsDisplay
                        selectedTeam={selectedTeam}
                        selectedSeason={selectedSeason}
                        results={results}
                        onBack={handleBack}
                        onCalculateTeamPair={() => setShowTeamPairSelection(true)}
                    />
                </div>
            )}
        </>
    );
}

const TeamDisplay: React.FC<{
    team: string;
    patternHistory?: PatternHistory;
    size?: 'sm' | 'lg';
    role?: 'home' | 'away';
}> = ({ team, patternHistory, size = 'sm', role }) => {
    return (
        <div className="flex flex-col items-center">
            <Tooltip.Provider>
                <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                        <div className="flex flex-col items-center cursor-pointer">
                            <TeamLogo name={team} className={size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'} />
                            <span className={`text-xs ${size === 'sm' ? 'text-blue-200' : 'text-purple-200'} mt-1`}>
                                {team}
                            </span>
                            {patternHistory && (
                                <span className="text-xs text-yellow-500 font-medium">
                                    {role === 'home' ? 'Ev Sahibi' : 'Deplasman'} Örüntüsü
                                </span>
                            )}
                        </div>
                    </Tooltip.Trigger>
                    {patternHistory && (
                        <Tooltip.Portal>
                            <Tooltip.Content 
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-xl z-50"
                                sideOffset={5}
                            >
                                <div className="text-sm space-y-3">
                                    <div>
                                        <div className="font-medium text-yellow-500 mb-1">
                                            {role === 'home' ? 'Ev Sahibi' : 'Deplasman'} Takım Örüntüsü
                                        </div>
                                        <div>Sezon: {patternHistory.season}</div>
                                        <div>Tarih: {patternHistory.date}</div>
                                        <div>
                                            Tip: {
                                                patternHistory.type === 'same' ? 'Aynı Gün' :
                                                patternHistory.type === 'next' ? 'Ertesi Gün' :
                                                'İki Gün Sonra'
                                            }
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-700 pt-2">
                                        <div className="font-medium text-blue-400 mb-1">
                                            Referans Alınan Sürpriz Maç:
                                        </div>
                                        <div>{patternHistory.referenceMatch.dayOfWeek}</div>
                                        <div>{patternHistory.referenceMatch.date}</div>
                                        <div className="text-gray-300">
                                            {patternHistory.referenceMatch.homeTeam} vs {patternHistory.referenceMatch.awayTeam}
                                        </div>
                                        <div className="text-gray-400">
                                            Skor: {patternHistory.referenceMatch.score}
                                        </div>
                                    </div>
                                </div>
                                <Tooltip.Arrow className="fill-gray-800" />
                            </Tooltip.Content>
                        </Tooltip.Portal>
                    )}
                </Tooltip.Root>
            </Tooltip.Provider>
        </div>
    );
};

const MatchDisplay: React.FC<{
    match: SurpriseMatch;
    variant: 'purple' | 'blue' | 'green' | 'orange';
}> = ({ match, variant }) => {
    const colors = {
        purple: {
            bg: 'bg-purple-900/30',
            text: 'text-purple-200',
            textSecondary: 'text-purple-300'
        },
        blue: {
            bg: 'bg-blue-900/20',
            text: 'text-blue-200',
            textSecondary: 'text-blue-300'
        },
        green: {
            bg: 'bg-green-900/20',
            text: 'text-green-200',
            textSecondary: 'text-green-300'
        },
        orange: {
            bg: 'bg-orange-900/20',
            text: 'text-orange-200',
            textSecondary: 'text-orange-300'
        }
    };

    return (
        <div className={`${colors[variant].bg} border border-${variant}-900/30 rounded-lg p-4`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <TeamDisplay 
                        team={match.homeTeam}
                        patternHistory={match.homeTeamPatternHistory}
                        size="sm"
                        role="home"
                    />
                    <span className="text-lg text-white">{match.score}</span>
                    <TeamDisplay
                        team={match.awayTeam}
                        patternHistory={match.awayTeamPatternHistory}
                        size="sm"
                        role="away"
                    />
                </div>
                <div className="text-right">
                    <div className={`text-sm ${colors[variant].text}`}>
                        {LEAGUE_INFO[match.league]?.name || match.league}
                    </div>
                    <div className={`text-xs ${colors[variant].textSecondary}`}>
                        İY: {match.htScore}
                    </div>
                </div>
            </div>
        </div>
    );
}; 