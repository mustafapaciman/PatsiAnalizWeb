import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";
const BOOKMAKER_LOGOS = {
    'B365': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Bet365_Logo.svg/2560px-Bet365_Logo.svg.png',
    'WH': 'https://logos-world.net/wp-content/uploads/2021/05/William-Hill-Logo-700x394.png',
    'BW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Bwin.svg/1200px-Bwin.svg.png',
    'IW': 'https://static.betmarket.gr/uploads/interwetten-logo-new.png',
    'PS': 'https://www.betrallyindia.com/wp-content/uploads/2019/12/pinnacle-transparent-logo.png',
    'VC': 'https://mybettingsites-com.imgix.net/assets/local/Betting-Companies/logos/vbet-logo-new-pink.png'
};
export function OddsDisplay({ match, selectedMatch, isSelectedMatch = false }) {
    const getOddsClass = (currentOdds, referenceOdds) => {
        if (!currentOdds || !referenceOdds || isSelectedMatch)
            return '';
        const similarity = Math.min(currentOdds, referenceOdds) / Math.max(currentOdds, referenceOdds) * 100;
        if (similarity >= 99)
            return 'bg-green-100'; // Neredeyse aynı oranlar (99%+ benzerlik)
        if (similarity >= 97)
            return 'bg-yellow-100'; // Çok yakın oranlar (97-99% benzerlik)
        if (similarity >= 94)
            return 'bg-blue-100'; // Yakın oranlar (94-97% benzerlik)
        return '';
    };
    const formatOdds = (odds) => {
        if (typeof odds === 'undefined')
            return '-';
        if (typeof odds === 'number')
            return odds.toFixed(2);
        return odds;
    };
    return (_jsxs("div", { className: "space-y-4", children: [match.B365H && match.B365D && match.B365A && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-6", children: _jsx("img", { src: BOOKMAKER_LOGOS.B365, alt: "Bet365", className: "h-full object-contain", onError: (e) => {
                                        e.target.src = EMPTY_LOGO;
                                    } }) }), _jsx("h3", { className: "text-sm font-semibold text-gray-700", children: "A\u00E7\u0131l\u0131\u015F Oranlar\u0131" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "grid grid-cols-3 gap-2 text-sm", children: [_jsxs("div", { className: `text-center ${getOddsClass(match.B365H, selectedMatch.B365H)}`, children: [_jsx("div", { className: "font-medium", children: "1" }), _jsx("div", { children: formatOdds(match.B365H) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match.B365D, selectedMatch.B365D)}`, children: [_jsx("div", { className: "font-medium", children: "X" }), _jsx("div", { children: formatOdds(match.B365D) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match.B365A, selectedMatch.B365A)}`, children: [_jsx("div", { className: "font-medium", children: "2" }), _jsx("div", { children: formatOdds(match.B365A) })] })] }) }), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: `text-center ${getOddsClass(match['B365>2.5'], selectedMatch['B365>2.5'])}`, children: [_jsx("div", { className: "font-medium", children: "\u00DCst" }), _jsx("div", { children: formatOdds(match['B365>2.5']) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match['B365<2.5'], selectedMatch['B365<2.5'])}`, children: [_jsx("div", { className: "font-medium", children: "Alt" }), _jsx("div", { children: formatOdds(match['B365<2.5']) })] })] }) }), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: `text-center ${getOddsClass(match.B365AHH, selectedMatch.B365AHH)}`, children: [_jsx("div", { className: "font-medium", children: "Ev" }), _jsx("div", { children: formatOdds(match.B365AHH) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match.B365AHA, selectedMatch.B365AHA)}`, children: [_jsx("div", { className: "font-medium", children: "Dep" }), _jsx("div", { children: formatOdds(match.B365AHA) })] })] }) })] })] })), match.B365CH && match.B365CD && match.B365CA && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-6", children: _jsx("img", { src: BOOKMAKER_LOGOS.B365, alt: "Bet365", className: "h-full object-contain", onError: (e) => {
                                        e.target.src = EMPTY_LOGO;
                                    } }) }), _jsx("h3", { className: "text-sm font-semibold text-gray-700", children: "Kapan\u0131\u015F Oranlar\u0131" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "grid grid-cols-3 gap-2 text-sm", children: [_jsxs("div", { className: `text-center ${getOddsClass(match.B365CH, selectedMatch.B365CH)}`, children: [_jsx("div", { className: "font-medium", children: "1" }), _jsx("div", { children: formatOdds(match.B365CH) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match.B365CD, selectedMatch.B365CD)}`, children: [_jsx("div", { className: "font-medium", children: "X" }), _jsx("div", { children: formatOdds(match.B365CD) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match.B365CA, selectedMatch.B365CA)}`, children: [_jsx("div", { className: "font-medium", children: "2" }), _jsx("div", { children: formatOdds(match.B365CA) })] })] }) }), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: `text-center ${getOddsClass(match['B365C>2.5'], selectedMatch['B365C>2.5'])}`, children: [_jsx("div", { className: "font-medium", children: "\u00DCst" }), _jsx("div", { children: formatOdds(match['B365C>2.5']) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match['B365C<2.5'], selectedMatch['B365C<2.5'])}`, children: [_jsx("div", { className: "font-medium", children: "Alt" }), _jsx("div", { children: formatOdds(match['B365C<2.5']) })] })] }) }), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: `text-center ${getOddsClass(match.B365CAHH, selectedMatch.B365CAHH)}`, children: [_jsx("div", { className: "font-medium", children: "Ev" }), _jsx("div", { children: formatOdds(match.B365CAHH) })] }), _jsxs("div", { className: `text-center ${getOddsClass(match.B365CAHA, selectedMatch.B365CAHA)}`, children: [_jsx("div", { className: "font-medium", children: "Dep" }), _jsx("div", { children: formatOdds(match.B365CAHA) })] })] }) })] })] }))] }));
}
