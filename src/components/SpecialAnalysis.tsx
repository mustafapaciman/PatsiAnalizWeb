import React, { useState, useEffect, useRef } from 'react';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { TeamLogo } from './TeamLogo';
import { getTeamLogo } from '../utils/teamLogoLoader';
import { parseDateString } from '../utils/dateUtils';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Trophy, TrendingUp, Scale, Info, ChevronLeft, ChevronRight, Brain, Calendar, Clock, Image, Sun, Moon, Users, Target } from 'lucide-react';
import { TeamAnalysisPanel } from './TeamAnalysisPanel';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { findMatchingOpponents, findHeadToHeadSurprises } from '../utils/matchOpponentAnalysis';
import { findMatchingHomeAwayPattern } from '../utils/matchAnalysis';

// Constants
const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";

// League mappings
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
  'G1': 'Greek Super League'
};

// Types
interface League {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  league: string;
}

interface MatchDetails {
  score: string;
  htScore: string;
  date: string;
  redCards?: number;
  opponent: string;
  isHome?: boolean;
}

interface FilteredMatch extends MatchDetails {
  isHome: boolean;
}

interface SurpriseOpponent {
  count: number;
  lastMatch: MatchDetails;
  allMatches: MatchDetails[];
}

interface TeamData {
  surpriseOpponents: { [key: string]: SurpriseOpponent };
  preSurpriseScores: { [key: string]: number };
  redCardImpact: { [key: string]: number };
  lastThreeMatches: MatchDetails[];
}

interface TeamAnalysisData {
  homeTeam: TeamData;
  awayTeam: TeamData;
  similarOddsMatches: Match[];
  aiAnalysis: {
    team1Analysis: string[];
    team2Analysis: string[];
    generalAnalysis: string[];
  };
}

interface SpecialAnalysisProps {
  matchData: Match[];
  teamData: TeamMapping;
  selectedMatch: Match | null;
}

// Oran tiplerini tanımla
const ODD_TYPES: { [key: string]: string } = {
  // Bet365 Oranları
  'B365H': 'Bet365 Ev Sahibi',
  'B365D': 'Bet365 Beraberlik',
  'B365A': 'Bet365 Deplasman',
  'B365CH': 'Bet365 Ev Sahibi (Kapanış)',
  'B365CD': 'Bet365 Beraberlik (Kapanış)',
  'B365CA': 'Bet365 Deplasman (Kapanış)',
  'B365>2.5': 'Bet365 2.5 Üst',
  'B365<2.5': 'Bet365 2.5 Alt',
  'B365AHH': 'Bet365 Handikap Ev',
  'B365AHA': 'Bet365 Handikap Dep',
  'B365CAHH': 'Bet365 Handikap Ev (Kapanış)',
  'B365CAHA': 'Bet365 Handikap Dep (Kapanış)',
  // Diğer Bookmakerlar
  'BWH': 'Bet&Win Ev Sahibi',
  'BWD': 'Bet&Win Beraberlik',
  'BWA': 'Bet&Win Deplasman',
  'IWH': 'Interwetten Ev Sahibi',
  'IWD': 'Interwetten Beraberlik',
  'IWA': 'Interwetten Deplasman',
  'PSH': 'Pinnacle Ev Sahibi',
  'PSD': 'Pinnacle Beraberlik',
  'PSA': 'Pinnacle Deplasman',
  'WHH': 'William Hill Ev Sahibi',
  'WHD': 'William Hill Beraberlik',
  'WHA': 'William Hill Deplasman',
  'VCH': 'VC Bet Ev Sahibi',
  'VCD': 'VC Bet Beraberlik',
  'VCA': 'VC Bet Deplasman',
  // Genel İstatistikler
  'MaxH': 'En Yüksek Ev Sahibi',
  'MaxD': 'En Yüksek Beraberlik',
  'MaxA': 'En Yüksek Deplasman',
  'AvgH': 'Ortalama Ev Sahibi',
  'AvgD': 'Ortalama Beraberlik',
  'AvgA': 'Ortalama Deplasman'
};

// Oran gösterimini formatla
const formatOddDisplay = (oddKey: string, oddValue: number): string => {
  const isClosingOdd = oddKey.includes('C') && !oddKey.startsWith('VC');
  const oddName = ODD_TYPES[oddKey] || oddKey;
  const formattedValue = oddValue.toFixed(2);
  return `${oddName}: ${formattedValue}${isClosingOdd ? ' (Kapanış)' : ''}`;
};

