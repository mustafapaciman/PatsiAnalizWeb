import React, { useState } from 'react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { MatchCard } from './MatchCard';
import { findSimilarMatches, updateTolerance } from '../utils/oddsComparison';

interface SimilarMatchesProps {
  matches: Match[];
  selectedMatch: Match;
  teamData: TeamMapping;
  onSimilarMatchesChange?: (matches: Match[]) => void;
}

interface SimilarMatchesModalProps {
  matches: Match[];
  selectedMatch: Match;
  teamData: TeamMapping;
  onClose: () => void;
}

function SimilarMatchesModal({ matches, selectedMatch, teamData, onClose }: SimilarMatchesModalProps) {
  const [filter, setFilter] = useState<'all' | 'sameTeam' | 'sameLeague' | 'htftSwitch' | 'htftDraw'>('all');

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    
    if (filter === 'sameTeam') {
      return match.HomeTeam === selectedMatch.HomeTeam || 
             match.HomeTeam === selectedMatch.AwayTeam ||
             match.AwayTeam === selectedMatch.HomeTeam ||
             match.AwayTeam === selectedMatch.AwayTeam;
    }
    
    if (filter === 'sameLeague') {
      return match.Div === selectedMatch.Div;
    }

    if (filter === 'htftSwitch') {
      return (match.HTR === 'A' && match.FTR === 'H') || 
             (match.HTR === 'H' && match.FTR === 'A');
    }

    if (filter === 'htftDraw') {
      return (match.HTR === 'A' && match.FTR === 'D') || 
             (match.HTR === 'H' && match.FTR === 'D');
    }
    
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">
              En Benzer {filteredMatches.length} Maç
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded text-sm ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilter('sameTeam')}
                className={`px-3 py-1.5 rounded text-sm ${
                  filter === 'sameTeam'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aynı Takım
              </button>
              <button
                onClick={() => setFilter('sameLeague')}
                className={`px-3 py-1.5 rounded text-sm ${
                  filter === 'sameLeague'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aynı Lig
              </button>
              <button
                onClick={() => setFilter('htftSwitch')}
                className={`px-3 py-1.5 rounded text-sm ${
                  filter === 'htftSwitch'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                1/2 2/1
              </button>
              <button
                onClick={() => setFilter('htftDraw')}
                className={`px-3 py-1.5 rounded text-sm ${
                  filter === 'htftDraw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                1/X 2/X
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((match, index) => (
              <MatchCard
                key={index}
                match={match}
                selectedMatch={selectedMatch}
                teamData={teamData}
                similarity={match.similarity}
                isExactBet365Match={match.isExactBet365Match}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SimilarMatches({ matches, selectedMatch, teamData, onSimilarMatchesChange }: SimilarMatchesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tolerance, setTolerance] = useState(0.10);
  const [showToleranceMenu, setShowToleranceMenu] = useState(false);
  const [similarMatches, setSimilarMatches] = useState<Match[]>([]);

  // İlk yüklemede ve selectedMatch değiştiğinde benzer maçları hesapla
  React.useEffect(() => {
    if (!selectedMatch || !matches || matches.length === 0) {
      console.log('No data available yet');
      return;
    }

    // Oran kontrolü
    const hasOdds = selectedMatch.B365H && selectedMatch.B365D && selectedMatch.B365A;
    if (!hasOdds) {
      console.log('Selected match odds not loaded:', {
        B365H: selectedMatch.B365H,
        B365D: selectedMatch.B365D,
        B365A: selectedMatch.B365A
      });
      return;
    }

    console.log('Starting match comparison with:', {
      selectedMatch: `${selectedMatch.HomeTeam} vs ${selectedMatch.AwayTeam}`,
      totalMatches: matches.length,
      currentTolerance: tolerance
    });

    updateTolerance(tolerance);
    const newMatches = findSimilarMatches(selectedMatch, matches);
    setSimilarMatches(newMatches);
    onSimilarMatchesChange?.(newMatches);
  }, [selectedMatch, matches]);

  const handleToleranceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTolerance = parseFloat(event.target.value);
    setTolerance(newTolerance);
    
    if (!selectedMatch || !matches || matches.length === 0) return;

    updateTolerance(newTolerance);
    const newMatches = findSimilarMatches(selectedMatch, matches);
    setSimilarMatches(newMatches);
    onSimilarMatchesChange?.(newMatches);
    setShowToleranceMenu(false);
  };

  const displayedMatches = similarMatches.slice(0, 6);
  const totalMatches = similarMatches.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">
          Benzer Maçlar ({totalMatches})
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowToleranceMenu(!showToleranceMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Tolerans Ayarları"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            {showToleranceMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg p-2 z-50">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tolerance"
                      value="0.1"
                      checked={tolerance === 0.1}
                      onChange={handleToleranceChange}
                    />
                    <span>0.1</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tolerance"
                      value="0.15"
                      checked={tolerance === 0.15}
                      onChange={handleToleranceChange}
                    />
                    <span>0.15</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tolerance"
                      value="0.2"
                      checked={tolerance === 0.2}
                      onChange={handleToleranceChange}
                    />
                    <span>0.2</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tolerance"
                      value="0.3"
                      checked={tolerance === 0.3}
                      onChange={handleToleranceChange}
                    />
                    <span>0.3</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tolerance"
                      value="0.4"
                      checked={tolerance === 0.4}
                      onChange={handleToleranceChange}
                    />
                    <span>0.4</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="tolerance"
                      value="0.5"
                      checked={tolerance === 0.5}
                      onChange={handleToleranceChange}
                    />
                    <span>0.5</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          {totalMatches > 6 && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tümünü Göster ({totalMatches})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedMatches.map((match, index) => (
          <MatchCard
            key={index}
            match={match}
            selectedMatch={selectedMatch}
            teamData={teamData}
            similarity={match.similarity}
            isExactBet365Match={match.isExactBet365Match}
          />
        ))}
      </div>

      {isModalOpen && (
        <SimilarMatchesModal
          matches={similarMatches}
          selectedMatch={selectedMatch}
          teamData={teamData}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
} 