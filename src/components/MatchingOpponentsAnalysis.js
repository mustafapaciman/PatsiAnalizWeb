import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { findMatchingOpponents } from '../utils/matchOpponentAnalysis';
import { getTeamLogo } from '../utils/teamLogoLoader';
export function MatchingOpponentsAnalysis({ fixtures, matchData, onClose }) {
    const [results, setResults] = useState([]);
    const [isHtFtSwitch, setIsHtFtSwitch] = useState(false);
    const [isHtFtDraw, setIsHtFtDraw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const analyzeMatches = async () => {
        setIsLoading(true);
        setProgress('Sürpriz maçlar filtreleniyor...');
        const analysisResults = [];
        // Filter surprise matches based on checkbox selections
        const surpriseMatches = matchData.filter(match => {
            if (isHtFtSwitch && ((match.HTR === 'H' && match.FTR === 'A') || (match.HTR === 'A' && match.FTR === 'H'))) {
                return true;
            }
            if (isHtFtDraw && ((match.HTR === 'H' || match.HTR === 'A') && match.FTR === 'D')) {
                return true;
            }
            return false;
        });
        console.log('Seçilen maç sayısı:', fixtures.length);
        console.log('Bulunan sürpriz maç sayısı:', surpriseMatches.length);
        // Process selected fixtures
        const totalTeams = fixtures.length * 2; // Her maç için 2 takım
        let processedTeams = 0;
        for (let i = 0; i < fixtures.length; i++) {
            const fixture = fixtures[i];
            // Process home team
            setProgress(`İşleniyor: ${fixture.HomeTeam} (${i + 1}/${fixtures.length})`);
            console.log('Analiz ediliyor:', fixture.HomeTeam);
            const currentHomeMatches = matchData
                .filter(m => m.HomeTeam === fixture.HomeTeam || m.AwayTeam === fixture.HomeTeam)
                .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
                .slice(0, 3);
            const homeSurpriseMatches = matchData.filter(match => {
                const isHomeTeamMatch = match.HomeTeam === fixture.HomeTeam || match.AwayTeam === fixture.HomeTeam;
                if (!isHomeTeamMatch)
                    return false;
                if (isHtFtSwitch && ((match.HTR === 'H' && match.FTR === 'A') || (match.HTR === 'A' && match.FTR === 'H'))) {
                    return true;
                }
                if (isHtFtDraw && ((match.HTR === 'H' || match.HTR === 'A') && match.FTR === 'D')) {
                    return true;
                }
                return false;
            });
            // Process away team
            setProgress(`İşleniyor: ${fixture.AwayTeam} (${i + 1}/${fixtures.length})`);
            console.log('Analiz ediliyor:', fixture.AwayTeam);
            const currentAwayMatches = matchData
                .filter(m => m.HomeTeam === fixture.AwayTeam || m.AwayTeam === fixture.AwayTeam)
                .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
                .slice(0, 3);
            const awaySurpriseMatches = matchData.filter(match => {
                const isAwayTeamMatch = match.HomeTeam === fixture.AwayTeam || match.AwayTeam === fixture.AwayTeam;
                if (!isAwayTeamMatch)
                    return false;
                if (isHtFtSwitch && ((match.HTR === 'H' && match.FTR === 'A') || (match.HTR === 'A' && match.FTR === 'H'))) {
                    return true;
                }
                if (isHtFtDraw && ((match.HTR === 'H' || match.HTR === 'A') && match.FTR === 'D')) {
                    return true;
                }
                return false;
            });
            const homeResult = findMatchingOpponents(currentHomeMatches, homeSurpriseMatches, fixture.HomeTeam, matchData);
            const awayResult = findMatchingOpponents(currentAwayMatches, awaySurpriseMatches, fixture.AwayTeam, matchData);
            analysisResults.push({
                homeTeam: fixture.HomeTeam,
                awayTeam: fixture.AwayTeam,
                homeMatchingCount: homeResult?.matchingCount || 0,
                awayMatchingCount: awayResult?.matchingCount || 0
            });
        }
        console.log('Analiz tamamlandı. Sonuç sayısı:', analysisResults.length);
        // Sort results by matching count (highest to lowest)
        analysisResults.sort((a, b) => {
            const aMaxCount = Math.max(a.homeMatchingCount, a.awayMatchingCount);
            const bMaxCount = Math.max(b.homeMatchingCount, b.awayMatchingCount);
            return bMaxCount - aMaxCount;
        });
        setResults(analysisResults);
        setProgress('');
        setIsLoading(false);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden", children: [_jsx("div", { className: "p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-800", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Se\u00E7ilen Ma\u00E7lar - Benzer Rakip Analizi" }), _jsx("button", { onClick: onClose, className: "text-white/80 hover:text-white transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsxs("div", { className: "p-6 bg-gray-50", children: [_jsxs("div", { className: "flex gap-6 mb-6", children: [_jsxs("label", { className: "flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-shadow", children: [_jsx("input", { type: "checkbox", checked: isHtFtSwitch, onChange: (e) => setIsHtFtSwitch(e.target.checked), className: "form-checkbox h-5 w-5 text-blue-600 rounded" }), _jsx("span", { className: "text-gray-700 font-medium", children: "1/2 & 2/1" })] }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-shadow", children: [_jsx("input", { type: "checkbox", checked: isHtFtDraw, onChange: (e) => setIsHtFtDraw(e.target.checked), className: "form-checkbox h-5 w-5 text-blue-600 rounded" }), _jsx("span", { className: "text-gray-700 font-medium", children: "1/X & 2/X" })] })] }), _jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("button", { onClick: analyzeMatches, disabled: isLoading || (!isHtFtSwitch && !isHtFtDraw), className: `px-6 py-2.5 rounded-lg font-medium transition-all ${isLoading || (!isHtFtSwitch && !isHtFtDraw)
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'}`, children: isLoading ? 'Hesaplanıyor...' : 'Hesapla' }), progress && (_jsx("span", { className: "text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm", children: progress }))] }), results.length > 0 && (_jsx("div", { className: "overflow-auto max-h-[calc(95vh-300px)] rounded-xl shadow-xl", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gradient-to-r from-gray-800 to-gray-900 text-white divide-x divide-gray-700", children: [_jsx("th", { className: "px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider w-1/3", children: "Ev Sahibi" }), _jsx("th", { className: "px-8 py-4 text-center text-sm font-semibold uppercase tracking-wider w-1/6", children: "E\u015Fle\u015Fen Rakip" }), _jsx("th", { className: "px-8 py-4 text-left text-sm font-semibold uppercase tracking-wider w-1/3", children: "Deplasman" }), _jsx("th", { className: "px-8 py-4 text-center text-sm font-semibold uppercase tracking-wider w-1/6", children: "E\u015Fle\u015Fen Rakip" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: results.map((result, index) => {
                                            const rowColor = result.homeMatchingCount === 3 || result.awayMatchingCount === 3 ? 'bg-green-100/90' :
                                                result.homeMatchingCount === 2 || result.awayMatchingCount === 2 ? 'bg-yellow-100/90' :
                                                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80';
                                            return (_jsxs("tr", { className: `${rowColor} hover:bg-opacity-90 transition-colors duration-150 divide-x divide-gray-200`, children: [_jsx("td", { className: "px-8 py-5 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("img", { src: getTeamLogo(result.homeTeam), alt: result.homeTeam, className: "w-10 h-10 object-contain" }), _jsx("span", { className: "text-base font-medium text-gray-900", children: result.homeTeam })] }) }), _jsx("td", { className: "px-8 py-5 whitespace-nowrap", children: _jsx("div", { className: `text-center font-bold text-xl ${result.homeMatchingCount === 3 ? 'text-green-600' :
                                                                result.homeMatchingCount === 2 ? 'text-yellow-600' :
                                                                    'text-gray-500'}`, children: result.homeMatchingCount }) }), _jsx("td", { className: "px-8 py-5 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("img", { src: getTeamLogo(result.awayTeam), alt: result.awayTeam, className: "w-10 h-10 object-contain" }), _jsx("span", { className: "text-base font-medium text-gray-900", children: result.awayTeam })] }) }), _jsx("td", { className: "px-8 py-5 whitespace-nowrap", children: _jsx("div", { className: `text-center font-bold text-xl ${result.awayMatchingCount === 3 ? 'text-green-600' :
                                                                result.awayMatchingCount === 2 ? 'text-yellow-600' :
                                                                    'text-gray-500'}`, children: result.awayMatchingCount }) })] }, index));
                                        }) })] }) }))] })] }) }));
}
