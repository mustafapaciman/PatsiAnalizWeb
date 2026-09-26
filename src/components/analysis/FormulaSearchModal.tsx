import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';
import { SurpriseAnalysisResults } from './SurpriseAnalysisResults';
import { checkSimilarityPattern, checkScoreSequencePattern } from './ExtendedSurpriseSteps';
import { SimilarityChaseAnalysis } from './SimilarityChaseAnalysis';
import { Barca51Analysis } from './Barca51Analysis';
import { SurpriseAndScoresAnalysis } from './SurpriseAndScoresAnalysis';
import { DrawChaseAnalysis } from './DrawChaseAnalysis';
import { SassuoloPatternAnalysis } from './SassuoloPatternAnalysis';
import { UpDownAnalysis } from './UpDownAnalysis';
import { TeamAllSurprisesAnalysis } from './TeamAllSurprisesAnalysis';
import { ScorePatternAnalysis } from './ScorePatternAnalysis';
import { 
    Calculator, 
    Hash,
    Calendar,  // Calendar ikonunu ekle
    // ... diğer mevcut iconlar
    ArrowRight, // veya başka bir ikon
    Triangle, // Lucide'den Triangle ikonunu import etmeyi unutma
    Users // veya başka uygun bir ikon
} from 'lucide-react';
import { DayBasedSurpriseAnalysis } from './DayBasedSurpriseAnalysis';
import { StartWeekPartnershipAnalysis } from './StartWeekPartnershipAnalysis';
import { XYZFormula } from './XYZFormula';
import { SameMatchNumberAnalysis } from './SameMatchNumberAnalysis';
import { LastScoreSurpriseAnalysis } from './LastScoreSurpriseAnalysis';
import { SameOpponentMatchNumberAnalysis } from './SameOpponentMatchNumberAnalysis';
import { BermudaTriangleFormula } from './BermudaTriangleFormula';
import { BeforeXTeamFormula } from './BeforeXTeamFormula';
import { BeforeXTeamUnconditional } from './BeforeXTeamUnconditional';
import { SameOpponentScoreAnalysis } from './SameOpponentScoreAnalysis';
import { AgainstThisTeamAnalysis } from './AgainstThisTeamAnalysis'; // Bu satırı ekleyin
import { BermudaTriangleV2 } from './BermudaTriangleV2';
import { WeekAnalysis } from './WeekAnalysis';
import { NextDaySurpriseAnalysis } from './NextDaySurpriseAnalysis';
import { DayTeamTriggerAnalysis } from './DayTeamTriggerAnalysis';

interface FormulaSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchData: any[];
}

// Lig bilgileri
export const LEAGUE_INFO = {
    'E0': { 
        name: 'Premier League', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png',
        needsWhiteBg: true 
    },
    'E1': { 
        name: 'Championship', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/EFL_Championship_Logo.svg/1200px-EFL_Championship_Logo.svg.png',
        needsWhiteBg: true 
    },
    'B1': { 
        name: 'Jupiler Pro League', 
        logo: 'https://tmssl.akamaized.net//images/logo/header/be1.png?lm=1601478124',
        needsWhiteBg: true 
    },
    'D1': { 
        name: 'Bundesliga', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/1200px-Bundesliga_logo_%282017%29.svg.png',
        needsWhiteBg: true 
    },
    'D2': { 
        name: '2. Bundesliga', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/2._Bundesliga_logo.svg/1200px-2._Bundesliga_logo.svg.png',
        needsWhiteBg: true 
    },
    'E2': { 
        name: 'League One', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/EFL_League_One_Logo.svg/1200px-EFL_League_One_Logo.svg.png',
        needsWhiteBg: true 
    },
    'E3': { 
        name: 'League Two', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/93/EFL_League_Two_Logo.svg/1200px-EFL_League_Two_Logo.svg.png',
        needsWhiteBg: true 
    },
    'EC': { 
        name: 'Conference', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/England_national_football_team_crest.svg/1200px-England_national_football_team_crest.svg.png',
        needsWhiteBg: true 
    },
    'F1': { 
        name: 'Ligue 1', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Ligue_1_Uber_Eats_logo.svg/1200px-Ligue_1_Uber_Eats_logo.svg.png',
        needsWhiteBg: true 
    },
    'F2': { 
        name: 'Ligue 2', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Ligue_2_logo.svg/1200px-Ligue_2_logo.svg.png',
        needsWhiteBg: true 
    },
    'G1': { 
        name: 'Super League Greece', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/54/Super_League_Greece_logo.svg/1200px-Super_League_Greece_logo.svg.png',
        needsWhiteBg: true 
    },
    'I1': { 
        name: 'Serie A', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/a/ab/Serie_A_ENILIVE_logo.svg',
        needsWhiteBg: true 
    },
    'I2': { 
        name: 'Serie B', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Serie_BKT_logo.svg/1200px-Serie_BKT_logo.svg.png',
        needsWhiteBg: true 
    },
    'N1': { 
        name: 'Eredivisie', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Eredivisie_nuovo_logo.png',
        needsWhiteBg: true 
    },
    'P1': { 
        name: 'Primeira Liga', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Primeira_Liga_204_Logo.png',
        needsWhiteBg: true 
    },
    'SC0': { 
        name: 'Premiership', 
        logo: 'https://static.wikia.nocookie.net/logopedia/images/9/9d/Scottish_Premiership.svg',
        needsWhiteBg: true 
    },
    'SC1': { 
        name: 'Championship (Scotland)', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/Scottish_Championship.svg/1200px-Scottish_Championship.svg.png',
        needsWhiteBg: true 
    },
    'SC2': { 
        name: 'League One (Scotland)', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Scottish_League_1.svg/1200px-Scottish_League_1.svg.png',
        needsWhiteBg: true 
    },
    'SC3': { 
        name: 'League Two (Scotland)', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/92/Scottish_League_2.svg/1200px-Scottish_League_2.svg.png',
        needsWhiteBg: true 
    },
    'SP1': { 
        name: 'La Liga', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/LaLiga_logo_2023.svg/2048px-LaLiga_logo_2023.svg.png',
        needsWhiteBg: true 
    },
    'SP2': { 
        name: 'La Liga 2', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/LaLiga_Hypermotion_2023_Vertical_Logo.svg/1200px-LaLiga_Hypermotion_2023_Vertical_Logo.svg.png',
        needsWhiteBg: true 
    },
    'T1': { 
        name: 'Süper Lig', 
        logo: 'https://www.tff.org/Resources/TFF/Images/0000000015/TFF/TFF-Logolar/2024-2025/trendyol-super-lig-dikey-logo.jpg',
        needsWhiteBg: true 
    },
    'UEFA': { 
        name: 'UEFA Champions League', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png',
        needsWhiteBg: false 
    },
    'UEL': { 
        name: 'UEFA Europa League', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Europa_League.svg/1200px-Europa_League.svg.png',
        needsWhiteBg: false 
    },
    'UECL': { 
        name: 'UEFA Conference League', 
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/UEFA_Europa_Conference_League.svg/1200px-UEFA_Europa_Conference_League.svg.png',
        needsWhiteBg: false 
    }
};

// Mevcut formüller
const FORMULAS = [
    {
        id: 'laliga-1x-2x',
        name: 'La Liga Formülü (1/x-2/x)',
        description: 'La Liga için özel geliştirilmiş analiz formülü'
    },
    {
        id: 'same-scores',
        name: 'Aynı Skorlar',
        description: 'Aynı hafta içinde aynı skorla biten maçların takımlarının sonraki hafta karşılaşmaları'
    },
    {
        id: 'surprise-calculation',
        name: 'Sürpriz Hesaplama',
        description: 'Takımların sürpriz maç istatistiklerini analiz eder.',
        icon: Calculator
    },
    {
        id: 'score-pattern',  // Yeni formül eklendi
        name: 'Skor Örüntüsü',
        description: 'İki takım arasındaki sürpriz maçların skor örüntülerini analiz eder.',
        icon: Hash
    },
    {
        id: 'similarity-chase',
        name: 'Benzerlik Kovalama',
        description: 'Takımların fikstür başlangıç benzerliklerini ve ortak sürprizlerini analiz eder'
    },
    {
        id: 'barca-5-1',
        name: 'Barça 5-1',
        description: 'Barça 5-1 analiz formülü'
    },
    {
        id: 'surprise-and-scores',
        name: 'Sürpriz ve Skorlar',
        description: 'Takımların sürpriz sonrası skor pattern benzerliklerini analiz eder'
    },
    {
        id: 'draw-chase',
        name: 'Beraberlik Kovalama',
        description: 'Takımların fikstür başlangıç benzerliklerini ve beraberlik patternlerini analiz eder'
    },
    {
        id: 'sassuolo-pattern',
        name: 'Sassuolo Patterni',
        description: 'Sürpriz sonrası 7 maçlık özel fikstür analizi'
    },
    {
        id: 'up-down-formula',
        name: 'Alt Üst Formülü',
        description: 'Üç takım arasındaki sürpriz maç sıralaması analizi'
    },
    {
        id: 'team-all-surprises',
        name: 'Takım Tüm Sürprizler',
        description: 'Seçilen takımın tüm sürprizlerini ve öncesindeki son iki maçını analiz eder'
    },
    {
        id: 'day-based-surprise',
        name: 'Gününe Göre Sürpriz',
        description: 'Takımların belirli günlerdeki sürpriz maç analizini yapar',
        icon: Calendar  // Lucide'den Calendar ikonunu import etmeyi unutma
    },
    {
        id: 'start-week-partnership',
        name: 'Başlangıç-Hafta Ortaklığı',
        description: 'Takımların sezon başlangıç maçları ve ortak hafta sürprizlerini analiz eder'
    },
    {
        id: 'xyz-formula',
        name: 'X-Y-Z Formülü',
        description: 'X ve Y takımlarıyla ardışık karşılaşan takımların sürpriz analizini yapar',
        icon: ArrowRight // veya başka bir ikon
    },
    {
        id: 'same-match-number',
        name: 'Aynı Maç Sayısı Sürprizi',
        description: 'Takımların aynı maç sayılarındaki sürpriz analizini yapar',
        icon: Calculator // veya başka bir ikon
    },
    {
        id: 'last-score-surprise',
        name: 'Son Skor ile Sürpriz',
        description: 'İki takımın son maç skorlarıyla eşleşen sürprizleri analiz eder',
        icon: Hash // veya başka bir ikon
    },
    {
        id: 'same-opponent-match-number',  // Diğer formüllerin arasına eklenecek
        name: 'Aynı Rakip ve Maç Sayısı',
        description: 'Seçilen takım ile belirli maç sayısında sürpriz yapan takımları analiz eder',
        icon: Calculator
    },
    {
        id: 'bermuda-triangle',
        name: 'Bermuda Üçgeni',
        description: 'İki takım arasındaki sürpriz ilişkilerini analiz eder',
        icon: Triangle // Lucide'den Triangle ikonunu import etmeyi unutma
    },
    {
        id: 'before-x-team',
        name: 'X Takımdan Önce',
        description: 'X takımının sürpriz sonrası Y ile karşılaşmalarını analiz eder',
        icon: ArrowRight
    },
    {
        id: 'before-x-team-unconditional',
        name: 'X Takımından Önce (Şartsız Takım)',
        description: 'Sadece X takımını seçer; X takımının sürpriz maçlarından sonra oynadığı ilk maçı rakip şartı olmadan tüm sezonlarda analiz eder',
        icon: ArrowRight
    },
    {
        id: 'same-opponent-score',
        name: 'Aynı Rakipten Gelen Detay',
        description: 'İki takım arasındaki sürpriz maçların sezonlarında ortak rakiplerle yapılan aynı skorları analiz eder',
        icon: Hash // veya başka bir ikon seçebilirsin
    },
    {
        id: 'against-this-team',
        name: 'Bu Takıma Karşı',
        description: 'Seçilen takımın belirli bir ligdeki takımlarla olan tüm karşılaşmalarını analiz eder',
        icon: Users // veya başka uygun bir ikon
    },
    {
        id: 'bermuda-triangle-v2',
        name: 'Bermuda Üçgeni V2',
        description: 'İki takımın ortak sürpriz yaptığı takımları analiz eder',
        icon: Triangle
    },
    {
        id: 'week-analysis',
        name: 'Hafta Analizi',
        description: 'Sezon içindeki tüm sürprizleri maç sayılarına göre analiz eder',
        icon: Calendar // veya başka uygun bir ikon
    },
    {
        id: 'next-day-surprise',
        name: 'Sonraki Gün',
        description: 'Seçilen takımın belirli bir günde sürpriz yaptıktan sonra, ertesi gün sürpriz yapan takımları analiz eder.'
    },
    {
        id: 'day-team-trigger',
        name: 'Gün-Takım Tetikleyicisi',
        description: 'Seçilen takımın sürpriz yaptığı günlerdeki ve sonraki günlerdeki tüm sürprizleri analiz eder',
        icon: Calendar
    },
];

