import React from 'react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { StatisticsTable } from './StatisticsTable';
import { findSimilarMatches } from '../utils/oddsComparison';

interface StatisticsProps {
  data: {
    matches: Match[];
    scores: { [key: string]: number };
    htftScenarios: { [key: string]: number };
    htScores: { [key: string]: number };
    htGoals: { [key: string]: number };
    ftGoals: { [key: string]: number };
  };
  selectedMatch: Match;
  allMatches: Match[];
  teamData: TeamMapping;
}

export function Statistics({ selectedMatch, allMatches, teamData }: StatisticsProps) {
  // Benzer maçları bul
  const similarMatches = findSimilarMatches(selectedMatch, allMatches);

  // Sonuç formatını dönüştür (H/D/A -> 1/X/2)
  const convertResult = (result: string) => {
    switch(result) {
      case 'H': return '1';
      case 'D': return 'X';
      case 'A': return '2';
      default: return result;
    }
  };

  // İstatistikleri hesapla
  const calculateStats = () => {
    const stats = {
      matches: similarMatches,
      scores: {} as { [key: string]: number },
      htftScenarios: {} as { [key: string]: number },
      htScores: {} as { [key: string]: number },
      htGoals: {} as { [key: string]: number },
      ftGoals: {} as { [key: string]: number }
    };

    similarMatches.forEach(match => {
      // Maç skorları
      const score = `${match.FTHG}-${match.FTAG}`;
      stats.scores[score] = (stats.scores[score] || 0) + 1;

      // İY/MS senaryoları (1/X/2 formatında)
      const htftScenario = `${convertResult(match.HTR)}/${convertResult(match.FTR)}`;
      stats.htftScenarios[htftScenario] = (stats.htftScenarios[htftScenario] || 0) + 1;

      // İlk yarı skorları
      const htScore = `${match.HTHG}-${match.HTAG}`;
      stats.htScores[htScore] = (stats.htScores[htScore] || 0) + 1;

      // İlk yarı toplam gol
      const htGoals = Number(match.HTHG) + Number(match.HTAG);
      stats.htGoals[htGoals.toString()] = (stats.htGoals[htGoals.toString()] || 0) + 1;

      // Maç sonu toplam gol
      const ftGoals = Number(match.FTHG) + Number(match.FTAG);
      stats.ftGoals[ftGoals.toString()] = (stats.ftGoals[ftGoals.toString()] || 0) + 1;
    });

    return stats;
  };

  const stats = calculateStats();

  return (
    <div className={`${className} p-6 space-y-6`}>
      <div className="grid grid-cols-3 gap-6">
        {stats.map(stat => (
          <div
            key={stat.title}
            className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {stat.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}