import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function StatisticsTable({ data }) {
    const getPercentageColor = (percentage, totalMatches) => {
        // Eğer toplam maç sayısı 50'den fazlaysa daha yüksek eşikler kullan
        if (totalMatches >= 50) {
            if (percentage >= 25)
                return 'bg-[#4ade80]'; // Yeşil
            if (percentage >= 15)
                return 'bg-[#fbbf24]'; // Sarı
            return 'bg-[#ef4444]'; // Kırmızı
        }
        // Eğer toplam maç sayısı 20-50 arasındaysa orta eşikler kullan
        else if (totalMatches >= 20) {
            if (percentage >= 20)
                return 'bg-[#4ade80]'; // Yeşil
            if (percentage >= 10)
                return 'bg-[#fbbf24]'; // Sarı
            return 'bg-[#ef4444]'; // Kırmızı
        }
        // Eğer toplam maç sayısı 20'den azsa daha düşük eşikler kullan
        else {
            if (percentage >= 15)
                return 'bg-[#4ade80]'; // Yeşil
            if (percentage >= 8)
                return 'bg-[#fbbf24]'; // Sarı
            return 'bg-[#ef4444]'; // Kırmızı
        }
    };
    const renderStats = (title, stats, total) => {
        const sortedStats = Object.entries(stats)
            .sort(([, a], [, b]) => b - a);
        return (_jsxs("div", { className: "flex flex-col min-w-[120px]", children: [_jsx("div", { className: "bg-[#1a1f2e] text-white py-1.5 px-2 rounded-t-lg text-center font-medium text-sm mb-1", children: title }), _jsx("div", { className: "space-y-1 p-1 bg-white rounded-b-lg shadow-md", children: sortedStats.map(([key, value]) => {
                        const percentage = ((value / total) * 100).toFixed(0);
                        return (_jsxs("div", { className: "bg-white rounded shadow-md mb-2", children: [_jsxs("div", { className: `${getPercentageColor(Number(percentage), total)} text-black text-center py-0.5 text-base font-bold rounded-t mb-1`, children: ["%", percentage] }), _jsxs("div", { className: "py-1 px-1.5 text-center space-y-0.5", children: [_jsx("div", { className: "text-gray-600 text-xs mb-1", children: title }), _jsx("div", { className: "text-gray-900 font-bold text-base leading-none mb-1", children: key }), _jsxs("div", { className: "text-gray-500 text-xs leading-none", children: [value, " Kere"] })] })] }, key));
                    }) })] }));
    };
    // Eğer benzer maç yoksa mesaj göster
    if (data.matches.length === 0) {
        return (_jsx("div", { className: "w-full max-w-[650px]", children: _jsx("div", { className: "bg-white p-6 rounded-lg text-center", children: _jsx("p", { className: "text-gray-600", children: "Se\u00E7ilen tolerans de\u011Ferine g\u00F6re benzer ma\u00E7 bulunamad\u0131. \u0130statistikler g\u00F6sterilemiyor." }) }) }));
    }
    return (_jsx("div", { className: "w-full max-w-[800px]", children: _jsx("div", { className: "bg-white p-4 rounded-lg overflow-y-auto max-h-[600px]", children: _jsxs("div", { className: "flex gap-3", children: [renderStats("Skorlar", data.scores, data.matches.length), renderStats("İY/MS", data.htftScenarios, data.matches.length), renderStats("İlk Yarı Skor", data.htScores, data.matches.length), renderStats("İlk Yarı Gol", data.htGoals, data.matches.length), renderStats("Maç Sonu Gol", data.ftGoals, data.matches.length)] }) }) }));
}
