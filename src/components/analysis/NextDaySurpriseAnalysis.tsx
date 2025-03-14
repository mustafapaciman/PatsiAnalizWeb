import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Search } from 'lucide-react';

// Helper functions
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
};

const getDayName = (date: Date): string => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[date.getDay()];
};

interface NextDaySurpriseAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface SurpriseMatch {
    date: string;
    season: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    htScore: string;
    dayOfWeek: string;
    rawDate?: Date;
    isNextDay?: boolean;
    isSameMonth?: boolean;
}

interface AnalysisResult {
    triggerMatches: SurpriseMatch[]; // X takımının sürpriz yaptığı maçlar
    nextDaySurprises: SurpriseMatch[]; // İkinci gün sürpriz yapan maçlar
}

// Team Selection Modal with Search
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
}> = ({ isOpen, onClose, teams = [], onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredTeams = useMemo(() => {
        if (!teams || !searchQuery) return teams;
        return teams.filter(team => 
            team?.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                        {(filteredTeams || []).map(team => (
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

// Day Selection Component
const DaySelector: React.FC<{
    selectedDay: string | null;
    secondSelectedDay: string | null;
    onSelect: (day: string, isSecondDay: boolean) => void;
    title: string;
}> = ({ selectedDay, secondSelectedDay, onSelect, title }) => {
    const days = [
        'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            <div className="flex gap-2 flex-wrap">
                {days.map(day => {
                    const isSelected = selectedDay === day || secondSelectedDay === day;
                    const isDisabled = secondSelectedDay === null ? false : selectedDay === day;
                    
                    return (
                        <button
                            key={day}
                            onClick={() => !isDisabled && onSelect(day, selectedDay !== null)}
                            disabled={isDisabled}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                                isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-700' :
                                isSelected ? 'bg-blue-600 text-white' :
                                'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Results Display Component
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    firstDay: string;
    secondDay: string;
    results: AnalysisResult;
    onBack: () => void;
}> = ({ selectedTeam, firstDay, secondDay, results, onBack }) => {
    return (
        <div className="space-y-8 h-[calc(100vh-4rem)] flex flex-col">
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

                <div className="relative space-y-4">
                    <div className="flex items-center gap-4">
                        <TeamLogo name={selectedTeam} className="w-16 h-16" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedTeam}</h2>
                            <p className="text-blue-200">
                                {firstDay} → {secondDay} Analizi
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Content */}
            <div className="flex flex-col gap-6 overflow-y-auto flex-1 pb-6">
                {/* Trigger Matches */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">
                        {selectedTeam} - {firstDay} Günü Sürpriz Maçları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.triggerMatches.map((match, idx) => (
                            <div key={idx} className="bg-blue-900/20 border border-blue-900/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <TeamLogo name={match.homeTeam} className="w-10 h-10" />
                                            <span className="text-xs text-gray-400 mt-1">{match.homeTeam}</span>
                                        </div>
                                        <span className="text-lg text-white font-medium">{match.score}</span>
                                        <div className="flex flex-col items-center">
                                            <TeamLogo name={match.awayTeam} className="w-10 h-10" />
                                            <span className="text-xs text-gray-400 mt-1">{match.awayTeam}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400">{match.season}</div>
                                        <div className="text-xs text-gray-500">{match.date}</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    İY: {match.htScore}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Next Day Surprises */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">
                        {secondDay} Günü Sürpriz Maçları
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.nextDaySurprises.map((match, idx) => (
                            <div key={idx} className="bg-green-900/20 border border-green-900/30 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <TeamLogo name={match.homeTeam} className="w-10 h-10" />
                                            <span className="text-xs text-gray-400 mt-1">{match.homeTeam}</span>
                                        </div>
                                        <span className="text-lg text-white font-medium">{match.score}</span>
                                        <div className="flex flex-col items-center">
                                            <TeamLogo name={match.awayTeam} className="w-10 h-10" />
                                            <span className="text-xs text-gray-400 mt-1">{match.awayTeam}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400">{match.season}</div>
                                        <div className="text-xs text-gray-500">{match.date}</div>
                                        {match.isNextDay && (
                                            <div className="text-xs font-medium text-orange-500 mt-1">
                                                Bir sonraki gün
                                            </div>
                                        )}
                                        {!match.isNextDay && match.isSameMonth && (
                                            <div className="text-xs font-medium text-green-500 mt-1">
                                                Aynı ay içinde
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    İY: {match.htScore}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function NextDaySurpriseAnalysis({
    league,
    season,
    matchData,
    onClose
}: NextDaySurpriseAnalysisProps) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [firstDay, setFirstDay] = useState<string | null>(null);
    const [secondDay, setSecondDay] = useState<string | null>(null);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [results, setResults] = useState<AnalysisResult | null>(null);

    // Get all teams with proper type checking
    const teams = useMemo(() => {
        if (!matchData || !Array.isArray(matchData)) return [];
        
        const teamSet = new Set<string>();
        matchData.forEach(m => {
            if (m && typeof m.HomeTeam === 'string') {
                teamSet.add(m.HomeTeam);
            }
            if (m && typeof m.AwayTeam === 'string') {
                teamSet.add(m.AwayTeam);
            }
        });
        return Array.from(teamSet).sort();
    }, [matchData]);

    const handleTeamSelect = (team: string) => {
        setSelectedTeam(team);
        setShowTeamSelection(false);
    };

    const handleDaySelect = (day: string, isSecondDay: boolean) => {
        if (!isSecondDay) {
            setFirstDay(day);
        } else {
            setSecondDay(day);
            if (selectedTeam) {
                analyzeMatches(selectedTeam, firstDay!, day);
            }
        }
    };

    const analyzeMatches = (team: string, day1: string, day2: string) => {
        // First, find seasons where the selected team made surprises on day1
        const surpriseSeasons = new Set(
            matchData
                .filter(m => {
                    const matchDay = getDayName(new Date((Number(m.Date) - 25569) * 86400 * 1000));
                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                    return (m.HomeTeam === team || m.AwayTeam === team) && 
                           matchDay === day1 && 
                           isSurprise;
                })
                .map(m => getSeasonFromDate(Number(m.Date)))
        );

        // Find trigger matches (X team's surprises on day1)
        const triggerMatches = matchData
            .filter(m => {
                const matchDay = getDayName(new Date((Number(m.Date) - 25569) * 86400 * 1000));
                const season = getSeasonFromDate(Number(m.Date));
                const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                return (m.HomeTeam === team || m.AwayTeam === team) && 
                       matchDay === day1 && 
                       isSurprise;
            })
            .map(m => {
                const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                return {
                    date: rawDate.toLocaleDateString('tr-TR'),
                    rawDate: rawDate,
                    season: getSeasonFromDate(Number(m.Date)),
                    homeTeam: m.HomeTeam,
                    awayTeam: m.AwayTeam,
                    score: `${m.FTHG}-${m.FTAG}`,
                    htScore: `${m.HTHG}-${m.HTAG}`,
                    dayOfWeek: day1
                };
            });

        // Find all surprise matches on day2 but only in seasons where X team made surprises on day1
        const nextDaySurprises = matchData
            .filter(m => {
                const matchDay = getDayName(new Date((Number(m.Date) - 25569) * 86400 * 1000));
                const season = getSeasonFromDate(Number(m.Date));
                const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                return matchDay === day2 && 
                       isSurprise && 
                       surpriseSeasons.has(season); // Only include matches from seasons where X team made surprises
            })
            .map(m => {
                const rawDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                
                // Check if this match is related to any trigger match
                const relatedTriggerMatches = triggerMatches.filter(tm => 
                    tm.season === getSeasonFromDate(Number(m.Date))
                );
                
                // Determine if it's the next day or same month
                let isNextDay = false;
                let isSameMonth = false;
                
                if (relatedTriggerMatches.length > 0) {
                    for (const triggerMatch of relatedTriggerMatches) {
                        // Check if it's the next day (24 hours difference)
                        const timeDiff = rawDate.getTime() - triggerMatch.rawDate.getTime();
                        const dayDiff = timeDiff / (1000 * 3600 * 24);
                        
                        if (dayDiff >= 1 && dayDiff < 2) {
                            isNextDay = true;
                        }
                        
                        // Check if it's in the same month
                        if (rawDate.getMonth() === triggerMatch.rawDate.getMonth() && 
                            rawDate.getFullYear() === triggerMatch.rawDate.getFullYear()) {
                            isSameMonth = true;
                        }
                    }
                }
                
                return {
                    date: rawDate.toLocaleDateString('tr-TR'),
                    rawDate: rawDate,
                    season: getSeasonFromDate(Number(m.Date)),
                    homeTeam: m.HomeTeam,
                    awayTeam: m.AwayTeam,
                    score: `${m.FTHG}-${m.FTAG}`,
                    htScore: `${m.HTHG}-${m.HTAG}`,
                    dayOfWeek: day2,
                    isNextDay,
                    isSameMonth
                };
            });

        setResults({
            triggerMatches,
            nextDaySurprises
        });
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setFirstDay(null);
        setSecondDay(null);
        setResults(null);
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
                    {!results ? (
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBack}
                                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <TeamLogo name={selectedTeam} className="w-12 h-12" />
                                    <h2 className="text-xl font-semibold text-white">
                                        {selectedTeam}
                                    </h2>
                                </div>
                            </div>
                            
                            <DaySelector
                                selectedDay={firstDay}
                                secondSelectedDay={secondDay}
                                onSelect={handleDaySelect}
                                title={firstDay ? "İkinci Günü Seçin" : "İlk Günü Seçin"}
                            />
                        </div>
                    ) : (
                        <ResultsDisplay
                            selectedTeam={selectedTeam}
                            firstDay={firstDay!}
                            secondDay={secondDay!}
                            results={results}
                            onBack={handleBack}
                        />
                    )}
                </div>
            )}
        </>
    );
} 