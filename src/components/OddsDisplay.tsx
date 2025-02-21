import React from 'react';
import { Match } from '../utils/types/match';

interface OddsDisplayProps {
  match: Match;
  selectedMatch: Match;
  isSelectedMatch?: boolean;
}

const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";

const BOOKMAKER_LOGOS = {
  'B365': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Bet365_Logo.svg/2560px-Bet365_Logo.svg.png',
  'WH': 'https://logos-world.net/wp-content/uploads/2021/05/William-Hill-Logo-700x394.png',
  'BW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Bwin.svg/1200px-Bwin.svg.png',
  'IW': 'https://static.betmarket.gr/uploads/interwetten-logo-new.png',
  'PS': 'https://www.betrallyindia.com/wp-content/uploads/2019/12/pinnacle-transparent-logo.png',
  'VC': 'https://mybettingsites-com.imgix.net/assets/local/Betting-Companies/logos/vbet-logo-new-pink.png'
};

export function OddsDisplay({ match, selectedMatch, isSelectedMatch = false }: OddsDisplayProps) {
  const getOddsClass = (currentOdds: number | undefined, referenceOdds: number | undefined) => {
    if (!currentOdds || !referenceOdds || isSelectedMatch) return '';
    
    const similarity = Math.min(currentOdds, referenceOdds) / Math.max(currentOdds, referenceOdds) * 100;
    
    if (similarity >= 99) return 'bg-green-100';  // Neredeyse aynı oranlar (99%+ benzerlik)
    if (similarity >= 97) return 'bg-yellow-100'; // Çok yakın oranlar (97-99% benzerlik)
    if (similarity >= 94) return 'bg-blue-100';   // Yakın oranlar (94-97% benzerlik)
    
    return '';
  };

  const formatOdds = (odds: string | number | undefined): string => {
    if (typeof odds === 'undefined') return '-';
    if (typeof odds === 'number') return odds.toFixed(2);
    return odds;
  };

  return (
    <div className="space-y-4">
      {/* Opening Odds */}
      {match.B365H && match.B365D && match.B365A && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6">
              <img 
                src={BOOKMAKER_LOGOS.B365}
                alt="Bet365"
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EMPTY_LOGO;
                }}
              />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Açılış Oranları</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className={`text-center ${getOddsClass(match.B365H, selectedMatch.B365H)}`}>
                  <div className="font-medium">1</div>
                  <div>{formatOdds(match.B365H)}</div>
                </div>
                <div className={`text-center ${getOddsClass(match.B365D, selectedMatch.B365D)}`}>
                  <div className="font-medium">X</div>
                  <div>{formatOdds(match.B365D)}</div>
                </div>
                <div className={`text-center ${getOddsClass(match.B365A, selectedMatch.B365A)}`}>
                  <div className="font-medium">2</div>
                  <div>{formatOdds(match.B365A)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`text-center ${getOddsClass(match['B365>2.5'], selectedMatch['B365>2.5'])}`}>
                  <div className="font-medium">Üst</div>
                  <div>{formatOdds(match['B365>2.5'])}</div>
                </div>
                <div className={`text-center ${getOddsClass(match['B365<2.5'], selectedMatch['B365<2.5'])}`}>
                  <div className="font-medium">Alt</div>
                  <div>{formatOdds(match['B365<2.5'])}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`text-center ${getOddsClass(match.B365AHH, selectedMatch.B365AHH)}`}>
                  <div className="font-medium">Ev</div>
                  <div>{formatOdds(match.B365AHH)}</div>
                </div>
                <div className={`text-center ${getOddsClass(match.B365AHA, selectedMatch.B365AHA)}`}>
                  <div className="font-medium">Dep</div>
                  <div>{formatOdds(match.B365AHA)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Closing Odds */}
      {match.B365CH && match.B365CD && match.B365CA && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6">
              <img 
                src={BOOKMAKER_LOGOS.B365}
                alt="Bet365"
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EMPTY_LOGO;
                }}
              />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Kapanış Oranları</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className={`text-center ${getOddsClass(match.B365CH, selectedMatch.B365CH)}`}>
                  <div className="font-medium">1</div>
                  <div>{formatOdds(match.B365CH)}</div>
                </div>
                <div className={`text-center ${getOddsClass(match.B365CD, selectedMatch.B365CD)}`}>
                  <div className="font-medium">X</div>
                  <div>{formatOdds(match.B365CD)}</div>
                </div>
                <div className={`text-center ${getOddsClass(match.B365CA, selectedMatch.B365CA)}`}>
                  <div className="font-medium">2</div>
                  <div>{formatOdds(match.B365CA)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`text-center ${getOddsClass(match['B365C>2.5'], selectedMatch['B365C>2.5'])}`}>
                  <div className="font-medium">Üst</div>
                  <div>{formatOdds(match['B365C>2.5'])}</div>
                </div>
                <div className={`text-center ${getOddsClass(match['B365C<2.5'], selectedMatch['B365C<2.5'])}`}>
                  <div className="font-medium">Alt</div>
                  <div>{formatOdds(match['B365C<2.5'])}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`text-center ${getOddsClass(match.B365CAHH, selectedMatch.B365CAHH)}`}>
                  <div className="font-medium">Ev</div>
                  <div>{formatOdds(match.B365CAHH)}</div>
                </div>
                <div className={`text-center ${getOddsClass(match.B365CAHA, selectedMatch.B365CAHA)}`}>
                  <div className="font-medium">Dep</div>
                  <div>{formatOdds(match.B365CAHA)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}