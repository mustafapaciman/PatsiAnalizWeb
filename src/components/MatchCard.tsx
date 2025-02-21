import React, { useState } from 'react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { TeamLogo } from './TeamLogo';
import { Info } from 'lucide-react';
import { convertExcelDate } from '../utils/dateUtils';
import { OddsModal } from './OddsModal';

interface MatchCardProps {
  match: Match;
  selectedMatch: Match;
  teamData: TeamMapping;
  similarity?: number;
  isExactBet365Match?: boolean;
  isExactBet365MatchClosedOdds?: boolean;
}

export function MatchCard({ 
  match, 
  selectedMatch, 
  teamData,
  similarity,
  isExactBet365Match,
  isExactBet365MatchClosedOdds
}: MatchCardProps) {
  const [showOddsModal, setShowOddsModal] = useState(false);

  const getBorderColorClass = () => {
    if (isExactBet365Match) return 'border-green-500';
    return 'border-black/40';
  };

  const getMatchScenario = () => {
    const htr = match.HTR; // İlk yarı sonucu (H, A, D)
    const ftr = match.FTR; // Maç sonu sonucu (H, A, D)
    
    if (htr === 'H' && ftr === 'H') return { text: '1/1', color: 'bg-emerald-100 text-emerald-800' };
    if (htr === 'A' && ftr === 'A') return { text: '2/2', color: 'bg-red-100 text-red-800' };
    if (htr === 'H' && ftr === 'A') return { text: '1/2', color: 'bg-purple-100 text-purple-800' };
    if (htr === 'A' && ftr === 'H') return { text: '2/1', color: 'bg-blue-100 text-blue-800' };
    if (htr === 'H' && ftr === 'D') return { text: '1/X', color: 'bg-green-100 text-green-800' };
    if (htr === 'A' && ftr === 'D') return { text: '2/X', color: 'bg-yellow-100 text-yellow-800' };
    if (htr === 'D' && ftr === 'H') return { text: 'X/1', color: 'bg-pink-100 text-pink-800' };
    if (htr === 'D' && ftr === 'A') return { text: 'X/2', color: 'bg-orange-100 text-orange-800' };
    if (htr === 'D' && ftr === 'D') return { text: 'X/X', color: 'bg-gray-100 text-gray-800' };
    return { text: '-', color: 'bg-gray-50 text-gray-500' };
  };

  const scenario = getMatchScenario();

  return (
    <>
      <div 
        className={`bg-gradient-to-br from-gray-100 via-white to-blue-50 rounded-lg ${isExactBet365Match ? 'border-4' : 'border-2'} ${getBorderColorClass()} p-4 hover:shadow-md transition-shadow relative cursor-pointer`}
        onClick={() => setShowOddsModal(true)}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-500">
            {convertExcelDate(match.Date)}
          </div>
          <div className="flex items-center gap-2">
            {isExactBet365MatchClosedOdds && (
              <div className="text-yellow-500" title="Bet365 kapanış oranları birebir eşleşiyor">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className={`px-2 py-1 rounded text-sm font-bold ${scenario.color}`}>
              {scenario.text}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <TeamLogo name={match.HomeTeam} className="w-8 h-8" />
            <span className="text-lg font-medium truncate">{match.HomeTeam}</span>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{match.FTHG}</span>
              <span className="text-lg font-bold">-</span>
              <span className="text-lg font-bold">{match.FTAG}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">({match.HTHG}</span>
              <span className="text-sm text-gray-500">-</span>
              <span className="text-sm text-gray-500">{match.HTAG})</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-lg font-medium truncate">{match.AwayTeam}</span>
            <TeamLogo name={match.AwayTeam} className="w-8 h-8" />
          </div>
        </div>
      </div>

      {showOddsModal && (
        <OddsModal
          match={match}
          selectedMatch={selectedMatch}
          teamData={teamData}
          onClose={() => setShowOddsModal(false)}
        />
      )}
    </>
  );
}