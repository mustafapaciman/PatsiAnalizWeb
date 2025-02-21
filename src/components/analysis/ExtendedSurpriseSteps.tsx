// 10. Basamak ve sonrası için genişletilmiş analiz basamakları

interface ExtendedStepResult {
    found: boolean;
    date?: string;
    details?: string;
    additionalData?: any;
}

// Yardımcı fonksiyonlar
const findLastNMatches = (team: string, beforeDate: number, matchData: any[], n: number) => {
    return matchData
        .filter(m => 
            Number(m.Date) < beforeDate && 
            (m.HomeTeam === team || m.AwayTeam === team)
        )
        .sort((a, b) => Number(b.Date) - Number(a.Date))
        .slice(0, n);
};

const findCommonOpponents = (matches1: any[], matches2: any[]) => {
    const opponents1 = matches1.map(m => m.HomeTeam === matches1[0].HomeTeam ? m.AwayTeam : m.HomeTeam);
    const opponents2 = matches2.map(m => m.HomeTeam === matches2[0].HomeTeam ? m.AwayTeam : m.HomeTeam);
    
    return opponents1.filter(opp => opponents2.includes(opp));
};

const findCommonScorePatterns = (matches1: any[], matches2: any[]) => {
    const scores1 = matches1.map(m => `${m.FTHG}-${m.FTAG}`);
    const scores2 = matches2.map(m => `${m.FTHG}-${m.FTAG}`);
    
    return scores1.filter(score => scores2.includes(score));
};

const findDrawLotteries = (matches1: any[], matches2: any[]) => {
    const isDrawLottery = (m: any) => 
        (m.HTR === 'H' && m.FTR === 'D') || 
        (m.HTR === 'A' && m.FTR === 'D');

    return [
        ...matches1.filter(isDrawLottery),
        ...matches2.filter(isDrawLottery)
    ];
};

// formatDate fonksiyonu
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Yeni yardımcı fonksiyon: Takımın maç paternlerini çıkarır
const getTeamMatchPatterns = (team: string, beforeDate: number, matchData: any[], n: number) => {
    const matches = findLastNMatches(team, beforeDate, matchData, n);
    return matches.map((match, index) => ({
        matchNumber: n - index,
        isHome: match.HomeTeam === team,
        opponent: match.HomeTeam === team ? match.AwayTeam : match.HomeTeam,
        score: `${match.FTHG}-${match.FTAG}`,
        HTR: match.HTR,
        FTR: match.FTR,
        result: match.HomeTeam === team ? match.FTR : 
               (match.FTR === 'H' ? 'A' : match.FTR === 'A' ? 'H' : 'D'),
        date: Number(match.Date)
    }));
};

