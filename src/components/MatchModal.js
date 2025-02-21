import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { parseDateString } from '../utils/dateUtils';
export function MatchModal({ match, onClose }) {
    const formatDateTime = (date, time) => {
        const dateObj = parseDateString(date, time);
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-lg w-full mx-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold", children: "Ma\u00E7 Detaylar\u0131" }), _jsx("button", { onClick: onClose, className: "p-1 hover:bg-gray-100 rounded-full transition", children: _jsx(X, { size: 24 }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Genel Bilgiler" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsx("div", { children: "Tarih ve Saat:" }), _jsx("div", { className: "font-medium", children: formatDateTime(match.Date, match.Time) }), _jsx("div", { children: "Lig:" }), _jsx("div", { className: "font-medium", children: match.Div }), _jsx("div", { children: "Skor:" }), _jsxs("div", { className: "font-medium", children: [match.FTHG, " - ", match.FTAG] }), _jsx("div", { children: "\u0130lk Yar\u0131:" }), _jsxs("div", { className: "font-medium", children: [match.HTHG, " - ", match.HTAG] })] })] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Bahis Oranlar\u0131" }), _jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsx("div", { children: "Ev Sahibi:" }), _jsx("div", { className: "font-medium", children: match.B365CH }), _jsx("div", { children: "Beraberlik:" }), _jsx("div", { className: "font-medium", children: match.B365CD }), _jsx("div", { children: "Deplasman:" }), _jsx("div", { className: "font-medium", children: match.B365CA }), _jsx("div", { children: "2.5 \u00DCst:" }), _jsx("div", { className: "font-medium", children: match['B365C>2.5'] }), _jsx("div", { children: "2.5 Alt:" }), _jsx("div", { className: "font-medium", children: match['B365C<2.5'] })] })] })] })] }) }));
}
