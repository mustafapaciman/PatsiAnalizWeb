import React from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { OddsDisplay } from './OddsDisplay';
import { parseDateString } from '../utils/dateUtils';
import { TeamLogo } from './TeamLogo';

interface OddsModalProps {
  match: Match;
  selectedMatch: Match;
  teamData: TeamMapping;
  onClose: () => void;
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

export function OddsModal({ match, selectedMatch, teamData, onClose }: OddsModalProps) {
  const [currentMatch, setCurrentMatch] = React.useState(match);
  const [isViewingSelectedMatch, setIsViewingSelectedMatch] = React.useState(false);

  const handleNext = () => {
    setCurrentMatch(selectedMatch);
    setIsViewingSelectedMatch(true);
  };

  const handlePrevious = () => {
    setCurrentMatch(match);
    setIsViewingSelectedMatch(false);
  };

  const bookmakers = [
    { code: 'B365', name: 'Bet365' },
    { code: 'BW', name: 'Bet&Win' },
    { code: 'IW', name: 'Interwetten' },
    { code: 'PS', name: 'Pinnacle' },
    { code: 'WH', name: 'William Hill' },
    { code: 'VC', name: 'VC Bet' },
    { code: 'Avg', name: 'Market Average' },
    { code: 'Max', name: 'Market Maximum' }
  ];

  const formatOdds = (value: string | number | undefined) => {
    if (typeof value === 'undefined') return 'X';
    if (typeof value === 'number') return value.toFixed(2);
    return value;
  };

  const compareOdds = (odds1: number | undefined, odds2: number | undefined) => {
    if (!odds1 || !odds2) return null;
    const diff = Math.abs(odds1 - odds2);
    const percentage = Math.min(odds1, odds2) / Math.max(odds1, odds2) * 100;
    
    if (percentage >= 97) return 'bg-yellow-100';
    if (percentage >= 94) return 'bg-blue-100';
    if (diff <= 0.03) return 'bg-green-100';
    return '';
  };

  const getOddsClass = (currentOdds: number | undefined, referenceOdds: number | undefined, isSelectedMatch: boolean = false) => {
    if (!currentOdds || !referenceOdds || isSelectedMatch) return '';
    
    const similarity = Math.min(currentOdds, referenceOdds) / Math.max(currentOdds, referenceOdds) * 100;
    
    if (similarity >= 99) return 'bg-green-100';  // Neredeyse aynı oranlar (99%+ benzerlik)
    if (similarity >= 97) return 'bg-yellow-100'; // Çok yakın oranlar (97-99% benzerlik)
    if (similarity >= 94) return 'bg-blue-100';   // Yakın oranlar (94-97% benzerlik)
    
    return '';
  };

  const hasAnyOdds = (bm: string) => {
    const fields = [
      `${bm}H`, `${bm}D`, `${bm}A`,
      `${bm}CH`, `${bm}CD`, `${bm}CA`,
      `${bm}>2.5`, `${bm}<2.5`,
      `${bm}C>2.5`, `${bm}C<2.5`,
      `${bm}AHH`, `${bm}AHA`,
      `${bm}CAHH`, `${bm}CAHA`
    ];
    return fields.some(field => (match as any)[field]);
  };

  const activeBookmakers = bookmakers.filter(bm => hasAnyOdds(bm.code));

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

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Görsel olarak ay ve günü yer değiştiriyoruz
    return `${month}.${day}.${year} ${hours}:${minutes}`;
  };

