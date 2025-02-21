import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { MatchCard } from './MatchCard';
import { X } from 'lucide-react';
export function SimilarMatchesModal({ matches, selectedMatch, teamData, onClose }) {
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
        return true;
    });
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-gray-200 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("h3", { className: "text-lg font-semibold", children: ["En Benzer ", filteredMatches.length, " Ma\u00E7"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => setFilter('all'), className: `px-3 py-1.5 rounded text-sm ${filter === 'all'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "T\u00FCm\u00FC" }), _jsx("button", { onClick: () => setFilter('sameTeam'), className: `px-3 py-1.5 rounded text-sm ${filter === 'sameTeam'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "Ayn\u0131 Tak\u0131m" }), _jsx("button", { onClick: () => setFilter('sameLeague'), className: `px-3 py-1.5 rounded text-sm ${filter === 'sameLeague'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "Ayn\u0131 Lig" })] })] }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-full transition-colors", children: _jsx(X, { size: 20, className: "text-gray-500" }) })] }), _jsx("div", { className: "p-4 overflow-y-auto max-h-[calc(90vh-5rem)]", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredMatches.map((match, index) => (_jsx(MatchCard, { match: match, selectedMatch: selectedMatch, teamData: teamData, similarity: match.similarity, isExactBet365Match: match.isExactBet365Match, isExactOtherBookieMatch: match.isExactOtherBookieMatch }, index))) }) })] }) }));
}
