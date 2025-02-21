import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { parseDateString } from '../utils/dateUtils';
const formatOdds = (odds) => {
    if (typeof odds === 'number') {
        return odds.toFixed(2);
    }
    return '-';
};
// Tarihi tersine çeviren fonksiyon
const formatDate = (date) => {
    // Mevcut ayı ve günü al
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    // Ay ve günü yer değiştirerek göster (gün.ay.yıl şeklinde)
    return `${day}.${month} ${hours}:${minutes}`;
};
// Tarihi görsel olarak düzelten filtre fonksiyonu
const visualDateFilter = (dateStr) => {
    const [day, month] = dateStr.split('.');
    return `${month}.${day}`;
};
export function Fixtures({ fixtures, onSelectMatch }) {
    const sortedFixtures = [...fixtures].sort((a, b) => {
        const dateA = parseDateString(a.Date || '', a.Time || '');
        const dateB = parseDateString(b.Date || '', b.Time || '');
        return dateA.getTime() - dateB.getTime();
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800", children: "G\u00FCncel Fikst\u00FCr" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: sortedFixtures.map((match, index) => (_jsxs("div", { onClick: () => onSelectMatch(match), className: "p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsxs("span", { className: "text-sm text-gray-600 font-medium", children: [visualDateFilter(formatDate(parseDateString(match.Date || '', match.Time || '')).split(' ')[0]), " ", formatDate(parseDateString(match.Date || '', match.Time || '')).split(' ')[1]] }), _jsx("span", { className: "text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded", children: match.Div })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "text-center flex-1", children: [_jsx("div", { className: "font-semibold text-gray-800", children: match.HomeTeam }), _jsx("div", { className: "text-sm font-medium text-gray-600", children: "vs" }), _jsx("div", { className: "font-semibold text-gray-800", children: match.AwayTeam })] }), _jsx("div", { className: "border-l border-gray-200 pl-4 ml-4", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 text-center", children: [_jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-gray-600", children: "1" }), _jsx("div", { className: "text-gray-800", children: formatOdds(match.B365H) })] }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-gray-600", children: "X" }), _jsx("div", { className: "text-gray-800", children: formatOdds(match.B365D) })] }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-gray-600", children: "2" }), _jsx("div", { className: "text-gray-800", children: formatOdds(match.B365A) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-center border-t border-gray-200 pt-2", children: [_jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-gray-600", children: "\u00DCst 2.5" }), _jsx("div", { className: "text-gray-800", children: formatOdds(match['B365>2.5']) })] }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-medium text-gray-600", children: "Alt 2.5" }), _jsx("div", { className: "text-gray-800", children: formatOdds(match['B365<2.5']) })] })] })] }) })] })] }, index))) })] }));
}