  const BookmakerLogo = ({ code, name }: { code: string; name: string }) => {
    if (code === 'Avg' || code === 'Max') {
      return <span className="font-medium text-gray-700">{name}</span>;
    }
    
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 flex items-center justify-center bg-white rounded-lg p-1">
          <img 
            src={BOOKMAKER_LOGOS[code as keyof typeof BOOKMAKER_LOGOS] || EMPTY_LOGO}
            alt={name}
            className="h-6 w-full object-contain"
            title={name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = EMPTY_LOGO;
            }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">{name}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
        {selectedMatch && match !== selectedMatch && (
          <>
            {isViewingSelectedMatch ? (
              <button
                onClick={handlePrevious}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-32 p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-lg transition-all duration-200 group flex flex-col items-center"
                title="Benzer Maça Dön"
              >
                <ChevronLeft size={32} className="text-gray-600 group-hover:text-blue-600" />
                <span className="text-xs text-gray-600 group-hover:text-blue-600 mt-1 whitespace-nowrap font-medium">Benzer Maça Dön</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-32 p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-lg transition-all duration-200 group flex flex-col items-center"
                title="Seçilen Maça Git"
              >
                <ChevronRight size={32} className="text-gray-600 group-hover:text-blue-600" />
                <span className="text-xs text-gray-600 group-hover:text-blue-600 mt-1 whitespace-nowrap font-medium">Seçilen Maça Git</span>
              </button>
            )}
          </>
        )}

        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Detaylı Oranlar</h2>
                  {selectedMatch && match !== selectedMatch && (
                    <div className="flex items-center gap-2">
                      {isViewingSelectedMatch ? (
                        <span className="text-sm text-gray-500">
                          Seçilen Maç
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Benzer Maç
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-gray-400" />
                    <span>{getLeagueName(currentMatch.Div)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{formatDate(parseDateString(currentMatch.Date, currentMatch.Time))}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <TeamLogo name={currentMatch.HomeTeam} className="w-12 h-12" teamData={teamData} showName={true} />
                <div className="text-gray-400 font-bold text-lg">VS</div>
                <TeamLogo name={currentMatch.AwayTeam} className="w-12 h-12" teamData={teamData} showName={true} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Bet365 Detaylı Oranlar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-800">Bet365 Oranları</h3>
            </div>
            <OddsDisplay match={currentMatch} selectedMatch={selectedMatch} isSelectedMatch={currentMatch === selectedMatch} />
          </div>

          {/* Tüm Bookmaker'lar */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Tüm Bookmaker Oranları</h3>
            
            {/* 1X2 Oranları */}
            <div className="space-y-4">
              <h4 className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium">1X2 Oranları</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Bookmaker
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">1 (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">X (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">2 (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">1 (Kapanış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">X (Kapanış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">2 (Kapanış)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeBookmakers.map(({ code: bm, name }) => {
                      return (
                        <tr key={bm} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <BookmakerLogo code={bm} name={name} />
                          </td>
                          <td className={`px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}H`] as number, selectedMatch[`${bm}H`] as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(currentMatch[`${bm}H`] as number)}
                          </td>
                          <td className={`px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}D`] as number, selectedMatch[`${bm}D`] as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(currentMatch[`${bm}D`] as number)}
                          </td>
                          <td className={`px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}A`] as number, selectedMatch[`${bm}A`] as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(currentMatch[`${bm}A`] as number)}
                          </td>
                          <td className={`px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}CH`] as number, selectedMatch[`${bm}CH`] as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(currentMatch[`${bm}CH`] as number)}
                          </td>
                          <td className={`px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}CD`] as number, selectedMatch[`${bm}CD`] as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(currentMatch[`${bm}CD`] as number)}
                          </td>
                          <td className={`px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}CA`] as number, selectedMatch[`${bm}CA`] as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(currentMatch[`${bm}CA`] as number)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alt/Üst Oranları */}
            <div className="space-y-4">
              <h4 className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium">Over/Under 2.5 Gol Oranları</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Bookmaker</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Üst (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Alt (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Üst (Kapanış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Alt (Kapanış)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeBookmakers.map(({ code: bm, name }) => {
                      const openingOver = currentMatch[`${bm}>2.5` as keyof Match];
                      const openingUnder = currentMatch[`${bm}<2.5` as keyof Match];
                      const closingOver = currentMatch[`${bm}C>2.5` as keyof Match];
                      const closingUnder = currentMatch[`${bm}C<2.5` as keyof Match];

                      const selectedOpeningOver = selectedMatch[`${bm}>2.5` as keyof Match];
                      const selectedOpeningUnder = selectedMatch[`${bm}<2.5` as keyof Match];
                      const selectedClosingOver = selectedMatch[`${bm}C>2.5` as keyof Match];
                      const selectedClosingUnder = selectedMatch[`${bm}C<2.5` as keyof Match];

                      return (
                        <tr key={bm} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <BookmakerLogo code={bm} name={name} />
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(openingOver as number, selectedOpeningOver as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(openingOver)}
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(openingUnder as number, selectedOpeningUnder as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(openingUnder)}
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(closingOver as number, selectedClosingOver as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(closingOver)}
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(closingUnder as number, selectedClosingUnder as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(closingUnder)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Asya Handikapı */}
            <div className="space-y-4">
              <h4 className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium">Asian Handicap</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Bookmaker</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Handikap</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Ev (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Dep (Açılış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Ev (Kapanış)</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Dep (Kapanış)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeBookmakers.map(({ code: bm, name }) => {
                      const handicap = currentMatch[`${bm}AH` as keyof Match];
                      const openingHome = currentMatch[`${bm}AHH` as keyof Match];
                      const openingAway = currentMatch[`${bm}AHA` as keyof Match];
                      const closingHome = currentMatch[`${bm}CAHH` as keyof Match];
                      const closingAway = currentMatch[`${bm}CAHA` as keyof Match];

                      const selectedHandicap = selectedMatch[`${bm}AH` as keyof Match];
                      const selectedOpeningHome = selectedMatch[`${bm}AHH` as keyof Match];
                      const selectedOpeningAway = selectedMatch[`${bm}AHA` as keyof Match];
                      const selectedClosingHome = selectedMatch[`${bm}CAHH` as keyof Match];
                      const selectedClosingAway = selectedMatch[`${bm}CAHA` as keyof Match];

                      return (
                        <tr key={bm} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <BookmakerLogo code={bm} name={name} />
                          </td>
                          <td className="px-4 py-2 text-center">{handicap || '-'}</td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(openingHome as number, selectedOpeningHome as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(openingHome)}
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(openingAway as number, selectedOpeningAway as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(openingAway)}
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(closingHome as number, selectedClosingHome as number, currentMatch === selectedMatch)}`}>
                            {formatOdds(closingHome)}
                          </td>
                          <td className={`px-4 py-2 text-center ${getOddsClass(closingAway as number, selectedClosingAway as number, match === selectedMatch)}`}>
                            {formatOdds(closingAway)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bookmaker Açıklamaları */}
          <div className="p-6 bg-gray-50 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Bookmaker Açıklamaları</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {bookmakers.map(({ code, name }) => (
                <div key={code}>
                  <BookmakerLogo code={code} name={name} />
                </div>
              ))}
            </div>
          </div>

          {/* Renk Açıklamaları */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Renk Açıklamaları</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span>Neredeyse Aynı Oranlar (%99+ benzerlik)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                <span>Çok Yakın Oranlar (%97-99 benzerlik)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>Yakın Oranlar (%94-97 benzerlik)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}