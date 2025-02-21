import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { analyzeMatches } from '../utils/matchAnalysis';

interface OddsSearchProps {
  matchData: any[];
  onSearch: (results: any) => void;
}

export function OddsSearch({ matchData, onSearch }: OddsSearchProps) {
  const [homeOdds, setHomeOdds] = useState('');
  const [drawOdds, setDrawOdds] = useState('');
  const [awayOdds, setAwayOdds] = useState('');

  const handleSearch = () => {
    const matches = matchData.filter(match => 
      match.B365CH === Number(homeOdds) &&
      match.B365CD === Number(drawOdds) &&
      match.B365CA === Number(awayOdds)
    );

    if (matches.length === 0) {
      console.error('No matches found with these odds');
      return;
    }

    const selectedMatch = matches[0];
    const results = analyzeMatches(matches, selectedMatch);
    onSearch(results);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Oran Arama</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Ev Sahibi Oranı
          </label>
          <input
            type="number"
            step="0.01"
            value={homeOdds}
            onChange={(e) => setHomeOdds(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Beraberlik Oranı
          </label>
          <input
            type="number"
            step="0.01"
            value={drawOdds}
            onChange={(e) => setDrawOdds(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deplasman Oranı
          </label>
          <input
            type="number"
            step="0.01"
            value={awayOdds}
            onChange={(e) => setAwayOdds(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={handleSearch}
        className="mt-4 flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        <Search size={20} className="mr-2" />
        Ara
      </button>
    </div>
  );
}