// Analiz tipleri
interface AnalysisMatch {
    date: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    weekNumber: number;
    isSecondHalf: boolean;
    score?: string;  // Aynı Skorlar formülü için skor bilgisi
}

interface AnalysisResult {
    triggerMatch: AnalysisMatch;   // İlk tetikleyici maç
    triggerMatch2?: AnalysisMatch; // İkinci tetikleyici maç (Aynı Skorlar formülü için)
    surpriseMatch: AnalysisMatch;   // Sürpriz maç
    supportingTriggers?: AnalysisMatch[];  // Destekleyici tetikleyiciler
}

// Sezon başlangıç ayını belirleyelim (Temmuz ortası)
const SEASON_START_MONTH = 6; // 0-based index: 6 = Temmuz
const SEASON_START_DAY = 15; // Temmuz'un 15'i

// Hafta hesaplama fonksiyonu
const calculateWeekNumber = (matchDate: Date, seasonMatches: any[], team: string): number => {
    // Sezon başlangıç tarihini belirle
    const year = matchDate.getFullYear();
    const seasonStartYear = matchDate.getMonth() >= SEASON_START_MONTH ? year : year - 1;
    const seasonStart = new Date(seasonStartYear, SEASON_START_MONTH, SEASON_START_DAY);

    // Takımın sezon maçlarını filtrele ve sırala
    const teamMatches = seasonMatches
        .filter(match => 
            (match.HomeTeam === team || match.AwayTeam === team) &&
            new Date((Number(match.Date) - 25569) * 86400 * 1000) >= seasonStart
        )
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    // Bu maçın takım için kaçıncı maç olduğunu bul
    const matchIndex = teamMatches.findIndex(m => 
        new Date((Number(m.Date) - 25569) * 86400 * 1000).getTime() === matchDate.getTime()
    );

    // Hafta numarası = maç sırası + 1
    return matchIndex + 1;
};

// isSecondHalf fonksiyonunu güncelleyelim
const isSecondHalf = (match: any, seasonMatches: any[]): boolean => {
    const currentTeams = [match.HomeTeam, match.AwayTeam];
    const matchDate = Number(match.Date);
    
    // Bu iki takımın daha önceki karşılaşmasını ara
    const previousMatch = seasonMatches.find(m => 
        Number(m.Date) < matchDate && 
        ((m.HomeTeam === currentTeams[0] && m.AwayTeam === currentTeams[1]) ||
         (m.HomeTeam === currentTeams[1] && m.AwayTeam === currentTeams[0]))
    );
    
    // Eğer daha önce karşılaşmışlarsa, bu maç ikinci yarıdadır
    return !!previousMatch;
};

// findNextMatch fonksiyonunu güncelleyelim
const findNextMatch = (team: string, afterDate: number, matches: any[]): any => {
    // Normal durumda sonraki 15 gün içindeki ilk maçı bul
    const nextMatches = matches
        .filter(m => {
            const dayDiff = Number(m.Date) - afterDate;
            return dayDiff > 0 && 
                   dayDiff <= 15 && 
                   (m.HomeTeam === team || m.AwayTeam === team);
        })
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    // Eğer 15 gün içinde maç bulunamadıysa (BAY olabilir)
    if (nextMatches.length === 0) {
        // console.log(`⚠️ ${team} için 15 gün içinde maç bulunamadı, BAY olabilir`);
        
        // 15-30 gün arasında maç ara
        const extendedMatches = matches
            .filter(m => {
                const dayDiff = Number(m.Date) - afterDate;
                return dayDiff > 15 && 
                       dayDiff <= 30 && 
                       (m.HomeTeam === team || m.AwayTeam === team);
            })
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        if (extendedMatches[0]) {
            // console.log(`✅ ${team} için BAY sonrası maç bulundu: ${formatDate(Number(extendedMatches[0].Date))}`);
            return extendedMatches[0];
        }
    }

    return nextMatches[0];
};

// Analiz fonksiyonunu güncelleyelim
const analyzeLaLigaFormula = (
    matchData: any[], 
    selectedLeague: string, 
    selectedSeason: string
): { results: AnalysisResult[], opportunities: AnalysisResult[] } => {
    const results: AnalysisResult[] = [];
    const opportunities: AnalysisResult[] = [];
    
    // Sezon maçlarını filtrele ve sırala
    const seasonMatches = matchData
        .filter(match => match.Div === selectedLeague && 
            calculateSeason(new Date((Number(match.Date) - 25569) * 86400 * 1000)) === selectedSeason)
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    // Her hafta için beraberlik piyangosu maçlarını bul
    let currentWeek = 1;
    const weekMatches = new Map<number, any[]>();
    
    seasonMatches.forEach(match => {
        const weekNumber = calculateWeekNumber(
            new Date((Number(match.Date) - 25569) * 86400 * 1000),
            seasonMatches,
            match.HomeTeam
        );

        if (weekNumber > currentWeek) {
            currentWeek = weekNumber;
        }

        if (!weekMatches.has(weekNumber)) {
            weekMatches.set(weekNumber, []);
        }
        weekMatches.get(weekNumber)!.push(match);
    });

    // K ve L maçları için potansiyel fırsatları topla
    const potentialOpportunities = new Map<string, {
        match: any,
        triggers: any[]  // Tüm tetikleyici maçlar
    }>();

    // Her hafta için beraberlik piyangosu maçlarını kontrol et
    for (let week = 1; week <= currentWeek; week++) {
        const weeklyMatches = weekMatches.get(week) || [];
        
        // Beraberlik piyangosu maçlarını bul
        const drawMatches = weeklyMatches.filter(match => 
            (match.HTR === 'H' && match.FTR === 'D') || 
            (match.HTR === 'A' && match.FTR === 'D')
        );

        if (drawMatches.length > 0) {
            // console.log(`\nHafta ${week}: ${drawMatches.length} adet Beraberlik Piyangosu maçı bulundu`);
            
            // Her beraberlik piyangosu maçı için sonraki maçları kontrol et
            drawMatches.forEach(drawMatch => {
                const team1 = drawMatch.HomeTeam;
                const team2 = drawMatch.AwayTeam;
                
                const nextMatch1 = findNextMatch(team1, Number(drawMatch.Date), seasonMatches);
                const nextMatch2 = findNextMatch(team2, Number(drawMatch.Date), seasonMatches);

                if (nextMatch1 && nextMatch2) {
                    const team1NextOpponent = nextMatch1.HomeTeam === team1 ? nextMatch1.AwayTeam : nextMatch1.HomeTeam;
                    const team2NextOpponent = nextMatch2.HomeTeam === team2 ? nextMatch2.AwayTeam : nextMatch2.HomeTeam;

                    // K ve L'nin karşılaşma tarihini bul
                    const futureMatch = seasonMatches.find(m => 
                        Number(m.Date) > Number(drawMatch.Date) &&
                        ((m.HomeTeam === team1NextOpponent && m.AwayTeam === team2NextOpponent) ||
                         (m.HomeTeam === team2NextOpponent && m.AwayTeam === team1NextOpponent) ||
                         (m.HomeTeam === team2NextOpponent && m.AwayTeam === team1NextOpponent) ||
                         (m.HomeTeam === team1NextOpponent && m.AwayTeam === team2NextOpponent))
                    );

                    // Debug için Valencia-Alaves maçını da logla
                    if (drawMatch.HomeTeam === 'Valencia' || drawMatch.AwayTeam === 'Valencia' ||
                        drawMatch.HomeTeam === 'Alaves' || drawMatch.AwayTeam === 'Alaves') {
                        // console.log('\n=== Valencia/Alaves Tetikleyici Analizi ===');
                        // console.log('Beraberlik Maçı:', {
                        //     date: formatDate(Number(drawMatch.Date)),
                        //     teams: `${drawMatch.HomeTeam} vs ${drawMatch.AwayTeam}`,
                        //     score: `${drawMatch.HTHG}-${drawMatch.HTAG} → ${drawMatch.FTHG}-${drawMatch.FTAG}`
                        // });
                        // console.log('Sonraki Maçlar:', {
                        //     team1: `${team1} -> ${team1NextOpponent}`,
                        //     team2: `${team2} -> ${team2NextOpponent}`
                        // });
                        if (futureMatch) {
                            // console.log('Bulunan K vs L Maçı:', {
                            //     date: formatDate(Number(futureMatch.Date)),
                            //     teams: `${futureMatch.HomeTeam} vs ${futureMatch.AwayTeam}`,
                            //     score: `${futureMatch.HTHG}-${futureMatch.HTAG} → ${futureMatch.FTHG}-${futureMatch.FTAG}`
                            // });
                        }
                    }

                    if (futureMatch) {
                        const matchKey = `${futureMatch.HomeTeam}-${futureMatch.AwayTeam}-${futureMatch.Date}`;
                        
                        // Bu maç için tetikleyici ekle
                        if (!potentialOpportunities.has(matchKey)) {
                            potentialOpportunities.set(matchKey, {
                                match: futureMatch,
                                triggers: []
                            });
                        }
                        
                        potentialOpportunities.get(matchKey)!.triggers.push({
                            match: drawMatch,
                            weekNumber: week
                        });
                    }
                }
            });
        }
    }

    // Her potansiyel fırsat için en yakın tetikleyiciyi seç
    potentialOpportunities.forEach((data, key) => {
        const { match: futureMatch, triggers } = data;
        
        // Tetikleyicileri tarihe göre sırala
        const sortedTriggers = triggers
            .filter(t => Number(t.match.Date) < Number(futureMatch.Date))  // Sürpriz maçtan önceki tetikleyiciler
            .sort((a, b) => Number(b.match.Date) - Number(a.match.Date));  // En son tarihliden başla

        if (sortedTriggers.length === 0) return; // Uygun tetikleyici yoksa bu fırsatı atla

        // En son tetikleyiciyi al
        const primaryTrigger = sortedTriggers[0];

        // Debug için Girona-Sevilla maçlarını logla
        if (futureMatch.HomeTeam === 'Girona' && futureMatch.AwayTeam === 'Sevilla' || 
            futureMatch.HomeTeam === 'Sevilla' && futureMatch.AwayTeam === 'Girona') {
            // console.log('\n=== Girona - Sevilla Analizi ===');
            // console.log('Sürpriz Maç:', {
            //     date: formatDate(Number(futureMatch.Date)),
            //     weekNumber: calculateWeekNumber(
            //         new Date((Number(futureMatch.Date) - 25569) * 86400 * 1000),
            //         seasonMatches,
            //         futureMatch.HomeTeam
            //     ),
            //     teams: `${futureMatch.HomeTeam} vs ${futureMatch.AwayTeam}`,
            //     score: `${futureMatch.HTHG}-${futureMatch.HTAG} → ${futureMatch.FTHG}-${futureMatch.FTAG}`
            // });

            // console.log('\nTetikleyiciler (en yeniden en eskiye):');
            sortedTriggers.forEach((t, i) => {
                // console.log(`${i + 1}. Tetikleyici:`, {
                //     date: formatDate(Number(t.match.Date)),
                //     weekNumber: t.weekNumber,
                //     teams: `${t.match.HomeTeam} vs ${t.match.AwayTeam}`,
                //     score: `${t.match.HTHG}-${t.match.HTAG} → ${t.match.FTHG}-${t.match.FTAG}`,
                //     nextMatches: [
                //         `${t.match.HomeTeam} -> ${findNextMatch(t.match.HomeTeam, Number(t.match.Date), seasonMatches)?.HomeTeam || 'Unknown'} vs ${findNextMatch(t.match.HomeTeam, Number(t.match.Date), seasonMatches)?.AwayTeam || 'Unknown'}`,
                //         `${t.match.AwayTeam} -> ${findNextMatch(t.match.AwayTeam, Number(t.match.Date), seasonMatches)?.HomeTeam || 'Unknown'} vs ${findNextMatch(t.match.AwayTeam, Number(t.match.Date), seasonMatches)?.AwayTeam || 'Unknown'}`
                //     ]
                // });
            });
        }

        // Diğer tetikleyicileri destekleyici olarak kullan
        const supportingTriggers = sortedTriggers.slice(1);

        // console.log('Sürpriz Maç:', {
        //     date: formatDate(Number(futureMatch.Date)),
        //     weekNumber: calculateWeekNumber(
        //         new Date((Number(futureMatch.Date) - 25569) * 86400 * 1000),
        //         seasonMatches,
        //         futureMatch.HomeTeam
        //     ),
        //     teams: `${futureMatch.HomeTeam} vs ${futureMatch.AwayTeam}`,
        //     score: `${futureMatch.HTHG}-${futureMatch.HTAG} → ${futureMatch.FTHG}-${futureMatch.FTAG}`
        // });

        // console.log('\nTüm Tetikleyiciler:');
        triggers.forEach((t, i) => {
            // console.log(`${i + 1}. Tetikleyici:`, {
            //     date: formatDate(Number(t.match.Date)),
            //     weekNumber: t.weekNumber,
            //     teams: `${t.match.HomeTeam} vs ${t.match.AwayTeam}`,
            //     score: `${t.match.HTHG}-${t.match.HTAG} → ${t.match.FTHG}-${t.match.FTAG}`
            // });
        });

        const opportunity = {
            triggerMatch: {
                date: formatDate(Number(primaryTrigger.match.Date)),
                homeTeam: primaryTrigger.match.HomeTeam,
                awayTeam: primaryTrigger.match.AwayTeam,
                htScore: `${primaryTrigger.match.HTHG}-${primaryTrigger.match.HTAG}`,
                ftScore: `${primaryTrigger.match.FTHG}-${primaryTrigger.match.FTAG}`,
                weekNumber: primaryTrigger.weekNumber,
                isSecondHalf: isSecondHalf(primaryTrigger.match, seasonMatches),
                score: `${primaryTrigger.match.FTHG}-${primaryTrigger.match.FTAG}`
            },
            surpriseMatch: {
                date: formatDate(Number(futureMatch.Date)),
                homeTeam: futureMatch.HomeTeam,
                awayTeam: futureMatch.AwayTeam,
                htScore: `${futureMatch.HTHG}-${futureMatch.HTAG}`,
                ftScore: `${futureMatch.FTHG}-${futureMatch.FTAG}`,
                weekNumber: calculateWeekNumber(
                    new Date((Number(futureMatch.Date) - 25569) * 86400 * 1000),
                    seasonMatches,
                    futureMatch.HomeTeam
                ),
                isSecondHalf: isSecondHalf(futureMatch, seasonMatches)
            },
            supportingTriggers: supportingTriggers.map(trigger => ({
                date: formatDate(Number(trigger.match.Date)),
                homeTeam: trigger.match.HomeTeam,
                awayTeam: trigger.match.AwayTeam,
                htScore: `${trigger.match.HTHG}-${trigger.match.HTAG}`,
                ftScore: `${trigger.match.FTHG}-${trigger.match.FTAG}`,
                weekNumber: trigger.weekNumber,
                isSecondHalf: isSecondHalf(trigger.match, seasonMatches)
            }))
        };

        opportunities.push(opportunity);

        if ((futureMatch.HTR === 'H' && futureMatch.FTR === 'A') || 
            (futureMatch.HTR === 'A' && futureMatch.FTR === 'H')) {
            results.push(opportunity);
        }
    });

    return { results, opportunities };
};

