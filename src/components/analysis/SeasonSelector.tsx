import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { Match } from '../../utils/types/match';

interface SeasonSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  seasons: string[];
  currentSeason: string;
  onSelect: (season: string) => void;
  searchResults: Match[] | null;
  selectedTeam: string;
  selectedScore: [number, number] | null;
  activeFilter: 'ourTeam' | 'leagueTeams' | 'otherLeagues';
  matchData: Match[];
  selectedLeague: string;
}

// getSeasonFromDate fonksiyonu
const getSeasonFromDate = (excelDate: number) => {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  const year = date.getFullYear();
  const month = date.getMonth();
  const seasonStartYear = month >= 7 ? year : year - 1;
  return `${seasonStartYear}-${seasonStartYear + 1}`;
};

export function SeasonSelector({ 
  isOpen, 
  onClose, 
  seasons, 
  currentSeason,
  onSelect,
  searchResults,
  selectedTeam,
  selectedScore,
  activeFilter,
  matchData,
  selectedLeague
}: SeasonSelectorProps) {
  // Her sezon için skor kontrolü yap
  const getSeasonHasMatches = (season: string): boolean => {
    if (!selectedTeam || !selectedScore) return false;
    
    const [homeScore, awayScore] = selectedScore;
    const seasonMatches = matchData.filter(match => 
      getSeasonFromDate(Number(match.Date)) === season
    );

    const scoreMatches = seasonMatches.filter(match => 
      (match.FTHG === homeScore && match.FTAG === awayScore) ||
      (match.FTHG === awayScore && match.FTAG === homeScore)
    );

    let filteredResults: Match[] = [];
    switch (activeFilter) {
      case 'ourTeam':
        filteredResults = scoreMatches.filter(match => 
          match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam
        );
        break;
      case 'leagueTeams':
        filteredResults = scoreMatches.filter(match => 
          match.Div === selectedLeague && 
          match.HomeTeam !== selectedTeam && 
          match.AwayTeam !== selectedTeam
        );
        break;
      case 'otherLeagues':
        filteredResults = scoreMatches.filter(match => 
          match.Div !== selectedLeague
        );
        break;
    }

    return filteredResults.length > 0;
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">
                Sezon Seçin
              </Dialog.Title>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {seasons.map(season => {
                const hasMatches = getSeasonHasMatches(season);
                return (
                  <button
                    key={season}
                    onClick={() => {
                      onSelect(season);
                      onClose();
                    }}
                    disabled={!hasMatches}
                    className={`p-3 rounded-lg text-center transition-colors
                      ${season === currentSeason ? 'ring-2 ring-emerald-500' : ''}
                      ${hasMatches 
                        ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/30' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
} 