import React, { useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Scale } from 'lucide-react';
import { Match } from '../../utils/types/match';
import { TeamLogo } from '../TeamLogo';
import { formatDate } from '../../utils/dateUtils.ts';

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  seasonMatches: Match[];
  position?: 'left' | 'right';
  onCompare?: () => void;
  isComparing?: boolean;
  searchResults?: Match[] | null;
}

export function MatchDetailModal({ 
  isOpen, 
  onClose, 
  match, 
  seasonMatches,
  position = 'left',
  onCompare,
  isComparing = false,
  searchResults = null
}: MatchDetailModalProps) {
  const [showComparisonList, setShowComparisonList] = useState(false);

  const jsDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
  const formattedDate = formatDate(Number(match.Date));

  // Takımların diğer maçlarını bul
  const homeTeamMatches = useMemo(() => {
    return seasonMatches
      .filter(m => 
        (m.HomeTeam === match.HomeTeam || m.AwayTeam === match.HomeTeam) &&
        Number(m.Date) > Number(match.Date)
      )
      .sort((a, b) => Number(a.Date) - Number(b.Date));
  }, [seasonMatches, match]);

  const awayTeamMatches = useMemo(() => {
    return seasonMatches
      .filter(m => 
        (m.HomeTeam === match.AwayTeam || m.AwayTeam === match.AwayTeam) &&
        Number(m.Date) > Number(match.Date)
      )
      .sort((a, b) => Number(a.Date) - Number(b.Date));
  }, [seasonMatches, match]);

  // Maç sonucu rengini belirle
  const getMatchResultColor = (m: Match, teamName: string) => {
    const isHome = m.HomeTeam === teamName;
    const homeWin = m.FTHG > m.FTAG;
    const awayWin = m.FTAG > m.FTHG;
    const isDraw = m.FTHG === m.FTAG;

    const htr = m.HTHG > m.HTAG ? 'H' : m.HTHG < m.HTAG ? 'A' : 'D';
    const ftr = m.FTHG > m.FTAG ? 'H' : m.FTHG < m.FTAG ? 'A' : 'D';
    const isSurprise = (htr === 'A' && ftr === 'H') || (htr === 'H' && ftr === 'A');

    if (isSurprise) {
      return 'border-purple-500 dark:border-purple-400';
    }

    if (isDraw) {
      return 'border-gray-300 dark:border-gray-500';
    }

    if ((isHome && homeWin) || (!isHome && awayWin)) {
      return 'border-emerald-500 dark:border-emerald-400';
    }

    return 'border-red-500 dark:border-red-400';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className={`fixed inset-0 flex items-center ${position === 'right' ? 'justify-end' : 'justify-center'} p-4`}>
        <Dialog.Panel className={`w-full ${isComparing ? 'max-w-3xl' : 'max-w-6xl'} rounded-lg bg-white dark:bg-gray-800 transition-all`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <Dialog.Title className="text-lg font-medium">
              Maç Detayları
            </Dialog.Title>
            <div className="flex items-center gap-2">
              {!isComparing && (
                <button
                  onClick={onCompare}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                    text-gray-600 dark:text-gray-300 flex items-center gap-2"
                >
                  <Scale className="w-5 h-5" />
                  <span>Karşılaştır</span>
                </button>
              )}
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Karşılaştırma Listesi */}
          {showComparisonList && searchResults && (
            <div className="absolute right-0 top-16 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Karşılaştırılacak Maç Seçin</h3>
                <button onClick={() => setShowComparisonList(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.map((m, index) => (
                  <button
                    key={`comparison-${index}`}
                    onClick={() => {
                      onCompare?.();
                      setShowComparisonList(false);
                    }}
                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg
                      transition-colors flex items-center justify-between"
                    disabled={m === match}
                  >
                    <div className="flex items-center gap-2">
                      <TeamLogo name={m.HomeTeam} className="w-6 h-6" />
                      <span>{m.HomeTeam}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {m.FTHG} - {m.FTAG}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{m.AwayTeam}</span>
                        <TeamLogo name={m.AwayTeam} className="w-6 h-6" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Maç Başlığı */}
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              {/* Ev Sahibi */}
              <div className="flex items-center gap-4">
                <TeamLogo name={match.HomeTeam} className="w-16 h-16" />
                <span className="text-xl font-medium">{match.HomeTeam}</span>
              </div>

              {/* Skor */}
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">
                  {match.FTHG} - {match.FTAG}
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  (İY: {match.HTHG} - {match.HTAG})
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  {formattedDate}
                </span>
              </div>

              {/* Deplasman */}
              <div className="flex items-center gap-4">
                <span className="text-xl font-medium">{match.AwayTeam}</span>
                <TeamLogo name={match.AwayTeam} className="w-16 h-16" />
              </div>
            </div>
          </div>

          {/* Takımların Diğer Maçları */}
          <div className="grid grid-cols-2 gap-8 p-6">
            {/* Ev Sahibi Maçları */}
            <div>
              <h3 className="text-lg font-medium mb-4">{match.HomeTeam} Sonraki Maçları</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {homeTeamMatches.map((m, index) => (
                  <div 
                    key={`home-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg 
                      border-2 bg-white dark:bg-gray-800 ${getMatchResultColor(m, match.HomeTeam)}`}
                  >
                    <div className="flex items-center gap-2">
                      <TeamLogo name={m.HomeTeam} className="w-6 h-6" />
                      <span className="font-medium">{m.HomeTeam}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{m.FTHG} - {m.FTAG}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (İY: {m.HTHG} - {m.HTAG})
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(Number(m.Date))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.AwayTeam}</span>
                      <TeamLogo name={m.AwayTeam} className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deplasman Maçları */}
            <div>
              <h3 className="text-lg font-medium mb-4">{match.AwayTeam} Sonraki Maçları</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {awayTeamMatches.map((m, index) => (
                  <div 
                    key={`away-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg 
                      border-2 bg-white dark:bg-gray-800 ${getMatchResultColor(m, match.AwayTeam)}`}
                  >
                    <div className="flex items-center gap-2">
                      <TeamLogo name={m.HomeTeam} className="w-6 h-6" />
                      <span className="font-medium">{m.HomeTeam}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold">{m.FTHG} - {m.FTAG}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (İY: {m.HTHG} - {m.HTAG})
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(Number(m.Date))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.AwayTeam}</span>
                      <TeamLogo name={m.AwayTeam} className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 