// Yeni yardımcı fonksiyon: İki pattern listesini karşılaştırır
const comparePatterns = (currentPatterns: any[], historicalPatterns: any[]) => {
    const similarities = [];
    
    currentPatterns.forEach((currentMatch, index) => {
        const historicalMatch = historicalPatterns[index];
        if (!historicalMatch) return;

        const matchSimilarities = {
            matchNumber: currentMatch.matchNumber,
            currentMatch: {
                opponent: currentMatch.opponent,
                score: currentMatch.score,
                date: formatDate(currentMatch.date),
                HTR: currentMatch.HTR,
                FTR: currentMatch.FTR
            },
            historicalMatch: {
                opponent: historicalMatch.opponent,
                score: historicalMatch.score,
                date: formatDate(historicalMatch.date),
                HTR: historicalMatch.HTR,
                FTR: historicalMatch.FTR
            },
            similarities: []
        };

        // Benzerlik kontrolleri aynı kalacak, sadece logları kaldırıyoruz
        if (currentMatch.score === historicalMatch.score) {
            matchSimilarities.similarities.push({
                type: 'score',
                details: `Aynı skor: ${currentMatch.score}`,
                matchOrder: `Sürprizden önceki ${matchSimilarities.matchNumber}. maç`
            });
        }

        if (currentMatch.opponent === historicalMatch.opponent) {
            matchSimilarities.similarities.push({
                type: 'opponent',
                details: `Aynı rakip: ${currentMatch.opponent}`,
                matchOrder: `Sürprizden önceki ${matchSimilarities.matchNumber}. maç`
            });
        }

        const isCurrentDrawLottery = (currentMatch.HTR === 'H' && currentMatch.FTR === 'D') || 
                                   (currentMatch.HTR === 'A' && currentMatch.FTR === 'D');
        const isHistoricalDrawLottery = (historicalMatch.HTR === 'H' && historicalMatch.FTR === 'D') || 
                                      (historicalMatch.HTR === 'A' && historicalMatch.FTR === 'D');

        if (isCurrentDrawLottery && isHistoricalDrawLottery) {
            matchSimilarities.similarities.push({
                type: 'drawLottery',
                details: 'Her iki maçta da Beraberlik Piyangosu',
                matchOrder: `Sürprizden önceki ${matchSimilarities.matchNumber}. maç`
            });
        }

        const isCurrentSurprise = (currentMatch.HTR === 'H' && currentMatch.FTR === 'A') || 
                                (currentMatch.HTR === 'A' && currentMatch.FTR === 'H');
        const isHistoricalSurprise = (historicalMatch.HTR === 'H' && historicalMatch.FTR === 'A') || 
                                   (historicalMatch.HTR === 'A' && historicalMatch.FTR === 'H');

        if (isCurrentSurprise && isHistoricalSurprise) {
            matchSimilarities.similarities.push({
                type: 'surpriseChain',
                details: 'Her iki maçta da Sürpriz',
                matchOrder: `Sürprizden önceki ${matchSimilarities.matchNumber}. maç`
            });
        }

        if (matchSimilarities.similarities.length > 0) {
            similarities.push(matchSimilarities);
        }
    });

    return similarities;
};

// 10. Basamak: Benzerlik Paterni
export const checkSimilarityPattern = (
    team1: string,
    team2: string,
    currentMatch: any,
    matchData: any[],
    league: string
): ExtendedStepResult => {
    // Önceki sürpriz maçları bul
    const previousSurprises = matchData.filter(m => 
        m.Div === league &&
        Number(m.Date) < Number(currentMatch.Date) &&
        ((m.HomeTeam === team1 && m.AwayTeam === team2) ||
         (m.HomeTeam === team2 && m.AwayTeam === team1)) &&
        ((m.HTR === 'H' && m.FTR === 'A') || 
         (m.HTR === 'A' && m.FTR === 'H'))
    );

    if (previousSurprises.length === 0) {
        return { found: false };
    }

    const similarities = [];
    
    // Mevcut maç öncesi paternler
    const team1CurrentPatterns = getTeamMatchPatterns(team1, Number(currentMatch.Date), matchData, 5);
    const team2CurrentPatterns = getTeamMatchPatterns(team2, Number(currentMatch.Date), matchData, 5);

    for (const surprise of previousSurprises) {
        // Geçmiş sürpriz öncesi paternler
        const team1HistoricalPatterns = getTeamMatchPatterns(team1, Number(surprise.Date), matchData, 5);
        const team2HistoricalPatterns = getTeamMatchPatterns(team2, Number(surprise.Date), matchData, 5);

        // Her iki takım için benzerlik analizi
        const team1Similarities = comparePatterns(team1CurrentPatterns, team1HistoricalPatterns);
        const team2Similarities = comparePatterns(team2CurrentPatterns, team2HistoricalPatterns);

        if (team1Similarities.length > 0 || team2Similarities.length > 0) {
            similarities.push({
                date: formatDate(Number(surprise.Date)),
                team1Analysis: {
                    team: team1,
                    similarities: team1Similarities
                },
                team2Analysis: {
                    team: team2,
                    similarities: team2Similarities
                }
            });
        }
    }

    if (similarities.length > 0) {
        return {
            found: true,
            date: similarities[0].date,
            details: `${similarities.length} benzer sürpriz maç paterni bulundu`,
            additionalData: similarities
        };
    }

    return { found: false };
};

// Yeni yardımcı fonksiyon: Skor paterni kontrolü için
const checkScoreSequence = (score1: string, score2: string): boolean => {
    // Normal kontrol
    if (score1 === score2) return true;
    
    // Ters skor kontrolü (1-2 vs 2-1)
    const [h1, a1] = score1.split('-').map(Number);
    const [h2, a2] = score2.split('-').map(Number);
    return h1 === a2 && a1 === h2;
};

