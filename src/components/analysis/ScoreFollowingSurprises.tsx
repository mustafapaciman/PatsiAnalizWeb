import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';
import type { Match } from '../../utils/types/match';
import {
  buildLeagueSeasonIndex, findScoreTriggers, findFollowingSurprises, displayMatchDate,
  type IndexedLeagueMatch, type ScoreDirection, type ScoreTrigger
} from '../../utils/scoreFollowingSurprises';

interface Props { league: string; matchData: Match[]; onClose: () => void }
interface Query { team: string; scored: number; conceded: number; direction: ScoreDirection; redCardOnly: boolean }

function FixtureCard({ fixture, label, accent = false }: { fixture: IndexedLeagueMatch; label: string; accent?: boolean }) {
  const m = fixture.match;
  const halfTime = String(m.HTHG ?? '').trim() !== '' && String(m.HTAG ?? '').trim() !== '';
  const redCards = Number(m.HR ?? 0) + Number(m.AR ?? 0);
  return (
    <div className={`min-w-0 rounded-xl border p-4 ${accent ? 'border-blue-500/40 bg-blue-950/40' : 'border-gray-700 bg-gray-800/50'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={accent ? 'font-semibold text-blue-200' : 'font-semibold text-gray-200'}>{label}</span>
        <span className="text-gray-400">{displayMatchDate(fixture.day)}</span>
      </div>
      <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
        <div className="flex min-w-0 flex-col items-center gap-2"><TeamLogo name={m.HomeTeam} className="h-10 w-10" /><span className="break-words text-sm text-white">{m.HomeTeam}</span></div>
        <div><div className="whitespace-nowrap text-xl font-bold text-white">{m.FTHG}–{m.FTAG}</div><div className="whitespace-nowrap text-sm text-gray-400">İY {halfTime ? `${m.HTHG}–${m.HTAG}` : 'bilinmiyor'}</div></div>
        <div className="flex min-w-0 flex-col items-center gap-2"><TeamLogo name={m.AwayTeam} className="h-10 w-10" /><span className="break-words text-sm text-white">{m.AwayTeam}</span></div>
      </div>
      {(redCards > 0 || Number(m.RC) > 0) && <p className="mt-3 text-sm text-red-300">Kırmızı kart: {Number(m.HR) > 0 ? `${m.HomeTeam} (${m.HR}) ` : ''}{Number(m.AR) > 0 ? `${m.AwayTeam} (${m.AR})` : ''}{redCards === 0 ? m.RC : ''}</p>}
    </div>
  );
}

export function ScoreFollowingSurprises({ league, matchData, onClose }: Props) {
  const index = useMemo(() => buildLeagueSeasonIndex(matchData, league), [matchData, league]);
  const teams = useMemo(() => [...new Set([...index.values()].flatMap(s => [...s.byTeam.keys()]))].sort((a, b) => a.localeCompare(b, 'tr')), [index]);
  const [team, setTeam] = useState('');
  const [scored, setScored] = useState('4');
  const [conceded, setConceded] = useState('0');
  const [direction, setDirection] = useState<ScoreDirection>('either');
  const [redCardOnly, setRedCardOnly] = useState(false);
  const [query, setQuery] = useState<Query | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [error, setError] = useState('');
  const groups = useMemo(() => query ? findScoreTriggers(index, query.team, query.scored, query.conceded, query.direction, query.redCardOnly) : new Map<string, ScoreTrigger[]>(), [index, query]);
  const blocks = useMemo(() => {
    if (!selectedSeason) return [];
    const season = index.get(selectedSeason);
    if (!season) return [];
    return (groups.get(selectedSeason) ?? []).map(trigger => ({ trigger, window: findFollowingSurprises(season, trigger.fixture.day) }));
  }, [groups, index, selectedSeason]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const a = Number(scored), b = Number(conceded);
    if (!team || scored.trim() === '' || conceded.trim() === '' || !Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a > 30 || b > 30) {
      setError('X takımını seçin ve 0–30 arasında iki tam sayı girin.');
      return;
    }
    setError('');
    const nextQuery = { team, scored: a, conceded: b, direction, redCardOnly };
    setQuery(nextQuery);
    const found = findScoreTriggers(index, team, a, b, direction, redCardOnly);
    setSelectedSeason(found.keys().next().value ?? null);
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto pr-1 text-gray-200">
      <button onClick={onClose} className="mb-4 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-300 hover:bg-gray-800"><ArrowLeft className="h-4 w-4" />Formüllere dön</button>
      <h2 className="text-xl font-bold text-white sm:text-2xl">X Takımı + Skor → Sonraki 5 Maçta Sürpriz</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">X takımının girdiğiniz skoru çıkardığı maçlar tüm sezonlarda bulunur. Bir sezon seçtiğinizde, her skor maçının tarihinden sonra aynı ligdeki her takımın oynadığı ilk 5 maçta gerçekleşen İY/MS 1/2 ve 2/1 sonuçları listelenir.</p>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-gray-700 bg-gray-800/40 p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <label className="min-w-0 text-sm font-medium">X takımı
            <select required value={team} onChange={e => setTeam(e.target.value)} className="mt-2 w-full min-w-0 rounded-lg border border-gray-600 bg-gray-900 p-3 text-base text-white"><option value="">Takım seçin</option>{teams.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </label>
          <fieldset className="min-w-0"><legend className="text-sm font-medium">Maç sonu skoru</legend><div className="mt-2 flex items-center gap-2">
            <input aria-label="Skor birinci gol" required type="number" min="0" max="30" step="1" value={scored} onChange={e => setScored(e.target.value)} className="w-20 rounded-lg border border-gray-600 bg-gray-900 p-3 text-center text-base text-white" />
            <span>–</span>
            <input aria-label="Skor ikinci gol" required type="number" min="0" max="30" step="1" value={conceded} onChange={e => setConceded(e.target.value)} className="w-20 rounded-lg border border-gray-600 bg-gray-900 p-3 text-center text-base text-white" />
          </div></fieldset>
          <label className="min-w-0 text-sm font-medium">Skor yönü
            <select value={direction} onChange={e => setDirection(e.target.value as ScoreDirection)} className="mt-2 w-full min-w-0 rounded-lg border border-gray-600 bg-gray-900 p-3 text-base text-white">
              <option value="either">İki yön de: {scored || '0'}–{conceded || '0'} / {conceded || '0'}–{scored || '0'}</option>
              <option value="team">X açısından: attığı – yediği</option>
              <option value="home-away">Ev sahibi – deplasman</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={redCardOnly} onChange={e => setRedCardOnly(e.target.checked)} className="h-4 w-4 accent-blue-500" />Skor maçında kırmızı kart da olsun</label>
          <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500"><Search className="h-4 w-4" />Tüm sezonlarda ara</button>
        </div>
        {redCardOnly && <p className="text-sm text-gray-400">Yalnızca kırmızı kartı veri kaynağında kayıtlı skor maçları alınır; kart bilgisi eksik maçlar eşleşmez.</p>}
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </form>

      {query && <section className="mt-6 space-y-5" aria-label="Skor eşleşmeleri">
        <div><h3 className="font-semibold text-white">{query.team} · {query.scored}–{query.conceded}{query.direction === 'either' && query.scored !== query.conceded ? ` / ${query.conceded}–${query.scored}` : ''}{query.redCardOnly ? ' · Kırmızı kartlı' : ''}</h3>
          <p className="mt-1 text-sm text-gray-400">{groups.size} sezonda {[...groups.values()].reduce((n, triggers) => n + triggers.length, 0)} skor maçı. Detayları açmak için sezon seçin.</p></div>
        {groups.size === 0 ? <p className="rounded-xl border border-gray-700 bg-gray-800/40 p-6 text-gray-300">Seçilen takım ve skor için kayıtlı maç bulunamadı.</p> : <>
          <div className="flex flex-wrap gap-2" aria-label="Bulunan sezonlar">{[...groups.entries()].map(([season, triggers]) => <button key={season} onClick={() => setSelectedSeason(season)} aria-pressed={selectedSeason === season} className={`rounded-lg border px-4 py-3 text-sm font-semibold ${selectedSeason === season ? 'border-blue-400 bg-blue-600 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-blue-500'}`}>{season} <span className="ml-1 font-normal">({triggers.length})</span></button>)}</div>
          {blocks.map(({ trigger, window }, triggerIndex) => <article key={trigger.fixture.key} className="space-y-4 rounded-xl border border-gray-700 p-3 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-white">{selectedSeason} · Skor maçı {triggerIndex + 1}</h3><span className="text-sm text-gray-400">{query.team} sezonun {trigger.fixture.teamMatchNumbers[query.team]}. maçında</span></div>
            <FixtureCard fixture={trigger.fixture} label="Aranan skor" accent />
            <p className="text-sm text-blue-200">Skor maçının rakibi: <strong>{trigger.opponent}</strong></p>
            <div className="rounded-lg bg-gray-800/70 p-3 text-sm leading-relaxed text-gray-300"><strong className="text-white">{window.surprises.length} sürpriz / {window.checkedMatches} farklı maç</strong> tarandı. {window.completeTeams}/{window.totalTeams} takımın beş maçlık aralığı tamamlandı. Aynı maç iki takımın aralığına girerse tek kez gösterilir.</div>
            {window.completeTeams < window.totalTeams && <p className="text-sm text-amber-300">Bazı takımların bu tarihten sonra aynı sezonda henüz 5 oynanmış maçı yok. Mevcut maçlar tarandı; sezon dışına çıkılmadı.</p>}
            {window.unclassifiedMatches > 0 && <p className="text-sm text-amber-300">{window.unclassifiedMatches} maçın ilk yarı skoru eksik; bu maçlar sürpriz olarak sınıflandırılamadı.</p>}
            {window.surprises.length === 0 ? <p className="py-4 text-center text-gray-400">Bu skor tarihinden sonraki ilk beş maç aralıklarında sürpriz bulunamadı.</p> : <div className="grid gap-4 lg:grid-cols-2">{window.surprises.map(result => <div key={result.fixture.key} className="space-y-3 rounded-xl border border-gray-700 bg-gray-950/30 p-3">
              <FixtureCard fixture={result.fixture} label={`Sürpriz · İY/MS ${result.direction}`} />
              <div className="space-y-2">{result.positions.map(position => <div key={position.team} className="flex flex-wrap items-center gap-2 text-sm"><ChevronRight className="h-4 w-4 text-blue-400" /><span className="font-semibold text-white">{position.team}</span><span className="rounded bg-blue-500/15 px-2 py-1 text-blue-200">Skordan sonraki {position.after}. maç</span><span className="text-gray-400">Sezonun {position.seasonMatch}. maçı</span></div>)}</div>
              {[result.fixture.match.HomeTeam, result.fixture.match.AwayTeam].includes(trigger.opponent) && <p className="text-sm font-semibold text-amber-300">Skor maçının rakibi de bu sürprizde: {trigger.opponent}</p>}
            </div>)}</div>}
          </article>)}
        </>}
      </section>}
    </div>
  );
}
