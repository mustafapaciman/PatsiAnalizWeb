import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { TeamLogo } from './TeamLogo';
import { convertExcelDate } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Scale, Trophy, TrendingUp } from 'lucide-react';
// Constants
const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";
// Yeni yardımcı fonksiyonlar
const getMatchResult = (score, isHomeTeam) => {
    const [homeGoals, awayGoals] = score.split('-').map(Number);
    if (homeGoals === awayGoals)
        return 'draw';
    if (isHomeTeam) {
        return homeGoals > awayGoals ? 'win' : 'loss';
    }
    return awayGoals > homeGoals ? 'win' : 'loss';
};
const hasScenarioPattern = (htScore, ftScore, isHomeTeam, mode) => {
    const [htHome, htAway] = htScore.split('-').map(Number);
    const [ftHome, ftAway] = ftScore.split('-').map(Number);
    if (mode === 'classic') {
        // 2/1 senaryosu: İlk yarı A, maç sonu H
        const is21Scenario = htHome < htAway && ftHome > ftAway;
        // 1/2 senaryosu: İlk yarı H, maç sonu A
        const is12Scenario = htHome > htAway && ftHome < ftAway;
        return is21Scenario || is12Scenario;
    }
    else {
        // 1/X senaryosu: İlk yarı H, maç sonu D
        const is1XScenario = htHome > htAway && ftHome === ftAway;
        // 2/X senaryosu: İlk yarı A, maç sonu D
        const is2XScenario = htHome < htAway && ftHome === ftAway;
        return is1XScenario || is2XScenario;
    }
};
// Skor renklendirme fonksiyonu (seçili takıma göre)
const getScoreColor = (score, isHomeTeam, isHalfTime = false) => {
    const [homeGoals, awayGoals] = score.split('-').map(Number);
    const teamGoals = isHomeTeam ? homeGoals : awayGoals;
    const opponentGoals = isHomeTeam ? awayGoals : homeGoals;
    if (teamGoals > opponentGoals) {
        return isHalfTime ? 'text-green-600' : 'text-green-600';
    }
    else if (teamGoals < opponentGoals) {
        return isHalfTime ? 'text-red-600' : 'text-red-600';
    }
    else {
        return isHalfTime ? 'text-gray-500' : 'text-gray-800';
    }
};
export const TeamAnalysisPanel = ({ team, data, isHome, teamData, activeTab, match, matchData, analysisMode }) => {
    const [hoveredCard, setHoveredCard] = useState(null);
    const [currentMatchIndex, setCurrentMatchIndex] = useState({});
    const [showDetails, setShowDetails] = useState({});
    const [showLastMatches, setShowLastMatches] = useState(false);
    const lastMatchesRef = useRef(null);
    const [selectedSurpriseMatch, setSelectedSurpriseMatch] = useState(null);
    // Early return if no team is selected
    if (!team) {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("p", { className: "text-gray-500", children: "Please select a team to view analysis" }) }));
    }
    // Early return if match is required but not provided
    if (match === null && activeTab !== 'home' && activeTab !== 'away') {
        return (_jsx("div", { className: "flex items-center justify-center h-full", children: _jsx("p", { className: "text-gray-500", children: "Match data is not available" }) }));
    }
    // Debug logs for component lifecycle
    useEffect(() => {
        console.log('[Debug] TeamAnalysisPanel mounted/updated', {
            team,
            isHome,
            dataAvailable: !!data,
            timestamp: new Date().toISOString()
        });
        return () => {
            console.log('[Debug] TeamAnalysisPanel cleanup', {
                team,
                timestamp: new Date().toISOString()
            });
        };
    }, [team, isHome, data]);
    // Debug log for hover state changes
    useEffect(() => {
        if (hoveredCard) {
            console.log('[Debug] Card hover state changed', {
                hoveredCard,
                timestamp: new Date().toISOString()
            });
        }
        return () => {
            if (hoveredCard) {
                console.log('[Debug] Card hover state cleanup', {
                    hoveredCard,
                    timestamp: new Date().toISOString()
                });
            }
        };
    }, [hoveredCard]);
    // Function to handle opponent card click
    const handleOpponentClick = (opponent, details) => {
        // En yeni maçı bul ve onunla başla
        const sortedMatches = [...details.allMatches]
            .filter(match => hasScenarioPattern(match.htScore, match.score, match.isHome || false, analysisMode))
            .sort((a, b) => {
            const [dayA, monthA, yearA] = a.date.split('.').map(Number);
            const [dayB, monthB, yearB] = b.date.split('.').map(Number);
            if (yearA !== yearB)
                return yearB - yearA;
            if (monthA !== monthB)
                return monthB - monthA;
            return dayB - dayA;
        });
        if (sortedMatches.length > 0) {
            setCurrentMatchIndex(prev => ({ ...prev, [opponent]: 0 }));
            setSelectedSurpriseMatch({
                opponent,
                match: {
                    ...sortedMatches[0],
                    logo: teamData[opponent]?.logoUrl || EMPTY_LOGO
                }
            });
            if (lastMatchesRef.current) {
                lastMatchesRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    };
    // Function to handle next/previous match
    const handleMatchChange = (opponent, details, direction) => {
        const filteredMatches = details.allMatches.filter(match => hasScenarioPattern(match.htScore, match.score, match.isHome || false, analysisMode));
        const currentIdx = currentMatchIndex[opponent] || 0;
        const newIdx = direction === 'next'
            ? (currentIdx + 1) % filteredMatches.length
            : (currentIdx - 1 + filteredMatches.length) % filteredMatches.length;
        setCurrentMatchIndex(prev => ({ ...prev, [opponent]: newIdx }));
        setSelectedSurpriseMatch({
            opponent,
            match: {
                ...filteredMatches[newIdx],
                logo: teamData[opponent]?.logoUrl || EMPTY_LOGO
            }
        });
    };
    // Tarih karşılaştırma fonksiyonu
    const compareDates = (matchDate, referenceDate) => {
        // Excel tarihini DD.MM.YYYY formatına çevir
        const matchDateStr = convertExcelDate(matchDate);
        // Tarihleri parçalara ayır
        const [matchDay, matchMonth, matchYear] = matchDateStr.split('.').map(Number);
        const [refDay, refMonth, refYear] = referenceDate.split('.').map(Number);
        // Yıl karşılaştırması
        if (matchYear !== refYear)
            return matchYear < refYear;
        // Ay karşılaştırması
        if (matchMonth !== refMonth)
            return matchMonth < refMonth;
        // Gün karşılaştırması
        return matchDay < refDay;
    };
    // Sort opponents by count and date with type safety
    const sortedOpponents = Object.entries(data?.surpriseOpponents || {})
        .filter(([_, details]) => {
        const opponent = details;
        return opponent.allMatches.some(match => hasScenarioPattern(match.htScore, match.score, match.isHome || false, analysisMode));
    })
        .sort((a, b) => {
        const [, opponentA] = a;
        const [, opponentB] = b;
        // Senaryo sayısına göre sırala
        const scenarioCountA = opponentA.allMatches.filter(m => hasScenarioPattern(m.htScore, m.score, m.isHome || false, analysisMode)).length;
        const scenarioCountB = opponentB.allMatches.filter(m => hasScenarioPattern(m.htScore, m.score, m.isHome || false, analysisMode)).length;
        if (scenarioCountA !== scenarioCountB) {
            return scenarioCountB - scenarioCountA;
        }
        // Aynı sayıda senaryo varsa tarihe göre sırala
        const dateA = new Date(opponentA.lastMatch.date.split('.').reverse().join('-'));
        const dateB = new Date(opponentB.lastMatch.date.split('.').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
    });
    const panelStyle = activeTab === (isHome ? 'team1' : 'team2')
        ? 'opacity-100 scale-100 shadow-lg'
        : 'opacity-65 scale-95';
    const categoryStyle = activeTab === (isHome ? 'team1' : 'team2')
        ? 'bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-lg hover:shadow-xl scale-100 opacity-100'
        : 'bg-gradient-to-br from-gray-50 to-gray-100 shadow-md scale-95 opacity-65';
    return (_jsxs("div", { className: `p-6 rounded-xl transition-all duration-300 ${panelStyle}`, children: [_jsx("div", { className: `flex justify-center -mt-12 mb-6 transition-all duration-300 ${activeTab === 'home' ? 'opacity-0 translate-y-4' : 'opacity-100'}`, children: _jsx("div", { className: `bg-white rounded-full p-2 shadow-lg transition-all duration-300`, children: _jsx(TeamLogo, { name: team, className: "w-6 h-6" }) }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: `rounded-xl p-6 transition-all duration-300 ${categoryStyle}`, children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Trophy, { className: `${activeTab === 'home' ? 'text-blue-600 animate-bounce' : 'text-gray-400'}` }), _jsx("h3", { className: "text-lg font-bold text-gray-800", children: "S\u00FCrpriz Ger\u00E7ekle\u015Ftirdi\u011Fi Rakipler" })] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: sortedOpponents.map(([opponent, details]) => (_jsxs("div", { className: "hover-item relative bg-white p-3 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group", onClick: () => handleOpponentClick(opponent, details), onMouseEnter: () => setHoveredCard(opponent), onMouseLeave: () => setHoveredCard(null), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: opponent, className: "w-5 h-5" }), _jsx("span", { className: "font-medium text-gray-700 text-sm", children: opponent }), details.count > 1 && (_jsx(ChevronRight, { className: "w-4 h-4 text-blue-500 group-hover:animate-bounce" }))] }), _jsx("div", { className: "mt-2 flex justify-end", children: _jsxs("span", { className: "text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full", children: [details.count, " kez"] }) }), (hoveredCard === opponent || showDetails[opponent]) && (_jsx("div", { className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg z-50 w-64 shadow-xl", children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-600" }), _jsxs("div", { className: "space-y-3", children: [details.count > 1 && currentMatchIndex[opponent] > 0 && (_jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    setCurrentMatchIndex(prev => ({
                                                                        ...prev,
                                                                        [opponent]: prev[opponent] - 1
                                                                    }));
                                                                }, className: "absolute -left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) })), details.count > 1 && currentMatchIndex[opponent] < details.allMatches.length - 1 && (_jsx("button", { onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    setCurrentMatchIndex(prev => ({
                                                                        ...prev,
                                                                        [opponent]: prev[opponent] + 1
                                                                    }));
                                                                }, className: "absolute -right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("span", { className: "text-white/80", children: ["S\u00FCrpriz Ma\u00E7 ", details.count > 1 ? currentMatchIndex[opponent] + 1 : '', ":"] }), _jsx("span", { className: "font-medium", children: details.allMatches[currentMatchIndex[opponent] || 0].date })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white/80", children: "\u0130lk Yar\u0131:" }), (() => {
                                                                                        const currentMatch = details.allMatches[currentMatchIndex[opponent] || 0];
                                                                                        const [homeHtGoals, awayHtGoals] = currentMatch.htScore.split('-').map(Number);
                                                                                        const isHomeTeam = match ? team === match.HomeTeam : isHome;
                                                                                        const isHtWin = isHomeTeam ? homeHtGoals > awayHtGoals : awayHtGoals > homeHtGoals;
                                                                                        const isHtLoss = isHomeTeam ? homeHtGoals < awayHtGoals : awayHtGoals < homeHtGoals;
                                                                                        return (_jsx("span", { className: `font-medium ${isHtWin ? 'text-green-300' :
                                                                                                isHtLoss ? 'text-red-300' :
                                                                                                    'text-white'}`, children: currentMatch.htScore }));
                                                                                    })()] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white/80", children: "Ma\u00E7 Sonu:" }), (() => {
                                                                                        const currentMatch = details.allMatches[currentMatchIndex[opponent] || 0];
                                                                                        const [homeGoals, awayGoals] = currentMatch.score.split('-').map(Number);
                                                                                        const isHomeTeam = match ? team === match.HomeTeam : isHome;
                                                                                        const isWin = isHomeTeam ? homeGoals > awayGoals : awayGoals > homeGoals;
                                                                                        const isLoss = isHomeTeam ? homeGoals < awayGoals : awayGoals < homeGoals;
                                                                                        return (_jsx("span", { className: `font-medium ${isWin ? 'text-green-300' :
                                                                                                isLoss ? 'text-red-300' :
                                                                                                    'text-white'}`, children: currentMatch.score }));
                                                                                    })()] })] })] })] })] }) }))] }, opponent))) })] }), _jsxs("div", { className: `rounded-xl p-6 transition-all duration-300 ${categoryStyle}`, children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(TrendingUp, { className: `${activeTab === 'home' ? 'text-purple-600 animate-pulse' : 'text-gray-400'}` }), _jsx("h3", { className: "text-lg font-bold text-gray-800", children: "S\u00FCrpriz \u00D6ncesi Skor \u00D6r\u00FCnt\u00FCleri" })] }), _jsx("div", { className: "space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2", children: Object.entries(data?.preSurpriseScores || {}).map(([score, count]) => {
                                    const values = Object.values(data?.preSurpriseScores || {});
                                    const total = values.reduce((a, b) => a + (Number.isFinite(Number(b)) ? Number(b) : 0), 0);
                                    const currentCount = Number.isFinite(Number(count)) ? Number(count) : 0;
                                    const percentage = Math.round((currentCount / Math.max(total, 1)) * 100);
                                    return (_jsxs("div", { className: "relative bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-300", children: [_jsxs("div", { className: "flex justify-between items-center relative z-10", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text", children: score }), _jsx("div", { className: "text-sm text-gray-500", children: "sonras\u0131" })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("div", { className: "w-12 h-12 relative", children: [_jsxs("svg", { className: "w-12 h-12 transform -rotate-90", children: [_jsx("circle", { className: "text-gray-200", strokeWidth: "4", stroke: "currentColor", fill: "transparent", r: "20", cx: "24", cy: "24" }), _jsx("circle", { className: "text-purple-600", strokeWidth: "4", strokeLinecap: "round", stroke: "currentColor", fill: "transparent", r: "20", cx: "24", cy: "24", strokeDasharray: `${percentage * 1.26} 126` })] }), _jsxs("span", { className: "absolute inset-0 flex items-center justify-center text-sm font-bold", children: ["%", percentage] })] }) })] }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg", style: { width: `${percentage}%` } })] }, score));
                                }) })] }), _jsxs("div", { className: `rounded-xl p-6 transition-all duration-300 ${categoryStyle}`, ref: lastMatchesRef, children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Scale, { className: `${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}` }), _jsx("h3", { className: "text-lg font-bold text-gray-800", children: "Son 3 Ma\u00E7 Detay\u0131" })] }), _jsxs("div", { className: "space-y-4", children: [selectedSurpriseMatch && (_jsxs("div", { className: "bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg shadow relative", children: [_jsxs("div", { className: "grid grid-cols-5 border-b border-white/20 pb-1 mb-1", children: [_jsx("div", { className: "w-8" }), " ", _jsx("div", { className: "text-xs text-white/70 uppercase tracking-wider", children: "Rakip" }), _jsx("div", { className: "text-xs text-white/70 uppercase tracking-wider text-center", children: "Tarih" }), _jsx("div", { className: "text-xs text-white/70 uppercase tracking-wider text-center", children: "Ma\u00E7 Sonucu" }), _jsx("div", { className: "text-xs text-white/70 uppercase tracking-wider text-center", children: "\u0130lk Yar\u0131" })] }), _jsxs("div", { className: "grid grid-cols-5 items-center", children: [_jsx("div", { children: _jsx("div", { className: "bg-white rounded-full p-1 shadow-md w-8 h-8 flex items-center justify-center", children: _jsx(TeamLogo, { name: selectedSurpriseMatch.opponent, className: "w-6 h-6" }) }) }), _jsx("div", { children: _jsx("span", { className: "font-medium text-white text-sm", children: selectedSurpriseMatch.opponent }) }), _jsx("div", { className: "text-center", children: _jsx("span", { className: "text-white/90 text-sm", children: selectedSurpriseMatch.match.date }) }), _jsx("div", { className: "text-center", children: _jsx("span", { className: `text-lg font-bold ${getScoreColor(selectedSurpriseMatch.match.score, selectedSurpriseMatch.match.isHome || false)}`, children: selectedSurpriseMatch.match.score }) }), _jsx("div", { className: "text-center", children: _jsxs("span", { className: `text-sm ${getScoreColor(selectedSurpriseMatch.match.htScore, selectedSurpriseMatch.match.isHome || false, true)}`, children: ["(", selectedSurpriseMatch.match.htScore, ")"] }) })] }), data?.surpriseOpponents[selectedSurpriseMatch.opponent]?.count > 1 && (_jsx("button", { onClick: () => handleMatchChange(selectedSurpriseMatch.opponent, data.surpriseOpponents[selectedSurpriseMatch.opponent], 'next'), className: "absolute -right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors group", children: _jsx(ChevronRight, { className: "w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" }) }))] })), _jsx("div", { className: "bg-white rounded-lg shadow-lg overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Tarih" }), _jsx("th", { className: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Rakip" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Ev/Dep" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Skor" }), _jsx("th", { className: "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider", children: "\u0130lk Yar\u0131" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: selectedSurpriseMatch && matchData
                                                        .filter(m => {
                                                        const isTeamMatch = m.HomeTeam === team || m.AwayTeam === team;
                                                        return isTeamMatch && compareDates(m.Date, selectedSurpriseMatch.match.date);
                                                    })
                                                        .sort((a, b) => {
                                                        const dateA = convertExcelDate(a.Date);
                                                        const dateB = convertExcelDate(b.Date);
                                                        const [dayA, monthA, yearA] = dateA.split('.').map(Number);
                                                        const [dayB, monthB, yearB] = dateB.split('.').map(Number);
                                                        if (yearA !== yearB)
                                                            return yearB - yearA;
                                                        if (monthA !== monthB)
                                                            return monthB - monthA;
                                                        return dayB - dayA;
                                                    })
                                                        .slice(0, 3)
                                                        .map((match, idx) => {
                                                        const isHomeTeam = match.HomeTeam === team;
                                                        const opponent = isHomeTeam ? match.AwayTeam : match.HomeTeam;
                                                        const score = `${match.FTHG}-${match.FTAG}`;
                                                        const htScore = `${match.HTHG}-${match.HTAG}`;
                                                        // Skor renklendirme için kazanma/kaybetme durumu
                                                        const [homeGoals, awayGoals] = score.split('-').map(Number);
                                                        const isWin = isHomeTeam
                                                            ? homeGoals > awayGoals
                                                            : awayGoals > homeGoals;
                                                        const isLoss = isHomeTeam
                                                            ? homeGoals < awayGoals
                                                            : awayGoals < homeGoals;
                                                        const isDraw = homeGoals === awayGoals;
                                                        const scoreColor = isWin
                                                            ? 'text-green-600'
                                                            : isLoss
                                                                ? 'text-red-600'
                                                                : isDraw
                                                                    ? 'text-gray-800'
                                                                    : 'text-gray-800';
                                                        // İlk yarı renklendirme
                                                        const [htHomeGoals, htAwayGoals] = htScore.split('-').map(Number);
                                                        const isHtWin = isHomeTeam
                                                            ? htHomeGoals > htAwayGoals
                                                            : htAwayGoals > htHomeGoals;
                                                        const isHtLoss = isHomeTeam
                                                            ? htHomeGoals < htAwayGoals
                                                            : htAwayGoals > htHomeGoals;
                                                        const isHtDraw = htHomeGoals === htAwayGoals;
                                                        const htScoreColor = isHtWin
                                                            ? 'text-green-600'
                                                            : isHtLoss
                                                                ? 'text-red-600'
                                                                : isHtDraw
                                                                    ? 'text-gray-500'
                                                                    : 'text-gray-500';
                                                        return (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-4 py-3 text-sm text-gray-500", children: convertExcelDate(match.Date) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: opponent, className: "w-6 h-6" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: opponent })] }) }), _jsx("td", { className: "px-4 py-3 text-center text-sm text-gray-500", children: isHomeTeam ? 'Ev' : 'Dep' }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("span", { className: `font-medium ${getScoreColor(score, isHomeTeam)}`, children: score }) }), _jsx("td", { className: "px-4 py-3 text-center", children: _jsx("span", { className: `text-sm ${getScoreColor(htScore, isHomeTeam, true)}`, children: htScore }) })] }, idx));
                                                    }) })] }) })] })] })] })] }));
};
