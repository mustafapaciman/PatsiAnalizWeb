import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Yardımcı fonksiyonları en üste taşıyalım
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

interface DayBasedSurpriseAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface MatchResult {
    date: string;
    dayOfWeek: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    htScore: string;
    isSurprise: boolean;
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

// Gün Seçme Komponenti
const DaySelector: React.FC<{
    selectedDay: string | null;
    onSelect: (day: string) => void;
}> = ({ selectedDay, onSelect }) => {
    const days = [
        'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
    ];

    return (
        <div className="flex gap-2 flex-wrap">
            {days.map(day => (
                <button
                    key={day}
                    onClick={() => onSelect(day)}
                    className={`px-4 py-2 rounded-lg transition-colors
                        ${selectedDay === day 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                    {day}
                </button>
            ))}
        </div>
    );
};

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    selectedDay: string;
    results: MatchResult[];
    onBack: () => void;
}> = ({ selectedTeam, selectedDay, results, onBack }) => {
    const surpriseMatches = results.filter(r => r.isSurprise);
    const normalMatches = results.filter(r => !r.isSurprise);

    return (
        <div className="space-y-8 h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
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
                        <p className="text-blue-200 mt-1">{selectedDay} Günü Analizi</p>
                    </div>
                </div>
            </div>

            {/* Sonuçlar */}
            <div className="flex gap-4 flex-1 overflow-hidden">
                {/* Sol: Sürpriz Maçlar */}
                <div className="flex-1 bg-gray-800/30 rounded-xl p-4 overflow-y-auto">
                    <h3 className="text-lg font-medium text-white mb-4 sticky top-0 bg-gray-900 py-2">
                        Sürpriz Sonuçlar ({surpriseMatches.length})
                    </h3>
                    <div className="space-y-3">
                        {surpriseMatches.map((match, idx) => (
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
                                        <div className="text-sm text-gray-400">{match.date}</div>
                                        <div className="text-xs text-gray-500">{match.dayOfWeek}</div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    İY: {match.htScore}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sağ: Normal Maçlar */}
                <div className="flex-1 bg-gray-800/30 rounded-xl p-4 overflow-y-auto">
                    <h3 className="text-lg font-medium text-white mb-4 sticky top-0 bg-gray-900 py-2">
                        Başarısız Denemeler ({normalMatches.length})
                    </h3>
                    <div className="space-y-3">
                        {normalMatches.map((match, idx) => (
                            <div key={idx} className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-4">
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
                                        <div className="text-sm text-gray-400">{match.date}</div>
                                        <div className="text-xs text-gray-500">{match.dayOfWeek}</div>
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

export function DayBasedSurpriseAnalysis({
    league,
    season,
    matchData,
    onClose
}: DayBasedSurpriseAnalysisProps) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [results, setResults] = useState<MatchResult[]>([]);

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
    };

    const handleDaySelect = (day: string) => {
        setSelectedDay(day);
        if (selectedTeam) {
            analyzeMatches(selectedTeam, day);
        }
    };

    const analyzeMatches = (team: string, day: string) => {
        const teamMatches = matchData
            .filter(m => 
                (m.HomeTeam === team || m.AwayTeam === team) &&
                getDayName(new Date((Number(m.Date) - 25569) * 86400 * 1000)) === day
            )
            .map(m => ({
                date: new Date((Number(m.Date) - 25569) * 86400 * 1000).toLocaleDateString('tr-TR'),
                dayOfWeek: day,
                homeTeam: m.HomeTeam,
                awayTeam: m.AwayTeam,
                score: `${m.FTHG}-${m.FTAG}`,
                htScore: `${m.HTHG}-${m.HTAG}`,
                isSurprise: (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
            }));

        setResults(teamMatches);
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setSelectedDay(null);
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
                <div className="p-6 h-screen">
                    {!selectedDay ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBack}
                                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                                </button>
                                <h2 className="text-xl font-semibold text-white">
                                    Gün Seçin
                                </h2>
                            </div>
                            <DaySelector
                                selectedDay={selectedDay}
                                onSelect={handleDaySelect}
                            />
                        </div>
                    ) : (
                        <ResultsDisplay
                            selectedTeam={selectedTeam}
                            selectedDay={selectedDay}
                            results={results}
                            onBack={handleBack}
                        />
                    )}
                </div>
            )}
        </>
    );
} 