import { Match } from './types/match';

interface MatchingResult {
  matchingCount: number;
  matchingOpponents: string[];
  surpriseDate: string;
}

export function findMatchingOpponents(
  currentMatches: Match[], 
  surpriseMatches: Match[], 
  teamName: string, 
  matchData: Match[]
): MatchingResult | undefined {
  const currentOpponents = currentMatches.map(m => 
    m.HomeTeam === teamName ? m.AwayTeam : m.HomeTeam
  );

  // Her sürpriz maç için önceki 3 maçı ve rakiplerini bul
  const matchingResults = surpriseMatches.map(surprise => {
    const previousMatches = matchData
      .filter(m => 
        (m.HomeTeam === teamName || m.AwayTeam === teamName) &&
        new Date(m.Date) < new Date(surprise.Date)
      )
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, 3);

    const previousOpponents = previousMatches.map(m =>
      m.HomeTeam === teamName ? m.AwayTeam : m.HomeTeam
    );

    // Eşleşen rakipleri bul
    const matchingOpponents = currentOpponents.filter(opponent =>
      previousOpponents.includes(opponent)
    );

    return {
      matchingCount: matchingOpponents.length,
      matchingOpponents,
      surpriseDate: surprise.Date
    };
  });

  // En çok eşleşen sonucu bul
  return matchingResults.sort((a, b) => b.matchingCount - a.matchingCount)[0];
}

// İki takım arası sürpriz kontrolü fonksiyonu
export function findHeadToHeadSurprises(matchData: Match[], team1Name: string, team2Name: string): Match | undefined {
  return matchData
    .filter(m => 
      ((m.HomeTeam === team1Name && m.AwayTeam === team2Name) || 
       (m.HomeTeam === team2Name && m.AwayTeam === team1Name)) &&
      ((m.HTR === "H" && m.FTR === "A") || (m.HTR === "A" && m.FTR === "H"))
    )
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];
} 