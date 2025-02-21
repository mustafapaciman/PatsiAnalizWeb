import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Match } from '../../utils/types/match';
import { TeamLogo } from '../TeamLogo';

interface ScoreSearchFormProps {
  onSearch: (team: string, score: [number, number]) => void;
  matchData: Match[];
  selectedLeague: string;
  onTeamSelect: (team: string) => void;
}

export function ScoreSearchForm({ onSearch, matchData, selectedLeague, onTeamSelect }: ScoreSearchFormProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [step, setStep] = useState<'team' | 'score'>('team');

  // Takımları filtrele - WeekAnalysisModal'dan alındı
  const teams = useMemo(() => {
    console.log('ScoreSearchForm props:', { 
      matchDataLength: matchData?.length, 
      selectedLeague,
      firstMatch: matchData?.[0]
    });

    if (!selectedLeague) {
      console.warn('selectedLeague is undefined!');
      return [];
    }

    const filteredMatches = matchData.filter(m => m.Div === selectedLeague);
    console.log('Filtered matches:', {
      total: filteredMatches.length,
      firstMatch: filteredMatches[0],
      league: selectedLeague
    });

    const uniqueTeams = Array.from(new Set(
      filteredMatches.flatMap(m => [m.HomeTeam, m.AwayTeam])
    )).sort();

    console.log('Found teams:', uniqueTeams);
    return uniqueTeams;
  }, [matchData, selectedLeague]);

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team);
    onTeamSelect(team);
    setStep('score');
  };

  const handleBack = () => {
    setStep('team');
    setHomeScore('');
    setAwayScore('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeam && homeScore && awayScore) {
      onSearch(selectedTeam, [parseInt(homeScore), parseInt(awayScore)]);
    }
  };

  if (step === 'score') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-3">
              <TeamLogo name={selectedTeam} className="w-12 h-12" />
              <h3 className="text-lg font-medium text-gray-300">
                {selectedTeam} için Skor Girin
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="number"
              min="0"
              max="99"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-20 p-3 rounded-lg border bg-gray-800 
                text-gray-100 border-gray-700
                focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                text-center text-2xl font-bold"
              required
              placeholder="0"
            />
            <span className="text-2xl font-medium text-gray-300">
              -
            </span>
            <input
              type="number"
              min="0"
              max="99"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-20 p-3 rounded-lg border bg-gray-800 
                text-gray-100 border-gray-700
                focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                text-center text-2xl font-bold"
              required
              placeholder="0"
            />
            <button
              type="submit"
              className="ml-4 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 
                text-white rounded-lg flex items-center gap-2
                transition-colors"
            >
              <Search size={18} />
              Ara
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-300 mb-6">Takım Seçin</h3>
      <div className="grid grid-cols-6 gap-4">
        {teams.map((team, index) => (
          <button
            key={`${selectedLeague}-${team}-${index}`}
            type="button"
            onClick={() => handleTeamSelect(team)}
            className={`flex flex-col items-center p-4 rounded-xl transition-all
              bg-gray-800/50 hover:bg-gray-800/70`}
          >
            <TeamLogo 
              name={team}
              className="w-16 h-16 mb-2" 
            />
            <span className="text-sm text-center text-gray-300">{team}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 