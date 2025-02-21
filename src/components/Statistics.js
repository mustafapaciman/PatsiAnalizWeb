import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StatisticsTable } from './StatisticsTable';
import { findSimilarMatches } from '../utils/oddsComparison';
export function Statistics({ selectedMatch, allMatches, teamData }) {
    // Benzer maçları bul
    const similarMatches = findSimilarMatches(selectedMatch, allMatches);
    // Sonuç formatını dönüştür (H/D/A -> 1/X/2)
    const convertResult = (result) => {
        switch (result) {
            case 'H': return '1';
            case 'D': return 'X';
            case 'A': return '2';
            default: return result;
        }
    };
    // İstatistikleri hesapla
    const calculateStats = () => {
        const stats = {
            matches: similarMatches,
            scores: {},
            htftScenarios: {},
            htScores: {},
            htGoals: {},
            ftGoals: {}
        };
        similarMatches.forEach(match => {
            // Maç skorları
            const score = `${match.FTHG}-${match.FTAG}`;
            stats.scores[score] = (stats.scores[score] || 0) + 1;
            // İY/MS senaryoları (1/X/2 formatında)
            const htftScenario = `${convertResult(match.HTR)}/${convertResult(match.FTR)}`;
            stats.htftScenarios[htftScenario] = (stats.htftScenarios[htftScenario] || 0) + 1;
            // İlk yarı skorları
            const htScore = `${match.HTHG}-${match.HTAG}`;
            stats.htScores[htScore] = (stats.htScores[htScore] || 0) + 1;
            // İlk yarı toplam gol
            const htGoals = Number(match.HTHG) + Number(match.HTAG);
            stats.htGoals[htGoals.toString()] = (stats.htGoals[htGoals.toString()] || 0) + 1;
            // Maç sonu toplam gol
            const ftGoals = Number(match.FTHG) + Number(match.FTAG);
            stats.ftGoals[ftGoals.toString()] = (stats.ftGoals[ftGoals.toString()] || 0) + 1;
        });
        return stats;
    };
    const stats = calculateStats();
    return (_jsx("div", { className: "space-y-4", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-2", children: "AI \u0130statistik Tablosu" }), _jsx(StatisticsTable, { data: stats })] }) }) }));
}
