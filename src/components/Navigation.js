import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useCallback } from 'react';
import { Calendar, BarChart2, Settings, Image, CalendarDays, Upload } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import * as XLSX from 'xlsx';
import { FixtureDownload } from './FixtureDownload';
import { Link, useLocation } from 'react-router-dom';
export function Navigation({ activePage, onPageChange, onDataLoad, onTeamDataLoad, onFixturesLoad, isDataLoaded = false }) {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const fileInputRef = useRef(null);
    const fixtureInputRef = useRef(null);
    const location = useLocation();
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const teamMapping = jsonData.reduce((acc, team) => {
                acc[team.name] = team;
                if (team.shortDisplayName !== team.name) {
                    acc[team.shortDisplayName] = team;
                }
                return acc;
            }, {});
            onTeamDataLoad(teamMapping);
        }
        catch (error) {
            console.error('Error loading team logos:', error);
        }
    }, [onTeamDataLoad]);
    const handleFixtureFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            onFixturesLoad(jsonData);
        }
        catch (error) {
            console.error('Error loading fixture file:', error);
        }
    }, [onFixturesLoad]);
    const tabs = [
        { name: 'Maçlar', path: '/' },
        { name: 'İstatistik Analizi', path: '/surpriz-analiz' },
        { name: 'Özel Analiz', path: '/ozel-analiz' },
        { name: 'Maç Programı', path: '/match-schedule' }
    ];
    return (_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("div", { className: "flex space-x-4", children: tabs.map((tab) => (_jsxs(Link, { to: tab.path, className: `flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${location.pathname === tab.path
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'}`, children: [tab.path === '/' && _jsx(Calendar, { size: 20, className: "transition-transform duration-300 group-hover:rotate-12" }), tab.path === '/surpriz-analiz' && _jsx(BarChart2, { size: 20, className: "transition-transform duration-300 group-hover:rotate-12" }), tab.path === '/ozel-analiz' && _jsx(BarChart2, { size: 20, className: "transition-transform duration-300 group-hover:rotate-12" }), tab.path === '/match-schedule' && _jsx(CalendarDays, { size: 20, className: "transition-transform duration-300 group-hover:rotate-12" }), _jsx("span", { children: tab.name })] }, tab.path))) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: handleImageClick, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 group", children: [_jsx(Image, { size: 24, className: "text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" }), _jsx("div", { className: "absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap", children: "Tak\u0131m Logolar\u0131n\u0131 Y\u00FCkle" })] }), _jsx("input", { type: "file", ref: fileInputRef, className: "hidden", accept: ".xlsx,.csv", onChange: handleFileChange })] }), _jsxs("div", { className: "relative group", children: [_jsx("button", { onClick: () => {
                                        const fixtureDownloadButton = document.querySelector('.fixture-download-button');
                                        if (fixtureDownloadButton) {
                                            fixtureDownloadButton.click();
                                        }
                                    }, className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110", children: _jsx(CalendarDays, { size: 24, className: "text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" }) }), _jsx("div", { className: "absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap", children: "Bu Haftan\u0131n Ma\u00E7lar\u0131n\u0131 Y\u00FCkle" }), _jsx("div", { className: "hidden", children: _jsx(FixtureDownload, { onFixturesLoad: onFixturesLoad }) })] }), _jsxs("div", { className: "relative group", children: [_jsx("button", { onClick: () => fixtureInputRef.current?.click(), className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110", children: _jsx(Upload, { size: 24, className: "text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" }) }), _jsx("div", { className: "absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap", children: "Fixture Dosyas\u0131 Y\u00FCkle" }), _jsx("input", { type: "file", ref: fixtureInputRef, className: "hidden", accept: ".csv,.xlsx", onChange: handleFixtureFileChange })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setIsSettingsOpen(!isSettingsOpen), className: "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110", children: _jsx(Settings, { size: 24, className: "text-gray-600 dark:text-gray-400 transition-all duration-300 hover:rotate-90" }) }), isSettingsOpen && (_jsx(SettingsPanel, { onClose: () => setIsSettingsOpen(false), onDataLoad: onDataLoad, onTeamDataLoad: onTeamDataLoad, onFixturesLoad: onFixturesLoad, isDataLoaded: isDataLoaded }))] })] })] }) }));
}
