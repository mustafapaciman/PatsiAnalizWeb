// Tolerans değeri
let MAX_TOLERANCE = 0.10;
// Toleransı güncelle
export function updateTolerance(newTolerance) {
    MAX_TOLERANCE = newTolerance;
}
// İki oranın benzerlik durumunu kontrol et
function checkOddsSimilarity(odd1, odd2) {
    if (!odd1 || !odd2)
        return false;
    const diff = Math.abs(Number(odd1) - Number(odd2));
    return diff <= MAX_TOLERANCE;
}
export function compareMatches(selectedMatch, comparisonMatch) {
    // Bet365 oran setlerini tanımla
    const bet365Sets = [
        // 1X2 oranları
        ['B365H', 'B365D', 'B365A'],
        // Over/Under oranları
        ['B365>2.5', 'B365<2.5'],
        // Asian Handicap oranları
        ['B365CAHH', 'B365CAHA']
    ];
    // Bet365 kapanış oranlarını kontrol et
    const closingOddsFields = ['B365H', 'B365D', 'B365A'];
    let hasExactClosingOdds = true;
    let hasDefinedClosingOdds = false;
    for (const field of closingOddsFields) {
        const selectedOdd = selectedMatch[field];
        const comparisonOdd = comparisonMatch[field];
        if (selectedOdd && comparisonOdd) {
            hasDefinedClosingOdds = true;
            if (Number(selectedOdd) !== Number(comparisonOdd)) {
                hasExactClosingOdds = false;
                break;
            }
        }
    }
    if (!hasDefinedClosingOdds) {
        hasExactClosingOdds = false;
    }
    // Herhangi bir Bet365 seti tam eşleşiyor mu kontrol et
    let hasExactBet365Match = false;
    for (const set of bet365Sets) {
        let isSetExact = true;
        let hasDefinedOdds = false;
        for (const field of set) {
            const selectedOdd = selectedMatch[field];
            const comparisonOdd = comparisonMatch[field];
            if (selectedOdd && comparisonOdd) {
                hasDefinedOdds = true;
                if (Number(selectedOdd) !== Number(comparisonOdd)) {
                    isSetExact = false;
                    break;
                }
            }
        }
        if (isSetExact && hasDefinedOdds) {
            hasExactBet365Match = true;
            break;
        }
    }
    // Tüm bookmakerlar ve oran çeşitleri için alanları tanımla
    const fields = [
        // 1X2 Oranları
        'B365H', 'B365D', 'B365A',
        'BWH', 'BWD', 'BWA',
        'IWH', 'IWD', 'IWA',
        'PSH', 'PSD', 'PSA',
        'WHH', 'WHD', 'WHA',
        'VCH', 'VCD', 'VCA',
        'MaxH', 'MaxD', 'MaxA',
        'AvgH', 'AvgD', 'AvgA',
        // Over/Under 2.5 Oranları
        'B365>2.5', 'B365<2.5',
        'BW>2.5', 'BW<2.5',
        'IW>2.5', 'IW<2.5',
        'PS>2.5', 'PS<2.5',
        'WH>2.5', 'WH<2.5',
        'VC>2.5', 'VC<2.5',
        'Max>2.5', 'Max<2.5',
        'Avg>2.5', 'Avg<2.5',
        // Asian Handicap Oranları
        'B365CAHH', 'B365CAHA',
        'BWAHH', 'BWAHA',
        'IWAHH', 'IWAHA',
        'PSAHH', 'PSAHA',
        'WHAHH', 'WHAHA',
        'VCAHH', 'VCAHA',
        'MaxAHH', 'MaxAHA',
        'AvgAHH', 'AvgAHA'
    ];
    // Tüm oranların tolerans içinde olup olmadığını kontrol et
    let allOddsWithinTolerance = true;
    let totalSimilarOdds = 0;
    let totalDefinedOdds = 0;
    for (const field of fields) {
        const selectedOdd = selectedMatch[field];
        const comparisonOdd = comparisonMatch[field];
        if (selectedOdd && comparisonOdd) {
            totalDefinedOdds++;
            const isWithinTolerance = checkOddsSimilarity(selectedOdd, comparisonOdd);
            if (!isWithinTolerance) {
                allOddsWithinTolerance = false;
                break;
            }
            totalSimilarOdds++;
        }
    }
    // Eğer tüm oranlar tolerans içinde değilse veya hiç tanımlı oran yoksa, benzer değil
    if (!allOddsWithinTolerance || totalDefinedOdds === 0) {
        totalSimilarOdds = 0;
    }
    return {
        similarity: totalSimilarOdds,
        similarOddsCount: totalSimilarOdds,
        isSameTeam: selectedMatch.HomeTeam === comparisonMatch.HomeTeam ||
            selectedMatch.AwayTeam === comparisonMatch.AwayTeam,
        isSameLeague: selectedMatch.Div === comparisonMatch.Div,
        matchDate: convertExcelDate(comparisonMatch.Date),
        isExactBet365Match: hasExactBet365Match,
        isExactBet365MatchClosedOdds: hasExactClosingOdds
    };
}
// Excel tarihini JS tarihine çevir
function convertExcelDate(excelDate) {
    try {
        if (typeof excelDate === 'string') {
            // String formatındaki tarihi sadece GG.AA.YYYY olarak döndür
            const [datePart] = excelDate.toString().split(/[\s.]+/);
            return datePart;
        }
        // Excel'den gelen tarih için özel hesaplama (1899-12-30 başlangıç tarihi)
        const EXCEL_START_DATE = new Date(1899, 11, 30);
        const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
        // Ondalık kısmı (saat) yok say, sadece tam günü al
        const days = Math.floor(excelDate);
        const milliseconds = days * MILLISECONDS_PER_DAY;
        const date = new Date(EXCEL_START_DATE.getTime() + milliseconds);
        // Tarihi GG.AA.YYYY formatında döndür
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear() + 124; // Excel'den gelen yıla 124 ekle
        return `${day}.${month}.${year}`;
    }
    catch (error) {
        console.error('Date conversion error:', error);
        return new Date().toLocaleDateString('tr-TR');
    }
}
// Tarih formatını temizle (ondalık kısmı kaldır)
function cleanDateFormat(date) {
    const dateStr = String(date);
    // Eğer tarihte boşluk varsa, boşluktan önceki kısmı al
    if (dateStr.includes(' ')) {
        return dateStr.split(' ')[0];
    }
    return dateStr;
}
export function findSimilarMatches(selectedMatch, allMatches) {
    console.log('Finding similar matches...');
    console.log('Selected Match:', {
        home: selectedMatch.HomeTeam,
        away: selectedMatch.AwayTeam,
        date: selectedMatch.Date,
        odds: {
            B365H: selectedMatch.B365H,
            B365D: selectedMatch.B365D,
            B365A: selectedMatch.B365A
        }
    });
    console.log('Total matches to compare:', allMatches.length);
    console.log('Current MAX_TOLERANCE:', MAX_TOLERANCE);
    const similarMatches = allMatches
        .filter(match => {
        // Seçilen maç ile aynı maç olmamalı
        if (match === selectedMatch)
            return false;
        // Tüm bookmakerlar ve oran çeşitleri için alanları tanımla
        const fields = [
            // 1X2 Oranları
            'B365H', 'B365D', 'B365A',
            'BWH', 'BWD', 'BWA',
            'IWH', 'IWD', 'IWA',
            'PSH', 'PSD', 'PSA',
            'WHH', 'WHD', 'WHA',
            'VCH', 'VCD', 'VCA',
            'MaxH', 'MaxD', 'MaxA',
            'AvgH', 'AvgD', 'AvgA',
            // Over/Under 2.5 Oranları
            'B365>2.5', 'B365<2.5',
            'BW>2.5', 'BW<2.5',
            'IW>2.5', 'IW<2.5',
            'PS>2.5', 'PS<2.5',
            'WH>2.5', 'WH<2.5',
            'VC>2.5', 'VC<2.5',
            'Max>2.5', 'Max<2.5',
            'Avg>2.5', 'Avg<2.5',
            // Asian Handicap Oranları
            'B365CAHH', 'B365CAHA',
            'BWAHH', 'BWAHA',
            'IWAHH', 'IWAHA',
            'PSAHH', 'PSAHA',
            'WHAHH', 'WHAHA',
            'VCAHH', 'VCAHA',
            'MaxAHH', 'MaxAHA',
            'AvgAHH', 'AvgAHA'
        ];
        // Tüm oranları kontrol et
        let hasDefinedOdds = false;
        let matchingOddsCount = 0;
        let totalCheckedOdds = 0;
        for (const field of fields) {
            const selectedOdd = selectedMatch[field];
            const comparisonOdd = match[field];
            if (selectedOdd && comparisonOdd) {
                hasDefinedOdds = true;
                totalCheckedOdds++;
                const diff = Math.abs(Number(selectedOdd) - Number(comparisonOdd));
                if (diff <= MAX_TOLERANCE) {
                    matchingOddsCount++;
                }
            }
        }
        // Debug için maç detaylarını logla
        if (hasDefinedOdds) {
            console.log('Match comparison:', {
                match: `${match.HomeTeam} vs ${match.AwayTeam}`,
                date: match.Date,
                matchingOdds: matchingOddsCount,
                totalChecked: totalCheckedOdds,
                hasDefinedOdds,
                matchingPercentage: (matchingOddsCount / totalCheckedOdds) * 100
            });
        }
        // En az bir tanımlı oran olmalı ve ya tüm oranlar tolerans içinde olmalı
        // ya da oranların en az %80'i tolerans içinde olmalı
        return hasDefinedOdds && (matchingOddsCount === totalCheckedOdds ||
            (totalCheckedOdds > 0 && (matchingOddsCount / totalCheckedOdds) >= 0.8));
    })
        .map(match => {
        const comparison = compareMatches(selectedMatch, match);
        return {
            ...match,
            Date: cleanDateFormat(match.Date),
            similarity: comparison.similarity,
            similarOddsCount: comparison.similarOddsCount,
            isSameTeam: comparison.isSameTeam,
            isSameLeague: comparison.isSameLeague,
            matchDate: cleanDateFormat(match.Date),
            isExactBet365Match: comparison.isExactBet365Match
        };
    })
        .sort((a, b) => {
        const dateA = new Date(cleanDateFormat(a.Date).split('.').reverse().join('-'));
        const dateB = new Date(cleanDateFormat(b.Date).split('.').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
    })
        .slice(0, 100);
    console.log('Similar matches found:', similarMatches.length);
    return similarMatches;
}