// 11. Basamak: Skor Sekans Paterni
export const checkScoreSequencePattern = (
    team: string,
    currentMatch: any,
    matchData: any[],
    league: string
): ExtendedStepResult => {
    try {
        console.log('\n=== 11. Basamak: Skor Sekans Analizi ===');
        console.log('Analiz edilen takım:', team);

        // Son 5 maçı al
        const last5Matches = findLastNMatches(team, Number(currentMatch.Date), matchData, 5);
        if (last5Matches.length < 3) {
            console.log('❌ Son 3 maç bulunamadı');
            return { found: false };
        }

        // Mevcut skor paternini oluştur
        const currentPattern = last5Matches.map(match => ({
            score: `${match.FTHG}-${match.FTAG}`,
            date: Number(match.Date)
        }));

        console.log('\nMevcut Skor Paterni:');
        currentPattern.forEach((match, idx) => {
            console.log(`${idx + 1}. Maç: ${match.score} (${formatDate(match.date)})`);
        });

        // Ana takım için kontrol
        const mainTeamResult = checkPatternForTeam(team, currentPattern, currentMatch, matchData, league);
        if (mainTeamResult.found) {
            return mainTeamResult;
        }

        // Ligdeki diğer takımlar için kontrol
        console.log('\nLigdeki diğer takımlar için pattern kontrolü yapılıyor...');
        const allTeams = new Set(matchData.filter(m => m.Div === league).map(m => m.HomeTeam));
        
        for (const otherTeam of allTeams) {
            if (otherTeam === team) continue;

            const otherTeamResult = checkPatternForTeam(otherTeam, currentPattern, currentMatch, matchData, league);
            if (otherTeamResult.found) {
                return {
                    ...otherTeamResult,
                    details: `${otherTeam} takımında benzer skor sekansı sonrası sürpriz: ${otherTeamResult.details}`
                };
            }
        }

        console.log('\n❌ Hiçbir takımda uygun pattern bulunamadı');
        return { found: false };

    } catch (error) {
        console.error('11. Basamak Hatası:', error);
        return { found: false };
    }
};

// Yardımcı fonksiyon: Belirli bir takım için pattern kontrolü
const checkPatternForTeam = (
    team: string,
    currentPattern: any[],
    currentMatch: any,
    matchData: any[],
    league: string
): ExtendedStepResult => {
    // Önceki sürpriz maçları bul
    const previousSurprises = matchData.filter(m => 
        m.Div === league &&
        Number(m.Date) < currentPattern[currentPattern.length - 1].date &&
        (m.HomeTeam === team || m.AwayTeam === team) &&
        ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
    );

    console.log(`\n${team} için bulunan önceki sürpriz maç sayısı: ${previousSurprises.length}`);

    for (const surprise of previousSurprises) {
        // Her sürpriz maç için önceki 5 maçı al
        const historicalMatches = findLastNMatches(team, Number(surprise.Date), matchData, 5);
        if (historicalMatches.length < 3) continue;

        // Skor paternini oluştur
        const historicalPattern = historicalMatches.map(match => ({
            score: `${match.FTHG}-${match.FTAG}`,
            date: Number(match.Date)
        }));

        // Son 3 maçın skorlarını kontrol et
        let matchCount = 0;
        for (let i = 0; i < 3; i++) {
            if (checkScoreSequence(currentPattern[i].score, historicalPattern[i].score)) {
                matchCount++;
            }
        }

        // En az son 3 maç eşleşiyorsa
        if (matchCount >= 3) {
            const opponent = surprise.HomeTeam === team ? surprise.AwayTeam : surprise.HomeTeam;
            return {
                found: true,
                date: formatDate(Number(surprise.Date)),
                details: `${opponent}'e karşı benzer skor sekansı sonrası sürpriz`,
                additionalData: {
                    team,
                    opponent,
                    currentPattern,
                    historicalPattern,
                    matchedScores: matchCount
                }
            };
        }
    }

    return { found: false };
}; 