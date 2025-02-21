import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { TeamLogo } from '../TeamLogo';
import { DetailedAnalysisPanel } from './components/DetailedAnalysisPanel';

export const NewAnalysisTab = ({ matchData, teamData, selectedLeague, selectedTeam, selectedSeason }) => {
    // State tanımlamaları
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [currentTeam, setCurrentTeam] = useState(selectedTeam);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [lastOpponent, setLastOpponent] = useState(''); // Y takımı
    const [intersections, setIntersections] = useState([]);
    const [surprisePageCount, setSurprisePageCount] = useState(1);
    const MATCHES_PER_PAGE = 5;
    // State tanımlamalarından sonra useEffect ekleyelim
    useEffect(() => {
        setCurrentTeam(selectedTeam);
    }, [selectedTeam]);
    // Maç tarihini formatlama fonksiyonu
    const formatDate = (excelDate) => {
        const date = new Date((Number(excelDate) - 25569) * 86400 * 1000);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    // Tarihten sezon hesaplama yardımcı fonksiyonu
    const getSeasonFromDate = (date) => {
        const jsDate = new Date((date - 25569) * 86400 * 1000);
        const year = jsDate.getFullYear();
        const month = jsDate.getMonth(); // 0-11
        if (month >= 7) { // Ağustos ve sonrası
            return `${year}-${year + 1}`;
        }
        else { // Ocak-Haziran
            return `${year - 1}-${year}`;
        }
    };
    // Analiz fonksiyonu
    const runAnalysis = async () => {
        if (!currentTeam)
            return;
        setIsLoading(true);
        setResults([]);
        setCurrentResultIndex(0);
        setShowResults(false);
        setIntersections([]);
        try {
            // Takımın son maçını bul
            const teamMatches = matchData
                .filter(match => (match.Div === selectedLeague || match.isUEFA) &&
                (match.HomeTeam === currentTeam || match.AwayTeam === currentTeam))
                .sort((a, b) => {
                const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                return dateB.getTime() - dateA.getTime();
            });
            console.log('Filtrelenen maçlar:', teamMatches.map(m => ({
                date: formatDate(Number(m.Date)),
                home: m.HomeTeam,
                away: m.AwayTeam,
                score: `${m.FTHG}-${m.FTAG}`,
                isHome: m.HomeTeam === currentTeam,
                isUEFA: m.isUEFA,
                div: m.Div
            })));
            const lastMatch = teamMatches[0];
            if (!lastMatch) {
                console.error('Son maç bulunamadı. Seçilen takım:', currentTeam);
                return;
            }
            // Son rakibi belirle
            const yTeam = lastMatch.HomeTeam === currentTeam ? lastMatch.AwayTeam : lastMatch.HomeTeam;
            setLastOpponent(yTeam);
            console.log('Son maç:', {
                date: formatDate(Number(lastMatch.Date)),
                team: currentTeam,
                opponent: yTeam,
                score: `${lastMatch.FTHG}-${lastMatch.FTAG}`,
                isHome: lastMatch.HomeTeam === currentTeam
            });
            // 2. Tüm takımların Y ile maçlarını bul
            const allResults = [];
            // Tüm takımları döngüye al
            const allTeams = [...new Set(matchData
                    .filter(m => m.Div === selectedLeague)
                    .flatMap(m => [m.HomeTeam, m.AwayTeam]))];
            for (const team of allTeams) {
                // Bu takımın Y ile TÜM maçlarını bul
                const allMatchesWithY = matchData
                    .filter(m => m.Div === selectedLeague &&
                    ((m.HomeTeam === team && m.AwayTeam === yTeam) ||
                        (m.AwayTeam === team && m.HomeTeam === yTeam)) &&
                    Number(m.Date) <= Number(lastMatch.Date))
                    .sort((a, b) => Number(b.Date) - Number(a.Date)); // En yeniden eskiye sırala
                // Her Y maçı için kontrol et
                for (const matchWithY of allMatchesWithY) {
                    // Y maçından sonra sürpriz yapıp yapmadığını kontrol et
                    const surpriseMatch = findSurpriseMatchAfterDate(team, Number(matchWithY.Date));
                    if (!surpriseMatch)
                        continue;
                    // Sürpriz maçtan sonraki maçı bul
                    const mMatch = findNextMatch(team, Number(surpriseMatch.match.Date), 1);
                    if (!mMatch)
                        continue;
                    // Sonuçları ekle
                    allResults.push({
                        team,
                        season: matchWithY.Season,
                        matchWithY: {
                            match: matchWithY,
                            score: `${matchWithY.FTHG}-${matchWithY.FTAG}`
                        },
                        surpriseMatch: {
                            match: surpriseMatch.match,
                            score: `${surpriseMatch.match.FTHG}-${surpriseMatch.match.FTAG}`,
                            date: formatDate(Number(surpriseMatch.match.Date))
                        },
                        matchWithM: {
                            match: mMatch,
                            score: `${mMatch.FTHG}-${mMatch.FTAG}`
                        }
                    });
                }
            }
            // Sonuçları tarihe göre sırala (en yeniden eskiye)
            const sortedResults = allResults.sort((a, b) => {
                const dateA = Number(a.surpriseMatch.match.Date);
                const dateB = Number(b.surpriseMatch.match.Date);
                return dateB - dateA;
            });
            setResults(sortedResults);
            setShowResults(sortedResults.length > 0);
            setCurrentResultIndex(0); // İlk sonuçtan başla
            // İlk sonuç için kesişimleri bul
            if (sortedResults.length > 0) {
                const foundIntersections = findIntersections(matchData, matchData, currentTeam, yTeam, lastMatch, sortedResults[currentResultIndex]);
                setIntersections(foundIntersections);
            }
        }
        catch (error) {
            console.error('Analiz hatası:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Yardımcı fonksiyonlar
    const findSurpriseMatchAfterDate = (team, date) => {
        try {
            // Y maçından sonra İLK maçı bul
            const nextMatch = matchData
                .filter(m => m && m.Date &&
                m.HomeTeam && m.AwayTeam &&
                m.HTR && m.FTR &&
                (m.HomeTeam === team || m.AwayTeam === team) &&
                Number(m.Date) > date)
                .sort((a, b) => Number(a.Date) - Number(b.Date))[0]; // Sadece ilk maçı al
            // Eğer bir sonraki maç yoksa veya sürpriz değilse null dön
            if (!nextMatch || !((nextMatch.HTR === 'H' && nextMatch.FTR === 'A') ||
                (nextMatch.HTR === 'A' && nextMatch.FTR === 'H'))) {
                return null;
            }
            return { match: nextMatch };
        }
        catch (error) {
            console.error('findSurpriseMatchAfterDate hatası:', error);
            return null;
        }
    };
    const findNextMatch = (team, date, offset = 1) => {
        try {
            const matches = matchData
                .filter(m => m && m.Date &&
                m.HomeTeam && m.AwayTeam &&
                m.FTHG !== undefined && m.FTAG !== undefined &&
                (m.HomeTeam === team || m.AwayTeam === team) &&
                Number(m.Date) > date)
                .sort((a, b) => Number(a.Date) - Number(b.Date));
            // offset kadar sonraki maçı al
            return matches[offset - 1] || null;
        }
        catch (error) {
            console.error('findNextMatch hatası:', error);
            return null;
        }
    };
    const calculateSimilarity = (team, matchWithY, xLastMatch) => {
        let similarity = 50; // Başlangıç benzerliği (Y'den sonra sürpriz yaptığı için)
        try {
            // Önceki maçları al
            const xPreviousMatches = matchData
                .filter(m => m && m.Date &&
                m.Div === selectedLeague &&
                m.Season === selectedSeason && // Mevcut sezon
                (m.HomeTeam === currentTeam || m.AwayTeam === currentTeam) &&
                Number(m.Date) < Number(xLastMatch.Date))
                .sort((a, b) => Number(b.Date) - Number(a.Date)); // Yeniden eskiye
            const teamPreviousMatches = matchData
                .filter(m => m && m.Date &&
                m.Div === selectedLeague &&
                m.Season === matchWithY.Season && // Takımın kendi sezonu
                (m.HomeTeam === team || m.AwayTeam === team) &&
                Number(m.Date) < Number(matchWithY.Date))
                .sort((a, b) => Number(b.Date) - Number(a.Date)); // Yeniden eskiye
            const maxMatches = Math.min(xPreviousMatches.length, teamPreviousMatches.length);
            if (maxMatches === 0)
                return similarity;
            let matchingOpponents = 0;
            let matchingScores = 0;
            let matchingResults = 0;
            // Her maçı karşılaştır
            for (let i = 0; i < maxMatches; i++) {
                const xMatch = xPreviousMatches[i];
                const teamMatch = teamPreviousMatches[i];
                const xOpponent = xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam;
                const teamOpponent = teamMatch.HomeTeam === team ? teamMatch.AwayTeam : teamMatch.HomeTeam;
                // 1. Rakip karşılaştırması - Her eşleşen rakip için +3 puan (maksimum 25)
                if (xOpponent === teamOpponent) {
                    similarity += 3;
                    matchingOpponents++;
                }
                // 2. Skor karşılaştırması - Her eşleşen skor için +2 puan (maksimum 15)
                if (xMatch.FTHG === teamMatch.FTHG && xMatch.FTAG === teamMatch.FTAG) {
                    similarity += 2;
                    matchingScores++;
                }
                // 3. Sonuç karşılaştırması - Her eşleşen sonuç için +2 puan (maksimum 10)
                if (xMatch.FTR === teamMatch.FTR) {
                    similarity += 2;
                    matchingResults++;
                }
            }
            // Tam eşleşme bonusları
            if (matchingOpponents === maxMatches) {
                similarity += 15; // Tüm rakipler eşleşirse ekstra bonus
            }
            if (matchingScores === maxMatches) {
                similarity += 10; // Tüm skorlar eşleşirse ekstra bonus
            }
            // Maksimum sınırlamalar
            if (similarity > 90 && matchingOpponents === maxMatches) {
                similarity = 90; // Sadece rakipler eşleşirse maksimum 90
            }
            if (similarity > 100) {
                similarity = 100; // Genel maksimum 100
            }
            return Math.round(similarity);
        }
        catch (error) {
            console.error('Benzerlik hesaplama hatası:', error);
            return 50;
        }
    };
    // Devam Et/Geri işlemleri
    const handleContinue = () => {
        setCurrentResultIndex(prev => prev + 1);
    };
    const handleBack = () => {
        setCurrentResultIndex(prev => prev - 1);
    };
    const handleFinish = () => {
        setShowResults(false);
        setCurrentResultIndex(0);
        setIntersections([]);
    };
    // Kesişimleri güncelleyen yardımcı fonksiyon
    const updateIntersections = (index) => {
        if (results[index]) {
            const foundIntersections = findIntersections(matchData, matchData, currentTeam, lastOpponent, results[index].matchWithY.match, results[index]);
            setIntersections(foundIntersections);
        }
    };
    // Skor komponenti güncellendi
    const ScoreDisplay = ({ homeScore, awayScore, homeTeam, currentTeam }) => {
        const isWin = (homeTeam === currentTeam && homeScore > awayScore) ||
            (homeTeam !== currentTeam && homeScore < awayScore);
        const isDraw = homeScore === awayScore;
        return (_jsx("div", { className: `
        px-4 py-2 rounded-lg backdrop-blur-sm
        ${isWin ? 'bg-gradient-to-r from-green-500/20 to-green-600/10' :
                isDraw ? 'bg-gradient-to-r from-gray-700/20 to-gray-600/10' :
                    'bg-gradient-to-r from-red-500/20 to-red-600/10'}
      `, children: _jsxs("span", { className: `text-xl font-medium ${isWin ? 'text-green-400' :
                    isDraw ? 'text-white' :
                        'text-red-400'}`, children: [homeScore, "-", awayScore] }) }));
    };
    // Takım ismi komponenti güncellendi
    const TeamName = ({ name }) => (_jsx("span", { className: "text-white text-xl px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 backdrop-blur-sm border border-white/5", children: name }));
    const findIntersections = (xMatches, teamMatches, currentTeam, yTeam, lastMatch, benzerTakim) => {
        try {
            const intersections = [];
            // Debug logları
            console.log('Kesişim hesaplanıyor:', {
                currentTeam,
                benzerTakim: benzerTakim.team,
                lastMatchDate: formatDate(Number(lastMatch.Date)),
                benzerYMatchDate: formatDate(Number(benzerTakim.matchWithY.match.Date))
            });
            // 1. X takımının Y maçı öncesi maçlarını bul (sadece kendi sezonu)
            const xPreviousMatches = xMatches
                .filter(m => {
                const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                const matchSeason = getSeasonFromDate(Number(m.Date));
                return m.Div === selectedLeague &&
                    (m.HomeTeam === currentTeam || m.AwayTeam === currentTeam) &&
                    Number(m.Date) < Number(lastMatch.Date) &&
                    matchSeason === selectedSeason; // Sadece mevcut sezon
            })
                .sort((a, b) => Number(b.Date) - Number(a.Date));
            // X'in Y öncesi maç sayısı
            const xMatchCount = xPreviousMatches.length;
            console.log('X takımının Y öncesi maç sayısı:', xMatchCount);
            // 2. Benzer takımın Y maçı öncesi maçlarını bul
            const teamPreviousMatches = teamMatches
                .filter(m => m.Div === selectedLeague &&
                (m.HomeTeam === benzerTakim.team || m.AwayTeam === benzerTakim.team) &&
                Number(m.Date) < Number(benzerTakim.matchWithY.match.Date))
                .sort((a, b) => Number(b.Date) - Number(a.Date))
                .slice(0, xMatchCount); // X'in maç sayısı kadar al
            // Debug logları
            console.log('Bulunan maçlar:', {
                xMatches: xPreviousMatches.length,
                teamMatches: teamPreviousMatches.length,
                xMatchesDates: xPreviousMatches.map(m => formatDate(Number(m.Date))),
                teamMatchesDates: teamPreviousMatches.map(m => formatDate(Number(m.Date)))
            });
            // 3. Her maçı karşılaştır (X'in maç sayısı kadar)
            for (let i = 0; i < xMatchCount; i++) {
                const xMatch = xPreviousMatches[i];
                const teamMatch = teamPreviousMatches[i];
                if (!teamMatch)
                    continue;
                const matchNumber = i + 1;
                // 1. Aynı rakiple oynama kontrolü
                const xOpponent = xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam;
                const teamOpponent = teamMatch.HomeTeam === benzerTakim.team ? teamMatch.AwayTeam : teamMatch.HomeTeam;
                if (xOpponent === teamOpponent) {
                    intersections.push({
                        type: 'same_opponent_match',
                        matchNumber,
                        details: {
                            team1: xOpponent,
                            team2: teamOpponent,
                            score: `${xMatch.FTHG}-${xMatch.FTAG} / ${teamMatch.FTHG}-${teamMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçlarında aynı rakiple (${xOpponent}) karşılaşmışlar`,
                            date1: formatDate(Number(xMatch.Date)),
                            date2: formatDate(Number(teamMatch.Date))
                        }
                    });
                }
                // 2. Sürpriz maç kontrolü
                const isXSurprise = (xMatch.HTR === 'H' && xMatch.FTR === 'A') ||
                    (xMatch.HTR === 'A' && xMatch.FTR === 'H');
                const isTeamSurprise = (teamMatch.HTR === 'H' && teamMatch.FTR === 'A') ||
                    (teamMatch.HTR === 'A' && teamMatch.FTR === 'H');
                if (isXSurprise && isTeamSurprise) {
                    intersections.push({
                        type: 'both_surprise',
                        matchNumber,
                        details: {
                            team1: xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam,
                            team2: teamMatch.HomeTeam === benzerTakim.team ? teamMatch.AwayTeam : teamMatch.HomeTeam,
                            score: `${xMatch.FTHG}-${xMatch.FTAG} / ${teamMatch.FTHG}-${teamMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçlarında ikisi de sürpriz sonuç almış`,
                            date1: formatDate(Number(xMatch.Date)),
                            date2: formatDate(Number(teamMatch.Date))
                        }
                    });
                }
                // Beraberlik kontrolü
                if (xMatch.FTR === 'D' && teamMatch.FTR === 'D') {
                    intersections.push({
                        type: 'draw',
                        matchNumber,
                        details: {
                            team1: xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam,
                            team2: teamMatch.HomeTeam === benzerTakim.team ? teamMatch.AwayTeam : teamMatch.HomeTeam,
                            score: `${xMatch.FTHG}-${xMatch.FTAG} / ${teamMatch.FTHG}-${teamMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçlarında berabere kalmışlar`,
                            date1: formatDate(Number(xMatch.Date)),
                            date2: formatDate(Number(teamMatch.Date))
                        }
                    });
                }
                // Aynı skor kontrolü
                if (xMatch.FTHG === teamMatch.FTHG && xMatch.FTAG === teamMatch.FTAG) {
                    intersections.push({
                        type: 'same_score',
                        matchNumber,
                        details: {
                            team1: xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam,
                            team2: teamMatch.HomeTeam === benzerTakim.team ? teamMatch.AwayTeam : teamMatch.HomeTeam,
                            score: `${xMatch.FTHG}-${xMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçlarında aynı skor: ${xMatch.FTHG}-${xMatch.FTAG}`,
                            date1: formatDate(Number(xMatch.Date)),
                            date2: formatDate(Number(teamMatch.Date))
                        }
                    });
                }
                // 3. Aynı rakibe karşı sürpriz kontrolü
                if (xOpponent === teamOpponent) { // Önce rakiplerin aynı olduğundan emin olalım
                    const isXSurpriseAgainstOpponent = (xMatch.HTR === 'H' && xMatch.FTR === 'A') ||
                        (xMatch.HTR === 'A' && xMatch.FTR === 'H');
                    const isTeamSurpriseAgainstOpponent = (teamMatch.HTR === 'H' && teamMatch.FTR === 'A') ||
                        (teamMatch.HTR === 'A' && teamMatch.FTR === 'H');
                    if (isXSurpriseAgainstOpponent && isTeamSurpriseAgainstOpponent) {
                        intersections.push({
                            type: 'same_opponent_surprise',
                            matchNumber,
                            details: {
                                team1: xOpponent, // Aynı rakip
                                team2: teamOpponent, // Aynı rakip
                                score: `${xMatch.FTHG}-${xMatch.FTAG} / ${teamMatch.FTHG}-${teamMatch.FTAG}`,
                                description: `${lastOpponent} takımından önce ${matchNumber}. maçlarında ${xOpponent} takımına karşı ikisi de sürpriz sonuç almış`,
                                date1: formatDate(Number(xMatch.Date)),
                                date2: formatDate(Number(teamMatch.Date))
                            }
                        });
                    }
                }
                // 4. Farklı rakiplere karşı aynı maç sayısında sürpriz kontrolü
                const isXSurpriseOnMatchday = (xMatch.HTR === 'H' && xMatch.FTR === 'A') ||
                    (xMatch.HTR === 'A' && xMatch.FTR === 'H');
                const isTeamSurpriseOnMatchday = (teamMatch.HTR === 'H' && teamMatch.FTR === 'A') ||
                    (teamMatch.HTR === 'A' && teamMatch.FTR === 'H');
                if (isXSurpriseOnMatchday && isTeamSurpriseOnMatchday && xOpponent !== teamOpponent) { // Rakipler farklı olmalı
                    intersections.push({
                        type: 'same_matchday_surprise',
                        matchNumber,
                        details: {
                            team1: xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam,
                            team2: teamMatch.HomeTeam === benzerTakim.team ? teamMatch.AwayTeam : teamMatch.HomeTeam,
                            score: `${xMatch.FTHG}-${xMatch.FTAG} / ${teamMatch.FTHG}-${teamMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçlarında farklı rakiplere karşı (${xOpponent} ve ${teamOpponent}) sürpriz sonuç almışlar`,
                            date1: formatDate(Number(xMatch.Date)),
                            date2: formatDate(Number(teamMatch.Date))
                        }
                    });
                }
            }
            // 5. Bağımsız Sürpriz Kontrolü
            xPreviousMatches.forEach(xMatch => {
                const isXSurprise = (xMatch.HTR === 'H' && xMatch.FTR === 'A') ||
                    (xMatch.HTR === 'A' && xMatch.FTR === 'H');
                if (isXSurprise) {
                    const xOpponent = xMatch.HomeTeam === currentTeam ? xMatch.AwayTeam : xMatch.HomeTeam;
                    const matchNumber = xPreviousMatches.indexOf(xMatch) + 1;
                    intersections.push({
                        type: 'independent_surprise',
                        matchNumber,
                        details: {
                            team1: xOpponent,
                            team2: '', // Boş bırakılabilir
                            score: `${xMatch.FTHG}-${xMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçında ${currentTeam}, ${xOpponent}'a karşı sürpriz sonuç almış`,
                            date1: formatDate(Number(xMatch.Date)),
                            date2: ''
                        }
                    });
                }
            });
            teamPreviousMatches.forEach(teamMatch => {
                const isTeamSurprise = (teamMatch.HTR === 'H' && teamMatch.FTR === 'A') ||
                    (teamMatch.HTR === 'A' && teamMatch.FTR === 'H');
                if (isTeamSurprise) {
                    const teamOpponent = teamMatch.HomeTeam === benzerTakim.team ? teamMatch.AwayTeam : teamMatch.HomeTeam;
                    const matchNumber = teamPreviousMatches.indexOf(teamMatch) + 1;
                    intersections.push({
                        type: 'independent_surprise',
                        matchNumber,
                        details: {
                            team1: '', // Boş bırakılabilir
                            team2: teamOpponent,
                            score: `${teamMatch.FTHG}-${teamMatch.FTAG}`,
                            description: `${lastOpponent} takımından önce ${matchNumber}. maçında ${benzerTakim.team}, ${teamOpponent}'a karşı sürpriz sonuç almış`,
                            date1: '',
                            date2: formatDate(Number(teamMatch.Date))
                        }
                    });
                }
            });
            console.log('Bulunan kesişimler:', intersections);
            return intersections;
        }
        catch (error) {
            console.error('Kesişim bulma hatası:', error);
            return [];
        }
    };
    // Önce Y takımının sürpriz maçlarını bulan fonksiyonu ekleyelim
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
                rawDate: Number(match.Date), // Sıralama için ham tarih ekledik
                season: match.Season,
                isHome: match.HomeTeam === lastOpponent
            }))
            .sort((a, b) => {
                // En yeni tarihten eskiye doğru sıralama
                const dateA = new Date((a.rawDate - 25569) * 86400 * 1000);
                const dateB = new Date((b.rawDate - 25569) * 86400 * 1000);
                return dateB.getTime() - dateA.getTime();
            })
            .slice(0, surprisePageCount * MATCHES_PER_PAGE);

        return surprises;
    };
    useEffect(() => {
        console.log('Props değerleri:', {
            selectedLeague,
            selectedSeason,
            matchDataLength: matchData?.length,
            hasMatchData: !!matchData
        });
    }, [selectedLeague, selectedSeason, matchData]);
    useEffect(() => {
        console.log('ACTIVE FILE CHECK:', {
            fileType: 'JavaScript Version',
            timestamp: new Date().toISOString(),
            componentStructure: document.querySelector('.debug-outer')?.className || 'Not Found'
        });
    }, []);
    return (_jsxs("div", { 
        children: [
            _jsx("div", { 
                className: "max-w-[1800px] mx-auto px-8", 
                children: _jsxs("div", { 
                    className: "flex justify-start gap-8",
                    children: [
                        _jsx(DetailedAnalysisPanel, {
                            lastOpponent: lastOpponent,
                            matchData: matchData,
                            selectedLeague: selectedLeague,
                            isLoading: isLoading,
                            showResults: showResults,
                            surprisePageCount: surprisePageCount,
                            setSurprisePageCount: setSurprisePageCount,
                            formatDate: formatDate,
                            currentTeam: currentTeam
                        }),
                        _jsx("div", { 
                            className: "w-[250px] bg-gray-800/90 rounded-lg overflow-hidden h-fit sticky top-4", 
                            children: _jsxs("div", { className: "p-8 flex flex-col items-center text-center", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-24 h-24 mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: currentTeam }), _jsx("div", { className: "text-lg text-gray-400", children: "Analizi" }), _jsx("div", { className: "mt-6", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 text-blue-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" }) }) })] }) }),
                        _jsx("div", { className: "w-[850px]", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("select", { value: currentTeam, onChange: (e) => setCurrentTeam(e.target.value), className: "w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Takım Seçin" }), matchData
                                                            .filter(match => match.Div === selectedLeague)
                                                            .reduce((teams, match) => {
                                                            if (!teams.includes(match.HomeTeam))
                                                                teams.push(match.HomeTeam);
                                                            if (!teams.includes(match.AwayTeam))
                                                                teams.push(match.AwayTeam);
                                                            return teams;
                                                        }, [])
                                                            .sort()
                                                            .map(team => (_jsx("option", { value: team, children: team }, team)))] }) }), _jsx("button", { onClick: runAnalysis, disabled: isLoading || !currentTeam, className: `px-6 py-2 rounded-lg font-medium transition-all ${isLoading || !currentTeam
                                                    ? 'bg-gray-600 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`, children: isLoading ? 'Analiz Ediliyor...' : 'Analiz Et' })] }), isLoading && (_jsx("div", { className: "bg-gray-800/90 rounded-lg border border-gray-700", children: _jsxs("div", { className: "flex flex-col items-center justify-center py-8", children: [_jsx("div", { className: "w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" }), _jsx("div", { className: "mt-4 text-gray-400", children: "Analiz Ediliyor..." })] }) })), !isLoading && showResults && results.length > 0 && currentResultIndex < results.length && (_jsxs("div", { className: "bg-gray-800/90 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gray-900/80 px-6 py-4 border-b border-gray-700", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-gray-400", children: "Son Rakip (Y Takımı):" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: lastOpponent, className: "w-6 h-6" }), _jsx("span", { className: "text-white font-medium text-lg", children: lastOpponent })] })] }) }), _jsx("div", { className: "bg-gray-900/50 px-6 py-4 border-b border-gray-700", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("div", { className: "text-white text-2xl font-semibold", children: results[currentResultIndex].team }), _jsxs("div", { className: "text-blue-300 text-base", children: ["Benzer Durum ", currentResultIndex + 1, " / ", results.length] })] }) }) }), _jsx("div", { className: "bg-blue-900/20 p-6", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-12 h-12" }), _jsxs("div", { children: [_jsx("div", { className: "text-white text-2xl font-semibold", children: results[currentResultIndex].team }), _jsx("div", { className: "text-blue-300 text-base", children: "Benzer Takım" })] })] }) }), _jsxs("div", { className: "bg-purple-900/20 p-6", children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: "Son Rakip ile Maç" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TeamLogo, { name: lastOpponent, className: "w-8 h-8" }), _jsx(TeamName, { name: lastOpponent })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ScoreDisplay, { homeScore: results[currentResultIndex].matchWithY.match.FTHG, awayScore: results[currentResultIndex].matchWithY.match.FTAG, homeTeam: results[currentResultIndex].matchWithY.match.HomeTeam, currentTeam: results[currentResultIndex].team }), _jsxs("span", { className: "text-gray-400 text-base", children: ["(\u0130Y: ", results[currentResultIndex].matchWithY.match.HTHG, "-", results[currentResultIndex].matchWithY.match.HTAG, ")"] })] })] })] }), _jsxs("div", { className: "bg-red-900/20 p-6", children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: "Sürpriz Maç" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team === results[currentResultIndex].surpriseMatch.match.HomeTeam
                                                                            ? results[currentResultIndex].surpriseMatch.match.AwayTeam
                                                                            : results[currentResultIndex].surpriseMatch.match.HomeTeam, className: "w-8 h-8" }), _jsxs("div", { className: `flex items-center gap-2 ${(results[currentResultIndex].surpriseMatch.match.HomeTeam === currentTeam ||
                                                                            results[currentResultIndex].surpriseMatch.match.AwayTeam === currentTeam)
                                                                            ? 'border-2 border-red-500 rounded-lg px-2 py-1'
                                                                            : ''}`, children: [_jsx(TeamName, { name: results[currentResultIndex].team === results[currentResultIndex].surpriseMatch.match.HomeTeam
                                                                                    ? results[currentResultIndex].surpriseMatch.match.AwayTeam
                                                                                    : results[currentResultIndex].surpriseMatch.match.HomeTeam }), (results[currentResultIndex].surpriseMatch.match.HomeTeam === currentTeam ||
                                                                                results[currentResultIndex].surpriseMatch.match.AwayTeam === currentTeam) && (_jsx("span", { className: "text-red-500 text-xl font-bold ml-2", children: "!" }))] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(ScoreDisplay, { homeScore: results[currentResultIndex].surpriseMatch.match.FTHG, awayScore: results[currentResultIndex].surpriseMatch.match.FTAG, homeTeam: results[currentResultIndex].surpriseMatch.match.HomeTeam, currentTeam: results[currentResultIndex].team }), _jsxs("span", { className: "text-gray-400 text-base", children: ["(\u0130Y: ", results[currentResultIndex].surpriseMatch.match.HTHG, "-", results[currentResultIndex].surpriseMatch.match.HTAG, ")"] }), _jsx("span", { className: "text-gray-400 text-base border-l border-gray-600 pl-4", children: results[currentResultIndex].surpriseMatch.date })] })] })] }), _jsxs("div", { className: "bg-green-900/20 p-6", children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: "Sonraki Maç" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team === results[currentResultIndex].matchWithM.match.HomeTeam
                                                                            ? results[currentResultIndex].matchWithM.match.AwayTeam
                                                                            : results[currentResultIndex].matchWithM.match.HomeTeam, className: "w-8 h-8" }), _jsx(TeamName, { name: results[currentResultIndex].team === results[currentResultIndex].matchWithM.match.HomeTeam
                                                                            ? results[currentResultIndex].matchWithM.match.AwayTeam
                                                                            : results[currentResultIndex].matchWithM.match.HomeTeam })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ScoreDisplay, { homeScore: results[currentResultIndex].matchWithM.match.FTHG, awayScore: results[currentResultIndex].matchWithM.match.FTAG, homeTeam: results[currentResultIndex].matchWithM.match.HomeTeam, currentTeam: results[currentResultIndex].team }), _jsxs("span", { className: "text-gray-400 text-base", children: ["(\u0130Y: ", results[currentResultIndex].matchWithM.match.HTHG, "-", results[currentResultIndex].matchWithM.match.HTAG, ")"] })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 p-6 bg-gray-900/50", children: [_jsx("button", { onClick: handleFinish, className: "px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg", children: "Bitir" }), _jsxs("div", { className: "flex gap-2", children: [currentResultIndex > 0 && (_jsxs("button", { onClick: handleBack, className: "px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-lg flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 rotate-180", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) }), "Geri"] })), currentResultIndex < results.length - 1 && (_jsxs("button", { onClick: handleContinue, className: "px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg flex items-center gap-2", children: ["Devam Et", _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })] }))] })] })] }))] }) }), !isLoading && showResults && results.length > 0 && currentResultIndex < results.length && (_jsxs("div", { className: "w-[400px] bg-gray-800/90 rounded-lg overflow-hidden h-fit sticky top-4", children: [_jsxs("div", { className: "bg-gray-900/50 px-6 py-4 border-b border-gray-700", children: [_jsxs("div", { className: "text-lg text-gray-300", children: [results[currentResultIndex].team === results[currentResultIndex].matchWithM.match.HomeTeam
                                                    ? `${results[currentResultIndex].matchWithM.match.HomeTeam} vs ${results[currentResultIndex].matchWithM.match.AwayTeam}`
                                                    : `${results[currentResultIndex].matchWithM.match.AwayTeam} vs ${results[currentResultIndex].matchWithM.match.HomeTeam}`, " Maçından Sonraki 3 Maç"] }), _jsx("div", { className: "text-sm text-gray-500 mt-1", children: formatDate(Number(results[currentResultIndex].matchWithM.match.Date)) })] }), [1, 2, 3].map((matchNumber) => {
                                    const nextMatch = findNextMatch(results[currentResultIndex].team, Number(results[currentResultIndex].matchWithM.match.Date), matchNumber);
                                    if (!nextMatch)
                                        return null;
                                    // Sürpriz maç kontrolü
                                    const isSurprise = (nextMatch.HTR === 'H' && nextMatch.FTR === 'A') ||
                                        (nextMatch.HTR === 'A' && nextMatch.FTR === 'H');
                                    return (_jsxs("div", { className: `p-6 border-b border-gray-800 ${isSurprise
                                            ? 'bg-purple-900/30 hover:bg-purple-900/40'
                                            : 'bg-gray-900/20 hover:bg-gray-900/30'} transition-colors`, children: [_jsxs("div", { className: "text-sm text-gray-400 mb-2", children: ["Sonraki Maç ", matchNumber, isSurprise && (_jsx("span", { className: "ml-2 text-purple-400", children: "(Sürpriz Maç)" }))] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team === nextMatch.HomeTeam
                                                                    ? nextMatch.AwayTeam
                                                                    : nextMatch.HomeTeam, className: "w-8 h-8" }), _jsx(TeamName, { name: results[currentResultIndex].team === nextMatch.HomeTeam
                                                                    ? nextMatch.AwayTeam
                                                                    : nextMatch.HomeTeam })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ScoreDisplay, { homeScore: nextMatch.FTHG, awayScore: nextMatch.FTAG, homeTeam: nextMatch.HomeTeam, currentTeam: results[currentResultIndex].team }), _jsxs("span", { className: "text-gray-400 text-base", children: ["(\u0130Y: ", nextMatch.HTHG, "-", nextMatch.HTAG, ")"] })] })] }), _jsx("div", { className: "text-gray-500 text-sm mt-2", children: formatDate(Number(nextMatch.Date)) })] }, `next-match-${matchNumber}`));
                                })] }))] }) }), !isLoading && showResults && results.length > 0 && (_jsx("div", { className: "mt-8", children: _jsxs("div", { className: "bg-gray-800/90 rounded-lg overflow-hidden", children: [_jsx("div", { className: "bg-gray-900/50 px-6 py-4 border-b border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-lg text-gray-300", children: ["Benzer Durum ", currentResultIndex + 1, " - Ortak Kesimler"] }), _jsx("button", { onClick: () => {
                                            if (results[currentResultIndex]) {
                                                // X takımının son maçını bul
                                                const xLastMatch = matchData
                                                    .filter(m => m.Div === selectedLeague &&
                                                    (m.HomeTeam === currentTeam || m.AwayTeam === currentTeam))
                                                    .sort((a, b) => Number(b.Date) - Number(a.Date))[0];
                                                if (!xLastMatch)
                                                    return;
                                                const foundIntersections = findIntersections(matchData, matchData, currentTeam, lastOpponent, xLastMatch, // X'in son maçını kullan
                                                results[currentResultIndex]);
                                                setIntersections(foundIntersections);
                                            }
                                        }, className: "text-blue-400 hover:text-blue-300 transition-colors", title: "Kesimleri Yeniden Hesapla", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z", clipRule: "evenodd" }) }) })] }) }), _jsx("div", { className: "p-6", children: intersections.length > 0 ? (_jsx("div", { className: "flex flex-col gap-8", children: _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("div", { className: "sticky left-0 text-gray-300 font-medium pb-2 border-b border-gray-700 mb-4 bg-gray-800/90 z-10", children: "Beraberlik Kesimleri" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4 pl-0", children: intersections
                                                        .filter(i => i.type === 'draw')
                                                        .map((intersection, index) => (_jsx("div", { className: "bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors min-w-[300px]", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center", children: _jsx("span", { className: "text-yellow-500 text-lg", children: "=" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-white text-lg mb-2", children: intersection.details.description }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400 font-medium", children: currentTeam })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team1, " (", _jsx("span", { className: "text-yellow-400", children: intersection.details.score.split(' / ')[0] }), ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date1 })] })] }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-5 h-5" }), _jsx("span", { className: "text-purple-400 font-medium", children: results[currentResultIndex].team })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team2, " (", intersection.details.score, ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date2 })] })] })] })] }) }, `draw-${index}`))) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-300 font-medium pb-2 border-b border-gray-700 mb-4", children: "Aynı Skor Kesimleri" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: intersections
                                                        .filter(i => i.type === 'same_score')
                                                        .map((intersection, index) => (_jsx("div", { className: "bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors min-w-[300px]", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center", children: _jsx("span", { className: "text-blue-400 text-lg", children: "#" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-white text-lg mb-2", children: intersection.details.description }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400 font-medium", children: currentTeam })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team1, " (", _jsx("span", { className: "text-yellow-400", children: intersection.details.score.split(' / ')[0] }), ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date1 })] })] }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-5 h-5" }), _jsx("span", { className: "text-purple-400 font-medium", children: results[currentResultIndex].team })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team2, " (", intersection.details.score, ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date2 })] })] })] })] }) }, `score-${index}`))) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-300 font-medium pb-2 border-b border-gray-700 mb-4", children: "Aynı Rakibe Karşı Sürprizler" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: intersections
                                                        .filter(i => i.type === 'same_opponent_surprise')
                                                        .map((intersection, index) => (_jsx("div", { className: "bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors min-w-[300px]", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center", children: _jsx("span", { className: "text-orange-400 text-lg", children: "\u26A1" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-white text-lg mb-2", children: intersection.details.description }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400 font-medium", children: currentTeam })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team1, " (", _jsx("span", { className: "text-yellow-400", children: intersection.details.score.split(' / ')[0] }), ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date1 })] })] }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-5 h-5" }), _jsx("span", { className: "text-purple-400 font-medium", children: results[currentResultIndex].team })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team2, " (", intersection.details.score, ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date2 })] })] })] })] }) }, `opponent-surprise-${index}`))) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-gray-300 font-medium pb-2 border-b border-gray-700 mb-4", children: "Farklı Rakiplere Karşı Sürprizler" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: intersections
                                                        .filter(i => i.type === 'same_matchday_surprise')
                                                        .map((intersection, index) => (_jsx("div", { className: "bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors min-w-[300px]", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-pink-900/50 flex items-center justify-center", children: _jsx("span", { className: "text-pink-400 text-lg", children: "\u26A1" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-white text-lg mb-2", children: intersection.details.description }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400 font-medium", children: currentTeam })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team1, " (", _jsx("span", { className: "text-yellow-400", children: intersection.details.score.split(' / ')[0] }), ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date1 })] })] }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-5 h-5" }), _jsx("span", { className: "text-purple-400 font-medium", children: results[currentResultIndex].team })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team2, " (", intersection.details.score, ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date2 })] })] })] })] }) }, `matchday-surprise-${index}`))) })] }), _jsxs("div", { children: [_jsx("div", { className: "sticky left-0 text-gray-300 font-medium pb-2 border-b border-gray-700 mb-4 bg-gray-800/90 z-10", children: "Aynı Rakip Karşılaşmaları" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4 pl-0", children: intersections
                                                        .filter(i => i.type === 'same_opponent_match')
                                                        .map((intersection, index) => {
                                                        const [xScore, yScore] = intersection.details.score.split(' / ');
                                                        const isScoresSame = xScore === yScore;
                                                        return (_jsx("div", { className: `bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors min-w-[300px]
                                  ${isScoresSame ? 'ring-2 ring-orange-500/50' : ''}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center", children: _jsx("span", { className: "text-purple-400 text-lg", children: "@" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-white text-lg mb-2", children: intersection.details.description }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400 font-medium", children: currentTeam })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team1, " (", _jsx("span", { className: "text-yellow-400", children: xScore }), ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date1 })] })] }), _jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-5 h-5" }), _jsx("span", { className: "text-purple-400 font-medium", children: results[currentResultIndex].team })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team2, " (", yScore, ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date2 })] })] })] })] }) }, `opponent-match-${index}`));
                                                    }) })] }), _jsxs("div", { children: [_jsx("div", { className: "sticky left-0 text-gray-300 font-medium pb-2 border-b border-gray-700 mb-4 bg-gray-800/90 z-10", children: "Bağımsız Sürprizler" }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-4 pl-0", children: intersections
                                                        .filter(i => i.type === 'independent_surprise')
                                                        .map((intersection, index) => (_jsx("div", { className: "bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors min-w-[300px]", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-1", children: _jsx("div", { className: "w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center", children: _jsx("span", { className: "text-red-400 text-lg", children: "\u26A1" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-white text-lg mb-2", children: intersection.details.description }), intersection.details.date1 && (_jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: currentTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400 font-medium", children: currentTeam })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team1, " (", _jsx("span", { className: "text-yellow-400", children: intersection.details.score }), _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date1 })] })] })), intersection.details.date2 && (_jsxs("div", { className: "bg-gray-800/50 rounded-lg p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(TeamLogo, { name: results[currentResultIndex].team, className: "w-5 h-5" }), _jsx("span", { className: "text-purple-400 font-medium", children: results[currentResultIndex].team })] }), _jsxs("div", { className: "text-gray-400", children: ["vs ", intersection.details.team2, " (", intersection.details.score, ")", _jsx("span", { className: "text-gray-500 ml-2 text-sm", children: intersection.details.date2 })] })] }))] })] }) }, `independent-surprise-${index}`))) })] })] }) })) : (_jsxs("div", { className: "text-gray-400 flex items-center gap-3", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }), "Kesimleri hesaplamak için yenile butonuna tıklayın"] })) })] }) }))] }));
};
