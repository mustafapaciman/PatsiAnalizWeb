import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Star, Clock, Trash2, Shield, BarChart2, Check } from 'lucide-react';
import { parseDateString } from '../utils/dateUtils';
import { groupFixturesByLeague } from '../utils/fixtureUtils';
import { getTeamLogo } from '../utils/teamLogoLoader';
import { getLeagueLogo } from '../utils/leagueLogoLoader';
import { MatchingOpponentsAnalysis } from './MatchingOpponentsAnalysis';
// DO NOT DELETE START - TeamLogo Component
const TeamLogo = ({ teamName, className = "w-6 h-6" }) => {
    const logoUrl = getTeamLogo(teamName);
    if (!logoUrl) {
        return (_jsx("div", { className: `${className} flex items-center justify-center overflow-hidden`, children: _jsx(Shield, { className: "w-full h-full text-gray-400" }) }));
    }
    return (_jsx("div", { className: `${className} flex items-center justify-center overflow-hidden rounded-full bg-white/80`, children: _jsx("img", { src: logoUrl, alt: `${teamName} logo`, className: "w-full h-full object-contain p-0.5", loading: "lazy", onError: (e) => {
                const target = e.target;
                target.onerror = null;
                target.style.display = 'none';
                target.parentElement.innerHTML = `<svg class="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4.7 13.7l6.3 6.3 6.3-6.3c3.37-3.42 3.24-7 1.12-9.12z"></path></svg>`;
            } }) }));
};
// DO NOT DELETE END - TeamLogo Component
// Lig Logosu komponenti
const LeagueLogo = ({ leagueName, className = "w-6 h-6" }) => {
    const logoUrl = getLeagueLogo(leagueName);
    if (!logoUrl) {
        return null;
    }
    return (_jsx("div", { className: `${className} flex items-center justify-center overflow-hidden`, children: _jsx("img", { src: logoUrl, alt: `${leagueName} logo`, className: "w-full h-full object-contain", loading: "lazy" }) }));
};
// Tarihi tersine çeviren fonksiyon
const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month} ${hours}:${minutes}`;
};
// Tarihi görsel olarak düzelten filtre fonksiyonu
const visualDateFilter = (dateStr) => {
    const [day, month] = dateStr.split('.');
    return `${month}.${day}`;
};
// DO NOT DELETE START - FixtureList Component
export function FixtureList({ fixtures, onSelectMatch, selectedMatch, teamData, matchData }) {
    const [favorites, setFavorites] = useState(() => {
        const savedFavorites = localStorage.getItem('favorites');
        return savedFavorites ? new Set(JSON.parse(savedFavorites)) : new Set();
    });
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(() => {
        return localStorage.getItem('showOnlyFavorites') === 'true';
    });
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [isSelectingForAnalysis, setIsSelectingForAnalysis] = useState(false);
    const [selectedForAnalysis, setSelectedForAnalysis] = useState(new Set());
    const [notification, setNotification] = useState(null);
    const groupedFixtures = groupFixturesByLeague(fixtures);
    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
    }, [favorites]);
    useEffect(() => {
        localStorage.setItem('showOnlyFavorites', showOnlyFavorites.toString());
    }, [showOnlyFavorites]);
    useEffect(() => {
        if (showOnlyFavorites && favorites.size === 0) {
            setShowOnlyFavorites(false);
            setNotification({ message: 'Favori maç kalmadığı için tüm maçlar gösteriliyor', type: 'error' });
        }
    }, [favorites, showOnlyFavorites]);
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);
    const toggleFavorite = (matchId, event) => {
        event.stopPropagation();
        const newFavorites = new Set(favorites);
        if (favorites.has(matchId)) {
            newFavorites.delete(matchId);
            setNotification({ message: 'Favorilerden çıkarıldı', type: 'error' });
        }
        else {
            newFavorites.add(matchId);
            setNotification({ message: 'Favorilere eklendi', type: 'success' });
        }
        setFavorites(newFavorites);
    };
    const getMatchId = (match) => `${match.Date}-${match.Time}-${match.HomeTeam}-${match.AwayTeam}`;
    const filteredFixtures = showOnlyFavorites
        ? Object.fromEntries(Object.entries(groupedFixtures).map(([league, matches]) => [
            league,
            matches.filter((match) => favorites.has(getMatchId(match)))
        ]).filter(([_, matches]) => matches.length > 0))
        : groupedFixtures;
    const getLeagueName = (code) => {
        const leagues = {
            'E0': 'Premier League',
            'E1': 'Championship',
            'E2': 'League One',
            'E3': 'League Two',
            'SC0': 'Scottish Premier League',
            'SC1': 'Scottish Championship',
            'SC2': 'Scottish League One',
            'SC3': 'Scottish League Two',
            'D1': 'Bundesliga',
            'D2': '2. Bundesliga',
            'SP1': 'La Liga',
            'SP2': 'La Liga 2',
            'I1': 'Serie A',
            'I2': 'Serie B',
            'F1': 'Ligue 1',
            'F2': 'Ligue 2',
            'N1': 'Eredivisie',
            'B1': 'Jupiler Pro League',
            'P1': 'Primeira Liga',
            'T1': 'Süper Lig',
            'G1': 'Super League Greece'
        };
        return leagues[code] || code;
    };
    const toggleMatchForAnalysis = (matchId, event) => {
        event.stopPropagation();
        const newSelected = new Set(selectedForAnalysis);
        if (selectedForAnalysis.has(matchId)) {
            newSelected.delete(matchId);
        }
        else {
            newSelected.add(matchId);
        }
        setSelectedForAnalysis(newSelected);
    };
    const startAnalysisSelection = () => {
        setIsSelectingForAnalysis(true);
        setSelectedForAnalysis(new Set());
        setNotification({
            message: 'Analiz edilecek maçları seçin',
            type: 'success'
        });
    };
    const completeAnalysisSelection = () => {
        if (selectedForAnalysis.size === 0) {
            setNotification({
                message: 'En az bir maç seçmelisiniz',
                type: 'error'
            });
            return;
        }
        // Filter selected matches
        const selectedMatches = fixtures.filter(match => selectedForAnalysis.has(getMatchId(match)));
        setIsSelectingForAnalysis(false);
        setShowAnalysisModal(true);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-end mb-4 gap-2", children: [showOnlyFavorites && (_jsxs("button", { onClick: () => {
                            setFavorites(new Set());
                            setNotification({ message: 'Tüm favoriler silindi', type: 'error' });
                        }, className: `flex items-center gap-2 px-4 py-2 rounded-lg transition ${favorites.size > 0
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`, disabled: favorites.size === 0, children: [_jsx(Trash2, { size: 18 }), "T\u00FCm Favorileri Sil"] })), _jsxs("button", { onClick: () => setShowOnlyFavorites(!showOnlyFavorites), className: `flex items-center gap-2 px-4 py-2 rounded-lg transition ${showOnlyFavorites
                            ? 'bg-yellow-400 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Star, { size: 18, className: showOnlyFavorites ? 'fill-white' : '' }), showOnlyFavorites ? 'Tüm Maçları Göster' : 'Favorileri Göster'] }), !isSelectingForAnalysis ? (_jsxs("button", { onClick: startAnalysisSelection, className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition", children: [_jsx(BarChart2, { size: 18 }), "Benzer Rakip Analizi"] })) : (_jsxs("button", { onClick: completeAnalysisSelection, className: "flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition", children: [_jsx(Check, { size: 18 }), "Analizi Ba\u015Flat (", selectedForAnalysis.size, ")"] }))] }), Object.entries(filteredFixtures).map(([league, matches]) => (_jsxs("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: [_jsxs("div", { className: "bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(LeagueLogo, { leagueName: league, className: "w-6 h-6" }), _jsx("h3", { className: "text-white font-semibold", children: getLeagueName(league) })] }), _jsxs("div", { className: "flex text-xs text-white/80", children: [_jsx("div", { className: "w-[45px] text-center border-r border-white/20", children: "1" }), _jsx("div", { className: "w-[45px] text-center border-r border-white/20", children: "X" }), _jsx("div", { className: "w-[45px] text-center border-r border-white/20", children: "2" }), _jsx("div", { className: "w-[45px] text-center border-r border-white/20", children: "\u00DC2.5" }), _jsx("div", { className: "w-[45px] text-center", children: "A2.5" })] })] }), _jsx("div", { className: "divide-y", children: matches.map((match) => {
                            const matchId = getMatchId(match);
                            const isSelected = selectedMatch && getMatchId(selectedMatch) === matchId;
                            const matchDate = parseDateString(match.Date || '', match.Time || '');
                            console.log('Original Date:', match.Date, 'Parsed Date:', matchDate);
                            return (_jsxs("div", { onClick: () => !isSelectingForAnalysis && onSelectMatch(match), className: `flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition ${isSelected ? 'bg-blue-50' : ''}`, children: [isSelectingForAnalysis ? (_jsx("button", { onClick: (e) => toggleMatchForAnalysis(matchId, e), className: "mr-3", children: _jsx("div", { className: `w-5 h-5 rounded border-2 flex items-center justify-center transition ${selectedForAnalysis.has(matchId)
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'border-gray-300'}`, children: selectedForAnalysis.has(matchId) && (_jsx(Check, { size: 14, className: "text-white" })) }) })) : (_jsx("button", { onClick: (e) => toggleFavorite(matchId, e), className: "mr-3", children: _jsx(Star, { size: 18, className: favorites.has(matchId) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300' }) })), _jsxs("div", { className: "flex flex-col text-sm text-gray-500 w-20", children: [_jsx("span", { children: visualDateFilter(formatDate(matchDate).split(' ')[0]) }), _jsxs("span", { className: "flex items-center", children: [_jsx(Clock, { size: 14, className: "mr-1" }), formatDate(matchDate).split(' ')[1]] })] }), _jsxs("div", { className: "flex-1 flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { teamName: match.HomeTeam, className: "w-6 h-6" }), _jsx("span", { children: match.HomeTeam })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { teamName: match.AwayTeam, className: "w-6 h-6" }), _jsx("span", { children: match.AwayTeam })] })] }), _jsxs("div", { className: "flex text-sm", children: [_jsx("div", { className: "w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200", children: match.B365H?.toFixed(2) || '-' }), _jsx("div", { className: "w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200", children: match.B365D?.toFixed(2) || '-' }), _jsx("div", { className: "w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200", children: match.B365A?.toFixed(2) || '-' }), _jsx("div", { className: "w-[45px] px-2 py-1 bg-gray-100 rounded text-center border-r border-gray-200", children: match['B365>2.5']?.toFixed(2) || '-' }), _jsx("div", { className: "w-[45px] px-2 py-1 bg-gray-100 rounded text-center", children: match['B365<2.5']?.toFixed(2) || '-' })] })] })] }, matchId));
                        }) })] }, league))), notification && (_jsx("div", { className: `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-opacity ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`, children: notification.message })), showAnalysisModal && (_jsx(MatchingOpponentsAnalysis, { fixtures: fixtures.filter(match => selectedForAnalysis.has(getMatchId(match))), matchData: matchData, onClose: () => {
                    setShowAnalysisModal(false);
                    setSelectedForAnalysis(new Set());
                } }))] }));
}
