import { Match } from './types/match';
import { findScenarioMatches, groupMatchesByOpponent, ScenarioMatch } from './scenarioAnalysis';
import { findSimilarMatches } from './oddsComparison';

export interface AnalysisResult {
  matches: Match[];
  scores: Record<string, number>;
  htftScenarios: Record<string, number>;
  htScores: Record<string, number>;
  htGoals: Record<string, number>;
  ftGoals: Record<string, number>;
  scenarioMatches?: ScenarioMatch[];
  scenariosByOpponent?: { [key: string]: ScenarioMatch[] };
}

export function analyzeMatches(allMatches: Match[], selectedMatch: Match): AnalysisResult {
  // Senaryo bazlı analiz
  const team = selectedMatch.HomeTeam; // veya AwayTeam, duruma göre
  const scenarioMatches = findScenarioMatches(allMatches, team);
  const scenariosByOpponent = groupMatchesByOpponent(scenarioMatches);

  // Benzer maçları oddsComparison'dan al
  const matches = findSimilarMatches(selectedMatch, allMatches);

  // Eğer benzer maç yoksa boş istatistikler döndür
  if (matches.length === 0) {
    return {
      matches: [],
      scores: {},
      htftScenarios: {},
      htScores: {},
      htGoals: {},
      ftGoals: {},
      scenarioMatches,
      scenariosByOpponent
    };
  }

  const scores: Record<string, number> = {};
  const htftScenarios: Record<string, number> = {};
  const htScores: Record<string, number> = {};
  const htGoals: Record<string, number> = {};
  const ftGoals: Record<string, number> = {};

  matches.forEach(match => {
    // Full time scores
    const ftScore = `${match.FTHG ?? 0}-${match.FTAG ?? 0}`;
    scores[ftScore] = (scores[ftScore] || 0) + 1;

    // HT/FT scenarios
    const htResult = getResult(match.HTHG ?? 0, match.HTAG ?? 0);
    const ftResult = getResult(match.FTHG ?? 0, match.FTAG ?? 0);
    const scenario = `${htResult}/${ftResult}`;
    htftScenarios[scenario] = (htftScenarios[scenario] || 0) + 1;

    // Half time scores
    const htScore = `${match.HTHG ?? 0}-${match.HTAG ?? 0}`;
    htScores[htScore] = (htScores[htScore] || 0) + 1;

    // Goals
    const htTotalGoals = (match.HTHG ?? 0) + (match.HTAG ?? 0);
    htGoals[`${htTotalGoals} Gol`] = (htGoals[`${htTotalGoals} Gol`] || 0) + 1;

    const ftTotalGoals = (match.FTHG ?? 0) + (match.FTAG ?? 0);
    ftGoals[`${ftTotalGoals} Gol`] = (ftGoals[`${ftTotalGoals} Gol`] || 0) + 1;
  });

  return {
    matches,
    scores,
    htftScenarios,
    htScores,
    htGoals,
    ftGoals,
    scenarioMatches,
    scenariosByOpponent
  };
}

function getResult(homeGoals: number, awayGoals: number): number {
  if (homeGoals > awayGoals) return 1;
  if (homeGoals < awayGoals) return 2;
  return 0;
}

// Ev/Deplasman dizilim analizi
export const findMatchingHomeAwayPattern = (
  currentMatches: Match[],
  surpriseMatches: Match[],
  teamName: string,
  matchData: Match[]
) => {
  // Son 3 maçın ev/deplasman dizilimini al
  const getCurrentPattern = (matches: Match[]) => {
    return matches.slice(0, 3).map(m => m.HomeTeam === teamName ? 'H' : 'A');
  };

  // Sürpriz maç öncesi son 3 maçın dizilimini al
  const getSurprisePrePattern = (surpriseMatch: Match) => {
    const matchDate = new Date(surpriseMatch.Date);
    const previousMatches = matchData
      .filter(m => 
        (m.HomeTeam === teamName || m.AwayTeam === teamName) &&
        new Date(m.Date) < matchDate
      )
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, 3)
      .map(m => m.HomeTeam === teamName ? 'H' : 'A');
    
    return previousMatches;
  };

  // Mevcut dizilim
  const currentPattern = getCurrentPattern(currentMatches);
  
  // Her sürpriz maç için kontrol et
  const matchingPatterns = surpriseMatches.map(match => {
    const surprisePattern = getSurprisePrePattern(match);
    const isMatching = JSON.stringify(currentPattern) === JSON.stringify(surprisePattern);
    
    return {
      match,
      pattern: surprisePattern,
      isMatching
    };
  }).filter(item => item.isMatching);

  return {
    currentPattern,
    matchingPatterns
  };
};