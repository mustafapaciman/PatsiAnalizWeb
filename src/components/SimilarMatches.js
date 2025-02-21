import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React, { useState } from 'react';
import { MatchCard } from './MatchCard';
import { findSimilarMatches, updateTolerance } from '../utils/oddsComparison';
function SimilarMatchesModal({ matches, selectedMatch, teamData, onClose }) {
    const [filter, setFilter] = useState('all');
    const filteredMatches = matches.filter(match => {
        if (filter === 'all')
            return true;
        if (filter === 'sameTeam') {
            return match.HomeTeam === selectedMatch.HomeTeam ||
                match.HomeTeam === selectedMatch.AwayTeam ||
                match.AwayTeam === selectedMatch.HomeTeam ||
                match.AwayTeam === selectedMatch.AwayTeam;
        }
        if (filter === 'sameLeague') {
            return match.Div === selectedMatch.Div;
        }
        if (filter === 'htftSwitch') {
            return (match.HTR === 'A' && match.FTR === 'H') ||
                (match.HTR === 'H' && match.FTR === 'A');
        }
        if (filter === 'htftDraw') {
            return (match.HTR === 'A' && match.FTR === 'D') ||
                (match.HTR === 'H' && match.FTR === 'D');
        }
        return true;
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-gray-200 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["En Benzer ", filteredMatches.length, " Ma\u00E7"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setFilter('all'), className: `px-3 py-1.5 rounded text-sm ${filter === 'all'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "T\u00FCm\u00FC" }), _jsx("button", { onClick: () => setFilter('sameTeam'), className: `px-3 py-1.5 rounded text-sm ${filter === 'sameTeam'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "Ayn\u0131 Tak\u0131m" }), _jsx("button", { onClick: () => setFilter('sameLeague'), className: `px-3 py-1.5 rounded text-sm ${filter === 'sameLeague'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "Ayn\u0131 Lig" }), _jsx("button", { onClick: () => setFilter('htftSwitch'), className: `px-3 py-1.5 rounded text-sm ${filter === 'htftSwitch'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "1/2 2/1" }), _jsx("button", { onClick: () => setFilter('htftDraw'), className: `px-3 py-1.5 rounded text-sm ${filter === 'htftDraw'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "1/X 2/X" })] })] }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-full transition-colors", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-gray-500", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) }) })] }), _jsx("div", { className: "p-4 overflow-y-auto max-h-[calc(90vh-5rem)]", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredMatches.map((match, index) => (_jsx(MatchCard, { match: match, selectedMatch: selectedMatch, teamData: teamData, similarity: match.similarity, isExactBet365Match: match.isExactBet365Match }, index))) }) })] }) }));
}
export function SimilarMatches({ matches, selectedMatch, teamData, onSimilarMatchesChange }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tolerance, setTolerance] = useState(0.10);
    const [showToleranceMenu, setShowToleranceMenu] = useState(false);
    const [similarMatches, setSimilarMatches] = useState([]);
    // İlk yüklemede ve selectedMatch değiştiğinde benzer maçları hesapla
    React.useEffect(() => {
        if (!selectedMatch || !matches || matches.length === 0) {
            console.log('No data available yet');
            return;
        }
        // Oran kontrolü
        const hasOdds = selectedMatch.B365H && selectedMatch.B365D && selectedMatch.B365A;
        if (!hasOdds) {
            console.log('Selected match odds not loaded:', {
                B365H: selectedMatch.B365H,
                B365D: selectedMatch.B365D,
                B365A: selectedMatch.B365A
            });
            return;
        }
        console.log('Starting match comparison with:', {
            selectedMatch: `${selectedMatch.HomeTeam} vs ${selectedMatch.AwayTeam}`,
            totalMatches: matches.length,
            currentTolerance: tolerance
        });
        updateTolerance(tolerance);
        const newMatches = findSimilarMatches(selectedMatch, matches);
        setSimilarMatches(newMatches);
        onSimilarMatchesChange?.(newMatches);
    }, [selectedMatch, matches]);
    const handleToleranceChange = (event) => {
        const newTolerance = parseFloat(event.target.value);
        setTolerance(newTolerance);
        if (!selectedMatch || !matches || matches.length === 0)
            return;
        updateTolerance(newTolerance);
        const newMatches = findSimilarMatches(selectedMatch, matches);
        setSimilarMatches(newMatches);
        onSimilarMatchesChange?.(newMatches);
        setShowToleranceMenu(false);
    };
    const displayedMatches = similarMatches.slice(0, 6);
    const totalMatches = similarMatches.length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h2", { className: "text-xl font-bold text-gray-800", children: ["Benzer Ma\u00E7lar (", totalMatches, ")"] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowToleranceMenu(!showToleranceMenu), className: "p-2 hover:bg-gray-100 rounded-full transition-colors", title: "Tolerans Ayarlar\u0131", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 text-gray-600", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z", clipRule: "evenodd" }) }) }), showToleranceMenu && (_jsx("div", { className: "absolute right-0 top-8 bg-white rounded-lg shadow-lg p-2 z-50", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "tolerance", value: "0.1", checked: tolerance === 0.1, onChange: handleToleranceChange }), _jsx("span", { children: "0.1" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "tolerance", value: "0.15", checked: tolerance === 0.15, onChange: handleToleranceChange }), _jsx("span", { children: "0.15" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "tolerance", value: "0.2", checked: tolerance === 0.2, onChange: handleToleranceChange }), _jsx("span", { children: "0.2" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "tolerance", value: "0.3", checked: tolerance === 0.3, onChange: handleToleranceChange }), _jsx("span", { children: "0.3" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "tolerance", value: "0.4", checked: tolerance === 0.4, onChange: handleToleranceChange }), _jsx("span", { children: "0.4" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: "tolerance", value: "0.5", checked: tolerance === 0.5, onChange: handleToleranceChange }), _jsx("span", { children: "0.5" })] })] }) }))] }), totalMatches > 6 && (_jsxs("button", { onClick: () => setIsModalOpen(true), className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: ["T\u00FCm\u00FCn\u00FC G\u00F6ster (", totalMatches, ")"] }))] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: displayedMatches.map((match, index) => (_jsx(MatchCard, { match: match, selectedMatch: selectedMatch, teamData: teamData, similarity: match.similarity, isExactBet365Match: match.isExactBet365Match }, index))) }), isModalOpen && (_jsx(SimilarMatchesModal, { matches: similarMatches, selectedMatch: selectedMatch, teamData: teamData, onClose: () => setIsModalOpen(false) }))] }));
}