// Yeni analiz fonksiyonunu ekleyelim
const analyzeSameScoresFormula = (
    matchData: any[],
    selectedLeague: string,
    selectedSeason: string
): { results: AnalysisResult[], opportunities: AnalysisResult[] } => {
    const results: AnalysisResult[] = [];
    const opportunities: AnalysisResult[] = [];

    // Sezon maçlarını filtrele ve sırala
    const seasonMatches = matchData
        .filter(m => m.Div === selectedLeague && 
            calculateSeason(new Date((Number(m.Date) - 25569) * 86400 * 1000)) === selectedSeason)
        .sort((a, b) => Number(a.Date) - Number(a.Date));

    // Her hafta için maçları grupla
    const weekMatches = new Map<number, any[]>();
    seasonMatches.forEach(match => {
        const weekNumber = calculateWeekNumber(
            new Date((Number(match.Date) - 25569) * 86400 * 1000),
            seasonMatches,
            match.HomeTeam
        );
        if (!weekMatches.has(weekNumber)) {
            weekMatches.set(weekNumber, []);
        }
        weekMatches.get(weekNumber)!.push(match);
    });

    // Her hafta için analiz yap
    weekMatches.forEach((matches, weekNumber) => {
        // Aynı skorla biten maçları grupla
        const scoreGroups = new Map<string, any[]>();
        matches.forEach(match => {
            const score = `${match.FTHG}-${match.FTAG}`;
            if (!scoreGroups.has(score)) {
                scoreGroups.set(score, []);
            }
            scoreGroups.get(score)!.push(match);
        });

        // Aynı skorla biten maç gruplarını kontrol et
        scoreGroups.forEach((sameScoreMatches, score) => {
            if (sameScoreMatches.length >= 2) {
                // Her maç çifti için kontrol et
                for (let i = 0; i < sameScoreMatches.length; i++) {
                    for (let j = i + 1; j < sameScoreMatches.length; j++) {
                        const match1 = sameScoreMatches[i];
                        const match2 = sameScoreMatches[j];

                        // Takımları belirle
                        const teams = [
                            { team: match1.HomeTeam, isWinner: match1.FTHG > match1.FTAG },
                            { team: match1.AwayTeam, isWinner: match1.FTAG > match1.FTHG },
                            { team: match2.HomeTeam, isWinner: match2.FTHG > match2.FTAG },
                            { team: match2.AwayTeam, isWinner: match2.FTAG > match2.FTHG }
                        ];

                        // Tüm olası karşılaşmaları kontrol et
                        for (let k = 0; k < teams.length; k++) {
                            for (let l = k + 1; l < teams.length; l++) {
                                const team1 = teams[k];
                                const team2 = teams[l];

                                // Sonraki haftada karşılaşma var mı?
                                const nextWeekMatch = weekMatches.get(weekNumber + 1)?.find(m =>
                                    (m.HomeTeam === team1.team && m.AwayTeam === team2.team) ||
                                    (m.HomeTeam === team2.team && m.AwayTeam === team1.team)
                                );

                                if (nextWeekMatch) {
                                    const opportunity = {
                                        triggerMatch: {
                                            date: formatDate(Number(match1.Date)),
                                            homeTeam: match1.HomeTeam,
                                            awayTeam: match1.AwayTeam,
                                            htScore: `${match1.HTHG}-${match1.HTAG}`,
                                            ftScore: `${match1.FTHG}-${match1.FTAG}`,
                                            weekNumber,
                                            isSecondHalf: isSecondHalf(match1, seasonMatches),
                                            score: `${match1.FTHG}-${match1.FTAG}`
                                        },
                                        triggerMatch2: {
                                            date: formatDate(Number(match2.Date)),
                                            homeTeam: match2.HomeTeam,
                                            awayTeam: match2.AwayTeam,
                                            htScore: `${match2.HTHG}-${match2.HTAG}`,
                                            ftScore: `${match2.FTHG}-${match2.FTAG}`,
                                            weekNumber,
                                            isSecondHalf: isSecondHalf(match2, seasonMatches),
                                            score: `${match2.FTHG}-${match2.FTAG}`
                                        },
                                        surpriseMatch: {
                                            date: formatDate(Number(nextWeekMatch.Date)),
                                            homeTeam: nextWeekMatch.HomeTeam,
                                            awayTeam: nextWeekMatch.AwayTeam,
                                            htScore: `${nextWeekMatch.HTHG}-${nextWeekMatch.HTAG}`,
                                            ftScore: `${nextWeekMatch.FTHG}-${nextWeekMatch.FTAG}`,
                                            weekNumber: weekNumber + 1,
                                            isSecondHalf: isSecondHalf(nextWeekMatch, seasonMatches)
                                        }
                                    };

                                    opportunities.push(opportunity);

                                    // Sürpriz maç kontrolü
                                    if ((nextWeekMatch.HTR === 'H' && nextWeekMatch.FTR === 'A') ||
                                        (nextWeekMatch.HTR === 'A' && nextWeekMatch.FTR === 'H')) {
                                        results.push(opportunity);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    });

    return { results, opportunities };
};

// Sonraki hafta maçlarını bulma kısmını güncelleyelim
const getNextWeekMatches = (currentMatch: any, matches: any[]): any[] => {
    const currentDate = Number(currentMatch.Date);
    const nextWeekStart = currentDate + 1;
    const nextWeekEnd = currentDate + 7;
    
    return matches.filter(match => {
        const matchDate = Number(match.Date);
        return matchDate >= nextWeekStart && matchDate <= nextWeekEnd;
    });
};

// formatDate fonksiyonunu ekleyelim (LEAGUE_INFO'dan sonra)
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// calculateSeason fonksiyonunu ekleyelim (formatDate fonksiyonundan sonra)
const calculateSeason = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= SEASON_START_MONTH ? `${year}-${year + 1}` : `${year-1}-${year}`;
};

// Yeni sekme tipini ekleyelim
type AnalysisTab = 'results' | 'opportunities' | 'details' | 'potential';

// Sekme başlıklarını tanımlayalım
const TAB_TITLES: Record<AnalysisTab, string> = {
    results: 'Sonuçlar',
    opportunities: 'Toplam Fırsatlar',
    details: 'Detay Yorumu',
    potential: 'Potansiyel Hesaplama'
};

// TabButton bileşenini ekleyelim (AnalysisResults bileşeninden önce)
const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${active 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
    >
        {children}
    </button>
);

// Analiz sonuç bileşenini güncelleyelim
const AnalysisResults: React.FC<{
    results: AnalysisResult[];
    opportunities: AnalysisResult[];
    league: string;
    season: string;
    onBack: () => void;
    matchData: any[];
    allSeasonStats?: {
        totalOpportunities: number;
        totalResults: number;
    };
}> = ({ results, opportunities, league, season, onBack, matchData, allSeasonStats }) => {
    const [activeTab, setActiveTab] = useState<AnalysisTab>('results');
    const [selectedResult, setSelectedResult] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            {/* Üst Bar */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white`}>
                        <img 
                            src={LEAGUE_INFO[league].logo} 
                            alt={LEAGUE_INFO[league].name}
                            className="w-6 h-6 object-contain"
                        />
                    </div>
                    <span className="text-gray-400">{season}</span>
                    <h3 className="text-lg font-medium text-gray-300">
                        Analiz Sonuçları
                    </h3>
                </div>
            </div>

            {/* Sekmeler */}
            <div className="flex space-x-2 mb-6">
                <TabButton 
                    active={activeTab === 'results'} 
                    onClick={() => setActiveTab('results')}
                >
                    Başarılı Sonuçlar
                </TabButton>
                <TabButton 
                    active={activeTab === 'opportunities'} 
                    onClick={() => setActiveTab('opportunities')}
                >
                    Tüm Fırsatlar
                </TabButton>
                <TabButton 
                    active={activeTab === 'details'} 
                    onClick={() => setActiveTab('details')}
                >
                    Detaylı Yorum
                </TabButton>
                <TabButton 
                    active={activeTab === 'potential'} 
                    onClick={() => setActiveTab('potential')}
                >
                    Potansiyel Hesaplama
                </TabButton>
            </div>

            {/* Sekme İçerikleri */}
            <div className="mt-4">
                {activeTab === 'results' && (
                    <ResultsTab 
                        results={results} 
                        selectedResult={selectedResult}
                        onResultSelect={setSelectedResult}
                    />
                )}
                
                {activeTab === 'opportunities' && (
                    <OpportunitiesTab opportunities={opportunities} results={results} />
                )}
                
                {activeTab === 'details' && (
                    <DetailsTab 
                        results={results}
                        opportunities={opportunities}
                        league={league}
                        season={season}
                        allSeasonStats={allSeasonStats}
                    />
                )}
                
                {activeTab === 'potential' && (
                    <PotentialTab 
                        matchData={matchData}
                        league={league}
                        season={season}
                    />
                )}
            </div>
        </div>
    );
};

// Sonuçlar sekmesi
const ResultsTab: React.FC<{
    results: AnalysisResult[];
    selectedResult: number | null;
    onResultSelect: (index: number | null) => void;
}> = ({ results, selectedResult, onResultSelect }) => {
    if (results.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                Bu kriterlere uygun sonuç bulunamadı
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {results.map((result, index) => (
                <div key={index} className="space-y-2">
                    <button
                        onClick={() => onResultSelect(selectedResult === index ? null : index)}
                        className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-8 h-8" />
                                <div className="text-lg font-medium text-gray-300">
                                    {result.surpriseMatch.htScore} → {result.surpriseMatch.ftScore}
                                </div>
                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-8 h-8" />
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-400">
                                    {result.surpriseMatch.date}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {result.surpriseMatch.weekNumber}. Hafta 
                                    {result.surpriseMatch.isSecondHalf ? ' (İkinci Yarı)' : ' (İlk Yarı)'}
                                </div>
                            </div>
                        </div>
                    </button>

                    {selectedResult === index && (
                        <div className="ml-8 space-y-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-gray-400 mb-2">
                                    {result.triggerMatch2 ? 'Aynı Skorlu Maçlar:' : 'Tetikleyen Maç:'}
                                </div>
                                {/* İlk tetikleyici */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-4">
                                        <TeamLogo name={result.triggerMatch.homeTeam} className="w-8 h-8" />
                                        <div className="text-lg font-medium text-gray-300">
                                            {result.triggerMatch.htScore} → {result.triggerMatch.ftScore}
                                        </div>
                                        <TeamLogo name={result.triggerMatch.awayTeam} className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400">
                                            {result.triggerMatch.date}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {result.triggerMatch.weekNumber}. Hafta
                                        </div>
                                    </div>
                                </div>
                                {/* İkinci tetikleyici (varsa) */}
                                {result.triggerMatch2 && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <TeamLogo name={result.triggerMatch2.homeTeam} className="w-8 h-8" />
                                            <div className="text-lg font-medium text-gray-300">
                                                {result.triggerMatch2.htScore} → {result.triggerMatch2.ftScore}
                                            </div>
                                            <TeamLogo name={result.triggerMatch2.awayTeam} className="w-8 h-8" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">
                                                {result.triggerMatch2.date}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {result.triggerMatch2.weekNumber}. Hafta
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Fırsatlar sekmesi
const OpportunitiesTab: React.FC<{
    opportunities: AnalysisResult[];
    results: AnalysisResult[];
}> = ({ opportunities, results }) => {
    const [selectedOpportunity, setSelectedOpportunity] = useState<number | null>(null);
    const failedOpportunities = opportunities.filter(
        opp => !results.some(
            res => res.surpriseMatch.date === opp.surpriseMatch.date
        )
    );

    return (
        <div className="space-y-8">
            {/* Başarısız Fırsatlar */}
            <div>
                <h3 className="text-lg font-medium text-red-500 mb-4">
                    Kaçan Fırsatlar ({failedOpportunities.length})
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {failedOpportunities.map((opportunity, index) => (
                        <div key={index} className="space-y-2">
                            <button
                                onClick={() => setSelectedOpportunity(selectedOpportunity === index ? null : index)}
                                className="w-full p-4 bg-red-900/20 border border-red-900/30 rounded-lg hover:bg-red-900/30 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <TeamLogo name={opportunity.surpriseMatch.homeTeam} className="w-8 h-8" />
                                        <div className="text-lg font-medium text-red-200">
                                            {opportunity.surpriseMatch.htScore} → {opportunity.surpriseMatch.ftScore}
                                        </div>
                                        <TeamLogo name={opportunity.surpriseMatch.awayTeam} className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-red-200">
                                            {opportunity.surpriseMatch.date}
                                        </div>
                                        <div className="text-xs text-red-300/70">
                                            {opportunity.surpriseMatch.weekNumber}. Hafta
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {selectedOpportunity === index && (
                                <div className="ml-8 space-y-4">
                                    <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-lg">
                                        <div className="text-sm text-red-300/70 mb-2">
                                            Aynı Skorlu Maçlar ({opportunity.triggerMatch.score}):
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <TeamLogo name={opportunity.triggerMatch.homeTeam} className="w-6 h-6" />
                                                    <div className="text-base font-medium text-red-200">
                                                        {opportunity.triggerMatch.htScore} → {opportunity.triggerMatch.ftScore}
                                                    </div>
                                                    <TeamLogo name={opportunity.triggerMatch.awayTeam} className="w-6 h-6" />
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-red-200">{opportunity.triggerMatch.date}</div>
                                                    <div className="text-xs text-red-300/70">
                                                        {opportunity.triggerMatch.weekNumber}. Hafta
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <TeamLogo name={opportunity.triggerMatch2?.homeTeam} className="w-6 h-6" />
                                                    <div className="text-base font-medium text-red-200">
                                                        {opportunity.triggerMatch2?.htScore} → {opportunity.triggerMatch2?.ftScore}
                                                    </div>
                                                    <TeamLogo name={opportunity.triggerMatch2?.awayTeam} className="w-6 h-6" />
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-red-200">{opportunity.triggerMatch2?.date}</div>
                                                    <div className="text-xs text-red-300/70">
                                                        {opportunity.triggerMatch2?.weekNumber}. Hafta
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Başarılı Fırsatlar */}
            <div>
                <h3 className="text-lg font-medium text-green-500 mb-4">
                    Başarılı Sonuçlar ({results.length})
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {results.map((result, index) => (
                        <div key={index} className="space-y-2">
                            <button
                                onClick={() => setSelectedOpportunity(selectedOpportunity === `success-${index}` ? null : `success-${index}`)}
                                className="w-full p-4 bg-green-900/20 border border-green-900/30 rounded-lg hover:bg-green-900/30 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <TeamLogo name={result.surpriseMatch.homeTeam} className="w-8 h-8" />
                                        <div className="text-lg font-medium text-green-200">
                                            {result.surpriseMatch.htScore} → {result.surpriseMatch.ftScore}
                                        </div>
                                        <TeamLogo name={result.surpriseMatch.awayTeam} className="w-8 h-8" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-green-200">
                                            {result.surpriseMatch.date}
                                        </div>
                                        <div className="text-xs text-green-300/70">
                                            {result.surpriseMatch.weekNumber}. Hafta
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {selectedOpportunity === `success-${index}` && (
                                <div className="ml-8 space-y-4">
                                    <div className="p-4 bg-green-900/10 border border-green-900/20 rounded-lg">
                                        <div className="text-sm text-green-300/70 mb-2">Ana Tetikleyici:</div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <TeamLogo name={result.triggerMatch.homeTeam} className="w-6 h-6" />
                                                <div className="text-base font-medium text-green-200">
                                                    {result.triggerMatch.htScore} → {result.triggerMatch.ftScore}
                                                </div>
                                                <TeamLogo name={result.triggerMatch.awayTeam} className="w-6 h-6" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-green-200">{result.triggerMatch.date}</div>
                                                <div className="text-xs text-green-300/70">
                                                    {result.triggerMatch.weekNumber}. Hafta
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {result.supportingTriggers?.length > 0 && (
                                        <div className="p-4 bg-green-900/10 border border-green-900/20 rounded-lg">
                                            <div className="text-sm text-green-300/70 mb-2">
                                                Destekleyici Tetikleyiciler ({result.supportingTriggers.length}):
                                            </div>
                                            <div className="space-y-3">
                                                {result.supportingTriggers.map((trigger, idx) => (
                                                    <div key={idx} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <TeamLogo name={trigger.homeTeam} className="w-6 h-6" />
                                                            <div className="text-base font-medium text-green-200">
                                                                {trigger.htScore} → {trigger.ftScore}
                                                            </div>
                                                            <TeamLogo name={trigger.awayTeam} className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-green-200">{trigger.date}</div>
                                                            <div className="text-xs text-green-300/70">
                                                                {trigger.weekNumber}. Hafta
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Detay sekmesini güncelleyelim
const DetailsTab: React.FC<{
    results: AnalysisResult[];
    opportunities: AnalysisResult[];
    league: string;
    season: string;
    allSeasonStats?: { // Tüm sezonlar için istatistikler
        totalOpportunities: number;
        totalResults: number;
    };
}> = ({ results, opportunities, league, season, allSeasonStats }) => {
    const successRate = opportunities.length > 0 
        ? (results.length / opportunities.length) * 100 
        : 0;

    const allSeasonsRate = allSeasonStats && allSeasonStats.totalOpportunities > 0
        ? (allSeasonStats.totalResults / allSeasonStats.totalOpportunities) * 100
        : 0;

    const getRateColor = (rate: number) => {
        if (rate >= 70) return 'bg-green-500';
        if (rate >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-8">
            {/* Seçili Sezon İstatistikleri */}
            <div className="p-6 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <img src={LEAGUE_INFO[league].logo} alt="" className="w-8 h-8 object-contain" />
                    </div>
                    {LEAGUE_INFO[league].name} - {season} Sezonu
                </h3>
                
                <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-gray-700/50 rounded-xl">
                        <div className="text-sm text-gray-400 mb-2">Toplam Fırsat</div>
                        <div className="text-3xl font-bold text-white">{opportunities.length}</div>
                    </div>
                    
                    <div className="p-6 bg-gray-700/50 rounded-xl">
                        <div className="text-sm text-gray-400 mb-2">Başarılı Sonuç</div>
                        <div className="text-3xl font-bold text-white">{results.length}</div>
                    </div>
                    
                    <div className={`p-6 rounded-xl ${getRateColor(successRate)}`}>
                        <div className="text-sm text-white/80 mb-2">Başarı Oranı</div>
                        <div className="text-3xl font-bold text-white">%{successRate.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            {/* Başarı Oranı Göstergesi */}
            <div className="p-6 bg-gray-800 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-white">Fırsat Değerlendirme</span>
                    <span className="text-2xl font-bold text-white">%{successRate.toFixed(1)}</span>
                </div>
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all ${getRateColor(successRate)}`}
                        style={{ width: `${successRate}%` }}
                    />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="text-gray-400">
                        Kaçan Fırsat: {opportunities.length - results.length}
                    </div>
                    <div className="text-right text-gray-400">
                        Başarılı Sonuç: {results.length}
                    </div>
                </div>
            </div>

            {/* Tüm Sezonlar İstatistikleri */}
            <div className="p-6 bg-gray-800 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-6">
                    Tüm Sezonlar
                </h3>
                
                <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-gray-700/50 rounded-xl">
                        <div className="text-sm text-gray-400 mb-2">Toplam Fırsat</div>
                        <div className="text-3xl font-bold text-white">
                            {allSeasonStats?.totalOpportunities || 0}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gray-700/50 rounded-xl">
                        <div className="text-sm text-gray-400 mb-2">Başarılı Sonuç</div>
                        <div className="text-3xl font-bold text-white">
                            {allSeasonStats?.totalResults || 0}
                        </div>
                    </div>
                    
                    <div className={`p-6 rounded-xl ${getRateColor(allSeasonsRate)}`}>
                        <div className="text-sm text-white/80 mb-2">Başarı Oranı</div>
                        <div className="text-3xl font-bold text-white">
                            %{allSeasonsRate.toFixed(1)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// PotentialTab bileşenini oluşturalım
const PotentialTab: React.FC<{
    matchData: any[];
    league: string;
    season: string;
}> = ({ matchData, league, season }) => {
    const [team1, setTeam1] = useState<string>('');
    const [team2, setTeam2] = useState<string>('');
    
    // Ligin tüm takımlarını al
    const teams = useMemo(() => {
        return Array.from(new Set(
            matchData
                .filter(m => m.Div === league)
                .flatMap(m => [m.HomeTeam, m.AwayTeam])
        )).sort();
    }, [matchData, league]);

    // Seçili takımların son maçlarını bul
    const lastMatches = useMemo(() => {
        if (!team1 || !team2) return null;

        const team1Matches = matchData
            .filter(m => (m.HomeTeam === team1 || m.AwayTeam === team1) && m.Div === league)
            .sort((a, b) => Number(b.Date) - Number(a.Date));
        
        const team2Matches = matchData
            .filter(m => (m.HomeTeam === team2 || m.AwayTeam === team2) && m.Div === league)
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        return {
            team1: team1Matches[0],
            team2: team2Matches[0]
        };
    }, [team1, team2, matchData, league]);

    // Potansiyel tetikleyicileri bul
    const findPotentialTriggers = () => {
        if (!lastMatches) return null;

        // Son maç tarihinden önceki 3 haftalık maçları kontrol et
        const lastDate = Math.max(
            Number(lastMatches.team1.Date),
            Number(lastMatches.team2.Date)
        );

        const potentialTriggers = matchData
            .filter(m => {
                const dayDiff = lastDate - Number(m.Date);
                return dayDiff > 0 && 
                       dayDiff <= 21 && // 3 hafta
                       m.Div === league &&
                       ((m.HTR === 'H' && m.FTR === 'D') || (m.HTR === 'A' && m.FTR === 'D'));
            })
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        return potentialTriggers;
    };

    return (
        <div className="space-y-8">
            {/* Takım Seçimi */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        K Takımı
                    </label>
                    <select 
                        value={team1}
                        onChange={(e) => setTeam1(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 text-gray-300 border border-gray-700"
                    >
                        <option value="">Takım Seçin</option>
                        {teams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        L Takımı
                    </label>
                    <select 
                        value={team2}
                        onChange={(e) => setTeam2(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 text-gray-300 border border-gray-700"
                    >
                        <option value="">Takım Seçin</option>
                        {teams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Sonuçlar */}
            {team1 && team2 && lastMatches && (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-800 rounded-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Son Maçlar</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-gray-300">
                                <span>{team1}:</span>
                                <span>
                                    {lastMatches.team1.HomeTeam} vs {lastMatches.team1.AwayTeam} ({formatDate(Number(lastMatches.team1.Date))})
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-gray-300">
                                <span>{team2}:</span>
                                <span>
                                    {lastMatches.team2.HomeTeam} vs {lastMatches.team2.AwayTeam} ({formatDate(Number(lastMatches.team2.Date))})
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Potansiyel Tetikleyiciler */}
                    {findPotentialTriggers()?.length > 0 ? (
                        <div className="p-4 bg-gray-800 rounded-lg">
                            <h3 className="text-lg font-medium text-white mb-4">
                                Potansiyel Tetikleyiciler
                            </h3>
                            <div className="space-y-3">
                                {findPotentialTriggers()?.map((trigger, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <TeamLogo name={trigger.HomeTeam} className="w-6 h-6" />
                                            <div className="text-base font-medium text-gray-200">
                                                {trigger.HTHG}-{trigger.HTAG} → {trigger.FTHG}-{trigger.FTAG}
                                            </div>
                                            <TeamLogo name={trigger.AwayTeam} className="w-6 h-6" />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-300">
                                                {formatDate(Number(trigger.Date))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-red-900/20 text-red-300 rounded-lg">
                            Son 3 haftada potansiyel tetikleyici bulunamadı
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface SurpriseAnalysisStep {
    stepNumber: number;
    description: string;
    point: number;
    details?: {
        opponent?: string;
        date?: string;
        score?: string;
        additionalInfo?: string;
    };
}

interface SurpriseTeamAnalysis {
    team: string;
    totalPoints: number;
    steps: SurpriseAnalysisStep[];
}

interface SurpriseAnalysisResult {
    date: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    weekNumber: number;
    homeAnalysis: SurpriseTeamAnalysis;
    awayAnalysis: SurpriseTeamAnalysis;
    totalPoints: number;
}

const analyzeSurpriseFormula = (
    matchData: any[],
    selectedLeague: string,
    selectedSeason: string
): SurpriseAnalysisResult[] => {
    const results: SurpriseAnalysisResult[] = [];
    
    // Sezon maçlarını filtrele
    const seasonMatches = matchData
        .filter(match => match.Div === selectedLeague && 
            calculateSeason(new Date((Number(match.Date) - 25569) * 86400 * 1000)) === selectedSeason)
        .sort((a, b) => Number(a.Date) - Number(a.Date));

    // Sürpriz maçları bul
    const surpriseMatches = seasonMatches.filter(match => 
        (match.HTR === 'H' && match.FTR === 'A') || 
        (match.HTR === 'A' && match.FTR === 'H')
    );

    // Her sürpriz maç için analiz yap
    surpriseMatches.forEach(match => {
        const homeAnalysis = analyzeTeam(match.HomeTeam, match, matchData, selectedLeague);
        const awayAnalysis = analyzeTeam(match.AwayTeam, match, matchData, selectedLeague);

        results.push({
            date: formatDate(Number(match.Date)),
            homeTeam: match.HomeTeam,
            awayTeam: match.AwayTeam,
            htScore: `${match.HTHG}-${match.HTAG}`,
            ftScore: `${match.FTHG}-${match.FTAG}`,
            weekNumber: calculateWeekNumber(
                new Date((Number(match.Date) - 25569) * 86400 * 1000),
                seasonMatches,
                match.HomeTeam
            ),
            homeAnalysis,
            awayAnalysis,
            totalPoints: homeAnalysis.totalPoints + awayAnalysis.totalPoints
        });
    });

    return results;
};

// Takım analiz fonksiyonu
const analyzeTeam = (
    team: string, 
    surpriseMatch: any, 
    matchData: any[], 
    league: string
): SurpriseTeamAnalysis => {
    const steps: SurpriseAnalysisStep[] = [];
    let totalPoints = 0;

    // Son maçı bul
    const lastMatch = findLastMatch(team, surpriseMatch.Date, matchData);
    if (!lastMatch) return { team, totalPoints: 0, steps: [] };

    const lastOpponent = lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;

    // 1. Basamak: Son rakibin başka sürprizlere tetikçiliği
    const step1 = checkLastOpponentTrigger(lastOpponent, lastMatch.Date, matchData, league);
    if (step1.found) {
        steps.push({
            stepNumber: 1,
            description: "Son rakibin başka sürprizlere tetikçiliği",
            point: 1,
            details: {
                opponent: lastOpponent,
                date: formatDate(Number(lastMatch.Date)),
                score: `${lastMatch.FTHG}-${lastMatch.FTAG}`,
                additionalInfo: step1.details
            }
        });
        totalPoints += 1;
    }

    // 2. Basamak: Önceki sezonlarda aynı rakiple sürpriz
    const step2 = checkPreviousSeasonsTrigger(team, lastOpponent, matchData, league);
    if (step2.found) {
        steps.push({
            stepNumber: 2,
            description: "Önceki sezonlarda aynı rakiple sürpriz",
            point: 1,
            details: {
                opponent: lastOpponent,
                date: step2.date,
                score: step2.score,
                additionalInfo: step2.details
            }
        });
        totalPoints += 1;
    }

    // 3. Basamak: Skor paterni kontrolü
    const lastScore = `${lastMatch.FTHG}-${lastMatch.FTAG}`;
    const step3 = checkScorePattern(team, lastScore, lastMatch.Date, matchData, league);
    if (step3.found) {
        steps.push({
            stepNumber: 3,
            description: "Aynı skorla biten maç sonrası sürpriz",
            point: 1,
            details: {
                score: lastScore,
                date: step3.date,
                additionalInfo: step3.details
            }
        });
        totalPoints += 1;
    }

    // 4. Basamak: Ortak rakip kontrolü
    const step4 = checkCommonOpponent(team, surpriseMatch, matchData, league);
    if (step4.found) {
        steps.push({
            stepNumber: 4,
            description: "Ortak rakiple yapılan sürpriz",
            point: 1,
            details: {
                opponent: step4.opponent,
                date: step4.date,
                additionalInfo: step4.details
            }
        });
        totalPoints += 1;
    }

    // 5. Basamak: Takvim uyumu
    const step5 = checkCalendarMatch(team, surpriseMatch.Date, matchData, league);
    if (step5.found) {
        steps.push({
            stepNumber: 5,
            description: "Takvim uyumu",
            point: 1,
            details: {
                date: step5.date,
                additionalInfo: step5.details
            }
        });
        totalPoints += 1;
    }

    // 6. Basamak: Son iki maç paterni
    const step6 = checkLastTwoMatchesPattern(team, lastMatch, matchData, league);
    if (step6.found) {
        steps.push({
            stepNumber: 6,
            description: "Son iki maç paterni",
            point: 1,
            details: {
                opponent: `${step6.opponent1} → ${step6.opponent2}`,
                date: step6.date,
                additionalInfo: step6.details
            }
        });
        totalPoints += 1;
    }

    // 7. Basamak: Beraberlik piyangosu kontrolü
    const step7 = checkDrawLotteryPattern(lastMatch);
    if (step7.found) {
        steps.push({
            stepNumber: 7,
            description: "Beraberlik piyangosu",
            point: 1,
            details: {
                opponent: lastOpponent,
                score: `${lastMatch.HTHG}-${lastMatch.HTAG} → ${lastMatch.FTHG}-${lastMatch.FTAG}`,
                date: formatDate(Number(lastMatch.Date))
            }
        });
        totalPoints += 1;
    }

    // 8. Basamak: Sonraki maç paterni
    const step8 = checkNextMatchPattern(team, surpriseMatch, matchData, league);
    if (step8.found) {
        steps.push({
            stepNumber: 8,
            description: "Sonraki maç paterni",
            point: 1,
            details: {
                opponent: step8.opponent,
                date: step8.date,
                additionalInfo: step8.details
            }
        });
        totalPoints += 1;
    }

    // 9. Basamak: Rakip-Sürpriz takımı bağlantısı
    const step9 = checkOpponentSurpriseTeamConnection(
        team,
        lastOpponent,
        surpriseMatch,
        matchData,
        league
    );
    if (step9.found) {
        steps.push({
            stepNumber: 9,
            description: "Rakip-Sürpriz takımı bağlantısı",
            point: 1,
            details: {
                opponent: lastOpponent,
                date: step9.date,
                additionalInfo: step9.details
            }
        });
        totalPoints += 1;
    }

    // 10. Basamak: Benzerlik Paterni
    const opponent = surpriseMatch.HomeTeam === team ? surpriseMatch.AwayTeam : surpriseMatch.HomeTeam;
    const step10 = checkSimilarityPattern(team, opponent, surpriseMatch, matchData, league);
    if (step10.found) {
        steps.push({
            stepNumber: 10,
            description: "Benzerlik Paterni",
            point: 1,
            details: {
                date: step10.date,
                additionalInfo: step10.details,
                extendedData: step10.additionalData // Tıklanabilir kart için
            }
        });
    }

    // 11. Basamak: Skor Sekans Paterni
    const step11 = checkScoreSequencePattern(team, surpriseMatch, matchData, league);
    if (step11.found) {
        steps.push({
            stepNumber: 11,
            description: "Skor Sekans Paterni",
            point: 1,
            details: {
                date: step11.date,
                additionalInfo: step11.details,
                extendedData: step11.additionalData
            }
        });
        totalPoints += 1;
    }

    return {
        team,
        totalPoints,
        steps: steps.sort((a, b) => a.stepNumber - b.stepNumber)
    };
};

// Yardımcı fonksiyonlar
const findLastMatch = (team: string, beforeDate: number, matchData: any[]) => {
    return matchData
        .filter(m => 
            Number(m.Date) < Number(beforeDate) && 
            (m.HomeTeam === team || m.AwayTeam === team)
        )
        .sort((a, b) => Number(b.Date) - Number(a.Date))[0];
};

// 1. Basamak: Son rakibin başka sürprizlere tetikçiliği
const checkLastOpponentTrigger = (
    team: string,
    lastOpponent: string,
    surpriseMatch: any,
    matchData: any[],
    league: string
) => {
    try {
        // matchData kontrolü
        if (!Array.isArray(matchData)) {
            // console.log('matchData kontrolü yapılıyor:', {
            //     matchData,
            //     type: typeof matchData,
            //     isArray: Array.isArray(matchData)
            // });
            return { found: false };
        }

        // Son rakibin tetiklediği diğer sürprizleri bul
        const otherSurprises = matchData.filter(m =>
            m.Div === league &&
            Number(m.Date) < Number(surpriseMatch.Date) &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')) &&
            (m.HomeTeam !== team && m.AwayTeam !== team)
        );

        for (const surprise of otherSurprises) {
            const surprisingTeam = surprise.HTR === 'H' ? surprise.AwayTeam : surprise.HomeTeam;
            const previousMatch = findLastMatch(surprisingTeam, surprise.Date, matchData);

            if (previousMatch && 
                (previousMatch.HomeTeam === lastOpponent || previousMatch.AwayTeam === lastOpponent)) {
                return {
                    found: true,
                    date: formatDate(Number(surprise.Date)),
                    details: `Başka takım (${surprisingTeam}), ${lastOpponent} ile karşılaştıktan sonra sürpriz yapmış`
                };
            }
        }

        return { found: false };
    } catch (error) {
        console.error('1. Basamak Hatası:', error);
        return { found: false };
    }
};

const checkPreviousSeasonsTrigger = (team: string, opponent: string, matchData: any[], league: string) => {
    const previousMatches = matchData.filter(m =>
        m.Div === league &&
        ((m.HomeTeam === team && m.AwayTeam === opponent) ||
         (m.HomeTeam === opponent && m.AwayTeam === team))
    );

    for (const match of previousMatches) {
        const nextMatch = findNextMatch(team, Number(match.Date), matchData);
        if (nextMatch && 
            ((nextMatch.HTR === 'H' && nextMatch.FTR === 'A') || 
             (nextMatch.HTR === 'A' && nextMatch.FTR === 'H'))) {
            return {
                found: true,
                date: formatDate(Number(match.Date)),
                score: `${match.FTHG}-${match.FTAG}`,
                details: `${opponent} ile oynadıktan sonra sürpriz yapıldı`
            };
        }
    }

    return { found: false };
};

const checkScorePattern = (team: string, score: string, date: number, matchData: any[], league: string) => {
    const previousMatches = matchData.filter(m =>
        m.Div === league &&
        Number(m.Date) < Number(date) &&
        (m.HomeTeam === team || m.AwayTeam === team) &&
        `${m.FTHG}-${m.FTAG}` === score
    );

    for (const match of previousMatches) {
        const nextMatch = findNextMatch(team, Number(match.Date), matchData);
        if (nextMatch && 
            ((nextMatch.HTR === 'H' && nextMatch.FTR === 'A') || 
             (nextMatch.HTR === 'A' && nextMatch.FTR === 'H'))) {
            return {
                found: true,
                date: formatDate(Number(match.Date)),
                details: `${score} skorundan sonra sürpriz yapıldı`
            };
        }
    }

    return { found: false };
};

// 4. Basamak: Ortak rakip kontrolü
const checkCommonOpponent = (team: string, surpriseMatch: any, matchData: any[], league: string) => {
    const opponent = surpriseMatch.HomeTeam === team ? surpriseMatch.AwayTeam : surpriseMatch.HomeTeam;
    const currentSeason = calculateSeason(new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000));
    
    // Önce seçili sezonda ara
    const currentSeasonMatches = matchData.filter(m => 
        m.Div === league &&
        Number(m.Date) < Number(surpriseMatch.Date) &&
        calculateSeason(new Date((Number(m.Date) - 25569) * 86400 * 1000)) === currentSeason &&
        ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
    );

    // X'in seçili sezondaki sürprizleri
    const teamSurprises = currentSeasonMatches.filter(m => 
        (m.HomeTeam === team || m.AwayTeam === team)
    ).map(m => ({
        opponent: m.HomeTeam === team ? m.AwayTeam : m.HomeTeam,
        date: m.Date
    }));

    // Y'nin seçili sezondaki sürprizleri
    const opponentSurprises = currentSeasonMatches.filter(m => 
        (m.HomeTeam === opponent || m.AwayTeam === opponent)
    ).map(m => ({
        opponent: m.HomeTeam === opponent ? m.AwayTeam : m.HomeTeam,
        date: m.Date
    }));

    // Seçili sezonda ortak rakip kontrolü
    for (const teamSurprise of teamSurprises) {
        for (const oppSurprise of opponentSurprises) {
            if (teamSurprise.opponent === oppSurprise.opponent) {
                return {
                    found: true,
                    opponent: teamSurprise.opponent,
                    date: formatDate(Number(teamSurprise.date)),
                    details: `${teamSurprise.opponent} ile güncel sezonda ortak sürpriz geçmişi var`
                };
            }
        }
    }

    // Seçili sezonda bulunamadıysa önceki sezonlara bak
    const previousSeasonMatches = matchData.filter(m => 
        m.Div === league &&
        Number(m.Date) < Number(surpriseMatch.Date) &&
        calculateSeason(new Date((Number(m.Date) - 25569) * 86400 * 1000)) !== currentSeason &&
        ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
    );

    // X'in önceki sezonlardaki sürprizleri
    const teamPreviousSurprises = previousSeasonMatches.filter(m => 
        (m.HomeTeam === team || m.AwayTeam === team)
    ).map(m => ({
        opponent: m.HomeTeam === team ? m.AwayTeam : m.HomeTeam,
        date: m.Date,
        season: calculateSeason(new Date((Number(m.Date) - 25569) * 86400 * 1000))
    }));

    // Y'nin önceki sezonlardaki sürprizleri
    const opponentPreviousSurprises = previousSeasonMatches.filter(m => 
        (m.HomeTeam === opponent || m.AwayTeam === opponent)
    ).map(m => ({
        opponent: m.HomeTeam === opponent ? m.AwayTeam : m.HomeTeam,
        date: m.Date,
        season: calculateSeason(new Date((Number(m.Date) - 25569) * 86400 * 1000))
    }));

    // Önceki sezonlarda ortak rakip kontrolü
    for (const teamSurprise of teamPreviousSurprises) {
        for (const oppSurprise of opponentPreviousSurprises) {
            if (teamSurprise.opponent === oppSurprise.opponent && 
                teamSurprise.season === oppSurprise.season) { // Aynı sezonda olma şartı
                return {
                    found: true,
                    opponent: teamSurprise.opponent,
                    date: formatDate(Number(teamSurprise.date)),
                    details: `${teamSurprise.opponent} ile ${teamSurprise.season} sezonunda ortak sürpriz geçmişi var`
                };
            }
        }
    }

    return { found: false };
};

// 5. Basamak: Takvim uyumu
const checkCalendarMatch = (team: string, date: number, matchData: any[], league: string) => {
    const currentDate = new Date((Number(date) - 25569) * 86400 * 1000);
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    // +/- 3 gün aralığında maçları bul
    const similarDateMatches = matchData.filter(m => {
        const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
        const matchMonth = matchDate.getMonth();
        const matchDay = matchDate.getDate();
        
        // Aynı ay içinde ve +/- 3 gün
        return m.Div === league &&
               Number(m.Date) < Number(date) &&
               matchMonth === month &&
               Math.abs(matchDay - day) <= 3 &&
               (m.HomeTeam === team || m.AwayTeam === team) &&
               ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'));
    });

    if (similarDateMatches.length > 0) {
        const match = similarDateMatches[0];
        return {
            found: true,
            date: formatDate(Number(match.Date)),
            details: `Benzer tarihte (${formatDate(Number(match.Date))}) sürpriz yapmış`
        };
    }

    return { found: false };
};

// 6. Basamak: Son iki maç paterni
const checkLastTwoMatchesPattern = (team: string, lastMatch: any, matchData: any[], league: string) => {
    // console.log('6. Basamak Başlıyor:', {
    //     team,
    //     lastMatch: {
    //         date: formatDate(Number(lastMatch.Date)),
    //         home: lastMatch.HomeTeam,
    //         away: lastMatch.AwayTeam
    //     }
    // });

    try {
        // Son maçtan önceki maçı bul
        const previousMatches = matchData
            .filter(m => 
                Number(m.Date) < Number(lastMatch.Date) && 
                (m.HomeTeam === team || m.AwayTeam === team)
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        // console.log('Bulunan Önceki Maçlar:', previousMatches.length);

        if (previousMatches.length === 0) {
            // console.warn('⚠️ Önceki maç bulunamadı');
            return { found: false };
        }

        const previousToLastMatch = previousMatches[0];
        // console.log('Son Maçtan Önceki Maç:', {
        //     date: formatDate(Number(previousToLastMatch.Date)),
        //     home: previousToLastMatch.HomeTeam,
        //     away: previousToLastMatch.AwayTeam
        // });
        // ...

        // Önceki sezonlarda aynı sırayla maç yapıp sürpriz var mı?
        const lastOpponent = lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;
        const prevOpponent = previousToLastMatch.HomeTeam === team ? previousToLastMatch.AwayTeam : previousToLastMatch.HomeTeam;

        // Geçmiş maçlarda aynı pattern'i ara
        const matches = matchData.filter(m =>
            m.Div === league &&
            Number(m.Date) < Number(lastMatch.Date) && 
            (m.HomeTeam === team || m.AwayTeam === team)
        ).sort((a, b) => Number(b.Date) - Number(a.Date));

        for (let i = 0; i < matches.length - 1; i++) {
            const match1 = matches[i];
            const match2 = matches[i + 1];

            const opp1 = match1.HomeTeam === team ? match1.AwayTeam : match1.HomeTeam;
            const opp2 = match2.HomeTeam === team ? match2.AwayTeam : match2.HomeTeam;

            if (opp1 === lastOpponent && opp2 === prevOpponent) {
                // Bu pattern sonrası sürpriz var mı?
                const nextMatch = findNextMatch(team, Number(match1.Date), matchData);
                if (nextMatch && 
                    ((nextMatch.HTR === 'H' && nextMatch.FTR === 'A') || 
                     (nextMatch.HTR === 'A' && nextMatch.FTR === 'H'))) {
                    return {
                        found: true,
                        opponent1: prevOpponent,
                        opponent2: lastOpponent,
                        date: formatDate(Number(match1.Date)),
                        details: `${prevOpponent} ve ${lastOpponent} ile aynı sırayla maç yapıp sürpriz yapmış`
                    };
                }
            }
        }

        return { found: false };

    } catch (error) {
        console.error('6. Basamak Hatası:', error);
        return { found: false };
    }
};

// 7. Basamak: Beraberlik piyangosu kontrolü
const checkDrawLotteryPattern = (match: any) => {
    return {
        found: (match.HTR === 'H' && match.FTR === 'D') || 
               (match.HTR === 'A' && match.FTR === 'D')
    };
};

// 8. Basamak: Sonraki maç paterni
const checkNextMatchPattern = (team: string, surpriseMatch: any, matchData: any[], league: string) => {
    const nextMatch = findNextMatch(team, Number(surpriseMatch.Date), matchData);
    if (!nextMatch) return { found: false };

    const nextOpponent = nextMatch.HomeTeam === team ? nextMatch.AwayTeam : nextMatch.HomeTeam;

    // Önceki sürprizlerden sonra aynı takımla karşılaşma var mı?
    const previousSurprises = matchData.filter(m =>
        m.Div === league &&
        Number(m.Date) < Number(surpriseMatch.Date) &&
        ((m.HomeTeam === team && ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))) ||
         (m.AwayTeam === team && ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))))
    );

    for (const surprise of previousSurprises) {
        const afterMatch = findNextMatch(team, Number(surprise.Date), matchData);
        if (afterMatch) {
            const afterOpponent = afterMatch.HomeTeam === team ? afterMatch.AwayTeam : afterMatch.HomeTeam;
            if (afterOpponent === nextOpponent) {
                return {
                    found: true,
                    opponent: nextOpponent,
                    date: formatDate(Number(surprise.Date)),
                    details: `${nextOpponent} ile daha önce sürpriz sonrası karşılaşmış`
                };
            }
        }
    }

    return { found: false };
};

// 9. Basamak: Rakip-Sürpriz takımı bağlantısı
const checkOpponentSurpriseTeamConnection = (
    team: string,
    lastOpponent: string,
    surpriseMatch: any,
    matchData: any[],
    league: string
) => {
    const surpriseOpponent = surpriseMatch.HomeTeam === team ? surpriseMatch.AwayTeam : surpriseMatch.HomeTeam;

    // 1. Durum: Aynı takımın (X) geçmişte K-Y paterni
    const teamSurprises = matchData.filter(m =>
        m.Div === league &&
        Number(m.Date) < Number(surpriseMatch.Date) &&
        ((m.HomeTeam === team && m.AwayTeam === surpriseOpponent) || 
         (m.AwayTeam === team && m.HomeTeam === surpriseOpponent)) &&
        ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
    );

    for (const surprise of teamSurprises) {
        const previousMatch = findLastMatch(team, surprise.Date, matchData);
        if (previousMatch && 
            (previousMatch.HomeTeam === lastOpponent || previousMatch.AwayTeam === lastOpponent)) {
            return {
                found: true,
                date: formatDate(Number(surprise.Date)),
                details: `${team}, ${lastOpponent} ile karşılaştıktan sonra ${surpriseOpponent} ile sürpriz yapmış`
            };
        }
    }

    // 2. Durum: Başka bir takımın K-Y paterni
    const otherTeamSurprises = matchData.filter(m =>
        m.Div === league &&
        Number(m.Date) < Number(surpriseMatch.Date) &&
        m.HomeTeam !== team && m.AwayTeam !== team &&
        ((m.HomeTeam === surpriseOpponent) || (m.AwayTeam === surpriseOpponent)) &&
        ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
    );

    for (const surprise of otherTeamSurprises) {
        const surprisingTeam = surprise.HomeTeam === surpriseOpponent ? surprise.AwayTeam : surprise.HomeTeam;
        const previousMatch = findLastMatch(surprisingTeam, surprise.Date, matchData);
        
        if (previousMatch && 
            (previousMatch.HomeTeam === lastOpponent || previousMatch.AwayTeam === lastOpponent)) {
            return {
                found: true,
                date: formatDate(Number(surprise.Date)),
                details: `Başka takım (${surprisingTeam}), ${lastOpponent}-${surpriseOpponent} patternini kullanmış` // Açıklamayı güncelledim
            };
        }
    }

    return { found: false };
};

// Sürpriz analiz adımlarını hesaplayan fonksiyon
const analyzeSurpriseSteps = (
    team: string,
    surpriseMatch: any,
    matchData: any[],  // matchData parametresi
    league: string     // league parametresi
) => {
    const steps: any[] = [];
    let totalPoints = 0;

    // Son maçı bul
    const lastMatch = findLastMatch(team, surpriseMatch.Date, matchData);
    if (!lastMatch) return steps;

    const lastOpponent = lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;

    // 1. Basamak: Son rakibin başka sürprizlere tetikçiliği
    const step1 = checkLastOpponentTrigger(
        team,
        lastOpponent,
        surpriseMatch,
        matchData,  // matchData'yı doğru şekilde geçiyoruz
        league
    );
    if (step1.found) {
        steps.push({
            stepNumber: 1,
            description: "Son rakibin başka sürprizlere tetikçiliği",
            point: 1,
            details: {
                opponent: lastOpponent,
                date: formatDate(Number(lastMatch.Date)),
                score: `${lastMatch.FTHG}-${lastMatch.FTAG}`,
                additionalInfo: step1.details
            }
        });
    }

    // 2. Basamak: Önceki sezonlarda aynı rakiple sürpriz
    const step2 = checkPreviousSeasonsTrigger(team, lastOpponent, matchData, league);
    if (step2.found) {
        steps.push({
            stepNumber: 2,
            description: "Önceki sezonlarda aynı rakiple sürpriz",
            point: 1,
            details: {
                opponent: lastOpponent,
                date: step2.date,
                score: step2.score,
                additionalInfo: step2.details
            }
        });
    }

    // 3. Basamak: Skor paterni kontrolü
    const lastScore = `${lastMatch.FTHG}-${lastMatch.FTAG}`;
    const step3 = checkScorePattern(team, lastScore, lastMatch.Date, matchData, league);
    if (step3.found) {
        steps.push({
            stepNumber: 3,
            description: "Aynı skorla biten maç sonrası sürpriz",
            point: 1,
            details: {
                score: lastScore,
                date: step3.date,
                additionalInfo: step3.details
            }
        });
    }

    // 4. Basamak: Ortak rakip kontrolü
    const step4 = checkCommonOpponent(team, surpriseMatch, matchData, league);
    if (step4.found) {
        steps.push({
            stepNumber: 4,
            description: "Ortak rakiple yapılan sürpriz",
            point: 1,
            details: {
                opponent: step4.opponent,
                date: step4.date,
                additionalInfo: step4.details
            }
        });
    }

    // 5. Basamak: Takvim uyumu
    const step5 = checkCalendarMatch(team, surpriseMatch.Date, matchData, league);
    if (step5.found) {
        steps.push({
            stepNumber: 5,
            description: "Takvim uyumu",
            point: 1,
            details: {
                date: step5.date,
                additionalInfo: step5.details
            }
        });
    }

    // 6. Basamak: Son iki maç paterni
    const step6 = checkLastTwoMatchesPattern(team, lastMatch, matchData, league);
    if (step6.found) {
        steps.push({
            stepNumber: 6,
            description: "Son iki maç paterni",
            point: 1,
            details: {
                opponent: `${step6.opponent1} → ${step6.opponent2}`,
                date: step6.date,
                additionalInfo: step6.details
            }
        });
    }

    // 7. Basamak: Beraberlik piyangosu
    const step7 = checkDrawLotteryPattern(lastMatch);
    if (step7.found) {
        steps.push({
            stepNumber: 7,
            description: "Beraberlik piyangosu",
            point: 1,
            details: {
                opponent: lastOpponent,
                score: `${lastMatch.HTHG}-${lastMatch.HTAG} → ${lastMatch.FTHG}-${lastMatch.FTAG}`,
                date: formatDate(Number(lastMatch.Date))
            }
        });
    }

    // 8. Basamak: Sonraki maç paterni
    const step8 = checkNextMatchPattern(team, surpriseMatch, matchData, league);
    if (step8.found) {
        steps.push({
            stepNumber: 8,
            description: "Sonraki maç paterni",
            point: 1,
            details: {
                opponent: step8.opponent,
                date: step8.date,
                additionalInfo: step8.details
            }
        });
    }

    // 9. Basamak: Rakip-Sürpriz takımı bağlantısı
    const step9 = checkOpponentSurpriseTeamConnection(team, lastOpponent, surpriseMatch, matchData, league);
    if (step9.found) {
        steps.push({
            stepNumber: 9,
            description: "Rakip-Sürpriz takımı bağlantısı",
            point: 1,
            details: {
                opponent: lastOpponent,
                date: step9.date,
                additionalInfo: step9.details
            }
        });
    }

    // 10. Basamak: Benzerlik Paterni
    const opponent = surpriseMatch.HomeTeam === team ? surpriseMatch.AwayTeam : surpriseMatch.HomeTeam;
    const step10 = checkSimilarityPattern(team, opponent, surpriseMatch, matchData, league);
    if (step10.found) {
        steps.push({
            stepNumber: 10,
            description: "Benzerlik Paterni",
            point: 1,
            details: {
                date: step10.date,
                additionalInfo: step10.details,
                extendedData: step10.additionalData // Tıklanabilir kart için
            }
        });
    }

    // 11. Basamak: Skor Sekans Paterni
    const step11 = checkScoreSequencePattern(team, surpriseMatch, matchData, league);
    if (step11.found) {
        steps.push({
            stepNumber: 11,
            description: "Skor Sekans Paterni",
            point: 1,
            details: {
                date: step11.date,
                additionalInfo: step11.details,
                extendedData: step11.additionalData
            }
        });
        totalPoints += 1;
    }

    return steps;
};

export function FormulaSearchModal({ isOpen, onClose, matchData }: FormulaSearchModalProps) {
    const [step, setStep] = useState<'league' | 'season' | 'formula' | 'analysis'>('league');
    const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const [selectedFormula, setSelectedFormula] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
    const [analysisOpportunities, setAnalysisOpportunities] = useState<AnalysisResult[]>([]);
    const [selectedResult, setSelectedResult] = useState<number | null>(null);
    const [allSeasonStats, setAllSeasonStats] = useState<{
        totalOpportunities: number;
        totalResults: number;
    } | null>(null);

    // Mevcut ligleri al
    const availableLeagues = Array.from(new Set(
        matchData.map(match => match.Div)
    )).filter(Boolean).sort();

    // Sezonları hesapla
    const seasons = useMemo(() => {
        if (!selectedLeague) return [];
        
        return Array.from(new Set(
            matchData
                .filter(m => m.Div === selectedLeague)
                .map(match => {
                    const date = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    const year = date.getFullYear();
                    const month = date.getMonth();
                    return month >= 7 ? `${year}-${year + 1}` : `${year-1}-${year}`;
                })
        )).sort().reverse();
    }, [selectedLeague, matchData]);

    // Tüm sezon istatistiklerini hesapla
    const calculateAllSeasonStats = (league: string) => {
        const allSeasonResults = [];
        const allSeasonOpportunities = [];

        // Tüm sezonlar için analiz yap
        seasons.forEach(season => {
            const { results, opportunities } = analyzeLaLigaFormula(matchData, league, season);
            allSeasonResults.push(...results);
            allSeasonOpportunities.push(...opportunities);
        });

        // console.log('Tüm sezonlar analiz edildi:', {
        //     sezonSayısı: seasons.length,
        //     toplamFırsat: allSeasonOpportunities.length,
        //     toplamBaşarı: allSeasonResults.length
        // });

        return {
            totalOpportunities: allSeasonOpportunities.length,
            totalResults: allSeasonResults.length
        };
    };

    // Analiz başlatma fonksiyonu
    const startAnalysis = () => {
        console.log("Seçilen formül:", selectedFormula);
        
        if (selectedFormula === 'week-analysis') {
            console.log("Hafta analizi başlatılıyor...");
            setStep('analysis');
            return;
        }
        
        let results, opportunities, stats;

        if (selectedFormula === 'laliga-1x-2x') {
            ({ results, opportunities } = analyzeLaLigaFormula(matchData, selectedLeague!, selectedSeason!));
        } else if (selectedFormula === 'same-scores') {
            ({ results, opportunities } = analyzeSameScoresFormula(matchData, selectedLeague!, selectedSeason!));
        } else if (selectedFormula === 'surprise-calculation') {
            const surpriseResults = analyzeSurpriseFormula(matchData, selectedLeague!, selectedSeason!);
            setAnalysisResults(surpriseResults);
            setAnalysisOpportunities([]);
            setStep('analysis');
            return;
        } else if (selectedFormula === 'similarity-chase') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'barca-5-1') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'surprise-and-scores') {  // Yeni formül için case ekleyelim
            setStep('analysis');
            return;
        } else if (selectedFormula === 'draw-chase') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'sassuolo-pattern') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'up-down-formula') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'toast-formula') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'team-all-surprises') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'score-pattern') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'day-based-surprise') {  // Yeni formül case'i
            setStep('analysis');
            return;
        } else if (selectedFormula === 'start-week-partnership') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'xyz-formula') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'same-match-number') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'last-score-surprise') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'same-opponent-match-number') {
            setStep('analysis');
            return (
                <SameOpponentMatchNumberAnalysis
                    league={selectedLeague!}
                    season={selectedSeason!}
                    matchData={matchData}
                    onClose={() => setStep('formula')}
                />
            );
        } else if (selectedFormula === 'bermuda-triangle') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'before-x-team') {
            setStep('analysis'); // Bu satırı ekle
            return;
        } else if (selectedFormula === 'before-x-team-unconditional') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'same-opponent-score') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'against-this-team') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'bermuda-triangle-v2') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'week-analysis') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'next-day-surprise') {
            setStep('analysis');
            return;
        } else if (selectedFormula === 'day-team-trigger') {
            setStep('analysis');
            return;
        }

        if (results && opportunities) {
            stats = calculateAllSeasonStats(selectedLeague!);
            
            setAnalysisResults(results);
            setAnalysisOpportunities(opportunities);
            setAllSeasonStats(stats);
            setStep('analysis');
        }
    };

    // Tüm takımları al
    const allTeams = useMemo(() => {
        const teams = new Set<string>();
        matchData
            .filter(m => m.Div === selectedLeague && 
                calculateSeason(new Date((Number(m.Date) - 25569) * 86400 * 1000)) === selectedSeason)
            .forEach(match => {
                teams.add(match.HomeTeam);
                teams.add(match.AwayTeam);
            });
        return Array.from(teams).sort();
    }, [matchData, selectedLeague, selectedSeason]);

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-7xl rounded-xl bg-gray-900 shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-800">
                        <Dialog.Title className="text-xl font-semibold text-white">
                            Formül Aramaları
                        </Dialog.Title>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {step === 'league' ? (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-300">Lig Seçin</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    {availableLeagues.map((leagueCode) => (
                                        <button
                                            key={leagueCode}
                                            onClick={() => {
                                                setSelectedLeague(leagueCode);
                                                setStep('season');
                                            }}
                                            className={`flex flex-col items-center p-4 rounded-xl 
                                                bg-gray-800/50 hover:bg-gray-800/70 transition-all
                                                ${selectedLeague === leagueCode ? 'ring-2 ring-blue-500' : ''}`}
                                        >
                                            <div className={`w-24 h-24 flex items-center justify-center mb-3 rounded-lg
                                                ${LEAGUE_INFO[leagueCode].needsWhiteBg ? 'bg-white' : ''}`}
                                            >
                                                <img 
                                                    src={LEAGUE_INFO[leagueCode].logo} 
                                                    alt={LEAGUE_INFO[leagueCode].name}
                                                    className="w-20 h-20 object-contain"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <span className="text-sm text-center text-gray-300">
                                                {LEAGUE_INFO[leagueCode].name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : step === 'season' ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={() => {
                                            setStep('league');
                                            setSelectedSeason(null);
                                        }}
                                        className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white`}>
                                            <img 
                                                src={LEAGUE_INFO[selectedLeague!].logo} 
                                                alt={LEAGUE_INFO[selectedLeague!].name}
                                                className="w-6 h-6 object-contain"
                                            />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-300">
                                            Sezon Seçin
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    {seasons.map((season) => (
                                        <button
                                            key={season}
                                            onClick={() => {
                                                setSelectedSeason(season);
                                                setStep('formula');
                                            }}
                                            className={`p-4 rounded-xl transition-all
                                                ${selectedSeason === season 
                                                    ? 'bg-blue-900/30 ring-2 ring-blue-500' 
                                                    : 'bg-gray-800/50 hover:bg-gray-800/70'}`}
                                        >
                                            <span className="text-lg font-medium text-gray-300">
                                                {season}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : step === 'formula' ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-6">
                                    <button
                                        onClick={() => {
                                            setStep('season');
                                            setSelectedFormula(null);
                                        }}
                                        className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-white`}>
                                            <img 
                                                src={LEAGUE_INFO[selectedLeague!].logo} 
                                                alt={LEAGUE_INFO[selectedLeague!].name}
                                                className="w-6 h-6 object-contain"
                                            />
                                        </div>
                                        <span className="text-gray-400">{selectedSeason}</span>
                                        <h3 className="text-lg font-medium text-gray-300">
                                            Formül Seçin
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <select
                                        value={selectedFormula || ''}
                                        onChange={(e) => setSelectedFormula(e.target.value)}
                                        className="w-full p-3 rounded-lg bg-gray-800 text-gray-300 border border-gray-700"
                                    >
                                        <option value="">Formül Seçin</option>
                                        {FORMULAS.map(formula => (
                                            <option key={formula.id} value={formula.id}>
                                                {formula.name}
                                            </option>
                                        ))}
                                    </select>

                                    {selectedFormula && (
                                        <div className="flex justify-end">
                                            <button
                                                onClick={startAnalysis}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 
                                                         text-white rounded-lg transition-colors"
                                            >
                                                Analizi Başlat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {step === 'analysis' && (
                                    selectedFormula === 'week-analysis' ? (
                                        console.log("Rendering WeekAnalysis..."),
                                        <WeekAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'surprise-calculation' ? (
                                        <SurpriseAnalysisResults 
                                            results={analysisResults as SurpriseAnalysisResult[]}
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            onBack={() => setStep('formula')}
                                            allTeams={allTeams}
                                            analyzeSurpriseSteps={(team, match) => analyzeSurpriseSteps(team, match, matchData, selectedLeague!)}
                                            matchData={matchData}
                                        />
                                    ) : selectedFormula === 'day-based-surprise' ? (  // Yeni formül case'i
                                        <DayBasedSurpriseAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'similarity-chase' ? (
                                        <SimilarityChaseAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'barca-5-1' ? (
                                        <Barca51Analysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'surprise-and-scores' ? (  // Yeni formül case'i
                                        <SurpriseAndScoresAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'draw-chase' ? (
                                        <DrawChaseAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'sassuolo-pattern' ? (
                                        <SassuoloPatternAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'up-down-formula' ? (
                                        <UpDownAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'toast-formula' ? (
                                        <ToastFormulaAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'team-all-surprises' ? (
                                        <TeamAllSurprisesAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'score-pattern' ? (
                                        <ScorePatternAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'start-week-partnership' ? (
                                        <StartWeekPartnershipAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'xyz-formula' ? (
                                        <XYZFormula
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'same-match-number' ? (
                                        <SameMatchNumberAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'last-score-surprise' ? (
                                        <LastScoreSurpriseAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'same-opponent-match-number' ? (
                                        <SameOpponentMatchNumberAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'bermuda-triangle' ? (
                                        <BermudaTriangleFormula
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'before-x-team' ? (
                                        <BeforeXTeamFormula
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'before-x-team-unconditional' ? (
                                        <BeforeXTeamUnconditional
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'same-opponent-score' ? (
                                        <SameOpponentScoreAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'against-this-team' ? (
                                        <AgainstThisTeamAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'bermuda-triangle-v2' ? (
                                        <BermudaTriangleV2
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'week-analysis' ? (
                                        <WeekAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'next-day-surprise' ? (
                                        <NextDaySurpriseAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : selectedFormula === 'day-team-trigger' ? (
                                        <DayTeamTriggerAnalysis
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            matchData={matchData}
                                            onClose={() => setStep('formula')}
                                        />
                                    ) : (
                                        <AnalysisResults 
                                            results={analysisResults as AnalysisResult[]}
                                            opportunities={analysisOpportunities}
                                            league={selectedLeague!}
                                            season={selectedSeason!}
                                            onBack={() => setStep('formula')}
                                            matchData={matchData}
                                            allSeasonStats={allSeasonStats}
                                        />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
}