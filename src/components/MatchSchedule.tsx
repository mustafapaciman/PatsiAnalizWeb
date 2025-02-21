import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { TeamLogo } from './TeamLogo';
import Draggable from 'react-draggable';
import { Switch } from '@headlessui/react';
import { NewAnalysisTab } from './analysis/NewAnalysisTab';
import * as XLSX from 'xlsx';

// Lig isimleri için sabit tanımlama
const LEAGUE_NAMES: { [key: string]: string } = {
  'E0': 'Premier League',
  'E1': 'Championship',
  'E2': 'League One',
  'E3': 'League Two',
  'EC': 'Conference',
  'SC0': 'Scotland Premier League',
  'SC1': 'Scotland Championship',
  'SC2': 'Scotland League One',
  'SC3': 'Scotland League Two',
  'SP1': 'La Liga',
  'SP2': 'La Liga 2',
  'D1': 'Bundesliga',
  'D2': '2. Bundesliga',
  'I1': 'Serie A',
  'I2': 'Serie B',
  'F1': 'Ligue 1',
  'F2': 'Ligue 2',
  'N1': 'Eredivisie',
  'P1': 'Primeira Liga',
  'T1': 'Süper Lig',
  'B1': 'Belgian Pro League',
  'G1': 'Greek Super League',
  'UCL': 'UEFA Champions League',
  'UEL': 'UEFA Europa League',
  'UECL': 'UEFA Conference League',
  'USC': 'UEFA Super Cup',
  'UEFA': 'UEFA Turnuvaları'
};

// Sezon tipi tanımlaması
interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

interface MatchScheduleProps {
  matchData: Match[];
  teamData: TeamMapping;
}

interface TeamChainLink {
  fromTeam: string;
  toTeam: string;
  match: Match;
}

interface TeamChain {
  teams: string[];
  surpriseMatches: Match[];
  previousMatches: {
    team: string;
    matches: Match[];
  }[];
  commonOpponents: string[]; // Önceki maçlardaki ortak rakipler
  season: string;
  seasonMatches: Match[]; // Sezon maçlarını ekle
}

interface MatchPair {
  firstMatch: Match;
  secondMatch: Match;
  team1: string;
  team2: string;
  season: string;
}

// Yeni state ve interface tanımlamaları
interface SeasonSurprise {
  match: Match;
  previousMatches: Match[];
  commonOpponents: string[];
}

interface ScheduleSimilarity {
  team: string;
  season: string;
  similarity: number;
  matches: Match[];
  similarityDetails: {
    firstOpponentMatch: boolean;
    opponentMatches: number;
    homeAwayMatch: number;
    scoreMatch: number;
  };
}

