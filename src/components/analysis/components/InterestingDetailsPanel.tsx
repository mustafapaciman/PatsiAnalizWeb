import React, { useState, useEffect } from 'react';
import { TeamLogo } from '../../TeamLogo';
import { WeekAnalysisModal } from './WeekAnalysisModal';
import { Goal } from 'lucide-react';
import { ScoreAnalysisModal } from '../ScoreAnalysisModal';
import { Match } from '../../../utils/types/match';
import { NextDaySurpriseModal } from '../NextDaySurpriseModal';
import { CalendarDays } from 'lucide-react';
import { FormulaSearchModal } from '../FormulaSearchModal';
import { Calculator } from 'lucide-react'; // Yeni icon import

interface InterestingDetailsPanelProps {
    matchData: Match[];
    selectedLeague: string;
    currentTeam: string;
    formatDate: (excelDate: number) => string;
    lastOpponent: string;
}

// Analiz sonuçları için interface
interface AnalysisResults {
    league: string;
    lastUpdated: string;
    dayBasedPatterns: ReturnType<typeof findDayBasedPatterns>;
    scoreBasedPatterns: ReturnType<typeof findScoreBasedPatterns>;
    combinationPatterns: ReturnType<typeof findCombinationPatterns>;
}

export const InterestingDetailsPanel: React.FC<InterestingDetailsPanelProps> = ({
    matchData,
    selectedLeague,
    currentTeam,
    formatDate,
    lastOpponent
}) => {
    const [openPanels, setOpenPanels] = useState({
        interesting: false,
        uefaReturn: false
    });

    // UEFA dönüşü sürprizlerini bulan fonksiyon
    const findUefaReturnSurprises = () => {
        if (!currentTeam || !matchData) return [];

        console.log("Analiz başlıyor...");
        console.log("Takım:", currentTeam);

        // Veriyi daha detaylı incele
        console.log("İlk 5 maç verisi:", matchData.slice(0, 5).map(match => ({
            div: match.Div,
            date: match.Date,
            home: match.HomeTeam,
            away: match.AwayTeam,
            score: `${match.FTHG}-${match.FTAG}`,
            // Tüm özellikleri gör
            allProps: Object.keys(match)
        })));

        // Sezonları tarihten hesapla
        const getSeasonFromDate = (date: number) => {
            const jsDate = new Date((date - 25569) * 86400 * 1000);
            const year = jsDate.getFullYear();
            const month = jsDate.getMonth(); // 0-11
            
            if (month >= 7) { // Ağustos ve sonrası
                return `${year}-${year + 1}`;
            } else { // Ocak-Haziran
                return `${year - 1}-${year}`;
            }
        };

        // Sezonları tarihlerden oluştur
        const seasons = new Set(
            matchData
                .filter(match => match && match.Date)
                .map(match => getSeasonFromDate(Number(match.Date)))
        );

        console.log("Hesaplanan sezonlar:", Array.from(seasons));

        const surprises: any[] = [];
        const processedSurprises = new Map<string, Set<string>>(); // sezon -> sürpriz maç tarihi set'i

        seasons.forEach(season => {
            processedSurprises.set(season, new Set()); // Her sezon için boş set oluştur
            
            const seasonMatches = matchData
                .filter(match => {
                    const matchSeason = getSeasonFromDate(Number(match.Date));
                    return matchSeason === season;
                })
                .sort((a, b) => Number(a.Date) - Number(b.Date));

            // Önce o sezondaki tüm sürpriz maçları bul
            const surpriseMatches = seasonMatches.filter(match => {
                if (match.Div !== selectedLeague) return false;
                if (match.HomeTeam !== currentTeam && match.AwayTeam !== currentTeam) return false;

                return (match.HTR === 'H' && match.FTR === 'A') || 
                       (match.HTR === 'A' && match.FTR === 'H');
            });

            // Her sürpriz maç için en yakın önceki UEFA maçını bul
            surpriseMatches.forEach(surpriseMatch => {
                const surpriseDate = Number(surpriseMatch.Date);
                const surpriseDateStr = formatDate(surpriseDate);

                // Bu sürpriz daha önce işlendiyse atla
                if (processedSurprises.get(season)!.has(surpriseDateStr)) {
                    return;
                }

                // Bu sürprizden önceki tüm UEFA maçlarını bul ve en yakınını seç
                const previousUefaMatches = seasonMatches
                    .filter(match => {
                        if (!match || !match.Div) return false;
                        const isUefa = typeof match.Div === 'string' && (
                            match.Div.toLowerCase().includes('uefa') || 
                            match.Div.toLowerCase().includes('ucl') ||
                            match.Div.toLowerCase().includes('uel') ||
                            match.Div.toLowerCase().includes('champions') ||
                            match.Div.toLowerCase().includes('europa')
                        );
                        const isTeamMatch = match.HomeTeam === currentTeam || match.AwayTeam === currentTeam;
                        const isBeforeSurprise = Number(match.Date) < surpriseDate;
                        return isUefa && isTeamMatch && isBeforeSurprise;
                    })
                    .sort((a, b) => Number(b.Date) - Number(a.Date)); // En yakından uzağa sırala

                if (previousUefaMatches.length > 0) {
                    const closestUefaMatch = previousUefaMatches[0];
                    const matchesBetween = seasonMatches.filter(match => {
                        const matchDate = Number(match.Date);
                        return matchDate > Number(closestUefaMatch.Date) && 
                               matchDate <= surpriseDate &&
                               match.Div === selectedLeague &&
                               (match.HomeTeam === currentTeam || match.AwayTeam === currentTeam);
                    }).length;

                    surprises.push({
                        season,
                        uefaMatch: {
                            opponent: closestUefaMatch.HomeTeam === currentTeam ? 
                                    closestUefaMatch.AwayTeam : 
                                    closestUefaMatch.HomeTeam,
                            date: formatDate(Number(closestUefaMatch.Date)),
                            score: `${closestUefaMatch.FTHG}-${closestUefaMatch.FTAG}`,
                            isHome: closestUefaMatch.HomeTeam === currentTeam
                        },
                        matchesAfter: matchesBetween,
                        surpriseMatch: {
                            opponent: surpriseMatch.HomeTeam === currentTeam ? 
                                     surpriseMatch.AwayTeam : 
                                     surpriseMatch.HomeTeam,
                            date: surpriseDateStr,
                            score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`,
                            isHome: surpriseMatch.HomeTeam === currentTeam
                        }
                    });

                    // Bu sürprizi işaretleyelim
                    processedSurprises.get(season)!.add(surpriseDateStr);
                }
            });
        });

        console.log("Toplam bulunan sürpriz sayısı:", surprises.length);
        return surprises.sort((a, b) => new Date(b.surpriseMatch.date).getTime() - new Date(a.surpriseMatch.date).getTime());
    };

    // Modal state'i
    const [showUefaModal, setShowUefaModal] = useState(false);

    // State'e filtreleme için yeni bir state ekleyelim
    const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

    // Tüm sürpriz rakipleri bulan yardımcı fonksiyon
    const getUniqueSurpriseOpponents = (surprises: any[]) => {
        return Array.from(new Set(surprises.map(s => s.surpriseMatch.opponent)));
    };

    // Yardımcı fonksiyonlar
    const getCurrentSeason = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-11
        
        if (month >= 7) { // Ağustos ve sonrası
            return `${year}-${year + 1}`;
        } else { // Ocak-Haziran
            return `${year - 1}-${year}`;
        }
    };

    // Sezon hesaplama fonksiyonu
    const getSeasonFromDate = (date: number) => {
        const jsDate = new Date((date - 25569) * 86400 * 1000);
        const year = jsDate.getFullYear();
        const month = jsDate.getMonth(); // 0-11
        
        if (month >= 7) { // Ağustos ve sonrası
            return `${year}-${year + 1}`;
        } else { // Ocak-Haziran
            return `${year - 1}-${year}`;
        }
    };

    // State'e seçilen rakibi ekleyelim
    const [selectedLastOpponent, setSelectedLastOpponent] = useState<string | null>(null);

    // Mevcut ligteki takımları bulan fonksiyon
    const getAvailableTeams = () => {
        if (!currentTeam || !matchData) return [];

        return Array.from(new Set(
            matchData
                .filter(match => match.Div === selectedLeague)
                .flatMap(match => [match.HomeTeam, match.AwayTeam])
                .filter(team => team !== currentTeam) // Mevcut takımı hariç tut
        )).sort();
    };

    // Son Rakip analizi yapan fonksiyon
    const findLastOpponentSurprises = () => {
        console.log("=== Son Rakip Analizi Başlıyor ===");
        if (!selectedLastOpponent || !matchData) return [];

        const currentSeason = getCurrentSeason();
        
        // 1. Arouca'nın bu sezon oynadığı tüm maçları bul
        const aroucaMatches = matchData.filter(match => 
            match.Div === selectedLeague &&
            getSeasonFromDate(Number(match.Date)) === currentSeason &&
            (match.HomeTeam === selectedLastOpponent || match.AwayTeam === selectedLastOpponent)
        ).sort((a, b) => Number(a.Date) - Number(b.Date));

        console.log(`${selectedLastOpponent}'nın maçları:`, aroucaMatches.map(m => ({
            date: formatDate(Number(m.Date)),
            opponent: m.HomeTeam === selectedLastOpponent ? m.AwayTeam : m.HomeTeam,
            score: `${m.FTHG}-${m.FTAG}`
        })));

        const surprises = [];

        // 2. Her maçtaki rakibi kontrol et
        aroucaMatches.forEach(aroucaMatch => {
            const opponent = aroucaMatch.HomeTeam === selectedLastOpponent ? 
                aroucaMatch.AwayTeam : aroucaMatch.HomeTeam;

            // 3. Rakibin Arouca maçından sonraki ilk maçını bul
            const nextMatch = matchData.find(m => 
                m.Div === selectedLeague &&
                getSeasonFromDate(Number(m.Date)) === currentSeason &&
                Number(m.Date) > Number(aroucaMatch.Date) &&
                (m.HomeTeam === opponent || m.AwayTeam === opponent)
            );

            if (nextMatch) {
                // 4. Sürpriz kontrolü
                if ((nextMatch.HTR === 'H' && nextMatch.FTR === 'A') || 
                    (nextMatch.HTR === 'A' && nextMatch.FTR === 'H')) {
                    
                    // 5. Sürpriz maçtan sonraki maçı bul
                    const afterSurpriseMatch = matchData.find(m => 
                        m.Div === selectedLeague &&
                        getSeasonFromDate(Number(m.Date)) === currentSeason &&
                        Number(m.Date) > Number(nextMatch.Date) &&
                        (m.HomeTeam === opponent || m.AwayTeam === opponent)
                    );

                    surprises.push({
                        team: opponent,
                        vsLastOpponent: {
                            date: formatDate(Number(aroucaMatch.Date)),
                            score: `${aroucaMatch.FTHG}-${aroucaMatch.FTAG}`
                        },
                        surpriseMatch: {
                            opponent: nextMatch.HomeTeam === opponent ? nextMatch.AwayTeam : nextMatch.HomeTeam,
                            date: formatDate(Number(nextMatch.Date)),
                            score: `${nextMatch.FTHG}-${nextMatch.FTAG}`
                        },
                        ...(afterSurpriseMatch && {
                            afterSurpriseMatch: {
                                opponent: afterSurpriseMatch.HomeTeam === opponent ? 
                                    afterSurpriseMatch.AwayTeam : afterSurpriseMatch.HomeTeam,
                                date: formatDate(Number(afterSurpriseMatch.Date)),
                                score: `${afterSurpriseMatch.FTHG}-${afterSurpriseMatch.FTAG}`
                            }
                        })
                    });
                }
            }
        });

        console.log("\nToplam bulunan sürpriz sayısı:", surprises.length);
        return surprises.sort((a, b) => 
            new Date(b.surpriseMatch.date).getTime() - new Date(a.surpriseMatch.date).getTime()
        );
    };

    // Modal state'i
    const [showLastOpponentModal, setShowLastOpponentModal] = useState(false);

    // State'e yeni modal'ı ekleyelim
    const [showStatisticsModal, setShowStatisticsModal] = useState(false);

    // Günler için renk şeması
    const dayColors = {
        'Pazartesi': { bg: 'from-red-900/30 to-red-800/10', text: 'text-red-400', bar: 'bg-red-400', border: 'border-red-500/30' },
        'Salı': { bg: 'from-orange-900/30 to-orange-800/10', text: 'text-orange-400', bar: 'bg-orange-400', border: 'border-orange-500/30' },
        'Çarşamba': { bg: 'from-yellow-900/30 to-yellow-800/10', text: 'text-yellow-400', bar: 'bg-yellow-400', border: 'border-yellow-500/30' },
        'Perşembe': { bg: 'from-green-900/30 to-green-800/10', text: 'text-green-400', bar: 'bg-green-400', border: 'border-green-500/30' },
        'Cuma': { bg: 'from-teal-900/30 to-teal-800/10', text: 'text-teal-400', bar: 'bg-teal-400', border: 'border-teal-500/30' },
        'Cumartesi': { bg: 'from-blue-900/30 to-blue-800/10', text: 'text-blue-400', bar: 'bg-blue-400', border: 'border-blue-500/30' },
        'Pazar': { bg: 'from-purple-900/30 to-purple-800/10', text: 'text-purple-400', bar: 'bg-purple-400', border: 'border-purple-500/30' }
    };

    // Gün bazlı analiz fonksiyonu
    const findDayBasedPatterns = () => {
        // Kayıtlı veri varsa onu kullan
        if (currentAnalysis) {
            return currentAnalysis.dayBasedPatterns;
        }

        // Yoksa hesapla...
        if (!matchData || !selectedLeague) return [];

        console.log("Gün bazlı analiz başlıyor...");

        // Türkçe gün isimleri
        const dayPatterns: Record<string, {
            totalMatches: number;
            surprises: Array<{
                date: string;
                day: string;
                team: string;
                opponent: string;
                score: string;
                season: string;
            }>;
            turkishName: string;
        }> = {
            'Monday': { totalMatches: 0, surprises: [], turkishName: 'Pazartesi' },
            'Tuesday': { totalMatches: 0, surprises: [], turkishName: 'Salı' },
            'Wednesday': { totalMatches: 0, surprises: [], turkishName: 'Çarşamba' },
            'Thursday': { totalMatches: 0, surprises: [], turkishName: 'Perşembe' },
            'Friday': { totalMatches: 0, surprises: [], turkishName: 'Cuma' },
            'Saturday': { totalMatches: 0, surprises: [], turkishName: 'Cumartesi' },
            'Sunday': { totalMatches: 0, surprises: [], turkishName: 'Pazar' }
        };

        // Her maç için
        matchData.forEach(match => {
            if (match.Div !== selectedLeague) return;

            // Maç gününü bul
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            const day = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            // Toplam maç sayısını artır
            dayPatterns[day].totalMatches++;

            // Sürpriz maç ise kaydet
            if ((match.HTR === 'H' && match.FTR === 'A') || 
                (match.HTR === 'A' && match.FTR === 'H')) {
                
                const season = getSeasonFromDate(Number(match.Date));
                
                dayPatterns[day].surprises.push({
                    date: formatDate(Number(match.Date)),
                    day,
                    team: match.HomeTeam === currentTeam ? match.HomeTeam : match.AwayTeam,
                    opponent: match.HomeTeam === currentTeam ? match.AwayTeam : match.HomeTeam,
                    score: `${match.FTHG}-${match.FTAG}`,
                    season
                });
            }
        });

        // Sonuçları analiz et
        const analysis = Object.entries(dayPatterns).map(([day, data]) => ({
            day: data.turkishName, // Türkçe gün adı
            totalMatches: data.totalMatches,
            surpriseCount: data.surprises.length,
            surpriseRate: data.totalMatches > 0 ? (data.surprises.length / data.totalMatches) * 100 : 0,
            // Son 3 sezondaki sürprizleri filtrele
            surprises: data.surprises
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Tarihe göre sırala
                .filter(surprise => {
                    const [year] = surprise.season.split('-');
                    const currentYear = new Date().getFullYear();
                    return Number(year) >= currentYear - 3;
                })
        }))
        .filter(day => day.totalMatches >= 10) // En az 10 maç olan günleri göster
        .sort((a, b) => {
            // Önce maç sayısına göre sırala
            const matchDiff = b.totalMatches - a.totalMatches;
            if (matchDiff !== 0) return matchDiff;
            // Maç sayıları eşitse sürpriz oranına göre sırala
            return b.surpriseRate - a.surpriseRate;
        });

        console.log("Gün bazlı analiz sonuçları:", analysis);
        return analysis;
    };

    // Skor bazlı analiz fonksiyonunu güncelle
    const findScoreBasedPatterns = () => {
        if (currentAnalysis) {
            return currentAnalysis.scoreBasedPatterns;
        }
        if (!matchData || !selectedLeague) return [];

        console.log("Skor bazlı analiz başlıyor...");

        interface ScorePattern {
            type: 'high_scoring' | 'big_difference' | 'draw';
            triggerMatch: {
                date: string;
                day: string;
                homeTeam: string;
                awayTeam: string;
                score: string;
                totalGoals: number;
                goalDifference: number;
            };
            surpriseMatches: Array<{
                date: string;
                day: string;
                team: string;
                opponent: string;
                score: string;
                hoursDifference: number;
            }>;
            season: string;
        }

        const patterns: ScorePattern[] = [];

        // Maçları sezonlara göre grupla
        const seasonMatches = matchData.reduce((acc, match) => {
            if (match.Div !== selectedLeague) return acc;
            
            const season = getSeasonFromDate(Number(match.Date));
            if (!acc[season]) acc[season] = [];
            acc[season].push(match);
            return acc;
        }, {} as Record<string, any[]>);

        // Her sezon için analiz yap
        Object.entries(seasonMatches).forEach(([season, matches]) => {
            // Maçları tarihe göre sırala
            matches.sort((a, b) => Number(a.Date) - Number(b.Date));

            matches.forEach(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                const totalGoals = Number(match.FTHG) + Number(match.FTAG);
                const goalDifference = Math.abs(Number(match.FTHG) - Number(match.FTAG));

                // Tetikleyici maç koşulları
                const isHighScoring = totalGoals >= 7;
                const isBigDifference = goalDifference >= 3;
                const isDraw = match.FTR === 'D';

                if (isHighScoring || isBigDifference || isDraw) {
                    // Bu maçtan sonraki 24 saat içindeki sürprizleri bul (48 yerine 24)
                    const surprises = matches.filter(m => {
                        const mDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                        const hoursDiff = (mDate.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
                        
                        return hoursDiff > 0 && 
                               hoursDiff <= 24 && // 48 yerine 24
                               ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'));
                    });

                    if (surprises.length > 0) {
                        patterns.push({
                            type: isHighScoring ? 'high_scoring' : 
                                  isBigDifference ? 'big_difference' : 'draw',
                            triggerMatch: {
                                date: formatDate(Number(match.Date)),
                                day: matchDate.toLocaleDateString('tr-TR', { weekday: 'long' }),
                                homeTeam: match.HomeTeam,
                                awayTeam: match.AwayTeam,
                                score: `${match.FTHG}-${match.FTAG}`,
                                totalGoals,
                                goalDifference
                            },
                            surpriseMatches: surprises.map(s => ({
                                date: formatDate(Number(s.Date)),
                                day: new Date((Number(s.Date) - 25569) * 86400 * 1000)
                                    .toLocaleDateString('tr-TR', { weekday: 'long' }),
                                team: s.HomeTeam,
                                opponent: s.AwayTeam,
                                score: `${s.FTHG}-${s.FTAG}`,
                                hoursDifference: (new Date((Number(s.Date) - 25569) * 86400 * 1000).getTime() - 
                                                matchDate.getTime()) / (1000 * 60 * 60)
                            })),
                            season
                        });
                    }
                }
            });
        });

        // Analiz sonuçlarını genişletelim
        const analysis = {
            highScoring: {
                patterns: patterns.filter(p => p.type === 'high_scoring'),
                totalTriggerMatches: patterns.filter(p => p.type === 'high_scoring').length,
                totalSurprises: patterns
                    .filter(p => p.type === 'high_scoring')
                    .reduce((acc, curr) => acc + curr.surpriseMatches.length, 0),
                successRate: (patterns.filter(p => p.type === 'high_scoring').length / 
                             matchData.filter(m => 
                                 m.Div === selectedLeague && 
                                 (Number(m.FTHG) + Number(m.FTAG)) >= 7
                             ).length * 100 || 0).toFixed(1)
            },
            bigDifference: {
                patterns: patterns.filter(p => p.type === 'big_difference'),
                totalTriggerMatches: patterns.filter(p => p.type === 'big_difference').length,
                totalSurprises: patterns
                    .filter(p => p.type === 'big_difference')
                    .reduce((acc, curr) => acc + curr.surpriseMatches.length, 0),
                successRate: (patterns.filter(p => p.type === 'big_difference').length / 
                             matchData.filter(m => 
                                 m.Div === selectedLeague && 
                                 Math.abs(Number(m.FTHG) - Number(m.FTAG)) >= 3
                             ).length * 100 || 0).toFixed(1)
            },
            draws: {
                patterns: patterns.filter(p => p.type === 'draw'),
                totalTriggerMatches: patterns.filter(p => p.type === 'draw').length,
                totalSurprises: patterns
                    .filter(p => p.type === 'draw')
                    .reduce((acc, curr) => acc + curr.surpriseMatches.length, 0),
                successRate: (patterns.filter(p => p.type === 'draw').length / 
                             matchData.filter(m => 
                                 m.Div === selectedLeague && 
                                 m.FTR === 'D'
                             ).length * 100 || 0).toFixed(1)
            }
        };

        console.log("Skor bazlı analiz sonuçları:", analysis);
        return analysis;
    };

    // Skor Bazlı Analiz
    const [activeSection, setActiveSection] = useState<'highScoring' | 'bigDifference' | 'draws'>('highScoring');

    // Kombinasyon pattern analiz fonksiyonu
    const findCombinationPatterns = () => {
        if (currentAnalysis) {
            return currentAnalysis.combinationPatterns;
        }
        if (!matchData || !selectedLeague) return [];

        interface CombinationPattern {
            triggerDay: string;
            triggerTeam: string;
            triggerType: 'high_scoring' | 'big_difference' | 'draw';
            surpriseDay: string;
            surpriseTeam: string;
            occurrences: Array<{
                triggerMatch: {
                    date: string;
                    score: string;
                    opponent: string;
                };
                surpriseMatch: {
                    date: string;
                    score: string;
                    opponent: string;
                    hoursDifference: number;
                };
            }>;
            totalTriggerMatches: number;
            successRate: number;
        }

        const patterns: CombinationPattern[] = [];
        const processedCombinations = new Set<string>();

        // Her maçı tetikleyici olarak kontrol et
        matchData.forEach(triggerMatch => {
            if (triggerMatch.Div !== selectedLeague) return;

            const triggerDate = new Date((Number(triggerMatch.Date) - 25569) * 86400 * 1000);
            const triggerDay = triggerDate.toLocaleDateString('tr-TR', { weekday: 'long' });
            
            // Tetikleyici maçın tipini belirle
            const totalGoals = Number(triggerMatch.FTHG) + Number(triggerMatch.FTAG);
            const goalDifference = Math.abs(Number(triggerMatch.FTHG) - Number(triggerMatch.FTAG));
            
            const triggerTypes: Array<'high_scoring' | 'big_difference' | 'draw'> = [];
            if (totalGoals >= 7) triggerTypes.push('high_scoring');
            if (goalDifference >= 3) triggerTypes.push('big_difference');
            if (triggerMatch.FTR === 'D') triggerTypes.push('draw');

            // Her tetikleyici tip için kontrol et
            triggerTypes.forEach(triggerType => {
                // Bu maçtan sonraki 24 saat içindeki sürprizleri bul
                const surprises = matchData.filter(m => {
                    if (m.Div !== selectedLeague) return false;
                    
                    const mDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                    const hoursDiff = (mDate.getTime() - triggerDate.getTime()) / (1000 * 60 * 60);
                    
                    return hoursDiff > 0 && 
                           hoursDiff <= 24 && 
                           ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'));
                });

                // Her sürpriz için pattern oluştur
                surprises.forEach(surprise => {
                    const surpriseTeam = surprise.HomeTeam;
                    const surpriseDate = new Date((Number(surprise.Date) - 25569) * 86400 * 1000);
                    const surpriseDay = surpriseDate.toLocaleDateString('tr-TR', { weekday: 'long' });

                    // Kombinasyon anahtarı oluştur
                    const combinationKey = `${triggerDay}-${triggerMatch.HomeTeam}-${triggerType}-${surpriseDay}-${surpriseTeam}`;
                    
                    // Bu kombinasyon daha önce işlendiyse atla
                    if (processedCombinations.has(combinationKey)) {
                        const existingPattern = patterns.find(p => 
                            p.triggerDay === triggerDay &&
                            p.triggerTeam === triggerMatch.HomeTeam &&
                            p.triggerType === triggerType &&
                            p.surpriseDay === surpriseDay &&
                            p.surpriseTeam === surpriseTeam
                        );

                        if (existingPattern) {
                            existingPattern.occurrences.push({
                                triggerMatch: {
                                    date: formatDate(Number(triggerMatch.Date)),
                                    score: `${triggerMatch.FTHG}-${triggerMatch.FTAG}`,
                                    opponent: triggerMatch.AwayTeam
                                },
                                surpriseMatch: {
                                    date: formatDate(Number(surprise.Date)),
                                    score: `${surprise.FTHG}-${surprise.FTAG}`,
                                    opponent: surprise.AwayTeam,
                                    hoursDifference: (surpriseDate.getTime() - triggerDate.getTime()) / (1000 * 60 * 60)
                                }
                            });
                        }
                        return;
                    }

                    // Yeni pattern oluştur
                    processedCombinations.add(combinationKey);
                    
                    // Bu kombinasyonun toplam tetikleyici maç sayısını bul
                    const totalTriggerMatches = matchData.filter(m => 
                        m.Div === selectedLeague &&
                        m.HomeTeam === triggerMatch.HomeTeam &&
                        new Date((Number(m.Date) - 25569) * 86400 * 1000).toLocaleDateString('tr-TR', { weekday: 'long' }) === triggerDay &&
                        ((triggerType === 'high_scoring' && Number(m.FTHG) + Number(m.FTAG) >= 7) ||
                         (triggerType === 'big_difference' && Math.abs(Number(m.FTHG) - Number(m.FTAG)) >= 3) ||
                         (triggerType === 'draw' && m.FTR === 'D'))
                    ).length;

                    patterns.push({
                        triggerDay,
                        triggerTeam: triggerMatch.HomeTeam,
                        triggerType,
                        surpriseDay,
                        surpriseTeam,
                        occurrences: [{
                            triggerMatch: {
                                date: formatDate(Number(triggerMatch.Date)),
                                score: `${triggerMatch.FTHG}-${triggerMatch.FTAG}`,
                                opponent: triggerMatch.AwayTeam
                            },
                            surpriseMatch: {
                                date: formatDate(Number(surprise.Date)),
                                score: `${surprise.FTHG}-${surprise.FTAG}`,
                                opponent: surprise.AwayTeam,
                                hoursDifference: (surpriseDate.getTime() - triggerDate.getTime()) / (1000 * 60 * 60)
                            }
                        }],
                        totalTriggerMatches,
                        successRate: (1 / totalTriggerMatches) * 100
                    });
                });
            });
        });

        // En başarılı pattern'leri bul
        return patterns
            .sort((a, b) => {
                // Önce tekrar sayısına göre sırala
                const occDiff = b.occurrences.length - a.occurrences.length;
                if (occDiff !== 0) return occDiff;
                // Sonra başarı oranına göre sırala
                return b.successRate - a.successRate;
            })
            .slice(0, 10); // En iyi 10 pattern'i döndür
    };

    // Component içinde state ekleyelim
    const [savedAnalyses, setSavedAnalyses] = useState<Record<string, AnalysisResults>>({});
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);

    // Kaydetme ve yükleme fonksiyonları
    const saveAnalysis = () => {
        setIsAnalysisLoading(true);
        
        const results: AnalysisResults = {
            league: selectedLeague,
            lastUpdated: new Date().toISOString(),
            dayBasedPatterns: findDayBasedPatterns(),
            scoreBasedPatterns: findScoreBasedPatterns(),
            combinationPatterns: findCombinationPatterns()
        };

        // State'e kaydet
        setSavedAnalyses(prev => ({
            ...prev,
            [selectedLeague]: results
        }));

        // LocalStorage'a kaydet
        localStorage.setItem('analysisResults', JSON.stringify({
            ...savedAnalyses,
            [selectedLeague]: results
        }));

        setIsAnalysisLoading(false);
    };

    // Component mount olduğunda kayıtlı analizleri yükle
    useEffect(() => {
        const saved = localStorage.getItem('analysisResults');
        if (saved) {
            setSavedAnalyses(JSON.parse(saved));
        }
    }, []);

    // Mevcut lig için kayıtlı analiz var mı kontrol et
    const currentAnalysis = savedAnalyses[selectedLeague];

    // Yeniden hesaplama fonksiyonu
    const recalculateAnalysis = () => {
        setIsAnalysisLoading(true);
        
        // Mevcut kayıtlı analizi sil
        const updatedAnalyses = { ...savedAnalyses };
        delete updatedAnalyses[selectedLeague];
        setSavedAnalyses(updatedAnalyses);
        localStorage.setItem('analysisResults', JSON.stringify(updatedAnalyses));

        // Kısa bir gecikme ile loading efekti göster
        setTimeout(() => {
            setIsAnalysisLoading(false);
        }, 500);
    };

    // State'e yeni modal kontrolünü ekleyelim
    const [showWeekAnalysisModal, setShowWeekAnalysisModal] = useState(false);
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [showNextDaySurpriseModal, setShowNextDaySurpriseModal] = useState(false);
    const [showFormulaSearchModal, setShowFormulaSearchModal] = useState(false);

    console.log('InterestingDetailsPanel props:', { 
        matchData: matchData?.length, 
        selectedLeague,
        currentTeam 
    });

    // Lig kodlarını tam isimlere çeviren obje
    const LEAGUE_NAMES: { [key: string]: string } = {
        'E0': 'Premier League',
        'E1': 'Championship',
        'E2': 'League One',
        'E3': 'League Two',
        'EC': 'Conference',
        'SP1': 'La Liga',
        'SP2': 'La Liga 2',
        'D1': 'Bundesliga',
        'D2': '2. Bundesliga',
        'I1': 'Serie A',
        'I2': 'Serie B',
        'F1': 'Ligue 1',
        'F2': 'Ligue 2',
        'N1': 'Eredivisie',
        'B1': 'Jupiler Pro League',
        'P1': 'Primeira Liga',
        'T1': 'Süper Lig',
        'G1': 'Super League Greece',
        'SC0': 'Premiership',
        'SC1': 'Championship (Scotland)',
        'SC2': 'League One (Scotland)',
        'SC3': 'League Two (Scotland)'
    };

    // Ligleri tam isimleriyle console'a yazdıralım
    const leagues = Array.from(new Set(
        matchData.map(match => match.Div)
    )).sort();

    console.log("Mevcut Ligler:");
    leagues.forEach(leagueCode => {
        if (leagueCode) { // undefined kontrolü
            console.log(`${leagueCode}: ${LEAGUE_NAMES[leagueCode]}`);
        }
    });

    return (
        <>
            <div className="space-y-4">
                <button 
                    onClick={() => setOpenPanels(prev => ({
                        ...prev,
                        interesting: !prev.interesting
                    }))}
                    className="w-full flex items-center justify-between text-lg text-white font-medium border-b border-gray-700 pb-2"
                >
                    <span>İlginç Detaylar</span>
                    <svg 
                        className={`w-5 h-5 transition-transform ${openPanels.interesting ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {openPanels.interesting && (
                    <div className="space-y-3">
                        {/* UEFA Dönüşü Kartı */}
                        <button
                            onClick={() => setShowUefaModal(true)}
                            className="w-full bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-indigo-400">
                                        UEFA Dönüşü
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        UEFA maçları sonrasında gerçekleşen sürpriz maç analizleri
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Son Rakip Kartı */}
                        <button
                            onClick={() => setShowLastOpponentModal(true)}
                            className="w-full bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-green-400">
                                        Son Rakip
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Rakip sonrası sürpriz analizi
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* İstatistik Kartı */}
                        <button
                            onClick={() => setShowStatisticsModal(true)}
                            className="w-full bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-yellow-400">
                                        İstatistik
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Detaylı lig analizi ve patternler
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Hafta Analizi Kartı */}
                        <div 
                            onClick={() => setShowWeekAnalysisModal(true)}
                            className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/20 rounded-xl p-6 cursor-pointer 
                                       hover:from-emerald-900/60 hover:to-emerald-800/30 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-emerald-500/20 rounded-lg">
                                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-emerald-400">
                                        Hafta Analizi
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Sezon içindeki haftalara göre sürpriz analizi
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400">
                                Her sezonun haftalarına göre sürpriz maçları ve o haftadaki tüm maçları görüntüleyin.
                            </div>
                        </div>

                        {/* Yeni Skor Analizi Kartı */}
                        <div 
                            onClick={() => setIsScoreModalOpen(true)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer
                              hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <Goal className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Skor Analizi
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Belirli bir skorla biten maçları analiz edin ve benzer sonuçları keşfedin.
                            </p>
                        </div>

                        {/* Yeni Sıradaki Sürpriz Kartı */}
                        <div 
                            onClick={() => setShowNextDaySurpriseModal(true)}
                            className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-6 cursor-pointer 
                                     hover:from-indigo-900/60 hover:to-indigo-800/30 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-indigo-500/20 rounded-lg">
                                    <CalendarDays className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-indigo-400">
                                        Sıradaki Sürpriz
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Takımların belirli günlerdeki sürprizlerinden sonraki gün analizi
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400">
                                Seçilen takımın belirli bir gündeki sürprizlerinden sonraki gün gerçekleşen diğer sürprizleri inceleyin.
                            </div>
                        </div>

                        {/* Formül Aramaları Kartı */}
                        <div 
                            onClick={() => setShowFormulaSearchModal(true)}
                            className="bg-gradient-to-br from-blue-900/50 to-blue-800/20 rounded-xl p-6 cursor-pointer 
                                     hover:from-blue-900/60 hover:to-blue-800/30 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg">
                                    <Calculator className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-blue-400">
                                        Formül Aramaları
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        Liglerdeki özel formülleri ve kalıpları keşfedin
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400">
                                Seçilen ligdeki özel formülleri ve kalıpları analiz edin.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* UEFA Dönüşü Modalı */}
            {showUefaModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 overflow-y-auto">
                    <div className="bg-gray-900 text-white rounded-xl w-[80vw] max-w-[1000px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button 
                            onClick={() => setShowUefaModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 space-y-8">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">UEFA Dönüşü Sürprizleri</h2>
                                        <p className="text-gray-400">
                                            UEFA maçları sonrasında gerçekleşen sürpriz maç analizleri
                                        </p>
                                    </div>

                                    {/* Rakip Filtreleme */}
                                    <div className="flex items-center gap-2">
                                        {/* Tümünü Göster butonu */}
                                        <button
                                            onClick={() => setSelectedOpponent('all')}
                                            className={`text-sm px-3 py-1 rounded-full transition-colors ${
                                                selectedOpponent === 'all'
                                                    ? 'bg-indigo-500/20 text-indigo-400'
                                                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        >
                                            Tümünü Göster
                                        </button>

                                        {/* Takım logoları */}
                                        <div className="flex items-center gap-1">
                                            {getUniqueSurpriseOpponents(findUefaReturnSurprises()).map((opponent) => (
                                                <button
                                                    key={opponent}
                                                    onClick={() => setSelectedOpponent(opponent)}
                                                    className={`p-1 rounded-full transition-all ${
                                                        selectedOpponent === opponent 
                                                            ? 'bg-indigo-500/20 scale-110' 
                                                            : 'bg-gray-800/50 hover:bg-gray-800/80'
                                                    }`}
                                                    title={`${opponent} filtresi`}
                                                >
                                                    <TeamLogo name={opponent} className="w-8 h-8" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Başlangıç mesajı */}
                                {!selectedOpponent && (
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            Analiz yapmak için yukarıdan bir takım seçin
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            veya tüm sonuçları görmek için "Tümünü Göster" butonuna tıklayın
                                        </div>
                                    </div>
                                )}

                                {/* Filtrelenmiş sonuçlar */}
                                {(selectedOpponent || findUefaReturnSurprises().length > 0) && (
                                    <>
                                        {findUefaReturnSurprises()
                                            .filter(surprise => 
                                                selectedOpponent === 'all' || // Tümünü göster
                                                surprise.surpriseMatch.opponent === selectedOpponent // Spesifik takım
                                            )
                                            .sort((a, b) => new Date(b.surpriseMatch.date).getTime() - new Date(a.surpriseMatch.date).getTime())
                                            .map((surprise, index) => (
                                                <div 
                                                    key={index} 
                                                    className={`bg-gray-800/50 rounded-xl p-6 transition-all ${
                                                        selectedOpponent === surprise.surpriseMatch.opponent
                                                            ? 'ring-2 ring-indigo-500/50'
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="text-sm text-gray-400 mb-4">
                                                        {surprise.season} Sezonu
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-8">
                                                        {/* UEFA Maçı */}
                                                        <div className="flex-1 bg-blue-900/20 rounded-lg p-4">
                                                            <div className="text-blue-400 text-sm mb-2">UEFA Maçı</div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <TeamLogo name={surprise.uefaMatch.opponent} className="w-6 h-6" />
                                                                <span className="text-gray-300">
                                                                    vs {surprise.uefaMatch.opponent}
                                                                </span>
                                                            </div>
                                                            <div className="text-xl font-bold text-blue-400 mb-1">
                                                                {surprise.uefaMatch.score}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {surprise.uefaMatch.date}
                                                            </div>
                                                        </div>

                                                        {/* Ok ve Maç Sayısı */}
                                                        <div className="flex flex-col items-center gap-2">
                                                            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                            </svg>
                                                            {surprise.matchesAfter === 1 ? (
                                                                <span className="text-sm text-indigo-400 font-medium">
                                                                    Hemen sonraki maçta
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-indigo-400">
                                                                    {surprise.matchesAfter} maç sonra
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Sürpriz Maç */}
                                                        <div className="flex-1 bg-purple-900/20 rounded-lg p-4">
                                                            <div className="text-purple-400 text-sm mb-2">Sürpriz Maç</div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <TeamLogo name={surprise.surpriseMatch.opponent} className="w-6 h-6" />
                                                                <span className="text-gray-300">
                                                                    vs {surprise.surpriseMatch.opponent}
                                                                </span>
                                                            </div>
                                                            <div className="text-xl font-bold text-purple-400 mb-1">
                                                                {surprise.surpriseMatch.score}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {surprise.surpriseMatch.date}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Sonuç bulunamadı mesajı */}
                                        {selectedOpponent && 
                                         findUefaReturnSurprises().filter(s => s.surpriseMatch.opponent === selectedOpponent).length === 0 && (
                                            <div className="text-center py-8 text-gray-400">
                                                {selectedOpponent} ile eşleşen sürpriz bulunamadı
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Son Rakip Modalı */}
            {showLastOpponentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 overflow-y-auto">
                    <div className="bg-gray-900 text-white rounded-xl w-[80vw] max-w-[1200px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button 
                            onClick={() => {
                                setShowLastOpponentModal(false);
                                setSelectedLastOpponent(null);
                            }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 space-y-8">
                            {!selectedLastOpponent ? (
                                // Takım seçim ekranı
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold text-green-400">Rakip Seçin</h2>
                                    <div className="grid grid-cols-4 gap-4">
                                        {getAvailableTeams().map(team => (
                                            <button
                                                key={team}
                                                onClick={() => setSelectedLastOpponent(team)}
                                                className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
                                            >
                                                <TeamLogo name={team} className="w-12 h-12 mx-auto mb-2" />
                                                <div className="text-center text-gray-300">{team}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                // Analiz sonuçları
                                <div className="space-y-8">
                                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TeamLogo name={selectedLastOpponent} className="w-8 h-8" />
                                            <h2 className="text-2xl font-bold">
                                                {selectedLastOpponent} Sonrası Sürprizler
                                            </h2>
                                        </div>
                                        <p className="text-gray-400">
                                            {selectedLastOpponent} ile oynanan maçlardan sonra yapılan sürprizler
                                        </p>
                                    </div>

                                    {/* Analiz sonuçları... */}
                                    <div className="space-y-6">
                                        {findLastOpponentSurprises().length > 0 ? (
                                            findLastOpponentSurprises().map((surprise, index) => (
                                                <div key={index} className="bg-gray-800/50 rounded-xl p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <TeamLogo name={surprise.team} className="w-6 h-6" />
                                                        <span className="text-lg text-gray-300">
                                                            {surprise.team}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-8 relative">
                                                        {/* İlk ok */}
                                                        <div className="absolute left-[15%] right-[50%] top-1/2 h-0.5 bg-gradient-to-r from-green-600/20 via-green-600/50 to-green-600/20" />
                                                        
                                                        {/* İkinci ok */}
                                                        <div className="absolute left-[50%] right-[15%] top-1/2 h-0.5 bg-gradient-to-r from-purple-600/20 via-purple-600/50 to-purple-600/20" />
                                                        
                                                        {/* Y Takımı ile Maç */}
                                                        <div className="bg-green-500/10 rounded-lg p-4">
                                                            <div className="text-green-400 text-sm mb-2">
                                                                {selectedLastOpponent} Maçı
                                                            </div>
                                                            <div className="text-xl font-bold text-green-400 mb-1">
                                                                {surprise.vsLastOpponent.score}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {surprise.vsLastOpponent.date}
                                                            </div>
                                                        </div>

                                                        {/* Sürpriz Maç */}
                                                        <div className="bg-purple-500/10 rounded-lg p-4">
                                                            <div className="text-purple-400 text-sm mb-2">
                                                                Hemen Sonraki Maçta Sürpriz
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <TeamLogo name={surprise.surpriseMatch.opponent} className="w-4 h-4" />
                                                                <span className="text-gray-400 text-sm">
                                                                    vs {surprise.surpriseMatch.opponent}
                                                                </span>
                                                            </div>
                                                            <div className="text-xl font-bold text-purple-400 mb-1">
                                                                {surprise.surpriseMatch.score}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {surprise.surpriseMatch.date}
                                                            </div>
                                                        </div>

                                                        {/* Sürpriz Sonrası Maç */}
                                                        {surprise.afterSurpriseMatch ? (
                                                            <div className="bg-blue-500/10 rounded-lg p-4">
                                                                <div className="text-blue-400 text-sm mb-2">
                                                                    Sürpriz Sonrası Maç
                                                                </div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <TeamLogo name={surprise.afterSurpriseMatch.opponent} className="w-4 h-4" />
                                                                    <span className="text-gray-400 text-sm">
                                                                        vs {surprise.afterSurpriseMatch.opponent}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xl font-bold text-blue-400 mb-1">
                                                                    {surprise.afterSurpriseMatch.score}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {surprise.afterSurpriseMatch.date}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-center">
                                                                <span className="text-gray-500">Sonraki maç yok</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                {selectedLastOpponent} sonrası hemen sürpriz yapan takım bulunamadı
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* İstatistik Modalı */}
            {showStatisticsModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 overflow-y-auto">
                    <div className="bg-gray-900 text-white rounded-xl w-[90vw] max-w-[1400px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button 
                            onClick={() => setShowStatisticsModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 space-y-8">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                                            Lig Pattern Analizi
                                        </h2>
                                        <p className="text-gray-400">
                                            {selectedLeague} ligi için detaylı pattern ve istatistik analizi
                                        </p>
                                    </div>

                                    {/* Kaydet Butonu */}
                                    <div className="flex items-center gap-4">
                                        {currentAnalysis && (
                                            <div className="text-sm text-gray-400">
                                                Son güncelleme: {new Date(currentAnalysis.lastUpdated).toLocaleString('tr-TR')}
                                            </div>
                                        )}
                                        
                                        {/* Yeniden Hesapla Butonu */}
                                        <button
                                            onClick={recalculateAnalysis}
                                            disabled={isAnalysisLoading}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                                                ${isAnalysisLoading 
                                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400'}`}
                                        >
                                            <svg className={`w-4 h-4 ${isAnalysisLoading ? 'animate-spin' : ''}`} 
                                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>Yeniden Hesapla</span>
                                        </button>

                                        {/* Kaydet Butonu */}
                                        <button
                                            onClick={saveAnalysis}
                                            disabled={isAnalysisLoading}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                                                ${isAnalysisLoading 
                                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                                    : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'}`}
                                        >
                                            {isAnalysisLoading ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    <span>Kaydediliyor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                    </svg>
                                                    <span>Analizi Kaydet</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Gün Bazlı Analiz */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Gün Bazlı Sürpriz Analizi
                                </h3>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Grafik */}
                                    <div className="bg-gray-800/50 rounded-xl p-6">
                                        <div className="mb-4 text-sm text-gray-400">
                                            Günlere Göre Sürpriz Oranları
                                        </div>
                                        <div className="space-y-4">
                                            {findDayBasedPatterns().map(({ day, surpriseRate, totalMatches, surpriseCount }) => {
                                                const colors = dayColors[day];
                                                return (
                                                    <div key={day} className={`bg-gradient-to-r ${colors.bg} rounded-lg p-4 hover:bg-opacity-80 transition-colors`}>
                                                        <div className="flex items-center justify-between text-sm mb-2">
                                                            <span className={`${colors.text} font-medium`}>{day}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={colors.text}>{surpriseRate.toFixed(1)}%</span>
                                                                <span className="text-xs text-gray-500">({totalMatches} maç)</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                                                                style={{ width: `${surpriseRate}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center mt-2 text-xs">
                                                            <span className="text-gray-500">{surpriseCount} sürpriz</span>
                                                            <span className={`${colors.text}`}>
                                                                {(surpriseCount / totalMatches).toFixed(2)} sürpriz/maç
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Detaylar */}
                                    <div className="space-y-4">
                                        {findDayBasedPatterns().slice(0, 3).map(({ day, surpriseRate, surprises, totalMatches }) => {
                                            const colors = dayColors[day];
                                            return (
                                                <div key={day} className={`bg-gradient-to-r ${colors.bg} rounded-xl p-6`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`${colors.text} text-lg font-medium`}>
                                                            {day}
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-center">
                                                                <div className="text-2xl font-bold text-white">
                                                                    {totalMatches}
                                                                </div>
                                                                <div className="text-xs text-gray-400">Toplam Maç</div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className={`text-2xl font-bold ${colors.text}`}>
                                                                    {surpriseRate.toFixed(1)}%
                                                                </div>
                                                                <div className="text-xs text-gray-400">Sürpriz Oranı</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`space-y-2 pl-4 ${colors.border} border-l-2`}>
                                                        {surprises
                                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .slice(0, 3)
                                                            .map((surprise, idx) => (
                                                                <div key={idx} className="bg-black/20 rounded-lg p-3">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <TeamLogo name={surprise.team} className="w-5 h-5" />
                                                                        <span className="text-gray-300">vs</span>
                                                                        <TeamLogo name={surprise.opponent} className="w-5 h-5" />
                                                                    </div>
                                                                    <div className={`${colors.text} font-medium`}>
                                                                        {surprise.score}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {surprise.date}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Skor Bazlı Analiz */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Skor Bazlı Sürpriz Analizi
                                </h3>

                                {/* Excel benzeri tablo görünümü */}
                                <div className="grid grid-cols-7 gap-4">
                                    {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => {
                                        const dayData = {
                                            highScoring: findScoreBasedPatterns().highScoring.patterns.filter(p => p.triggerMatch.day === day),
                                            bigDifference: findScoreBasedPatterns().bigDifference.patterns.filter(p => p.triggerMatch.day === day),
                                            draws: findScoreBasedPatterns().draws.patterns.filter(p => p.triggerMatch.day === day)
                                        };

                                        return (
                                            <div key={day} className="space-y-4">
                                                {/* Gün Başlığı */}
                                                <div className="bg-gray-800 rounded-t-lg p-3">
                                                    <div className="text-gray-200 font-medium text-center">{day}</div>
                                                    <div className="text-xs text-gray-400 text-center mt-1">
                                                        Bu günde oynanan maçlardan sonraki 24 saat içindeki etkileri
                                                    </div>
                                                </div>

                                                {/* Yüksek Skorlu Maçlar */}
                                                <div className="bg-blue-900/20 rounded-lg p-4">
                                                    <div className="text-blue-400 text-sm font-medium mb-2">7+ Gollü Maçlar</div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <div className="text-2xl font-bold text-blue-400">
                                                                {dayData.highScoring.length}
                                                            </div>
                                                            <div className="text-xs text-gray-400">tetikleyici maç</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-bold text-blue-400">
                                                                {dayData.highScoring.reduce((acc, curr) => acc + curr.surpriseMatches.length, 0)}
                                                            </div>
                                                            <div className="text-xs text-gray-400">tetiklenen sürpriz</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {dayData.highScoring.slice(0, 2).map((pattern, idx) => (
                                                        <div key={idx} className="border-t border-blue-500/20 pt-2 mt-2">
                                                            <div className="text-xs text-gray-400 mb-1">Tetikleyici Maç:</div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <TeamLogo name={pattern.triggerMatch.homeTeam} className="w-4 h-4" />
                                                                <span className="text-gray-400">{pattern.triggerMatch.score}</span>
                                                                <TeamLogo name={pattern.triggerMatch.awayTeam} className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">{pattern.triggerMatch.date}</div>
                                                            
                                                            {/* Tetiklenen Sürprizler */}
                                                            <div className="mt-2 pl-3 border-l border-blue-500/20">
                                                                <div className="text-xs text-gray-400 mb-1">Tetiklenen Sürprizler:</div>
                                                                {pattern.surpriseMatches.map((surprise, sIdx) => (
                                                                    <div key={sIdx} className="text-xs">
                                                                        <div className="text-gray-500">
                                                                            {Math.floor(surprise.hoursDifference)} saat sonra:
                                                                        </div>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <TeamLogo name={surprise.team} className="w-3 h-3" />
                                                                            <span className="text-gray-400">{surprise.score}</span>
                                                                            <TeamLogo name={surprise.opponent} className="w-3 h-3" />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {dayData.highScoring.length === 0 && (
                                                        <div className="text-xs text-gray-500 text-center border-t border-blue-500/20 pt-2 mt-2">
                                                            Bu günde tetikleyici maç bulunamadı
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Farklı Galibiyetler */}
                                                <div className="bg-purple-900/20 rounded-lg p-4">
                                                    <div className="text-purple-400 text-sm font-medium mb-2">3+ Farklı Galibiyetler</div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <div className="text-2xl font-bold text-purple-400">
                                                                {dayData.bigDifference.length}
                                                            </div>
                                                            <div className="text-xs text-gray-400">tetikleyici maç</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-bold text-purple-400">
                                                                {dayData.bigDifference.reduce((acc, curr) => acc + curr.surpriseMatches.length, 0)}
                                                            </div>
                                                            <div className="text-xs text-gray-400">tetiklenen sürpriz</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {dayData.bigDifference.slice(0, 2).map((pattern, idx) => (
                                                        <div key={idx} className="border-t border-purple-500/20 pt-2 mt-2">
                                                            <div className="text-xs text-gray-400 mb-1">Tetikleyici Maç:</div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <TeamLogo name={pattern.triggerMatch.homeTeam} className="w-4 h-4" />
                                                                <span className="text-gray-400">{pattern.triggerMatch.score}</span>
                                                                <TeamLogo name={pattern.triggerMatch.awayTeam} className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">{pattern.triggerMatch.date}</div>
                                                            
                                                            {/* Tetiklenen Sürprizler */}
                                                            <div className="mt-2 pl-3 border-l border-purple-500/20">
                                                                <div className="text-xs text-gray-400 mb-1">Tetiklenen Sürprizler:</div>
                                                                {pattern.surpriseMatches.map((surprise, sIdx) => (
                                                                    <div key={sIdx} className="text-xs">
                                                                        <div className="text-gray-500">
                                                                            {Math.floor(surprise.hoursDifference)} saat sonra:
                                                                        </div>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <TeamLogo name={surprise.team} className="w-3 h-3" />
                                                                            <span className="text-gray-400">{surprise.score}</span>
                                                                            <TeamLogo name={surprise.opponent} className="w-3 h-3" />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {dayData.bigDifference.length === 0 && (
                                                        <div className="text-xs text-gray-500 text-center border-t border-purple-500/20 pt-2 mt-2">
                                                            Bu günde tetikleyici maç bulunamadı
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Beraberlikler */}
                                                <div className="bg-green-900/20 rounded-lg p-4">
                                                    <div className="text-green-400 text-sm font-medium mb-2">Beraberlikler</div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            <div className="text-2xl font-bold text-green-400">
                                                                {dayData.draws.length}
                                                            </div>
                                                            <div className="text-xs text-gray-400">tetikleyici maç</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-2xl font-bold text-green-400">
                                                                {dayData.draws.reduce((acc, curr) => acc + curr.surpriseMatches.length, 0)}
                                                            </div>
                                                            <div className="text-xs text-gray-400">tetiklenen sürpriz</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {dayData.draws.slice(0, 2).map((pattern, idx) => (
                                                        <div key={idx} className="border-t border-green-500/20 pt-2 mt-2">
                                                            <div className="text-xs text-gray-400 mb-1">Tetikleyici Maç:</div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <TeamLogo name={pattern.triggerMatch.homeTeam} className="w-4 h-4" />
                                                                <span className="text-gray-400">{pattern.triggerMatch.score}</span>
                                                                <TeamLogo name={pattern.triggerMatch.awayTeam} className="w-4 h-4" />
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1">{pattern.triggerMatch.date}</div>
                                                            
                                                            {/* Tetiklenen Sürprizler */}
                                                            <div className="mt-2 pl-3 border-l border-green-500/20">
                                                                <div className="text-xs text-gray-400 mb-1">Tetiklenen Sürprizler:</div>
                                                                {pattern.surpriseMatches.map((surprise, sIdx) => (
                                                                    <div key={sIdx} className="text-xs">
                                                                        <div className="text-gray-500">
                                                                            {Math.floor(surprise.hoursDifference)} saat sonra:
                                                                        </div>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <TeamLogo name={surprise.team} className="w-3 h-3" />
                                                                            <span className="text-gray-400">{surprise.score}</span>
                                                                            <TeamLogo name={surprise.opponent} className="w-3 h-3" />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {dayData.draws.length === 0 && (
                                                        <div className="text-xs text-gray-500 text-center border-t border-green-500/20 pt-2 mt-2">
                                                            Bu günde tetikleyici maç bulunamadı
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Her günün kartının en altına eklenecek özet bölümü */}
                                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                                    <div className="text-sm text-gray-400 font-medium mb-2">Günün Özeti:</div>
                                                    <div className="space-y-2 text-xs">
                                                        {dayData.highScoring.length > 0 && (
                                                            <div className="text-blue-400">
                                                                • {day} günü oynanan maçlardan önce 24 saat içinde 7+ gollü maç olduysa, 
                                                                {' '}{dayData.highScoring.reduce((acc, curr) => acc + curr.surpriseMatches.length, 0)} kez sürpriz gerçekleşmiş.
                                                            </div>
                                                        )}
                                                        
                                                        {dayData.bigDifference.length > 0 && (
                                                            <div className="text-purple-400">
                                                                • {day} günü oynanan maçlardan önce 24 saat içinde 3+ farklı galibiyet olduysa, 
                                                                {' '}{dayData.bigDifference.reduce((acc, curr) => acc + curr.surpriseMatches.length, 0)} kez sürpriz gerçekleşmiş.
                                                            </div>
                                                        )}
                                                        
                                                        {dayData.draws.length > 0 && (
                                                            <div className="text-green-400">
                                                                • {day} günü oynanan maçlardan önce 24 saat içinde beraberlik olduysa, 
                                                                {' '}{dayData.draws.reduce((acc, curr) => acc + curr.surpriseMatches.length, 0)} kez sürpriz gerçekleşmiş.
                                                            </div>
                                                        )}

                                                        {dayData.highScoring.length === 0 && 
                                                         dayData.bigDifference.length === 0 && 
                                                         dayData.draws.length === 0 && (
                                                            <div className="text-gray-500 italic">
                                                                Bu gün için henüz bir pattern tespit edilemedi.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Genel İstatistikler */}
                                <div className="grid grid-cols-3 gap-6 mt-8">
                                    {/* Yüksek Skorlu Maçlar İstatistikleri */}
                                    <div className="bg-blue-900/20 rounded-xl p-6">
                                        <h4 className="text-lg font-medium text-blue-400 mb-4">7+ Gollü Maçlar</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-blue-400 mb-1">
                                                    {findScoreBasedPatterns().highScoring.totalTriggerMatches}
                                                </div>
                                                <div className="text-sm text-gray-400">Toplam Maç</div>
                                            </div>
                                            <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-blue-400 mb-1">
                                                    %{findScoreBasedPatterns().highScoring.successRate}
                                                </div>
                                                <div className="text-sm text-gray-400">Tetikleme Oranı</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Farklı Galibiyetler İstatistikleri */}
                                    <div className="bg-purple-900/20 rounded-xl p-6">
                                        <h4 className="text-lg font-medium text-purple-400 mb-4">3+ Farklı Galibiyetler</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-purple-400 mb-1">
                                                    {findScoreBasedPatterns().bigDifference.totalTriggerMatches}
                                                </div>
                                                <div className="text-sm text-gray-400">Toplam Maç</div>
                                            </div>
                                            <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-purple-400 mb-1">
                                                    %{findScoreBasedPatterns().bigDifference.successRate}
                                                </div>
                                                <div className="text-sm text-gray-400">Tetikleme Oranı</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Beraberlikler İstatistikleri */}
                                    <div className="bg-green-900/20 rounded-xl p-6">
                                        <h4 className="text-lg font-medium text-green-400 mb-4">Beraberlikler</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-green-500/10 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-green-400 mb-1">
                                                    {findScoreBasedPatterns().draws.totalTriggerMatches}
                                                </div>
                                                <div className="text-sm text-gray-400">Toplam Maç</div>
                                            </div>
                                            <div className="bg-green-500/10 rounded-lg p-4 text-center">
                                                <div className="text-3xl font-bold text-green-400 mb-1">
                                                    %{findScoreBasedPatterns().draws.successRate}
                                                </div>
                                                <div className="text-sm text-gray-400">Tetikleme Oranı</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kombinasyon Pattern Analizi */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                              d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Kombinasyon Pattern Analizi
                                </h3>

                                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6">
                                    <div className="text-sm text-gray-400 mb-4">
                                        En çok tekrar eden takım-gün-skor kombinasyonları ve tetikledikleri sürprizler
                                    </div>

                                    <div className="space-y-6">
                                        {findCombinationPatterns().map((pattern, idx) => {
                                            const typeColors = {
                                                'high_scoring': { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-500/20' },
                                                'big_difference': { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-500/20' },
                                                'draw': { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-500/20' }
                                            };
                                            const colors = typeColors[pattern.triggerType];

                                            return (
                                                <div key={idx} className={`${colors.bg} rounded-xl p-6`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <TeamLogo name={pattern.triggerTeam} className="w-12 h-12" />
                                                                <div className="text-sm text-gray-400 mt-1">Tetikleyici</div>
                                                            </div>
                                                            <div className="text-2xl font-bold">→</div>
                                                            <div className="flex flex-col items-center">
                                                                <TeamLogo name={pattern.surpriseTeam} className="w-12 h-12" />
                                                                <div className="text-sm text-gray-400 mt-1">Sürpriz</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className={`text-3xl font-bold ${colors.text}`}>
                                                                %{pattern.successRate.toFixed(1)}
                                                            </div>
                                                            <div className="text-sm text-gray-400">
                                                                Başarı Oranı
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="bg-black/20 rounded-lg p-4">
                                                            <div className={`${colors.text} font-medium mb-2`}>Pattern Detayları</div>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Tetikleyici Gün:</span>
                                                                    <span className="text-white">{pattern.triggerDay}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Sürpriz Gün:</span>
                                                                    <span className="text-white">{pattern.surpriseDay}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Tekrar Sayısı:</span>
                                                                    <span className={colors.text}>{pattern.occurrences.length} kez</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Toplam Fırsat:</span>
                                                                    <span className="text-white">{pattern.totalTriggerMatches} maç</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-black/20 rounded-lg p-4">
                                                            <div className={`${colors.text} font-medium mb-2`}>Son Örnek</div>
                                                            {pattern.occurrences[0] && (
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <div className="text-gray-400 text-xs mb-1">Tetikleyici Maç:</div>
                                                                        <div className="flex items-center gap-2">
                                                                            <TeamLogo name={pattern.triggerTeam} className="w-4 h-4" />
                                                                            <span className="text-white text-sm">
                                                                                {pattern.occurrences[0].triggerMatch.score}
                                                                            </span>
                                                                            <TeamLogo name={pattern.occurrences[0].triggerMatch.opponent} className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="text-gray-500 text-xs mt-1">
                                                                            {pattern.occurrences[0].triggerMatch.date}
                                                                        </div>
                                                                    </div>

                                                                    <div>
                                                                        <div className="text-gray-400 text-xs mb-1">Sürpriz Maç:</div>
                                                                        <div className="flex items-center gap-2">
                                                                            <TeamLogo name={pattern.surpriseTeam} className="w-4 h-4" />
                                                                            <span className="text-white text-sm">
                                                                                {pattern.occurrences[0].surpriseMatch.score}
                                                                            </span>
                                                                            <TeamLogo name={pattern.occurrences[0].surpriseMatch.opponent} className="w-4 h-4" />
                                                                        </div>
                                                                        <div className="text-gray-500 text-xs mt-1">
                                                                            {pattern.occurrences[0].surpriseMatch.date}
                                                                            {' '}
                                                                            ({Math.floor(pattern.occurrences[0].surpriseMatch.hoursDifference)} saat sonra)
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className={`text-sm ${colors.text} font-medium`}>
                                                        Pattern Açıklaması:
                                                    </div>
                                                    <div className="text-gray-400 text-sm mt-1">
                                                        {pattern.triggerDay} günü {pattern.triggerTeam} takımı 
                                                        {pattern.triggerType === 'high_scoring' && ' 7+ gollü bir maç oynadığında'}
                                                        {pattern.triggerType === 'big_difference' && ' 3+ farklı bir galibiyet aldığında'}
                                                        {pattern.triggerType === 'draw' && ' berabere kaldığında'}
                                                        , {pattern.surpriseDay} günü {pattern.surpriseTeam} takımı sürpriz yapma eğiliminde 
                                                        ({pattern.occurrences.length} kez gerçekleşmiş, %{pattern.successRate.toFixed(1)} başarı oranı).
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal'ı ekleyelim */}
            <WeekAnalysisModal
                isOpen={showWeekAnalysisModal}
                onClose={() => setShowWeekAnalysisModal(false)}
                matchData={matchData}
                selectedLeague={selectedLeague}
                formatDate={formatDate}
            />

            {/* Skor Analizi Modal */}
            <ScoreAnalysisModal 
                isOpen={isScoreModalOpen}
                onClose={() => setIsScoreModalOpen(false)}
                matchData={matchData}
                selectedLeague={selectedLeague}
            />

            {/* Sıradaki Sürpriz Modalı */}
            <NextDaySurpriseModal 
                isOpen={showNextDaySurpriseModal}
                onClose={() => setShowNextDaySurpriseModal(false)}
                matchData={matchData}
                selectedLeague={selectedLeague}
            />

            {/* Formül Aramaları Modalı */}
            <FormulaSearchModal 
                isOpen={showFormulaSearchModal}
                onClose={() => setShowFormulaSearchModal(false)}
                matchData={matchData}
            />
        </>
    );
}; 