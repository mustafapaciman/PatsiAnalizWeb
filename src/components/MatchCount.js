import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Database } from 'lucide-react';
export function MatchCount({ count }) {
    return (_jsx("div", { className: "bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Database, { size: 24 }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold", children: "Toplam Ma\u00E7 Say\u0131s\u0131" }), _jsx("p", { className: "text-3xl font-bold", children: count })] })] }) }));
}
