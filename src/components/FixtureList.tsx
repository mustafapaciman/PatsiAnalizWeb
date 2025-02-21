import React, { useState, useEffect, useCallback } from 'react';
import { Star, Clock, Trash2, Shield, BarChart2, Check } from 'lucide-react';
import { Match } from '../utils/types/match';
import { parseDateString } from '../utils/dateUtils';
import { groupFixturesByLeague } from '../utils/fixtureUtils';
import { TeamMapping } from '../utils/types/team';
import { findTeamName } from '../utils/teamNormalizer';
import { getTeamLogo } from '../utils/teamLogoLoader';
import { getLeagueLogo } from '../utils/leagueLogoLoader';
import { MatchingOpponentsAnalysis } from './MatchingOpponentsAnalysis';

interface FixtureListProps {
  fixtures: Match[];
  onSelectMatch: (match: Match) => void;
  selectedMatch?: Match | null;
  teamData: TeamMapping;
  matchData: any;
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

// DO NOT DELETE START - TeamLogo Component
const TeamLogo: React.FC<{ teamName: string, className?: string }> = ({ teamName, className = "w-6 h-6" }) => {
  const logoUrl = getTeamLogo(teamName);
  
  if (!logoUrl) {
    return (
      <div className={`${className} flex items-center justify-center overflow-hidden`}>
        <Shield className="w-full h-full text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center overflow-hidden rounded-full bg-white/80`}>
      <img 
        src={logoUrl} 
        alt={`${teamName} logo`} 
        className="w-full h-full object-contain p-0.5"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.style.display = 'none';
          target.parentElement.innerHTML = `<svg class="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4.7 13.7l6.3 6.3 6.3-6.3c3.37-3.42 3.24-7 1.12-9.12z"></path></svg>`;
        }}
      />
    </div>
  );
};
// DO NOT DELETE END - TeamLogo Component

