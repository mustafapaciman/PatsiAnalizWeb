import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Calendar } from 'lucide-react';
import { Match } from '../../utils/types/match';
import { ScoreSearchForm } from './ScoreSearchForm';
import { ScoreMatchCard } from './ScoreMatchCard';
import { SeasonSelector } from './SeasonSelector';

interface ComparisonSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (match: Match) => void;
  matchData: Match[];
  selectedLeague: string;
  initialScore: [number, number];
}

export function ComparisonSearchModal({
  isOpen,
  onClose,
  onSelect,
  matchData,
  selectedLeague,
  initialScore
}: ComparisonSearchModalProps) {
  // Kendi state'leri
  const [searchResults, setSearchResults] = useState<Match[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ourTeam' | 'leagueTeams' | 'otherLeagues'>('ourTeam');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [currentSeason, setCurrentSeason] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  });

  // Sezon seçimi için state
  const [isSeasonSelectorOpen, setIsSeasonSelectorOpen] = useState(false);

  // Sezon hesaplama
  const getSeasonFromDate = (excelDate: number) => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    const seasonStartYear = month >= 7 ? year : year - 1;
    return `${seasonStartYear}-${seasonStartYear + 1}`;
  };

  // Mevcut sezonun maçları
  const currentSeasonMatches = useMemo(() => {
    return matchData.filter(match => 
      getSeasonFromDate(Number(match.Date)) === currentSeason
    );
  }, [matchData, currentSeason]);

  // Mevcut maçlardan sezonları bul
  const availableSeasons = useMemo(() => {
    const seasons = new Set(
      matchData.map(match => getSeasonFromDate(Number(match.Date)))
    );
    return Array.from(seasons).sort().reverse();
  }, [matchData]);

  // Sürpriz maç kontrolü için yardımcı fonksiyon
  const isSurpriseMatch = (match: Match): boolean => {
    // İlk yarı sonucu
    const htr = match.HTHG > match.HTAG ? 'H' : match.HTHG < match.HTAG ? 'A' : 'D';
    // Maç sonu sonucu
    const ftr = match.FTHG > match.FTAG ? 'H' : match.FTHG < match.FTAG ? 'A' : 'D';

    // İlk yarı deplasman kazanıp maçı ev sahibi kazandıysa
    // VEYA ilk yarı ev sahibi kazanıp maçı deplasman kazandıysa
    return (htr === 'A' && ftr === 'H') || (htr === 'H' && ftr === 'A');
  };

  const handleSearch = (team: string, score: [number, number]) => {
    setSelectedTeam(team);
    
    const [homeScore, awayScore] = score;
    
    const scoreMatches = currentSeasonMatches.filter(match => 
      (match.FTHG === homeScore && match.FTAG === awayScore) ||
      (match.FTHG === awayScore && match.FTAG === homeScore)
    );

    let filteredResults: Match[] = [];
    switch (activeFilter) {
      case 'ourTeam':
        filteredResults = scoreMatches.filter(match => 
          match.HomeTeam === team || match.AwayTeam === team
        );
        break;
      case 'leagueTeams':
        filteredResults = scoreMatches.filter(match => 
          match.Div === selectedLeague && 
          match.HomeTeam !== team && 
          match.AwayTeam !== team
        );
        break;
      case 'otherLeagues':
        filteredResults = scoreMatches.filter(match => 
          match.Div !== selectedLeague
        );
        break;
    }

    // Tarihe göre sırala
    const sortedResults = filteredResults.sort((a, b) => 
      Number(b.Date) - Number(a.Date)
    );

    setSearchResults(sortedResults);
  };

  const handleFilterChange = (filter: 'ourTeam' | 'leagueTeams' | 'otherLeagues') => {
    setActiveFilter(filter);
    if (selectedTeam && initialScore) {
      handleSearch(selectedTeam, initialScore);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-end" style={{ pointerEvents: 'none' }}>
      <Dialog 
        open={isOpen} 
        onClose={onClose}
        className="relative z-40 w-full max-w-3xl"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="fixed inset-y-0 right-0 flex">
          <Dialog.Panel className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <Dialog.Title className="text-lg font-medium">
                Karşılaştırma için Maç Seçin
              </Dialog.Title>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Filtre Butonları ve Sezon Seçimi */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('ourTeam')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'ourTeam'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Bizim Takım
                  </button>
                  <button
                    onClick={() => handleFilterChange('leagueTeams')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'leagueTeams'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Ligdeki Diğer Takımlar
                  </button>
                  <button
                    onClick={() => handleFilterChange('otherLeagues')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === 'otherLeagues'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Diğer Ligler
                  </button>
                </div>

                {/* Sezon Seçimi */}
                <button
                  onClick={() => setIsSeasonSelectorOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 
                    dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{currentSeason}</span>
                </button>
              </div>

              {/* Arama Formu */}
              <ScoreSearchForm 
                onSearch={handleSearch}
                matchData={matchData}
                selectedLeague={selectedLeague}
                onTeamSelect={setSelectedTeam}
                initialScore={initialScore}
              />

              {/* Sonuçlar */}
              {searchResults && (
                <div className="mt-6">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {searchResults.map((match, index) => (
                      <ScoreMatchCard 
                        key={`comparison-${index}`}
                        match={match}
                        isSurprise={isSurpriseMatch(match)}
                        onClick={() => {
                          onSelect(match);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Sezon Seçici */}
      <SeasonSelector 
        isOpen={isSeasonSelectorOpen}
        onClose={() => setIsSeasonSelectorOpen(false)}
        seasons={availableSeasons}
        currentSeason={currentSeason}
        onSelect={(season) => {
          setCurrentSeason(season);
          if (selectedTeam && initialScore) {
            handleSearch(selectedTeam, initialScore);
          }
        }}
        searchResults={searchResults}
        selectedTeam={selectedTeam}
        selectedScore={initialScore}
        activeFilter={activeFilter}
        matchData={matchData}
        selectedLeague={selectedLeague}
      />
    </div>
  );
} 