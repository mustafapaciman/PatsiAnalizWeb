function getResultCode(result) {
    if (!result)
        return '-';
    switch (result.toUpperCase()) {
        case 'H':
            return '1';
        case 'D':
            return '0';
        case 'A':
            return '2';
        default:
            return '-';
    }
}
function calculateConfidence(match, selectedMatch) {
    let confidence = 50;
    // Güven seviyesi hesaplama mantığı
    return confidence;
}
function analyzePositiveFactors(match, selectedMatch) {
    const factors = [];
    // Pozitif faktörleri analiz etme mantığı
    return factors;
}
function analyzeNegativeFactors(match, selectedMatch) {
    const factors = [];
    // Negatif faktörleri analiz etme mantığı
    return factors;
}
function predictCorners(match) {
    let cornerPrediction = '8+';
    // Analyze odds to predict corner count
    if (match.B365H && match.B365A) {
        const totalOdds = match.B365H + match.B365A;
        if (totalOdds < 3.5) {
            // High scoring game expected
            cornerPrediction = '10+';
        }
        else if (totalOdds > 5) {
            // Low scoring game expected
            cornerPrediction = '7+';
        }
    }
    return cornerPrediction;
}
function getHighestConfidenceComment(match, positiveFactors) {
    if (positiveFactors.length === 0)
        return '';
    // Find the most confident prediction based on positive factors
    const confidenceKeywords = ['güçlü favori', 'yüksek ihtimal', 'benzerlik'];
    let highestConfidenceFactor = '';
    for (const factor of positiveFactors) {
        if (confidenceKeywords.some(keyword => factor.toLowerCase().includes(keyword))) {
            highestConfidenceFactor = factor;
            break;
        }
    }
    return highestConfidenceFactor;
}
export function analyzePrediction(match, selectedMatch) {
    // Skor tahminleri
    const halfTimeScore = `${selectedMatch.HTHG ?? '-'}-${selectedMatch.HTAG ?? '-'}`;
    const finalScore = `${selectedMatch.FTHG ?? '-'}-${selectedMatch.FTAG ?? '-'}`;
    // IY/MS senaryosu için sayısal kodları kullan
    const htResult = getResultCode(selectedMatch.HTR);
    const ftResult = getResultCode(selectedMatch.FTR);
    const htftScenario = `${htResult}/${ftResult}`;
    // Güven seviyesi ve faktörler
    const confidence = 50;
    const positiveFactors = [];
    const negativeFactors = [];
    // Maç oranları analizi
    if (match.B365H && match.B365A) {
        analyzeMatchOdds(match, positiveFactors, negativeFactors, confidence);
    }
    const cornerPrediction = predictCorners(match);
    const highestConfidenceComment = getHighestConfidenceComment(match, positiveFactors);
    return {
        halfTimeScore,
        finalScore,
        htftScenario,
        confidence,
        positiveFactors,
        negativeFactors,
        cornerPrediction,
        highestConfidenceComment
    };
}
function analyzeMatchOdds(match, positiveFactors, negativeFactors, confidence) {
    // Ev sahibi analizi
    if (match.B365H && match.B365H < 1.5) {
        positiveFactors.push("Ev sahibi takım güçlü favori (çok düşük oran)");
        confidence += 8;
    }
    else if (match.B365H && match.B365H < 2.0) {
        positiveFactors.push("Ev sahibi takım favori görünüyor (düşük oran)");
        confidence += 5;
    }
    else if (match.B365H && match.B365H > 3.5) {
        negativeFactors.push("Ev sahibi takım ciddi dezavantajlı (çok yüksek oran)");
        confidence -= 8;
    }
    else if (match.B365H && match.B365H > 3.0) {
        negativeFactors.push("Ev sahibi takım dezavantajlı (yüksek oran)");
        confidence -= 5;
    }
    // Deplasman analizi
    if (match.B365A && match.B365A < 1.5) {
        positiveFactors.push("Deplasman takımı güçlü favori (çok düşük oran)");
        confidence += 8;
    }
    else if (match.B365A && match.B365A < 2.0) {
        positiveFactors.push("Deplasman takımı favori görünüyor (düşük oran)");
        confidence += 5;
    }
    else if (match.B365A && match.B365A > 3.5) {
        negativeFactors.push("Deplasman takımı ciddi dezavantajlı (çok yüksek oran)");
        confidence -= 8;
    }
    else if (match.B365A && match.B365A > 3.0) {
        negativeFactors.push("Deplasman takımı dezavantajlı (yüksek oran)");
        confidence -= 5;
    }
    // Beraberlik analizi
    if (match.B365D && match.B365D < 3.0) {
        positiveFactors.push("Beraberlik ihtimali yüksek görünüyor");
        confidence += 3;
    }
    else if (match.B365D && match.B365D > 4.0) {
        negativeFactors.push("Beraberlik ihtimali düşük görünüyor");
        confidence -= 3;
    }
}
function analyzeOverUnder(match, positiveFactors, negativeFactors, confidence) {
    if (match['B365>2.5'] && match['B365>2.5'] < 1.8) {
        positiveFactors.push("Yüksek skorlu bir maç bekleniyor (güçlü gösterge)");
        confidence += 7;
    }
    else if (match['B365>2.5'] && match['B365>2.5'] < 2.0) {
        positiveFactors.push("Yüksek skorlu bir maç bekleniyor");
        confidence += 5;
    }
    else if (match['B365>2.5'] && match['B365>2.5'] > 2.5) {
        negativeFactors.push("Düşük skorlu bir maç bekleniyor");
        confidence -= 5;
    }
}
function analyzeAsianHandicap(match, positiveFactors, negativeFactors, confidence) {
    if (match.B365AHH) {
        const handicapValue = Math.abs(match.B365AHH);
        const favoredTeam = match.B365AHH > 0 ? "Ev sahibi" : "Deplasman";
        if (handicapValue >= 1.5) {
            positiveFactors.push(`${favoredTeam} takımı handikaplı bahiste güçlü favori (${handicapValue} gol)`);
            confidence += 8;
        }
        else if (handicapValue >= 1) {
            positiveFactors.push(`${favoredTeam} takımı handikaplı bahiste favori (${handicapValue} gol)`);
            confidence += 5;
        }
        else if (handicapValue >= 0.5) {
            positiveFactors.push(`${favoredTeam} takımı handikaplı bahiste hafif favori (${handicapValue} gol)`);
            confidence += 3;
        }
    }
}
function analyzeSimilarMatch(match, selectedMatch, positiveFactors, negativeFactors, confidence) {
    if (selectedMatch) {
        const homeOddsDiff = match.B365H && selectedMatch.B365H
            ? Math.abs(match.B365H - selectedMatch.B365H)
            : 0;
        const awayOddsDiff = match.B365A && selectedMatch.B365A
            ? Math.abs(match.B365A - selectedMatch.B365A)
            : 0;
        if (homeOddsDiff < 0.05 && awayOddsDiff < 0.05) {
            positiveFactors.push("Benzer maçtaki oranlarla neredeyse birebir aynı");
            confidence += 15;
        }
        else if (homeOddsDiff < 0.1 && awayOddsDiff < 0.1) {
            positiveFactors.push("Benzer maçtaki oranlarla çok yakın benzerlik");
            confidence += 10;
        }
        else if (homeOddsDiff < 0.2 && awayOddsDiff < 0.2) {
            positiveFactors.push("Benzer maçtaki oranlarla yakın benzerlik");
            confidence += 5;
        }
        else if (homeOddsDiff > 0.5 || awayOddsDiff > 0.5) {
            negativeFactors.push("Benzer maçtaki oranlarla önemli farklılıklar var");
            confidence -= 5;
        }
    }
}
function predictGoals(match) {
    let predictedHomeGoals = 1; // Başlangıç değeri
    let predictedAwayGoals = 1; // Başlangıç değeri
    // Ev sahibi gol tahmini
    if (match.B365H) {
        if (match.B365H < 1.5)
            predictedHomeGoals += 2;
        else if (match.B365H < 2.0)
            predictedHomeGoals += 1;
        else if (match.B365H > 3.5)
            predictedHomeGoals -= 0.5;
    }
    // Deplasman gol tahmini
    if (match.B365A) {
        if (match.B365A < 1.5)
            predictedAwayGoals += 2;
        else if (match.B365A < 2.0)
            predictedAwayGoals += 1;
        else if (match.B365A > 3.5)
            predictedAwayGoals -= 0.5;
    }
    // Over/Under etkisi
    if (match['B365>2.5'] && match['B365>2.5'] < 2.0) {
        predictedHomeGoals += 0.5;
        predictedAwayGoals += 0.5;
    }
    // Asian Handicap etkisi
    if (match.B365AHH) {
        if (match.B365AHH > 0)
            predictedHomeGoals += 0.5;
        else
            predictedAwayGoals += 0.5;
    }
    // Sonuçları yuvarla ve negatif değerleri engelle
    return {
        predictedHomeGoals: Math.max(0, Math.round(predictedHomeGoals)),
        predictedAwayGoals: Math.max(0, Math.round(predictedAwayGoals))
    };
}
function predictHalfTimeGoals(homeGoals, awayGoals) {
    return {
        htHomeGoals: Math.floor(homeGoals * 0.4),
        htAwayGoals: Math.floor(awayGoals * 0.4)
    };
}
function adjustConfidence(confidence, match) {
    // Oranların tutarlılığını kontrol et
    const hasConsistentOdds = match.B365H && match.B365A && match.B365D;
    if (!hasConsistentOdds) {
        confidence -= 10;
    }
    // Over/Under ve Asian Handicap bilgilerinin varlığını kontrol et
    const hasDetailedOdds = match['B365>2.5'] && match.B365AHH;
    if (!hasDetailedOdds) {
        confidence -= 5;
    }
    // Güven seviyesini sınırla
    return Math.max(30, Math.min(95, confidence));
}
function getResult(homeGoals, awayGoals) {
    if (homeGoals > awayGoals)
        return "1";
    if (homeGoals < awayGoals)
        return "2";
    return "0";
}
