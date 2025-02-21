import React, { useState } from 'react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { MatchCard } from './MatchCard';
import { X } from 'lucide-react';

interface SimilarMatchesModalProps {
  matches: Match[];
  selectedMatch: Match;
  teamData: TeamMapping;
  onClose: () => void;
}

export function SimilarMatchesModal({ matches, selectedMatch, teamData, onClose }: SimilarMatchesModalProps) {
  const [filter, setFilter] = useState<'all' | 'sameTeam' | 'sameLeague'>('all');

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
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
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
                isExactOtherBookieMatch={match.isExactOtherBookieMatch}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 