// Lig Logosu komponenti
const LeagueLogo: React.FC<{ leagueName: string, className?: string }> = ({ leagueName, className = "w-6 h-6" }) => {
  const logoUrl = getLeagueLogo(leagueName);
  
  if (!logoUrl) {
    return null;
  }

  return (
    <div className={`${className} flex items-center justify-center overflow-hidden`}>
      <img 
        src={logoUrl} 
        alt={`${leagueName} logo`} 
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
};

// Tarihi tersine çeviren fonksiyon
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} ${hours}:${minutes}`;
};

// Tarihi görsel olarak düzelten filtre fonksiyonu
const visualDateFilter = (dateStr: string): string => {
  const [day, month] = dateStr.split('.');
  return `${month}.${day}`;
};

// DO NOT DELETE START - FixtureList Component
export function FixtureList({ 
  fixtures,
  onSelectMatch,
  selectedMatch,
  teamData,
  matchData
}: FixtureListProps) {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const savedFavorites = localStorage.getItem('favorites');
    return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set();
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(() => {
    return localStorage.getItem('showOnlyFavorites') === 'true';
  });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isSelectingForAnalysis, setIsSelectingForAnalysis] = useState(false);
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<Notification | null>(null);
  const groupedFixtures = groupFixturesByLeague(fixtures);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('showOnlyFavorites', showOnlyFavorites.toString());
  }, [showOnlyFavorites]);

  useEffect(() => {
    if (showOnlyFavorites && favorites.size === 0) {
      setShowOnlyFavorites(false);
      setNotification({ message: 'Favori maç kalmadığı için tüm maçlar gösteriliyor', type: 'error' });
    }
  }, [favorites, showOnlyFavorites]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleFavorite = (matchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newFavorites = new Set(favorites);
    if (favorites.has(matchId)) {
      newFavorites.delete(matchId);
      setNotification({ message: 'Favorilerden çıkarıldı', type: 'error' });
    } else {
      newFavorites.add(matchId);
      setNotification({ message: 'Favorilere eklendi', type: 'success' });
    }
    setFavorites(newFavorites);
  };

  const getMatchId = (match: Match) => 
    `${match.Date}-${match.Time}-${match.HomeTeam}-${match.AwayTeam}`;

  const filteredFixtures = showOnlyFavorites
    ? Object.fromEntries(
        Object.entries(groupedFixtures).map(([league, matches]: [string, Match[]]) => [
          league,
          matches.filter((match: Match) => favorites.has(getMatchId(match)))
        ]).filter(([_, matches]) => matches.length > 0)
      )
    : groupedFixtures;

  const getLeagueName = (code: string) => {
    const leagues = {
      'E0': 'Premier League',
      'E1': 'Championship',
      'E2': 'League One',
      'E3': 'League Two',
      'SC0': 'Scottish Premier League',
      'SC1': 'Scottish Championship',
      'SC2': 'Scottish League One',
      'SC3': 'Scottish League Two',
      'D1': 'Bundesliga',
      'D2': '2. Bundesliga',
      'SP1': 'La Liga',
      'SP2': 'La Liga 2',
      'I1': 'Serie A',
      'I2': 'Serie B',
      'F1': 'Ligue 1',
      'F2': 'Ligue 2',
      'N1': 'Eredivisie',
      'B1': 'Jupiler Pro League',
      'P1': 'Primeira Liga',
      'T1': 'Süper Lig',
      'G1': 'Super League Greece'
    };
    return leagues[code as keyof typeof leagues] || code;
  };

  const toggleMatchForAnalysis = (matchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selectedForAnalysis);
    if (selectedForAnalysis.has(matchId)) {
      newSelected.delete(matchId);
    } else {
      newSelected.add(matchId);
    }
    setSelectedForAnalysis(newSelected);
  };

  const startAnalysisSelection = () => {
    setIsSelectingForAnalysis(true);
    setSelectedForAnalysis(new Set());
    setNotification({ 
      message: 'Analiz edilecek maçları seçin', 
      type: 'success' 
    });
  };

  const completeAnalysisSelection = () => {
    if (selectedForAnalysis.size === 0) {
      setNotification({ 
        message: 'En az bir maç seçmelisiniz', 
        type: 'error' 
      });
      return;
    }
    
    // Filter selected matches
    const selectedMatches = fixtures.filter(match => 
      selectedForAnalysis.has(getMatchId(match))
    );
    
    setIsSelectingForAnalysis(false);
    setShowAnalysisModal(true);
  };

  return (
    <div className={`${className} p-4`}>
      <div className="space-y-4">
        <div className="flex justify-end mb-4 gap-2">
          {showOnlyFavorites && (
            <button
              onClick={() => {
                setFavorites(new Set());
                setNotification({ message: 'Tüm favoriler silindi', type: 'error' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                favorites.size > 0 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={favorites.size === 0}
            >
              <Trash2 size={18} />
              Tüm Favorileri Sil
            </button>
          )}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              showOnlyFavorites 
                ? 'bg-yellow-400 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star size={18} className={showOnlyFavorites ? 'fill-white' : ''} />
            {showOnlyFavorites ? 'Tüm Maçları Göster' : 'Favorileri Göster'}
          </button>
          {!isSelectingForAnalysis ? (
            <button
              onClick={startAnalysisSelection}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              <BarChart2 size={18} />
              Benzer Rakip Analizi
            </button>
          ) : (
            <button
              onClick={completeAnalysisSelection}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              <Check size={18} />
              Analizi Başlat ({selectedForAnalysis.size})
            </button>
          )}
        </div>

        {Object.entries(filteredFixtures).map(([league, matches]) => (
          <div key={league} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <LeagueLogo leagueName={league} className="w-6 h-6" />
                <h3 className="text-white font-semibold">{getLeagueName(league)}</h3>
              </div>
              <div className="flex text-xs text-white/80">
                <div className="w-[45px] text-center border-r border-white/20">1</div>
                <div className="w-[45px] text-center border-r border-white/20">X</div>
                <div className="w-[45px] text-center border-r border-white/20">2</div>
                <div className="w-[45px] text-center border-r border-white/20">Ü2.5</div>
                <div className="w-[45px] text-center">A2.5</div>
              </div>
            </div>
            
            <div className="divide-y">
              {(matches as Match[]).map((match: Match) => {
                const matchId = getMatchId(match);
                const isSelected = selectedMatch && getMatchId(selectedMatch) === matchId;
                const matchDate = parseDateString(match.Date || '', match.Time || '');
                console.log('Original Date:', match.Date, 'Parsed Date:', matchDate);
                
                return (
                  <div
                    key={matchId}
                    onClick={() => !isSelectingForAnalysis && onSelectMatch(match)}
                    className={`flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {isSelectingForAnalysis ? (
                      <button
                        onClick={(e) => toggleMatchForAnalysis(matchId, e)}
                        className="mr-3"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          selectedForAnalysis.has(matchId) 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'border-gray-300'
                        }`}>
                          {selectedForAnalysis.has(matchId) && (
                            <Check size={14} className="text-white" />
                          )}
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => toggleFavorite(matchId, e)}
                        className="mr-3"
                      >
                        <Star
                          size={18}
                          className={favorites.has(matchId) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      </button>
                    )}
                    
                    <div className="flex flex-col text-sm text-gray-500 w-20">
                      <span>{visualDateFilter(formatDate(matchDate).split(' ')[0])}</span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDate(matchDate).split(' ')[1]}
                      </span>
                    </div>

                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={match.HomeTeam} className="w-6 h-6" />
                          <span>{match.HomeTeam}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TeamLogo teamName={match.AwayTeam} className="w-6 h-6" />
                          <span>{match.AwayTeam}</span>
                        </div>
                      </div>

                      <div className="flex text-sm">
                        <div className="w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200">{match.B365H?.toFixed(2) || '-'}</div>
                        <div className="w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200">{match.B365D?.toFixed(2) || '-'}</div>
                        <div className="w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200">{match.B365A?.toFixed(2) || '-'}</div>
                        <div className="w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200">{match['B365>2.5']?.toFixed(2) || '-'}</div>
                        <div className="w-[45px] px-2 py-1 bg-gray-100 rounded text-center">{match['B365<2.5']?.toFixed(2) || '-'}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {notification && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-opacity ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.message}
          </div>
        )}

        {showAnalysisModal && (
          <MatchingOpponentsAnalysis
            fixtures={fixtures.filter(match => selectedForAnalysis.has(getMatchId(match)))}
            matchData={matchData}
            onClose={() => {
              setShowAnalysisModal(false);
              setSelectedForAnalysis(new Set());
            }}
          />
        )}
      </div>
    </div>
  );
}
// DO NOT DELETE END - FixtureList Component