import React from 'react';
import { TeamLogo } from '../../TeamLogo';
import { ChevronDown, X } from 'lucide-react';
import { PatternResult } from './types';

interface PatternResultsProps {
    step: 'team-select' | 'results';
    teams: string[];
    selectedTeams: [string?, string?];
    results: PatternResult[];
    selectedSeason: string | null;
    season: string;
    openCards: string[];
    onTeamSelect: (team: string) => void;
    onTeamRemove: (index: number) => void;
    onAnalyze: () => void;
    toggleCard: (cardId: string) => void;
    groupedResults: Map<string, PatternResult[]>;
}

export function PatternResults({ 
    step,
    teams,
    selectedTeams,
    results,
    selectedSeason,
    season,
    openCards,
    onTeamSelect,
    onTeamRemove,
    onAnalyze,
    toggleCard,
    groupedResults
}: PatternResultsProps) {
    if (step === 'team-select') {
        return (
            <div>
                {/* Seçili takımlar */}
                <div className="flex items-center gap-4 mb-6">
                    {selectedTeams.map((team, index) => team && (
                        <div key={index} className="relative group">
                            <div className="flex items-center gap-2 p-2 pr-4 bg-gray-800 rounded-lg">
                                <div className="w-8 h-8">
                                    <TeamLogo name={team} className="w-full h-full" />
                                </div>
                                <div className="text-white">
                                    {team}
                                </div>
                                <button
                                    onClick={() => onTeamRemove(index)}
                                    className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Takım seçim grid'i */}
                <div className="grid grid-cols-6 gap-4">
                    {teams.map(team => (
                        <button
                            key={team}
                            onClick={() => onTeamSelect(team)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl 
                                ${selectedTeams.includes(team) 
                                    ? 'bg-gray-800/30 opacity-50 cursor-not-allowed' 
                                    : 'bg-gray-800/50 hover:bg-gray-800/70'}`}
                            disabled={selectedTeams.includes(team) || selectedTeams.length >= 2}
                        >
                            <div className="w-16 h-16">
                                <TeamLogo name={team} className="w-full h-full" />
                            </div>
                            <div className="text-sm text-gray-300 text-center">
                                {team}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Analiz butonu */}
                {selectedTeams.length === 2 && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onAnalyze}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                            Analizi Başlat
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Sonuçları göster
    return (
        <div className="space-y-8">
            {results.length > 0 ? (
                Array.from(groupedResults.entries())
                    .filter(([seasonKey]) => !selectedSeason || seasonKey === selectedSeason)
                    .map(([seasonKey, seasonResults]) => (
                        <div key={seasonKey} className="space-y-4">
                            <div className="sticky top-0 bg-gray-900 py-2 z-10">
                                <h3 className="text-lg font-medium text-white">
                                    {seasonKey} Sezonu
                                </h3>
                            </div>
                            
                            {seasonResults.map((result, index) => (
                                <div key={index} className="bg-gray-800/50 rounded-xl overflow-hidden">
                                    {/* Sürpriz maç kartı - tıklanabilir header */}
                                    <button
                                        onClick={() => toggleCard(`result-${seasonKey}-${index}`)}
                                        className="w-full p-6 hover:bg-gray-700/30 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-12 h-12" />
                                                <span className="text-xl text-white font-medium">
                                                    {result.surpriseMatch.score}
                                                </span>
                                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-12 h-12" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-red-400">{result.surpriseMatch.date}</div>
                                            </div>
                                            <ChevronDown 
                                                className={`w-5 h-5 text-gray-400 transition-transform 
                                                    ${openCards.includes(`result-${seasonKey}-${index}`) ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </button>

                                    {/* Açılır kapanır içerik */}
                                    {openCards.includes(`result-${seasonKey}-${index}`) && (
                                        <div className="p-6 pt-0">
                                            {/* Maç karşılaştırmaları */}
                                            <div className="flex gap-4">
                                                {/* Sol taraf: Sürpriz sezonundaki maçlar */}
                                                <div className="flex-1 space-y-2">
                                                    <h4 className="text-lg font-medium text-white mb-4">
                                                        {result.season} Sezonu Maçları
                                                    </h4>
                                                    {result.previousMatches.map((match, matchIndex) => (
                                                        <div 
                                                            key={matchIndex}
                                                            className={`flex items-center justify-between p-4 rounded-lg 
                                                                ${result.matchingPairs.some(p => p.previous === match.matchNumber) 
                                                                    ? 'bg-green-900/20 border border-green-900/30' 
                                                                    : 'bg-gray-800/50'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-gray-400 w-8">{match.matchNumber}.</span>
                                                                <TeamLogo name={match.homeTeam} className="w-8 h-8" />
                                                                <span className="text-white">{match.score}</span>
                                                                <TeamLogo name={match.awayTeam} className="w-8 h-8" />
                                                            </div>
                                                            <span className="text-gray-400">{match.date}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Sağ taraf: Bu sezonki maçlar */}
                                                <div className="flex-1 space-y-2">
                                                    <h4 className="text-lg font-medium text-white mb-4">
                                                        {season} Sezonu Maçları
                                                    </h4>
                                                    {result.currentSeasonMatches.map((match, matchIndex) => (
                                                        <div 
                                                            key={matchIndex}
                                                            className={`flex items-center justify-between p-4 rounded-lg 
                                                                ${result.matchingPairs.some(p => p.current === match.matchNumber) 
                                                                    ? 'bg-green-900/20 border border-green-900/30' 
                                                                    : 'bg-gray-800/50'}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-gray-400 w-8">{match.matchNumber}.</span>
                                                                <TeamLogo name={match.homeTeam} className="w-8 h-8" />
                                                                <span className="text-white">{match.score}</span>
                                                                <TeamLogo name={match.awayTeam} className="w-8 h-8" />
                                                            </div>
                                                            <span className="text-gray-400">{match.date}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-400">
                        Seçilen takımlar için skor örüntüsü bulunamadı.
                    </p>
                </div>
            )}
        </div>
    );
} 