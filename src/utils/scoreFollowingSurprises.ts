import type { Match } from './types/match';

export type ScoreDirection = 'either' | 'team' | 'home-away';
export interface IndexedLeagueMatch {
  key: string;
  day: number;
  season: string;
  match: Match;
  teamMatchNumbers: Record<string, number>;
}
export interface LeagueSeasonIndex {
  matches: IndexedLeagueMatch[];
  byTeam: Map<string, IndexedLeagueMatch[]>;
}
export interface ScoreTrigger {
  fixture: IndexedLeagueMatch;
  opponent: string;
}
export interface FollowingSurprise {
  fixture: IndexedLeagueMatch;
  direction: '1/2' | '2/1';
  positions: { team: string; after: number; seasonMatch: number }[];
}
export interface FollowingWindow {
  surprises: FollowingSurprise[];
  checkedMatches: number;
  totalTeams: number;
  completeTeams: number;
  unclassifiedMatches: number;
}

const DAY = 86400000;
const integerGoal = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

// Compare calendar dates, not fixture rounds or the selected team's match ordinal.
export function matchDay(value: unknown): number | null {
  if (value instanceof Date) {
    const n = Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value.trim()))) {
    const serial = Number(value);
    return Number.isFinite(serial) && serial > 20000 && serial < 100000
      ? Math.floor(serial - 25569) * DAY : null;
  }
  if (typeof value !== 'string') return null;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const euro = value.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})$/);
  if (!iso && !euro) return null;
  const year = iso ? Number(iso[1]) : Number(euro![3]) + (euro![3].length === 2 ? 2000 : 0);
  const month = Number(iso ? iso[2] : euro![2]);
  const date = Number(iso ? iso[3] : euro![1]);
  const day = Date.UTC(year, month - 1, date);
  const check = new Date(day);
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === date ? day : null;
}

export function seasonOf(match: Match, day: number): string {
  const explicit = String(match.Season ?? '').match(/^(\d{4})[-/](\d{4}|\d{2})$/);
  if (explicit) return `${explicit[1]}-${explicit[2].length === 2 ? Number(explicit[1].slice(0, 2)) * 100 + Number(explicit[2]) : explicit[2]}`;
  const date = new Date(day);
  const start = date.getUTCFullYear() - (date.getUTCMonth() < 6 ? 1 : 0);
  return `${start}-${start + 1}`;
}

export function hasFullTimeScore(match: Match): boolean {
  return integerGoal(match.FTHG) !== null && integerGoal(match.FTAG) !== null;
}

export function surpriseDirection(match: Match): '1/2' | '2/1' | null {
  const htHome = integerGoal(match.HTHG), htAway = integerGoal(match.HTAG);
  const ftHome = integerGoal(match.FTHG), ftAway = integerGoal(match.FTAG);
  if (htHome === null || htAway === null || ftHome === null || ftAway === null) return null;
  if (htHome > htAway && ftHome < ftAway) return '1/2';
  if (htHome < htAway && ftHome > ftAway) return '2/1';
  return null;
}

export function buildLeagueSeasonIndex(data: Match[], league: string): Map<string, LeagueSeasonIndex> {
  const seasons = new Map<string, LeagueSeasonIndex>();
  const seen = new Set<string>();
  for (const match of data) {
    if (match.Div !== league || match.isUEFA || !match.HomeTeam || !match.AwayTeam || !hasFullTimeScore(match)) continue;
    const day = matchDay(match.Date);
    if (day === null) continue;
    const season = seasonOf(match, day);
    const key = JSON.stringify([league, season, day, match.HomeTeam, match.AwayTeam]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!seasons.has(season)) seasons.set(season, { matches: [], byTeam: new Map() });
    seasons.get(season)!.matches.push({ key, day, season, match, teamMatchNumbers: {} });
  }
  for (const season of seasons.values()) {
    season.matches.sort((a, b) => a.day - b.day || String(a.match.Time ?? '').localeCompare(String(b.match.Time ?? '')) || a.key.localeCompare(b.key));
    for (const fixture of season.matches) {
      for (const team of [fixture.match.HomeTeam, fixture.match.AwayTeam]) {
        if (!season.byTeam.has(team)) season.byTeam.set(team, []);
        const matches = season.byTeam.get(team)!;
        matches.push(fixture);
        fixture.teamMatchNumbers[team] = matches.length;
      }
    }
  }
  return seasons;
}

export function findScoreTriggers(index: Map<string, LeagueSeasonIndex>, team: string, scored: number, conceded: number, direction: ScoreDirection, redCardOnly = false): Map<string, ScoreTrigger[]> {
  const groups = new Map<string, ScoreTrigger[]>();
  for (const [season, data] of index) {
    for (const fixture of data.byTeam.get(team) ?? []) {
      const m = fixture.match;
      const h = Number(m.FTHG), a = Number(m.FTAG);
      const teamHome = m.HomeTeam === team;
      const matches = direction === 'either'
        ? (h === scored && a === conceded) || (h === conceded && a === scored)
        : direction === 'home-away' ? h === scored && a === conceded
        : (teamHome ? h : a) === scored && (teamHome ? a : h) === conceded;
      if (!matches || (redCardOnly && !(Number(m.HR) > 0 || Number(m.AR) > 0 || Number(m.RC) > 0))) continue;
      if (!groups.has(season)) groups.set(season, []);
      groups.get(season)!.push({ fixture, opponent: teamHome ? m.AwayTeam : m.HomeTeam });
    }
  }
  return new Map([...groups.entries()].sort(([a], [b]) => b.localeCompare(a)));
}

// First five PLAYED league fixtures for EACH team strictly after the trigger day.
// A fixture may be #6 for one participant and #4 for the other; keep it once,
// with only the qualifying participant's position.
export function findFollowingSurprises(index: LeagueSeasonIndex, triggerDay: number): FollowingWindow {
  const candidates = new Map<string, { fixture: IndexedLeagueMatch; positions: FollowingSurprise['positions'] }>();
  let completeTeams = 0;
  for (const [team, fixtures] of index.byTeam) {
    let low = 0, high = fixtures.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (fixtures[mid].day <= triggerDay) low = mid + 1;
      else high = mid;
    }
    const window = fixtures.slice(low, low + 5);
    if (window.length === 5) completeTeams++;
    window.forEach((fixture, i) => {
      if (!candidates.has(fixture.key)) candidates.set(fixture.key, { fixture, positions: [] });
      candidates.get(fixture.key)!.positions.push({ team, after: i + 1, seasonMatch: fixture.teamMatchNumbers[team] });
    });
  }
  let unclassifiedMatches = 0;
  const surprises: FollowingSurprise[] = [];
  for (const candidate of candidates.values()) {
    const { match } = candidate.fixture;
    if (integerGoal(match.HTHG) === null || integerGoal(match.HTAG) === null) unclassifiedMatches++;
    const direction = surpriseDirection(match);
    if (direction) surprises.push({ ...candidate, direction });
  }
  surprises.sort((a, b) => a.fixture.day - b.fixture.day || a.fixture.key.localeCompare(b.fixture.key));
  return { surprises, checkedMatches: candidates.size, totalTeams: index.byTeam.size, completeTeams, unclassifiedMatches };
}

export function displayMatchDate(day: number): string {
  return new Date(day).toLocaleDateString('tr-TR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
}
