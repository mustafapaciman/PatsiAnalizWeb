import React from 'react';
import { Match } from '../utils/types/match';
import { TeamLogo } from './TeamLogo';
import { parseDateString } from '../utils/dateUtils';
import { OddsModal } from './OddsModal';
import { TeamMapping } from '../utils/types/team';

interface MatchHeaderProps {
  match: Match;
  onOddsClick?: () => void;
  setShowOddsModal?: (show: boolean) => void;
  teamData: TeamMapping;
}

export function MatchHeader({ match, onOddsClick, setShowOddsModal, teamData }: MatchHeaderProps) {
  const [showModal, setShowModal] = React.useState(false);

  const handleClick = () => {
    setShowModal(true);
    if (onOddsClick) {
      onOddsClick();
    }
    if (setShowOddsModal) {
      setShowOddsModal(true);
    }
  };

  const formatDate = (date: string, time: string) => {
    const parsedDate = parseDateString(date, time);
    return parsedDate.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const reverseDateFormat = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month}.${day}.${year} ${hours}:${minutes}`;
  };

  const getLeagueName = (code: string): string => {
    const leagues: { [key: string]: string } = {
      'E0': 'Premier Lig',
      'E1': 'Championship',
      'E2': 'League One',
      'E3': 'League Two',
      'SC0': 'İskoçya Ligi',
      'SC1': 'İskoçya Championship',
      'SC2': 'İskoçya League One',
      'SC3': 'İskoçya League Two',
      'D1': 'Bundesliga',
      'D2': '2. Bundesliga',
      'SP1': 'La Liga',
      'SP2': 'La Liga 2',
      'I1': 'Serie A',
      'I2': 'Serie B',
      'F1': 'Ligue 1',
      'F2': 'Ligue 2',
      'N1': 'Eredivisie',
      'B1': 'Belçika Ligi',
      'P1': 'Portekiz Ligi',
      'T1': 'Türkiye Ligi',
      'G1': 'Yunanistan Ligi'
    };
    return leagues[code] || code;
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 
          rounded-lg p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <TeamLogo name={match.HomeTeam} className="w-16 h-16" />
              <span className="mt-2 font-medium text-white">{match.HomeTeam}</span>
            </div>
            <div className="flex flex-col items-center mx-4">
              <span className="text-2xl font-bold text-white">VS</span>
            </div>
            <div className="flex flex-col items-center">
              <TeamLogo name={match.AwayTeam} className="w-16 h-16" />
              <span className="mt-2 font-medium text-white">{match.AwayTeam}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end">
              <div className="text-sm text-blue-200">
                {getLeagueName(match.Div)}
              </div>
              <div className="text-sm text-blue-200">
                {reverseDateFormat(parseDateString(match.Date || '', match.Time || ''))}
              </div>
            </div>
          </div>
        </div>
      </button>

      {showModal && (
        <OddsModal
          match={match}
          selectedMatch={match}
          teamData={teamData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}