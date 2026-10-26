import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import XLSX from 'xlsx';

const source = 'https://football-data.co.uk/mmz4281/2627/all-euro-data-2026-2027.xlsx';
const root = process.cwd();
const destination = path.join(root, 'public/data/2026-2027.xlsx');
const reference = process.argv[3] || destination;
const required = ['Div', 'Date', 'HomeTeam', 'AwayTeam', 'FTHG', 'FTAG', 'HTHG', 'HTAG'];
const read = buffer => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const rows = new Map();
  for (const name of workbook.SheetNames) {
    const matches = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
    if (matches.length === 0 || required.some(field => !(field in matches[0]))) throw new Error(`Eksik kolon veya boş lig: ${name}`);
    const keys = new Set();
    for (const match of matches) {
      if (match.Div !== name || !Number.isFinite(Number(match.Date)) || !match.HomeTeam || !match.AwayTeam) throw new Error(`Geçersiz maç: ${name}`);
      const key = [match.Date, match.HomeTeam, match.AwayTeam].join('|');
      if (keys.has(key)) throw new Error(`Tekrar eden maç: ${key}`);
      keys.add(key);
      if (!['FTHG', 'FTAG', 'HTHG', 'HTAG'].every(field => Number.isInteger(match[field]) && match[field] >= 0)) throw new Error(`Eksik skor: ${key}`);
    }
    rows.set(name, matches);
  }
  return rows;
};

let buffer;
if (process.argv[2]) buffer = await fs.readFile(process.argv[2]);
else {
  const response = await fetch(source, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Veri indirilemedi: ${response.status}`);
  buffer = Buffer.from(await response.arrayBuffer());
}
const fresh = read(buffer);
if (fresh.size !== 22) throw new Error(`22 lig bekleniyordu, ${fresh.size} bulundu.`);
let previous = new Map();
try { previous = read(await fs.readFile(reference)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const isoDate = serial => new Date((Math.floor(Number(serial)) - 25569) * 86400000).toISOString().slice(0, 10);
const leagues = [];
for (const [league, matches] of fresh) {
  const before = previous.get(league) ?? [];
  const map = new Map(matches.map(match => [[match.Date, match.HomeTeam, match.AwayTeam].join('|'), match]));
  const missing = before.filter(match => !map.has([match.Date, match.HomeTeam, match.AwayTeam].join('|')));
  if (missing.length) throw new Error(`${league}: Eski dosyadaki ${missing.length} maç yeni dosyada yok; otomatik değiştirilmedi.`);
  leagues.push({ league, matches: matches.length, previousMatches: before.length, added: matches.length - before.length, latestMatchDate: matches.map(match => isoDate(match.Date)).sort().at(-1) });
}
const metadata = {
  season: '2026-2027', source, retrievedAt: new Date().toISOString(),
  sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
  latestMatchDate: leagues.map(l => l.latestMatchDate).sort().at(-1),
  totalMatches: leagues.reduce((n, l) => n + l.matches, 0),
  addedMatches: leagues.reduce((n, l) => n + l.added, 0), leagues
};
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, buffer);
await fs.writeFile(path.join(root, 'public/data/2026-2027.meta.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(JSON.stringify(metadata, null, 2));
