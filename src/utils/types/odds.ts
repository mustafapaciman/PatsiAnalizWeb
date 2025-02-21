export interface MatchOdds {
  // 1X2 Odds
  homeWin: {
    bet365: { open: number; closed: number; },
    betfair: number;
    betWin: number;
    market: { max: number; avg: number; }
  };
  draw: {
    bet365: { open: number; closed: number; },
    betfair: number;
    betWin: number;
    market: { max: number; avg: number; }
  };
  awayWin: {
    bet365: { open: number; closed: number; },
    betfair: number;
    betWin: number;
    market: { max: number; avg: number; }
  };
  
  // Over/Under 2.5 Goals
  over25: {
    bet365: { open: number; closed: number; },
    betbrain: { max: number; avg: number; },
    market: { max: number; avg: number; }
  };
  under25: {
    bet365: { open: number; closed: number; },
    betbrain: { max: number; avg: number; },
    market: { max: number; avg: number; }
  };
  
  // Asian Handicap
  asianHandicap: {
    bet365: { 
      open: { home: number; away: number; size: number; },
      closed: { home: number; away: number; size: number; }
    },
    betbrain: {
      size: number;
      max: { home: number; away: number; },
      avg: { home: number; away: number; }
    },
    market: {
      size: number;
      max: { home: number; away: number; },
      avg: { home: number; away: number; }
    }
  };
}