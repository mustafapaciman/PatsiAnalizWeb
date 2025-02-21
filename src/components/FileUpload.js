import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
export function FileUpload({ onDataLoad }) {
    const processExcelFile = useCallback(async (file) => {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const allData = [];
        // Process all sheets (E0, E1, E2, etc.)
        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            allData.push(...jsonData);
        }
        return allData;
    }, []);
    const handleFileChange = useCallback(async (event) => {
        const files = event.target.files;
        if (!files?.length)
            return;
        const allFileData = [];
        for (let i = 0; i < files.length; i++) {
            const fileData = await processExcelFile(files[i]);
            allFileData.push(...fileData);
        }
        onDataLoad(allFileData);
    }, [onDataLoad, processExcelFile]);
    return (_jsxs("div", { className: "p-6 bg-white rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Dosya Y\u00FCkleme" }), _jsx("input", { type: "file", accept: ".xlsx", multiple: true, onChange: handleFileChange, className: "block w-full text-sm text-gray-500\n          file:mr-4 file:py-2 file:px-4\n          file:rounded-full file:border-0\n          file:text-sm file:font-semibold\n          file:bg-blue-50 file:text-blue-700\n          hover:file:bg-blue-100" }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Birden fazla .xlsx dosyas\u0131 se\u00E7ebilirsiniz" })] }));
}
