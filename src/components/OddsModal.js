import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { X, Calendar, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { OddsDisplay } from './OddsDisplay';
import { parseDateString } from '../utils/dateUtils';
import { TeamLogo } from './TeamLogo';
const EMPTY_LOGO = "https://www.clipartmax.com/png/small/19-194962_coa-illustration-shield-triangular-team-logo-template-png.png";
const BOOKMAKER_LOGOS = {
    'B365': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Bet365_Logo.svg/2560px-Bet365_Logo.svg.png',
    'WH': 'https://logos-world.net/wp-content/uploads/2021/05/William-Hill-Logo-700x394.png',
    'BW': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Bwin.svg/1200px-Bwin.svg.png',
    'IW': 'https://static.betmarket.gr/uploads/interwetten-logo-new.png',
    'PS': 'https://www.betrallyindia.com/wp-content/uploads/2019/12/pinnacle-transparent-logo.png',
    'VC': 'https://mybettingsites-com.imgix.net/assets/local/Betting-Companies/logos/vbet-logo-new-pink.png'
};
export function OddsModal({ match, selectedMatch, teamData, onClose }) {
    const [currentMatch, setCurrentMatch] = React.useState(match);
    const [isViewingSelectedMatch, setIsViewingSelectedMatch] = React.useState(false);
    const handleNext = () => {
        setCurrentMatch(selectedMatch);
        setIsViewingSelectedMatch(true);
    };
    const handlePrevious = () => {
        setCurrentMatch(match);
        setIsViewingSelectedMatch(false);
    };
    const bookmakers = [
        { code: 'B365', name: 'Bet365' },
        { code: 'BW', name: 'Bet&Win' },
        { code: 'IW', name: 'Interwetten' },
        { code: 'PS', name: 'Pinnacle' },
        { code: 'WH', name: 'William Hill' },
        { code: 'VC', name: 'VC Bet' },
        { code: 'Avg', name: 'Market Average' },
        { code: 'Max', name: 'Market Maximum' }
    ];
    const formatOdds = (value) => {
        if (typeof value === 'undefined')
            return 'X';
        if (typeof value === 'number')
            return value.toFixed(2);
        return value;
    };
    const compareOdds = (odds1, odds2) => {
        if (!odds1 || !odds2)
            return null;
        const diff = Math.abs(odds1 - odds2);
        const percentage = Math.min(odds1, odds2) / Math.max(odds1, odds2) * 100;
        if (percentage >= 97)
            return 'bg-yellow-100';
        if (percentage >= 94)
            return 'bg-blue-100';
        if (diff <= 0.03)
            return 'bg-green-100';
        return '';
    };
    const getOddsClass = (currentOdds, referenceOdds, isSelectedMatch = false) => {
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
    const hasAnyOdds = (bm) => {
        const fields = [
            `${bm}H`, `${bm}D`, `${bm}A`,
            `${bm}CH`, `${bm}CD`, `${bm}CA`,
            `${bm}>2.5`, `${bm}<2.5`,
            `${bm}C>2.5`, `${bm}C<2.5`,
            `${bm}AHH`, `${bm}AHA`,
            `${bm}CAHH`, `${bm}CAHA`
        ];
        return fields.some(field => match[field]);
    };
    const activeBookmakers = bookmakers.filter(bm => hasAnyOdds(bm.code));
    const getLeagueName = (code) => {
        const leagues = {
            'E0': 'Premier Lig',
            'E1': 'Championship',
            'E2': 'League One',
            'E3': 'League Two',
            'SC0': 'İskoçya Ligi',
            'SC1': 'İskoçya Championship',
            'SC2': 'İskoçya League One',
            'SC3': 'İskoçya League Two',
            'D1': 'Bundesliga',
            'D2': '2. Bundesliga',
            'SP1': 'La Liga',
            'SP2': 'La Liga 2',
            'I1': 'Serie A',
            'I2': 'Serie B',
            'F1': 'Ligue 1',
            'F2': 'Ligue 2',
            'N1': 'Eredivisie',
            'B1': 'Belçika Ligi',
            'P1': 'Portekiz Ligi',
            'T1': 'Türkiye Ligi',
            'G1': 'Yunanistan Ligi'
        };
        return leagues[code] || code;
    };
    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        // Görsel olarak ay ve günü yer değiştiriyoruz
        return `${month}.${day}.${year} ${hours}:${minutes}`;
    };
    const BookmakerLogo = ({ code, name }) => {
        if (code === 'Avg' || code === 'Max') {
            return _jsx("span", { className: "font-medium text-gray-700", children: name });
        }
        return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-8 w-20 flex items-center justify-center bg-white rounded-lg p-1", children: _jsx("img", { src: BOOKMAKER_LOGOS[code] || EMPTY_LOGO, alt: name, className: "h-6 w-full object-contain", title: name, onError: (e) => {
                            e.target.src = EMPTY_LOGO;
                        } }) }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: name })] }));
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "relative bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col", children: [selectedMatch && match !== selectedMatch && (_jsx(_Fragment, { children: isViewingSelectedMatch ? (_jsxs("button", { onClick: handlePrevious, className: "absolute right-0 top-1/2 -translate-y-1/2 translate-x-32 p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-lg transition-all duration-200 group flex flex-col items-center", title: "Benzer Ma\u00E7a D\u00F6n", children: [_jsx(ChevronLeft, { size: 32, className: "text-gray-600 group-hover:text-blue-600" }), _jsx("span", { className: "text-xs text-gray-600 group-hover:text-blue-600 mt-1 whitespace-nowrap font-medium", children: "Benzer Ma\u00E7a D\u00F6n" })] })) : (_jsxs("button", { onClick: handleNext, className: "absolute right-0 top-1/2 -translate-y-1/2 translate-x-32 p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-lg transition-all duration-200 group flex flex-col items-center", title: "Se\u00E7ilen Ma\u00E7a Git", children: [_jsx(ChevronRight, { size: 32, className: "text-gray-600 group-hover:text-blue-600" }), _jsx("span", { className: "text-xs text-gray-600 group-hover:text-blue-600 mt-1 whitespace-nowrap font-medium", children: "Se\u00E7ilen Ma\u00E7a Git" })] })) })), _jsxs("div", { className: "sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("h2", { className: "text-lg font-bold text-gray-800", children: "Detayl\u0131 Oranlar" }), selectedMatch && match !== selectedMatch && (_jsx("div", { className: "flex items-center gap-2", children: isViewingSelectedMatch ? (_jsx("span", { className: "text-sm text-gray-500", children: "Se\u00E7ilen Ma\u00E7" })) : (_jsx("span", { className: "text-sm text-gray-500", children: "Benzer Ma\u00E7" })) }))] }), _jsxs("div", { className: "flex flex-col text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Trophy, { size: 16, className: "text-gray-400" }), _jsx("span", { children: getLeagueName(currentMatch.Div) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { size: 16, className: "text-gray-400" }), _jsx("span", { children: formatDate(parseDateString(currentMatch.Date, currentMatch.Time)) })] })] })] }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsx(TeamLogo, { name: currentMatch.HomeTeam, className: "w-12 h-12", teamData: teamData, showName: true }), _jsx("div", { className: "text-gray-400 font-bold text-lg", children: "VS" }), _jsx(TeamLogo, { name: currentMatch.AwayTeam, className: "w-12 h-12", teamData: teamData, showName: true })] })] }) }), _jsx("button", { onClick: onClose, className: "ml-4 p-2 hover:bg-gray-100 rounded-full transition", children: _jsx(X, { size: 20, className: "text-gray-500" }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-8", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "Bet365 Oranlar\u0131" }) }), _jsx(OddsDisplay, { match: currentMatch, selectedMatch: selectedMatch, isSelectedMatch: currentMatch === selectedMatch })] }), _jsxs("div", { className: "space-y-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-800", children: "T\u00FCm Bookmaker Oranlar\u0131" }), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium", children: "1X2 Oranlar\u0131" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48", children: "Bookmaker" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "1 (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "X (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "2 (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "1 (Kapan\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "X (Kapan\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "2 (Kapan\u0131\u015F)" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: activeBookmakers.map(({ code: bm, name }) => {
                                                            return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: _jsx(BookmakerLogo, { code: bm, name: name }) }), _jsx("td", { className: `px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}H`], selectedMatch[`${bm}H`], currentMatch === selectedMatch)}`, children: formatOdds(currentMatch[`${bm}H`]) }), _jsx("td", { className: `px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}D`], selectedMatch[`${bm}D`], currentMatch === selectedMatch)}`, children: formatOdds(currentMatch[`${bm}D`]) }), _jsx("td", { className: `px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}A`], selectedMatch[`${bm}A`], currentMatch === selectedMatch)}`, children: formatOdds(currentMatch[`${bm}A`]) }), _jsx("td", { className: `px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}CH`], selectedMatch[`${bm}CH`], currentMatch === selectedMatch)}`, children: formatOdds(currentMatch[`${bm}CH`]) }), _jsx("td", { className: `px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}CD`], selectedMatch[`${bm}CD`], currentMatch === selectedMatch)}`, children: formatOdds(currentMatch[`${bm}CD`]) }), _jsx("td", { className: `px-4 py-2 text-center text-sm ${getOddsClass(currentMatch[`${bm}CA`], selectedMatch[`${bm}CA`], currentMatch === selectedMatch)}`, children: formatOdds(currentMatch[`${bm}CA`]) })] }, bm));
                                                        }) })] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium", children: "Over/Under 2.5 Gol Oranlar\u0131" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-sm font-medium text-gray-500", children: "Bookmaker" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "\u00DCst (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Alt (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "\u00DCst (Kapan\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Alt (Kapan\u0131\u015F)" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: activeBookmakers.map(({ code: bm, name }) => {
                                                            const openingOver = currentMatch[`${bm}>2.5`];
                                                            const openingUnder = currentMatch[`${bm}<2.5`];
                                                            const closingOver = currentMatch[`${bm}C>2.5`];
                                                            const closingUnder = currentMatch[`${bm}C<2.5`];
                                                            const selectedOpeningOver = selectedMatch[`${bm}>2.5`];
                                                            const selectedOpeningUnder = selectedMatch[`${bm}<2.5`];
                                                            const selectedClosingOver = selectedMatch[`${bm}C>2.5`];
                                                            const selectedClosingUnder = selectedMatch[`${bm}C<2.5`];
                                                            return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: _jsx(BookmakerLogo, { code: bm, name: name }) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(openingOver, selectedOpeningOver, currentMatch === selectedMatch)}`, children: formatOdds(openingOver) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(openingUnder, selectedOpeningUnder, currentMatch === selectedMatch)}`, children: formatOdds(openingUnder) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(closingOver, selectedClosingOver, currentMatch === selectedMatch)}`, children: formatOdds(closingOver) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(closingUnder, selectedClosingUnder, currentMatch === selectedMatch)}`, children: formatOdds(closingUnder) })] }, bm));
                                                        }) })] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4 py-2 rounded-lg font-medium", children: "Asian Handicap" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-sm font-medium text-gray-500", children: "Bookmaker" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Handikap" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Ev (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Dep (A\u00E7\u0131l\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Ev (Kapan\u0131\u015F)" }), _jsx("th", { className: "px-4 py-2 text-center text-sm font-medium text-gray-500", children: "Dep (Kapan\u0131\u015F)" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: activeBookmakers.map(({ code: bm, name }) => {
                                                            const handicap = currentMatch[`${bm}AH`];
                                                            const openingHome = currentMatch[`${bm}AHH`];
                                                            const openingAway = currentMatch[`${bm}AHA`];
                                                            const closingHome = currentMatch[`${bm}CAHH`];
                                                            const closingAway = currentMatch[`${bm}CAHA`];
                                                            const selectedHandicap = selectedMatch[`${bm}AH`];
                                                            const selectedOpeningHome = selectedMatch[`${bm}AHH`];
                                                            const selectedOpeningAway = selectedMatch[`${bm}AHA`];
                                                            const selectedClosingHome = selectedMatch[`${bm}CAHH`];
                                                            const selectedClosingAway = selectedMatch[`${bm}CAHA`];
                                                            return (_jsxs("tr", { className: "hover:bg-gray-50", children: [_jsx("td", { className: "px-4 py-2", children: _jsx(BookmakerLogo, { code: bm, name: name }) }), _jsx("td", { className: "px-4 py-2 text-center", children: handicap || '-' }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(openingHome, selectedOpeningHome, currentMatch === selectedMatch)}`, children: formatOdds(openingHome) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(openingAway, selectedOpeningAway, currentMatch === selectedMatch)}`, children: formatOdds(openingAway) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(closingHome, selectedClosingHome, currentMatch === selectedMatch)}`, children: formatOdds(closingHome) }), _jsx("td", { className: `px-4 py-2 text-center ${getOddsClass(closingAway, selectedClosingAway, match === selectedMatch)}`, children: formatOdds(closingAway) })] }, bm));
                                                        }) })] }) })] })] }), _jsxs("div", { className: "p-6 bg-gray-50 rounded-lg space-y-4", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-800", children: "Bookmaker A\u00E7\u0131klamalar\u0131" }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-6", children: bookmakers.map(({ code, name }) => (_jsx("div", { children: _jsx(BookmakerLogo, { code: code, name: name }) }, code))) })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-800 mb-2", children: "Renk A\u00E7\u0131klamalar\u0131" }), _jsxs("ul", { className: "space-y-2 text-sm", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 bg-green-100 rounded" }), _jsx("span", { children: "Neredeyse Ayn\u0131 Oranlar (%99+ benzerlik)" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 bg-yellow-100 rounded" }), _jsx("span", { children: "\u00C7ok Yak\u0131n Oranlar (%97-99 benzerlik)" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 bg-blue-100 rounded" }), _jsx("span", { children: "Yak\u0131n Oranlar (%94-97 benzerlik)" })] })] })] })] })] }) }));
}