// Excel tarihini normal tarihe çeviren fonksiyon
const convertExcelDate = (excelDate: number | string): string => {
  // Eğer tarih zaten string formatında ise direkt döndür
  if (typeof excelDate === 'string' && excelDate.includes('-')) {
    const [year, month, day] = excelDate.split('-');
    return `${day}.${month}.${year}`;
  }
  
  // String ise sayıya çevir
  const numericDate = typeof excelDate === 'string' ? parseInt(excelDate) : excelDate;
  
  // Geçerli bir sayı değilse orijinal değeri döndür
  if (!Number.isFinite(numericDate)) return String(excelDate);

  // Excel tarihi 1900'den başlar ve geçen gün sayısını temsil eder
  const EXCEL_START_DATE = new Date(1900, 0, 1);
  
  // Excel'in 1900'ü artık yıl sayma hatasını düzelt
  const adjustedDate = numericDate <= 60 ? numericDate - 1 : numericDate - 2;
  
  // Milisaniyeye çevir ve başlangıç tarihine ekle
  const date = new Date(EXCEL_START_DATE.getTime() + (adjustedDate * 24 * 60 * 60 * 1000));
  
  // Tarihi formatla
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

// Sürpriz öncesi skor örüntülerini analiz et
function analyzePreSurpriseScores(matches: Match[], surpriseMatches: Match[]) {
  const scores: { [key: string]: number } = {};
  surpriseMatches.forEach(sm => {
    const preMatch = matches
      .filter(m => new Date(m.Date) < new Date(sm.Date))
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];
    
    if (preMatch) {
      const score = `${preMatch.FTHG}-${preMatch.FTAG}`;
      scores[score] = (scores[score] || 0) + 1;
    }
  });

  // Skorları yüzdeye göre sırala
  const total = Object.values(scores).reduce((sum, count) => sum + count, 0);
  const sortedScores: { [key: string]: number } = {};
  
  Object.entries(scores)
    .map(([score, count]) => ({
      score,
      percentage: (count / total) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .forEach(({ score, percentage }) => {
      sortedScores[score] = scores[score];
    });

  return sortedScores;
}

// Kırmızı kart etkisini analiz et
function analyzeRedCardImpact(matches: Match[]) {
  const impact: { [key: string]: number } = {
    "Kırmızı Kartlı": 0,
    "Kartsız": 0
  };
  matches.forEach(m => {
    if (m.RC && m.RC > 0) {
      impact["Kırmızı Kartlı"]++;
    } else {
      impact["Kartsız"]++;
    }
  });
  return impact;
}

// AI analizi oluştur
function analyzeTriggers(surprises: Match[], teamName: string, matchData: Match[]) {
  // Her sürpriz maçtan önceki rakibi bul
  const triggerCounts: { [key: string]: { matches: Match[], dates: string[], triggerMatches: Match[] } } = {};
  
  surprises.forEach(surprise => {
    // Sürpriz maçtan önceki maçı bul
    const previousMatch = matchData
      .filter(m => 
        (m.HomeTeam === teamName || m.AwayTeam === teamName) &&
        new Date(m.Date) < new Date(surprise.Date)
      )
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];

    if (previousMatch) {
      // Önceki maçtaki rakibi bul
      const opponent = previousMatch.HomeTeam === teamName ? 
        previousMatch.AwayTeam : previousMatch.HomeTeam;

      if (!triggerCounts[opponent]) {
        triggerCounts[opponent] = { matches: [], dates: [], triggerMatches: [] };
      }
      triggerCounts[opponent].matches.push(surprise);
      triggerCounts[opponent].dates.push(previousMatch.Date);
      triggerCounts[opponent].triggerMatches.push(previousMatch);
    }
  });

  // En az 2 kez tetikleme yapan takımları bul
  const triggers = Object.entries(triggerCounts)
    .filter(([_, data]) => data.matches.length >= 2)
    .sort((a, b) => b[1].matches.length - a[1].matches.length);

  const html = triggers.length > 0 ? `
    <div class="space-y-4">
      <div class="flex items-center justify-between bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors" 
           onclick="this.nextElementSibling.classList.toggle('hidden')">
        <div class="flex items-center gap-2">
          <Target class="w-5 h-5 text-gray-600" />
          <div class="flex items-center">
            <span class="font-semibold text-gray-700">Tetikleyici</span>
            <span class="font-semibold text-gray-700 ml-1">Takımlar</span>
          </div>
        </div>
        <ChevronDown class="w-5 h-5 text-gray-600" />
      </div>
      <div class="space-y-4 text-left">
        ${triggers.map(([opponent, data], index) => {
          const triggerCount = data.matches.length;
          let badgeColor = 'bg-green-500/20';
          let headerGradient = 'from-emerald-600 to-teal-700';
          
          if (triggerCount >= 5) {
            badgeColor = 'bg-red-500/20';
            headerGradient = 'from-red-600 to-rose-700';
          } else if (triggerCount >= 3) {
            badgeColor = 'bg-orange-500/20';
            headerGradient = 'from-orange-600 to-amber-700';
          }
          
          return `
            <div class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <div class="bg-gradient-to-r ${headerGradient} p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-white p-1 shadow-lg transform transition-transform duration-300 hover:rotate-12">
                      <img
                        src="${getTeamLogo(opponent)}"
                        alt="${opponent}"
                        class="w-full h-full object-contain rounded-full"
                        onerror="this.src='${EMPTY_LOGO}'"
                      />
                    </div>
                    <div class="text-white">
                      <h3 class="font-bold text-lg">${opponent}</h3>
                      <p class="text-blue-100 text-sm">Tetikleyici Takım</p>
                    </div>
                  </div>
                  <div class="px-4 py-2 ${badgeColor} text-white rounded-full text-sm font-medium backdrop-blur-sm">
                    ${data.matches.length} kez tetikledi
                  </div>
                </div>
              </div>
              <div class="divide-y divide-gray-100">
                ${data.matches.map((match, index) => `
                  <div class="p-4 hover:bg-blue-50 transition-all duration-200">
                    <div class="grid grid-cols-12 gap-4 items-center text-sm">
                      <div class="col-span-2 font-medium text-gray-600 text-center">
                        ${convertExcelDate(data.dates[index])}
                      </div>
                      <div class="col-span-4 text-gray-600 bg-amber-50/50 rounded-lg p-2 text-center">
                        ${data.triggerMatches[index].HomeTeam} 
                        <span class="font-bold text-gray-800">${data.triggerMatches[index].FTHG}-${data.triggerMatches[index].FTAG}</span> 
                        ${data.triggerMatches[index].AwayTeam}
                      </div>
                      <div class="col-span-1 flex justify-center">
                        <div class="h-6 w-0.5 bg-gray-300"></div>
                      </div>
                      <div class="col-span-5 text-gray-800 bg-blue-50/50 rounded-lg p-2 text-center">
                        ${match.HomeTeam} 
                        <span class="font-bold text-gray-800">${match.FTHG}-${match.FTAG}</span> 
                        ${match.AwayTeam}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  ` : `<div class="text-gray-500">Tetikleyici takım bulunamadı.</div>`;

  return {
    html,
    triggerCounts
  };
}

// Lig tetikleyicisi analizi
function findLeagueTrigger(matches: Match[], teamName: string) {
  // Takımın ligini bul
  const teamLeague = matches.find(m => m.HomeTeam === teamName || m.AwayTeam === teamName)?.Div;
  if (!teamLeague) return null;

  // Ligdeki tüm takımları bul
  const leagueTeams = new Set<string>();
  matches.filter(m => m.Div === teamLeague).forEach(m => {
    leagueTeams.add(m.HomeTeam);
    leagueTeams.add(m.AwayTeam);
  });

  // Her takım için tetikleme sayısını hesapla
  const triggerCounts: { [key: string]: { count: number, triggeredTeams: { team: string, match: Match }[] } } = {};

  // Tüm sürpriz maçları bul
  const surpriseMatches = matches.filter(m => 
    m.Div === teamLeague && 
    ((m.HTR === "H" && m.FTR === "A") || (m.HTR === "A" && m.FTR === "H"))
  );

  // Her sürpriz maç için, önceki maçtaki rakipleri kontrol et
  surpriseMatches.forEach(surprise => {
    const surpriseTeam = surprise.HTR === "H" ? surprise.AwayTeam : surprise.HomeTeam;
    
    // Sürpriz yapan takımın bir önceki maçını bul
    const previousMatch = matches
      .filter(m => 
        (m.HomeTeam === surpriseTeam || m.AwayTeam === surpriseTeam) &&
        new Date(m.Date) < new Date(surprise.Date)
      )
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];

    if (previousMatch) {
      // Önceki maçtaki rakibi bul
      const opponent = previousMatch.HomeTeam === surpriseTeam ? 
        previousMatch.AwayTeam : previousMatch.HomeTeam;

      if (!triggerCounts[opponent]) {
        triggerCounts[opponent] = { count: 0, triggeredTeams: [] };
      }
      
      // Bu takım-maç kombinasyonu daha önce eklenmemişse ekle
      const isNewTrigger = !triggerCounts[opponent].triggeredTeams.some(
        t => t.team === surpriseTeam
      );
      
      if (isNewTrigger) {
        triggerCounts[opponent].count++;
        triggerCounts[opponent].triggeredTeams.push({
          team: surpriseTeam,
          match: surprise
        });
      }
    }
  });

  // En çok tetikleyen takımları bul (en az 3 farklı takımı tetiklemiş olmalı)
  const leagueTriggers = Object.entries(triggerCounts)
    .filter(([_, data]) => data.count >= 3)
    .sort(([_, a], [__, b]) => b.count - a.count)
    .slice(0, 2); // En çok tetikleyen 2 takımı al

  return leagueTriggers.length > 0 ? leagueTriggers.map(([team, data]) => ({
    team,
    ...data
  })) : null;
}

function createAIAnalysis(
  team1Surprises: Match[], 
  team2Surprises: Match[],
  team1PreScores: { [key: string]: number },
  team2PreScores: { [key: string]: number },
  team1Name: string,
  team2Name: string,
  matchData: Match[],
  analysisMode: 'classic' | 'draw'
) {
  const analysis = {
    team1Analysis: [] as string[],
    team2Analysis: [] as string[],
    generalAnalysis: [] as string[]
  };

  const getCurrentMonthSurprises = (surprises: Match[]) => {
    const currentMonth = new Date().getMonth();
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const currentMonthSurprises = surprises.filter(match => {
      const excelDate = Number(match.Date);
      const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
      return jsDate.getMonth() === currentMonth;
    });

    return currentMonthSurprises.length > 0 
      ? `${monthNames[currentMonth]} ayında ${currentMonthSurprises.length} sürpriz var`
      : `${monthNames[currentMonth]} ayında sürpriz yok`;
  };

  // Tetikleyici takımlar analizi
  const team1TriggerAnalysis = analyzeTriggers(team1Surprises, team1Name, matchData);
  const team2TriggerAnalysis = analyzeTriggers(team2Surprises, team2Name, matchData);

  // Lig tetikleyicisi analizi
  const team1LeagueTrigger = findLeagueTrigger(matchData, team1Name);
  const team2LeagueTrigger = findLeagueTrigger(matchData, team2Name);

  if (team1LeagueTrigger) {
    const leagueTriggerHtml = team1LeagueTrigger.map(trigger => `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors" 
             onclick="this.nextElementSibling.classList.toggle('hidden')">
          <div class="flex items-center gap-2">
            <Target class="w-5 h-5 text-gray-600" />
            <div class="flex items-center">
              <span class="font-semibold text-gray-700">Lig</span>
              <span class="font-semibold text-gray-700 ml-1">Tetikleyicisi</span>
              </div>
              </div>
          <ChevronDown class="w-5 h-5 text-gray-600" />
            </div>
        <div class="space-y-4 text-left">
          <div class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <div class="bg-gradient-to-r from-violet-600 to-purple-700 p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-white p-1 shadow-lg">
                    <img
                      src="${getTeamLogo(trigger.team)}"
                      alt="${trigger.team}"
                      class="w-full h-full object-contain rounded-full"
                      onerror="this.src='${EMPTY_LOGO}'"
                    />
          </div>
                  <div class="text-white">
                    <h3 class="font-bold text-lg">${trigger.team}</h3>
                    <p class="text-purple-100 text-sm">Lig Tetikleyicisi</p>
        </div>
      </div>
                <div class="px-4 py-2 bg-purple-500/20 text-white rounded-full text-sm font-medium backdrop-blur-sm">
                  ${trigger.count} takımı tetikledi
        </div>
              </div>
              </div>
            <div class="p-4 bg-purple-50/50">
              <p class="text-sm text-gray-600 mb-4">
                Bu takım, ligdeki farklı takımların sürpriz yapmasını tetikliyor. 
                Toplam ${trigger.count} farklı takımın sürpriz yapmasına öncülük etti.
              </p>
              <div class="overflow-hidden rounded-lg border border-purple-100">
                <table class="min-w-full divide-y divide-purple-100">
                  <thead class="bg-purple-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-purple-800">Tarih</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-purple-800">Tetikleyicinin Maçı</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-purple-800">Skor</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-purple-100">
                    ${trigger.triggeredTeams.map(t => {
                      // Tetikleyici takımın maçını bul
                      const previousMatch = matchData
                        .filter(m => 
                          (m.HomeTeam === t.team || m.AwayTeam === t.team) &&
                          (m.HomeTeam === trigger.team || m.AwayTeam === trigger.team) &&
                          new Date(m.Date) < new Date(t.match.Date)
                        )
                        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];

                      if (previousMatch) {
                        const isHome = previousMatch.HomeTeam === trigger.team;
                        const score = `${previousMatch.FTHG}-${previousMatch.FTAG}`;
                        
                        return `
                          <tr class="hover:bg-purple-50/50">
                            <td class="px-4 py-2 text-sm text-gray-600">${convertExcelDate(previousMatch.Date)}</td>
                            <td class="px-4 py-2 text-sm text-gray-600">
                              ${previousMatch.HomeTeam} - ${previousMatch.AwayTeam}
                            </td>
                            <td class="px-4 py-2 text-sm font-medium text-gray-800">${score}</td>
                          </tr>
                        `;
                      }
                      return '';
                    }).join('')}
                  </tbody>
                </table>
        </div>
              </div>
              </div>
            </div>
          </div>
    `).join('');

    analysis.team1Analysis.push(team1TriggerAnalysis.html);
    analysis.team1Analysis.push(leagueTriggerHtml);

    // Son 3 maç analizi
    const team1LastMatches = matchData
      .filter(m => m.HomeTeam === team1Name || m.AwayTeam === team1Name)
      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
      .slice(0, 3);

    const lastMatchesHtml = `
      <div class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 mt-4">
        <div class="divide-y divide-gray-100">
          ${team1LastMatches.map((match, index) => {
            const isHome = match.HomeTeam === team1Name;
            const opponent = isHome ? match.AwayTeam : match.HomeTeam;
            const score = `${match.FTHG}-${match.FTAG}`;
            
            // Maç sonucuna göre renk belirleme
            let resultBgColor = 'bg-yellow-100';
            if ((isHome && match.FTR === 'H') || (!isHome && match.FTR === 'A')) {
              resultBgColor = 'bg-green-100';
            } else if ((isHome && match.FTR === 'A') || (!isHome && match.FTR === 'H')) {
              resultBgColor = 'bg-red-100';
            }

            // Sürpriz maç kontrolü
            let isSurprise = false;
            if (analysisMode === 'classic') {
              isSurprise = (match.HTR === "H" && match.FTR === "A") || (match.HTR === "A" && match.FTR === "H");
            } else {
              isSurprise = (match.HTR === "H" && match.FTR === "D") || (match.HTR === "A" && match.FTR === "D");
            }

            // Kırmızı kart kontrolü
            const hasRedCard = match.HR > 0 || match.AR > 0;
            const redCardIcon = hasRedCard ? `
              <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </div>
            ` : '';

            // Sürpriz maç ikonu
            const surpriseIcon = isSurprise ? `
              <div class="absolute -top-1 ${hasRedCard ? '-right-7' : '-right-1'} w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            ` : '';

            // En son maçtaki rakip için tetikleyici kontrolü (index === 0 en son maç)
            let triggerWarning = '';
            if (index === 0) {
              // Lig tetikleyicisi kontrolü
              const isLeagueTrigger = team1LeagueTrigger?.some(trigger => trigger.team === opponent);
              // Takım tetikleyicisi kontrolü
              const isTeamTrigger = Object.entries(team1TriggerAnalysis.triggerCounts)
                .some(([team, data]) => team === opponent && data.matches.length >= 2);

              if (isLeagueTrigger || isTeamTrigger) {
                triggerWarning = `
                  <div class="absolute -top-1 -left-1 group">
                    <div class="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                      <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
          </div>
                    <div class="absolute left-6 top-0 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      ${isLeagueTrigger ? 'Lig Tetikleyicisi' : 'Takım Tetikleyicisi'}
        </div>
              </div>
            `;
              }
            }
            
            // Rakip eşleşme analizi
            const matchingResult = findMatchingOpponents(team1LastMatches, team1Surprises, team1Name, matchData);
            const isMatchingOpponent = matchingResult?.matchingOpponents.includes(opponent);
            const matchingClass = isMatchingOpponent ? 'ring-2 ring-green-500' : '';
            
            return `
              <div class="p-4 hover:bg-opacity-90 transition-all duration-200">
                <div class="grid grid-cols-12 gap-4 items-center text-sm">
                  <div class="col-span-2 font-medium text-gray-600 text-center">
                    ${convertExcelDate(match.Date)}
          </div>
                  <div class="col-span-10 text-gray-800 ${resultBgColor} rounded-lg p-2 text-center shadow-sm relative ${matchingClass}">
                    ${redCardIcon}
                    ${surpriseIcon}
                    ${triggerWarning}
                    <div class="flex items-center justify-center gap-3">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-white p-1 shadow-sm">
                          <img
                            src="${getTeamLogo(match.HomeTeam)}"
                            alt="${match.HomeTeam}"
                            class="w-full h-full object-contain rounded-full"
                            onerror="this.src='${EMPTY_LOGO}'"
                          />
              </div>
                        <span class="font-medium">${match.HomeTeam}</span>
              </div>
                      <span class="font-bold text-lg px-3">${score}</span>
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-white p-1 shadow-sm">
                          <img
                            src="${getTeamLogo(match.AwayTeam)}"
                            alt="${match.AwayTeam}"
                            class="w-full h-full object-contain rounded-full"
                            onerror="this.src='${EMPTY_LOGO}'"
                          />
            </div>
                        <span class="font-medium">${match.AwayTeam}</span>
              </div>
          </div>
        </div>
                </div>
              </div>
            `;
          }).join('')}
          ${(() => {
            const matchingResult = findMatchingOpponents(team1LastMatches, team1Surprises, team1Name, matchData);
            const headToHeadSurprise = findHeadToHeadSurprises(matchData, team1Name, team2Name);
            const surpriseDateInfo = checkSurpriseDates([...team1Surprises, ...team2Surprises]);
            
            let resultHtml = '';
            
            if (matchingResult && matchingResult.matchingCount > 0) {
              resultHtml += `
                <div class="p-4 bg-green-50">
                  <div class="text-center text-green-700 font-medium">
                    ${matchingResult.matchingCount} Rakip eşleşiyor 
                    <span class="text-gray-600 ml-2">(Sürpriz Tarihi: ${convertExcelDate(matchingResult.surpriseDate)})</span>
              </div>
              </div>
              `;
            }
            
            // Dizilim analizi
            const patternAnalysis = findMatchingHomeAwayPattern(team1LastMatches, team1Surprises, team1Name, matchData);
            if (patternAnalysis.matchingPatterns.length > 0) {
              resultHtml += `
                <div class="p-4 bg-amber-50">
                  <div class="text-center text-amber-700 font-medium">
                    Bu dizilim ${patternAnalysis.matchingPatterns.length} defa görülmüş
                  </div>
                </div>
              `;
            }
            
            
            
            if (headToHeadSurprise) {
              resultHtml += `
                <div class="p-4 ${matchingResult ? 'bg-blue-50' : 'bg-green-50'}">
                  <div class="text-center text-blue-700 font-medium">
                    İki takım arasında sürpriz olmuş
                    <span class="text-gray-600 ml-2">(Sürpriz Tarihi: ${convertExcelDate(headToHeadSurprise.Date)})</span>
            </div>
          </div>
        `;
            }

            if (surpriseDateInfo) {
              resultHtml += `
                <div class="p-4 ${headToHeadSurprise || matchingResult ? 'bg-purple-50' : 'bg-green-50'}">
                  <div class="text-center text-purple-700 font-medium">
                    ${surpriseDateInfo.message}
                    <span class="text-gray-600 ml-2">(Sürpriz Tarihi: ${surpriseDateInfo.date})</span>
                  </div>
                </div>
              `;
            }

            // Ay bazlı sürpriz analizi
            const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            const surprisesByMonth = team1Surprises.reduce((acc, match) => {
              // Excel tarihini JavaScript tarihine çevir
              const excelDate = Number(match.Date);
              const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
              const month = jsDate.getMonth();
              
              acc[month] = (acc[month] || 0) + 1;
              // Debug için eklenen loglar
              console.log('Sürpriz Maç:', {
                excelDate,
                jsDate: jsDate.toISOString(),
                month: monthNames[month],
                teams: `${match.HomeTeam} vs ${match.AwayTeam}`,
                htResult: match.HTR,
                ftResult: match.FTR
              });
              return acc;
            }, {} as { [key: number]: number });

            // Debug için eklenen log
            console.log('Aylara Göre Sürprizler:', Object.entries(surprisesByMonth).map(([month, count]) => ({
              month: monthNames[Number(month)],
              count
            })));

            // 2 veya daha fazla sürpriz olan ayları filtrele
            const frequentSurpriseMonths = Object.entries(surprisesByMonth)
              .filter(([_, count]) => count >= 2)
              .map(([month, count]) => ({
                month: monthNames[Number(month)],
                count
              }))
              .sort((a, b) => b.count - a.count);

            if (frequentSurpriseMonths.length > 0) {
              resultHtml += `
                <div class="p-4 bg-indigo-50">
                  <div class="text-center text-indigo-700 font-medium flex items-center justify-center gap-2">
                    ${frequentSurpriseMonths.map(m => `${m.month} ayında ${m.count} sürpriz`).join(', ')}
                    <div class="relative group">
                      <Info size={16} class="text-indigo-500 cursor-help" />
                      <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${(() => {
                          const today = new Date();
                          const currentMonth = today.getMonth();
                          const currentMonthName = monthNames[currentMonth];
                          
                          const currentMonthSurprises = team1Surprises.filter(match => {
                            const excelDate = Number(match.Date);
                            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                            return jsDate.getMonth() === currentMonth;
                          });

                          return currentMonthSurprises.length > 0 
                            ? `${currentMonthName} ayında ${currentMonthSurprises.length} sürpriz var`
                            : `${currentMonthName} ayında sürpriz yok`;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }

            // Sürpriz sıklığı analizi en sona ekleniyor
            const team1LastTenMatches = matchData
              .filter(m => m.HomeTeam === team1Name || m.AwayTeam === team1Name)
              .sort((a, b) => {
                const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                return dateB.getTime() - dateA.getTime();
              })
              .slice(0, 10);
            
            console.log('Team1 Son 10 Maç:', {
              team: team1Name,
              matches: team1LastTenMatches.map(m => ({
                date: convertExcelDate(m.Date),
                match: `${m.HomeTeam} vs ${m.AwayTeam}`,
                htResult: m.HTR,
                ftResult: m.FTR,
                isHome: m.HomeTeam === team1Name
              }))
            });

            const team1SurpriseCount = team1LastTenMatches.filter(m => {
              let isSurprise;
              if (analysisMode === 'classic') {
                // Classic mode: HTR: H, FTR: A veya HTR: A, FTR: H
                isSurprise = (m.HTR === "H" && m.FTR === "A") || (m.HTR === "A" && m.FTR === "H");
              } else {
                // Draw mode: HTR: H, FTR: D veya HTR: A, FTR: D
                isSurprise = (m.HTR === "H" && m.FTR === "D") || (m.HTR === "A" && m.FTR === "D");
              }
              console.log('Team1 Maç Kontrolü:', {
                match: `${m.HomeTeam} vs ${m.AwayTeam}`,
                isHome: m.HomeTeam === team1Name,
                htResult: m.HTR,
                ftResult: m.FTR,
                isSurprise,
                mode: analysisMode
              });
              return isSurprise;
            }).length;

            console.log('Team1 Sürpriz Sayısı:', team1SurpriseCount);

            if (team1SurpriseCount > 0) {
              resultHtml += `
                <div class="p-4 bg-rose-50 relative">
                  <div class="text-center text-rose-700 font-medium flex items-center justify-center gap-2">
                    Son 10 maçta ${team1SurpriseCount} sürpriz sonuç
                    <div class="relative group">
                      <svg class="w-4 h-4 text-rose-700 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                      </svg>
                      <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                        ${getCurrentMonthSurprises(team1Surprises)}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }
            
            return resultHtml;
          })()}
        </div>
      </div>
    `;

    analysis.team1Analysis.push(lastMatchesHtml);
  } else {
    analysis.team1Analysis.push(team1TriggerAnalysis.html);
  }

  // Aynı işlemi team2 için de yap
  const team2LastMatches = matchData
    .filter(m => m.HomeTeam === team2Name || m.AwayTeam === team2Name)
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
    .slice(0, 3);

  const team2LastMatchesHtml = `
    <div class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200 mt-4">
      <div class="divide-y divide-gray-100">
        ${team2LastMatches.map((match, index) => {
          const isHome = match.HomeTeam === team2Name;
          const opponent = isHome ? match.AwayTeam : match.HomeTeam;
          const score = `${match.FTHG}-${match.FTAG}`;
          
          let resultBgColor = 'bg-yellow-100';
          if ((isHome && match.FTR === 'H') || (!isHome && match.FTR === 'A')) {
            resultBgColor = 'bg-green-100';
          } else if ((isHome && match.FTR === 'A') || (!isHome && match.FTR === 'H')) {
            resultBgColor = 'bg-red-100';
          }

          // Sürpriz maç kontrolü
          let isSurprise = false;
          if (analysisMode === 'classic') {
            isSurprise = (match.HTR === "H" && match.FTR === "A") || (match.HTR === "A" && match.FTR === "H");
          } else {
            isSurprise = (match.HTR === "H" && match.FTR === "D") || (match.HTR === "A" && match.FTR === "D");
          }

          // Kırmızı kart kontrolü
          const hasRedCard = match.HR > 0 || match.AR > 0;
          const redCardIcon = hasRedCard ? `
            <div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ` : '';

          // Sürpriz maç ikonu
          const surpriseIcon = isSurprise ? `
            <div class="absolute -top-1 ${hasRedCard ? '-right-7' : '-right-1'} w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          ` : '';

          // En son maçtaki rakip için tetikleyici kontrolü
          let triggerWarning = '';
          if (index === 0) {
            const isLeagueTrigger = team2LeagueTrigger?.some(trigger => trigger.team === opponent);
            const isTeamTrigger = Object.entries(team2TriggerAnalysis.triggerCounts)
              .some(([team, data]) => team === opponent && data.matches.length >= 2);

            if (isLeagueTrigger || isTeamTrigger) {
              triggerWarning = `
                <div class="absolute -top-1 -left-1 group">
                  <div class="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
        </div>
                  <div class="absolute left-6 top-0 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    ${isLeagueTrigger ? 'Lig Tetikleyicisi' : 'Takım Tetikleyicisi'}
              </div>
              </div>
              `;
            }
          }

          // Rakip eşleşme analizi
          const matchingResult = findMatchingOpponents(team2LastMatches, team2Surprises, team2Name, matchData);
          const isMatchingOpponent = matchingResult?.matchingOpponents.includes(opponent);
          const matchingClass = isMatchingOpponent ? 'ring-2 ring-green-500' : '';
        
        return `
            <div class="p-4 hover:bg-opacity-90 transition-all duration-200">
              <div class="grid grid-cols-12 gap-4 items-center text-sm">
                <div class="col-span-2 font-medium text-gray-600 text-center">
                  ${convertExcelDate(match.Date)}
            </div>
                <div class="col-span-10 text-gray-800 ${resultBgColor} rounded-lg p-2 text-center shadow-sm relative ${matchingClass}">
                  ${redCardIcon}
                  ${surpriseIcon}
                  ${triggerWarning}
                  <div class="flex items-center justify-center gap-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-white p-1 shadow-sm">
                        <img
                          src="${getTeamLogo(match.HomeTeam)}"
                          alt="${match.HomeTeam}"
                          class="w-full h-full object-contain rounded-full"
                          onerror="this.src='${EMPTY_LOGO}'"
                        />
            </div>
                      <span class="font-medium">${match.HomeTeam}</span>
          </div>
                    <span class="font-bold text-lg px-3">${score}</span>
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-white p-1 shadow-sm">
                        <img
                          src="${getTeamLogo(match.AwayTeam)}"
                          alt="${match.AwayTeam}"
                          class="w-full h-full object-contain rounded-full"
                          onerror="this.src='${EMPTY_LOGO}'"
                        />
          </div>
                      <span class="font-medium">${match.AwayTeam}</span>
        </div>
                </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
        ${(() => {
          const matchingResult = findMatchingOpponents(team2LastMatches, team2Surprises, team2Name, matchData);
          const headToHeadSurprise = findHeadToHeadSurprises(matchData, team2Name, team1Name);
          
          let resultHtml = '';
          
          if (matchingResult && matchingResult.matchingCount > 0) {
            resultHtml += `
              <div class="p-4 bg-green-50">
                <div class="text-center text-green-700 font-medium">
                  ${matchingResult.matchingCount} Rakip eşleşiyor 
                  <span class="text-gray-600 ml-2">(Sürpriz Tarihi: ${convertExcelDate(matchingResult.surpriseDate)})</span>
          </div>
              </div>
            `;
          }
          
          // Dizilim analizi
          const patternAnalysis = findMatchingHomeAwayPattern(team2LastMatches, team2Surprises, team2Name, matchData);
          if (patternAnalysis.matchingPatterns.length > 0) {
            resultHtml += `
              <div class="p-4 bg-amber-50">
                <div class="text-center text-amber-700 font-medium">
                  Bu dizilim ${patternAnalysis.matchingPatterns.length} defa görülmüş
                </div>
              </div>
            `;
          }
          
        
          
          if (headToHeadSurprise) {
            resultHtml += `
              <div class="p-4 ${matchingResult ? 'bg-blue-50' : 'bg-green-50'}">
                <div class="text-center text-blue-700 font-medium">
                  İki takım arasında sürpriz olmuş
                  <span class="text-gray-600 ml-2">(Sürpriz Tarihi: ${convertExcelDate(headToHeadSurprise.Date)})</span>
            </div>
          </div>
            `;
          }

          // Ay bazlı sürpriz analizi
          const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
          const surprisesByMonth = team2Surprises.reduce((acc, match) => {
            // Excel tarihini JavaScript tarihine çevir
            const excelDate = Number(match.Date);
            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
            const month = jsDate.getMonth();
            
            acc[month] = (acc[month] || 0) + 1;
            return acc;
          }, {} as { [key: number]: number });

          // 2 veya daha fazla sürpriz olan ayları filtrele
          const frequentSurpriseMonths = Object.entries(surprisesByMonth)
            .filter(([_, count]) => count >= 2)
            .map(([month, count]) => ({
              month: monthNames[Number(month)],
              count
            }))
            .sort((a, b) => b.count - a.count);

          if (frequentSurpriseMonths.length > 0) {
            resultHtml += `
              <div class="p-4 bg-indigo-50">
                <div class="text-center text-indigo-700 font-medium flex items-center justify-center gap-2">
                  ${frequentSurpriseMonths.map(m => `${m.month} ayında ${m.count} sürpriz`).join(', ')}
                  <div class="relative group">
                    <Info size={16} class="text-rose-500 cursor-help" />
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentMonthName = monthNames[currentMonth];
                        
                        const currentMonthSurprises = team2Surprises.filter(match => {
                          const excelDate = Number(match.Date);
                          const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                          return jsDate.getMonth() === currentMonth;
                        });

                        return currentMonthSurprises.length > 0 
                          ? `${currentMonthName} ayında ${currentMonthSurprises.length} sürpriz var`
                          : `${currentMonthName} ayında sürpriz yok`;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }

          // Sürpriz sıklığı analizi en sona ekleniyor
          const team2LastTenMatches = matchData
            .filter(m => m.HomeTeam === team2Name || m.AwayTeam === team2Name)
            .sort((a, b) => {
              const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
              const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 10);
          
          console.log('Team2 Son 10 Maç:', {
            team: team2Name,
            matches: team2LastTenMatches.map(m => ({
              date: convertExcelDate(m.Date),
              match: `${m.HomeTeam} vs ${m.AwayTeam}`,
              htResult: m.HTR,
              ftResult: m.FTR,
              isHome: m.HomeTeam === team2Name
            }))
          });

          const team2SurpriseCount = team2LastTenMatches.filter(m => {
            let isSurprise;
            if (analysisMode === 'classic') {
              // Classic mode: HTR: H, FTR: A veya HTR: A, FTR: H
              isSurprise = (m.HTR === "H" && m.FTR === "A") || (m.HTR === "A" && m.FTR === "H");
            } else {
              // Draw mode: HTR: H, FTR: D veya HTR: A, FTR: D
              isSurprise = (m.HTR === "H" && m.FTR === "D") || (m.HTR === "A" && m.FTR === "D");
            }
            console.log('Team2 Maç Kontrolü:', {
              match: `${m.HomeTeam} vs ${m.AwayTeam}`,
              isHome: m.HomeTeam === team2Name,
              htResult: m.HTR,
              ftResult: m.FTR,
              isSurprise,
              mode: analysisMode
            });
            return isSurprise;
          }).length;

          console.log('Team2 Sürpriz Sayısı:', team2SurpriseCount);

          if (team2SurpriseCount > 0) {
            resultHtml += `
              <div class="p-4 bg-rose-50 relative">
                <div class="text-center text-rose-700 font-medium flex items-center justify-center gap-2">
                  Son 10 maçta ${team2SurpriseCount} sürpriz sonuç
                  <div class="relative group">
                    <svg class="w-4 h-4 text-rose-700 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
                    </svg>
                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
                      ${getCurrentMonthSurprises(team2Surprises)}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
          
          return resultHtml;
        })()}
          </div>
              </div>
  `;

  analysis.team2Analysis.push(team2TriggerAnalysis.html);
  analysis.team2Analysis.push(team2LastMatchesHtml);

  

  return analysis;
}

// Mevcut analiz fonksiyonunu yeniden adlandıralım
const findClassicSurpriseMatches = (matches: Match[]) => {
  return matches.filter(m => {
    // 1/2 senaryosu: İlk yarı H, maç sonu A
    const is12Scenario = m.HTR === "H" && m.FTR === "A";
    // 2/1 senaryosu: İlk yarı A, maç sonu H
    const is21Scenario = m.HTR === "A" && m.FTR === "H";
    return is12Scenario || is21Scenario;
  });
};

// Yeni beraberlik analiz fonksiyonu
const findDrawSurpriseMatches = (matches: Match[]) => {
  const surpriseMatches = matches.filter(m => {
    // 1/X senaryosu: İlk yarı H, maç sonu D
    const is1XScenario = m.HTR === "H" && m.FTR === "D";
    // 2/X senaryosu: İlk yarı A, maç sonu D
    const is2XScenario = m.HTR === "A" && m.FTR === "D";
    return is1XScenario || is2XScenario;
  });

  console.log('[Debug] Draw Mode Analysis:', {
    totalMatches: matches.length,
    surpriseMatches: surpriseMatches.length,
    scenarios: surpriseMatches.map(m => ({
      date: m.Date,
      homeTeam: m.HomeTeam,
      awayTeam: m.AwayTeam,
      htResult: m.HTR,
      ftResult: m.FTR,
      scenario: m.HTR === "H" ? "1/X" : "2/X"
    }))
  });

  return surpriseMatches;
};

// Rakipleri analiz et
const analyzeSurpriseOpponents = (matches: Match[], teamName: string) => {
  const opponents: { [key: string]: SurpriseOpponent } = {};
  
  matches.forEach(match => {
    const opponent = match.HomeTeam === teamName ? match.AwayTeam : match.HomeTeam;
    const isHome = match.HomeTeam === teamName;
    const score = `${match.FTHG}-${match.FTAG}`;
    const htScore = `${match.HTHG}-${match.HTAG}`;
    const formattedDate = convertExcelDate(match.Date);
    
    const matchDetails: MatchDetails = {
      score,
      htScore,
      date: formattedDate,
      opponent,
      isHome,
      redCards: match.RC || 0
    };
    
    if (!opponents[opponent]) {
      opponents[opponent] = {
        count: 0,
        lastMatch: matchDetails,
        allMatches: []
      };
    }
    
    opponents[opponent].count++;
    opponents[opponent].allMatches.push(matchDetails);
    
    // En son maçı güncelle
    const lastMatchDate = new Date(opponents[opponent].lastMatch.date.split('.').reverse().join('-'));
    const currentMatchDate = new Date(formattedDate.split('.').reverse().join('-'));
    if (currentMatchDate > lastMatchDate) {
      opponents[opponent].lastMatch = matchDetails;
    }
  });
  
  return opponents;
};

// Yeni tip tanımlamaları ekleyelim
interface SurpriseCalculation {
  homeTeam: string;
  awayTeam: string;
  homeForm?: string[];
  awayForm?: string[];
  homeLastMatches?: number;
  awayLastMatches?: number;
  // Yeni alanlar
  homeScores: string[];
  awayScores: string[];
  // Oran alanları
  homeOdds?: number;  // B365CH (Kapanış)
  awayOdds?: number;  // B365CA (Kapanış)
  drawOdds?: number;  // B365CD (Kapanış)
}

interface SurpriseCalculationResult {
  possibleScenarios: ('1/2' | '2/1' | '1/X' | '2/X')[];
  confidence: number;
  explanation: string;
  warnings?: string[];
}

// Twitter görsel oluşturucu bileşeni
const TwitterImageGenerator = ({ calculationResult, calculationData }) => {
  const canvasRef = useRef(null);

  const generateImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Canvas boyutları (Twitter için optimize)
    canvas.width = 1200;
    canvas.height = 675;

    // Arkaplan
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4F46E5');
    gradient.addColorStop(1, '#7C3AED');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Logo ve başlık
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sürpriz Analizi', canvas.width / 2, 80);

    // Takım isimleri
    ctx.font = 'bold 36px Arial';
    ctx.fillText(`${calculationData.homeTeam} vs ${calculationData.awayTeam}`, canvas.width / 2, 150);

    // Sürpriz potansiyeli
    ctx.font = 'bold 72px Arial';
    ctx.fillText(`%${calculationResult.confidence}`, canvas.width / 2, 300);
    ctx.font = '32px Arial';
    ctx.fillText('Sürpriz Potansiyeli', canvas.width / 2, 350);

    // En olası senaryo
    if (calculationResult.possibleScenarios.length > 0) {
      ctx.font = 'bold 48px Arial';
      ctx.fillText(calculationResult.possibleScenarios[0], canvas.width / 2, 450);
      ctx.font = '32px Arial';
      ctx.fillText('En Olası Senaryo', canvas.width / 2, 500);
    }

    // Alt bilgi
    ctx.font = '24px Arial';
    ctx.fillText('AI-TAHMIN2 | Powered by Cursor', canvas.width / 2, 620);

    return canvas.toDataURL('image/png');
  };

  const downloadImage = () => {
    const dataUrl = generateImage();
    const link = document.createElement('a');
    link.download = 'surpriz-analizi.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        onClick={downloadImage}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
      >
        <Image className="w-5 h-5" />
        Görsel Oluştur
      </button>
    </>
  );
};

// Sürpriz tarih kontrolü için yeni fonksiyon
function checkSurpriseDates(surpriseMatches: Match[]): { message: string; date: string } | null {
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDay = tomorrow.getDate();
  const tomorrowMonth = tomorrow.getMonth() + 1;

  for (const match of surpriseMatches) {
    const matchDate = new Date(match.Date);
    const matchDay = matchDate.getDate();
    const matchMonth = matchDate.getMonth() + 1;

    if (matchDay === todayDay && matchMonth === todayMonth) {
      return {
        message: "Bugün sürpriz günü!",
        date: convertExcelDate(match.Date)
      };
    }

    if (matchDay === tomorrowDay && matchMonth === tomorrowMonth) {
      return {
        message: "Yarın sürpriz günü!",
        date: convertExcelDate(match.Date)
      };
    }
  }

  return null;
}

export default function SpecialAnalysis({ matchData, teamData, selectedMatch }: SpecialAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'team1' | 'team2'>('team1');
  const [analysisData, setAnalysisData] = useState<TeamAnalysisData | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<{ [key: string]: number }>({});
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [showLastMatches, setShowLastMatches] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<string>('T1');
  const [selectedTeam1, setSelectedTeam1] = useState<string>('');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const lastMatchesRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'classic' | 'draw'>('classic');
  const [activeView, setActiveView] = useState<'analysis' | 'calculation' | 'todaysSurprises'>('analysis');
  const [calculationData, setCalculationData] = useState<SurpriseCalculation>({
    homeTeam: '',
    awayTeam: '',
    homeScores: [],
    awayScores: []
  });
  const [calculationResult, setCalculationResult] = useState<SurpriseCalculationResult | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [todaysSurprises, setTodaysSurprises] = useState<Match[]>([]);
  const [surpriseTypeFilter, setSurpriseTypeFilter] = useState<'classic' | 'draw' | 'none'>('none');

  // Ligleri yükle
  useEffect(() => {
    try {
      console.log('[Debug] Maç verileri:', matchData.length);
      
      // Benzersiz ligleri bul
      const uniqueLeagues = new Set<string>();
      matchData.forEach(match => {
        if (match.Div && LEAGUE_NAMES[match.Div]) {
          uniqueLeagues.add(match.Div);
        }
      });

      console.log('[Debug] Bulunan benzersiz ligler:', Array.from(uniqueLeagues));

      const leagueList: League[] = Array.from(uniqueLeagues)
        .map(id => ({
          id,
          name: LEAGUE_NAMES[id] || id
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      console.log('[Debug] Oluşturulan lig listesi:', leagueList);
      setLeagues(leagueList);
      setLoading(false);
    } catch (error) {
      console.error('Ligler yüklenirken hata:', error);
      setError('Ligler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
  }, [matchData]);

  // Seçili lige göre takımları filtrele
  useEffect(() => {
    if (selectedLeague) {
      try {
        // Seçilen ligdeki tüm takımları bul
        const leagueMatches = matchData.filter(match => match.Div === selectedLeague);
        const allTeams = new Set<string>();
        
        leagueMatches.forEach(match => {
          if (match.HomeTeam) allTeams.add(match.HomeTeam);
          if (match.AwayTeam) allTeams.add(match.AwayTeam);
        });

        const teamList: Team[] = Array.from(allTeams)
          .map(name => ({
            id: name,
            name,
            league: selectedLeague
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        console.log(`[Debug] ${selectedLeague} ligi için takım listesi:`, teamList);
        setTeams(teamList);
      } catch (error) {
        console.error('Takımlar yüklenirken hata:', error);
        setError('Takımlar yüklenirken bir hata oluştu.');
      }
    }
  }, [selectedLeague, matchData]);

  // Rakipleri analiz et
  const analyzeSurpriseOpponents = (matches: Match[], teamName: string) => {
    const opponents: { [key: string]: SurpriseOpponent } = {};
    
    matches.forEach(match => {
      const opponent = match.HomeTeam === teamName ? match.AwayTeam : match.HomeTeam;
      const isHome = match.HomeTeam === teamName;
      const score = `${match.FTHG}-${match.FTAG}`;
      const htScore = `${match.HTHG}-${match.HTAG}`;
      const formattedDate = convertExcelDate(match.Date);
      
      const matchDetails: MatchDetails = {
        score,
        htScore,
        date: formattedDate,
        opponent,
        isHome,
        redCards: match.RC || 0
      };
      
      if (!opponents[opponent]) {
        opponents[opponent] = {
          count: 0,
          lastMatch: matchDetails,
          allMatches: []
        };
      }
      
      opponents[opponent].count++;
      opponents[opponent].allMatches.push(matchDetails);
      
      // En son maçı güncelle
      const lastMatchDate = new Date(opponents[opponent].lastMatch.date.split('.').reverse().join('-'));
      const currentMatchDate = new Date(formattedDate.split('.').reverse().join('-'));
      if (currentMatchDate > lastMatchDate) {
        opponents[opponent].lastMatch = matchDetails;
      }
    });
    
    return opponents;
  };

  // Takım seçildiğinde analizi güncelle
  useEffect(() => {
    const updateTeamAnalysis = (teamName: string) => {
      if (!teamName) return null;

      // Seçilen takımın tüm maçlarını filtrele
      const teamMatches = matchData.filter(m => 
        m.HomeTeam === teamName || m.AwayTeam === teamName
      );

      // Seçilen moda göre analiz fonksiyonunu belirle
      const findSurpriseMatches = analysisMode === 'classic' 
        ? findClassicSurpriseMatches 
        : findDrawSurpriseMatches;

      // Sürpriz senaryoları bul
      const surpriseMatches = findSurpriseMatches(teamMatches);

      console.log(`[Debug] ${teamName} Analysis:`, {
        mode: analysisMode,
        totalMatches: teamMatches.length,
        surpriseMatches: surpriseMatches.length,
        scenarios: surpriseMatches.map(m => ({
          date: m.Date,
          homeTeam: m.HomeTeam,
          awayTeam: m.AwayTeam,
          htResult: m.HTR,
          ftResult: m.FTR,
          scenario: analysisMode === 'draw' ? (m.HTR === "H" ? "1/X" : "2/X") : (m.HTR === "A" ? "2/1" : "1/2")
        }))
      });

      return {
        surpriseOpponents: analyzeSurpriseOpponents(surpriseMatches, teamName),
        preSurpriseScores: analyzePreSurpriseScores(teamMatches, surpriseMatches),
        redCardImpact: analyzeRedCardImpact(surpriseMatches),
        lastThreeMatches: surpriseMatches.slice(0, 3).map(m => ({
          score: `${m.FTHG}-${m.FTAG}`,
          htScore: `${m.HTHG}-${m.HTAG}`,
          date: convertExcelDate(m.Date),
          opponent: m.HomeTeam === teamName ? m.AwayTeam : m.HomeTeam,
          isHome: m.HomeTeam === teamName,
          redCards: m.RC || 0
        }))
      };
    };

    const team1Analysis = updateTeamAnalysis(selectedTeam1);
    const team2Analysis = updateTeamAnalysis(selectedTeam2);

    if (team1Analysis || team2Analysis) {
      setAnalysisData({
        homeTeam: team1Analysis || {
          surpriseOpponents: {},
          preSurpriseScores: {},
          redCardImpact: {},
          lastThreeMatches: []
        },
        awayTeam: team2Analysis || {
          surpriseOpponents: {},
          preSurpriseScores: {},
          redCardImpact: {},
          lastThreeMatches: []
        },
        similarOddsMatches: [],
        aiAnalysis: createAIAnalysis(
          team1Analysis ? (analysisMode === 'classic' ? findClassicSurpriseMatches : findDrawSurpriseMatches)(matchData.filter(m => m.HomeTeam === selectedTeam1 || m.AwayTeam === selectedTeam1)) : [],
          team2Analysis ? (analysisMode === 'classic' ? findClassicSurpriseMatches : findDrawSurpriseMatches)(matchData.filter(m => m.HomeTeam === selectedTeam2 || m.AwayTeam === selectedTeam2)) : [],
          team1Analysis?.preSurpriseScores || {},
          team2Analysis?.preSurpriseScores || {},
          selectedTeam1,
          selectedTeam2,
          matchData,
          analysisMode
        )
      });
    }
  }, [selectedTeam1, selectedTeam2, matchData, analysisMode]);

  // Seçilen maç değiştiğinde hesaplama verilerini güncelle
  useEffect(() => {
    if (selectedMatch) {
      setCalculationData(prev => ({
        ...prev,
        homeTeam: selectedMatch.HomeTeam,
        awayTeam: selectedMatch.AwayTeam,
        homeOdds: selectedMatch.B365CH,  // Kapanış oranı
        drawOdds: selectedMatch.B365CD,   // Kapanış oranı
        awayOdds: selectedMatch.B365CA    // Kapanış oranı
      }));
    }
  }, [selectedMatch]);

  // Kompakt takım seçim arayüzü
  const renderTeamSelectionCompact = () => (
    <div className={`bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg transition-all duration-300 z-50 ${
      showTeamSelection ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
    }`}>
      <div className="grid grid-cols-3 gap-4 items-center">
        <div className="relative z-50">
          <select
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={selectedLeague}
            onChange={(e) => {
              setSelectedLeague(e.target.value);
              setSelectedTeam1('');
              setSelectedTeam2('');
            }}
          >
            <option value="">Lig Seçin</option>
            {leagues.map(league => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative z-50">
          <select
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={selectedTeam1}
            onChange={(e) => setSelectedTeam1(e.target.value)}
            disabled={!selectedLeague}
          >
            <option value="">Takım 1</option>
            {teams.map(team => (
              <option key={`team1-${team.id}`} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative z-50">
          <select
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={selectedTeam2}
            onChange={(e) => setSelectedTeam2(e.target.value)}
            disabled={!selectedLeague}
          >
            <option value="">Takım 2</option>
            {teams.map(team => (
              <option key={`team2-${team.id}`} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  // Sürpriz hesaplama fonksiyonu
  const calculateSurprisePotential = (data: SurpriseCalculation): SurpriseCalculationResult => {
    const result: SurpriseCalculationResult = {
      possibleScenarios: [],
      confidence: 0,
      explanation: '',
      warnings: []
    };

    // Oranları analiz et
    if (data.homeOdds && data.awayOdds && data.drawOdds) {
      // Toplam oran analizi
      const totalOdds = data.homeOdds + data.awayOdds + data.drawOdds;
      
      // Favori takımı belirle
      const isFavoriteHome = data.homeOdds < data.awayOdds;
      const favoriteOdd = Math.min(data.homeOdds, data.awayOdds);
      
      // Favori takımın oranı yüksekse sürpriz potansiyeli artar
      if (favoriteOdd > 2.0) {
        result.confidence += 15;
        result.explanation += "Favori takımın oranı yüksek, sürpriz potansiyeli artıyor. ";
      }

      // Beraberlik oranı analizi
      if (data.drawOdds < 3.5) {
        result.confidence += 10;
        result.explanation += "Düşük beraberlik oranı, beraberlikle bitme potansiyeli yüksek. ";
      }

      // Dengesiz oranlar analizi
      const oddsDifference = Math.abs(data.homeOdds - data.awayOdds);
      if (oddsDifference > 1.5) {
        result.confidence += 20;
        result.explanation += "Takımlar arası oran farkı yüksek, sürpriz potansiyeli artıyor. ";
      }
    }

    // Mevcut analizler devam ediyor...
    const homeTeamMatches = matchData.filter(m => 
      m.HomeTeam === data.homeTeam || m.AwayTeam === data.homeTeam
    );
    const awayTeamMatches = matchData.filter(m => 
      m.HomeTeam === data.awayTeam || m.AwayTeam === data.awayTeam
    );

    // Her iki takımın sürpriz istatistiklerini hesapla
    const homeClassicSurprises = findClassicSurpriseMatches(homeTeamMatches);
    const homeDrawSurprises = findDrawSurpriseMatches(homeTeamMatches);
    const awayClassicSurprises = findClassicSurpriseMatches(awayTeamMatches);
    const awayDrawSurprises = findDrawSurpriseMatches(awayTeamMatches);

    // Gol ortalamaları analizi
    if (data.homeScores.length > 0 && data.awayScores.length > 0) {
      const totalGoals = data.homeScores.length + data.awayScores.length;
      if (totalGoals > 4) {
        result.confidence += 15;
        result.explanation += "Her iki takımın da gol ortalaması yüksek, sürpriz potansiyeli artıyor. ";
      } else if (totalGoals < 2) {
        result.confidence -= 10;
        result.warnings?.push("Düşük gol ortalamaları sürpriz ihtimalini azaltabilir.");
      }
    }

    // Yenilen gol ortalamaları analizi
    if (data.homeScores.length > 0 && data.awayScores.length > 0) {
      const totalConceded = data.homeScores.length + data.awayScores.length;
      if (totalConceded > 3) {
        result.confidence += 20;
        result.explanation += "Savunma zaafiyetleri sürpriz potansiyelini artırıyor. ";
      }
    }

    // Form analizi
    if (data.homeForm && data.homeForm.length > 0) {
      const homeWins = data.homeForm.filter(r => r === 'G').length;
      const homeLosses = data.homeForm.filter(r => r === 'M').length;
      if (homeWins >= 2) {
        result.confidence += 10;
        result.explanation += "Ev sahibi iyi formda. ";
      } else if (homeLosses >= 2) {
        result.confidence += 15;
        result.explanation += "Ev sahibinin kötü formu sürpriz potansiyelini artırıyor. ";
      }
    }

    // Sürpriz senaryolarını belirle
    if (homeClassicSurprises.length > awayClassicSurprises.length) {
      result.possibleScenarios.push('2/1');
      result.confidence += 15;
    }
    if (awayClassicSurprises.length > homeClassicSurprises.length) {
      result.possibleScenarios.push('1/2');
      result.confidence += 15;
    }
    if (homeDrawSurprises.length > 0) {
      result.possibleScenarios.push('1/X');
      result.confidence += 10;
    }
    if (awayDrawSurprises.length > 0) {
      result.possibleScenarios.push('2/X');
      result.confidence += 10;
    }

    // Son maçları kontrol et
    if (data.homeLastMatches && data.homeLastMatches > 2) {
      result.confidence -= 10;
      result.warnings?.push("Ev sahibi son maçlarda çok fazla sürpriz yaptı, dikkatli olun.");
    }
    if (data.awayLastMatches && data.awayLastMatches > 2) {
      result.confidence -= 10;
      result.warnings?.push("Deplasman takımı son maçlarda çok fazla sürpriz yaptı, dikkatli olun.");
    }

    // Sonuçları normalize et
    result.confidence = Math.max(0, Math.min(100, result.confidence));
    
    if (result.confidence < 30) {
      result.explanation = "Bu maçta sürpriz potansiyeli oldukça düşük görünüyor. " + result.explanation;
    } else if (result.confidence > 70) {
      result.explanation = "Bu maçta yüksek sürpriz potansiyeli var! " + result.explanation;
    } else {
      result.explanation = "Bu maçta orta seviyede sürpriz potansiyeli var. " + result.explanation;
    }

    return result;
  };

  // Skor seçenekleri için sabit tanımlamalar
  const SCORE_OPTIONS = {
    lowScoring: [
      '0-0', '0-1', '1-0', '1-1',
      '0-2', '2-0'
    ],
    mediumScoring: [
      '2-1', '1-2', '2-2',
      '3-0', '0-3', '3-1', '1-3'
    ],
    highScoring: [
      '3-2', '2-3', '3-3',
      '4-0', '0-4', '4-1', '1-4',
      '4-2', '2-4', '4-3', '3-4'
    ]
  };

  // Lig seçimi için bileşen
  const LeagueSelector = ({ selectedLeague, onLeagueChange }) => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
        Lig Seçin
      </label>
      <select
        value={selectedLeague}
        onChange={(e) => onLeagueChange(e.target.value)}
        className="w-full p-3 rounded-lg border 
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          border-gray-200 dark:border-gray-700
          hover:border-blue-500 dark:hover:border-blue-500
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors duration-200"
      >
        <option value="">Lig Seçin</option>
        {leagues.map(league => (
          <option key={league.id} value={league.id}>
            {league.name}
          </option>
        ))}
      </select>
    </div>
  );

  // Skor seçici bileşeni
  const ScoreSelector = ({ onScoreSelect, selectedScores = [], onScoreRemove }) => {
    const [activeMenu, setActiveMenu] = useState(null);
    const menuRef = useRef(null);

    // Menü dışına tıklandığında menüyü kapat
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setActiveMenu(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="space-y-2" ref={menuRef}>
        <div className="flex flex-wrap gap-2">
          {/* Düşük Skorlar */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'low' ? null : 'low')}
              className={`px-3 py-1 ${
                activeMenu === 'low' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } rounded-md text-sm transition-colors`}
            >
              Düşük Skorlar
            </button>
            {activeMenu === 'low' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg p-2 flex flex-wrap gap-1 z-50 w-48">
                {SCORE_OPTIONS.lowScoring.map(score => (
                  <button
                    key={score}
                    onClick={() => {
                      onScoreSelect(score);
                      setActiveMenu(null);
                    }}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-xs"
                  >
                    {score}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Orta Skorlar */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'medium' ? null : 'medium')}
              className={`px-3 py-1 ${
                activeMenu === 'medium' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } rounded-md text-sm transition-colors`}
            >
              Orta Skorlar
            </button>
            {activeMenu === 'medium' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg p-2 flex flex-wrap gap-1 z-50 w-48">
                {SCORE_OPTIONS.mediumScoring.map(score => (
                  <button
                    key={score}
                    onClick={() => {
                      onScoreSelect(score);
                      setActiveMenu(null);
                    }}
                    className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded text-xs"
                  >
                    {score}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Yüksek Skorlar */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'high' ? null : 'high')}
              className={`px-3 py-1 ${
                activeMenu === 'high' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } rounded-md text-sm transition-colors`}
            >
              Yüksek Skorlar
            </button>
            {activeMenu === 'high' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg p-2 flex flex-wrap gap-1 z-50 w-48">
                {SCORE_OPTIONS.highScoring.map(score => (
                  <button
                    key={score}
                    onClick={() => {
                      onScoreSelect(score);
                      setActiveMenu(null);
                    }}
                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded text-xs"
                  >
                    {score}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedScores.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-gray-500 mb-2">Seçilen Skorlar:</div>
            <div className="flex flex-wrap gap-2">
              {selectedScores.map((score, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                    <span className="text-sm text-gray-700">{score}</span>
                    <button
                      onClick={() => onScoreRemove(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {index === 0 ? 'En Eski Maç' : index === 1 ? 'Orta Maç' : 'En Yeni Maç'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Hesaplama sekmesi render fonksiyonu
  const renderCalculationTab = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-500" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Kapanış Oranları</h3>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Oranlar Girişi */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ev Sahibi Oranı (Bet365 Kapanış)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={calculationData.homeOdds || ''}
              onChange={(e) => setCalculationData(prev => ({
                ...prev,
                homeOdds: parseFloat(e.target.value)
              }))}
              placeholder="Örn: 1.85"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beraberlik Oranı (Bet365 Kapanış)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={calculationData.drawOdds || ''}
              onChange={(e) => setCalculationData(prev => ({
                ...prev,
                drawOdds: parseFloat(e.target.value)
              }))}
              placeholder="Örn: 3.40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deplasman Oranı (Bet365 Kapanış)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={calculationData.awayOdds || ''}
              onChange={(e) => setCalculationData(prev => ({
                ...prev,
                awayOdds: parseFloat(e.target.value)
              }))}
              placeholder="Örn: 4.20"
            />
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setCalculationData({
              homeTeam: '',
              awayTeam: '',
              homeScores: [],
              awayScores: [],
              homeForm: [],
              awayForm: [],
              homeOdds: undefined,
              drawOdds: undefined,
              awayOdds: undefined
            })}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Sıfırla
          </button>
          <button
            onClick={() => {
              if (calculationData.homeOdds && calculationData.drawOdds && calculationData.awayOdds) {
                const result = calculateSurprisePotential(calculationData);
                setCalculationResult(result);
              }
            }}
            disabled={!calculationData.homeOdds || !calculationData.drawOdds || !calculationData.awayOdds}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hesapla
          </button>
        </div>

        {/* Eşleşen Maçlar */}
        {calculationData.homeOdds && calculationData.drawOdds && calculationData.awayOdds && (
          <div className="mt-6">
            {/* Sütun Başlıkları */}
            <div className="mb-2 p-3 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-between text-white">
              <div className="text-sm font-medium w-24">Tarih</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-[250px] text-center font-medium">Ev Sahibi</div>
                <div className="w-[120px] text-center font-medium">Skor</div>
                <div className="w-[250px] text-center font-medium">Deplasman</div>
              </div>
              <div className="w-20 text-center font-medium">Senaryo</div>
            </div>

            {matchData
              .filter(match => 
                Number(match.B365CH) === calculationData.homeOdds &&
                Number(match.B365CD) === calculationData.drawOdds &&
                Number(match.B365CA) === calculationData.awayOdds
              )
              .sort((a, b) => {
                const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                return dateB.getTime() - dateA.getTime();
              })
              .map((match, index) => {
                // Senaryo belirleme
                let scenario = '';
                let scenarioColor = '';
                if (match.HTR === 'H' && match.FTR === 'A') {
                  scenario = '1/2';
                  scenarioColor = 'bg-rose-100 text-rose-800 border-rose-200';
                } else if (match.HTR === 'A' && match.FTR === 'H') {
                  scenario = '2/1';
                  scenarioColor = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                } else if (match.HTR === 'H' && match.FTR === 'D') {
                  scenario = '1/X';
                  scenarioColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                } else if (match.HTR === 'A' && match.FTR === 'D') {
                  scenario = '2/X';
                  scenarioColor = 'bg-amber-100 text-amber-800 border-amber-200';
                } else if (match.HTR === 'D' && match.FTR === 'H') {
                  scenario = 'X/1';
                  scenarioColor = 'bg-blue-100 text-blue-800 border-blue-200';
                } else if (match.HTR === 'D' && match.FTR === 'A') {
                  scenario = 'X/2';
                  scenarioColor = 'bg-purple-100 text-purple-800 border-purple-200';
                } else if (match.HTR === 'H' && match.FTR === 'H') {
                  scenario = '1/1';
                  scenarioColor = 'bg-teal-100 text-teal-800 border-teal-200';
                } else if (match.HTR === 'A' && match.FTR === 'A') {
                  scenario = '2/2';
                  scenarioColor = 'bg-pink-100 text-pink-800 border-pink-200';
                } else if (match.HTR === 'D' && match.FTR === 'D') {
                  scenario = 'X/X';
                  scenarioColor = 'bg-slate-100 text-slate-800 border-slate-200';
                }

                return (
                  <div 
                    key={index} 
                    className="mb-2 p-3 bg-green-100 border border-green-300 rounded-lg flex items-center justify-between"
                  >
                    <div className="text-sm text-gray-600 w-24">
                      {convertExcelDate(match.Date)}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-[250px] flex items-center justify-center gap-2">
                        <img
                          src={getTeamLogo(match.HomeTeam)}
                          alt={match.HomeTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = EMPTY_LOGO;
                          }}
                        />
                        <span className="font-bold text-gray-800">{match.HomeTeam}</span>
                      </div>
                      <div className="w-[120px] flex flex-col items-center">
                        <span className="font-bold text-gray-800">{match.FTHG}-{match.FTAG}</span>
                        <span className="text-sm text-gray-600">({match.HTHG}-{match.HTAG})</span>
                      </div>
                      <div className="w-[250px] flex items-center justify-center gap-2">
                        <span className="font-bold text-gray-800">{match.AwayTeam}</span>
                        <img
                          src={getTeamLogo(match.AwayTeam)}
                          alt={match.AwayTeam}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = EMPTY_LOGO;
                          }}
                        />
                      </div>
                    </div>
                    {scenario && (
                      <div className="w-20 flex justify-center">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${scenarioColor}`}>
                          {scenario}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );

  // Add function to find today's surprises
  const findTodaysSurprises = () => {
    const today = new Date(); // Sistemden tarihi al
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    console.log(`[Debug] Searching for surprises on: ${currentDay}/${currentMonth}/${currentYear}`);
    console.log(`[Debug] Total matches in data:`, matchData.length);

    // Önce tüm maçların tarihlerini kontrol edelim
    const allDates = matchData.map(match => {
      const matchDate = new Date(match.Date);
      return {
        original: match.Date,
        day: matchDate.getDate(),
        month: matchDate.getMonth() + 1,
        converted: `${matchDate.getDate()}/${matchDate.getMonth() + 1}`
      };
    });

    console.log(`[Debug] Sample of dates in data:`, allDates.slice(0, 5));

    const surprises = matchData.filter(match => {
      let matchDate;
      
      // Excel tarihini kontrol et
      if (typeof match.Date === 'number') {
        // Excel tarihi sayı ise
        const excelDate = new Date(1900, 0, match.Date - 1);
        matchDate = excelDate;
      } else {
        // String ise direkt parse et
        matchDate = new Date(match.Date);
      }

      const matchDay = matchDate.getDate();
      const matchMonth = matchDate.getMonth() + 1;

      console.log(`[Debug] Comparing match date: ${matchDay}/${matchMonth} with current: ${currentDay}/${currentMonth}`);

      if (matchDay === currentDay && matchMonth === currentMonth) {
        console.log(`[Debug] Found match on same day/month:`, match);
        
        if (surpriseTypeFilter === 'classic') {
          const isClassicSurprise = (match.HTR === "H" && match.FTR === "A") || // 1/2
                                   (match.HTR === "A" && match.FTR === "H");     // 2/1
          if (isClassicSurprise) {
            console.log(`[Debug] Classic surprise found:`, match);
          }
          return isClassicSurprise;
        } else if (surpriseTypeFilter === 'draw') {
          const isDrawSurprise = (match.HTR === "H" && match.FTR === "D") || // 1/X
                                (match.HTR === "A" && match.FTR === "D");     // 2/X
          if (isDrawSurprise) {
            console.log(`[Debug] Draw surprise found:`, match);
          }
          return isDrawSurprise;
        }
      }
      return false;
    });

    console.log(`[Debug] Found ${surprises.length} surprises with filter: ${surpriseTypeFilter}`);
    setTodaysSurprises(surprises);
  };

  // Add formatDate helper function
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const monthNames = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    
    return `${day} ${monthNames[month - 1]} ${year}`;
  };

  // Add render function for today's surprises view
  const renderTodaysSurprises = () => (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="text-purple-500" size={24} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">Bugünün Sürprizleri</h3>
              <p className="text-sm text-gray-500 mt-1">{formatDate(new Date())}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={surpriseTypeFilter === 'classic'}
                  onChange={() => setSurpriseTypeFilter(prev => 
                    prev === 'classic' ? 'none' : 'classic'
                  )}
                  className="form-checkbox h-4 w-4 text-purple-600"
                />
                <span className="text-sm text-gray-700">1/2 & 2/1</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={surpriseTypeFilter === 'draw'}
                  onChange={() => setSurpriseTypeFilter(prev => 
                    prev === 'draw' ? 'none' : 'draw'
                  )}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">1/X & 2/X</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={findTodaysSurprises}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Hesapla
              </button>
              <button
                onClick={() => {
                  setTodaysSurprises([]);
                  setSurpriseTypeFilter('none');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Sıfırla
              </button>
            </div>
          </div>
        </div>

        {todaysSurprises.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sürpriz Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lig
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ev Sahibi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deplasman
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maç Skoru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İlk Yarı Skoru
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Senaryo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todaysSurprises.map((match, index) => {
                  const scenario = 
                    match.HTR === "H" && match.FTR === "A" ? "1/2" :
                    match.HTR === "A" && match.FTR === "H" ? "2/1" :
                    match.HTR === "H" && match.FTR === "D" ? "1/X" : "2/X";
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {convertExcelDate(match.Date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {LEAGUE_NAMES[match.Div] || match.Div}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TeamLogo name={match.HomeTeam} className="w-6 h-6" />
                          <span className="text-sm text-gray-900">{match.HomeTeam}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TeamLogo name={match.AwayTeam} className="w-6 h-6" />
                          <span className="text-sm text-gray-900">{match.AwayTeam}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.FTHG}-{match.FTAG}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.HTHG}-{match.HTAG}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                          scenario === "1/2" ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          scenario === "2/1" ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          scenario === "1/X" ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        } transform transition-transform hover:scale-105`}>
                          {scenario}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Bugünün tarihinde geçmiş sezonlarda gerçekleşen sürpriz bulunamadı.
          </div>
        )}
      </div>
    </div>
  );

  const getCurrentMonthSurprises = (surprises: any[]) => {
    const currentMonth = new Date().getMonth();
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    
    const currentMonthSurprises = surprises.filter(surprise => {
      const surpriseDate = new Date(surprise.date);
      return surpriseDate.getMonth() === currentMonth;
    });

    return currentMonthSurprises.length > 0 
      ? `${monthNames[currentMonth]} ayında ${currentMonthSurprises.length} sürpriz var`
      : `${monthNames[currentMonth]} ayında sürpriz yok`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl w-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-2xl font-bold text-white">Özel Analiz</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 bg-white/10 p-2 rounded-lg">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  analysisMode === 'classic' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white/80'
                }`}>
                  <Trophy size={16} className={analysisMode === 'classic' ? 'text-yellow-300' : 'text-white/60'} />
                  <span className="text-sm font-medium">2/1 - 1/2</span>
                </div>
                <button
                  onClick={() => setAnalysisMode(prev => prev === 'classic' ? 'draw' : 'classic')}
                  className={`relative w-14 h-7 rounded-full p-1 transition-colors ${
                    analysisMode === 'draw' ? 'bg-green-500/50' : 'bg-white/20'
                  } hover:bg-opacity-75`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                      analysisMode === 'draw' ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  analysisMode === 'draw' ? 'bg-green-500/30 text-white' : 'text-white/60 hover:text-white/80'
                }`}>
                  <Scale size={16} className={analysisMode === 'draw' ? 'text-green-300' : 'text-white/60'} />
                  <span className="text-sm font-medium">1/X - 2/X</span>
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeView === 'analysis'
                  ? 'bg-white text-blue-600'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Analiz
            </button>
            <button
              onClick={() => setActiveView('calculation')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeView === 'calculation'
                  ? 'bg-white text-blue-600'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sürpriz Hesaplama
            </button>
            <button
              onClick={() => setActiveView('todaysSurprises')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeView === 'todaysSurprises'
                  ? 'bg-white text-blue-600'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Bugünün Sürprizleri
            </button>
          </div>
        </div>

        {activeView === 'analysis' && (
          <>
            <div className="mt-4 flex items-center justify-between text-white/90">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('team1')}
                  className={`flex flex-col items-center transition-all ${
                    activeTab === 'team1' ? 'scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <TeamLogo name={selectedTeam1} className="w-16 h-16" />
                  <span className="mt-2 font-medium">{selectedTeam1}</span>
                </button>
                <span className="text-2xl font-bold">ve</span>
                <button
                  onClick={() => setActiveTab('team2')}
                  className={`flex flex-col items-center transition-all ${
                    activeTab === 'team2' ? 'scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <TeamLogo name={selectedTeam2} className="w-16 h-16" />
                  <span className="mt-2 font-medium">{selectedTeam2}</span>
                </button>
              </div>
              <div className="text-right">
                <button
                  onClick={() => setShowTeamSelection(prev => !prev)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {showTeamSelection ? 'Seçimi Gizle' : 'Takımları Değiştir'}
                </button>
              </div>
            </div>
            <div className="absolute left-0 right-0 top-full z-[100] px-6 py-4">
              {renderTeamSelectionCompact()}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {activeView === 'analysis' ? (
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Sol Taraf - Takım 1 Analizi */}
            <div 
              onClick={() => setActiveTab('team1')}
              className={`transition-all duration-300 transform ${
                activeTab === 'team1' 
                  ? 'opacity-100 scale-105 shadow-xl translate-y-[-8px] bg-white z-10' 
                  : 'opacity-65 scale-95 cursor-not-allowed pointer-events-none'
              }`}
            >
              {selectedTeam1 ? (
                <TeamAnalysisPanel
                  team={selectedTeam1}
                  data={analysisData?.homeTeam}
                  isHome={true}
                  teamData={teamData}
                  activeTab={activeTab}
                  match={selectedMatch}
                  matchData={matchData}
                  analysisMode={analysisMode}
                />
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400">
                  Lütfen Takım 1'i seçin
                </div>
              )}
            </div>

            {/* Sağ Taraf - Takım 2 Analizi */}
            <div 
              onClick={() => setActiveTab('team2')}
              className={`transition-all duration-300 transform ${
                activeTab === 'team2' 
                  ? 'opacity-100 scale-105 shadow-xl translate-y-[-8px] bg-white z-10' 
                  : 'opacity-65 scale-95 cursor-not-allowed pointer-events-none'
              }`}
            >
              {selectedTeam2 ? (
                <TeamAnalysisPanel
                  team={selectedTeam2}
                  data={analysisData?.awayTeam}
                  isHome={false}
                  teamData={teamData}
                  activeTab={activeTab}
                  match={selectedMatch}
                  matchData={matchData}
                  analysisMode={analysisMode}
                />
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400">
                  Lütfen Takım 2'yi seçin
                </div>
              )}
            </div>
          </div>

          {/* AI Analizi */}
          {(selectedTeam1 || selectedTeam2) && (
            <div className="p-6">
              <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 p-6 border-b border-blue-100">
                  <Brain className="text-blue-600 animate-pulse" size={28} />
                  <h3 className="text-xl font-bold text-gray-800">Yapay Zeka Analizi</h3>
                </div>
                
                {analysisData?.aiAnalysis && (
                  <div className="p-6">
                    {/* Ana Grid Layout */}
                    <div className="grid grid-cols-2 gap-8">
                      {/* Sol Panel - Takım 1 */}
                      {selectedTeam1 && (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-4">
                            <div className="flex items-center gap-4">
                              <TeamLogo name={selectedTeam1} className="w-12 h-12" />
                              <h4 className="text-lg font-bold text-white">{selectedTeam1} Detaylı Analiz</h4>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            {analysisData.aiAnalysis.team1Analysis.map((analysis, index) => (
                              <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                                <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sağ Panel - Takım 2 */}
                      {selectedTeam2 && (
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-4">
                            <div className="flex items-center gap-4">
                              <TeamLogo name={selectedTeam2} className="w-12 h-12" />
                              <h4 className="text-lg font-bold text-white">{selectedTeam2} Detaylı Analiz</h4>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            {analysisData.aiAnalysis.team2Analysis.map((analysis, index) => (
                              <div key={index} className="pb-4 border-b border-gray-100 last:border-0">
                                <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: analysis }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : activeView === 'calculation' ? (
        renderCalculationTab()
      ) : (
        renderTodaysSurprises()
      )}
    </div>
  );
}