export default function MatchSchedule({ matchData, teamData }: MatchScheduleProps) {
  // State tanımlamaları
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [teams, setTeams] = useState<string[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chain' | 'matches' | 'surprises' | 'custom' | 'bridge' | 'lastOpponent' | 'twoHalves' | 'toast' | 'newAnalysis'>('chain');
  const [teamChains, setTeamChains] = useState<TeamChain[]>([]);
  const [matchPairs, setMatchPairs] = useState<MatchPair[]>([]);
  const [isLoadingChain, setIsLoadingChain] = useState<boolean>(false);
  const [isLoadingPairs, setIsLoadingPairs] = useState<boolean>(false);
  const nodeRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [seasonSurprises, setSeasonSurprises] = useState<SeasonSurprise[]>([]);
  const [isLoadingSeasonSurprises, setIsLoadingSeasonSurprises] = useState<boolean>(false);
  const [selectedSurpriseMatches, setSelectedSurpriseMatches] = useState<Set<string>>(new Set());
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>([]);
  const [customTripletResults, setCustomTripletResults] = useState<{
    season: string;
    team: string;
    opponent: string;
    match: Match;
    matchingOpponents: string[];
  }[]>([]);
  
  // Karşılaştırma modu için state'ler
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [isSurpriseMode, setIsSurpriseMode] = useState<boolean>(false); // Sol panel sürpriz modu
  const [isComparisonSurpriseMode, setIsComparisonSurpriseMode] = useState<boolean>(false); // Sağ panel sürpriz modu
  const [comparisonSeason, setComparisonSeason] = useState<string>('');
  const [comparisonMatches, setComparisonMatches] = useState<Match[]>([]);

  // Benzerlik analizi için state'ler
  const [selectedSurpriseMatch, setSelectedSurpriseMatch] = useState<Match | null>(null);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string>(''); // Yeni state
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string>(''); // Yeni state
  const [similarMatches, setSimilarMatches] = useState<{
    match: Match;
    similarity: number;
    commonPatterns: string[];
    matchingTeam?: string;
    matchingScores?: string[];
    isPartialMatch?: boolean;
  }[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState<boolean>(false);
  const [expandedMatchDetails, setExpandedMatchDetails] = useState<string[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'surprise' | 'prediction'>('surprise'); // Yeni state

  // Köprü modu için state'ler
  const [selectedTeamA, setSelectedTeamA] = useState<string>('');
  const [selectedTeamZ, setSelectedTeamZ] = useState<string>('');
  const [bridgeResults, setBridgeResults] = useState<{
    season: string;
    pattern: {
      teamX: string;
      teamY: string;
      teamZ: string;
      firstMatch: Match;
      surpriseMatch: Match;
    }[];
    currentPattern?: {
      teamX: string;
      teamA: string;
      teamZ: string;
      firstMatch: Match;
      potentialMatch?: Match; // Henüz oynanmamış maç
    };
  }[]>([]);
  const [isLoadingBridge, setIsLoadingBridge] = useState<boolean>(false);
  const [expandedSeasons, setExpandedSeasons] = useState<string[]>([]);
  const [expandedPatterns, setExpandedPatterns] = useState<string[]>([]);

  const [isAutoCalculating, setIsAutoCalculating] = useState<boolean>(false);
  const [showTeamSelectionModal, setShowTeamSelectionModal] = useState<boolean>(false);
  const [autoSelectedTeam1, setAutoSelectedTeam1] = useState<string>('');
  const [autoSelectedTeam2, setAutoSelectedTeam2] = useState<string>('');
  const [currentAutoStep, setCurrentAutoStep] = useState<'bridge' | 'similar' | 'custom1' | 'custom2' | null>(null);
  const [showContinueButton, setShowContinueButton] = useState<boolean>(false);
  const [scheduleAnalysisResults, setScheduleAnalysisResults] = useState<ScheduleSimilarity[]>([]);
  const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState<boolean>(false);
  const [showLowSimilarity, setShowLowSimilarity] = useState<boolean>(false);
  const [surpriseTeamSimilarity, setSurpriseTeamSimilarity] = useState<{
    team: string;
    season: string;
    similarity: number;
  }[]>([]);

  // Yeni state'ler
  const [isWeekMode, setIsWeekMode] = useState<boolean>(false);
  const [selectedMatchCount, setSelectedMatchCount] = useState<number>(1);
  const [teamMatches, setTeamMatches] = useState<{[team: string]: Match[]}>({});
  const [maxMatchCount, setMaxMatchCount] = useState<number>(0);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(true);
  const [surpriseAnalysis, setSurpriseAnalysis] = useState<{
    [day: string]: {
      league: string;
      count: number;
      otherLeagues?: { league: string; count: number }[];
      totalSurprises?: number;
    }
  }>({});

  // Son Rakip analizi için state'ler
  const [selectedTeamForLastOpponent1, setSelectedTeamForLastOpponent1] = useState<string>('');
  const [selectedTeamForLastOpponent2, setSelectedTeamForLastOpponent2] = useState<string>('');
  const [lastOpponentResults, setLastOpponentResults] = useState<{
    team: string;
    lastOpponent: string;
    score: string;
    potentialMatches: {
      season: string;
      similarTeam: string;
      surpriseMatch: Match;
      originalMatch: Match;
    }[];
  }[]>([]);
  const [isAnalyzingLastOpponent, setIsAnalyzingLastOpponent] = useState<boolean>(false);

  // İki Yarı analizi için state'ler
  const [selectedTeamForTwoHalves1, setSelectedTeamForTwoHalves1] = useState<string>('');
  const [selectedTeamForTwoHalves2, setSelectedTeamForTwoHalves2] = useState<string>('');
  const [isAnalyzingTwoHalves, setIsAnalyzingTwoHalves] = useState<boolean>(false);
  const [twoHalvesResults, setTwoHalvesResults] = useState<{
    triggerTeam: string;    // Sürpriz yapan takım
    otherTeam: string;      // Diğer takım
    teamE: string;          // E takımı
    eMatch: Match;          // E ile olan maç
    surpriseMatch: Match;   // Sürpriz maç
  }[]>([]);

  // Tost Formülü için state'ler
  const [selectedTeamForToast1, setSelectedTeamForToast1] = useState<string>('');
  const [selectedTeamForToast2, setSelectedTeamForToast2] = useState<string>('');
  const [isAnalyzingToast, setIsAnalyzingToast] = useState<boolean>(false);
  const [toastResults, setToastResults] = useState<{
    surpriseMatch: Match;
    toastStart: {
      team: string;
      isHome: boolean;
    };
    toastMiddle: {
      team: string;
      isHome: boolean;
    };
    toastEnd: {
      team: string;
      isHome: boolean;
      match: Match;
    };
    season: string;
  }[]>([]);
  const [currentToastSeason, setCurrentToastSeason] = useState<string>('');
  const [showMoreSeasonsButton, setShowMoreSeasonsButton] = useState<boolean>(false);

  // Modal stili için dinamik class'lar
  const getModalStyle = () => {
    if (isFullScreen) {
      return "fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-800 z-50";
    }
    return "fixed top-[20%] left-[30%] w-[800px] bg-gray-800 rounded-lg shadow-2xl z-50";
  };

  // Sezonları oluştur
  useEffect(() => {
    const createSeasons = () => {
      const seasonList: Season[] = [];
      const years = Array.from(new Set(matchData.map(match => {
        const date = new Date((Number(match.Date) - 25569) * 86400 * 1000);
        return date.getFullYear();
      }))).sort((a, b) => b - a);

      years.forEach(year => {
        seasonList.push({
          id: `${year}-${year + 1}`,
          name: `${year}-${year + 1}`,
          startDate: new Date(year, 7, 1), // Ağustos ayı başlangıcı
          endDate: new Date(year + 1, 5, 30) // Haziran ayı sonu
        });
      });

      setSeasons(seasonList);
      if (seasonList.length > 0) {
        setSelectedSeason(seasonList[0].id);
      }
    };

    createSeasons();
  }, [matchData]);

  // Lig seçildiğinde takımları güncelle
  useEffect(() => {
    if (selectedLeague) {
      const leagueTeams = Array.from(new Set(
        matchData
          .filter(match => match.Div === selectedLeague)
          .flatMap(match => [match.HomeTeam, match.AwayTeam])
      )).sort();
      setTeams(leagueTeams);
      setSelectedTeam('');
    }
  }, [selectedLeague, matchData]);

  // Seçilen takım ve sezona göre maçları filtrele
  useEffect(() => {
    if (selectedTeam && selectedSeason) {
      const season = seasons.find(s => s.id === selectedSeason);
      if (season) {
        const teamMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
          const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
          return isInSeason && isTeamMatch;
        });

        // Tarihe göre sırala (eskiden yeniye)
        const sortedMatches = teamMatches.sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        if (isSurpriseMode) {
          console.log('Sürpriz Modu Aktif');
          console.log('Seçili Takım:', selectedTeam);
          console.log('Seçili Sezon:', selectedSeason);
          
          // Sürpriz maçları bul (1/2 ve 2/1)
          const surpriseMatches = sortedMatches.filter(match => {
            const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
            const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
            return isHomeToAwaySurprise || isAwayToHomeSurprise;
          });

          console.log('Bulunan Sürpriz Maç Sayısı:', surpriseMatches.length);
          console.log('Sürpriz Maçlar:', surpriseMatches);

          // Her sürpriz maç için önceki 2 maçı bul
          const matchesToShow = new Set<Match>();
          surpriseMatches.forEach(surpriseMatch => {
            matchesToShow.add(surpriseMatch);
            const surpriseMatchIndex = sortedMatches.findIndex(m => m === surpriseMatch);
            // Önceki 2 maçı ekle
            for (let i = 1; i <= 2; i++) {
              if (surpriseMatchIndex - i >= 0) {
                matchesToShow.add(sortedMatches[surpriseMatchIndex - i]);
              }
            }
          });

          const finalMatches = Array.from(matchesToShow).sort((a, b) => {
            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
            return dateA.getTime() - dateB.getTime();
          });

          console.log('Gösterilecek Toplam Maç Sayısı:', finalMatches.length);
          setFilteredMatches(finalMatches);
        } else {
          setFilteredMatches(sortedMatches);
        }
      }
    } else {
      setFilteredMatches([]);
    }
  }, [selectedTeam, selectedSeason, matchData, seasons, isSurpriseMode]);

  // Karşılaştırma sezonu için maçları filtrele
  useEffect(() => {
    if (selectedTeam && comparisonSeason && isComparisonMode) {
      const season = seasons.find(s => s.id === comparisonSeason);
      if (season) {
        const teamMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
          const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
          return isInSeason && isTeamMatch;
        });

        const sortedMatches = teamMatches.sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        if (isComparisonSurpriseMode) {
          // Sürpriz maçları bul (1/2 ve 2/1)
          const surpriseMatches = sortedMatches.filter(match => {
            const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
            const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
            return isHomeToAwaySurprise || isAwayToHomeSurprise;
          });

          // Her sürpriz maç için önceki 2 maçı bul
          const matchesToShow = new Set<Match>();
          surpriseMatches.forEach(surpriseMatch => {
            matchesToShow.add(surpriseMatch);
            const surpriseMatchIndex = sortedMatches.findIndex(m => m === surpriseMatch);
            // Önceki 2 maçı ekle
            for (let i = 1; i <= 2; i++) {
              if (surpriseMatchIndex - i >= 0) {
                matchesToShow.add(sortedMatches[surpriseMatchIndex - i]);
              }
            }
          });

          const finalMatches = Array.from(matchesToShow).sort((a, b) => {
            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
            return dateA.getTime() - dateB.getTime();
          });

          setComparisonMatches(finalMatches);
        } else {
          setComparisonMatches(sortedMatches);
        }
      }
    } else {
      setComparisonMatches([]);
    }
  }, [selectedTeam, comparisonSeason, isComparisonMode, matchData, seasons, isComparisonSurpriseMode]);

  // Karşılaştırma modu değiştiğinde, varsayılan karşılaştırma sezonu seç
  useEffect(() => {
    if (isComparisonMode && selectedSeason && seasons.length > 0) {
      const currentSeasonIndex = seasons.findIndex(s => s.id === selectedSeason);
      if (currentSeasonIndex < seasons.length - 1) {
        setComparisonSeason(seasons[currentSeasonIndex + 1].id);
      }
    }
  }, [isComparisonMode, selectedSeason, seasons]);

  // Excel tarihini normal tarihe çeviren fonksiyon
  const formatDate = (excelDate: number | string): string => {
    const date = new Date((Number(excelDate) - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Takım zinciri analizi
  const findTeamChains = () => {
    if (!selectedTeam || !selectedLeague) return;
    
    setIsLoadingChain(true);
    setTeamChains([]); // Önceki sonuçları temizle
    
    setTimeout(() => {
      try {
        // Tüm maçları filtrele
        const allMatches = matchData.filter(match => 
          match.Div === selectedLeague &&
          match.FTHG !== undefined && 
          match.FTAG !== undefined
        );

        console.log('Toplam maç sayısı:', allMatches.length);

        // Bulunan zincirleri kontrol etmek için Set kullan
        const foundChains = new Set<string>();
        const chains: TeamChain[] = [];

        // Her sezon için ayrı analiz yap
        seasons.forEach(season => {
          // Sezon maçlarını filtrele
          const seasonMatches = allMatches.filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= season.startDate && matchDate <= season.endDate;
          }).sort((a, b) => {
            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
            return dateA.getTime() - dateB.getTime();
          });

          // Seçili takımın bu sezondaki sürpriz maçlarını bul
          const ourSurprises = seasonMatches.filter(match => {
            const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                              (match.HTR === 'A' && match.FTR === 'H');
            const involvesSelectedTeam = match.HomeTeam === selectedTeam || 
                                       match.AwayTeam === selectedTeam;
            return isSurprise && involvesSelectedTeam;
          });

          console.log(`${season.name} sezonu sürpriz maçları:`, ourSurprises.length);

          // Her sürpriz maç için
          ourSurprises.forEach(firstMatch => {
            // Rakip takımı bul (Y takımı)
            const teamY = firstMatch.HomeTeam === selectedTeam ? 
                         firstMatch.AwayTeam : 
                         firstMatch.HomeTeam;

            console.log(`${season.name} sezonunda incelenen Y takımı:`, teamY);

            // Y takımının aynı sezondaki sürpriz maçlarını bul
            const teamYSurprises = seasonMatches.filter(match => {
              const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                (match.HTR === 'A' && match.FTR === 'H');
              const involvesTeamY = match.HomeTeam === teamY || 
                                   match.AwayTeam === teamY;
              return match !== firstMatch && isSurprise && involvesTeamY;
            });

            // Potansiyel X takımlarını bul (Y takımının rakipleri)
            const potentialTeamXs = new Set<string>();
            teamYSurprises.forEach(match => {
              const opponent = match.HomeTeam === teamY ? match.AwayTeam : match.HomeTeam;
              if (opponent !== selectedTeam) {
                potentialTeamXs.add(opponent);
              }
            });

            console.log(`${season.name} sezonunda potansiyel X takımları:`, Array.from(potentialTeamXs));

            // Her potansiyel X takımı için kontrol et
            potentialTeamXs.forEach(teamX => {
              // X takımının seçili takım ile sürpriz maçı var mı?
              const xWithSelected = seasonMatches.find(match => {
                const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                  (match.HTR === 'A' && match.FTR === 'H');
                return isSurprise && 
                       ((match.HomeTeam === teamX && match.AwayTeam === selectedTeam) ||
                        (match.HomeTeam === selectedTeam && match.AwayTeam === teamX));
              });

              // X takımının Y takımı ile sürpriz maçı var mı?
              const xWithY = seasonMatches.find(match => {
                const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                  (match.HTR === 'A' && match.FTR === 'H');
                return isSurprise && 
                       ((match.HomeTeam === teamX && match.AwayTeam === teamY) ||
                        (match.HomeTeam === teamY && match.AwayTeam === teamX));
              });

              if (xWithSelected && xWithY) {
                // Zinciri benzersiz bir şekilde tanımla
                const chainKey = [selectedTeam, teamY, teamX]
                  .sort()
                  .join('-') + '-' + season.name;

                // Eğer bu zincir daha önce bulunmadıysa ekle
                if (!foundChains.has(chainKey)) {
                  foundChains.add(chainKey);

                  // Önceki maçları bul (aynı sezon içinde)
                  const previousMatches = [
                    {
                      team: selectedTeam,
                      matches: findPreviousMatches(seasonMatches, firstMatch, selectedTeam)
                    },
                    {
                      team: teamY,
                      matches: findPreviousMatches(seasonMatches, firstMatch, teamY)
                    },
                    {
                      team: teamX,
                      matches: findPreviousMatches(seasonMatches, xWithSelected, teamX)
                    }
                  ];

                  // Önceki maçlardaki rakipleri bul
                  const allOpponents = previousMatches.flatMap(pm => 
                    pm.matches.map(m => 
                      m.HomeTeam === pm.team ? m.AwayTeam : m.HomeTeam
                    )
                  );

                  // Ortak rakipleri bul (en az 2 takımın karşılaştığı)
                  const opponentCounts = new Map<string, number>();
                  allOpponents.forEach(opponent => {
                    opponentCounts.set(opponent, (opponentCounts.get(opponent) || 0) + 1);
                  });

                  const commonOpponents = Array.from(opponentCounts.entries())
                    .filter(([_, count]) => count >= 2)
                    .map(([opponent]) => opponent);

                  chains.push({
                    teams: [selectedTeam, teamY, teamX],
                    surpriseMatches: [firstMatch, xWithSelected, xWithY],
                    previousMatches,
                    commonOpponents,
                    season: season.name,
                    seasonMatches: seasonMatches
                  });
                }
              }
            });
          });
        });

        // Zincirleri sezon sırasına göre sırala (en yeniden eskiye)
        const sortedChains = chains.sort((a, b) => {
          const yearA = parseInt(a.season.split('-')[0]);
          const yearB = parseInt(b.season.split('-')[0]);
          return yearB - yearA;
        });

        console.log('Bulunan zincir sayısı:', sortedChains.length);
        setTeamChains(sortedChains);
      } catch (error) {
        console.error('Takım zinciri analizi hatası:', error);
      } finally {
        setIsLoadingChain(false);
      }
    }, 100);
  };

  // Bir maçtan önceki 3 maçı bul
  const findPreviousMatches = (allMatches: Match[], targetMatch: Match, team: string): Match[] => {
    const targetDate = new Date((Number(targetMatch.Date) - 25569) * 86400 * 1000);
    
    return allMatches
      .filter(match => {
        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
        return matchDate < targetDate && 
               (match.HomeTeam === team || match.AwayTeam === team);
      })
      .slice(-3); // Son 3 maç
  };

  // Modal içeriğinde Takım Zinciri görünümü
  const renderTeamChain = () => {
    if (teamChains.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8">
          <button
            onClick={findTeamChains}
            disabled={isLoadingChain}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
          >
            {isLoadingChain ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              'Zincir Analizi Başlat'
            )}
          </button>
        </div>
      );
    }

    // Zincirleri sezonlara göre grupla
    const chainsBySeasons = teamChains.reduce((acc, chain) => {
      if (!acc[chain.season]) {
        acc[chain.season] = [];
      }
      acc[chain.season].push(chain);
      return acc;
    }, {} as { [key: string]: TeamChain[] });

    return (
      <div className="space-y-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          Bulunan Sürpriz Zincirleri ({teamChains.length})
        </h3>
        {Object.entries(chainsBySeasons).map(([season, chains]) => (
          <div key={season} className="space-y-6">
            <h4 className="text-md font-medium text-gray-300">{season} Sezonu</h4>
            {chains.map((chain, chainIndex) => (
              <div
                key={chainIndex}
                className="bg-gray-700/30 rounded-lg p-6 space-y-6"
              >
                {/* Sürpriz Maçlar - Yatay Düzen */}
                <div className="grid grid-cols-3 gap-4">
                  {chain.surpriseMatches.map((match, matchIndex) => (
                    <div key={matchIndex} className="bg-gray-800/50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                        <span>{formatDate(match.Date)}</span>
                        <span className="text-orange-400 font-medium">
                          {matchIndex + 1}. Sürpriz
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Ev Sahibi */}
                        <div className="flex items-center gap-2">
                          <TeamLogo name={match.HomeTeam} className="w-6 h-6" />
                          <span className={`font-medium ${match.FTR === 'H' ? 'text-green-400' : 'text-white'}`}>
                            {match.HomeTeam}
                          </span>
                        </div>
                        
                        {/* Skor */}
                        <div className="flex flex-col items-center text-center border-l-2 border-r-2 border-gray-700 mx-2 py-1">
                          <span className="text-white font-bold">
                            {match.FTHG} - {match.FTAG}
                          </span>
                          <span className="text-sm text-gray-400">
                            (İY: {match.HTHG}-{match.HTAG})
                          </span>
                        </div>
                        
                        {/* Deplasman */}
                        <div className="flex items-center justify-end gap-2">
                          <span className={`font-medium ${match.FTR === 'A' ? 'text-green-400' : 'text-white'}`}>
                            {match.AwayTeam}
                          </span>
                          <TeamLogo name={match.AwayTeam} className="w-6 h-6" />
                        </div>

                        {/* Önceki Maçlar */}
                        <div className="mt-4 space-y-3">
                          {/* Ev Sahibi Son 3 Maç */}
                          <div className="bg-gray-900/50 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                              <TeamLogo name={match.HomeTeam} className="w-4 h-4" />
                              <span>{match.HomeTeam} Son 3 Maç:</span>
                            </div>
                            <div className="space-y-2">
                              {findPreviousMatches(chain.seasonMatches, match, match.HomeTeam).map((prevMatch, prevIndex) => {
                                const opponent = prevMatch.HomeTeam === match.HomeTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                                const isCommonOpponent = chain.commonOpponents.includes(opponent);
                                
                                return (
                                  <div key={prevIndex} className="grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm">
                                    <span className="text-gray-500">{formatDate(prevMatch.Date)}</span>
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`
                                        ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.HomeTeam !== match.HomeTeam ? 'text-orange-400' : ''}
                                      `}>
                                        {prevMatch.HomeTeam}
                                      </span>
                                      <TeamLogo name={prevMatch.HomeTeam} className="w-4 h-4" />
                                    </div>
                                    <div className="text-center font-medium text-gray-400">
                                      {prevMatch.FTHG}-{prevMatch.FTAG}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <TeamLogo name={prevMatch.AwayTeam} className="w-4 h-4" />
                                      <span className={`
                                        ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.AwayTeam !== match.HomeTeam ? 'text-orange-400' : ''}
                                      `}>
                                        {prevMatch.AwayTeam}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Deplasman Son 3 Maç */}
                          <div className="bg-gray-900/50 rounded-lg p-3">
                            <div className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                              <TeamLogo name={match.AwayTeam} className="w-4 h-4" />
                              <span>{match.AwayTeam} Son 3 Maç:</span>
                            </div>
                            <div className="space-y-2">
                              {findPreviousMatches(chain.seasonMatches, match, match.AwayTeam).map((prevMatch, prevIndex) => {
                                const opponent = prevMatch.HomeTeam === match.AwayTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                                const isCommonOpponent = chain.commonOpponents.includes(opponent);
                                
                                return (
                                  <div key={prevIndex} className="grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm">
                                    <span className="text-gray-500">{formatDate(prevMatch.Date)}</span>
                                    <div className="flex items-center justify-end gap-2">
                                      <span className={`
                                        ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.HomeTeam !== match.AwayTeam ? 'text-orange-400' : ''}
                                      `}>
                                        {prevMatch.HomeTeam}
                                      </span>
                                      <TeamLogo name={prevMatch.HomeTeam} className="w-4 h-4" />
                                    </div>
                                    <div className="text-center font-medium text-gray-400">
                                      {prevMatch.FTHG}-{prevMatch.FTAG}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <TeamLogo name={prevMatch.AwayTeam} className="w-4 h-4" />
                                      <span className={`
                                        ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.AwayTeam !== match.AwayTeam ? 'text-orange-400' : ''}
                                      `}>
                                        {prevMatch.AwayTeam}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ortak Rakipler */}
                {chain.commonOpponents.length > 0 && (
                  <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                      Ortak Rakipler:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {chain.commonOpponents.map((opponent, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2"
                        >
                          <TeamLogo name={opponent} className="w-5 h-5" />
                          <span className="text-gray-300">{opponent}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Maç sırası analizi
  const findMatchPairs = () => {
    if (!selectedLeague || !selectedTeam) return;

    setIsLoadingPairs(true);

    setTimeout(() => {
      try {
        const pairs: MatchPair[] = [];
        const processedPairs = new Set<string>();

        // Performans için maçları önceden filtrele
        const leagueMatches = matchData.filter(match => 
          match.Div === selectedLeague && 
          match.FTHG !== undefined && 
          match.FTAG !== undefined &&
          (match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam)
        );

        // Seçili takımın rakiplerini bul
        const opponents = Array.from(new Set(leagueMatches
          .map(m => m.HomeTeam === selectedTeam ? m.AwayTeam : m.HomeTeam)
        )).sort();

        // Her sezon için kontrol et
        seasons.forEach(season => {
          // Sezon maçlarını filtrele
          const seasonMatches = leagueMatches.filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= season.startDate && matchDate <= season.endDate;
          });

          // Her rakip için kontrol et
          opponents.forEach(opponent => {
            // Bu rakiple olan maçları bul
            const matches = seasonMatches.filter(
              m => (m.HomeTeam === selectedTeam && m.AwayTeam === opponent) ||
                   (m.HomeTeam === opponent && m.AwayTeam === selectedTeam)
            ).sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateA.getTime() - dateB.getTime();
            });

            if (matches.length !== 2) return;

            // Sürpriz kontrolü
            const [firstMatch, secondMatch] = matches;
            const firstHasSurprise = 
              (firstMatch.HTR === 'H' && firstMatch.FTR === 'A') ||
              (firstMatch.HTR === 'A' && firstMatch.FTR === 'H');
            const secondHasSurprise = 
              (secondMatch.HTR === 'H' && secondMatch.FTR === 'A') ||
              (secondMatch.HTR === 'A' && secondMatch.FTR === 'H');

            // En az bir maçta sürpriz varsa ekle
            if (firstHasSurprise || secondHasSurprise) {
              const pairKey = `${selectedTeam}-${opponent}-${season.id}`;
              if (!processedPairs.has(pairKey)) {
                pairs.push({
                  firstMatch,
                  secondMatch,
                  team1: selectedTeam,
                  team2: opponent,
                  season: season.name
                });
                processedPairs.add(pairKey);
              }
            }
          });
        });

        // Sonuçları sezon sırasına göre ters çevir
        setMatchPairs(pairs.sort((a, b) => {
          const yearA = parseInt(a.season.split('-')[0]);
          const yearB = parseInt(b.season.split('-')[0]);
          return yearB - yearA;
        }));
      } catch (error) {
        console.error('Maç sırası analizi hatası:', error);
      } finally {
        setIsLoadingPairs(false);
      }
    }, 100);
  };

  // Modal içeriğinde Maç Sırası görünümü
  const renderMatchSequence = () => {
    if (!selectedTeam) {
      return (
        <div className="text-center text-gray-400 py-8">
          Lütfen bir takım seçin
        </div>
      );
    }

    if (matchPairs.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8">
          <button
            onClick={findMatchPairs}
            disabled={isLoadingPairs}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
          >
            {isLoadingPairs ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              'Maç Sırası Analizi Başlat'
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Bulunan Maç Çiftleri ({matchPairs.length})
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {matchPairs.map((pair, index) => (
            <div
              key={index}
              className="bg-gray-700/30 rounded-lg p-4"
            >
              <div className="text-sm text-gray-400 mb-4 font-medium">{pair.season}</div>
              <div className="space-y-4">
                {/* İlk Maç */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{formatDate(pair.firstMatch.Date)}</span>
                    <div className="flex-1 mx-8">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 min-w-[200px] justify-end">
                          <span className={`font-medium ${pair.firstMatch.FTR === 'H' ? 'text-green-400' : 'text-white'}`}>
                            {pair.firstMatch.HomeTeam}
                          </span>
                          <TeamLogo name={pair.firstMatch.HomeTeam} className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-center min-w-[100px]">
                          <span className="text-white font-bold">
                            {pair.firstMatch.FTHG} - {pair.firstMatch.FTAG}
                          </span>
                          <span className="text-gray-400 text-sm">
                            (İY: {pair.firstMatch.HTHG}-{pair.firstMatch.HTAG})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <TeamLogo name={pair.firstMatch.AwayTeam} className="w-6 h-6" />
                          <span className={`font-medium ${pair.firstMatch.FTR === 'A' ? 'text-green-400' : 'text-white'}`}>
                            {pair.firstMatch.AwayTeam}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* İkinci Maç */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">{formatDate(pair.secondMatch.Date)}</span>
                    <div className="flex-1 mx-8">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 min-w-[200px] justify-end">
                          <span className={`font-medium ${pair.secondMatch.FTR === 'H' ? 'text-green-400' : 'text-white'}`}>
                            {pair.secondMatch.HomeTeam}
                          </span>
                          <TeamLogo name={pair.secondMatch.HomeTeam} className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-center min-w-[100px]">
                          <span className="text-white font-bold">
                            {pair.secondMatch.FTHG} - {pair.secondMatch.FTAG}
                          </span>
                          <span className="text-gray-400 text-sm">
                            (İY: {pair.secondMatch.HTHG}-{pair.secondMatch.HTAG})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[200px]">
                          <TeamLogo name={pair.secondMatch.AwayTeam} className="w-6 h-6" />
                          <span className={`font-medium ${pair.secondMatch.FTR === 'A' ? 'text-green-400' : 'text-white'}`}>
                            {pair.secondMatch.AwayTeam}
                          </span>
                        </div>
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
  };

  // Sezondaki sürprizleri bulan fonksiyon
  const findSeasonSurprises = () => {
    if (!selectedLeague) return;
    
    setIsLoadingSeasonSurprises(true);
    setSeasonSurprises([]);
    
    setTimeout(() => {
      try {
        // Seçili sezon için maçları filtrele
        const season = seasons.find(s => s.id === selectedSeason);
        if (!season) return;

        const seasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return match.Div === selectedLeague &&
                 match.FTHG !== undefined && 
                 match.FTAG !== undefined &&
                 matchDate >= season.startDate && 
                 matchDate <= season.endDate;
        }).sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        // Sürpriz maçları bul
        const surprises = seasonMatches.filter(match => 
          (match.HTR === 'H' && match.FTR === 'A') || 
          (match.HTR === 'A' && match.FTR === 'H')
        ).map(match => {
          // Her sürpriz maç için önceki maçları bul
          const homeTeamPrevMatches = findPreviousMatches(seasonMatches, match, match.HomeTeam);
          const awayTeamPrevMatches = findPreviousMatches(seasonMatches, match, match.AwayTeam);

          // Ortak rakipleri bul
          const homeOpponents = homeTeamPrevMatches.map(m => 
            m.HomeTeam === match.HomeTeam ? m.AwayTeam : m.HomeTeam
          );
          const awayOpponents = awayTeamPrevMatches.map(m => 
            m.HomeTeam === match.AwayTeam ? m.AwayTeam : m.HomeTeam
          );
          const commonOpponents = homeOpponents.filter(team => 
            awayOpponents.includes(team)
          );

          return {
            match,
            previousMatches: [...homeTeamPrevMatches, ...awayTeamPrevMatches],
            commonOpponents
          };
        });

        setSeasonSurprises(surprises);
      } catch (error) {
        console.error('Sezon sürprizleri analizi hatası:', error);
      } finally {
        setIsLoadingSeasonSurprises(false);
      }
    }, 100);
  };

  // Rakip üçlülerini bulan ve kontrol eden fonksiyon
  const findRepeatingOpponentTriplets = (surprises: SeasonSurprise[]): string[][] => {
    // Her sürpriz maç için rakip üçlülerini bul
    const triplets = surprises.map(surprise => {
      const homeOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.HomeTeam)
        .map(m => m.HomeTeam === surprise.match.HomeTeam ? m.AwayTeam : m.HomeTeam);
      const awayOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.AwayTeam)
        .map(m => m.HomeTeam === surprise.match.AwayTeam ? m.AwayTeam : m.HomeTeam);
      
      return {
        homeTeam: surprise.match.HomeTeam,
        awayTeam: surprise.match.AwayTeam,
        homeTriplet: homeOpponents.sort(),
        awayTriplet: awayOpponents.sort()
      };
    });

    // Tekrar eden üçlüleri bul
    const tripletCounts = new Map<string, { count: number, triplet: string[] }>();
    
    triplets.forEach(({ homeTriplet, awayTriplet }) => {
      const homeTripletKey = homeTriplet.join('-');
      const awayTripletKey = awayTriplet.join('-');
      
      if (homeTriplet.length === 3) {
        if (!tripletCounts.has(homeTripletKey)) {
          tripletCounts.set(homeTripletKey, { count: 1, triplet: homeTriplet });
        } else {
          const current = tripletCounts.get(homeTripletKey)!;
          tripletCounts.set(homeTripletKey, { count: current.count + 1, triplet: current.triplet });
        }
      }
      
      if (awayTriplet.length === 3) {
        if (!tripletCounts.has(awayTripletKey)) {
          tripletCounts.set(awayTripletKey, { count: 1, triplet: awayTriplet });
        } else {
          const current = tripletCounts.get(awayTripletKey)!;
          tripletCounts.set(awayTripletKey, { count: current.count + 1, triplet: current.triplet });
        }
      }
    });

    // 2 veya daha fazla kez tekrar eden üçlüleri döndür
    return Array.from(tripletCounts.values())
      .filter(({ count }) => count >= 2)
      .map(({ triplet }) => triplet);
  };

  // Sezondaki Sürprizler görünümü
  const renderSeasonSurprises = () => {
    if (seasonSurprises.length === 0) {
      return (
        <div className="text-center text-gray-400 py-8">
          <button
            onClick={findSeasonSurprises}
            disabled={isLoadingSeasonSurprises}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
          >
            {isLoadingSeasonSurprises ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              'Sürprizleri Göster'
            )}
          </button>
        </div>
      );
    }

    const repeatingTriplets = findRepeatingOpponentTriplets(seasonSurprises);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            {selectedSeason} Sezonu Sürprizleri {seasonSurprises.length > 0 ? `(${seasonSurprises.length})` : ''}
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(e.target.value);
                setSelectedSurpriseMatches(new Set());
                setSeasonSurprises([]); // Listeyi temizle
              }}
              className="bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
            <button
              onClick={findSeasonSurprises}
              disabled={isLoadingSeasonSurprises}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
            >
              {isLoadingSeasonSurprises ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Yükleniyor...</span>
                </>
              ) : (
                'Göster'
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {seasonSurprises.map((surprise, index) => (
            <div
              key={index}
              onClick={() => {
                const newSelected = new Set(selectedSurpriseMatches);
                const matchKey = surprise.match.Date.toString();
                if (newSelected.has(matchKey)) {
                  newSelected.delete(matchKey);
                } else {
                  newSelected.add(matchKey);
                }
                setSelectedSurpriseMatches(newSelected);
              }}
              className={`
                bg-gray-800/50 rounded-lg p-4 cursor-pointer transition-all duration-200
                hover:bg-gray-700/50
                ${selectedSurpriseMatches.has(surprise.match.Date.toString()) ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-sm">{formatDate(surprise.match.Date)}</span>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 min-w-[180px] justify-end">
                  <span className={`font-medium ${surprise.match.FTR === 'H' ? 'text-green-400' : 'text-white'}`}>
                    {surprise.match.HomeTeam}
                  </span>
                  <TeamLogo name={surprise.match.HomeTeam} className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-center min-w-[100px]">
                  <span className="text-white font-bold">
                    {surprise.match.FTHG} - {surprise.match.FTAG}
                  </span>
                  <span className="text-gray-400 text-sm">
                    (İY: {surprise.match.HTHG}-{surprise.match.HTAG})
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-[180px]">
                  <TeamLogo name={surprise.match.AwayTeam} className="w-6 h-6" />
                  <span className={`font-medium ${surprise.match.FTR === 'A' ? 'text-green-400' : 'text-white'}`}>
                    {surprise.match.AwayTeam}
                  </span>
                </div>
              </div>

              {/* Ortak Rakipler */}
              {surprise.commonOpponents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {surprise.commonOpponents.map((opponent, idx) => (
                      <span key={idx} className="text-orange-400 text-sm">
                        {opponent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Seçili maçın önceki maçları */}
              {selectedSurpriseMatches.has(surprise.match.Date.toString()) && (
                <div className="mt-4 space-y-3">
                  {/* Ev Sahibi Son 3 Maç */}
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <TeamLogo name={surprise.match.HomeTeam} className="w-4 h-4" />
                      <span>{surprise.match.HomeTeam} Son 3 Maç:</span>
                    </div>
                    <div className="space-y-2">
                      {findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.HomeTeam).map((prevMatch, prevIndex) => {
                        const opponent = prevMatch.HomeTeam === surprise.match.HomeTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                        const isRepeatingOpponent = repeatingTriplets.some(triplet => triplet.includes(opponent));
                        
                        return (
                          <div key={prevIndex} className="grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm">
                            <span className="text-gray-500">{formatDate(prevMatch.Date)}</span>
                            <div className="flex items-center justify-end gap-2">
                              <span className={`
                                ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.HomeTeam === opponent ? 'text-orange-400' : ''}
                              `}>
                                {prevMatch.HomeTeam}
                              </span>
                              <TeamLogo name={prevMatch.HomeTeam} className="w-4 h-4" />
                            </div>
                            <div className="text-center font-medium text-gray-400">
                              {prevMatch.FTHG}-{prevMatch.FTAG}
                            </div>
                            <div className="flex items-center gap-2">
                              <TeamLogo name={prevMatch.AwayTeam} className="w-4 h-4" />
                              <span className={`
                                ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.AwayTeam === opponent ? 'text-orange-400' : ''}
                              `}>
                                {prevMatch.AwayTeam}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deplasman Son 3 Maç */}
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <TeamLogo name={surprise.match.AwayTeam} className="w-4 h-4" />
                      <span>{surprise.match.AwayTeam} Son 3 Maç:</span>
                    </div>
                    <div className="space-y-2">
                      {findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.AwayTeam).map((prevMatch, prevIndex) => {
                        const opponent = prevMatch.HomeTeam === surprise.match.AwayTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                        const isRepeatingOpponent = repeatingTriplets.some(triplet => triplet.includes(opponent));
                        
                        return (
                          <div key={prevIndex} className="grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm">
                            <span className="text-gray-500">{formatDate(prevMatch.Date)}</span>
                            <div className="flex items-center justify-end gap-2">
                              <span className={`
                                ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.HomeTeam === opponent ? 'text-orange-400' : ''}
                              `}>
                                {prevMatch.HomeTeam}
                              </span>
                              <TeamLogo name={prevMatch.HomeTeam} className="w-4 h-4" />
                            </div>
                            <div className="text-center font-medium text-gray-400">
                              {prevMatch.FTHG}-{prevMatch.FTAG}
                            </div>
                            <div className="flex items-center gap-2">
                              <TeamLogo name={prevMatch.AwayTeam} className="w-4 h-4" />
                              <span className={`
                                ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.AwayTeam === opponent ? 'text-orange-400' : ''}
                              `}>
                                {prevMatch.AwayTeam}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tekrar eden üçlüler varsa göster */}
        {repeatingTriplets.length > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">Tekrar Eden Rakip Üçlüleri:</span>
            </div>
            <div className="space-y-1">
              {repeatingTriplets.map((triplet, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-yellow-500">•</span>
                    {triplet.map((team, teamIndex) => (
                      <React.Fragment key={teamIndex}>
                        <TeamLogo name={team} className="w-4 h-4" />
                        <span>{team}</span>
                        {teamIndex < 2 && <span className="text-gray-500">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Bu üçlüyü içeren maçları bul
                      const matchesWithTriplet = seasonSurprises.filter(surprise => {
                        const homeOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.HomeTeam)
                          .map(m => m.HomeTeam === surprise.match.HomeTeam ? m.AwayTeam : m.HomeTeam);
                        const awayOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.AwayTeam)
                          .map(m => m.HomeTeam === surprise.match.AwayTeam ? m.AwayTeam : m.HomeTeam);
                        
                        // Üçlünün tamamı ev sahibi veya deplasman takımının son 3 maçında var mı?
                        const homeHasAll = triplet.every(team => homeOpponents.includes(team));
                        const awayHasAll = triplet.every(team => awayOpponents.includes(team));
                        
                        return homeHasAll || awayHasAll;
                      });
                      
                      // İlgili maçları seç
                      const newSelected = new Set(selectedSurpriseMatches);
                      matchesWithTriplet.forEach(match => {
                        newSelected.add(match.match.Date.toString());
                      });
                      setSelectedSurpriseMatches(newSelected);
                    }}
                    className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                  >
                    Göster
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Kendi Üçlün analizi
  const findTeamsWithCustomTriplet = () => {
    console.log('findTeamsWithCustomTriplet başladı');
    console.log('selectedLeague:', selectedLeague);
    console.log('selectedOpponents:', selectedOpponents);
    
    if (!selectedLeague || selectedOpponents.length < 2) {
      console.log('Gerekli seçimler eksik. Fonksiyon sonlandı.');
      return;
    }
    
    const results: {
      season: string;
      team: string;
      opponent: string;
      match: Match;
      matchingOpponents: string[];
    }[] = [];

    // Her sezon için kontrol et
    seasons.forEach(season => {
      console.log(`${season.name} sezonu analiz ediliyor...`);
      
      // Sezon maçlarını filtrele
      const seasonMatches = matchData.filter(match => {
        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
        return match.Div === selectedLeague &&
               matchDate >= season.startDate && 
               matchDate <= season.endDate;
      });
      
      console.log(`${season.name} sezonu için ${seasonMatches.length} maç bulundu`);

      // Her takım için kontrol et
      const teams = Array.from(new Set(seasonMatches.map(m => [m.HomeTeam, m.AwayTeam]).flat()));
      console.log(`${teams.length} takım analiz edilecek`);
      
      teams.forEach(team => {
        // Takımın sürpriz maçlarını bul
        const surpriseMatches = seasonMatches.filter(match => {
          const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                            (match.HTR === 'A' && match.FTR === 'H');
          const involvesTeam = match.HomeTeam === team || match.AwayTeam === team;
          return isSurprise && involvesTeam;
        });

        console.log(`${team} takımı için ${surpriseMatches.length} sürpriz maç bulundu`);

        // Her sürpriz maç için son 3 maçı kontrol et
        surpriseMatches.forEach(match => {
          const previousMatches = findPreviousMatches(seasonMatches, match, 
            match.HomeTeam === team ? match.HomeTeam : match.AwayTeam);
          
          console.log(`Sürpriz maç için ${previousMatches.length} önceki maç bulundu`);
          
          // Son 3 maçtaki rakipleri bul
          const lastOpponents = previousMatches.map(m => 
            m.HomeTeam === team ? m.AwayTeam : m.HomeTeam
          );

          console.log('Son rakipler:', lastOpponents);
          
          // Seçilen rakiplerden kaçı son 3 maçta var
          const matchingOpponents = selectedOpponents.filter(opponent => 
            lastOpponents.includes(opponent)
          );

          console.log('Eşleşen rakipler:', matchingOpponents);

          // En az 2 rakip eşleşiyorsa ekle
          if (matchingOpponents.length >= 2) {
            console.log('Eşleşme bulundu! Sonuçlara ekleniyor...');
            results.push({
              season: season.name,
              team: team,
              opponent: match.HomeTeam === team ? match.AwayTeam : match.HomeTeam,
              match: match,
              matchingOpponents
            });
          }
        });
      });
    });

    console.log('Analiz tamamlandı. Bulunan sonuçlar:', results);
    setCustomTripletResults(results);
  };

  // Kendi Üçlün görünümü
  const renderCustomTriplet = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rakip Seçimi (3 takım seçin)
            </label>
            <select
              value=""
              onChange={(e) => {
                if (selectedOpponents.length < 3 && !selectedOpponents.includes(e.target.value)) {
                  setSelectedOpponents([...selectedOpponents, e.target.value]);
                }
              }}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Rakip Seçin</option>
              {teams && teams.length > 0 && teams.filter(team => !selectedOpponents.includes(team)).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
          <button
            onClick={findTeamsWithCustomTriplet}
            data-auto-custom
            disabled={selectedOpponents.length !== 3}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Analiz Et
          </button>
        </div>

        {/* Seçilen rakipler */}
        {selectedOpponents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedOpponents.map((opponent, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2"
              >
                <TeamLogo name={opponent} className="w-5 h-5" />
                <span className="text-white">{opponent}</span>
                <button
                  onClick={() => {
                    setSelectedOpponents(selectedOpponents.filter(t => t !== opponent));
                    setCustomTripletResults([]);
                  }}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Sonuçlar */}
        {customTripletResults.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Bulunan Sonuçlar ({customTripletResults.length})
            </h3>
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-900 to-purple-900">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Sezon</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Takım</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rakip</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Eşleşen Rakipler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {customTripletResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-gray-300">{result.season}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TeamLogo name={result.team} className="w-5 h-5" />
                          <span className="text-white">{result.team}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TeamLogo name={result.opponent} className="w-5 h-5" />
                          <span className="text-white">{result.opponent}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {result.matchingOpponents.map((opponent, i) => (
                            <span key={i} className={`text-sm ${result.matchingOpponents.length === 2 ? 'text-orange-400' : 'text-white'}`}>
                              {opponent}{i < result.matchingOpponents.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedOpponents.length >= 2 && (
          <div className="mt-6 text-center text-gray-400 py-8">
            Seçilen rakiplerle eşleşen sonuç bulunamadı
          </div>
        )}
      </div>
    );
  };

  // Benzerlik analizi fonksiyonu
  const analyzeSimilarity = (match1: Match, match2: Match, season1Matches: Match[], season2Matches: Match[]): {
    similarity: number;
    matchType: 'exact' | 'lastMatch' | 'partial' | 'none';
    details: string[];
  } => {
    // Son 3 maçı bul
    const team1 = match1.HomeTeam;
    const team2 = match2.HomeTeam;
    
    const team1Last3 = findPreviousMatches(season1Matches, match1, team1).slice(0, 3);
    const team1AwayLast3 = findPreviousMatches(season1Matches, match1, match1.AwayTeam).slice(0, 3);
    const team2Last3 = findPreviousMatches(season2Matches, match2, team2).slice(0, 3);
    const team2AwayLast3 = findPreviousMatches(season2Matches, match2, match2.AwayTeam).slice(0, 3);

    // Skorları al
    const getScores = (matches: Match[]): string[] => {
      return matches.map(m => `${m.FTHG}-${m.FTAG}`);
    };

    const team1Scores = getScores(team1Last3);
    const team1AwayScores = getScores(team1AwayLast3);
    const team2Scores = getScores(team2Last3);
    const team2AwayScores = getScores(team2AwayLast3);

    // Tam eşleşme kontrolü (son 3 maç)
    const isExactMatch = (scores1: string[], scores2: string[]): boolean => {
      if (scores1.length < 3 || scores2.length < 3) return false;
      return scores1.every((score, index) => score === scores2[index]);
    };

    // Son maç eşleşme kontrolü
    const isLastMatchEqual = (scores1: string[], scores2: string[]): boolean => {
      if (scores1.length === 0 || scores2.length === 0) return false;
      return scores1[0] === scores2[0];
    };

    // Genel benzerlik kontrolü
    const calculateScoreSimilarity = (scores1: string[], scores2: string[]): number => {
      let matchingScores = 0;
      const minLength = Math.min(scores1.length, scores2.length);
      
      for (let i = 0; i < minLength; i++) {
        if (scores1[i] === scores2[i]) matchingScores++;
      }
      
      return (matchingScores / minLength) * 100;
    };

    // Tüm kombinasyonları kontrol et
    const combinations = [
      { scores1: team1Scores, scores2: team2Scores },
      { scores1: team1Scores, scores2: team2AwayScores },
      { scores1: team1AwayScores, scores2: team2Scores },
      { scores1: team1AwayScores, scores2: team2AwayScores }
    ];

    // En iyi eşleşmeyi bul
    let bestMatch = {
      similarity: 0,
      matchType: 'none' as 'exact' | 'lastMatch' | 'partial' | 'none',
      details: [] as string[]
    };

    for (const { scores1, scores2 } of combinations) {
      if (isExactMatch(scores1, scores2)) {
        bestMatch = {
          similarity: 100,
          matchType: 'exact',
          details: ['Son 3 maçın skorları birebir aynı']
        };
        break;
      } else if (isLastMatchEqual(scores1, scores2)) {
        bestMatch = {
          similarity: 80,
          matchType: 'lastMatch',
          details: ['Son maçın skoru aynı']
        };
      } else {
        const similarity = calculateScoreSimilarity(scores1, scores2);
        if (similarity >= 60 && similarity > bestMatch.similarity) {
          bestMatch = {
            similarity,
            matchType: 'partial',
            details: [`Skorlarda ${similarity.toFixed(1)}% benzerlik`]
          };
        }
      }
    }

    return bestMatch;
  };

  const renderSimilarMatches = () => {
    const highSimilarityMatches = similarMatches.filter(m => m.similarity === 100);
    const mediumSimilarityMatches = similarMatches.filter(m => m.similarity === 80);
    const lowSimilarityMatches = similarMatches.filter(m => m.similarity >= 60 && m.similarity < 80);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Benzer Maçlar {similarMatches.length > 0 ? `(${similarMatches.length})` : ''}
          </h3>
          <button
            onClick={findSimilarMatches}
            disabled={isLoadingSimilar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            {isLoadingSimilar ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              'Benzer Maçları Bul'
            )}
          </button>
        </div>

        {similarMatches.length > 0 ? (
          <div className="space-y-4">
            {/* Tam Eşleşmeler */}
            {highSimilarityMatches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-green-400 font-medium">%100 Benzerlik</h4>
                {highSimilarityMatches.map((result, index) => (
                  <div key={index} className="bg-gray-800 border-l-4 border-green-500 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white">
                          {result.match.HomeTeam} vs {result.match.AwayTeam}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {LEAGUE_NAMES[result.match.Div]} ({new Date((Number(result.match.Date) - 25569) * 86400 * 1000).toLocaleDateString()})
                        </div>
                      </div>
                      <div className="text-green-400 font-medium">
                        {result.match.FTHG}-{result.match.FTAG}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-green-400">
                      {result.commonPatterns.join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Son Maç Eşleşmeleri */}
            {mediumSimilarityMatches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-orange-400 font-medium">%80 Benzerlik</h4>
                {mediumSimilarityMatches.map((result, index) => (
                  <div key={index} className="bg-gray-800 border-l-4 border-orange-500 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white">
                          {result.match.HomeTeam} vs {result.match.AwayTeam}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {LEAGUE_NAMES[result.match.Div]} ({new Date((Number(result.match.Date) - 25569) * 86400 * 1000).toLocaleDateString()})
                        </div>
                      </div>
                      <div className="text-orange-400 font-medium">
                        {result.match.FTHG}-{result.match.FTAG}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-orange-400">
                      {result.commonPatterns.join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Kısmi Eşleşmeler */}
            {lowSimilarityMatches.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-yellow-400 font-medium">%60-%79 Benzerlik</h4>
                {lowSimilarityMatches.map((result, index) => (
                  <div key={index} className="bg-gray-800 border-l-4 border-yellow-500 rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white">
                          {result.match.HomeTeam} vs {result.match.AwayTeam}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {LEAGUE_NAMES[result.match.Div]} ({new Date((Number(result.match.Date) - 25569) * 86400 * 1000).toLocaleDateString()})
                        </div>
                      </div>
                      <div className="text-yellow-400 font-medium">
                        {result.match.FTHG}-{result.match.FTAG}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-yellow-400">
                      {result.commonPatterns.join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : !isLoadingSimilar ? (
          <p className="text-gray-400">Benzer maç bulunamadı.</p>
        ) : null}
      </div>
    );
  };

  // Sürpriz maç seçimi için click handler'ı güncelle
  const handleSurpriseMatchSelection = (match: Match) => {
    console.log('Sürpriz maç seçildi:', match);
    setSelectedSurpriseMatch(match);
    setSimilarMatches([]); // Önceki sonuçları temizle
  };

  // Benzerlik analizi fonksiyonu
  const findSimilarMatches = () => {
    console.log('Analiz başlıyor, seçili maç:', selectedSurpriseMatch);
    
    if (!selectedSurpriseMatch) {
      console.error('Seçili sürpriz maç bulunamadı');
      return;
    }

    setIsLoadingSimilar(true);
    setSimilarMatches([]); // Önceki sonuçları temizle

    setTimeout(() => {
      try {
        const similarResults: {
          match: Match;
          similarity: number;
          commonPatterns: string[];
          matchingTeam?: string;
          matchingScores?: string[];
          isPartialMatch?: boolean;
        }[] = [];

        // Seçili maçın sezonunu bul
        const selectedMatchDate = new Date((Number(selectedSurpriseMatch.Date) - 25569) * 86400 * 1000);
        const selectedSeason = seasons.find(s => 
          selectedMatchDate >= s.startDate && selectedMatchDate <= s.endDate
        );

        if (!selectedSeason) {
          console.error('Seçili maçın sezonu bulunamadı');
          return;
        }

        // Debug için sezon bilgilerini yazdır
        console.log('Seçili sezon:', {
          id: selectedSeason.id,
          startDate: selectedSeason.startDate,
          endDate: selectedSeason.endDate
        });

        // Seçili maçın sezon maçlarını bul
        const selectedSeasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= selectedSeason.startDate && 
                 matchDate <= selectedSeason.endDate &&
                 match.Div === selectedSurpriseMatch.Div;
        }).sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        console.log('Analiz başlıyor:', {
          selectedMatch: selectedSurpriseMatch,
          selectedSeason,
          selectedSeasonMatches: selectedSeasonMatches.length
        });

        // Tüm ligler ve sezonlar üzerinde döngü
        let processedMatches = 0;
        Object.keys(LEAGUE_NAMES).forEach(leagueId => {
          const leagueMatches = matchData.filter(m => m.Div === leagueId);
          
          seasons.forEach(season => {
            const seasonMatches = leagueMatches.filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              return matchDate >= season.startDate && matchDate <= season.endDate;
            }).sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateA.getTime() - dateB.getTime();
            });

            // Sürpriz maçları bul
            const surprises = seasonMatches.filter(match =>
              (match.HTR === 'H' && match.FTR === 'A') ||
              (match.HTR === 'A' && match.FTR === 'H')
            );

            // Her sürpriz maç için benzerlik analizi yap
            surprises.forEach(match => {
              processedMatches++;
              // Kendisi ile karşılaştırma yapma
              if (match === selectedSurpriseMatch) return;

              const similarity = analyzeSimilarity(
                selectedSurpriseMatch,
                match,
                selectedSeasonMatches,
                seasonMatches
              );

              if (similarity.similarity >= 60) {
                // Hangi takımın skorları eşleşti onu bul
                const getScorePattern = (matches: Match[], team: string): string[] => {
                  return matches.map(m => {
                    if (m.HomeTeam === team) {
                      return `${m.FTHG}-${m.FTAG}`;
                    } else {
                      return `${m.FTAG}-${m.FTHG}`;
                    }
                  });
                };

                const team1HomeLast3 = findPreviousMatches(selectedSeasonMatches, selectedSurpriseMatch, selectedSurpriseMatch.HomeTeam);
                const team1AwayLast3 = findPreviousMatches(selectedSeasonMatches, selectedSurpriseMatch, selectedSurpriseMatch.AwayTeam);
                const team2HomeLast3 = findPreviousMatches(seasonMatches, match, match.HomeTeam);
                const team2AwayLast3 = findPreviousMatches(seasonMatches, match, match.AwayTeam);

                const team1HomeScores = getScorePattern(team1HomeLast3, selectedSurpriseMatch.HomeTeam);
                const team1AwayScores = getScorePattern(team1AwayLast3, selectedSurpriseMatch.AwayTeam);
                const team2HomeScores = getScorePattern(team2HomeLast3, match.HomeTeam);
                const team2AwayScores = getScorePattern(team2AwayLast3, match.AwayTeam);

                let matchingTeam = '';
                let matchingScores: string[] = [];

                if (JSON.stringify(team1HomeScores) === JSON.stringify(team2HomeScores)) {
                  matchingTeam = `${selectedSurpriseMatch.HomeTeam} ve ${match.HomeTeam}`;
                  matchingScores = team1HomeScores;
                } else if (JSON.stringify(team1HomeScores) === JSON.stringify(team2AwayScores)) {
                  matchingTeam = `${selectedSurpriseMatch.HomeTeam} ve ${match.AwayTeam}`;
                  matchingScores = team1HomeScores;
                } else if (JSON.stringify(team1AwayScores) === JSON.stringify(team2HomeScores)) {
                  matchingTeam = `${selectedSurpriseMatch.AwayTeam} ve ${match.HomeTeam}`;
                  matchingScores = team1AwayScores;
                } else if (JSON.stringify(team1AwayScores) === JSON.stringify(team2AwayScores)) {
                  matchingTeam = `${selectedSurpriseMatch.AwayTeam} ve ${match.AwayTeam}`;
                  matchingScores = team1AwayScores;
                }

                similarResults.push({
                  match,
                  similarity: similarity.similarity,
                  commonPatterns: [
                    similarity.similarity >= 80 ? 'Birebir Skor Eşleşmesi' : 'Kısmi Skor Eşleşmesi',
                    `Eşleşen Takımlar: ${matchingTeam}`,
                    `Son 3 Maç Skorları: ${matchingScores.join(', ')}`
                  ],
                  matchingTeam,
                  matchingScores,
                  isPartialMatch: similarity.similarity < 80
                });
              }
            });
          });
        });

        console.log(`Toplam ${processedMatches} maç analiz edildi`);
        
        // Sonuçları benzerlik oranına göre sırala
        similarResults.sort((a, b) => b.similarity - a.similarity);
        console.log(`${similarResults.length} benzer maç bulundu`);
        
        setSimilarMatches(similarResults);
      } catch (error) {
        console.error('Benzerlik analizi hatası:', error);
      } finally {
        setIsLoadingSimilar(false);
      }
    }, 0);
  };

  

  // Köprü analizi yapan fonksiyon
  const findBridgePatterns = () => {
    if (!selectedTeamA || !selectedTeamZ) return;
    
    setIsLoadingBridge(true);
    setBridgeResults([]);

    setTimeout(() => {
      try {
        const results: typeof bridgeResults = [];

        // Mevcut sezonu bul
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        if (!currentSeason) return;

        // Mevcut sezonda A takımının son maçını ve rakibini bul
        const currentSeasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= currentSeason.startDate && matchDate <= currentSeason.endDate;
        }).sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateB.getTime() - dateA.getTime(); // En son maç başta olsun
        });

        // A takımının son maçını bul
        const lastMatchOfA = currentSeasonMatches.find(match => 
          match.HomeTeam === selectedTeamA || match.AwayTeam === selectedTeamA
        );

        if (!lastMatchOfA) return;

        // A'nın son rakibini bul (X takımı)
        const teamX = lastMatchOfA.HomeTeam === selectedTeamA ? 
                     lastMatchOfA.AwayTeam : 
                     lastMatchOfA.HomeTeam;

        // Her sezon için analiz yap (mevcut sezon hariç)
        seasons.forEach(season => {
          if (season.id === currentSeason.id) return; // Mevcut sezonu atla

          const seasonResult: {
            season: string;
            pattern: typeof bridgeResults[0]['pattern'];
            currentPattern?: typeof bridgeResults[0]['currentPattern'];
          } = {
            season: season.name,
            pattern: []
          };

          // Sezon maçlarını filtrele ve tarihe göre sırala
          const seasonMatches = matchData.filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= season.startDate && matchDate <= season.endDate;
          }).sort((a, b) => {
            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
            return dateA.getTime() - dateB.getTime();
          });

          // Z takımının sürpriz maçlarını bul
          const zSurprises = seasonMatches.filter(match => {
            const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                              (match.HTR === 'A' && match.FTR === 'H');
            const involvesZ = match.HomeTeam === selectedTeamZ || 
                             match.AwayTeam === selectedTeamZ;
            return isSurprise && involvesZ;
          });

          // Her sürpriz maç için
          zSurprises.forEach(surpriseMatch => {
            // Y takımını bul (Z'yi yenen takım)
            const teamY = surpriseMatch.HomeTeam === selectedTeamZ ? 
                         surpriseMatch.AwayTeam : 
                         surpriseMatch.HomeTeam;

            // Y takımının sürpriz maçtan önceki son maçını bul
            const previousMatchOfY = seasonMatches.filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
              const isBeforeSurprise = matchDate < surpriseDate;
              const involvesY = match.HomeTeam === teamY || match.AwayTeam === teamY;
              return isBeforeSurprise && involvesY;
            }).pop(); // Son maçı al

            if (previousMatchOfY) {
              // Y'nin rakibini bul (X takımı)
              const previousX = previousMatchOfY.HomeTeam === teamY ? 
                              previousMatchOfY.AwayTeam : 
                              previousMatchOfY.HomeTeam;

              // Eğer bu X takımı, mevcut sezonda A'nın son rakibiyse
              if (previousX === teamX) {
                // X → Y → Z paternini ekle
                seasonResult.pattern.push({
                  teamX: previousX,
                  teamY,
                  teamZ: selectedTeamZ,
                  firstMatch: previousMatchOfY,
                  surpriseMatch
                });

                // A → Z arasında henüz oynanmamış maç var mı?
                const potentialAZMatch = currentSeasonMatches.find(match => 
                  (match.HomeTeam === selectedTeamA && match.AwayTeam === selectedTeamZ) ||
                  (match.HomeTeam === selectedTeamZ && match.AwayTeam === selectedTeamA)
                );

                seasonResult.currentPattern = {
                  teamX,
                  teamA: selectedTeamA,
                  teamZ: selectedTeamZ,
                  firstMatch: lastMatchOfA,
                  potentialMatch: potentialAZMatch
                };
              }
            }
          });

          if (seasonResult.pattern.length > 0) {
            results.push(seasonResult);
          }
        });

        setBridgeResults(results);
      } catch (error) {
        console.error('Köprü analizi hatası:', error);
      } finally {
        setIsLoadingBridge(false);
      }
    }, 100);
  };

  // Köprü modu görünümü
  const renderBridgeMode = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {/* A Takımı Seçimi */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              A Takımı (Köprü)
            </label>
            <select
              value={selectedTeamA}
              onChange={(e) => {
                setSelectedTeamA(e.target.value);
                setBridgeResults([]);
              }}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Takım Seçin</option>
              {teams.filter(team => team !== selectedTeamZ).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {/* Z Takımı Seçimi */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Z Takımı (Hedef)
            </label>
            <select
              value={selectedTeamZ}
              onChange={(e) => {
                setSelectedTeamZ(e.target.value);
                setBridgeResults([]);
              }}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Takım Seçin</option>
              {teams.filter(team => team !== selectedTeamA).map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <button
            onClick={findBridgePatterns}
            data-auto-bridge
            disabled={!selectedTeamA || !selectedTeamZ || isLoadingBridge}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded h-[42px] mt-8 disabled:opacity-50 min-w-[120px]"
          >
            {isLoadingBridge ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analiz...</span>
              </div>
            ) : (
              'Analiz Et'
            )}
          </button>
        </div>

        {/* Sonuçlar */}
        {bridgeResults.length > 0 ? (
          <div className="space-y-4">
            {bridgeResults.map((result, index) => {
              const seasonKey = `season-${result.season}`;
              const isSeasonExpanded = expandedSeasons.includes(seasonKey);

              return (
                <div key={index} className="bg-gray-800/50 rounded-lg overflow-hidden">
                  {/* Sezon Başlığı - Tıklanabilir */}
                  <div
                    onClick={() => {
                      const newExpanded = isSeasonExpanded
                        ? expandedSeasons.filter(s => s !== seasonKey)
                        : [...expandedSeasons, seasonKey];
                      setExpandedSeasons(newExpanded);
                    }}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {result.season} Sezonu
                    </h3>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        isSeasonExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Sezon İçeriği */}
                  {isSeasonExpanded && (
                    <div className="p-4 space-y-6">
                      {/* Geçmiş Paternler */}
                      {result.pattern.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-md font-medium text-gray-300">
                            Bulunan X → Y → Z Paternleri:
                          </h4>
                          {result.pattern.map((p, pIndex) => {
                            const patternKey = `pattern-${result.season}-${pIndex}`;
                            const isPatternExpanded = expandedPatterns.includes(patternKey);

                            return (
                              <div key={pIndex} className="bg-gray-700/30 rounded-lg overflow-hidden">
                                {/* Pattern Başlığı - Tıklanabilir */}
                                <div
                                  onClick={() => {
                                    const newExpanded = isPatternExpanded
                                      ? expandedPatterns.filter(p => p !== patternKey)
                                      : [...expandedPatterns, patternKey];
                                    setExpandedPatterns(newExpanded);
                                  }}
                                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-600/50"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <TeamLogo name={p.teamX} className="w-5 h-5" />
                                      <span className="text-gray-300">{p.teamX}</span>
                                    </div>
                                    <span className="text-gray-500">→</span>
                                    <div className="flex items-center gap-2">
                                      <TeamLogo name={p.teamY} className="w-5 h-5" />
                                      <span className="text-gray-300">{p.teamY}</span>
                                    </div>
                                    <span className="text-gray-500">→</span>
                                    <div className="flex items-center gap-2">
                                      <TeamLogo name={p.teamZ} className="w-5 h-5" />
                                      <span className="text-orange-400">{p.teamZ}</span>
                                    </div>
                                  </div>
                                  <svg
                                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                                      isPatternExpanded ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>

                                {/* Pattern Detayları */}
                                {isPatternExpanded && (
                                  <div className="p-4 space-y-4">
                                    <div className="flex items-center justify-center gap-8">
                                      {/* X → Y Maçı */}
                                      <div className="flex-1">
                                        <div className="text-sm text-gray-400 mb-2">
                                          {formatDate(p.firstMatch.Date)}
                                        </div>
                                        <div className="flex items-center justify-center gap-4">
                                          <div className="flex items-center gap-2">
                                            <span className="text-white">{p.firstMatch.HomeTeam}</span>
                                            <TeamLogo name={p.firstMatch.HomeTeam} className="w-6 h-6" />
                                          </div>
                                          <div className="flex flex-col items-center">
                                            <span className="text-white font-bold">
                                              {p.firstMatch.FTHG} - {p.firstMatch.FTAG}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                              (İY: {p.firstMatch.HTHG}-{p.firstMatch.HTAG})
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <TeamLogo name={p.firstMatch.AwayTeam} className="w-6 h-6" />
                                            <span className="text-white">{p.firstMatch.AwayTeam}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Bağlantı Oku */}
                                      <div className="flex items-center text-gray-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                      </div>

                                      {/* Y → Z Sürpriz Maçı */}
                                      <div className="flex-1">
                                        <div className="text-sm text-gray-400 mb-2">
                                          {formatDate(p.surpriseMatch.Date)}
                                        </div>
                                        <div className="flex items-center justify-center gap-4">
                                          <div className="flex items-center gap-2">
                                            <span className="text-white">{p.surpriseMatch.HomeTeam}</span>
                                            <TeamLogo name={p.surpriseMatch.HomeTeam} className="w-6 h-6" />
                                          </div>
                                          <div className="flex flex-col items-center">
                                            <span className="text-white font-bold">
                                              {p.surpriseMatch.FTHG} - {p.surpriseMatch.FTAG}
                                            </span>
                                            <span className="text-sm text-gray-400">
                                              (İY: {p.surpriseMatch.HTHG}-{p.surpriseMatch.HTAG})
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <TeamLogo name={p.surpriseMatch.AwayTeam} className="w-6 h-6" />
                                            <span className="text-white">{p.surpriseMatch.AwayTeam}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Karşılık Gelen X → A → Z Paterni */}
                                    {result.currentPattern && (
                                      <div className="mt-6 pt-6 border-t border-gray-600">
                                        <div className="text-sm font-medium text-blue-400 mb-4">
                                          Karşılık Gelen X → A → Z Paterni:
                                        </div>
                                        <div className="flex items-center justify-center gap-8">
                                          {/* X → A Maçı */}
                                          <div className="flex-1">
                                            <div className="text-sm text-gray-400 mb-2">
                                              {formatDate(result.currentPattern.firstMatch.Date)}
                                            </div>
                                            <div className="flex items-center justify-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <span className="text-white">{result.currentPattern.firstMatch.HomeTeam}</span>
                                                <TeamLogo name={result.currentPattern.firstMatch.HomeTeam} className="w-6 h-6" />
                                              </div>
                                              <div className="flex flex-col items-center">
                                                <span className="text-white font-bold">
                                                  {result.currentPattern.firstMatch.FTHG} - {result.currentPattern.firstMatch.FTAG}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                  (İY: {result.currentPattern.firstMatch.HTHG}-{result.currentPattern.firstMatch.HTAG})
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <TeamLogo name={result.currentPattern.firstMatch.AwayTeam} className="w-6 h-6" />
                                                <span className="text-white">{result.currentPattern.firstMatch.AwayTeam}</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Bağlantı Oku */}
                                          <div className="flex items-center text-gray-500">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                          </div>

                                          {/* A → Z Potansiyel Maç */}
                                          <div className="flex-1">
                                            {result.currentPattern.potentialMatch ? (
                                              <>
                                                <div className="text-sm text-gray-400 mb-2">
                                                  {formatDate(result.currentPattern.potentialMatch.Date)}
                                                </div>
                                                <div className="flex items-center justify-center gap-4">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-white">{result.currentPattern.potentialMatch.HomeTeam}</span>
                                                    <TeamLogo name={result.currentPattern.potentialMatch.HomeTeam} className="w-6 h-6" />
                                                  </div>
                                                  <div className="flex flex-col items-center">
                                                    <span className="text-white font-bold">vs</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <TeamLogo name={result.currentPattern.potentialMatch.AwayTeam} className="w-6 h-6" />
                                                    <span className="text-white">{result.currentPattern.potentialMatch.AwayTeam}</span>
                                                  </div>
                                                </div>
                                              </>
                                            ) : (
                                              <div className="text-center text-gray-400">
                                                Henüz maç planlanmamış
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Takım Zinciri */}
                                        <div className="flex items-center justify-center gap-4 mt-4">
                                          <div className="flex items-center gap-2">
                                            <TeamLogo name={result.currentPattern.teamX} className="w-5 h-5" />
                                            <span className="text-gray-300">{result.currentPattern.teamX}</span>
                                          </div>
                                          <span className="text-gray-500">→</span>
                                          <div className="flex items-center gap-2">
                                            <TeamLogo name={result.currentPattern.teamA} className="w-5 h-5" />
                                            <span className="text-blue-400">{result.currentPattern.teamA}</span>
                                          </div>
                                          <span className="text-gray-500">→</span>
                                          <div className="flex items-center gap-2">
                                            <TeamLogo name={result.currentPattern.teamZ} className="w-5 h-5" />
                                            <span className="text-orange-400">{result.currentPattern.teamZ}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : !isLoadingBridge && selectedTeamA && selectedTeamZ && (
          <div className="text-center text-gray-400 py-8">
            Eşleşen patern bulunamadı
          </div>
        )}
      </div>
    );
  };

  // Otomatik hesaplama fonksiyonları
  const startAutoCalculation = () => {
    setShowTeamSelectionModal(true);
  };

  const handleTeamSelection = () => {
    if (!autoSelectedTeam1 || !autoSelectedTeam2) return;
    
    setShowTeamSelectionModal(false);
    setIsAutoCalculating(true);
    setCurrentAutoStep('bridge');
    setActiveTab('bridge');
    
    // Köprü analizi başlat
    setSelectedTeamA(autoSelectedTeam1);
    setSelectedTeamZ(autoSelectedTeam2);
    setTimeout(() => {
      // Köprü analizi butonuna tıkla
      const bridgeButton = document.querySelector('button[data-auto-bridge]') as HTMLButtonElement;
      if (bridgeButton) bridgeButton.click();
      setShowContinueButton(true);
    }, 500);
  };

  const continueToNextStep = () => {
    setShowContinueButton(false);
    
    if (currentAutoStep === 'bridge') {
      setCurrentAutoStep('similar');
      setActiveTab('similar');
      setAnalysisMode('prediction');
      setSelectedHomeTeam(autoSelectedTeam1);
      setSelectedAwayTeam(autoSelectedTeam2);
      setTimeout(() => {
        // Benzer maçlar butonuna tıkla
        const similarButton = document.querySelector('button[data-auto-similar]') as HTMLButtonElement;
        if (similarButton) similarButton.click();
        setShowContinueButton(true);
      }, 500);
    } 
    else if (currentAutoStep === 'similar') {
      setCurrentAutoStep('custom1');
      setActiveTab('custom');
      // İlk takımın son 3 rakibini bul
      const team1LastOpponents = findLastThreeOpponents(autoSelectedTeam1);
      setSelectedOpponents(team1LastOpponents);
      setTimeout(() => {
        // Kendi üçlün analiz butonuna tıkla
        const customButton = document.querySelector('button[data-auto-custom]') as HTMLButtonElement;
        if (customButton) customButton.click();
        setShowContinueButton(true);
      }, 500);
    }
    else if (currentAutoStep === 'custom1') {
      setCurrentAutoStep('custom2');
      setActiveTab('custom');
      // İkinci takımın son 3 rakibini bul
      const team2LastOpponents = findLastThreeOpponents(autoSelectedTeam2);
      setSelectedOpponents(team2LastOpponents);
      setTimeout(() => {
        // Kendi üçlün analiz butonuna tıkla
        const customButton = document.querySelector('button[data-auto-custom]') as HTMLButtonElement;
        if (customButton) customButton.click();
        setShowContinueButton(true);
      }, 500);
    }
    else {
      // Hesaplama bitti
      setIsAutoCalculating(false);
      setCurrentAutoStep(null);
      setShowContinueButton(false);
    }
  };

  const findLastThreeOpponents = (team: string): string[] => {
    const season = seasons.find(s => s.id === selectedSeason);
    if (!season) return [];

    const seasonMatches = matchData
      .filter(match => {
        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
        return match.Div === selectedLeague &&
               matchDate >= season.startDate && 
               matchDate <= season.endDate &&
               (match.HomeTeam === team || match.AwayTeam === team);
      })
      .sort((a, b) => {
        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 3)
      .map(match => match.HomeTeam === team ? match.AwayTeam : match.HomeTeam);

    return seasonMatches;
  };

  // Sürpriz maç rakiplerinin benzerliğini kontrol et
  const analyzeSurpriseOpponents = () => {
    const currentSeasonSurprises = filteredMatches.filter(match => {
      const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
      const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
      return isHomeToAwaySurprise || isAwayToHomeSurprise;
    });

    // Sürpriz maçlardaki rakipleri al
    const currentSurpriseOpponents = currentSeasonSurprises.map(match => 
      match.HomeTeam === selectedTeam ? match.AwayTeam : match.HomeTeam
    );

    const similarityResults: {team: string; season: string; similarity: number}[] = [];

    // Diğer sezonları kontrol et
    seasons.forEach(season => {
      if (season.id === selectedSeason) return; // Mevcut sezonu atla

      // Ligdeki tüm takımları kontrol et
      const allTeamsInSeason = new Set(
        matchData
          .filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= season.startDate && 
                   matchDate <= season.endDate && 
                   match.Div === selectedLeague;
          })
          .flatMap(match => [match.HomeTeam, match.AwayTeam])
      );

      allTeamsInSeason.forEach(team => {
        // Takımın o sezondaki sürpriz maçlarını bul
        const teamSurprises = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
          const isTeamMatch = match.HomeTeam === team || match.AwayTeam === team;
          const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A';
          const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H';
          return isInSeason && isTeamMatch && (isHomeToAwaySurprise || isAwayToHomeSurprise);
        });

        // Sürpriz maçlardaki rakipleri al
        const teamSurpriseOpponents = teamSurprises.map(match =>
          match.HomeTeam === team ? match.AwayTeam : match.HomeTeam
        );

        // Rakip benzerliğini hesapla
        if (currentSurpriseOpponents.length > 0 && teamSurpriseOpponents.length > 0) {
          let matchingOpponents = 0;
          currentSurpriseOpponents.forEach(opponent => {
            if (teamSurpriseOpponents.includes(opponent)) {
              matchingOpponents++;
            }
          });

          const similarity = (matchingOpponents / Math.max(currentSurpriseOpponents.length, teamSurpriseOpponents.length)) * 100;
          
          if (similarity >= 80) {
            similarityResults.push({
              team,
              season: season.id,
              similarity
            });
          }
        }
      });
    });

    setSurpriseTeamSimilarity(similarityResults);
  };

  // Analiz fonksiyonunu güncelle
  const analyzeScheduleSimilarity = async () => {
    setIsAnalyzingSchedule(true);
    analyzeSurpriseOpponents(); // Sürpriz rakip analizini çağır
    const currentSeasonMatches = filteredMatches;
    const results: ScheduleSimilarity[] = [];

    try {
      // Tüm sezonları kontrol et (seçili sezon hariç)
      const otherSeasons = seasons.filter(s => s.id !== selectedSeason);

      for (const season of otherSeasons) {
        // Aynı ligdeki takımları bul
        const allTeamsInSeason = new Set(
          matchData
            .filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              return matchDate >= season.startDate && 
                     matchDate <= season.endDate && 
                     match.Div === selectedLeague;
            })
            .flatMap(match => [match.HomeTeam, match.AwayTeam])
        );

        // Her takım için analiz yap
        for (const team of Array.from(allTeamsInSeason)) {
          // Karşılaştırılacak takımın maçlarını al
          const teamMatches = matchData
            .filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
              const isTeamMatch = match.HomeTeam === team || match.AwayTeam === team;
              return isInSeason && isTeamMatch;
            })
            .sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateA.getTime() - dateB.getTime();
            });

          // En az 5 maç olmalı
          if (teamMatches.length < 5 || currentSeasonMatches.length < 5) continue;

          // Benzerlik puanlarını hesapla
          let firstOpponentMatch = false;
          let opponentMatches = 0;
          let homeAwayMatch = 0;
          let scoreMatch = 0;

          const matchCount = Math.min(currentSeasonMatches.length, teamMatches.length);

          // İlk rakip kontrolü
          const currentFirstMatch = currentSeasonMatches[0];
          const compareFirstMatch = teamMatches[0];
          if (currentFirstMatch && compareFirstMatch) {
            const currentFirstOpponent = currentFirstMatch.HomeTeam === selectedTeam ? currentFirstMatch.AwayTeam : currentFirstMatch.HomeTeam;
            const compareFirstOpponent = compareFirstMatch.HomeTeam === team ? compareFirstMatch.AwayTeam : compareFirstMatch.HomeTeam;
            firstOpponentMatch = currentFirstOpponent === compareFirstOpponent;
          }

          // Diğer maçları karşılaştır
          for (let i = 0; i < matchCount; i++) {
            const currentMatch = currentSeasonMatches[i];
            const compareMatch = teamMatches[i];

            // Rakip kontrolü
            const currentOpponent = currentMatch.HomeTeam === selectedTeam ? currentMatch.AwayTeam : currentMatch.HomeTeam;
            const compareOpponent = compareMatch.HomeTeam === team ? compareMatch.AwayTeam : compareMatch.HomeTeam;
            if (currentOpponent === compareOpponent) {
              opponentMatches++;
            }

            // Ev sahibi/deplasman kontrolü
            const currentIsHome = currentMatch.HomeTeam === selectedTeam;
            const compareIsHome = compareMatch.HomeTeam === team;
            if (currentIsHome === compareIsHome) {
              homeAwayMatch++;
            }

            // Skor benzerliği kontrolü
            const currentResult = currentMatch.FTR;
            const compareResult = compareMatch.FTR;
            if (currentResult === compareResult) {
              scoreMatch++;
            }
          }

          const actualMatchCount = matchCount;
          const similarity = (
            (firstOpponentMatch ? 20 : 0) +
            (opponentMatches / actualMatchCount) * 35 +
            (homeAwayMatch / actualMatchCount) * 25 +
            (scoreMatch / actualMatchCount) * 20
          );

          if (similarity >= 50) {
            results.push({
              team,
              season: season.id,
              similarity,
              matches: teamMatches.slice(0, actualMatchCount),
              similarityDetails: {
                firstOpponentMatch,
                opponentMatches: (opponentMatches / actualMatchCount) * 100,
                homeAwayMatch: (homeAwayMatch / actualMatchCount) * 100,
                scoreMatch: (scoreMatch / actualMatchCount) * 100
              }
            });
          }

          // Her takım analizi sonrası sonuçları güncelle
          results.sort((a, b) => b.similarity - a.similarity);
          setScheduleAnalysisResults([...results]);
        }

        // Seçili takımın bu sezondaki maçlarını da karşılaştır
        if (allTeamsInSeason.has(selectedTeam)) {
          const selectedTeamOtherSeasonMatches = matchData
            .filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
              const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
              return isInSeason && isTeamMatch;
            })
            .sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateA.getTime() - dateB.getTime();
            });

          if (selectedTeamOtherSeasonMatches.length >= 5 && currentSeasonMatches.length >= 5) {
            let firstOpponentMatch = false;
            let opponentMatches = 0;
            let homeAwayMatch = 0;
            let scoreMatch = 0;

            const matchCount = Math.min(currentSeasonMatches.length, selectedTeamOtherSeasonMatches.length);

            // İlk rakip kontrolü
            const currentFirstMatch = currentSeasonMatches[0];
            const compareFirstMatch = selectedTeamOtherSeasonMatches[0];
            if (currentFirstMatch && compareFirstMatch) {
              const currentFirstOpponent = currentFirstMatch.HomeTeam === selectedTeam ? currentFirstMatch.AwayTeam : currentFirstMatch.HomeTeam;
              const compareFirstOpponent = compareFirstMatch.HomeTeam === selectedTeam ? compareFirstMatch.AwayTeam : compareFirstMatch.HomeTeam;
              firstOpponentMatch = currentFirstOpponent === compareFirstOpponent;
            }

            // Diğer maçları karşılaştır
            for (let i = 0; i < matchCount; i++) {
              const currentMatch = currentSeasonMatches[i];
              const compareMatch = selectedTeamOtherSeasonMatches[i];

              // Rakip kontrolü
              const currentOpponent = currentMatch.HomeTeam === selectedTeam ? currentMatch.AwayTeam : currentMatch.HomeTeam;
              const compareOpponent = compareMatch.HomeTeam === selectedTeam ? compareMatch.AwayTeam : compareMatch.HomeTeam;
              if (currentOpponent === compareOpponent) {
                opponentMatches++;
              }

              // Ev sahibi/deplasman kontrolü
              const currentIsHome = currentMatch.HomeTeam === selectedTeam;
              const compareIsHome = compareMatch.HomeTeam === selectedTeam;
              if (currentIsHome === compareIsHome) {
                homeAwayMatch++;
              }

              // Skor benzerliği kontrolü
              const currentResult = currentMatch.FTR;
              const compareResult = compareMatch.FTR;
              if (currentResult === compareResult) {
                scoreMatch++;
              }
            }

            const actualMatchCount = matchCount;
            const similarity = (
              (firstOpponentMatch ? 20 : 0) +
              (opponentMatches / actualMatchCount) * 35 +
              (homeAwayMatch / actualMatchCount) * 25 +
              (scoreMatch / actualMatchCount) * 20
            );

            if (similarity >= 50) {
              results.push({
                team: selectedTeam,
                season: season.id,
                similarity,
                matches: selectedTeamOtherSeasonMatches.slice(0, actualMatchCount),
                similarityDetails: {
                  firstOpponentMatch,
                  opponentMatches: (opponentMatches / actualMatchCount) * 100,
                  homeAwayMatch: (homeAwayMatch / actualMatchCount) * 100,
                  scoreMatch: (scoreMatch / actualMatchCount) * 100
                }
              });
            }

            // Her analiz sonrası sonuçları güncelle
            results.sort((a, b) => b.similarity - a.similarity);
            setScheduleAnalysisResults([...results]);
          }
        }
      }
    } catch (error) {
      console.error('Analiz sırasında hata:', error);
    } finally {
      setIsAnalyzingSchedule(false);
    }
  };

  const renderScheduleAnalysis = () => {
    const highSimilarityResults = scheduleAnalysisResults.filter(result => result.similarity >= 80);
    const lowSimilarityResults = scheduleAnalysisResults.filter(result => result.similarity >= 50 && result.similarity < 80);

    return (
      <div className="space-y-6">
        {/* Sürpriz Benzerlik Uyarısı */}
        {surpriseTeamSimilarity.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
            <div className="text-green-400 font-medium mb-2">Dikkat: Sadece sürprizler benziyor</div>
            <div className="space-y-1">
              {surpriseTeamSimilarity.map((result, index) => (
                <div key={index} className="text-green-400">
                  {result.team} ({result.season})
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Kardeş Takvim Analizi</h3>
            <p className="text-sm text-gray-400 mt-1">
              {isAnalyzingSchedule ? 'Analiz devam ediyor...' : 
               scheduleAnalysisResults.length > 0 ? `${scheduleAnalysisResults.length} sonuç bulundu` : 
               'Henüz analiz yapılmadı'}
            </p>
          </div>
          <button
            onClick={analyzeScheduleSimilarity}
            disabled={isAnalyzingSchedule}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isAnalyzingSchedule ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              'Analiz Et'
            )}
          </button>
        </div>

        {scheduleAnalysisResults.length > 0 && (
          <div className="space-y-4">
            {/* Yüksek Benzerlik Sonuçları */}
            {highSimilarityResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-lg font-medium text-green-400">Yüksek Benzerlik (%80+)</h4>
                {highSimilarityResults.map((result, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-yellow-400">{result.team}</span>
                        <span className="text-gray-400 ml-2">({result.season} Sezonu)</span>
                      </div>
                      <span className="text-green-400 font-medium">%{result.similarity.toFixed(1)} Benzerlik</span>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>İlk Rakip Eşleşmesi: {result.similarityDetails.firstOpponentMatch ? 'Evet' : 'Hayır'}</p>
                      <p>Rakip Eşleşme Oranı: %{result.similarityDetails.opponentMatches.toFixed(1)}</p>
                      <p>Ev/Deplasman Eşleşme Oranı: %{result.similarityDetails.homeAwayMatch.toFixed(1)}</p>
                      <p>Skor Eşleşme Oranı: %{result.similarityDetails.scoreMatch.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Düşük Benzerlik Sonuçları */}
            {lowSimilarityResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-medium text-yellow-400">Orta Benzerlik (%50-80)</h4>
                  <button
                    onClick={() => setShowLowSimilarity(!showLowSimilarity)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    {showLowSimilarity ? 'Gizle' : 'Göster'}
                  </button>
                </div>
                
                {showLowSimilarity && (
                  <div className="space-y-3">
                    {lowSimilarityResults.map((result, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-yellow-400">{result.team}</span>
                            <span className="text-gray-400 ml-2">({result.season} Sezonu)</span>
                          </div>
                          <span className="text-yellow-400 font-medium">%{result.similarity.toFixed(1)} Benzerlik</span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>İlk Rakip Eşleşmesi: {result.similarityDetails.firstOpponentMatch ? 'Evet' : 'Hayır'}</p>
                          <p>Rakip Eşleşme Oranı: %{result.similarityDetails.opponentMatches.toFixed(1)}</p>
                          <p>Ev/Deplasman Eşleşme Oranı: %{result.similarityDetails.homeAwayMatch.toFixed(1)}</p>
                          <p>Skor Eşleşme Oranı: %{result.similarityDetails.scoreMatch.toFixed(1)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {scheduleAnalysisResults.length === 0 && !isAnalyzingSchedule && (
          <p className="text-gray-400">Henüz analiz yapılmadı. Analiz etmek için butona tıklayın.</p>
        )}
      </div>
    );
  };

  // Hafta modunda maçları filtrele
  useEffect(() => {
    if (isWeekMode && selectedLeague && selectedSeason) {
      const season = seasons.find(s => s.id === selectedSeason);
      if (season) {
        // Seçilen sezonun maçlarını al
        const seasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= season.startDate && matchDate <= season.endDate && match.Div === selectedLeague;
        });

        // Maçları tarihe göre sırala
        const sortedMatches = seasonMatches.sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        // Her takım için seçilen sayıda maç al
        const filteredTeamMatches: {[team: string]: Match[]} = {};
        teams.forEach(team => {
          const teamMatchList = sortedMatches.filter(
            match => match.HomeTeam === team || match.AwayTeam === team
          );
          
          if (teamMatchList.length >= selectedMatchCount) {
            filteredTeamMatches[team] = teamMatchList.slice(0, selectedMatchCount);
          }
        });

        setTeamMatches(filteredTeamMatches);
      }
    }
  }, [isWeekMode, selectedLeague, selectedSeason, selectedMatchCount, matchData, teams, seasons]);

  // Maksimum maç sayısını hesapla
  useEffect(() => {
    if (selectedLeague && selectedSeason) {
      const season = seasons.find(s => s.id === selectedSeason);
      if (season) {
        // Seçilen sezonun maçlarını al
        const seasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= season.startDate && matchDate <= season.endDate && match.Div === selectedLeague;
        });

        // Her takımın maç sayısını bul ve en küçük olanı al
        const teamMatchCounts = new Map<string, number>();
        teams.forEach(team => {
          const count = seasonMatches.filter(
            match => match.HomeTeam === team || match.AwayTeam === team
          ).length;
          teamMatchCounts.set(team, count);
        });

        const minMatchCount = Math.min(...Array.from(teamMatchCounts.values()));
        setMaxMatchCount(minMatchCount);
        
        // Eğer seçili maç sayısı maksimumdan büyükse, maksimuma ayarla
        if (selectedMatchCount > minMatchCount) {
          setSelectedMatchCount(minMatchCount);
        }
      }
    }
  }, [selectedLeague, selectedSeason, matchData, teams, seasons]);

  // Sürpriz analizi yap
  const analyzeSurprisesByDay = useCallback(() => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const analysis: {
      [day: string]: {
        [league: string]: number
      }
    } = {};
    const totalSurprises: { [league: string]: number } = {};

    // Her gün için boş obje oluştur
    days.forEach(day => {
      analysis[day] = {};
    });

    // Tüm maçları analiz et
    matchData.forEach(match => {
      const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A';
      const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H';

      if (isHomeToAwaySurprise || isAwayToHomeSurprise) {
        const date = new Date((Number(match.Date) - 25569) * 86400 * 1000);
        const day = days[date.getDay()];
        
        if (!analysis[day][match.Div]) {
          analysis[day][match.Div] = 0;
        }
        analysis[day][match.Div]++;

        // Toplam sürpriz sayısını hesapla
        if (!totalSurprises[match.Div]) {
          totalSurprises[match.Div] = 0;
        }
        totalSurprises[match.Div]++;
      }
    });

    // En çok sürpriz çıkaran ligi bul
    const mostSurprisingLeague = Object.entries(totalSurprises)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Her gün için en çok sürpriz çıkaran ligleri bul
    const result: {
      [day: string]: {
        league: string;
        count: number;
        otherLeagues?: { league: string; count: number }[];
        totalSurprises?: number;
      }
    } = {};

    days.forEach(day => {
      const leagues = Object.entries(analysis[day])
        .map(([league, count]) => ({ league, count }))
        .sort((a, b) => b.count - a.count);

      if (leagues.length > 0) {
        result[day] = {
          league: leagues[0].league,
          count: leagues[0].count,
          otherLeagues: leagues.slice(1, 4).map(l => ({
            league: l.league,
            count: l.count
          })),
          totalSurprises: totalSurprises[leagues[0].league]
        };
      }
    });

    setSurpriseAnalysis(result);
  }, [matchData]);

  // Info modal açıldığında analizi yap
  useEffect(() => {
    if (showInfoModal) {
      analyzeSurprisesByDay();
    }
  }, [showInfoModal, analyzeSurprisesByDay]);

  // Son Rakip analizi için fonksiyon
  const analyzeLastOpponents = () => {
    setIsAnalyzingLastOpponent(true);
    setLastOpponentResults([]);

    setTimeout(() => {
      try {
        const results: typeof lastOpponentResults = [];

        // Seçilen sezonun maçlarını al
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        if (!currentSeason) return;

        const currentSeasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= currentSeason.startDate && matchDate <= currentSeason.endDate;
        });

        // Her iki takım için analiz yap
        [
          { team: selectedTeamForLastOpponent1, setState: setSelectedTeamForLastOpponent1 },
          { team: selectedTeamForLastOpponent2, setState: setSelectedTeamForLastOpponent2 }
        ].forEach(({ team }) => {
          // Takımın son maçını bul
          const lastMatch = currentSeasonMatches
            .filter(m => m.HomeTeam === team || m.AwayTeam === team)
            .sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateB.getTime() - dateA.getTime();
            })[0];

          if (!lastMatch) return;

          // Son rakibi ve skoru belirle
          const lastOpponent = lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;
          const score = `${lastMatch.FTHG}-${lastMatch.FTAG}`; // Artık ev sahibi/deplasman kontrolü yapmıyoruz

          // Önceki sezonlarda benzer durumları ara
          const potentialMatches: {
            season: string;
            similarTeam: string;
            surpriseMatch: Match;
            originalMatch: Match;
          }[] = [];

          // Her sezonu kontrol et
          seasons.forEach(season => {
            if (season.id === selectedSeason) return; // Mevcut sezonu atla

            // Sezon maçlarını al (hem seçili lig hem de bir alt lig için)
            const seasonMatches = matchData.filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
              
              // Seçili lig veya bir alt lig kontrolü
              const currentLeague = selectedLeague;
              const lowerLeague = currentLeague.slice(0, -1) + (Number(currentLeague.slice(-1)) + 1);
              return isInSeason && (match.Div === currentLeague || match.Div === lowerLeague);
            });

            // lastOpponent'ın maçlarını bul
            const opponentMatches = seasonMatches.filter(m => 
              (m.HomeTeam === lastOpponent || m.AwayTeam === lastOpponent)
            ).sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateA.getTime() - dateB.getTime();
            });

            // Her maç için kontrol et
            opponentMatches.forEach(match => {
              const matchOpponent = match.HomeTeam === lastOpponent ? match.AwayTeam : match.HomeTeam;
              const matchScore = `${match.FTHG}-${match.FTAG}`; // Artık ev sahibi/deplasman kontrolü yapmıyoruz

              // Skor eşleşmesi kontrolü
              if (matchScore === score || matchScore === score.split('-').reverse().join('-')) { // Her iki skor varyasyonunu da kontrol et
                // Bu takımın sonraki maçını bul
                const nextMatches = seasonMatches.filter(m => 
                  (m.HomeTeam === matchOpponent || m.AwayTeam === matchOpponent) &&
                  new Date((Number(m.Date) - 25569) * 86400 * 1000) > new Date((Number(match.Date) - 25569) * 86400 * 1000)
                ).sort((a, b) => {
                  const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                  const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                  return dateA.getTime() - dateB.getTime();
                });

                // İlk maçta sürpriz var mı kontrol et
                const nextMatch = nextMatches[0];
                if (nextMatch) {
                  const isSurprise = 
                    (nextMatch.HTR === 'H' && nextMatch.FTR === 'A') || 
                    (nextMatch.HTR === 'A' && nextMatch.FTR === 'H');

                  if (isSurprise) {
                    potentialMatches.push({
                      season: season.id,
                      similarTeam: matchOpponent,
                      surpriseMatch: nextMatch,
                      originalMatch: match
                    });
                  }
                }
              }
            });
          });

          // Sonuçları ekle
          results.push({
            team,
            lastOpponent,
            score,
            potentialMatches
          });
        });

        setLastOpponentResults(results);
      } catch (error) {
        console.error('Son rakip analizi hatası:', error);
      } finally {
        setIsAnalyzingLastOpponent(false);
      }
    }, 0);
  };

  const renderLastOpponentTab = () => {
    // Mevcut sezon için seçili ligdeki maçları al
    const currentSeason = seasons.find(s => s.id === selectedSeason);
    const currentSeasonMatches = currentSeason ? matchData.filter(match => {
      const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
      return matchDate >= currentSeason.startDate && 
             matchDate <= currentSeason.endDate && 
             match.Div === selectedLeague;
    }) : [];

    // Seçili ligdeki benzersiz takım listesini oluştur
    const teams = Array.from(new Set(
      currentSeasonMatches.flatMap(match => [match.HomeTeam, match.AwayTeam])
    )).sort();

    return (
      <div className="last-opponent-analysis p-4 bg-gray-800 rounded-lg">
        {/* Takım seçimi bölümü */}
        <div className="team-selection-container flex justify-center items-center gap-8 mb-6">
          <div className="team-select-group flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              1. Takım ({LEAGUE_NAMES[selectedLeague]})
            </label>
            <div className="relative">
              <select
                value={selectedTeamForLastOpponent1}
                onChange={(e) => setSelectedTeamForLastOpponent1(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Takım Seçin</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {selectedTeamForLastOpponent1 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <TeamLogo name={selectedTeamForLastOpponent1} className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          <div className="divider flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-indigo-500">
              <span className="text-indigo-400 font-medium text-lg">VS</span>
            </div>
          </div>

          <div className="team-select-group flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              2. Takım ({LEAGUE_NAMES[selectedLeague]})
            </label>
            <div className="relative">
              <select
                value={selectedTeamForLastOpponent2}
                onChange={(e) => setSelectedTeamForLastOpponent2(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Takım Seçin</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {selectedTeamForLastOpponent2 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <TeamLogo name={selectedTeamForLastOpponent2} className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analiz butonu */}
        <div className="analyze-button-container flex justify-center mb-8">
          <button
            onClick={analyzeLastOpponents}
            disabled={!selectedTeamForLastOpponent1 || !selectedTeamForLastOpponent2 || isAnalyzingLastOpponent}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform transition-all hover:scale-105"
          >
            {isAnalyzingLastOpponent ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Analiz Et</span>
              </>
            )}
          </button>
        </div>

        {/* Sonuçlar bölümü */}
        {lastOpponentResults.length > 0 && (
          <div className="results-container space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {lastOpponentResults.map((result, index) => (
                <div key={index} className="result-card bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600">
                  <div className="bg-gray-600 px-4 py-3 border-b border-gray-500">
                    <div className="flex items-center gap-3">
                      <TeamLogo name={result.team} className="w-8 h-8" />
                      <div>
                        <h3 className="text-lg font-medium text-white">{result.team}</h3>
                        <div className="mt-1 text-sm text-gray-300 flex items-center gap-2">
                          <span>Son Rakip:</span>
                          <TeamLogo name={result.lastOpponent} className="w-5 h-5" />
                          <span className="font-medium">{result.lastOpponent}</span>
                          <span className="mx-2">•</span>
                          <span className="font-medium">{result.score}</span>
                        </div>
                        {/* Seçili takım için ilk ve son maç bilgileri */}
                        <div className="mt-2 text-xs text-gray-300">
                          {(() => {
                            const teamMatches = matchData.filter(m => {
                              const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                              return matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                     matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate &&
                                     (m.HomeTeam === result.team || m.AwayTeam === result.team);
                            }).sort((a, b) => {
                              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                              return dateA.getTime() - dateB.getTime();
                            });

                            const firstMatch = teamMatches[0];
                            const lastMatch = teamMatches[teamMatches.length - 1];

                            const getOpponent = (match: Match, team: string) => 
                              match.HomeTeam === team ? match.AwayTeam : match.HomeTeam;

                            return (
                              <div>
                                İlk maçı: <span className="text-orange-400">{getOpponent(firstMatch, result.team)}</span> ile, Son maçı: <span className="text-orange-400">{getOpponent(lastMatch, result.team)}</span> ile
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3">
                      {result.potentialMatches.length > 0 ? (
                        <div className="space-y-4">
                          <div className="border-t border-gray-600 -mx-4 pt-4">
                            <h4 className="text-sm font-medium text-gray-300 px-4">Benzer Senaryolar</h4>
                          </div>
                          <div className="space-y-4 mt-4">
                            {result.potentialMatches.map((match, idx) => (
                              <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-indigo-500 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                  <TeamLogo name={match.similarTeam} className="w-6 h-6" />
                                  <span className="text-white font-medium">{match.similarTeam}</span>
                                  <span className="text-gray-400">({match.season})</span>
                                </div>
                                <div className="text-sm text-gray-400">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Sürpriz Maç Tarihi: {formatDate(match.surpriseMatch.Date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    <span>Sürpriz Maç: {match.surpriseMatch.HomeTeam} vs {match.surpriseMatch.AwayTeam}</span>
                                  </div>
                                  <div className="mt-1 text-xs bg-gray-900 rounded px-2 py-1 inline-block">
                                    {match.surpriseMatch.FTHG}-{match.surpriseMatch.FTAG}
                                  </div>
                                  {/* Yeni eklenen ilk ve son maç bilgileri */}
                                  <div className="mt-2 text-xs space-y-1">
                                    {(() => {
                                      // Ev sahibi takımın sezon maçlarını bul
                                      const homeTeamMatches = matchData.filter(m => {
                                        const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                        return matchDate >= seasons.find(s => s.id === match.season)?.startDate &&
                                               matchDate <= seasons.find(s => s.id === match.season)?.endDate &&
                                               (m.HomeTeam === match.surpriseMatch.HomeTeam || m.AwayTeam === match.surpriseMatch.HomeTeam);
                                      }).sort((a, b) => {
                                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                        return dateA.getTime() - dateB.getTime();
                                      });

                                      // Deplasman takımın sezon maçlarını bul
                                      const awayTeamMatches = matchData.filter(m => {
                                        const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                        return matchDate >= seasons.find(s => s.id === match.season)?.startDate &&
                                               matchDate <= seasons.find(s => s.id === match.season)?.endDate &&
                                               (m.HomeTeam === match.surpriseMatch.AwayTeam || m.AwayTeam === match.surpriseMatch.AwayTeam);
                                      }).sort((a, b) => {
                                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                        return dateA.getTime() - dateB.getTime();
                                      });

                                      const homeFirstMatch = homeTeamMatches[0];
                                      const homeLastMatch = homeTeamMatches[homeTeamMatches.length - 1];
                                      const awayFirstMatch = awayTeamMatches[0];
                                      const awayLastMatch = awayTeamMatches[awayTeamMatches.length - 1];

                                      const getOpponent = (match: Match, team: string) => 
                                        match.HomeTeam === team ? match.AwayTeam : match.HomeTeam;

                                      return (
                                        <>
                                          <div className="text-gray-400">
                                            <span className="text-orange-400">{match.surpriseMatch.HomeTeam}</span>: İlk maçı: <span className="text-orange-400">{getOpponent(homeFirstMatch, match.surpriseMatch.HomeTeam)}</span> ile, Son maçı: <span className="text-orange-400">{getOpponent(homeLastMatch, match.surpriseMatch.HomeTeam)}</span> ile
                                          </div>
                                          <div className="text-gray-400">
                                            <span className="text-orange-400">{match.surpriseMatch.AwayTeam}</span>: İlk maçı: <span className="text-orange-400">{getOpponent(awayFirstMatch, match.surpriseMatch.AwayTeam)}</span> ile, Son maçı: <span className="text-orange-400">{getOpponent(awayLastMatch, match.surpriseMatch.AwayTeam)}</span> ile
                                          </div>
                                          
                                          {/* İlk rakipler arası sürpriz maç kontrolü */}
                                          {(() => {
                                            const firstOpponent1 = getOpponent(homeFirstMatch, match.surpriseMatch.HomeTeam);
                                            const firstOpponent2 = getOpponent(awayFirstMatch, match.surpriseMatch.AwayTeam);
                                            
                                            const surpriseMatches = matchData.filter(m => {
                                              const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                              const isInSeason = matchDate >= seasons.find(s => s.id === match.season)?.startDate &&
                                                               matchDate <= seasons.find(s => s.id === match.season)?.endDate;
                                              const isFirstOpponentsMatch = (m.HomeTeam === firstOpponent1 && m.AwayTeam === firstOpponent2) ||
                                                                          (m.HomeTeam === firstOpponent2 && m.AwayTeam === firstOpponent1);
                                              const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                                              
                                              return isInSeason && isFirstOpponentsMatch && isSurprise;
                                            });

                                            return surpriseMatches.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-gray-700">
                                                <div className="text-xs text-gray-400">İlk rakipler arası sürpriz maçlar:</div>
                                                {surpriseMatches.map((m, idx) => (
                                                  <div key={idx} className="text-xs mt-1">
                                                    {m.HomeTeam} vs {m.AwayTeam} ({formatDate(m.Date)}): {m.FTHG}-{m.FTAG}
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          })()}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          Benzer senaryo bulunamadı
                        </div>
                      )}
                      
                      {/* İlk rakipler arası sürpriz maç kontrolü */}
                      {index === lastOpponentResults.length - 1 && lastOpponentResults.length === 2 && (() => {
                        // İlk rakipleri al
                        const firstOpponents = lastOpponentResults.map(r => {
                          const teamMatches = matchData.filter(m => {
                            const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                            return matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                   matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate &&
                                   (m.HomeTeam === r.team || m.AwayTeam === r.team);
                          }).sort((a, b) => {
                            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                            return dateA.getTime() - dateB.getTime();
                          });
                          
                          const firstMatch = teamMatches[0];
                          return firstMatch ? (firstMatch.HomeTeam === r.team ? firstMatch.AwayTeam : firstMatch.HomeTeam) : null;
                        }).filter(Boolean);

                        if (firstOpponents.length === 2) {
                          // İlk rakipler arası sürpriz maçları bul
                          const surpriseMatches = matchData.filter(m => {
                            const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                            const isInSeason = matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                             matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate;
                            const isFirstOpponentsMatch = (m.HomeTeam === firstOpponents[0] && m.AwayTeam === firstOpponents[1]) ||
                                                        (m.HomeTeam === firstOpponents[1] && m.AwayTeam === firstOpponents[0]);
                            const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                            
                            return isInSeason && isFirstOpponentsMatch && isSurprise;
                          });

                          return surpriseMatches.length > 0 ? (
                            <div className="mt-4 pt-4 border-t border-gray-600">
                              <h4 className="text-sm font-medium text-gray-300 mb-2">İlk Rakipler Arası Sürpriz Maçlar</h4>
                              <div className="space-y-2">
                                {surpriseMatches.map((match, idx) => (
                                  <div key={idx} className="text-sm bg-gray-800 rounded p-2 border border-gray-600">
                                    <div className="flex items-center gap-2">
                                      <TeamLogo name={match.HomeTeam} className="w-4 h-4" />
                                      <span className="text-white">{match.HomeTeam}</span>
                                      <span className="text-gray-400">vs</span>
                                      <TeamLogo name={match.AwayTeam} className="w-4 h-4" />
                                      <span className="text-white">{match.AwayTeam}</span>
                                      <span className="text-gray-400 ml-2">({formatDate(match.Date)})</span>
                                      <span className="text-orange-400 ml-2">{match.FTHG}-{match.FTAG}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 pt-4 border-t border-gray-600">
                              <div className="text-sm text-gray-400 italic">
                                İlk rakipler ({firstOpponents.join(' ve ')}) arasında sürpriz maç bulunamadı
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* İlk rakipler arası sürpriz maç kontrolü - Bağımsız bölüm */}
            {lastOpponentResults.length === 2 && (() => {
              // İlk rakipleri al
              const firstOpponents = lastOpponentResults.map(r => {
                const teamMatches = matchData.filter(m => {
                  const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                  return matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                         matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate &&
                         (m.HomeTeam === r.team || m.AwayTeam === r.team);
                }).sort((a, b) => {
                  const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                  const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                  return dateA.getTime() - dateB.getTime();
                });
                
                const firstMatch = teamMatches[0];
                return firstMatch ? (firstMatch.HomeTeam === r.team ? firstMatch.AwayTeam : firstMatch.HomeTeam) : null;
              }).filter(Boolean);

              if (firstOpponents.length === 2) {
                // İlk rakipler arası sürpriz maçları bul
                const surpriseMatches = matchData.filter(m => {
                  const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                  const isInSeason = matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                   matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate;
                  const isFirstOpponentsMatch = (m.HomeTeam === firstOpponents[0] && m.AwayTeam === firstOpponents[1]) ||
                                              (m.HomeTeam === firstOpponents[1] && m.AwayTeam === firstOpponents[0]);
                  const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                  
                  return isInSeason && isFirstOpponentsMatch && isSurprise;
                });

                return (
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mt-6">
                    <h3 className="text-lg font-medium text-white mb-4">Seçilen Takımların İlk Rakipleri Arası Analiz</h3>
                    {surpriseMatches.length > 0 ? (
                      <div>
                        <div className="text-sm text-gray-300 mb-3">
                          İlk rakipler ({firstOpponents.join(' ve ')}) arasındaki sürpriz maçlar:
                        </div>
                        <div className="space-y-2">
                          {surpriseMatches.map((match, idx) => (
                            <div key={idx} className="bg-gray-800 rounded p-3 border border-gray-600">
                              <div className="flex items-center gap-2">
                                <TeamLogo name={match.HomeTeam} className="w-5 h-5" />
                                <span className="text-white">{match.HomeTeam}</span>
                                <span className="text-gray-400">vs</span>
                                <TeamLogo name={match.AwayTeam} className="w-5 h-5" />
                                <span className="text-white">{match.AwayTeam}</span>
                                <span className="text-gray-400 ml-2">({formatDate(match.Date)})</span>
                                <span className="text-orange-400 ml-2">{match.FTHG}-{match.FTAG}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">
                        İlk rakipler ({firstOpponents.join(' ve ')}) arasında sürpriz maç bulunamadı
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    );
  };

  // İki Yarı analizi fonksiyonu
  const analyzeTwoHalves = () => {
    setIsAnalyzingTwoHalves(true);
    setTwoHalvesResults([]);

    setTimeout(() => {
      try {
        const results: {
          triggerTeam: string;    // Sürpriz yapan takım
          otherTeam: string;      // Diğer takım
          teamE: string;          // E takımı
          eMatch: Match;          // E ile olan maç
          surpriseMatch: Match;   // Sürpriz maç
        }[] = [];

        // Mevcut sezonu bul
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        if (!currentSeason) return;

        // Sezon maçlarını al ve tarihe göre sırala
        const currentSeasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= currentSeason.startDate && 
                 matchDate <= currentSeason.endDate &&
                 match.Div === selectedLeague;
        }).sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        // Her iki takımı da kontrol et
        [
          { team1: selectedTeamForTwoHalves1, team2: selectedTeamForTwoHalves2 },
          { team1: selectedTeamForTwoHalves2, team2: selectedTeamForTwoHalves1 }
        ].forEach(({ team1, team2 }) => {
          // team1'in sürpriz maçlarını bul
          const surpriseMatches = currentSeasonMatches.filter(match => {
            const isTeam1 = match.HomeTeam === team1 || match.AwayTeam === team1;
            const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                              (match.HTR === 'A' && match.FTR === 'H');
            return isTeam1 && isSurprise;
          });

          // Her sürpriz maç için
          surpriseMatches.forEach(surpriseMatch => {
            // Sürpriz maçtan önceki son maçı bul
            const previousMatches = currentSeasonMatches.filter(match => {
              const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
              const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
              const isBeforeSurprise = matchDate < surpriseDate;
              const isTeam1 = match.HomeTeam === team1 || match.AwayTeam === team1;
              return isBeforeSurprise && isTeam1;
            }).sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateB.getTime() - dateA.getTime();
            });

            const previousMatch = previousMatches[0];
            if (previousMatch) {
              // E takımını bul (team1'in son rakibi)
              const teamE = previousMatch.HomeTeam === team1 ? 
                           previousMatch.AwayTeam : 
                           previousMatch.HomeTeam;

              // team2'nin son maçını bul
              const team2LastMatch = currentSeasonMatches.filter(match => 
                match.HomeTeam === team2 || match.AwayTeam === team2
              ).pop();

              // team2'nin son rakibi E mi kontrol et
              if (team2LastMatch) {
                const team2LastOpponent = team2LastMatch.HomeTeam === team2 ? 
                                        team2LastMatch.AwayTeam : 
                                        team2LastMatch.HomeTeam;

                if (team2LastOpponent === teamE) {
                  results.push({
                    triggerTeam: team1,
                    otherTeam: team2,
                    teamE,
                    eMatch: previousMatch,
                    surpriseMatch
                  });
                }
              }
            }
          });
        });

        setTwoHalvesResults(results);
      } catch (error) {
        console.error('İki Yarı analizi hatası:', error);
      } finally {
        setIsAnalyzingTwoHalves(false);
      }
    }, 0);
  };

  // Sonuçları gösterme fonksiyonu
  const renderTwoHalvesResults = () => {
    return (
      <div className="results-container">
        <div className="grid grid-cols-1 gap-6">
          {twoHalvesResults.map((result, index) => (
            <div key={index} className="result-card bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600">
              <div className="bg-gray-600 px-4 py-3 border-b border-gray-500">
                <div className="flex items-center gap-3">
                  <TeamLogo name={result.triggerTeam} className="w-8 h-8" />
                  <div>
                    <h3 className="text-lg font-medium text-white">{result.triggerTeam}</h3>
                    <div className="mt-1 text-sm text-gray-300">
                      <span>E Takımı:</span>
                      <TeamLogo name={result.teamE} className="w-5 h-5 inline-block mx-2" />
                      <span className="font-medium">{result.teamE}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3">
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <div className="text-sm text-gray-400">
                      <div className="flex items-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>E ile Maç: {formatDate(result.eMatch.Date)}</span>
                        <span className="text-xs bg-gray-900 rounded px-2 py-1 ml-2">
                          {result.eMatch.FTHG}-{result.eMatch.FTAG}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>Sürpriz Maç: {formatDate(result.surpriseMatch.Date)}</span>
                        <span className="text-xs bg-gray-900 rounded px-2 py-1 ml-2">
                          {result.surpriseMatch.FTHG}-{result.surpriseMatch.FTAG}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <TeamLogo name={result.otherTeam} className="w-6 h-6" />
                      <span className="text-white font-medium">{result.otherTeam}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Son Rakip: {result.teamE}</span>
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
  };

  // İki Yarı sekmesi render fonksiyonu
  const renderTwoHalvesTab = () => {
    // Mevcut sezon için seçili ligdeki maçları al
    const currentSeason = seasons.find(s => s.id === selectedSeason);
    const currentSeasonMatches = currentSeason ? matchData.filter(match => {
      const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
      return matchDate >= currentSeason.startDate && 
             matchDate <= currentSeason.endDate && 
             match.Div === selectedLeague;
    }) : [];

    // Seçili ligdeki benzersiz takım listesini oluştur
    const teams = Array.from(new Set(
      currentSeasonMatches.flatMap(match => [match.HomeTeam, match.AwayTeam])
    )).sort();

    return (
      <div className="last-opponent-analysis p-4 bg-gray-800 rounded-lg">
        {/* Takım seçimi bölümü */}
        <div className="team-selection-container flex justify-center items-center gap-8 mb-6">
          <div className="team-select-group flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              O Takımı ({LEAGUE_NAMES[selectedLeague]})
            </label>
            <div className="relative">
              <select
                value={selectedTeamForTwoHalves1}
                onChange={(e) => setSelectedTeamForTwoHalves1(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Takım Seçin</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {selectedTeamForTwoHalves1 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <TeamLogo name={selectedTeamForTwoHalves1} className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          <div className="divider flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-indigo-500">
              <span className="text-indigo-400 font-medium text-lg">VS</span>
            </div>
          </div>

          <div className="team-select-group flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              M Takımı ({LEAGUE_NAMES[selectedLeague]})
            </label>
            <div className="relative">
              <select
                value={selectedTeamForTwoHalves2}
                onChange={(e) => setSelectedTeamForTwoHalves2(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Takım Seçin</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {selectedTeamForTwoHalves2 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <TeamLogo name={selectedTeamForTwoHalves2} className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analiz butonu */}
        <div className="analyze-button-container flex justify-center mb-8">
          <button
            onClick={analyzeTwoHalves}
            disabled={!selectedTeamForTwoHalves1 || !selectedTeamForTwoHalves2 || isAnalyzingTwoHalves}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform transition-all hover:scale-105"
          >
            {isAnalyzingTwoHalves ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Analiz Et</span>
              </>
            )}
          </button>
        </div>

        {/* Sonuçlar bölümü */}
        {twoHalvesResults.length > 0 && renderTwoHalvesResults()}
      </div>
    );
  };

  // Gizli sekmeler için state
  const [showHiddenTabs, setShowHiddenTabs] = useState<boolean>(false);

  // Tost Formülü analiz fonksiyonu
  const analyzeToastFormula = (targetSeason?: string) => {
    setIsAnalyzingToast(true);
    const analyzeSeason = targetSeason || selectedSeason;

    setTimeout(() => {
      try {
        const results: typeof toastResults = [];

        // Mevcut sezonu bul
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        if (!currentSeason) return;

        // Mevcut sezondaki maçları al
        const currentSeasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= currentSeason.startDate && 
                 matchDate <= currentSeason.endDate &&
                 match.Div === selectedLeague;
        });

        // A ve B takımlarının mevcut sezondaki son rakiplerini bul
        const getLastOpponent = (team: string) => {
          const lastMatch = currentSeasonMatches.filter(m => 
            m.HomeTeam === team || m.AwayTeam === team
          ).pop();

          if (!lastMatch) return null;
          return lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;
        };

        const team1LastOpponent = getLastOpponent(selectedTeamForToast1);
        const team2LastOpponent = getLastOpponent(selectedTeamForToast2);

        if (!team1LastOpponent || !team2LastOpponent) return;

        // Analiz edilecek sezonu bul
        const season = seasons.find(s => s.id === analyzeSeason);
        if (!season) return;

        // Analiz edilecek sezondaki maçları al
        const seasonMatches = matchData.filter(match => {
          const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
          return matchDate >= season.startDate && 
                 matchDate <= season.endDate &&
                 match.Div === selectedLeague;
        }).sort((a, b) => {
          const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
          const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
          return dateA.getTime() - dateB.getTime();
        });

        // Sürpriz maçları bul
        const surpriseMatches = seasonMatches.filter(match => 
          (match.HTR === 'H' && match.FTR === 'A') || 
          (match.HTR === 'A' && match.FTR === 'H')
        );

        // Her sürpriz maç için kontrol et
        surpriseMatches.forEach(surpriseMatch => {
          const teams = [surpriseMatch.HomeTeam, surpriseMatch.AwayTeam];
          
          // Sürpriz maçta A veya B var mı kontrol et
          if (teams.includes(selectedTeamForToast1) || teams.includes(selectedTeamForToast2)) {
            // Sürpriz maçtaki diğer takımı bul (Y takımı)
            const yTeam = teams.find(team => 
              team !== selectedTeamForToast1 && team !== selectedTeamForToast2
            );

            if (yTeam) {
              // Y takımının son maçını bul
              const yPreviousMatches = seasonMatches.filter(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                const isBeforeSurprise = matchDate < surpriseDate;
                const isTeamInvolved = match.HomeTeam === yTeam || match.AwayTeam === yTeam;
                return isBeforeSurprise && isTeamInvolved;
              }).sort((a, b) => {
                const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                return dateB.getTime() - dateA.getTime();
              });

              const yPreviousMatch = yPreviousMatches[0];
              if (yPreviousMatch) {
                // Y'nin son rakibini bul (Tost başlangıcı)
                const yLastOpponent = yPreviousMatch.HomeTeam === yTeam ? 
                                    yPreviousMatch.AwayTeam : 
                                    yPreviousMatch.HomeTeam;

                // Eğer Y'nin son rakibi, seçmediğimiz takımın MEVCUT SEZONDAKİ son rakibi ile aynıysa
                if ((teams.includes(selectedTeamForToast1) && yLastOpponent === team2LastOpponent) ||
                    (teams.includes(selectedTeamForToast2) && yLastOpponent === team1LastOpponent)) {
                  
                  // Y'nin sonraki maçını bul
                  const yNextMatches = seasonMatches.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                    const isAfterSurprise = matchDate > surpriseDate;
                    const isTeamInvolved = match.HomeTeam === yTeam || match.AwayTeam === yTeam;
                    return isAfterSurprise && isTeamInvolved;
                  }).sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                  });

                  const yNextMatch = yNextMatches[0];
                  if (yNextMatch) {
                    const nextOpponent = yNextMatch.HomeTeam === yTeam ? 
                                      yNextMatch.AwayTeam : 
                                      yNextMatch.HomeTeam;

                    results.push({
                      surpriseMatch,
                      toastStart: {
                        team: yLastOpponent,
                        isHome: yPreviousMatch.HomeTeam === yLastOpponent
                      },
                      toastMiddle: {
                        team: teams.includes(selectedTeamForToast1) ? selectedTeamForToast1 : selectedTeamForToast2,
                        isHome: surpriseMatch.HomeTeam === (teams.includes(selectedTeamForToast1) ? selectedTeamForToast1 : selectedTeamForToast2)
                      },
                      toastEnd: {
                        team: nextOpponent,
                        isHome: yNextMatch.HomeTeam === nextOpponent,
                        match: yNextMatch
                      },
                      season: analyzeSeason
                    });
                  }
                }
              }
            }
          }
        });

        setToastResults(prevResults => [...prevResults, ...results]);
        setCurrentToastSeason(analyzeSeason);
        setShowMoreSeasonsButton(true);
      } catch (error) {
        console.error('Tost Formülü analizi hatası:', error);
      } finally {
        setIsAnalyzingToast(false);
      }
    }, 0);
  };

  // Tost Formülü sekmesi render fonksiyonu
  const renderToastFormulaTab = () => {
    // Mevcut sezon için seçili ligdeki maçları al
    const currentSeason = seasons.find(s => s.id === selectedSeason);
    const currentSeasonMatches = currentSeason ? matchData.filter(match => {
      const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
      return matchDate >= currentSeason.startDate && 
             matchDate <= currentSeason.endDate && 
             match.Div === selectedLeague;
    }) : [];

    // Seçili ligdeki benzersiz takım listesini oluştur
    const teams = Array.from(new Set(
      currentSeasonMatches.flatMap(match => [match.HomeTeam, match.AwayTeam])
    )).sort();

    return (
      <div className="last-opponent-analysis p-4 bg-gray-800 rounded-lg">
        {/* Başlık */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Tost Formülü</h2>

        {/* Takım seçimi bölümü */}
        <div className="team-selection-container flex justify-center items-center gap-8 mb-6">
          <div className="team-select-group flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              A Takımı ({LEAGUE_NAMES[selectedLeague]})
            </label>
            <div className="relative">
              <select
                value={selectedTeamForToast1}
                onChange={(e) => setSelectedTeamForToast1(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Takım Seçin</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {selectedTeamForToast1 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <TeamLogo name={selectedTeamForToast1} className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>

          <div className="divider flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-indigo-500">
              <span className="text-indigo-400 font-medium text-lg">VS</span>
            </div>
          </div>

          <div className="team-select-group flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              B Takımı ({LEAGUE_NAMES[selectedLeague]})
            </label>
            <div className="relative">
              <select
                value={selectedTeamForToast2}
                onChange={(e) => setSelectedTeamForToast2(e.target.value)}
                className="w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Takım Seçin</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {selectedTeamForToast2 && (
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                  <TeamLogo name={selectedTeamForToast2} className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analiz butonu */}
        <div className="analyze-button-container flex justify-center mb-8">
          <button
            onClick={() => {
              setToastResults([]);
              setShowMoreSeasonsButton(false);
              analyzeToastFormula();
            }}
            disabled={!selectedTeamForToast1 || !selectedTeamForToast2 || isAnalyzingToast}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform transition-all hover:scale-105"
          >
            {isAnalyzingToast ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Analiz Et</span>
              </>
            )}
          </button>
        </div>

        {/* Sonuçlar bölümü */}
        {selectedTeamForToast1 && selectedTeamForToast2 && (
          <div className="results-container space-y-6">
            {/* Sezon başlığı */}
            <div className="text-lg font-medium text-white text-center mb-4">
              {currentToastSeason} Sezonu Sonuçları
              {toastResults.filter(result => result.season === currentToastSeason).length === 0 && (
                <div className="text-gray-400 text-sm mt-2">
                  Bu sezonda sonuç bulunamadı
                </div>
              )}
            </div>

            {/* Sonuç kartları */}
            {toastResults.filter(result => result.season === currentToastSeason).length > 0 && (
              <div className="grid grid-cols-1 gap-6">
                {toastResults.filter(result => result.season === currentToastSeason).map((result, index) => (
                  <div key={index} className="result-card bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600">
                    <div className="bg-gray-600 px-4 py-3 border-b border-gray-500">
                      <div className="text-lg font-medium text-white">
                        Sürpriz Maç: {formatDate(result.surpriseMatch.Date)}
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-4">
                      {/* Tost Başlangıcı */}
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-sm font-medium">
                          Tost Başlangıcı
                        </div>
                        <TeamLogo name={result.toastStart.team} className="w-6 h-6" />
                        <span className="text-white">{result.toastStart.team}</span>
                        <span className="text-gray-400 text-sm">
                          ({result.toastStart.isHome ? 'Ev Sahibi' : 'Deplasman'})
                        </span>
                      </div>

                      {/* Tost Ortası */}
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-sm font-medium">
                          Tost Ortası
                        </div>
                        <TeamLogo name={result.toastMiddle.team} className="w-6 h-6" />
                        <span className="text-white">{result.toastMiddle.team}</span>
                        <span className="text-gray-400 text-sm">
                          ({result.toastMiddle.isHome ? 'Ev Sahibi' : 'Deplasman'})
                        </span>
                      </div>

                      {/* Tost Bitiş */}
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-sm font-medium">
                          Tost Bitiş
                        </div>
                        <TeamLogo name={result.toastEnd.team} className="w-6 h-6" />
                        <span className="text-white">{result.toastEnd.team}</span>
                        <span className="text-gray-400 text-sm">
                          ({result.toastEnd.isHome ? 'Ev Sahibi' : 'Deplasman'})
                        </span>
                        <span className="text-gray-400 text-sm">
                          - {formatDate(result.toastEnd.match.Date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Daha fazla sezon butonu - her zaman göster */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  const currentSeasonIndex = seasons.findIndex(s => s.id === currentToastSeason);
                  if (currentSeasonIndex < seasons.length - 1) {
                    analyzeToastFormula(seasons[currentSeasonIndex + 1].id);
                  }
                }}
                disabled={isAnalyzingToast}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span>Daha Fazla Sezona Bakılsın mı?</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modal header'ı güncelleyelim
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Sol Panel */}
      <div className="w-40 min-w-[160px] bg-gray-800 p-4 border-r border-gray-700">
        <div className="space-y-4">
          {/* Lig Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lig Seçimi
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Lig Seçin</option>
              {Object.entries(LEAGUE_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* Takım Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Takım Seçimi
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={!selectedLeague}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Takım Seçin</option>
              {teams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orta Alan - Maç Listesi */}
      <div className="flex-1 p-6 overflow-auto min-w-[1200px]">
        <div className="flex gap-6">
          {/* Ana Maç Listesi */}
          <div className={`${isComparisonMode ? 'w-1/2' : 'w-full'} min-w-[600px]`}>
            <div className="flex items-center justify-between mb-2">
              {selectedSeason && (
                <div className="text-white font-medium">{selectedSeason} Sezonu</div>
              )}
              <div className="flex items-center gap-3">
                <Switch
                  checked={isSurpriseMode}
                  onChange={setIsSurpriseMode}
                  className={`${
                    isSurpriseMode ? 'bg-blue-600' : 'bg-gray-600'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span className="sr-only">Sürpriz Modu</span>
                  <span
                    className={`${
                      isSurpriseMode ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
                <span className="text-white text-sm">Sürpriz Modu</span>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-xl overflow-x-auto">
              {!isWeekMode ? (
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="w-[8%] px-4 py-3 text-center text-sm font-medium text-gray-300">Maç</th>
                      <th className="w-[15%] px-4 py-3 text-left text-sm font-medium text-gray-300">Tarih</th>
                      <th className="w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300">Ev Sahibi</th>
                      <th className="w-[23%] px-4 py-3 text-center text-sm font-medium text-gray-300">Skor</th>
                      <th className="w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300">Deplasman</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredMatches.map((match, index) => {
                      // Sürpriz senaryolarını kontrol et
                      const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
                      const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
                      const isHomeToDrawSurprise = match.HTR === 'H' && match.FTR === 'D'; // 1/X
                      const isAwayToDrawSurprise = match.HTR === 'A' && match.FTR === 'D'; // 2/X

                      return (
                        <tr
                          key={index}
                          className={`
                            relative
                            ${match.HomeTeam === selectedTeam
                              ? match.FTR === 'H'
                                ? 'bg-green-900/20'
                                : match.FTR === 'A'
                                  ? 'bg-red-900/20'
                                  : 'bg-gray-700/20'
                              : match.FTR === 'A'
                                ? 'bg-green-900/20'
                                : match.FTR === 'H'
                                  ? 'bg-red-900/20'
                                  : 'bg-gray-700/20'
                            }
                            ${
                              // 1/2 veya 2/1 senaryoları
                              (isHomeToAwaySurprise || isAwayToHomeSurprise)
                                ? 'outline outline-2 outline-orange-500 z-20'
                                : ''
                            }
                            ${
                              // 1/X veya 2/X senaryoları
                              (isHomeToDrawSurprise || isAwayToDrawSurprise)
                                ? 'outline outline-2 outline-blue-500 z-20'
                                : ''
                            }
                          `}
                        >
                          <td className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                            {index + 1}.
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {formatDate(match.Date)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {match.HR > 0 && (
                                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-white text-[10px] font-bold">R</span>
                                </div>
                              )}
                              <TeamLogo name={match.HomeTeam} className="w-5 h-5" />
                              <span className="text-white">{match.HomeTeam}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-white font-bold">
                                {match.FTHG} - {match.FTAG}
                              </span>
                              <span className="text-gray-400 text-sm">
                                (İY: {match.HTHG}-{match.HTAG})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-white">{match.AwayTeam}</span>
                              <TeamLogo name={match.AwayTeam} className="w-5 h-5" />
                              {match.AR > 0 && (
                                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-white text-[10px] font-bold">R</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                // Maç sayısı modu tablosu
                <div className="space-y-4 p-4">
                  {Object.entries(teamMatches).map(([team, matches]) => (
                    <div key={team} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TeamLogo name={team} className="w-6 h-6" />
                        <span className="text-white font-medium">{team}</span>
                      </div>
                      <table className="w-full">
                        <tbody className="divide-y divide-gray-600">
                          {matches.map((match, index) => (
                            <tr key={index} className={`
                              ${match.HomeTeam === team
                                ? match.FTR === 'H'
                                  ? 'bg-green-900/20'
                                  : match.FTR === 'A'
                                    ? 'bg-red-900/20'
                                    : 'bg-gray-700/20'
                                : match.FTR === 'A'
                                  ? 'bg-green-900/20'
                                  : match.FTR === 'H'
                                    ? 'bg-red-900/20'
                                    : 'bg-gray-700/20'
                              }
                              ${
                                // 1/2 veya 2/1 senaryoları
                                (match.HTR === 'H' && match.FTR === 'A') || (match.HTR === 'A' && match.FTR === 'H')
                                  ? 'outline outline-2 outline-orange-500 z-20'
                                  : ''
                              }
                              ${
                                // 1/X veya 2/X senaryoları
                                (match.HTR === 'H' && match.FTR === 'D') || (match.HTR === 'A' && match.FTR === 'D')
                                  ? 'outline outline-2 outline-blue-500 z-20'
                                  : ''
                              }
                            `}>
                              <td className="py-2 px-3 text-sm text-gray-300">{formatDate(match.Date)}</td>
                              <td className="py-2 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-white">{match.HomeTeam}</span>
                                  <TeamLogo name={match.HomeTeam} className="w-4 h-4" />
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="text-white font-medium">
                                  {match.FTHG} - {match.FTAG}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <TeamLogo name={match.AwayTeam} className="w-4 h-4" />
                                  <span className="text-white">{match.AwayTeam}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Karşılaştırma Maç Listesi */}
          {isComparisonMode && (
            <div className="w-1/2 min-w-[600px]">
              <div className="flex items-center justify-between mb-2">
                {comparisonSeason && (
                  <div className="text-white font-medium">{comparisonSeason} Sezonu</div>
                )}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isComparisonSurpriseMode}
                    onChange={setIsComparisonSurpriseMode}
                    className={`${
                      isComparisonSurpriseMode ? 'bg-blue-600' : 'bg-gray-600'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                  >
                    <span className="sr-only">Sürpriz Modu</span>
                    <span
                      className={`${
                        isComparisonSurpriseMode ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span className="text-white text-sm">Sürpriz Modu</span>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg shadow-xl overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gray-900">
                      <th className="w-[8%] px-4 py-3 text-center text-sm font-medium text-gray-300">Maç</th>
                      <th className="w-[15%] px-4 py-3 text-left text-sm font-medium text-gray-300">Tarih</th>
                      <th className="w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300">Ev Sahibi</th>
                      <th className="w-[23%] px-4 py-3 text-center text-sm font-medium text-gray-300">Skor</th>
                      <th className="w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300">Deplasman</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {comparisonMatches.map((match, index) => {
                      // Sürpriz senaryolarını kontrol et
                      const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A';
                      const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H';
                      const isHomeToDrawSurprise = match.HTR === 'H' && match.FTR === 'D';
                      const isAwayToDrawSurprise = match.HTR === 'A' && match.FTR === 'D';

                      return (
                        <tr
                          key={index}
                          className={`
                            relative
                            ${match.HomeTeam === selectedTeam
                              ? match.FTR === 'H'
                                ? 'bg-green-900/20'
                                : match.FTR === 'A'
                                  ? 'bg-red-900/20'
                                  : 'bg-gray-700/20'
                                : match.FTR === 'A'
                                  ? 'bg-green-900/20'
                                  : match.FTR === 'H'
                                    ? 'bg-red-900/20'
                                    : 'bg-gray-700/20'
                              }
                              ${
                                (isHomeToAwaySurprise || isAwayToHomeSurprise)
                                  ? 'outline outline-2 outline-orange-500 z-20'
                                  : ''
                              }
                              ${
                                (isHomeToDrawSurprise || isAwayToDrawSurprise)
                                  ? 'outline outline-2 outline-blue-500 z-20'
                                  : ''
                              }
                            `}
                          >
                          <td className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                            {index + 1}.
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {formatDate(match.Date)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {match.HR > 0 && (
                                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-white text-[10px] font-bold">R</span>
                                </div>
                              )}
                              <TeamLogo name={match.HomeTeam} className="w-5 h-5" />
                              <span className="text-white">{match.HomeTeam}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-white font-bold">
                                {match.FTHG} - {match.FTAG}
                              </span>
                              <span className="text-gray-400 text-sm">
                                (İY: {match.HTHG}-{match.HTAG})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-white">{match.AwayTeam}</span>
                              <TeamLogo name={match.AwayTeam} className="w-5 h-5" />
                              {match.AR > 0 && (
                                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-white text-[10px] font-bold">R</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel */}
      <div className="w-40 min-w-[160px] bg-gray-800 p-4 border-l border-gray-700">
        <div className="space-y-4">
          {/* Info Icon */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowInfoModal(true)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Info Modal */}
          {showInfoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">İpuçları ve Bilgiler</h2>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Günlere Göre Analiz */}
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded-lg">
                    <button
                      className="w-full px-4 py-2 text-left text-white font-medium flex items-center justify-between hover:bg-gray-700"
                      onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                    >
                      <span>Günlere Göre Sürpriz Eğilimleri</span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 transform transition-transform ${isAnalysisOpen ? 'rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {isAnalysisOpen && (
                      <div className="px-4 py-2 border-t border-gray-700">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr>
                                {Object.keys(surpriseAnalysis).map(day => (
                                  <th key={day} className="px-4 py-2 text-gray-300 font-medium border-b border-gray-700">
                                    {day}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {Object.entries(surpriseAnalysis).map(([day, data]) => {
                                  const isHighestTotal = Object.values(surpriseAnalysis).every(
                                    otherData => (data.totalSurprises || 0) >= (otherData.totalSurprises || 0)
                                  );

                                  return (
                                    <td key={day} className="px-4 py-2 text-center">
                                      <div className={`font-medium ${isHighestTotal ? 'text-orange-400' : 'text-green-400'}`}>
                                        {LEAGUE_NAMES[data.league]}
                                      </div>
                                      {data.otherLeagues && data.otherLeagues.length > 0 && (
                                        <div className="mt-1 text-sm text-gray-400">
                                          {data.otherLeagues.map(league => (
                                            <div key={league.league}>{LEAGUE_NAMES[league.league]}</div>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kıyaslama Modu Switch */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Kıyaslama Modu
            </label>
            <Switch
              checked={isComparisonMode}
              onChange={setIsComparisonMode}
              className={`${
                isComparisonMode ? 'bg-blue-600' : 'bg-gray-700'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
            >
              <span
                className={`${
                  isComparisonMode ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          {/* Hafta Modu Switch */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maç Sayısı Modu
            </label>
            <div className="space-y-2">
              <Switch
                checked={isWeekMode}
                onChange={setIsWeekMode}
                className={`${
                  isWeekMode ? 'bg-blue-600' : 'bg-gray-700'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
              >
                <span
                  className={`${
                    isWeekMode ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
              {isWeekMode && (
                <select
                  value={selectedMatchCount}
                  onChange={(e) => setSelectedMatchCount(Number(e.target.value))}
                  className="w-full bg-gray-700 text-white rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({length: 40}, (_, i) => i + 1).map(count => (
                    <option key={count} value={count}>{count} Maç</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Karşılaştırma Sezonu Seçimi */}
          {isComparisonMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Karşılaştırma Sezonu
              </label>
              <select
                value={comparisonSeason}
                onChange={(e) => setComparisonSeason(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sezon Seçin</option>
                {seasons.map(season => (
                  <option key={season.id} value={season.id}>{season.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sezon Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sezon Seçimi
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map(season => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
          </div>

          {/* Detaylı Analiz Butonu */}
          <div>
            <button
              onClick={() => setShowDetailModal(true)}
              disabled={!selectedLeague || !selectedTeam}
              className={`
                w-full text-white text-sm font-medium py-2 px-4 rounded transition-colors duration-200
                ${!selectedLeague || !selectedTeam
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              Detaylı Analiz
            </button>
          </div>
        </div>
      </div>

      {/* Sürüklenebilir Analiz Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-40">
          <Draggable 
            handle=".modal-header" 
            nodeRef={nodeRef} 
            disabled={isFullScreen}
            defaultPosition={{x: 0, y: 0}}
            position={isFullScreen ? {x: 0, y: 0} : undefined}
          >
            <div 
              ref={nodeRef} 
              className={`${getModalStyle()} ${!isFullScreen ? 'resize overflow-auto' : ''}`}
              style={{ 
                resize: isFullScreen ? 'none' : 'both', 
                minWidth: isFullScreen ? '100%' : '800px', 
                minHeight: isFullScreen ? '100%' : '500px',
                maxWidth: isFullScreen ? '100%' : 'calc(100vw - 40px)',
                maxHeight: isFullScreen ? '100%' : 'calc(100vh - 40px)',
                transform: isFullScreen ? 'none' : undefined
              }}
            >
              <div className="modal-header cursor-move p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('custom')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      activeTab === 'custom' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Özel Üçlü
                  </button>
                  <button
                    onClick={() => setActiveTab('bridge')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      activeTab === 'bridge' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Köprü
                  </button>
                  <button
                    onClick={() => setActiveTab('lastOpponent')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      activeTab === 'lastOpponent' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Son Rakip
                  </button>
                  <button
                    onClick={() => setActiveTab('twoHalves')}
                    className={`px-4 py-2 rounded-md ${
                      activeTab === 'twoHalves'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    İki Yarı
                  </button>
                  <button
                    onClick={() => setActiveTab('toast')}
                    className={`px-4 py-2 rounded-md ${
                      activeTab === 'toast'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Tost Formülü
                  </button>
                  <button
                    onClick={() => setActiveTab('chain')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      activeTab === 'chain' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Takım Zinciri
                  </button>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      activeTab === 'matches' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Maç Sırası
                  </button>
                  {showHiddenTabs && (
                    <>
                      <button
                        onClick={() => setActiveTab('surprises')}
                        className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                          activeTab === 'surprises' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Sezondaki Sürprizler
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveTab('newAnalysis')}
                    className={`px-4 py-2 rounded-md ${
                      activeTab === 'newAnalysis'
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    Yeni Analiz
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {/* Gizli Sekmeler Switch'i */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={showHiddenTabs}
                      onChange={setShowHiddenTabs}
                      className={`${
                        showHiddenTabs ? 'bg-blue-600' : 'bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
                    >
                      <span className="sr-only">Gizli Sekmeleri Göster</span>
                      <span
                        className={`${
                          showHiddenTabs ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                    <span className="text-sm text-gray-400">Gizli Sekmeler</span>
                  </div>
                  {/* Mevcut butonlar */}
                  <button
                    onClick={startAutoCalculation}
                    className="text-gray-400 hover:text-white p-1"
                    title="Otomatik Hesaplama"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsFullScreen(!isFullScreen)}
                    className="text-gray-400 hover:text-white p-1"
                    title="Tam Ekran"
                  >
                    {isFullScreen ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setIsFullScreen(false);
                      setTeamChains([]);
                      setMatchPairs([]);
                    }}
                    className="text-gray-400 hover:text-white p-1"
                    title="Kapat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className={`p-6 ${isFullScreen ? 'h-[calc(100vh-80px)]' : 'max-h-[calc(100%-80px)]'} overflow-auto`}>
                {activeTab === 'chain' ? (
                  <div className="text-white">
                    {renderTeamChain()}
                  </div>
                ) : activeTab === 'matches' ? (
                  <div className="text-white">
                    {renderMatchSequence()}
                  </div>
                ) : activeTab === 'surprises' ? (
                  <div className="text-white">
                    {renderSeasonSurprises()}
                  </div>
                ) : activeTab === 'custom' ? (
                  <div className="text-white">
                    {renderCustomTriplet()}
                  </div>
                ) : activeTab === 'bridge' ? (
                  <div className="text-white">
                    {renderBridgeMode()}
                  </div>
                ) : activeTab === 'lastOpponent' ? (
                  <div className="space-y-4">
                    {renderLastOpponentTab()}
                  </div>
                ) : activeTab === 'twoHalves' ? (
                  renderTwoHalvesTab()
                ) : activeTab === 'toast' ? (
                  renderToastFormulaTab()
                ) : activeTab === 'newAnalysis' ? (
                  <NewAnalysisTab
                    matchData={matchData}
                    teamData={teamData}
                    selectedLeague={selectedLeague}
                    selectedTeam={selectedTeam}
                    selectedSeason={selectedSeason}
                  />
                ) : null}
              </div>
            </div>
          </Draggable>
        </div>
      )}

      {/* Takım Seçim Modalı */}
      {showTeamSelectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">
              Takım Seçimi
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1. Takım
                </label>
                <select
                  value={autoSelectedTeam1}
                  onChange={(e) => setAutoSelectedTeam1(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-md px-3 py-2"
                >
                  <option value="">Takım Seçin</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  2. Takım
                </label>
                <select
                  value={autoSelectedTeam2}
                  onChange={(e) => setAutoSelectedTeam2(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-md px-3 py-2"
                >
                  <option value="">Takım Seçin</option>
                  {teams.filter(t => t !== autoSelectedTeam1).map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowTeamSelectionModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  İptal
                </button>
                <button
                  onClick={handleTeamSelection}
                  disabled={!autoSelectedTeam1 || !autoSelectedTeam2}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Başlat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Devam Et Butonu */}
      {showContinueButton && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={continueToNextStep}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg flex items-center gap-2"
          >
            {currentAutoStep === 'custom2' ? 'Bitir' : 'Devam Et'}
            {currentAutoStep !== 'custom2' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
} 