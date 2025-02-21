export interface PatternResult {
    season: string;
    surpriseMatch: {
        date: string;
        score: string;
        homeTeam: string;
        awayTeam: string;
    };
    previousMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchNumber: number;
    }[];
    currentSeasonMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchNumber: number;
    }[];
    matchingPairs: {
        previous: number;
        current: number;
    }[];
}

export interface ScoreBasedResult {
    team: string;
    season: string;
    matchWithScore: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        opponent: string;
    };
    surpriseMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchesAfter: number;
    };
}

export interface PotentialXResult {
    team: string;
    season: string;
    surpriseMatch: {
        date: string;
        score: string;
        homeTeam: string;
        awayTeam: string;
    };
    previousMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchNumber: number;
    }[];
    matchingCurrentMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchNumber: number;
    }[];
}

export interface PotentialYResult {
    team: string;
    season: string;
    surpriseMatch: {
        date: string;
        score: string;
        homeTeam: string;
        awayTeam: string;
    };
    previousMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchNumber: number;
    }[];
    matchingCurrentMatches: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
        matchNumber: number;
    }[];
} 