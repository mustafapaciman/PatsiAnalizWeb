import React from 'react';
import { TeamLogo } from '../../TeamLogo';
import { ScoreBasedResult } from './types';

interface ScoreBasedAnalysisProps {
    teams: string[];
    selectedScore: string;
    selectedOpponent: string;
    scoreBasedResults: ScoreBasedResult[];
    onScoreChange: (score: string) => void;
    onOpponentChange: (opponent: string) => void;
    onAnalyze: () => void;
    selectedTeams: [string?, string?];
}

export function ScoreBasedAnalysis({
    teams,
    selectedScore,
    selectedOpponent,
    scoreBasedResults,
    onScoreChange,
    onOpponentChange,
    onAnalyze,
    selectedTeams
}: ScoreBasedAnalysisProps) {
    return (
        <div className="space-y-6">
            {/* Skor ve rakip seçimi */}
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Örn: 2-0"
                    value={selectedScore}
                    onChange={(e) => onScoreChange(e.target.value)}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500"
                />
                <select
                    value={selectedOpponent}
                    onChange={(e) => onOpponentChange(e.target.value)}
                    className="px-4 py-2 bg-gray-800 rounded-lg text-white border border-gray-700 focus:border-blue-500"
                >
                    <option value="">Rakip Seçin</option>
                    <option value="any">Herhangi Bir Rakip</option>
                    {teams.map(team => (
                        <option key={team} value={team}>{team}</option>
                    ))}
                </select>
                <button
                    onClick={onAnalyze}
                    disabled={!selectedScore || !selectedOpponent || !selectedTeams[0]}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Analiz Et
                </button>
            </div>

            {/* Sonuçlar */}
            {scoreBasedResults.length > 0 ? (
                <div className="space-y-4">
                    {scoreBasedResults.map((result, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-lg font-medium text-white">
                                    {result.season} Sezonu
                                </div>
                            </div>
                            
                            {/* Seçilen skorlu maç */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-900/20 border border-blue-900/30 mb-4">
                                <div className="flex items-center gap-4">
                                    <TeamLogo name={result.matchWithScore.homeTeam} className="w-12 h-12" />
                                    <span className="text-xl text-white font-medium">
                                        {result.matchWithScore.score}
                                    </span>
                                    <TeamLogo name={result.matchWithScore.awayTeam} className="w-12 h-12" />
                                </div>
                                <div className="text-right">
                                    <div className="text-blue-400">{result.matchWithScore.date}</div>
                                </div>
                            </div>

                            {/* Sürpriz maç */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/20 border border-red-900/30">
                                <div className="flex items-center gap-4">
                                    <TeamLogo name={result.surpriseMatch.homeTeam} className="w-12 h-12" />
                                    <span className="text-xl text-white font-medium">
                                        {result.surpriseMatch.score}
                                    </span>
                                    <TeamLogo name={result.surpriseMatch.awayTeam} className="w-12 h-12" />
                                </div>
                                <div className="text-right">
                                    <div className="text-red-400">{result.surpriseMatch.date}</div>
                                    <div className="text-sm text-gray-400">
                                        {result.surpriseMatch.matchesAfter} maç sonra
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-400">
                        Seçilen kriterlere uygun sonuç bulunamadı.
                    </p>
                </div>
            )}
        </div>
    );
} 