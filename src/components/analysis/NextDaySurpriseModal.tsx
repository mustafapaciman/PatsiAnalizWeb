import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Calendar } from 'lucide-react';
import { Match } from '../../utils/types/match';
import { TeamLogo } from '../TeamLogo';

interface NextDaySurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match[];
  selectedLeague: string;
}

const DAYS = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
];

// Yardımcı tip tanımlamaları
interface SurpriseResult {
  season: string;
  surprises: {
    date: string;
    day: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    htHomeScore: number;
    htAwayScore: number;
  }[];
}

// Interface'e uyarı tipini ekleyelim
interface Warning {
  team: string;
  count: number;
  totalOpportunities: number;
  dates: string[];
  missedOpportunities: Array<{
    date: string;
    opponent: string;
  }>;
}

export function NextDaySurpriseModal({ isOpen, onClose, matchData, selectedLeague }: NextDaySurpriseModalProps) {
  const [step, setStep] = useState<'team' | 'day' | 'results'>('team');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [results, setResults] = useState<SurpriseResult[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Takımları filtrele
  const teams = Array.from(new Set(
    matchData
      .filter(m => m.Div === selectedLeague)
      .flatMap(m => [m.HomeTeam, m.AwayTeam])
  )).sort();

  // Tarih yardımcı fonksiyonları
  const getSeasonFromDate = (excelDate: number) => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year-1}-${year}`;
  };

  const getDayFromDate = (excelDate: number) => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const dayIndex = date.getDay();
    // JavaScript'in 0=Pazar sistemini bizim 0=Pazartesi sistemimize çevirelim
    return DAYS[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const formatDate = (excelDate: number) => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR');
  };

  const getNextDay = (day: string) => {
    const index = DAYS.indexOf(day);
    return index === DAYS.length - 1 ? DAYS[0] : DAYS[index + 1];
  };

  // Sürpriz maç kontrolü
  const isSurpriseMatch = (match: Match) => {
    const htr = match.HTHG > match.HTAG ? 'H' : match.HTHG < match.HTAG ? 'A' : 'D';
    const ftr = match.FTHG > match.FTAG ? 'H' : match.FTHG < match.FTAG ? 'A' : 'D';
    return (htr === 'A' && ftr === 'H') || (htr === 'H' && ftr === 'A');
  };

  const handleTeamSelect = (team: string) => {
    setSelectedTeam(team);
    setStep('day');
  };

  const handleDaySelect = (day: string) => {
    setSelectedDay(day);
    
    // Tüm sezonlardaki sürprizleri topla
    const allTeamSurprises = matchData.filter(match => {
      const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
      return isTeamMatch && isSurpriseMatch(match);
    });

    // Her takımın istatistiklerini tut
    const teamStats: Record<string, { 
      surprises: number, 
      opportunities: number, 
      dates: string[],
      missedOpportunities: Array<{
        date: string;
        opponent: string;
      }>
    }> = {};

    allTeamSurprises.forEach(surprise => {
      const surpriseDate = Number(surprise.Date);
      const nextDayDate = surpriseDate + 1;

      // Ertesi gün oynanan tüm lig maçları (fırsat sayısı için)
      const nextDayMatches = matchData.filter(match => {
        const matchDate = Number(match.Date);
        const isNextDay = Math.floor(matchDate) === Math.floor(nextDayDate);
        const isLeagueMatch = match.Div === selectedLeague;
        const isNotTeamMatch = match.HomeTeam !== selectedTeam && match.AwayTeam !== selectedTeam;
        return isNextDay && isLeagueMatch && isNotTeamMatch;
      });

      // Ertesi gün olan sürprizleri bul
      const nextDaySurprises = nextDayMatches.filter(match => isSurpriseMatch(match));

      // Her takımın istatistiklerini güncelle
      nextDayMatches.forEach(match => {
        const teams = [match.HomeTeam, match.AwayTeam];
        teams.forEach(team => {
          if (team !== selectedTeam) {
            if (!teamStats[team]) {
              teamStats[team] = { 
                surprises: 0, 
                opportunities: 0,
                dates: [],
                missedOpportunities: []
              };
            }
            teamStats[team].opportunities++;
            
            // Eğer sürpriz değilse, bu maçı kaçan fırsat olarak kaydet
            if (!isSurpriseMatch(match)) {
              teamStats[team].missedOpportunities.push({
                date: formatDate(Number(match.Date)),
                opponent: team === match.HomeTeam ? match.AwayTeam : match.HomeTeam
              });
            }
          }
        });
      });

      nextDaySurprises.forEach(match => {
        const teams = [match.HomeTeam, match.AwayTeam];
        teams.forEach(team => {
          if (team !== selectedTeam && teamStats[team]) {
            teamStats[team].surprises++;
            // Tarihleri ekleyelim
            if (!teamStats[team].dates) {
              teamStats[team].dates = [];
            }
            teamStats[team].dates.push(formatDate(Number(match.Date)));
          }
        });
      });
    });

    // İstatistikleri analiz et ve uyarıları oluştur
    const warningThreshold = 10; // %20'den %10'a düşürelim
    const minOpportunities = 1; // 3'ten 1'e düşürelim

    const warnings = Object.entries(teamStats)
      .map(([team, stats]) => ({
        team,
        count: stats.surprises,
        totalOpportunities: stats.opportunities,
        dates: stats.dates || [],
        missedOpportunities: stats.missedOpportunities || []
      }))
      .filter(w => w.count > 0) // Sadece en az 1 kez sürpriz yapanları göster
      .sort((a, b) => b.count - a.count); // Sadece sürpriz sayısına göre sırala

    setWarnings(warnings);
    
    // Seçilen takımın seçilen gündeki sürprizlerini bul
    const teamSurprises = matchData.filter(match => {
      const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
      const matchDay = getDayFromDate(Number(match.Date));
      return isTeamMatch && matchDay === day && isSurpriseMatch(match);
    });

    // Her sürpriz için ertesi gün olan sürprizleri bul
    const resultsBySeason: Record<string, SurpriseResult['surprises']> = {};

    teamSurprises.forEach(surprise => {
      const surpriseDate = Number(surprise.Date);
      const nextDayDate = surpriseDate + 1; // Excel tarihinde 1 gün ekle
      const season = getSeasonFromDate(surpriseDate);

      // Ertesi gün olan sürprizleri bul
      const nextDaySurprises = matchData.filter(match => {
        const matchDate = Number(match.Date);
        const isNextDay = Math.floor(matchDate) === Math.floor(nextDayDate);
        const isLeagueMatch = match.Div === selectedLeague;
        const isNotTeamMatch = match.HomeTeam !== selectedTeam && match.AwayTeam !== selectedTeam;
        return isNextDay && isLeagueMatch && isNotTeamMatch && isSurpriseMatch(match);
      });

      if (nextDaySurprises.length > 0) {
        if (!resultsBySeason[season]) {
          resultsBySeason[season] = [];
        }

        nextDaySurprises.forEach(match => {
          resultsBySeason[season].push({
            date: formatDate(Number(match.Date)),
            day: getDayFromDate(Number(match.Date)),
            homeTeam: match.HomeTeam,
            awayTeam: match.AwayTeam,
            homeScore: match.FTHG,
            awayScore: match.FTAG,
            htHomeScore: match.HTHG,
            htAwayScore: match.HTAG
          });
        });
      }
    });

    // Sonuçları formatlayıp state'e kaydet
    const formattedResults = Object.entries(resultsBySeason)
      .map(([season, surprises]) => ({
        season,
        surprises: surprises.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      }))
      .sort((a, b) => b.season.localeCompare(a.season));

    setResults(formattedResults);
    setStep('results');
  };

  // Uyarıları filtreleme ve gruplama fonksiyonu
  const getFilteredWarnings = (warnings: Warning[]) => {
    const filteredWarnings = showAll 
      ? warnings 
      : warnings.filter(w => w.count >= 2);

    // Her durumda sürpriz sayısına göre sırala
    return filteredWarnings.sort((a, b) => {
      // Önce sürpriz sayısına göre sırala
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      // Sürpriz sayıları eşitse yüzdeye göre sırala
      return b.percentage - a.percentage;
    });
  };

  // Kart rengini belirleyen yardımcı fonksiyon
  const getWarningColor = (count: number) => {
    if (count >= 3) return 'bg-red-500/20 hover:bg-red-500/30';
    if (count === 2) return 'bg-yellow-500/20 hover:bg-yellow-500/30';
    return 'bg-gray-800/50 hover:bg-gray-800/80';
  };

  // Ring rengini belirleyen yardımcı fonksiyon
  const getActiveRingColor = (count: number) => {
    if (count >= 3) return 'ring-red-500/50';
    if (count === 2) return 'ring-yellow-500/50';
    return 'ring-gray-500/50';
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-xl bg-gray-900 shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <Dialog.Title className="text-xl font-semibold text-white">
              Sıradaki Sürpriz Analizi
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {step === 'team' ? (
              // Takım Seçim Ekranı
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-300">Takım Seçin</h3>
                <div className="grid grid-cols-6 gap-4">
                  {teams.map((team) => (
                    <button
                      key={team}
                      onClick={() => handleTeamSelect(team)}
                      className="flex flex-col items-center p-4 rounded-xl 
                        bg-gray-800/50 hover:bg-gray-800/70 transition-all"
                    >
                      <TeamLogo name={team} className="w-16 h-16 mb-2" />
                      <span className="text-sm text-center text-gray-300">{team}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : step === 'day' ? (
              // Gün Seçim Ekranı
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setStep('team')}
                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-3">
                    <TeamLogo name={selectedTeam} className="w-12 h-12" />
                    <h3 className="text-lg font-medium text-gray-300">
                      {selectedTeam} için Gün Seçin
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleDaySelect(day)}
                      className="p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 
                        transition-all flex flex-col items-center gap-2"
                    >
                      <Calendar className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-300">{day}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {warnings.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-red-400 font-medium">
                        ÖNEMLİ NOT: {selectedTeam} takımının sürprizlerinden sonra en çok sürpriz yapan takımlar
                      </div>
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-3 py-1 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 
                                  text-gray-300 transition-colors"
                      >
                        {showAll ? 'Önemli Olanları Göster' : 'Tümünü Göster'}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      {getFilteredWarnings(warnings).map((warning) => (
                        <div key={warning.team} className="relative">
                          <button
                            onClick={() => setActiveWarning(activeWarning === warning.team ? null : warning.team)}
                            className={`p-3 rounded-lg transition-all ${
                              activeWarning === warning.team 
                                ? `${getWarningColor(warning.count)} ring-2 ${getActiveRingColor(warning.count)}` 
                                : getWarningColor(warning.count)
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <TeamLogo name={warning.team} className="w-12 h-12" />
                              <div className={`text-xs font-medium ${
                                warning.count >= 3 ? 'text-red-300' :
                                warning.count === 2 ? 'text-yellow-300' :
                                'text-gray-300'
                              }`}>
                                {warning.count} kez
                              </div>
                            </div>
                          </button>

                          {activeWarning === warning.team && (
                            <div className="absolute top-full left-0 mt-2 w-80 p-3 
                                          bg-gray-800 rounded-lg shadow-xl z-10 
                                          border border-red-500/20">
                              <div className="text-sm text-red-300">
                                <span className="font-medium">{warning.team}</span>, {selectedTeam}'in 
                                sürprizlerinden sonraki gün {warning.count} kez sürpriz yapmıştır.
                                
                                {warning.dates && warning.dates.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-red-500/20">
                                    <div className="text-xs text-gray-400 mb-1">Sürpriz Tarihleri:</div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {warning.dates.map((date, idx) => (
                                        <div key={idx} className="text-xs text-gray-300">
                                          {date}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {warning.missedOpportunities && warning.missedOpportunities.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-red-500/20">
                                    <div className="text-xs text-gray-400 mb-1">Değerlendirilmeyen Fırsatlar:</div>
                                    <div className="space-y-1">
                                      {warning.missedOpportunities.map((miss, idx) => (
                                        <div key={idx} className="text-xs flex justify-between">
                                          <span className="text-gray-300">{miss.opponent}</span>
                                          <span className="text-gray-500">{miss.date}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-red-500/20">
                                  <div className="text-xs text-gray-400">
                                    <div>Toplam Fırsat: {warning.totalOpportunities}</div>
                                    <div>Değerlendirilen: {warning.count}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setStep('day')}
                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-3">
                    <TeamLogo name={selectedTeam} className="w-12 h-12" />
                    <h3 className="text-lg font-medium text-gray-300">
                      {selectedTeam} {selectedDay} günü sürpriz yaptıktan sonraki {getNextDay(selectedDay)} günü sürprizleri
                    </h3>
                  </div>
                </div>

                {results.length > 0 ? (
                  results.map(({ season, surprises }) => (
                    <div key={season} className="bg-gray-800/50 rounded-xl p-6">
                      <h4 className="text-lg font-medium text-emerald-400 mb-4">{season} Sezonu</h4>
                      <div className="space-y-4">
                        {surprises.map((match, idx) => (
                          <div 
                            key={idx} 
                            className="bg-gray-800 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center">
                                  <TeamLogo name={match.homeTeam} className="w-8 h-8 mb-1" />
                                  <span className="text-xs text-gray-500">{match.homeTeam}</span>
                                </div>
                                <div className="text-lg font-medium text-gray-300">
                                  {match.htHomeScore}-{match.htAwayScore}
                                  <span className="mx-2 text-gray-500">→</span>
                                  {match.homeScore}-{match.awayScore}
                                </div>
                                <div className="flex flex-col items-center">
                                  <TeamLogo name={match.awayTeam} className="w-8 h-8 mb-1" />
                                  <span className="text-xs text-gray-500">{match.awayTeam}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-300">{match.date}</div>
                                <div className="text-xs text-gray-500">{match.day}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    Bu kriterlere uygun sürpriz maç bulunamadı
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 