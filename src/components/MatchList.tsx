import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';

interface MatchListProps {
  matches: Match[];
  teams: TeamMapping;
}

export function MatchList({ matches, teams }: MatchListProps) {
  return (
    <div className="match-list">
      <h2>Maçlar ({matches.length})</h2>
      <div className="matches">
        {matches.map((match, index) => (
          <div key={index} className="match-item">
            <div className="team home">
              <img 
                src={teams[match.HomeTeam]?.logoUrl} 
                alt={match.HomeTeam} 
                className="team-logo"
              />
              <span>{match.HomeTeam}</span>
            </div>
            <div className="score">
              {match.FTHG !== undefined && match.FTAG !== undefined ? (
                <span>{match.FTHG} - {match.FTAG}</span>
              ) : (
                <span>vs</span>
              )}
            </div>
            <div className="team away">
              <img 
                src={teams[match.AwayTeam]?.logoUrl} 
                alt={match.AwayTeam} 
                className="team-logo"
              />
              <span>{match.AwayTeam}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 