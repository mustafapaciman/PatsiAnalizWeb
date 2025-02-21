import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';
export function TeamLogoUpload({ onTeamDataLoad }) {
    const handleFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        // Convert array to mapping object
        const teamMapping = jsonData.reduce((acc, team) => {
            acc[team.name] = team;
            // Also add mapping for shortDisplayName
            if (team.shortDisplayName !== team.name) {
                acc[team.shortDisplayName] = team;
            }
            return acc;
        }, {});
        onTeamDataLoad(teamMapping);
    }, [onTeamDataLoad]);
    return (_jsx("div", { className: "p-4 bg-white rounded-lg shadow-md mb-6", children: _jsxs("label", { className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50", children: [_jsxs("div", { className: "flex flex-col items-center justify-center pt-5 pb-6", children: [_jsx(Upload, { className: "w-10 h-10 mb-3 text-gray-400" }), _jsx("p", { className: "mb-2 text-sm text-gray-500", children: _jsx("span", { className: "font-semibold", children: "Tak\u0131m logolar\u0131n\u0131 y\u00FCklemek i\u00E7in t\u0131klay\u0131n" }) }), _jsx("p", { className: "text-xs text-gray-500", children: "CSV dosyas\u0131" })] }), _jsx("input", { type: "file", className: "hidden", accept: ".csv", onChange: handleFileChange })] }) }));
}
