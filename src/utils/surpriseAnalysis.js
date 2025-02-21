export function findPreviousMatches(matchData, team, date) {
    // Verilen tarihten önceki maçları filtrele
    const previousMatches = matchData
        .filter(match => new Date(match.Date) < new Date(date) &&
        (match.HomeTeam === team || match.AwayTeam === team))
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 3);
    if (previousMatches.length < 3) {
        return null;
    }
    return {
        newest: previousMatches[0],
        middle: previousMatches[1],
        oldest: previousMatches[2]
    };
}
function findTeamTrigger(matches, team, date) {
    // Tüm maçları tarih sırasına göre sırala
    const sortedMatches = [...matches].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    // Takımın maçlarını bul
    const teamMatches = sortedMatches.filter(m => (m.HomeTeam === team || m.AwayTeam === team) &&
        new Date(m.Date) < new Date(date));
    // Her rakip için tetikleme sayısını tut
    const triggerCounts = {};
    // Her maç için sürpriz kontrolü yap
    for (let i = 1; i < teamMatches.length; i++) {
        const currentMatch = teamMatches[i];
        const previousMatch = teamMatches[i - 1];
        // Sürpriz var mı kontrol et
        const isHome = currentMatch.HomeTeam === team;
        const isSurprise = (isHome && currentMatch.HTR === "A" && currentMatch.FTR === "H") ||
            (!isHome && currentMatch.HTR === "H" && currentMatch.FTR === "A");
        if (isSurprise) {
            // Önceki maçtaki rakibi bul
            const previousOpponent = previousMatch.HomeTeam === team ?
                previousMatch.AwayTeam : previousMatch.HomeTeam;
            // Bu rakibi tetikleyici olarak kaydet
            if (!triggerCounts[previousOpponent]) {
                triggerCounts[previousOpponent] = [];
            }
            triggerCounts[previousOpponent].push(currentMatch);
        }
    }
    // En çok tetiklemeye sebep olan takımı bul (en az 3 kez)
    let bestTrigger = '';
    let bestTriggerMatches = [];
    let maxTriggers = 0;
    Object.entries(triggerCounts).forEach(([opponent, matches]) => {
        if (matches.length >= 3 && matches.length > maxTriggers) {
            maxTriggers = matches.length;
            bestTrigger = opponent;
            bestTriggerMatches = matches;
        }
    });
    return bestTrigger ? {
        team,
        triggerTeam: bestTrigger,
        matches: bestTriggerMatches
    } : null;
}
export function findLeagueTrigger(matchData, team, date) {
    // Takımın ligini bul
    const teamLeague = matchData.find(m => m.HomeTeam === team || m.AwayTeam === team)?.Div;
    if (!teamLeague)
        return null;
    // Bu ligdeki tüm maçları al
    const leagueMatches = matchData
        .filter(m => m.Div === teamLeague && m.Date < date)
        .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
    // Ligteki tüm takımları bul
    const leagueTeams = new Set();
    leagueMatches.forEach(m => {
        leagueTeams.add(m.HomeTeam);
        leagueTeams.add(m.AwayTeam);
    });
    // Her takım için tetikleme sayısını hesapla
    const triggerCounts = new Map();
    leagueTeams.forEach(triggerTeam => {
        let totalSurpriseCount = 0;
        const allSurpriseMatches = [];
        // Bu takımla oynanan her maçtan sonra diğer takımların sürpriz yapıp yapmadığını kontrol et
        for (let i = 0; i < leagueMatches.length; i++) {
            const match = leagueMatches[i];
            // Bu takımın oynadığı maçları bul
            if (match.HomeTeam === triggerTeam || match.AwayTeam === triggerTeam) {
                // Bu takımın rakibini bul
                const opponent = match.HomeTeam === triggerTeam ? match.AwayTeam : match.HomeTeam;
                // Rakibin bir sonraki maçını bul
                for (let j = i + 1; j < leagueMatches.length; j++) {
                    const nextMatch = leagueMatches[j];
                    if (nextMatch.HomeTeam === opponent || nextMatch.AwayTeam === opponent) {
                        // Sürpriz kontrolü
                        const isHome = nextMatch.HomeTeam === opponent;
                        const isSurprise = (isHome && nextMatch.HTR === 'H' && nextMatch.FTR === 'A') ||
                            (!isHome && nextMatch.HTR === 'A' && nextMatch.FTR === 'H');
                        if (isSurprise) {
                            totalSurpriseCount++;
                            allSurpriseMatches.push(nextMatch);
                        }
                        break; // Sadece bir sonraki maça bak
                    }
                }
            }
        }
        if (totalSurpriseCount >= 3) {
            triggerCounts.set(triggerTeam, {
                count: totalSurpriseCount,
                matches: allSurpriseMatches
            });
        }
    });
    // En çok tetikleme yapan takımı bul
    let maxTriggerTeam = '';
    let maxTriggerCount = 0;
    let maxTriggerMatches = [];
    triggerCounts.forEach(({ count, matches }, triggerTeam) => {
        if (count > maxTriggerCount) {
            maxTriggerCount = count;
            maxTriggerTeam = triggerTeam;
            maxTriggerMatches = matches;
        }
    });
    if (maxTriggerCount >= 3) {
        return {
            team: team,
            league: teamLeague,
            triggerTeam: maxTriggerTeam,
            count: maxTriggerCount,
            matches: maxTriggerMatches
        };
    }
    return null;
}
// Yardımcı fonksiyon: tarihe gün ekle
function addDays(dateStr, days) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}
function findSimilarOddsMatches(matchData, date, odds) {
    const matches = matchData
        .filter(match => match.Date < date)
        .filter(match => {
        // Sadece sürpriz senaryolarına uyan maçları al
        const is12Scenario = Number(match.HTHG) > Number(match.HTAG) && Number(match.FTHG) < Number(match.FTAG);
        const is21Scenario = Number(match.HTHG) < Number(match.HTAG) && Number(match.FTHG) > Number(match.FTAG);
        return is12Scenario || is21Scenario;
    })
        .filter(match => {
        // Oranları kontrol et
        return match.B365CH === odds.home && match.B365CD === odds.draw && match.B365CA === odds.away;
    })
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
        .slice(0, 5);
    return matches;
}
function findSurpriseMatches(matches, team, date) {
    // Tarihten önceki maçları al ve sırala
    const sortedMatches = matches
        .filter(m => new Date(m.Date) < new Date(date))
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    const surpriseMatches = [];
    // Her maçı kontrol et
    sortedMatches.forEach((match, index) => {
        // Takımın maçı mı kontrol et
        if (match.HomeTeam !== team && match.AwayTeam !== team)
            return;
        const isHome = match.HomeTeam === team;
        // Sürpriz senaryo kontrolü
        // 1/2 senaryosu: HTR: H, FTR: A
        // 2/1 senaryosu: HTR: A, FTR: H
        const isSurprise = (isHome && match.HTR === 'H' && match.FTR === 'A') ||
            (!isHome && match.HTR === 'A' && match.FTR === 'H');
        if (isSurprise) {
            // Bu sürpriz maçtan önceki 3 maçı bul
            const previousMatches = findPreviousMatches(matches, team, match.Date);
            if (previousMatches) {
                surpriseMatches.push({
                    match,
                    previousMatches: [
                        previousMatches.newest,
                        previousMatches.middle,
                        previousMatches.oldest
                    ]
                });
            }
        }
    });
    return surpriseMatches;
}
function analyzeFixtureSimilarity(currentPreviousMatches, surpriseMatch) {
    // Mevcut son 3 maçtaki rakipleri al
    const currentOpponents = [
        currentPreviousMatches.newest.HomeTeam === surpriseMatch.match.HomeTeam ?
            currentPreviousMatches.newest.AwayTeam : currentPreviousMatches.newest.HomeTeam,
        currentPreviousMatches.middle.HomeTeam === surpriseMatch.match.HomeTeam ?
            currentPreviousMatches.middle.AwayTeam : currentPreviousMatches.middle.HomeTeam,
        currentPreviousMatches.oldest.HomeTeam === surpriseMatch.match.HomeTeam ?
            currentPreviousMatches.oldest.AwayTeam : currentPreviousMatches.oldest.HomeTeam
    ];
    // Sürpriz maçtan önceki rakipleri al
    const surpriseOpponents = surpriseMatch.previousMatches.map(m => m.HomeTeam === surpriseMatch.match.HomeTeam ? m.AwayTeam : m.HomeTeam);
    // Eşleşen rakipleri bul
    const matchingTeams = currentOpponents.filter(team => surpriseOpponents.includes(team));
    // Skor hesapla
    let score = 0;
    switch (matchingTeams.length) {
        case 3:
            score = 100;
            break;
        case 2:
            score = 66;
            break;
        case 1:
            score = 33;
            break;
    }
    return { score, matchingTeams };
}
function analyzeDrawSequence(matches) {
    const newest = matches.newest;
    const middle = matches.middle;
    // Son iki maçın skorlarını kontrol et
    const newestScore = `${newest.FTHG}-${newest.FTAG}`;
    const middleScore = `${middle.FTHG}-${middle.FTAG}`;
    // Beraberlik kontrolü
    const isNewestDraw = newest.FTR === 'D';
    const isMiddleDraw = middle.FTR === 'D';
    if (!isNewestDraw || !isMiddleDraw)
        return { exists: false, pattern: '' };
    // Özel beraberlik örüntüleri
    if (newestScore === middleScore) {
        if (newestScore === '1-1' || newestScore === '2-2') {
            return { exists: true, pattern: `${newestScore},${middleScore}` };
        }
    }
    return { exists: false, pattern: '' };
}
function analyzeLastMatch(match) {
    return {
        score: `${match.FTHG}-${match.FTAG}`,
        hasRedCard: match.RC ? match.RC > 0 : false
    };
}
function calculateWeek(date) {
    const matchDate = new Date(date);
    // Sezon başlangıcını bul (o yılın Ağustos ayı)
    const year = matchDate.getMonth() >= 7 ? matchDate.getFullYear() : matchDate.getFullYear() - 1;
    const seasonStart = new Date(year, 7, 1); // 7 = Ağustos (0-based)
    // Hafta farkını hesapla
    const weekDiff = Math.floor((matchDate.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return weekDiff + 1;
}
function findHeadToHeadSurprises(matches, homeTeam, awayTeam, date) {
    // Tarihten önceki karşılıklı maçları bul
    const h2hMatches = matches
        .filter(m => new Date(m.Date) < new Date(date))
        .filter(m => (m.HomeTeam === homeTeam && m.AwayTeam === awayTeam) ||
        (m.HomeTeam === awayTeam && m.AwayTeam === homeTeam))
        .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
    // Sürpriz senaryosu olan maçları bul
    const surpriseMatches = h2hMatches.filter(match => {
        const isHomeMatch = match.HomeTeam === homeTeam;
        return (isHomeMatch && match.HTR === 'H' && match.FTR === 'A') ||
            (!isHomeMatch && match.HTR === 'A' && match.FTR === 'H');
    });
    // En son sürpriz maç için fikstür benzerliği kontrolü
    let hasFixtureSimilarity = false;
    if (surpriseMatches.length > 0) {
        const lastSurpriseMatch = surpriseMatches[0];
        const team = lastSurpriseMatch.HomeTeam === homeTeam ? homeTeam : awayTeam;
        const previousMatches = findPreviousMatches(matches, team, lastSurpriseMatch.Date);
        if (previousMatches) {
            const currentPreviousMatches = findPreviousMatches(matches, team, date);
            if (currentPreviousMatches) {
                const similarity = analyzeFixtureSimilarity(currentPreviousMatches, {
                    match: lastSurpriseMatch,
                    previousMatches: [previousMatches.newest, previousMatches.middle, previousMatches.oldest]
                });
                hasFixtureSimilarity = similarity.score >= 66; // En az 2 takım eşleşmesi
            }
        }
    }
    return { matches: surpriseMatches, hasFixtureSimilarity };
}
export function analyzeSurpriseProbability(matchData, homeTeam, awayTeam, date, odds) {
    // Takımın ligini bul
    const selectedLeague = matchData.find(m => m.HomeTeam === homeTeam || m.AwayTeam === homeTeam)?.Div || '';
    // Takım ve lig tetikleyicilerini bul
    const homeTeamTrigger = findTeamTrigger(matchData, homeTeam, date);
    const awayTeamTrigger = findTeamTrigger(matchData, awayTeam, date);
    const homeLeagueTrigger = findLeagueTrigger(matchData, homeTeam, date);
    const awayLeagueTrigger = findLeagueTrigger(matchData, awayTeam, date);
    // Önceki maçları bul
    const homePreviousMatches = findPreviousMatches(matchData, homeTeam, date);
    const awayPreviousMatches = findPreviousMatches(matchData, awayTeam, date);
    // Her takım için sürpriz maç geçmişini bul
    const homeSurpriseMatches = findSurpriseMatches(matchData, homeTeam, date);
    const awaySurpriseMatches = findSurpriseMatches(matchData, awayTeam, date);
    // Benzer oranlı sürpriz maçları bul
    const similarOddsMatches = findSimilarOddsMatches(matchData, date, odds);
    // Sürpriz olasılığını hesapla
    let probability = 0;
    const details = {
        previousMatchesScore: 0,
        fixtureMatchScore: 0,
        drawSequenceScore: 0,
        lastMatchScore: 0,
        teamTriggerScore: 0,
        leagueTriggerScore: 0,
        weekAnalysisScore: 0,
        headToHeadScore: 0,
        oddsMatchScore: 0
    };
    // Tetikleyici skorlarını hesapla
    if (homeTeamTrigger || awayTeamTrigger) {
        details.teamTriggerScore = 20;
        probability += 20;
    }
    if (homeLeagueTrigger || awayLeagueTrigger) {
        details.leagueTriggerScore = 15;
        probability += 15;
    }
    // Fikstür benzerliği analizi
    if (homePreviousMatches && homeSurpriseMatches.length > 0) {
        const homeFixtureSimilarity = analyzeFixtureSimilarity(homePreviousMatches, homeSurpriseMatches[0]);
        details.fixtureMatchScore += Math.round(homeFixtureSimilarity.score / 3);
        probability += Math.round(homeFixtureSimilarity.score / 3);
    }
    if (awayPreviousMatches && awaySurpriseMatches.length > 0) {
        const awayFixtureSimilarity = analyzeFixtureSimilarity(awayPreviousMatches, awaySurpriseMatches[0]);
        details.fixtureMatchScore += Math.round(awayFixtureSimilarity.score / 3);
        probability += Math.round(awayFixtureSimilarity.score / 3);
    }
    // Beraberlik serisi analizi
    if (homePreviousMatches) {
        const homeDrawSequence = analyzeDrawSequence(homePreviousMatches);
        if (homeDrawSequence.exists) {
            details.drawSequenceScore += 10;
            probability += 10;
        }
    }
    if (awayPreviousMatches) {
        const awayDrawSequence = analyzeDrawSequence(awayPreviousMatches);
        if (awayDrawSequence.exists) {
            details.drawSequenceScore += 10;
            probability += 10;
        }
    }
    // Son maç analizi
    if (homePreviousMatches) {
        const homeLastMatch = analyzeLastMatch(homePreviousMatches.newest);
        if (homeLastMatch.score === '1-0') {
            details.lastMatchScore += 5;
            probability += 5;
            if (homeLastMatch.hasRedCard) {
                details.lastMatchScore += 5;
                probability += 5;
            }
        }
    }
    if (awayPreviousMatches) {
        const awayLastMatch = analyzeLastMatch(awayPreviousMatches.newest);
        if (awayLastMatch.score === '1-0') {
            details.lastMatchScore += 5;
            probability += 5;
            if (awayLastMatch.hasRedCard) {
                details.lastMatchScore += 5;
                probability += 5;
            }
        }
    }
    // Lig haftası analizi
    const currentWeek = calculateWeek(date);
    const homeSurpriseWeeks = homeSurpriseMatches.map(sm => calculateWeek(sm.match.Date));
    const awaySurpriseWeeks = awaySurpriseMatches.map(sm => calculateWeek(sm.match.Date));
    if (homeSurpriseWeeks.includes(currentWeek)) {
        details.weekAnalysisScore += 5;
        probability += 5;
    }
    if (awaySurpriseWeeks.includes(currentWeek)) {
        details.weekAnalysisScore += 5;
        probability += 5;
    }
    // Birebir oran eşleşmesi
    if (similarOddsMatches.length > 0) {
        const sameLeagueMatches = similarOddsMatches.filter(m => m.Div === selectedLeague);
        const sameTeamMatches = similarOddsMatches.filter(m => m.HomeTeam === homeTeam || m.AwayTeam === homeTeam ||
            m.HomeTeam === awayTeam || m.AwayTeam === awayTeam);
        if (sameTeamMatches.length > 0) {
            details.oddsMatchScore += 15;
            probability += 15;
        }
        else if (sameLeagueMatches.length > 0) {
            details.oddsMatchScore += 10;
            probability += 10;
        }
        else {
            details.oddsMatchScore += 5;
            probability += 5;
        }
    }
    // Karşılıklı sürpriz geçmişi analizi
    const h2hAnalysis = findHeadToHeadSurprises(matchData, homeTeam, awayTeam, date);
    if (h2hAnalysis.matches.length > 0) {
        details.headToHeadScore += 10;
        probability += 10;
        // Fikstür benzerliği kombinasyonu
        if (h2hAnalysis.hasFixtureSimilarity) {
            details.headToHeadScore += 15; // Ekstra puan
            probability += 15;
        }
    }
    // Normalize probability
    probability = Math.min(100, Math.max(0, probability));
    return {
        probability,
        details,
        warnings: [],
        triggers: {
            home: {
                team: homeTeamTrigger,
                league: homeLeagueTrigger
            },
            away: {
                team: awayTeamTrigger,
                league: awayLeagueTrigger
            }
        },
        previousMatches: {
            home: homePreviousMatches,
            away: awayPreviousMatches
        },
        similarOddsMatches
    };
}
