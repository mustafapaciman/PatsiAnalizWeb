import React, { useState } from 'react';
import { TeamLogo } from '../../TeamLogo';
import { InterestingDetailsPanel } from './InterestingDetailsPanel';

interface DetailedAnalysisPanelProps {
    lastOpponent: string;
    matchData: any[];
    selectedLeague: string;
    isLoading: boolean;
    showResults: boolean;
    surprisePageCount: number;
    setSurprisePageCount: React.Dispatch<React.SetStateAction<number>>;
    formatDate: (excelDate: number) => string;
    currentTeam: string;
}

// Pattern tiplerini güncelleyelim
interface Pattern {
    type: 'score_trigger';
    opponent: string;
    triggerScore: number;
    occurrences: Array<{
        season: string;
        firstMatch: {
            date: string;
            score: string;
            isHome: boolean;
        };
        surpriseMatch: {
            date: string;
            score: string;
            isHome: boolean;
        };
    }>;
    description: string;
    confidence: number;
}

export const DetailedAnalysisPanel: React.FC<DetailedAnalysisPanelProps> = ({
    lastOpponent,
    matchData,
    selectedLeague,
    isLoading,
    showResults,
    surprisePageCount,
    setSurprisePageCount,
    formatDate,
    currentTeam
}) => {
    console.log("DetailedAnalysisPanel - lastOpponent:", lastOpponent);
    console.log('DetailedAnalysisPanel props:', { 
        matchData: matchData?.length, 
        selectedLeague 
    });

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

    const getAvailableOpponents = () => {
        if (!currentTeam || !matchData) return [];

        const currentSeason = getCurrentSeason();
        
        // Tüm rakipleri bul
        const opponents = new Set(
            matchData
                .filter(match => 
                    match.Div === selectedLeague &&
                    (match.HomeTeam === currentTeam || match.AwayTeam === currentTeam) &&
                    getSeasonFromDate(Number(match.Date)) === currentSeason
                )
                .map(match => 
                    match.HomeTeam === currentTeam ? match.AwayTeam : match.HomeTeam
                )
        );

        return Array.from(opponents);
    };

    // Panel state'lerini kapalı başlat
    const [openPanels, setOpenPanels] = useState({
        surpriseMatches: false,
        lastSurprise: false,
        commonOpponents: false,
        todaysSurprises: false,
        patterns: false
    });

    // Pattern analiz fonksiyonunu güncelleyelim
    const findPatterns = (team: string = currentTeam) => {
        if (!team) return [];

        // Tüm maçları sezonlara göre grupla
        const seasonMatches = matchData.reduce((acc, match) => {
            if (match.HomeTeam !== team && match.AwayTeam !== team) return acc;
            
            const season = getSeasonFromDate(Number(match.Date));
            if (!acc[season]) {
                acc[season] = {
                    firstHalf: [],
                    secondHalf: []
                };
            }

            // Maç bilgilerini hazırla
            const matchInfo = {
                opponent: match.HomeTeam === team ? match.AwayTeam : match.HomeTeam,
                date: formatDate(Number(match.Date)),
                rawDate: Number(match.Date),
                score: match.HomeTeam === team ? 
                    `${match.FTHG}-${match.FTAG}` : 
                    `${match.FTAG}-${match.FTHG}`, // Skoru takımın perspektifinden göster
                isHome: match.HomeTeam === team,
                isSurprise: (match.HTR === 'H' && match.FTR === 'A') || 
                           (match.HTR === 'A' && match.FTR === 'H')
            };

            // Sezonun hangi yarısında olduğunu belirle
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            const isFirstHalf = matchDate.getMonth() >= 7 && matchDate.getMonth() <= 11;
            
            if (isFirstHalf) {
                acc[season].firstHalf.push(matchInfo);
            } else {
                acc[season].secondHalf.push(matchInfo);
            }

            return acc;
        }, {} as Record<string, { firstHalf: any[], secondHalf: any[] }>);

        // 2. Skor farkı patternlerini bul
        const scoreDiffPatterns = new Map<number, {
            mainOpponent?: string,  // En çok tekrar eden rakip
            occurrences: Array<{
                season: string,
                opponent: string,
                firstMatch: any,
                surpriseMatch: any
            }>,
            description: string,
            confidence: number
        }>();

        // Her sezon için pattern ara
        Object.entries(seasonMatches).forEach(([season, halves]) => {
            // Her rakip için ilk yarı ve ikinci yarı maçlarını eşleştir
            const opponents = new Set([
                ...halves.firstHalf.map(m => m.opponent),
                ...halves.secondHalf.map(m => m.opponent)
            ]);

            opponents.forEach(opponent => {
                const firstHalfMatch = halves.firstHalf.find(m => m.opponent === opponent);
                const secondHalfMatch = halves.secondHalf.find(m => m.opponent === opponent);

                if (firstHalfMatch && secondHalfMatch && secondHalfMatch.isSurprise) {
                    // Skor farkını hesapla
                    const [firstHalfHome, firstHalfAway] = firstHalfMatch.score.split('-').map(Number);
                    const scoreDiff = Math.abs(firstHalfHome - firstHalfAway);

                    // Pattern'i kaydet veya güncelle
                    if (!scoreDiffPatterns.has(scoreDiff)) {
                        scoreDiffPatterns.set(scoreDiff, {
                            occurrences: [],
                            description: `${scoreDiff} gol farklı maçlardan sonra sürpriz yapma eğilimi`,
                            confidence: 0
                        });
                    }

                    const pattern = scoreDiffPatterns.get(scoreDiff)!;
                    pattern.occurrences.push({
                        season,
                        opponent,
                        firstMatch: firstHalfMatch,
                        surpriseMatch: secondHalfMatch
                    });
                }
            });
        });

        // 3. Pattern'leri analiz et ve grupla
        return Array.from(scoreDiffPatterns.entries())
            .map(([scoreDiff, pattern]) => {
                // En çok tekrar eden rakibi bul
                const opponentCounts = pattern.occurrences.reduce((acc, curr) => {
                    acc[curr.opponent] = (acc[curr.opponent] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const mainOpponent = Object.entries(opponentCounts)
                    .sort(([,a], [,b]) => b - a)[0][0];

                // Pattern'i düzenle
                return {
                    type: 'score_trigger',
                    scoreDiff,
                    mainOpponent,
                    occurrences: pattern.occurrences,
                    description: `${mainOpponent} ile ${opponentCounts[mainOpponent]} kez ve toplamda ${pattern.occurrences.length} kez tekrarlanan ${scoreDiff} gol farklı pattern`,
                    confidence: Math.min(100, pattern.occurrences.length * 20)
                };
            })
            .filter(pattern => {
                // En az bir rakiple 2 kez veya toplam 3 kez kullanılmış patternleri göster
                const mainOpponentCount = pattern.occurrences.filter(o => o.opponent === pattern.mainOpponent).length;
                return mainOpponentCount >= 2 || pattern.occurrences.length >= 3;
            })
            .sort((a, b) => b.confidence - a.confidence);
    };

    // Yardımcı fonksiyonlar buraya taşınabilir
    const findYTeamSurprises = () => {
        if (!lastOpponent) return [];
        
        const allMatches = matchData.filter(match => 
            match.Div === selectedLeague &&
            (match.HomeTeam === lastOpponent || match.AwayTeam === lastOpponent)
        );

        const surprises = allMatches
            .filter(match => {
                const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                  (match.HTR === 'A' && match.FTR === 'H');
                return isSurprise;
            })
            .map(match => ({
                opponent: match.HomeTeam === lastOpponent ? match.AwayTeam : match.HomeTeam,
                score: `${match.FTHG}-${match.FTAG}`,
                date: formatDate(Number(match.Date)),
                rawDate: Number(match.Date),
                season: match.Season,
                isHome: match.HomeTeam === lastOpponent
            }))
            .sort((a, b) => {
                const dateA = new Date((a.rawDate - 25569) * 86400 * 1000);
                const dateB = new Date((b.rawDate - 25569) * 86400 * 1000);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, surprisePageCount * 5);

        return surprises;
    };

    // Son sürprizden sonraki maç sayısını bulan fonksiyon
    const findMatchesAfterLastSurprise = () => {
        if (!currentTeam) return null;
        
        const teamMatches = matchData
            .filter(match => 
                match.Div === selectedLeague &&
                (match.HomeTeam === currentTeam || match.AwayTeam === currentTeam)
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        // Son sürprizi bul
        const lastSurprise = teamMatches.find(match => 
            (match.HTR === 'H' && match.FTR === 'A') || 
            (match.HTR === 'A' && match.FTR === 'H')
        );

        if (!lastSurprise) return null;

        // Son sürprizden sonraki maç sayısını hesapla
        const matchesAfter = teamMatches.filter(match => 
            Number(match.Date) > Number(lastSurprise.Date)
        ).length;

        return {
            matchCount: matchesAfter,
            date: formatDate(Number(lastSurprise.Date)),
            opponent: lastSurprise.HomeTeam === currentTeam ? 
                     lastSurprise.AwayTeam : 
                     lastSurprise.HomeTeam,
            score: `${lastSurprise.FTHG}-${lastSurprise.FTAG}`,
            isHome: lastSurprise.HomeTeam === currentTeam
        };
    };

    const lastSurpriseInfo = findMatchesAfterLastSurprise();

    // Ortak rakipleri bulan fonksiyon
    const findCommonSurpriseOpponents = () => {
        if (!currentTeam) return [];

        const startDate = new Date('2024-08-01').getTime() / (86400 * 1000) + 25569;
        const endDate = new Date('2025-08-31').getTime() / (86400 * 1000) + 25569;

        const xTeamSurprises = matchData
            .filter(match => 
                match.Div === selectedLeague &&
                (match.HomeTeam === currentTeam || match.AwayTeam === currentTeam) &&
                Number(match.Date) >= startDate &&
                Number(match.Date) <= endDate &&
                ((match.HTR === 'H' && match.FTR === 'A') || 
                 (match.HTR === 'A' && match.FTR === 'H'))
            )
            .map(match => ({
                opponent: match.HomeTeam === currentTeam ? match.AwayTeam : match.HomeTeam,
                date: Number(match.Date),
                score: `${match.FTHG}-${match.FTAG}`,
                isHome: match.HomeTeam === currentTeam
            }));

        // Her rakip için diğer takımların sürprizlerini grupla
        const groupedSurprises = xTeamSurprises.reduce((acc, xSurprise) => {
            const otherTeamSurprises = matchData
                .filter(match =>
                    match.Div === selectedLeague &&
                    (match.HomeTeam === xSurprise.opponent || match.AwayTeam === xSurprise.opponent) &&
                    match.HomeTeam !== currentTeam && 
                    match.AwayTeam !== currentTeam &&
                    Number(match.Date) >= startDate &&
                    Number(match.Date) <= endDate &&
                    ((match.HTR === 'H' && match.FTR === 'A') || 
                     (match.HTR === 'A' && match.FTR === 'H'))
                )
                .map(match => ({
                    team: match.HomeTeam === xSurprise.opponent ? match.AwayTeam : match.HomeTeam,
                    date: Number(match.Date),
                    score: `${match.FTHG}-${match.FTAG}`
                }));

            if (otherTeamSurprises.length > 0) {
                acc.push({
                    opponent: xSurprise.opponent,
                    xTeamInfo: {
                        date: formatDate(xSurprise.date),
                        score: xSurprise.score
                    },
                    otherTeams: otherTeamSurprises.map(surprise => ({
                        team: surprise.team,
                        date: formatDate(surprise.date),
                        score: surprise.score
                    }))
                });
            }

            return acc;
        }, []);

        return groupedSurprises;
    };

    const commonSurprises = findCommonSurpriseOpponents();

    // Tarihten sezon hesaplama yardımcı fonksiyonu
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

    // Bugünün tarihine yakın sürprizleri bulan fonksiyon
    const findTodaysSurprises = () => {
        if (!currentTeam) return [];

        // Bugünün tarihini al
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // 0-11 -> 1-12
        const currentDay = today.getDate();

        // Tüm maçları filtrele
        const surprises = matchData
            .filter(match => {
                // Maç tarihini JS Date objesine çevir
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                const matchMonth = matchDate.getMonth() + 1;
                const matchDay = matchDate.getDate();

                // Aynı ay ve yakın günler (+/- 2 gün)
                const isNearbyDate = matchMonth === currentMonth && 
                    Math.abs(matchDay - currentDay) <= 2;

                // Sürpriz maç kontrolü
                const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                  (match.HTR === 'A' && match.FTR === 'H');

                // Takımın maçı mı?
                const isTeamMatch = match.HomeTeam === currentTeam || 
                                  match.AwayTeam === currentTeam;

                return isNearbyDate && isSurprise && isTeamMatch;
            })
            .map(match => ({
                opponent: match.HomeTeam === currentTeam ? match.AwayTeam : match.HomeTeam,
                score: `${match.FTHG}-${match.FTAG}`,
                date: formatDate(Number(match.Date)),
                season: getSeasonFromDate(Number(match.Date)),
                isHome: match.HomeTeam === currentTeam
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return surprises;
    };

    // Skor rengini belirleyen yardımcı fonksiyon
    const getScoreColor = (score: string, isHome: boolean) => {
        const [home, away] = score.split('-').map(Number);
        const isWin = isHome ? home > away : away > home;
        const isDraw = home === away;
        
        if (isDraw) return 'text-yellow-400';
        return isWin ? 'text-green-400' : 'text-red-400';
    };

    // Pattern detay modalı için state
    const [selectedPatternData, setSelectedPatternData] = useState<{team: string, pattern: Pattern} | null>(null);

    // Pattern detaylarını görselleştiren bileşen
    const PatternVisualizer = ({ pattern }: { pattern: Pattern }) => {
        return (
            <div className="space-y-8">
                {pattern.occurrences.map((occurrence, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-xl p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-blue-400">
                                    {occurrence.season} Sezonu
                                </h3>
                                <div className="mt-2 text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full inline-block">
                                    {pattern.triggerScore} Gol Farkı Pattern Tetikleyici
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-medium text-gray-300">
                                    vs {occurrence.opponent}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {occurrence.opponent === pattern.mainOpponent ? 
                                        'Ana Pattern Rakibi' : 'Benzer Pattern Rakibi'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-blue-600/20 via-blue-600/50 to-blue-600/20" />
                            
                            <div className="grid grid-cols-2 gap-12">
                                {/* İlk Yarı Maçı */}
                                <div className="space-y-2">
                                    <div className="text-yellow-500 font-medium mb-4">
                                        İlk Yarı Maçı
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TeamLogo name={selectedPatternData.team} className="w-6 h-6" />
                                            <span className="text-gray-400">vs</span>
                                            <TeamLogo name={occurrence.opponent} className="w-6 h-6" />
                                        </div>
                                        <div className="text-xl font-bold text-yellow-400 mb-1">
                                            {occurrence.firstMatch.score}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {occurrence.firstMatch.date}
                                        </div>
                                    </div>
                                </div>

                                {/* İkinci Yarı Maçı */}
                                <div className="space-y-2">
                                    <div className="text-purple-500 font-medium mb-4">
                                        İkinci Yarı Maçı (Sürpriz)
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <TeamLogo name={selectedPatternData.team} className="w-6 h-6" />
                                            <span className="text-gray-400">vs</span>
                                            <TeamLogo name={occurrence.opponent} className="w-6 h-6" />
                                        </div>
                                        <div className="text-xl font-bold text-purple-400 mb-1">
                                            {occurrence.surpriseMatch.score}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {occurrence.surpriseMatch.date}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Tahmin modalı için state
    const [selectedPrediction, setSelectedPrediction] = useState<{
        team: string;
        opponent?: string;
    } | null>(null);

    // Seçilen rakiple olan maçı bulan fonksiyon
    const getCurrentSeasonMatch = (opponent: string) => {
        console.log("Aranan takım:", opponent);
        console.log("Mevcut takım:", currentTeam);
        console.log("Seçili lig:", selectedLeague);

        if (!currentTeam || !opponent || !matchData) {
            console.log("Eksik veri var");
            return null;
        }

        const currentSeason = getCurrentSeason();
        console.log("Mevcut sezon:", currentSeason);

        // Bu sezonki maçı bul
        const match = matchData.find(match => {
            // Önce lig kontrolü
            if (match.Div !== selectedLeague) {
                return false;
            }

            const matchSeason = getSeasonFromDate(Number(match.Date));
            const isCurrentSeason = matchSeason === currentSeason;
            const isCorrectTeams = (match.HomeTeam === currentTeam && match.AwayTeam === opponent) ||
                                  (match.HomeTeam === opponent && match.AwayTeam === currentTeam);

            console.log("Kontrol edilen maç:", {
                league: match.Div,
                date: formatDate(Number(match.Date)),
                season: matchSeason,
                home: match.HomeTeam,
                away: match.AwayTeam,
                isCurrentSeason,
                isCorrectTeams
            });

            return isCurrentSeason && isCorrectTeams;
        });

        if (match) {
            console.log("Bulunan maç:", match);
            return {
                date: formatDate(Number(match.Date)),
                score: `${match.FTHG}-${match.FTAG}`,
                isHome: match.HomeTeam === currentTeam
            };
        }

        console.log("Maç bulunamadı");
        return null;
    };

    // Pattern tahmin fonksiyonu
    const predictPattern = (opponent: string, currentMatch: any) => {
        console.log("Pattern tahmini yapılıyor...");
        console.log("Ana takım:", currentTeam);
        console.log("Rakip:", opponent);
        console.log("Mevcut maç:", currentMatch);

        if (!currentMatch) return null;

        // Skor farkını hesapla
        const [home, away] = currentMatch.score.split('-').map(Number);
        const scoreDiff = Math.abs(home - away);
        console.log("Mevcut maç skor farkı:", scoreDiff);

        // Ana takım patternleri
        const homeTeamActivePatterns = findPatterns().filter(pattern => 
            pattern.scoreDiff === scoreDiff
        );
        const homeTeamSinglePatterns = findSinglePatterns().filter(pattern =>
            pattern.scoreDiff === scoreDiff
        );

        // Rakip takım patternleri
        const awayTeamActivePatterns = findPatterns(opponent).filter(pattern => 
            pattern.scoreDiff === scoreDiff
        );
        const awayTeamSinglePatterns = findSinglePatterns(opponent).filter(pattern =>
            pattern.scoreDiff === scoreDiff
        );

        console.log("Ana takım aktif patternler:", homeTeamActivePatterns);
        console.log("Ana takım tek seferlik patternler:", homeTeamSinglePatterns);
        console.log("Rakip takım aktif patternler:", awayTeamActivePatterns);
        console.log("Rakip takım tek seferlik patternler:", awayTeamSinglePatterns);

        // Pattern değerlendirmesi
        const prediction = {
            homeTeam: {
                hasPattern: false,
                type: null as 'active' | 'single' | null,
                pattern: null,
                confidence: 0
            },
            awayTeam: {
                hasPattern: false,
                type: null as 'active' | 'single' | null,
                pattern: null,
                confidence: 0
            },
            overallConfidence: 0
        };

        // Ana takım pattern'i
        if (homeTeamActivePatterns.length > 0) {
            prediction.homeTeam = {
                hasPattern: true,
                type: 'active',
                pattern: homeTeamActivePatterns[0],
                confidence: homeTeamActivePatterns[0].confidence
            };
        } else if (homeTeamSinglePatterns.length > 0) {
            prediction.homeTeam = {
                hasPattern: true,
                type: 'single',
                pattern: homeTeamSinglePatterns[0],
                confidence: 30
            };
        }

        // Rakip takım pattern'i
        if (awayTeamActivePatterns.length > 0) {
            prediction.awayTeam = {
                hasPattern: true,
                type: 'active',
                pattern: awayTeamActivePatterns[0],
                confidence: awayTeamActivePatterns[0].confidence
            };
        } else if (awayTeamSinglePatterns.length > 0) {
            prediction.awayTeam = {
                hasPattern: true,
                type: 'single',
                pattern: awayTeamSinglePatterns[0],
                confidence: 30
            };
        }

        // Genel güven skoru hesaplama
        if (prediction.homeTeam.hasPattern || prediction.awayTeam.hasPattern) {
            // Her iki takımda da pattern varsa
            if (prediction.homeTeam.hasPattern && prediction.awayTeam.hasPattern) {
                prediction.overallConfidence = Math.round(
                    (prediction.homeTeam.confidence + prediction.awayTeam.confidence) / 2
                );
            } else {
                // Tek takımda pattern varsa
                prediction.overallConfidence = Math.round(
                    (prediction.homeTeam.hasPattern ? prediction.homeTeam.confidence : prediction.awayTeam.confidence) * 0.8
                );
            }

            return prediction;
        }

        return null;
    };

    // Tek seferlik patternleri bulan fonksiyonu da güncelleyelim
    const findSinglePatterns = (team: string = currentTeam) => {
        if (!team) return [];

        // Tüm maçları sezonlara göre grupla
        const seasonMatches = matchData.reduce((acc, match) => {
            if (match.HomeTeam !== team && match.AwayTeam !== team) return acc;
            
            const season = getSeasonFromDate(Number(match.Date));
            if (!acc[season]) {
                acc[season] = {
                    firstHalf: [],
                    secondHalf: []
                };
            }

            // Maç bilgilerini hazırla
            const matchInfo = {
                opponent: match.HomeTeam === team ? match.AwayTeam : match.HomeTeam,
                date: formatDate(Number(match.Date)),
                score: match.HomeTeam === team ? 
                    `${match.FTHG}-${match.FTAG}` : 
                    `${match.FTAG}-${match.FTHG}`, // Skoru takımın perspektifinden göster
                isHome: match.HomeTeam === team,
                isSurprise: (match.HTR === 'H' && match.FTR === 'A') || 
                           (match.HTR === 'A' && match.FTR === 'H')
            };

            // Sezonun hangi yarısında olduğunu belirle
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            const isFirstHalf = matchDate.getMonth() >= 7 && matchDate.getMonth() <= 11;
            
            if (isFirstHalf) {
                acc[season].firstHalf.push(matchInfo);
            } else {
                acc[season].secondHalf.push(matchInfo);
            }

            return acc;
        }, {} as Record<string, { firstHalf: any[], secondHalf: any[] }>);

        // Tek seferlik patternleri bul
        const singlePatterns: any[] = [];

        Object.entries(seasonMatches).forEach(([season, halves]) => {
            halves.firstHalf.forEach(firstMatch => {
                const secondHalfMatch = halves.secondHalf.find(m => 
                    m.opponent === firstMatch.opponent && m.isSurprise
                );

                if (secondHalfMatch) {
                    const [firstHome, firstAway] = firstMatch.score.split('-').map(Number);
                    const scoreDiff = Math.abs(firstHome - firstAway);

                    singlePatterns.push({
                        type: 'score_trigger',
                        scoreDiff,
                        opponent: firstMatch.opponent,
                        season,
                        firstMatch,
                        surpriseMatch: secondHalfMatch
                    });
                }
            });
        });

        return singlePatterns;
    };

    return (
        <div className="w-full text-left">
            <div className="space-y-3 p-4">
                {/* Y Takımı Sürpriz Maçları */}
                <div className="space-y-4">
                    <button 
                        onClick={() => setOpenPanels(prev => ({
                            ...prev, 
                            surpriseMatches: !prev.surpriseMatches
                        }))}
                        className="w-full flex items-center justify-between text-lg text-white font-medium border-b border-gray-700 pb-2"
                    >
                        <span>{lastOpponent ? `${lastOpponent} Sürpriz Maçları` : "Sürpriz Maçlar"}</span>
                        <svg 
                            className={`w-5 h-5 transition-transform ${openPanels.surpriseMatches ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openPanels.surpriseMatches && (
                        <div className="space-y-3">
                            {/* Mevcut Y takımı sürpriz maçları içeriği */}
                            {!isLoading && showResults && lastOpponent 
                                ? findYTeamSurprises().map((surprise, index) => (
                                    <div key={`surprise-${index}`} 
                                         className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <TeamLogo 
                                                    name={surprise.opponent}
                                                    className="w-6 h-6"
                                                />
                                                <span className="text-gray-300">
                                                    {surprise.opponent}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
                                                {surprise.season}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`${getScoreColor(surprise.score, surprise.isHome)} font-medium`}>
                                                {surprise.score}
                                            </span>
                                            <span className="text-gray-500">
                                                {surprise.date}
                                            </span>
                                        </div>
                                    </div>
                                ))
                                : <div className="text-gray-500 text-sm">
                                    Henüz analiz yapılmadı
                                  </div>
                            }
                            {/* Daha Fazla butonu */}
                            {!isLoading && showResults && lastOpponent && 
                             findYTeamSurprises().length >= surprisePageCount * 5 && (
                                <button
                                    onClick={() => setSurprisePageCount(prev => prev + 1)}
                                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition-colors text-sm"
                                >
                                    Daha Fazla Göster
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Son Sürpriz Analizi */}
                <div className="space-y-4">
                    <button 
                        onClick={() => setOpenPanels(prev => ({
                            ...prev, 
                            lastSurprise: !prev.lastSurprise
                        }))}
                        className="w-full flex items-center justify-between text-lg text-white font-medium border-b border-gray-700 pb-2"
                    >
                        <span>Son Sürpriz</span>
                        <svg 
                            className={`w-5 h-5 transition-transform ${openPanels.lastSurprise ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openPanels.lastSurprise && (
                        <div className="space-y-3">
                            {lastSurpriseInfo ? (
                                <div className="bg-gray-900/30 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <TeamLogo 
                                            name={lastSurpriseInfo.opponent}
                                            className="w-6 h-6"
                                        />
                                        <span className="text-gray-300">
                                            {lastSurpriseInfo.opponent}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mb-3">
                                        <span className={`${getScoreColor(lastSurpriseInfo.score, lastSurpriseInfo.isHome)} font-medium`}>
                                            {lastSurpriseInfo.score}
                                        </span>
                                        <span className="text-gray-500">
                                            {lastSurpriseInfo.date}
                                        </span>
                                    </div>
                                    <div className="text-blue-400 font-medium">
                                        Son sürprizden sonra {lastSurpriseInfo.matchCount} maç oynandı
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Henüz sürpriz maç bulunamadı
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Ortak Rakipler Analizi */}
                <div className="space-y-4">
                    <button 
                        onClick={() => setOpenPanels(prev => ({
                            ...prev, 
                            commonOpponents: !prev.commonOpponents
                        }))}
                        className="w-full flex items-center justify-between text-lg text-white font-medium border-b border-gray-700 pb-2"
                    >
                        <span>Ortak Rakipler</span>
                        <svg 
                            className={`w-5 h-5 transition-transform ${openPanels.commonOpponents ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openPanels.commonOpponents && (
                        <div className="space-y-3">
                            <div className="text-xs text-gray-500 italic">
                                2024 Ağustos - 2025 Ağustos arası
                            </div>
                            {commonSurprises.length > 0 ? (
                                commonSurprises.map((surprise, index) => (
                                    <div key={`common-${index}`} 
                                         className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors">
                                        {/* Sürpriz Rakip */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <TeamLogo 
                                                name={surprise.opponent}
                                                className="w-6 h-6"
                                            />
                                            <span className="text-gray-300 font-medium">
                                                {surprise.opponent}
                                            </span>
                                        </div>

                                        {/* X Takımının Maçı */}
                                        <div className="bg-green-900/30 rounded p-3 mb-3 border border-green-800/50">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <TeamLogo 
                                                        name={currentTeam}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-green-400 font-medium">
                                                        {currentTeam}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`${getScoreColor(surprise.xTeamInfo.score, true)} font-medium`}>
                                                        {surprise.xTeamInfo.score}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {surprise.xTeamInfo.date}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Diğer Takımların Maçları */}
                                        <div className="space-y-2">
                                            <div className="text-xs text-gray-500 mb-2">
                                                Diğer Sürpriz Maçlar ({surprise.otherTeams.length})
                                            </div>
                                            {surprise.otherTeams.map((otherTeam, idx) => (
                                                <div key={`other-${idx}`} 
                                                     className="flex items-center justify-between text-sm bg-gray-900/20 rounded p-2">
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo 
                                                            name={otherTeam.team}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-purple-400">
                                                            {otherTeam.team}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`${getScoreColor(otherTeam.score, otherTeam.isHome)} font-medium`}>
                                                            {otherTeam.score}
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {otherTeam.date}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Bu tarih aralığında ortak sürpriz rakip bulunamadı
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bugünlerde Sürpriz Analizi */}
                <div className="space-y-4">
                    <button 
                        onClick={() => setOpenPanels(prev => ({
                            ...prev, 
                            todaysSurprises: !prev.todaysSurprises
                        }))}
                        className="w-full flex items-center justify-between text-lg text-white font-medium border-b border-gray-700 pb-2"
                    >
                        <span>Bugünlerde Sürpriz</span>
                        <svg 
                            className={`w-5 h-5 transition-transform ${openPanels.todaysSurprises ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openPanels.todaysSurprises && (
                        <div className="space-y-3">
                            <div className="text-xs text-gray-500 italic">
                                {new Date().toLocaleDateString('tr-TR', { 
                                    day: 'numeric',
                                    month: 'long'
                                })} tarihine yakın maçlar (±2 gün)
                            </div>
                            {findTodaysSurprises().length > 0 ? (
                                findTodaysSurprises().map((surprise, index) => (
                                    <div key={`today-${index}`} 
                                         className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <TeamLogo 
                                                    name={surprise.opponent}
                                                    className="w-6 h-6"
                                                />
                                                <span className="text-gray-300">
                                                    {surprise.opponent}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
                                                {surprise.season}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`${getScoreColor(surprise.score, surprise.isHome)} font-medium`}>
                                                {surprise.score}
                                            </span>
                                            <span className="text-gray-500">
                                                {surprise.date}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Bu tarihlerde geçmiş sürpriz maç bulunamadı
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Pattern Analizi */}
                <div className="space-y-4">
                    <button 
                        onClick={() => setOpenPanels(prev => ({
                            ...prev, 
                            patterns: !prev.patterns
                        }))}
                        className="w-full flex items-center justify-between text-lg text-white font-medium border-b border-gray-700 pb-2"
                    >
                        <span>Patern Analizi</span>
                        <svg className={`w-5 h-5 transition-transform ${openPanels.patterns ? 'rotate-180' : ''}`}
                             fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {openPanels.patterns && (
                        <div className="space-y-3">
                            {findPatterns().length > 0 ? (
                                <div className="grid grid-cols-1 gap-3">
                                    {findPatterns().map((pattern, index) => (
                                        <button
                                            key={`pattern-${index}`}
                                            onClick={() => setSelectedPatternData({ team: currentTeam, pattern })}
                                            className="bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <TeamLogo 
                                                    name={pattern.mainOpponent}
                                                    className="w-6 h-6"
                                                />
                                                <span className="text-gray-300 font-medium">
                                                    {pattern.scoreDiff} Gol Farkı Pattern
                                                </span>
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <span className="text-xs text-blue-400 px-2 py-1 bg-blue-500/10 rounded">
                                                        {pattern.occurrences.filter(o => o.opponent === pattern.mainOpponent).length} ana
                                                    </span>
                                                    <span className="text-xs text-purple-400 px-2 py-1 bg-purple-500/10 rounded">
                                                        {pattern.occurrences.length} toplam
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {pattern.description}
                                            </div>
                                            <div className="mt-2 w-full bg-gray-800 rounded-full h-1">
                                                <div 
                                                    className="bg-blue-500 h-1 rounded-full"
                                                    style={{ width: `${pattern.confidence}%` }}
                                                />
                                            </div>
                                        </button>
                                    ))}

                                    {/* Tahmin Kartı */}
                                    <button
                                        onClick={() => setSelectedPrediction({ team: currentTeam })}
                                        className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 hover:from-purple-900/40 hover:to-blue-900/40 transition-colors text-left border border-blue-500/20"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                            </div>
                                            <span className="text-blue-400 font-medium">Pattern Tahmini</span>
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Rakip seçerek olası pattern tahminlerini görüntüle
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    Henüz pattern bulunamadı
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* İlginç Detaylar */}
                <InterestingDetailsPanel 
                    matchData={matchData}
                    selectedLeague={selectedLeague}
                    currentTeam={currentTeam}
                    formatDate={formatDate}
                    lastOpponent={lastOpponent}
                />
            </div>

            {/* Pattern Modalı */}
            {selectedPatternData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 overflow-y-auto">
                    <div className="bg-gray-900 text-white rounded-xl w-[80vw] max-w-[1200px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button 
                            onClick={() => setSelectedPatternData(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 space-y-8">
                            {/* Üst Banner */}
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <TeamLogo name={selectedPatternData.team} className="w-16 h-16" />
                                        <span className="text-2xl text-gray-400">vs</span>
                                        <TeamLogo name={selectedPatternData.pattern.mainOpponent} className="w-16 h-16" />
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold mb-2">
                                            {selectedPatternData.team} vs {selectedPatternData.pattern.mainOpponent}
                                        </h1>
                                        <div className="text-gray-400 text-lg">
                                            {selectedPatternData.pattern.scoreDiff} Gol Farkı Pattern Analizi
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col gap-1">
                                        <div className="text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                                            {selectedPatternData.pattern.occurrences.filter(o => o.opponent === selectedPatternData.pattern.mainOpponent).length} kez ana rakiple
                                        </div>
                                        <div className="text-sm text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">
                                            {selectedPatternData.pattern.occurrences.length} kez toplamda
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pattern Görselleştirmesi */}
                            <div className="space-y-8">
                                {selectedPatternData.pattern.occurrences.map((occurrence, idx) => (
                                    <div key={idx} className="bg-gray-800/50 rounded-xl p-6">
                                        <div className="mb-6 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-xl font-semibold text-blue-400">
                                                    {occurrence.season} Sezonu
                                                </h3>
                                                <div className="mt-2 text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full inline-block">
                                                    {selectedPatternData.pattern.scoreDiff} Gol Farkı Pattern
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-medium text-gray-300">
                                                    vs {occurrence.opponent}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {occurrence.opponent === selectedPatternData.pattern.mainOpponent ? 
                                                        'Ana Pattern Rakibi' : 'Benzer Pattern Rakibi'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="relative">
                                            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-blue-600/20 via-blue-600/50 to-blue-600/20" />
                                            
                                            <div className="grid grid-cols-2 gap-12">
                                                {/* İlk Yarı Maçı */}
                                                <div className="space-y-2">
                                                    <div className="text-yellow-500 font-medium mb-4">
                                                        İlk Yarı Maçı
                                                    </div>
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <TeamLogo name={selectedPatternData.team} className="w-6 h-6" />
                                                            <span className="text-gray-400">vs</span>
                                                            <TeamLogo name={occurrence.opponent} className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-xl font-bold text-yellow-400 mb-1">
                                                            {occurrence.firstMatch.score}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">
                                                            {occurrence.firstMatch.date}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* İkinci Yarı Maçı */}
                                                <div className="space-y-2">
                                                    <div className="text-purple-500 font-medium mb-4">
                                                        İkinci Yarı Maçı (Sürpriz)
                                                    </div>
                                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <TeamLogo name={selectedPatternData.team} className="w-6 h-6" />
                                                            <span className="text-gray-400">vs</span>
                                                            <TeamLogo name={occurrence.opponent} className="w-6 h-6" />
                                                        </div>
                                                        <div className="text-xl font-bold text-purple-400 mb-1">
                                                            {occurrence.surpriseMatch.score}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">
                                                            {occurrence.surpriseMatch.date}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pattern Değerlendirmesi */}
                            <div className="bg-gray-800 rounded-xl p-6">
                                <div className="flex items-center gap-8">
                                    <div className="flex-1">
                                        <h2 className="text-xl font-semibold mb-4">Pattern Değerlendirmesi</h2>
                                        <div className="space-y-4">
                                            <p className="text-gray-300">
                                                {selectedPatternData.pattern.description}
                                            </p>
                                            <div className="text-sm text-gray-400">
                                                <span className="text-blue-400 font-medium">Ana Rakip:</span> {selectedPatternData.pattern.mainOpponent}
                                                <br />
                                                <span className="text-purple-400 font-medium">Benzer Pattern Rakipleri:</span> {
                                                    [...new Set(selectedPatternData.pattern.occurrences
                                                        .filter(o => o.opponent !== selectedPatternData.pattern.mainOpponent)
                                                        .map(o => o.opponent))]
                                                        .join(', ')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-32 h-32">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#2563eb"
                                                    strokeWidth="3"
                                                    strokeDasharray={`${selectedPatternData.pattern.confidence}, 100`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-bold text-blue-400">
                                                    {selectedPatternData.pattern.confidence.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-center text-gray-400 mt-2">
                                            Güven Skoru
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tahmin Modalı - Buraya ekleyelim */}
            {selectedPrediction && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[999999] p-4 overflow-y-auto">
                    <div className="bg-gray-900 text-white rounded-xl w-[80vw] max-w-[1200px] max-h-[90vh] overflow-y-auto relative shadow-2xl">
                        <button 
                            onClick={() => setSelectedPrediction(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8 space-y-8">
                            {!selectedPrediction.opponent ? (
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-bold text-blue-400">Rakip Seçin</h2>
                                    <div className="grid grid-cols-4 gap-4">
                                        {getAvailableOpponents().map(opponent => (
                                            <button
                                                key={opponent}
                                                onClick={() => setSelectedPrediction(prev => ({ ...prev!, opponent }))}
                                                className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
                                            >
                                                <TeamLogo name={opponent} className="w-12 h-12 mx-auto mb-2" />
                                                <div className="text-center text-gray-300">{opponent}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Üst Banner */}
                                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-4">
                                                <TeamLogo name={selectedPrediction.team} className="w-16 h-16" />
                                                <span className="text-2xl text-gray-400">vs</span>
                                                <TeamLogo name={selectedPrediction.opponent} className="w-16 h-16" />
                                            </div>
                                            <div className="flex-1">
                                                <h1 className="text-3xl font-bold mb-2">
                                                    Pattern Tahmini
                                                </h1>
                                                <div className="text-gray-400 text-lg">
                                                    {selectedPrediction.team} vs {selectedPrediction.opponent}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bu Sezonki Maç */}
                                    {(() => {
                                        const currentMatch = getCurrentSeasonMatch(selectedPrediction.opponent);
                                        console.log("Modal içinde bulunan maç:", currentMatch);

                                        return currentMatch ? (
                                            <div className="bg-gray-800/50 rounded-xl p-6">
                                                <h2 className="text-xl font-semibold text-blue-400 mb-4">
                                                    Bu Sezonki Maç
                                                </h2>
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <TeamLogo name={selectedPrediction.team} className="w-6 h-6" />
                                                        <span className="text-gray-400">vs</span>
                                                        <TeamLogo name={selectedPrediction.opponent} className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-xl font-bold text-blue-400 mb-1">
                                                        {currentMatch.score}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        {currentMatch.date}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-800/50 rounded-xl p-6">
                                                <div className="text-gray-400">
                                                    Bu sezon henüz maç oynanmamış
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Pattern Analizi */}
                                    {(() => {
                                        const currentMatch = getCurrentSeasonMatch(selectedPrediction.opponent);
                                        const prediction = currentMatch ? predictPattern(selectedPrediction.opponent, currentMatch) : null;

                                        return (
                                            <div className="space-y-8">
                                                {/* Mevcut maç gösterimi ... */}

                                                {prediction ? (
                                                    <div className="bg-gray-800/50 rounded-xl p-6">
                                                        <div className="flex items-center justify-between mb-6">
                                                            <h2 className="text-xl font-semibold text-blue-400">
                                                                Pattern Tahmini
                                                            </h2>
                                                            <div className="text-sm px-3 py-1 rounded-full bg-blue-500/10 text-blue-400">
                                                                Genel Güven: {prediction.overallConfidence}%
                                                            </div>
                                                        </div>

                                                        <div className="space-y-6">
                                                            {/* Ana Takım Pattern'i */}
                                                            {prediction.homeTeam.hasPattern && prediction.homeTeam.pattern && (
                                                                <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <TeamLogo name={currentTeam} className="w-6 h-6" />
                                                                            <span className="text-lg text-gray-300">Pattern Analizi</span>
                                                                        </div>
                                                                        <div className="text-sm px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                                                                            {prediction.homeTeam.type === 'active' ? 'Aktif Pattern' : 'Tek Seferlik Pattern'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mb-2">
                                                                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                                            <div 
                                                                                className="h-full bg-blue-500 rounded-full"
                                                                                style={{ width: `${prediction.homeTeam.confidence}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-blue-400 font-medium">
                                                                            {prediction.homeTeam.confidence}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-400">
                                                                        {prediction.homeTeam.type === 'active' 
                                                                            ? `${prediction.homeTeam.pattern.occurrences.length} kez kullanılmış pattern`
                                                                            : `${prediction.homeTeam.pattern.season} sezonunda kullanılmış`
                                                                        }
                                                                    </div>

                                                                    {/* Pattern Örneği */}
                                                                    {prediction.homeTeam.pattern.firstMatch && (
                                                                        <div className="mt-4 border-t border-gray-800 pt-4">
                                                                            <div className="text-sm text-gray-400 mb-3">Pattern Örneği:</div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="bg-yellow-500/10 rounded-lg p-3">
                                                                                    <div className="text-yellow-400 text-xs mb-2">İlk Yarı Maçı</div>
                                                                                    <div className="text-lg font-bold text-yellow-400">
                                                                                        {prediction.homeTeam.pattern.firstMatch.score}
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500">
                                                                                        {prediction.homeTeam.pattern.firstMatch.date}
                                                                                    </div>
                                                                                </div>
                                                                                {prediction.homeTeam.pattern.surpriseMatch && (
                                                                                    <div className="bg-purple-500/10 rounded-lg p-3">
                                                                                        <div className="text-purple-400 text-xs mb-2">İkinci Yarı Maçı</div>
                                                                                        <div className="text-lg font-bold text-purple-400">
                                                                                            {prediction.homeTeam.pattern.surpriseMatch.score}
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-500">
                                                                                            {prediction.homeTeam.pattern.surpriseMatch.date}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Rakip Takım Pattern'i */}
                                                            {prediction.awayTeam.hasPattern && prediction.awayTeam.pattern && (
                                                                <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <TeamLogo name={selectedPrediction.opponent} className="w-6 h-6" />
                                                                            <span className="text-lg text-gray-300">Pattern Analizi</span>
                                                                        </div>
                                                                        <div className="text-sm px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
                                                                            {prediction.awayTeam.type === 'active' ? 'Aktif Pattern' : 'Tek Seferlik Pattern'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 mb-2">
                                                                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                                            <div 
                                                                                className="h-full bg-purple-500 rounded-full"
                                                                                style={{ width: `${prediction.awayTeam.confidence}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-purple-400 font-medium">
                                                                            {prediction.awayTeam.confidence}%
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-400">
                                                                        {prediction.awayTeam.type === 'active' 
                                                                            ? `${prediction.awayTeam.pattern.occurrences.length} kez kullanılmış pattern`
                                                                            : `${prediction.awayTeam.pattern.season} sezonunda kullanılmış`
                                                                        }
                                                                    </div>

                                                                    {/* Pattern Örneği */}
                                                                    {prediction.awayTeam.pattern.firstMatch && (
                                                                        <div className="mt-4 border-t border-gray-800 pt-4">
                                                                            <div className="text-sm text-gray-400 mb-3">Pattern Örneği:</div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="bg-yellow-500/10 rounded-lg p-3">
                                                                                    <div className="text-yellow-400 text-xs mb-2">İlk Yarı Maçı</div>
                                                                                    <div className="text-lg font-bold text-yellow-400">
                                                                                        {prediction.awayTeam.pattern.firstMatch.score}
                                                                                    </div>
                                                                                    <div className="text-sm text-gray-500">
                                                                                        {prediction.awayTeam.pattern.firstMatch.date}
                                                                                    </div>
                                                                                </div>
                                                                                {prediction.awayTeam.pattern.surpriseMatch && (
                                                                                    <div className="bg-purple-500/10 rounded-lg p-3">
                                                                                        <div className="text-purple-400 text-xs mb-2">İkinci Yarı Maçı</div>
                                                                                        <div className="text-lg font-bold text-purple-400">
                                                                                            {prediction.awayTeam.pattern.surpriseMatch.score}
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-500">
                                                                                            {prediction.awayTeam.pattern.surpriseMatch.date}
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Genel Değerlendirme */}
                                                            <div className="bg-gray-900/50 rounded-lg p-4">
                                                                <h3 className="text-lg font-medium text-gray-300 mb-3">
                                                                    Genel Değerlendirme
                                                                </h3>
                                                                <div className="text-gray-400">
                                                                    {prediction.homeTeam.hasPattern && prediction.awayTeam.hasPattern
                                                                        ? "Her iki takımda da benzer pattern'ler mevcut"
                                                                        : prediction.homeTeam.hasPattern
                                                                        ? "Sadece ana takımda pattern mevcut"
                                                                        : "Sadece rakip takımda pattern mevcut"
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : currentMatch && (
                                                    <div className="bg-gray-800/50 rounded-xl p-6">
                                                        <div className="text-gray-400">
                                                            Bu skor için uygun pattern bulunamadı
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 
