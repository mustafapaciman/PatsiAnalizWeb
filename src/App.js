import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { FixtureList } from './components/FixtureList';
import { Statistics } from './components/Statistics';
import { SimilarMatches } from './components/SimilarMatches';
import { MatchCount } from './components/MatchCount';
import { MatchHeader } from './components/MatchHeader';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Trophy } from 'lucide-react';
import { analyzeMatches } from './utils/matchAnalysis';
import { loadMatchData } from './utils/teamDataLoader';
import SpecialAnalysis from './components/SpecialAnalysis';
import { Routes, Route, useNavigate } from 'react-router-dom';
import MatchSchedule from './components/MatchSchedule';
// Sekme listesine Maç Programı'nı ekle
const tabs = [
    { id: 'fixtures', name: 'Maçlar' },
    { id: 'specialAnalysis', name: 'Özel Analiz' },
    { id: 'matchSchedule', name: 'Maç Programı' }
];
// DO NOT DELETE START - Main App Component
export default function App() {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('fixtures');
    const [matchData, setMatchData] = useState([]);
    const [fixtures, setFixtures] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [searchResults, setSearchResults] = useState(null);
    const [teamData, setTeamData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    // DO NOT DELETE START - Initial Data Loading
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                setProgress(0);
                console.log('Loading initial match data...');
                // Başlangıç animasyonu
                await new Promise(resolve => setTimeout(resolve, 500));
                setProgress(10);
                // Veri yükleme başlangıcı
                await new Promise(resolve => setTimeout(resolve, 300));
                setProgress(30);
                // Veri yükleme
                const data = await loadMatchData();
                setProgress(60);
                // Veri işleme
                await new Promise(resolve => setTimeout(resolve, 300));
                setProgress(80);
                // Verileri state'e kaydetme
                setMatchData(data);
                setProgress(90);
                // Tamamlanma animasyonu
                await new Promise(resolve => setTimeout(resolve, 300));
                setProgress(100);
                console.log('Initial match data loaded successfully');
                // Tamamlandı mesajını göster
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            catch (error) {
                console.error('Error loading initial match data:', error);
            }
            finally {
                setIsLoading(false);
                setProgress(0);
            }
        };
        loadInitialData();
    }, []);
    // DO NOT DELETE END - Initial Data Loading
    // DO NOT DELETE START - Core Match Selection Handler
    const handleFixtureSelect = (match) => {
        setSelectedMatch(match);
        // Store selected match in localStorage
        localStorage.setItem('selectedMatch', JSON.stringify(match));
        const results = analyzeMatches(matchData, match);
        setSearchResults(results);
        navigate('/surpriz-analiz');
    };
    // DO NOT DELETE END - Core Match Selection Handler
    // Load selected match from localStorage on app start
    useEffect(() => {
        const savedMatch = localStorage.getItem('selectedMatch');
        if (savedMatch) {
            try {
                const match = JSON.parse(savedMatch);
                setSelectedMatch(match);
            }
            catch (error) {
                console.error('Error loading saved match:', error);
            }
        }
    }, []);
    const handlePageChange = (page) => {
        setActivePage(page);
        if (page === 'fixtures') {
            navigate('/');
        }
        else {
            navigate('/surpriz-analiz');
        }
    };
    useEffect(() => {
        console.log('matchData updated:', matchData);
    }, [matchData]);
    return (
    // DO NOT DELETE START - Main App Layout
    _jsxs("div", { className: "min-h-screen bg-gray-100", children: [_jsx(LoadingOverlay, { isLoading: isLoading, progress: progress }), _jsx("header", { className: "bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg", children: _jsx("div", { className: "container mx-auto flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Trophy, { size: 24, className: "text-yellow-400" }), _jsx("h1", { className: "text-2xl font-bold", children: "PATSI'S PREDICTIONS" })] }) }) }), _jsxs("main", { className: "container mx-auto p-4", children: [_jsx(Navigation, { activePage: activePage, onPageChange: handlePageChange, onDataLoad: setMatchData, onTeamDataLoad: setTeamData, onFixturesLoad: setFixtures }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsxs(_Fragment, { children: [_jsx(MatchCount, { count: matchData.length }), fixtures.length > 0 && (_jsx(FixtureList, { fixtures: fixtures, onSelectMatch: handleFixtureSelect, selectedMatch: selectedMatch, teamData: teamData, matchData: matchData }))] }) }), _jsx(Route, { path: "/surpriz-analiz", element: searchResults && selectedMatch && (_jsxs("div", { className: "space-y-6", children: [_jsx(MatchHeader, { match: selectedMatch, teamData: teamData }), _jsx(Statistics, { data: searchResults, selectedMatch: selectedMatch, allMatches: matchData, teamData: teamData }), _jsx(SimilarMatches, { matches: searchResults.matches, selectedMatch: selectedMatch, teamData: teamData })] })) }), _jsx(Route, { path: "/ozel-analiz", element: _jsx(SpecialAnalysis, { matchData: matchData, teamData: teamData, selectedMatch: selectedMatch }) }), _jsx(Route, { path: "/match-schedule", element: _jsx(MatchSchedule, { matchData: matchData, teamData: teamData }) })] })] })] })
    // DO NOT DELETE END - Main App Layout
    );
}
