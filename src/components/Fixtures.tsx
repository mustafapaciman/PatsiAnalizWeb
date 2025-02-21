import React from 'react';
import { Match } from '../utils/types/match';
import { parseDateString } from '../utils/dateUtils';

interface FixturesProps {
  fixtures: Match[];
  onSelectMatch: (match: Match) => void;
}

const formatOdds = (odds: string | number | undefined): string => {
  if (typeof odds === 'number') {
    return odds.toFixed(2);
  }
  return '-';
};

// Tarihi tersine çeviren fonksiyon
const formatDate = (date: Date): string => {
  // Mevcut ayı ve günü al
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // Ay ve günü yer değiştirerek göster (gün.ay.yıl şeklinde)
  return `${day}.${month} ${hours}:${minutes}`;
};

// Tarihi görsel olarak düzelten filtre fonksiyonu
const visualDateFilter = (dateStr: string): string => {
  const [day, month] = dateStr.split('.');
  return `${month}.${day}`;
};

export function Fixtures({ fixtures, onSelectMatch }: FixturesProps) {
  const sortedFixtures = [...fixtures].sort((a, b) => {
    const dateA = parseDateString(a.Date || '', a.Time || '');
    const dateB = parseDateString(b.Date || '', b.Time || '');
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Güncel Fikstür</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedFixtures.map((match, index) => (
          <div
            key={index}
            onClick={() => onSelectMatch(match)}
            className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 font-medium">
                {visualDateFilter(formatDate(parseDateString(match.Date || '', match.Time || '')).split(' ')[0])} {formatDate(parseDateString(match.Date || '', match.Time || '')).split(' ')[1]}
              </span>
              <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {match.Div}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="font-semibold text-gray-800">{match.HomeTeam}</div>
                <div className="text-sm font-medium text-gray-600">vs</div>
                <div className="font-semibold text-gray-800">{match.AwayTeam}</div>
              </div>
              <div className="border-l border-gray-200 pl-4 ml-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="text-sm">
                      <div className="font-medium text-gray-600">1</div>
                      <div className="text-gray-800">{formatOdds(match.B365H)}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-600">X</div>
                      <div className="text-gray-800">{formatOdds(match.B365D)}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-600">2</div>
                      <div className="text-gray-800">{formatOdds(match.B365A)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center border-t border-gray-200 pt-2">
                    <div className="text-sm">
                      <div className="font-medium text-gray-600">Üst 2.5</div>
                      <div className="text-gray-800">{formatOdds(match['B365>2.5'])}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-600">Alt 2.5</div>
                      <div className="text-gray-800">{formatOdds(match['B365<2.5'])}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}