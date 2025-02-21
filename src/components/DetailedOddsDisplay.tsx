import React from 'react';
import { Match } from '../utils/types/match';

const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";

const BOOKMAKER_LOGOS = {
  'B365': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Bet365_Logo.svg/2560px-Bet365_Logo.svg.png',
  'WH': 'https://logos-world.net/wp-content/uploads/2021/05/William-Hill-Logo-700x394.png',
  'BW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Bwin.svg/1200px-Bwin.svg.png',
  'IW': 'https://static.betmarket.gr/uploads/interwetten-logo-new.png',
  'PS': 'https://www.betrallyindia.com/wp-content/uploads/2019/12/pinnacle-transparent-logo.png',
  'VC': 'https://mybettingsites-com.imgix.net/assets/local/Betting-Companies/logos/vbet-logo-new-pink.png'
};

const formatOdds = (odds: string | number | undefined): string => {
  if (typeof odds === 'number') {
    return odds.toFixed(2);
  }
  return '-';
};

interface DetailedOddsDisplayProps {
  match: Match;
}

export function DetailedOddsDisplay({ match }: DetailedOddsDisplayProps) {
  return (
    <div className="space-y-4">
      {/* 1X2 Odds */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">1X2 Oranları</h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <div className="h-6 mb-1">
              <img 
                src={BOOKMAKER_LOGOS.B365} 
                alt="Bet365" 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EMPTY_LOGO;
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div>{formatOdds(match.B365CH)}</div>
              <div>{formatOdds(match.B365CD)}</div>
              <div>{formatOdds(match.B365CA)}</div>
            </div>
          </div>
          <div>
            <div className="h-6 mb-1">
              <img 
                src={BOOKMAKER_LOGOS.BW} 
                alt="Bet&Win" 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EMPTY_LOGO;
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div>{formatOdds(match.BWH)}</div>
              <div>{formatOdds(match.BWD)}</div>
              <div>{formatOdds(match.BWA)}</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-center">Market Max</div>
            <div className="grid grid-cols-3 gap-1">
              <div>{formatOdds(match.MaxH)}</div>
              <div>{formatOdds(match.MaxD)}</div>
              <div>{formatOdds(match.MaxA)}</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-center">Market Avg</div>
            <div className="grid grid-cols-3 gap-1">
              <div>{formatOdds(match.AvgH)}</div>
              <div>{formatOdds(match.AvgD)}</div>
              <div>{formatOdds(match.AvgA)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Over/Under 2.5 Goals */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Alt/Üst 2.5</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="h-6 mb-1">
              <img 
                src={BOOKMAKER_LOGOS.B365} 
                alt="Bet365" 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EMPTY_LOGO;
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>Ü: {formatOdds(match['B365C>2.5'])}</div>
              <div>A: {formatOdds(match['B365C<2.5'])}</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-center">Market Max</div>
            <div className="grid grid-cols-2 gap-1">
              <div>Ü: {formatOdds(match['Max>2.5'])}</div>
              <div>A: {formatOdds(match['Max<2.5'])}</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-center">Market Avg</div>
            <div className="grid grid-cols-2 gap-1">
              <div>Ü: {formatOdds(match['Avg>2.5'])}</div>
              <div>A: {formatOdds(match['Avg<2.5'])}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asian Handicap */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Asya Handikapı</h3>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="h-6 mb-1">
              <img 
                src={BOOKMAKER_LOGOS.B365} 
                alt="Bet365" 
                className="h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = EMPTY_LOGO;
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div>Ev: {formatOdds(match.B365CAHH)}</div>
              <div>Dep: {formatOdds(match.B365CAHA)}</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-center">Market Max</div>
            <div className="grid grid-cols-2 gap-1">
              <div>Ev: {formatOdds(match.MaxAHH)}</div>
              <div>Dep: {formatOdds(match.MaxAHA)}</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-center">Market Avg</div>
            <div className="grid grid-cols-2 gap-1">
              <div>Ev: {formatOdds(match.AvgAHH)}</div>
              <div>Dep: {formatOdds(match.AvgAHA)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}