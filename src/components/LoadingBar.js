import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function LoadingBar({ isLoading, message = 'Veriler yükleniyor...' }) {
    if (!isLoading)
        return null;
    return (_jsxs("div", { className: "fixed top-0 left-0 right-0 z-50", children: [_jsx("div", { className: "bg-blue-600 h-1 animate-progress" }), _jsx("div", { className: "text-center text-sm text-blue-600 mt-1", children: message })] }));
}
