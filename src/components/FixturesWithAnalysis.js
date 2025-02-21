import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FixtureList } from './FixtureList';
import { Statistics } from './Statistics';
import { SimilarMatches } from './SimilarMatches';
import { MatchHeader } from './MatchHeader';
export function FixturesWithAnalysis({ fixtures, matchData, selectedMatch, teamData, searchResults, onSelectMatch }) {
    return (_jsxs("div", { className: "flex gap-4", children: [_jsx("div", { className: "w-[40%]", children: _jsx(FixtureList, { fixtures: fixtures, onSelectMatch: onSelectMatch, selectedMatch: selectedMatch, teamData: teamData }) }), _jsx("div", { className: "w-[60%]", children: searchResults && selectedMatch ? (_jsxs("div", { className: "space-y-6", children: [_jsx(MatchHeader, { match: selectedMatch, teamData: teamData }), _jsx(Statistics, { data: searchResults, selectedMatch: selectedMatch, allMatches: matchData, teamData: teamData }), _jsx(SimilarMatches, { matches: searchResults.matches, selectedMatch: selectedMatch, teamData: teamData })] })) : (_jsx("div", { className: "h-full flex items-center justify-center text-gray-500", children: "Analiz i\u00E7in bir ma\u00E7 se\u00E7in" })) })] }));
}
