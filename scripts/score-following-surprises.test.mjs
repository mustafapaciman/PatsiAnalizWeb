import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLeagueSeasonIndex, findScoreTriggers, findFollowingSurprises, matchDay, surpriseDirection } from '../src/utils/scoreFollowingSurprises.ts';

const match = (Date, HomeTeam, AwayTeam, extra = {}) => ({ Div: 'T1', Season: '2024-2025', Date, HomeTeam, AwayTeam, FTHG: 1, FTAG: 0, HTHG: 0, HTAG: 0, FTR: 'H', HTR: 'D', ...extra });
const reversal = { FTHG: 2, FTAG: 1, HTHG: 0, HTAG: 1, FTR: 'H', HTR: 'A' };
const anchor = match('2024-09-01', 'X', 'Z', { FTHG: 4 });
const analyze = rows => findFollowingSurprises(buildLeagueSeasonIndex(rows, 'T1').get('2024-2025'), matchDay(anchor.Date));

test('Calendar dates normalize consistently and invalid dates are rejected', () => {
  assert.equal(matchDay('01/09/2024'), matchDay('2024-09-01'));
  assert.equal(matchDay(45536), matchDay('2024-09-01'));
  assert.equal(matchDay('2024-02-31'), null);
  assert.equal(matchDay(''), null);
});

test('The example is found even when X loses 0–4; X-perspective remains exact', () => {
  const index = buildLeagueSeasonIndex([match('2024-09-01', 'Trabzonspor', 'Galatasaray', { FTHG: 4, FTAG: 0, AR: 1 })], 'T1');
  assert.equal(findScoreTriggers(index, 'Galatasaray', 4, 0, 'either').get('2024-2025').length, 1);
  assert.equal(findScoreTriggers(index, 'Galatasaray', 4, 0, 'team').size, 0);
  assert.equal(findScoreTriggers(index, 'Galatasaray', 0, 4, 'team').get('2024-2025').length, 1);
  assert.equal(findScoreTriggers(index, 'Galatasaray', 4, 0, 'either', true).size, 1);
});

test('Every season and every matching trigger in that season is retained', () => {
  const index = buildLeagueSeasonIndex([anchor, match('2024-10-01', 'A', 'X', { FTAG: 4, FTHG: 0 }), match('2023-09-01', 'X', 'B', { Season: '2023-2024', FTHG: 4 })], 'T1');
  const groups = findScoreTriggers(index, 'X', 4, 0, 'either');
  assert.deepEqual([...groups.keys()], ['2024-2025', '2023-2024']);
  assert.equal(groups.get('2024-2025').length, 2);
});

test('First five follow the trigger date, rather than matching X’s ordinal', () => {
  const rows = [anchor, ...Array.from({ length: 8 }, (_, i) => match(`2024-08-${String(i + 1).padStart(2, '0')}`, 'A', 'B')),
    match('2024-09-03', 'A', 'B', reversal)];
  const result = analyze(rows);
  assert.equal(result.surprises.length, 1);
  assert.deepEqual(result.surprises[0].positions.map(p => [p.team, p.after, p.seasonMatch]), [['A', 1, 9], ['B', 1, 9]]);
});

test('The fifth match qualifies; the sixth is excluded for both participants', () => {
  const rows = [anchor, ...Array.from({ length: 6 }, (_, i) => match(`2024-09-${String(i + 2).padStart(2, '0')}`, 'A', 'B', i >= 4 ? reversal : {}))];
  const result = analyze(rows);
  assert.equal(result.checkedMatches, 5);
  assert.equal(result.surprises.length, 1);
  assert.equal(result.surprises[0].positions[0].after, 5);
});

test('A sixth match for one team qualifies as the other team’s first', () => {
  const rows = [anchor, ...Array.from({ length: 5 }, (_, i) => match(`2024-09-${String(i + 2).padStart(2, '0')}`, 'A', 'B')),
    match('2024-09-08', 'A', 'C', reversal)];
  const result = analyze(rows);
  assert.equal(result.surprises.length, 1);
  assert.deepEqual(result.surprises[0].positions.map(p => [p.team, p.after]), [['C', 1]]);
});

test('Same-day matches, other leagues, cups, and next seasons are excluded', () => {
  const rows = [anchor, match('2024-09-01', 'A', 'B', reversal), match('2024-09-02', 'A', 'B', { ...reversal, Div: 'E0' }),
    match('2024-09-03', 'A', 'B', { ...reversal, isUEFA: true }), match('2025-09-01', 'A', 'B', { ...reversal, Season: '2025-2026' })];
  assert.equal(analyze(rows).checkedMatches, 0);
});

test('Duplicates and two qualifying participants produce only one result', () => {
  const fixture = match('2024-09-03', 'A', 'B', reversal);
  const result = analyze([anchor, fixture, { ...fixture }]);
  assert.equal(result.checkedMatches, 1);
  assert.equal(result.surprises.length, 1);
  assert.equal(result.surprises[0].positions.length, 2);
});

test('Unknown halftime stays in the played-match window and is never a reversal', () => {
  const rows = [anchor, ...Array.from({ length: 6 }, (_, i) => match(`2024-09-${String(i + 2).padStart(2, '0')}`, 'A', 'B', i === 0 ? { HTHG: '', HTAG: null } : i === 5 ? reversal : {}))];
  const result = analyze(rows);
  assert.equal(result.checkedMatches, 5);
  assert.equal(result.unclassifiedMatches, 1);
  assert.equal(result.surprises.length, 0);
  assert.equal(surpriseDirection(match('2024-09-03', 'A', 'B', { ...reversal, HTHG: '' })), null);
});

test('Unplayed fixtures are not counted, zero scores are valid, incomplete windows are visible', () => {
  const rows = [anchor, match('2024-09-02', 'A', 'B', { FTHG: '', FTAG: '' }), match('2024-09-03', 'A', 'B', { FTHG: 0, FTAG: 0 })];
  const result = analyze(rows);
  assert.equal(result.checkedMatches, 1);
  assert.equal(result.completeTeams, 0);
  const index = buildLeagueSeasonIndex(rows, 'T1');
  assert.equal(findScoreTriggers(index, 'A', 0, 0, 'either').get('2024-2025').length, 1);
});

test('Explicit season metadata keeps a July season opener in the correct season', () => {
  const index = buildLeagueSeasonIndex([match('2026-07-31', 'A', 'B', { Season: '2026-2027' })], 'T1');
  assert.equal(index.has('2026-2027'), true);
});
