import React from 'react';
import { Match } from '../../utils/types/match';
import { TeamLogo } from '../TeamLogo';
import { formatDate } from '../../utils/dateUtils.ts';

interface ScoreMatchCardProps {
  match: Match;
  className?: string;
  isSurprise?: boolean;
  onClick?: () => void;
}

export function ScoreMatchCard({ match, className = '', isSurprise = false, onClick }: ScoreMatchCardProps) {
  const jsDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
  const formattedDate = formatDate(Number(match.Date));

  return (
    <div 
      onClick={onClick}
      className={`rounded-lg shadow-md p-4 transition-colors
        ${isSurprise 
          ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700' 
          : 'bg-white dark:bg-gray-800'} 
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
        ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* Takımlar ve Skor */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <TeamLogo name={match.HomeTeam} className="w-8 h-8" />
            <span className={`font-medium ${
              isSurprise ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {match.HomeTeam}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-lg font-bold ${
              isSurprise ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {match.FTHG} - {match.FTAG}
            </span>
            <span className={`text-sm ${
              isSurprise ? 'text-orange-600 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400'
            }`}>
              (İY: {match.HTHG} - {match.HTAG})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TeamLogo name={match.AwayTeam} className="w-8 h-8" />
            <span className={`font-medium ${
              isSurprise ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {match.AwayTeam}
            </span>
          </div>
        </div>

        {/* Maç Detayları */}
        <div className="flex flex-col items-end text-sm">
          <span className={isSurprise ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}>
            {jsDate.toLocaleDateString('tr-TR', { weekday: 'long' })}
          </span>
          <span className={isSurprise ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}>
            {formattedDate}
          </span>
          {isSurprise && (
            <span className="text-orange-600 dark:text-orange-400 font-medium mt-1">
              Sürpriz Maç
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 