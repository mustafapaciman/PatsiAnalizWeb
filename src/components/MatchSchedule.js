import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TeamLogo } from './TeamLogo';
import Draggable from 'react-draggable';
import { Switch } from '@headlessui/react';
import { NewAnalysisTab } from './analysis/NewAnalysisTab';
// Lig isimleri için sabit tanımlama
const LEAGUE_NAMES = {
    'E0': 'Premier League',
    'E1': 'Championship',
    'E2': 'League One',
    'E3': 'League Two',
    'EC': 'Conference',
    'SC0': 'Scotland Premier League',
    'SC1': 'Scotland Championship',
    'SC2': 'Scotland League One',
    'SC3': 'Scotland League Two',
    'SP1': 'La Liga',
    'SP2': 'La Liga 2',
    'D1': 'Bundesliga',
    'D2': '2. Bundesliga',
    'I1': 'Serie A',
    'I2': 'Serie B',
    'F1': 'Ligue 1',
    'F2': 'Ligue 2',
    'N1': 'Eredivisie',
    'P1': 'Primeira Liga',
    'T1': 'Süper Lig',
    'B1': 'Belgian Pro League',
    'G1': 'Greek Super League'
};
export default function MatchSchedule({ matchData, teamData }) {
    // State tanımlamaları
    const [selectedLeague, setSelectedLeague] = useState('');
    const [selectedTeam, setSelectedTeam] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [teams, setTeams] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [activeTab, setActiveTab] = useState('chain');
    const [teamChains, setTeamChains] = useState([]);
    const [matchPairs, setMatchPairs] = useState([]);
    const [isLoadingChain, setIsLoadingChain] = useState(false);
    const [isLoadingPairs, setIsLoadingPairs] = useState(false);
    const nodeRef = useRef(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [seasonSurprises, setSeasonSurprises] = useState([]);
    const [isLoadingSeasonSurprises, setIsLoadingSeasonSurprises] = useState(false);
    const [selectedSurpriseMatches, setSelectedSurpriseMatches] = useState(new Set());
    const [selectedOpponents, setSelectedOpponents] = useState([]);
    const [customTripletResults, setCustomTripletResults] = useState([]);
    // Karşılaştırma modu için state'ler
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [isSurpriseMode, setIsSurpriseMode] = useState(false); // Sol panel sürpriz modu
    const [isComparisonSurpriseMode, setIsComparisonSurpriseMode] = useState(false); // Sağ panel sürpriz modu
    const [comparisonSeason, setComparisonSeason] = useState('');
    const [comparisonMatches, setComparisonMatches] = useState([]);
    // Benzerlik analizi için state'ler
    const [selectedSurpriseMatch, setSelectedSurpriseMatch] = useState(null);
    const [selectedHomeTeam, setSelectedHomeTeam] = useState(''); // Yeni state
    const [selectedAwayTeam, setSelectedAwayTeam] = useState(''); // Yeni state
    const [similarMatches, setSimilarMatches] = useState([]);
    const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
    const [expandedMatchDetails, setExpandedMatchDetails] = useState([]);
    const [analysisMode, setAnalysisMode] = useState('surprise'); // Yeni state
    // Köprü modu için state'ler
    const [selectedTeamA, setSelectedTeamA] = useState('');
    const [selectedTeamZ, setSelectedTeamZ] = useState('');
    const [bridgeResults, setBridgeResults] = useState([]);
    const [isLoadingBridge, setIsLoadingBridge] = useState(false);
    const [expandedSeasons, setExpandedSeasons] = useState([]);
    const [expandedPatterns, setExpandedPatterns] = useState([]);
    const [isAutoCalculating, setIsAutoCalculating] = useState(false);
    const [showTeamSelectionModal, setShowTeamSelectionModal] = useState(false);
    const [autoSelectedTeam1, setAutoSelectedTeam1] = useState('');
    const [autoSelectedTeam2, setAutoSelectedTeam2] = useState('');
    const [currentAutoStep, setCurrentAutoStep] = useState(null);
    const [showContinueButton, setShowContinueButton] = useState(false);
    const [scheduleAnalysisResults, setScheduleAnalysisResults] = useState([]);
    const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState(false);
    const [showLowSimilarity, setShowLowSimilarity] = useState(false);
    const [surpriseTeamSimilarity, setSurpriseTeamSimilarity] = useState([]);
    // Yeni state'ler
    const [isWeekMode, setIsWeekMode] = useState(false);
    const [selectedMatchCount, setSelectedMatchCount] = useState(1);
    const [teamMatches, setTeamMatches] = useState({});
    const [maxMatchCount, setMaxMatchCount] = useState(0);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
    const [surpriseAnalysis, setSurpriseAnalysis] = useState({});
    // Son Rakip analizi için state'ler
    const [selectedTeamForLastOpponent1, setSelectedTeamForLastOpponent1] = useState('');
    const [selectedTeamForLastOpponent2, setSelectedTeamForLastOpponent2] = useState('');
    const [lastOpponentResults, setLastOpponentResults] = useState([]);
    const [isAnalyzingLastOpponent, setIsAnalyzingLastOpponent] = useState(false);
    // İki Yarı analizi için state'ler
    const [selectedTeamForTwoHalves1, setSelectedTeamForTwoHalves1] = useState('');
    const [selectedTeamForTwoHalves2, setSelectedTeamForTwoHalves2] = useState('');
    const [isAnalyzingTwoHalves, setIsAnalyzingTwoHalves] = useState(false);
    const [twoHalvesResults, setTwoHalvesResults] = useState([]);
    // Tost Formülü için state'ler
    const [selectedTeamForToast1, setSelectedTeamForToast1] = useState('');
    const [selectedTeamForToast2, setSelectedTeamForToast2] = useState('');
    const [isAnalyzingToast, setIsAnalyzingToast] = useState(false);
    const [toastResults, setToastResults] = useState([]);
    const [currentToastSeason, setCurrentToastSeason] = useState('');
    const [showMoreSeasonsButton, setShowMoreSeasonsButton] = useState(false);
    // Modal stili için dinamik class'lar
    const getModalStyle = () => {
        if (isFullScreen) {
            return "fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gray-800 z-50";
        }
        return "fixed top-[20%] left-[30%] w-[800px] bg-gray-800 rounded-lg shadow-2xl z-50";
    };
    // Sezonları oluştur
    useEffect(() => {
        const createSeasons = () => {
            const seasonList = [];
            const years = Array.from(new Set(matchData.map(match => {
                const date = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                return date.getFullYear();
            }))).sort((a, b) => b - a);
            years.forEach(year => {
                seasonList.push({
                    id: `${year}-${year + 1}`,
                    name: `${year}-${year + 1}`,
                    startDate: new Date(year, 7, 1), // Ağustos ayı başlangıcı
                    endDate: new Date(year + 1, 5, 30) // Haziran ayı sonu
                });
            });
            setSeasons(seasonList);
            if (seasonList.length > 0) {
                setSelectedSeason(seasonList[0].id);
            }
        };
        createSeasons();
    }, [matchData]);
    // Lig seçildiğinde takımları güncelle
    useEffect(() => {
        if (selectedLeague) {
            const leagueTeams = Array.from(new Set(matchData
                .filter(match => match.Div === selectedLeague)
                .flatMap(match => [match.HomeTeam, match.AwayTeam]))).sort();
            setTeams(leagueTeams);
            setSelectedTeam('');
        }
    }, [selectedLeague, matchData]);
    // Seçilen takım ve sezona göre maçları filtrele
    useEffect(() => {
        if (selectedTeam && selectedSeason) {
            const season = seasons.find(s => s.id === selectedSeason);
            if (season) {
                const teamMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
                    const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
                    return isInSeason && isTeamMatch;
                });
                // Tarihe göre sırala (eskiden yeniye)
                const sortedMatches = teamMatches.sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                if (isSurpriseMode) {
                    console.log('Sürpriz Modu Aktif');
                    console.log('Seçili Takım:', selectedTeam);
                    console.log('Seçili Sezon:', selectedSeason);
                    // Sürpriz maçları bul (1/2 ve 2/1)
                    const surpriseMatches = sortedMatches.filter(match => {
                        const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
                        const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
                        return isHomeToAwaySurprise || isAwayToHomeSurprise;
                    });
                    console.log('Bulunan Sürpriz Maç Sayısı:', surpriseMatches.length);
                    console.log('Sürpriz Maçlar:', surpriseMatches);
                    // Her sürpriz maç için önceki 2 maçı bul
                    const matchesToShow = new Set();
                    surpriseMatches.forEach(surpriseMatch => {
                        matchesToShow.add(surpriseMatch);
                        const surpriseMatchIndex = sortedMatches.findIndex(m => m === surpriseMatch);
                        // Önceki 2 maçı ekle
                        for (let i = 1; i <= 2; i++) {
                            if (surpriseMatchIndex - i >= 0) {
                                matchesToShow.add(sortedMatches[surpriseMatchIndex - i]);
                            }
                        }
                    });
                    const finalMatches = Array.from(matchesToShow).sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateA.getTime() - dateB.getTime();
                    });
                    console.log('Gösterilecek Toplam Maç Sayısı:', finalMatches.length);
                    setFilteredMatches(finalMatches);
                }
                else {
                    setFilteredMatches(sortedMatches);
                }
            }
        }
        else {
            setFilteredMatches([]);
        }
    }, [selectedTeam, selectedSeason, matchData, seasons, isSurpriseMode]);
    // Karşılaştırma sezonu için maçları filtrele
    useEffect(() => {
        if (selectedTeam && comparisonSeason && isComparisonMode) {
            const season = seasons.find(s => s.id === comparisonSeason);
            if (season) {
                const teamMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
                    const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
                    return isInSeason && isTeamMatch;
                });
                const sortedMatches = teamMatches.sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                if (isComparisonSurpriseMode) {
                    // Sürpriz maçları bul (1/2 ve 2/1)
                    const surpriseMatches = sortedMatches.filter(match => {
                        const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
                        const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
                        return isHomeToAwaySurprise || isAwayToHomeSurprise;
                    });
                    // Her sürpriz maç için önceki 2 maçı bul
                    const matchesToShow = new Set();
                    surpriseMatches.forEach(surpriseMatch => {
                        matchesToShow.add(surpriseMatch);
                        const surpriseMatchIndex = sortedMatches.findIndex(m => m === surpriseMatch);
                        // Önceki 2 maçı ekle
                        for (let i = 1; i <= 2; i++) {
                            if (surpriseMatchIndex - i >= 0) {
                                matchesToShow.add(sortedMatches[surpriseMatchIndex - i]);
                            }
                        }
                    });
                    const finalMatches = Array.from(matchesToShow).sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateA.getTime() - dateB.getTime();
                    });
                    setComparisonMatches(finalMatches);
                }
                else {
                    setComparisonMatches(sortedMatches);
                }
            }
        }
        else {
            setComparisonMatches([]);
        }
    }, [selectedTeam, comparisonSeason, isComparisonMode, matchData, seasons, isComparisonSurpriseMode]);
    // Karşılaştırma modu değiştiğinde, varsayılan karşılaştırma sezonu seç
    useEffect(() => {
        if (isComparisonMode && selectedSeason && seasons.length > 0) {
            const currentSeasonIndex = seasons.findIndex(s => s.id === selectedSeason);
            if (currentSeasonIndex < seasons.length - 1) {
                setComparisonSeason(seasons[currentSeasonIndex + 1].id);
            }
        }
    }, [isComparisonMode, selectedSeason, seasons]);
    // Excel tarihini normal tarihe çeviren fonksiyon
    const formatDate = (excelDate) => {
        const date = new Date((Number(excelDate) - 25569) * 86400 * 1000);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    // Takım zinciri analizi
    const findTeamChains = () => {
        if (!selectedTeam || !selectedLeague)
            return;
        setIsLoadingChain(true);
        setTeamChains([]); // Önceki sonuçları temizle
        setTimeout(() => {
            try {
                // Tüm maçları filtrele
                const allMatches = matchData.filter(match => match.Div === selectedLeague &&
                    match.FTHG !== undefined &&
                    match.FTAG !== undefined);
                console.log('Toplam maç sayısı:', allMatches.length);
                // Bulunan zincirleri kontrol etmek için Set kullan
                const foundChains = new Set();
                const chains = [];
                // Her sezon için ayrı analiz yap
                seasons.forEach(season => {
                    // Sezon maçlarını filtrele
                    const seasonMatches = allMatches.filter(match => {
                        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                        return matchDate >= season.startDate && matchDate <= season.endDate;
                    }).sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateA.getTime() - dateB.getTime();
                    });
                    // Seçili takımın bu sezondaki sürpriz maçlarını bul
                    const ourSurprises = seasonMatches.filter(match => {
                        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                            (match.HTR === 'A' && match.FTR === 'H');
                        const involvesSelectedTeam = match.HomeTeam === selectedTeam ||
                            match.AwayTeam === selectedTeam;
                        return isSurprise && involvesSelectedTeam;
                    });
                    console.log(`${season.name} sezonu sürpriz maçları:`, ourSurprises.length);
                    // Her sürpriz maç için
                    ourSurprises.forEach(firstMatch => {
                        // Rakip takımı bul (Y takımı)
                        const teamY = firstMatch.HomeTeam === selectedTeam ?
                            firstMatch.AwayTeam :
                            firstMatch.HomeTeam;
                        console.log(`${season.name} sezonunda incelenen Y takımı:`, teamY);
                        // Y takımının aynı sezondaki sürpriz maçlarını bul
                        const teamYSurprises = seasonMatches.filter(match => {
                            const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                                (match.HTR === 'A' && match.FTR === 'H');
                            const involvesTeamY = match.HomeTeam === teamY ||
                                match.AwayTeam === teamY;
                            return match !== firstMatch && isSurprise && involvesTeamY;
                        });
                        // Potansiyel X takımlarını bul (Y takımının rakipleri)
                        const potentialTeamXs = new Set();
                        teamYSurprises.forEach(match => {
                            const opponent = match.HomeTeam === teamY ? match.AwayTeam : match.HomeTeam;
                            if (opponent !== selectedTeam) {
                                potentialTeamXs.add(opponent);
                            }
                        });
                        console.log(`${season.name} sezonunda potansiyel X takımları:`, Array.from(potentialTeamXs));
                        // Her potansiyel X takımı için kontrol et
                        potentialTeamXs.forEach(teamX => {
                            // X takımının seçili takım ile sürpriz maçı var mı?
                            const xWithSelected = seasonMatches.find(match => {
                                const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                                    (match.HTR === 'A' && match.FTR === 'H');
                                return isSurprise &&
                                    ((match.HomeTeam === teamX && match.AwayTeam === selectedTeam) ||
                                        (match.HomeTeam === selectedTeam && match.AwayTeam === teamX));
                            });
                            // X takımının Y takımı ile sürpriz maçı var mı?
                            const xWithY = seasonMatches.find(match => {
                                const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                                    (match.HTR === 'A' && match.FTR === 'H');
                                return isSurprise &&
                                    ((match.HomeTeam === teamX && match.AwayTeam === teamY) ||
                                        (match.HomeTeam === teamY && match.AwayTeam === teamX));
                            });
                            if (xWithSelected && xWithY) {
                                // Zinciri benzersiz bir şekilde tanımla
                                const chainKey = [selectedTeam, teamY, teamX]
                                    .sort()
                                    .join('-') + '-' + season.name;
                                // Eğer bu zincir daha önce bulunmadıysa ekle
                                if (!foundChains.has(chainKey)) {
                                    foundChains.add(chainKey);
                                    // Önceki maçları bul (aynı sezon içinde)
                                    const previousMatches = [
                                        {
                                            team: selectedTeam,
                                            matches: findPreviousMatches(seasonMatches, firstMatch, selectedTeam)
                                        },
                                        {
                                            team: teamY,
                                            matches: findPreviousMatches(seasonMatches, firstMatch, teamY)
                                        },
                                        {
                                            team: teamX,
                                            matches: findPreviousMatches(seasonMatches, xWithSelected, teamX)
                                        }
                                    ];
                                    // Önceki maçlardaki rakipleri bul
                                    const allOpponents = previousMatches.flatMap(pm => pm.matches.map(m => m.HomeTeam === pm.team ? m.AwayTeam : m.HomeTeam));
                                    // Ortak rakipleri bul (en az 2 takımın karşılaştığı)
                                    const opponentCounts = new Map();
                                    allOpponents.forEach(opponent => {
                                        opponentCounts.set(opponent, (opponentCounts.get(opponent) || 0) + 1);
                                    });
                                    const commonOpponents = Array.from(opponentCounts.entries())
                                        .filter(([_, count]) => count >= 2)
                                        .map(([opponent]) => opponent);
                                    chains.push({
                                        teams: [selectedTeam, teamY, teamX],
                                        surpriseMatches: [firstMatch, xWithSelected, xWithY],
                                        previousMatches,
                                        commonOpponents,
                                        season: season.name,
                                        seasonMatches: seasonMatches
                                    });
                                }
                            }
                        });
                    });
                });
                // Zincirleri sezon sırasına göre sırala (en yeniden eskiye)
                const sortedChains = chains.sort((a, b) => {
                    const yearA = parseInt(a.season.split('-')[0]);
                    const yearB = parseInt(b.season.split('-')[0]);
                    return yearB - yearA;
                });
                console.log('Bulunan zincir sayısı:', sortedChains.length);
                setTeamChains(sortedChains);
            }
            catch (error) {
                console.error('Takım zinciri analizi hatası:', error);
            }
            finally {
                setIsLoadingChain(false);
            }
        }, 100);
    };
    // Bir maçtan önceki 3 maçı bul
    const findPreviousMatches = (allMatches, targetMatch, team) => {
        const targetDate = new Date((Number(targetMatch.Date) - 25569) * 86400 * 1000);
        return allMatches
            .filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate < targetDate &&
                (match.HomeTeam === team || match.AwayTeam === team);
        })
            .slice(-3); // Son 3 maç
    };
    // Modal içeriğinde Takım Zinciri görünümü
    const renderTeamChain = () => {
        if (teamChains.length === 0) {
            return (_jsx("div", { className: "text-center text-gray-400 py-8", children: _jsx("button", { onClick: findTeamChains, disabled: isLoadingChain, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2", children: isLoadingChain ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : ('Zincir Analizi Başlat') }) }));
        }
        // Zincirleri sezonlara göre grupla
        const chainsBySeasons = teamChains.reduce((acc, chain) => {
            if (!acc[chain.season]) {
                acc[chain.season] = [];
            }
            acc[chain.season].push(chain);
            return acc;
        }, {});
        return (_jsxs("div", { className: "space-y-8", children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4", children: ["Bulunan S\u00FCrpriz Zincirleri (", teamChains.length, ")"] }), Object.entries(chainsBySeasons).map(([season, chains]) => (_jsxs("div", { className: "space-y-6", children: [_jsxs("h4", { className: "text-md font-medium text-gray-300", children: [season, " Sezonu"] }), chains.map((chain, chainIndex) => (_jsxs("div", { className: "bg-gray-700/30 rounded-lg p-6 space-y-6", children: [_jsx("div", { className: "grid grid-cols-3 gap-4", children: chain.surpriseMatches.map((match, matchIndex) => (_jsxs("div", { className: "bg-gray-800/50 rounded-lg p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between text-sm text-gray-400 mb-2", children: [_jsx("span", { children: formatDate(match.Date) }), _jsxs("span", { className: "text-orange-400 font-medium", children: [matchIndex + 1, ". S\u00FCrpriz"] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: match.HomeTeam, className: "w-6 h-6" }), _jsx("span", { className: `font-medium ${match.FTR === 'H' ? 'text-green-400' : 'text-white'}`, children: match.HomeTeam })] }), _jsxs("div", { className: "flex flex-col items-center text-center border-l-2 border-r-2 border-gray-700 mx-2 py-1", children: [_jsxs("span", { className: "text-white font-bold", children: [match.FTHG, " - ", match.FTAG] }), _jsxs("span", { className: "text-sm text-gray-400", children: ["(\u0130Y: ", match.HTHG, "-", match.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: `font-medium ${match.FTR === 'A' ? 'text-green-400' : 'text-white'}`, children: match.AwayTeam }), _jsx(TeamLogo, { name: match.AwayTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("div", { className: "bg-gray-900/50 rounded-lg p-3", children: [_jsxs("div", { className: "text-sm font-medium text-gray-400 mb-2 flex items-center gap-2", children: [_jsx(TeamLogo, { name: match.HomeTeam, className: "w-4 h-4" }), _jsxs("span", { children: [match.HomeTeam, " Son 3 Ma\u00E7:"] })] }), _jsx("div", { className: "space-y-2", children: findPreviousMatches(chain.seasonMatches, match, match.HomeTeam).map((prevMatch, prevIndex) => {
                                                                            const opponent = prevMatch.HomeTeam === match.HomeTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                                                                            const isCommonOpponent = chain.commonOpponents.includes(opponent);
                                                                            return (_jsxs("div", { className: "grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm", children: [_jsx("span", { className: "text-gray-500", children: formatDate(prevMatch.Date) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: `
                                        ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.HomeTeam !== match.HomeTeam ? 'text-orange-400' : ''}
                                      `, children: prevMatch.HomeTeam }), _jsx(TeamLogo, { name: prevMatch.HomeTeam, className: "w-4 h-4" })] }), _jsxs("div", { className: "text-center font-medium text-gray-400", children: [prevMatch.FTHG, "-", prevMatch.FTAG] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: prevMatch.AwayTeam, className: "w-4 h-4" }), _jsx("span", { className: `
                                        ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.AwayTeam !== match.HomeTeam ? 'text-orange-400' : ''}
                                      `, children: prevMatch.AwayTeam })] })] }, prevIndex));
                                                                        }) })] }), _jsxs("div", { className: "bg-gray-900/50 rounded-lg p-3", children: [_jsxs("div", { className: "text-sm font-medium text-gray-400 mb-2 flex items-center gap-2", children: [_jsx(TeamLogo, { name: match.AwayTeam, className: "w-4 h-4" }), _jsxs("span", { children: [match.AwayTeam, " Son 3 Ma\u00E7:"] })] }), _jsx("div", { className: "space-y-2", children: findPreviousMatches(chain.seasonMatches, match, match.AwayTeam).map((prevMatch, prevIndex) => {
                                                                            const opponent = prevMatch.HomeTeam === match.AwayTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                                                                            const isCommonOpponent = chain.commonOpponents.includes(opponent);
                                                                            return (_jsxs("div", { className: "grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm", children: [_jsx("span", { className: "text-gray-500", children: formatDate(prevMatch.Date) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: `
                                        ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.HomeTeam !== match.AwayTeam ? 'text-orange-400' : ''}
                                      `, children: prevMatch.HomeTeam }), _jsx(TeamLogo, { name: prevMatch.HomeTeam, className: "w-4 h-4" })] }), _jsxs("div", { className: "text-center font-medium text-gray-400", children: [prevMatch.FTHG, "-", prevMatch.FTAG] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: prevMatch.AwayTeam, className: "w-4 h-4" }), _jsx("span", { className: `
                                        ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                        ${isCommonOpponent && prevMatch.AwayTeam !== match.AwayTeam ? 'text-orange-400' : ''}
                                      `, children: prevMatch.AwayTeam })] })] }, prevIndex));
                                                                        }) })] })] })] })] }, matchIndex))) }), chain.commonOpponents.length > 0 && (_jsxs("div", { className: "mt-6 bg-gray-800/50 rounded-lg p-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-300 mb-3", children: "Ortak Rakipler:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: chain.commonOpponents.map((opponent, index) => (_jsxs("div", { className: "flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2", children: [_jsx(TeamLogo, { name: opponent, className: "w-5 h-5" }), _jsx("span", { className: "text-gray-300", children: opponent })] }, index))) })] }))] }, chainIndex)))] }, season)))] }));
    };
    // Maç sırası analizi
    const findMatchPairs = () => {
        if (!selectedLeague || !selectedTeam)
            return;
        setIsLoadingPairs(true);
        setTimeout(() => {
            try {
                const pairs = [];
                const processedPairs = new Set();
                // Performans için maçları önceden filtrele
                const leagueMatches = matchData.filter(match => match.Div === selectedLeague &&
                    match.FTHG !== undefined &&
                    match.FTAG !== undefined &&
                    (match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam));
                // Seçili takımın rakiplerini bul
                const opponents = Array.from(new Set(leagueMatches
                    .map(m => m.HomeTeam === selectedTeam ? m.AwayTeam : m.HomeTeam))).sort();
                // Her sezon için kontrol et
                seasons.forEach(season => {
                    // Sezon maçlarını filtrele
                    const seasonMatches = leagueMatches.filter(match => {
                        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                        return matchDate >= season.startDate && matchDate <= season.endDate;
                    });
                    // Her rakip için kontrol et
                    opponents.forEach(opponent => {
                        // Bu rakiple olan maçları bul
                        const matches = seasonMatches.filter(m => (m.HomeTeam === selectedTeam && m.AwayTeam === opponent) ||
                            (m.HomeTeam === opponent && m.AwayTeam === selectedTeam)).sort((a, b) => {
                            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                            return dateA.getTime() - dateB.getTime();
                        });
                        if (matches.length !== 2)
                            return;
                        // Sürpriz kontrolü
                        const [firstMatch, secondMatch] = matches;
                        const firstHasSurprise = (firstMatch.HTR === 'H' && firstMatch.FTR === 'A') ||
                            (firstMatch.HTR === 'A' && firstMatch.FTR === 'H');
                        const secondHasSurprise = (secondMatch.HTR === 'H' && secondMatch.FTR === 'A') ||
                            (secondMatch.HTR === 'A' && secondMatch.FTR === 'H');
                        // En az bir maçta sürpriz varsa ekle
                        if (firstHasSurprise || secondHasSurprise) {
                            const pairKey = `${selectedTeam}-${opponent}-${season.id}`;
                            if (!processedPairs.has(pairKey)) {
                                pairs.push({
                                    firstMatch,
                                    secondMatch,
                                    team1: selectedTeam,
                                    team2: opponent,
                                    season: season.name
                                });
                                processedPairs.add(pairKey);
                            }
                        }
                    });
                });
                // Sonuçları sezon sırasına göre ters çevir
                setMatchPairs(pairs.sort((a, b) => {
                    const yearA = parseInt(a.season.split('-')[0]);
                    const yearB = parseInt(b.season.split('-')[0]);
                    return yearB - yearA;
                }));
            }
            catch (error) {
                console.error('Maç sırası analizi hatası:', error);
            }
            finally {
                setIsLoadingPairs(false);
            }
        }, 100);
    };
    // Modal içeriğinde Maç Sırası görünümü
    const renderMatchSequence = () => {
        if (!selectedTeam) {
            return (_jsx("div", { className: "text-center text-gray-400 py-8", children: "L\u00FCtfen bir tak\u0131m se\u00E7in" }));
        }
        if (matchPairs.length === 0) {
            return (_jsx("div", { className: "text-center text-gray-400 py-8", children: _jsx("button", { onClick: findMatchPairs, disabled: isLoadingPairs, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2", children: isLoadingPairs ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : ('Maç Sırası Analizi Başlat') }) }));
        }
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4", children: ["Bulunan Ma\u00E7 \u00C7iftleri (", matchPairs.length, ")"] }), _jsx("div", { className: "grid grid-cols-1 gap-4", children: matchPairs.map((pair, index) => (_jsxs("div", { className: "bg-gray-700/30 rounded-lg p-4", children: [_jsx("div", { className: "text-sm text-gray-400 mb-4 font-medium", children: pair.season }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-gray-800/50 rounded-lg p-3", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-300 text-sm", children: formatDate(pair.firstMatch.Date) }), _jsx("div", { className: "flex-1 mx-8", children: _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-[200px] justify-end", children: [_jsx("span", { className: `font-medium ${pair.firstMatch.FTR === 'H' ? 'text-green-400' : 'text-white'}`, children: pair.firstMatch.HomeTeam }), _jsx(TeamLogo, { name: pair.firstMatch.HomeTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "flex flex-col items-center min-w-[100px]", children: [_jsxs("span", { className: "text-white font-bold", children: [pair.firstMatch.FTHG, " - ", pair.firstMatch.FTAG] }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(\u0130Y: ", pair.firstMatch.HTHG, "-", pair.firstMatch.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2 min-w-[200px]", children: [_jsx(TeamLogo, { name: pair.firstMatch.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: `font-medium ${pair.firstMatch.FTR === 'A' ? 'text-green-400' : 'text-white'}`, children: pair.firstMatch.AwayTeam })] })] }) })] }) }), _jsx("div", { className: "bg-gray-800/50 rounded-lg p-3", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-300 text-sm", children: formatDate(pair.secondMatch.Date) }), _jsx("div", { className: "flex-1 mx-8", children: _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-[200px] justify-end", children: [_jsx("span", { className: `font-medium ${pair.secondMatch.FTR === 'H' ? 'text-green-400' : 'text-white'}`, children: pair.secondMatch.HomeTeam }), _jsx(TeamLogo, { name: pair.secondMatch.HomeTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "flex flex-col items-center min-w-[100px]", children: [_jsxs("span", { className: "text-white font-bold", children: [pair.secondMatch.FTHG, " - ", pair.secondMatch.FTAG] }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(\u0130Y: ", pair.secondMatch.HTHG, "-", pair.secondMatch.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2 min-w-[200px]", children: [_jsx(TeamLogo, { name: pair.secondMatch.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: `font-medium ${pair.secondMatch.FTR === 'A' ? 'text-green-400' : 'text-white'}`, children: pair.secondMatch.AwayTeam })] })] }) })] }) })] })] }, index))) })] }));
    };
    // Sezondaki sürprizleri bulan fonksiyon
    const findSeasonSurprises = () => {
        if (!selectedLeague)
            return;
        setIsLoadingSeasonSurprises(true);
        setSeasonSurprises([]);
        setTimeout(() => {
            try {
                // Seçili sezon için maçları filtrele
                const season = seasons.find(s => s.id === selectedSeason);
                if (!season)
                    return;
                const seasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return match.Div === selectedLeague &&
                        match.FTHG !== undefined &&
                        match.FTAG !== undefined &&
                        matchDate >= season.startDate &&
                        matchDate <= season.endDate;
                }).sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                // Sürpriz maçları bul
                const surprises = seasonMatches.filter(match => (match.HTR === 'H' && match.FTR === 'A') ||
                    (match.HTR === 'A' && match.FTR === 'H')).map(match => {
                    // Her sürpriz maç için önceki maçları bul
                    const homeTeamPrevMatches = findPreviousMatches(seasonMatches, match, match.HomeTeam);
                    const awayTeamPrevMatches = findPreviousMatches(seasonMatches, match, match.AwayTeam);
                    // Ortak rakipleri bul
                    const homeOpponents = homeTeamPrevMatches.map(m => m.HomeTeam === match.HomeTeam ? m.AwayTeam : m.HomeTeam);
                    const awayOpponents = awayTeamPrevMatches.map(m => m.HomeTeam === match.AwayTeam ? m.AwayTeam : m.HomeTeam);
                    const commonOpponents = homeOpponents.filter(team => awayOpponents.includes(team));
                    return {
                        match,
                        previousMatches: [...homeTeamPrevMatches, ...awayTeamPrevMatches],
                        commonOpponents
                    };
                });
                setSeasonSurprises(surprises);
            }
            catch (error) {
                console.error('Sezon sürprizleri analizi hatası:', error);
            }
            finally {
                setIsLoadingSeasonSurprises(false);
            }
        }, 100);
    };
    // Rakip üçlülerini bulan ve kontrol eden fonksiyon
    const findRepeatingOpponentTriplets = (surprises) => {
        // Her sürpriz maç için rakip üçlülerini bul
        const triplets = surprises.map(surprise => {
            const homeOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.HomeTeam)
                .map(m => m.HomeTeam === surprise.match.HomeTeam ? m.AwayTeam : m.HomeTeam);
            const awayOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.AwayTeam)
                .map(m => m.HomeTeam === surprise.match.AwayTeam ? m.AwayTeam : m.HomeTeam);
            return {
                homeTeam: surprise.match.HomeTeam,
                awayTeam: surprise.match.AwayTeam,
                homeTriplet: homeOpponents.sort(),
                awayTriplet: awayOpponents.sort()
            };
        });
        // Tekrar eden üçlüleri bul
        const tripletCounts = new Map();
        triplets.forEach(({ homeTriplet, awayTriplet }) => {
            const homeTripletKey = homeTriplet.join('-');
            const awayTripletKey = awayTriplet.join('-');
            if (homeTriplet.length === 3) {
                if (!tripletCounts.has(homeTripletKey)) {
                    tripletCounts.set(homeTripletKey, { count: 1, triplet: homeTriplet });
                }
                else {
                    const current = tripletCounts.get(homeTripletKey);
                    tripletCounts.set(homeTripletKey, { count: current.count + 1, triplet: current.triplet });
                }
            }
            if (awayTriplet.length === 3) {
                if (!tripletCounts.has(awayTripletKey)) {
                    tripletCounts.set(awayTripletKey, { count: 1, triplet: awayTriplet });
                }
                else {
                    const current = tripletCounts.get(awayTripletKey);
                    tripletCounts.set(awayTripletKey, { count: current.count + 1, triplet: current.triplet });
                }
            }
        });
        // 2 veya daha fazla kez tekrar eden üçlüleri döndür
        return Array.from(tripletCounts.values())
            .filter(({ count }) => count >= 2)
            .map(({ triplet }) => triplet);
    };
    // Sezondaki Sürprizler görünümü
    const renderSeasonSurprises = () => {
        if (seasonSurprises.length === 0) {
            return (_jsx("div", { className: "text-center text-gray-400 py-8", children: _jsx("button", { onClick: findSeasonSurprises, disabled: isLoadingSeasonSurprises, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2", children: isLoadingSeasonSurprises ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : ('Sürprizleri Göster') }) }));
        }
        const repeatingTriplets = findRepeatingOpponentTriplets(seasonSurprises);
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("h3", { className: "text-lg font-semibold text-white", children: [selectedSeason, " Sezonu S\u00FCrprizleri ", seasonSurprises.length > 0 ? `(${seasonSurprises.length})` : ''] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("select", { value: selectedSeason, onChange: (e) => {
                                        setSelectedSeason(e.target.value);
                                        setSelectedSurpriseMatches(new Set());
                                        setSeasonSurprises([]); // Listeyi temizle
                                    }, className: "bg-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: seasons.map(season => (_jsx("option", { value: season.id, children: season.name }, season.id))) }), _jsx("button", { onClick: findSeasonSurprises, disabled: isLoadingSeasonSurprises, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2", children: isLoadingSeasonSurprises ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] })) : ('Göster') })] })] }), _jsx("div", { className: "grid grid-cols-2 gap-4", children: seasonSurprises.map((surprise, index) => (_jsxs("div", { onClick: () => {
                            const newSelected = new Set(selectedSurpriseMatches);
                            const matchKey = surprise.match.Date.toString();
                            if (newSelected.has(matchKey)) {
                                newSelected.delete(matchKey);
                            }
                            else {
                                newSelected.add(matchKey);
                            }
                            setSelectedSurpriseMatches(newSelected);
                        }, className: `
                bg-gray-800/50 rounded-lg p-4 cursor-pointer transition-all duration-200
                hover:bg-gray-700/50
                ${selectedSurpriseMatches.has(surprise.match.Date.toString()) ? 'ring-2 ring-blue-500' : ''}
              `, children: [_jsx("div", { className: "flex justify-between items-center mb-3", children: _jsx("span", { className: "text-gray-400 text-sm", children: formatDate(surprise.match.Date) }) }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-[180px] justify-end", children: [_jsx("span", { className: `font-medium ${surprise.match.FTR === 'H' ? 'text-green-400' : 'text-white'}`, children: surprise.match.HomeTeam }), _jsx(TeamLogo, { name: surprise.match.HomeTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "flex flex-col items-center min-w-[100px]", children: [_jsxs("span", { className: "text-white font-bold", children: [surprise.match.FTHG, " - ", surprise.match.FTAG] }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(\u0130Y: ", surprise.match.HTHG, "-", surprise.match.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2 min-w-[180px]", children: [_jsx(TeamLogo, { name: surprise.match.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: `font-medium ${surprise.match.FTR === 'A' ? 'text-green-400' : 'text-white'}`, children: surprise.match.AwayTeam })] })] }), surprise.commonOpponents.length > 0 && (_jsx("div", { className: "mt-3 pt-3 border-t border-gray-700", children: _jsx("div", { className: "flex flex-wrap gap-2", children: surprise.commonOpponents.map((opponent, idx) => (_jsx("span", { className: "text-orange-400 text-sm", children: opponent }, idx))) }) })), selectedSurpriseMatches.has(surprise.match.Date.toString()) && (_jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("div", { className: "bg-gray-900/50 rounded-lg p-3", children: [_jsxs("div", { className: "text-sm font-medium text-gray-400 mb-2 flex items-center gap-2", children: [_jsx(TeamLogo, { name: surprise.match.HomeTeam, className: "w-4 h-4" }), _jsxs("span", { children: [surprise.match.HomeTeam, " Son 3 Ma\u00E7:"] })] }), _jsx("div", { className: "space-y-2", children: findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.HomeTeam).map((prevMatch, prevIndex) => {
                                                    const opponent = prevMatch.HomeTeam === surprise.match.HomeTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                                                    const isRepeatingOpponent = repeatingTriplets.some(triplet => triplet.includes(opponent));
                                                    return (_jsxs("div", { className: "grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm", children: [_jsx("span", { className: "text-gray-500", children: formatDate(prevMatch.Date) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: `
                                ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.HomeTeam === opponent ? 'text-orange-400' : ''}
                              `, children: prevMatch.HomeTeam }), _jsx(TeamLogo, { name: prevMatch.HomeTeam, className: "w-4 h-4" })] }), _jsxs("div", { className: "text-center font-medium text-gray-400", children: [prevMatch.FTHG, "-", prevMatch.FTAG] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: prevMatch.AwayTeam, className: "w-4 h-4" }), _jsx("span", { className: `
                                ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.AwayTeam === opponent ? 'text-orange-400' : ''}
                              `, children: prevMatch.AwayTeam })] })] }, prevIndex));
                                                }) })] }), _jsxs("div", { className: "bg-gray-900/50 rounded-lg p-3", children: [_jsxs("div", { className: "text-sm font-medium text-gray-400 mb-2 flex items-center gap-2", children: [_jsx(TeamLogo, { name: surprise.match.AwayTeam, className: "w-4 h-4" }), _jsxs("span", { children: [surprise.match.AwayTeam, " Son 3 Ma\u00E7:"] })] }), _jsx("div", { className: "space-y-2", children: findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.AwayTeam).map((prevMatch, prevIndex) => {
                                                    const opponent = prevMatch.HomeTeam === surprise.match.AwayTeam ? prevMatch.AwayTeam : prevMatch.HomeTeam;
                                                    const isRepeatingOpponent = repeatingTriplets.some(triplet => triplet.includes(opponent));
                                                    return (_jsxs("div", { className: "grid grid-cols-[100px_1fr_80px_1fr] items-center gap-2 text-sm", children: [_jsx("span", { className: "text-gray-500", children: formatDate(prevMatch.Date) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: `
                                ${prevMatch.FTR === 'H' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.HomeTeam === opponent ? 'text-orange-400' : ''}
                              `, children: prevMatch.HomeTeam }), _jsx(TeamLogo, { name: prevMatch.HomeTeam, className: "w-4 h-4" })] }), _jsxs("div", { className: "text-center font-medium text-gray-400", children: [prevMatch.FTHG, "-", prevMatch.FTAG] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: prevMatch.AwayTeam, className: "w-4 h-4" }), _jsx("span", { className: `
                                ${prevMatch.FTR === 'A' ? 'text-green-400' : 'text-gray-300'}
                                ${isRepeatingOpponent && prevMatch.AwayTeam === opponent ? 'text-orange-400' : ''}
                              `, children: prevMatch.AwayTeam })] })] }, prevIndex));
                                                }) })] })] }))] }, index))) }), repeatingTriplets.length > 0 && (_jsxs("div", { className: "bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-yellow-500", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), _jsx("span", { className: "font-medium", children: "Tekrar Eden Rakip \u00DC\u00E7l\u00FCleri:" })] }), _jsx("div", { className: "space-y-1", children: repeatingTriplets.map((triplet, index) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-300", children: [_jsx("span", { className: "text-yellow-500", children: "\u2022" }), triplet.map((team, teamIndex) => (_jsxs(React.Fragment, { children: [_jsx(TeamLogo, { name: team, className: "w-4 h-4" }), _jsx("span", { children: team }), teamIndex < 2 && _jsx("span", { className: "text-gray-500", children: "+" })] }, teamIndex)))] }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            // Bu üçlüyü içeren maçları bul
                                            const matchesWithTriplet = seasonSurprises.filter(surprise => {
                                                const homeOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.HomeTeam)
                                                    .map(m => m.HomeTeam === surprise.match.HomeTeam ? m.AwayTeam : m.HomeTeam);
                                                const awayOpponents = findPreviousMatches(surprise.previousMatches, surprise.match, surprise.match.AwayTeam)
                                                    .map(m => m.HomeTeam === surprise.match.AwayTeam ? m.AwayTeam : m.HomeTeam);
                                                // Üçlünün tamamı ev sahibi veya deplasman takımının son 3 maçında var mı?
                                                const homeHasAll = triplet.every(team => homeOpponents.includes(team));
                                                const awayHasAll = triplet.every(team => awayOpponents.includes(team));
                                                return homeHasAll || awayHasAll;
                                            });
                                            // İlgili maçları seç
                                            const newSelected = new Set(selectedSurpriseMatches);
                                            matchesWithTriplet.forEach(match => {
                                                newSelected.add(match.match.Date.toString());
                                            });
                                            setSelectedSurpriseMatches(newSelected);
                                        }, className: "px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded", children: "G\u00F6ster" })] }, index))) })] }))] }));
    };
    // Kendi Üçlün analizi
    const findTeamsWithCustomTriplet = () => {
        console.log('findTeamsWithCustomTriplet başladı');
        console.log('selectedLeague:', selectedLeague);
        console.log('selectedOpponents:', selectedOpponents);
        if (!selectedLeague || selectedOpponents.length < 2) {
            console.log('Gerekli seçimler eksik. Fonksiyon sonlandı.');
            return;
        }
        const results = [];
        // Her sezon için kontrol et
        seasons.forEach(season => {
            console.log(`${season.name} sezonu analiz ediliyor...`);
            // Sezon maçlarını filtrele
            const seasonMatches = matchData.filter(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                return match.Div === selectedLeague &&
                    matchDate >= season.startDate &&
                    matchDate <= season.endDate;
            });
            console.log(`${season.name} sezonu için ${seasonMatches.length} maç bulundu`);
            // Her takım için kontrol et
            const teams = Array.from(new Set(seasonMatches.map(m => [m.HomeTeam, m.AwayTeam]).flat()));
            console.log(`${teams.length} takım analiz edilecek`);
            teams.forEach(team => {
                // Takımın sürpriz maçlarını bul
                const surpriseMatches = seasonMatches.filter(match => {
                    const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                        (match.HTR === 'A' && match.FTR === 'H');
                    const involvesTeam = match.HomeTeam === team || match.AwayTeam === team;
                    return isSurprise && involvesTeam;
                });
                console.log(`${team} takımı için ${surpriseMatches.length} sürpriz maç bulundu`);
                // Her sürpriz maç için son 3 maçı kontrol et
                surpriseMatches.forEach(match => {
                    const previousMatches = findPreviousMatches(seasonMatches, match, match.HomeTeam === team ? match.HomeTeam : match.AwayTeam);
                    console.log(`Sürpriz maç için ${previousMatches.length} önceki maç bulundu`);
                    // Son 3 maçtaki rakipleri bul
                    const lastOpponents = previousMatches.map(m => m.HomeTeam === team ? m.AwayTeam : m.HomeTeam);
                    console.log('Son rakipler:', lastOpponents);
                    // Seçilen rakiplerden kaçı son 3 maçta var
                    const matchingOpponents = selectedOpponents.filter(opponent => lastOpponents.includes(opponent));
                    console.log('Eşleşen rakipler:', matchingOpponents);
                    // En az 2 rakip eşleşiyorsa ekle
                    if (matchingOpponents.length >= 2) {
                        console.log('Eşleşme bulundu! Sonuçlara ekleniyor...');
                        results.push({
                            season: season.name,
                            team: team,
                            opponent: match.HomeTeam === team ? match.AwayTeam : match.HomeTeam,
                            match: match,
                            matchingOpponents
                        });
                    }
                });
            });
        });
        console.log('Analiz tamamlandı. Bulunan sonuçlar:', results);
        setCustomTripletResults(results);
    };
    // Kendi Üçlün görünümü
    const renderCustomTriplet = () => {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Rakip Se\u00E7imi (3 tak\u0131m se\u00E7in)" }), _jsxs("select", { value: "", onChange: (e) => {
                                        if (selectedOpponents.length < 3 && !selectedOpponents.includes(e.target.value)) {
                                            setSelectedOpponents([...selectedOpponents, e.target.value]);
                                        }
                                    }, className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Rakip Se\u00E7in" }), teams && teams.length > 0 && teams.filter(team => !selectedOpponents.includes(team)).map(team => (_jsx("option", { value: team, children: team }, team)))] })] }), _jsx("button", { onClick: findTeamsWithCustomTriplet, "data-auto-custom": true, disabled: selectedOpponents.length !== 3, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50", children: "Analiz Et" })] }), selectedOpponents.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2", children: selectedOpponents.map((opponent, index) => (_jsxs("div", { className: "flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2", children: [_jsx(TeamLogo, { name: opponent, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: opponent }), _jsx("button", { onClick: () => {
                                    setSelectedOpponents(selectedOpponents.filter(t => t !== opponent));
                                    setCustomTripletResults([]);
                                }, className: "text-gray-400 hover:text-white ml-2", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }, index))) })), customTripletResults.length > 0 ? (_jsxs("div", { className: "mt-6", children: [_jsxs("h3", { className: "text-lg font-semibold text-white mb-4", children: ["Bulunan Sonu\u00E7lar (", customTripletResults.length, ")"] }), _jsx("div", { className: "bg-gray-800 rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gradient-to-r from-blue-900 to-purple-900", children: [_jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-300", children: "Sezon" }), _jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-300", children: "Tak\u0131m" }), _jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-300", children: "Rakip" }), _jsx("th", { className: "px-4 py-3 text-left text-sm font-medium text-gray-300", children: "E\u015Fle\u015Fen Rakipler" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: customTripletResults.map((result, index) => (_jsxs("tr", { className: "hover:bg-gray-700/50", children: [_jsx("td", { className: "px-4 py-3 text-gray-300", children: result.season }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.team, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: result.team })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.opponent, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: result.opponent })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("div", { className: "flex items-center gap-2", children: result.matchingOpponents.map((opponent, i) => (_jsxs("span", { className: `text-sm ${result.matchingOpponents.length === 2 ? 'text-orange-400' : 'text-white'}`, children: [opponent, i < result.matchingOpponents.length - 1 ? ', ' : ''] }, i))) }) })] }, index))) })] }) })] })) : selectedOpponents.length >= 2 && (_jsx("div", { className: "mt-6 text-center text-gray-400 py-8", children: "Se\u00E7ilen rakiplerle e\u015Fle\u015Fen sonu\u00E7 bulunamad\u0131" }))] }));
    };
    // Benzerlik analizi fonksiyonu
    const analyzeSimilarity = (match1, match2, season1Matches, season2Matches) => {
        // Son 3 maçı bul
        const team1 = match1.HomeTeam;
        const team2 = match2.HomeTeam;
        const team1Last3 = findPreviousMatches(season1Matches, match1, team1).slice(0, 3);
        const team1AwayLast3 = findPreviousMatches(season1Matches, match1, match1.AwayTeam).slice(0, 3);
        const team2Last3 = findPreviousMatches(season2Matches, match2, team2).slice(0, 3);
        const team2AwayLast3 = findPreviousMatches(season2Matches, match2, match2.AwayTeam).slice(0, 3);
        // Skorları al
        const getScores = (matches) => {
            return matches.map(m => `${m.FTHG}-${m.FTAG}`);
        };
        const team1Scores = getScores(team1Last3);
        const team1AwayScores = getScores(team1AwayLast3);
        const team2Scores = getScores(team2Last3);
        const team2AwayScores = getScores(team2AwayLast3);
        // Tam eşleşme kontrolü (son 3 maç)
        const isExactMatch = (scores1, scores2) => {
            if (scores1.length < 3 || scores2.length < 3)
                return false;
            return scores1.every((score, index) => score === scores2[index]);
        };
        // Son maç eşleşme kontrolü
        const isLastMatchEqual = (scores1, scores2) => {
            if (scores1.length === 0 || scores2.length === 0)
                return false;
            return scores1[0] === scores2[0];
        };
        // Genel benzerlik kontrolü
        const calculateScoreSimilarity = (scores1, scores2) => {
            let matchingScores = 0;
            const minLength = Math.min(scores1.length, scores2.length);
            for (let i = 0; i < minLength; i++) {
                if (scores1[i] === scores2[i])
                    matchingScores++;
            }
            return (matchingScores / minLength) * 100;
        };
        // Tüm kombinasyonları kontrol et
        const combinations = [
            { scores1: team1Scores, scores2: team2Scores },
            { scores1: team1Scores, scores2: team2AwayScores },
            { scores1: team1AwayScores, scores2: team2Scores },
            { scores1: team1AwayScores, scores2: team2AwayScores }
        ];
        // En iyi eşleşmeyi bul
        let bestMatch = {
            similarity: 0,
            matchType: 'none',
            details: []
        };
        for (const { scores1, scores2 } of combinations) {
            if (isExactMatch(scores1, scores2)) {
                bestMatch = {
                    similarity: 100,
                    matchType: 'exact',
                    details: ['Son 3 maçın skorları birebir aynı']
                };
                break;
            }
            else if (isLastMatchEqual(scores1, scores2)) {
                bestMatch = {
                    similarity: 80,
                    matchType: 'lastMatch',
                    details: ['Son maçın skoru aynı']
                };
            }
            else {
                const similarity = calculateScoreSimilarity(scores1, scores2);
                if (similarity >= 60 && similarity > bestMatch.similarity) {
                    bestMatch = {
                        similarity,
                        matchType: 'partial',
                        details: [`Skorlarda ${similarity.toFixed(1)}% benzerlik`]
                    };
                }
            }
        }
        return bestMatch;
    };
    const renderSimilarMatches = () => {
        const highSimilarityMatches = similarMatches.filter(m => m.similarity === 100);
        const mediumSimilarityMatches = similarMatches.filter(m => m.similarity === 80);
        const lowSimilarityMatches = similarMatches.filter(m => m.similarity >= 60 && m.similarity < 80);
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-lg font-semibold text-white", children: ["Benzer Ma\u00E7lar ", similarMatches.length > 0 ? `(${similarMatches.length})` : ''] }), _jsx("button", { onClick: findSimilarMatches, disabled: isLoadingSimilar, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2", children: isLoadingSimilar ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : ('Benzer Maçları Bul') })] }), similarMatches.length > 0 ? (_jsxs("div", { className: "space-y-4", children: [highSimilarityMatches.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-green-400 font-medium", children: "%100 Benzerlik" }), highSimilarityMatches.map((result, index) => (_jsxs("div", { className: "bg-gray-800 border-l-4 border-green-500 rounded p-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-white", children: [result.match.HomeTeam, " vs ", result.match.AwayTeam] }), _jsxs("div", { className: "text-gray-400 text-sm", children: [LEAGUE_NAMES[result.match.Div], " (", new Date((Number(result.match.Date) - 25569) * 86400 * 1000).toLocaleDateString(), ")"] })] }), _jsxs("div", { className: "text-green-400 font-medium", children: [result.match.FTHG, "-", result.match.FTAG] })] }), _jsx("div", { className: "mt-2 text-sm text-green-400", children: result.commonPatterns.join(' • ') })] }, index)))] })), mediumSimilarityMatches.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-orange-400 font-medium", children: "%80 Benzerlik" }), mediumSimilarityMatches.map((result, index) => (_jsxs("div", { className: "bg-gray-800 border-l-4 border-orange-500 rounded p-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-white", children: [result.match.HomeTeam, " vs ", result.match.AwayTeam] }), _jsxs("div", { className: "text-gray-400 text-sm", children: [LEAGUE_NAMES[result.match.Div], " (", new Date((Number(result.match.Date) - 25569) * 86400 * 1000).toLocaleDateString(), ")"] })] }), _jsxs("div", { className: "text-orange-400 font-medium", children: [result.match.FTHG, "-", result.match.FTAG] })] }), _jsx("div", { className: "mt-2 text-sm text-orange-400", children: result.commonPatterns.join(' • ') })] }, index)))] })), lowSimilarityMatches.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-yellow-400 font-medium", children: "%60-%79 Benzerlik" }), lowSimilarityMatches.map((result, index) => (_jsxs("div", { className: "bg-gray-800 border-l-4 border-yellow-500 rounded p-4", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-white", children: [result.match.HomeTeam, " vs ", result.match.AwayTeam] }), _jsxs("div", { className: "text-gray-400 text-sm", children: [LEAGUE_NAMES[result.match.Div], " (", new Date((Number(result.match.Date) - 25569) * 86400 * 1000).toLocaleDateString(), ")"] })] }), _jsxs("div", { className: "text-yellow-400 font-medium", children: [result.match.FTHG, "-", result.match.FTAG] })] }), _jsx("div", { className: "mt-2 text-sm text-yellow-400", children: result.commonPatterns.join(' • ') })] }, index)))] }))] })) : !isLoadingSimilar ? (_jsx("p", { className: "text-gray-400", children: "Benzer ma\u00E7 bulunamad\u0131." })) : null] }));
    };
    // Sürpriz maç seçimi için click handler'ı güncelle
    const handleSurpriseMatchSelection = (match) => {
        console.log('Sürpriz maç seçildi:', match);
        setSelectedSurpriseMatch(match);
        setSimilarMatches([]); // Önceki sonuçları temizle
    };
    // Benzerlik analizi fonksiyonu
    const findSimilarMatches = () => {
        console.log('Analiz başlıyor, seçili maç:', selectedSurpriseMatch);
        if (!selectedSurpriseMatch) {
            console.error('Seçili sürpriz maç bulunamadı');
            return;
        }
        setIsLoadingSimilar(true);
        setSimilarMatches([]); // Önceki sonuçları temizle
        setTimeout(() => {
            try {
                const similarResults = [];
                // Seçili maçın sezonunu bul
                const selectedMatchDate = new Date((Number(selectedSurpriseMatch.Date) - 25569) * 86400 * 1000);
                const selectedSeason = seasons.find(s => selectedMatchDate >= s.startDate && selectedMatchDate <= s.endDate);
                if (!selectedSeason) {
                    console.error('Seçili maçın sezonu bulunamadı');
                    return;
                }
                // Debug için sezon bilgilerini yazdır
                console.log('Seçili sezon:', {
                    id: selectedSeason.id,
                    startDate: selectedSeason.startDate,
                    endDate: selectedSeason.endDate
                });
                // Seçili maçın sezon maçlarını bul
                const selectedSeasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= selectedSeason.startDate &&
                        matchDate <= selectedSeason.endDate &&
                        match.Div === selectedSurpriseMatch.Div;
                }).sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                console.log('Analiz başlıyor:', {
                    selectedMatch: selectedSurpriseMatch,
                    selectedSeason,
                    selectedSeasonMatches: selectedSeasonMatches.length
                });
                // Tüm ligler ve sezonlar üzerinde döngü
                let processedMatches = 0;
                Object.keys(LEAGUE_NAMES).forEach(leagueId => {
                    const leagueMatches = matchData.filter(m => m.Div === leagueId);
                    seasons.forEach(season => {
                        const seasonMatches = leagueMatches.filter(match => {
                            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                            return matchDate >= season.startDate && matchDate <= season.endDate;
                        }).sort((a, b) => {
                            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                            return dateA.getTime() - dateB.getTime();
                        });
                        // Sürpriz maçları bul
                        const surprises = seasonMatches.filter(match => (match.HTR === 'H' && match.FTR === 'A') ||
                            (match.HTR === 'A' && match.FTR === 'H'));
                        // Her sürpriz maç için benzerlik analizi yap
                        surprises.forEach(match => {
                            processedMatches++;
                            // Kendisi ile karşılaştırma yapma
                            if (match === selectedSurpriseMatch)
                                return;
                            const similarity = analyzeSimilarity(selectedSurpriseMatch, match, selectedSeasonMatches, seasonMatches);
                            if (similarity.similarity >= 60) {
                                // Hangi takımın skorları eşleşti onu bul
                                const getScorePattern = (matches, team) => {
                                    return matches.map(m => {
                                        if (m.HomeTeam === team) {
                                            return `${m.FTHG}-${m.FTAG}`;
                                        }
                                        else {
                                            return `${m.FTAG}-${m.FTHG}`;
                                        }
                                    });
                                };
                                const team1HomeLast3 = findPreviousMatches(selectedSeasonMatches, selectedSurpriseMatch, selectedSurpriseMatch.HomeTeam);
                                const team1AwayLast3 = findPreviousMatches(selectedSeasonMatches, selectedSurpriseMatch, selectedSurpriseMatch.AwayTeam);
                                const team2HomeLast3 = findPreviousMatches(seasonMatches, match, match.HomeTeam);
                                const team2AwayLast3 = findPreviousMatches(seasonMatches, match, match.AwayTeam);
                                const team1HomeScores = getScorePattern(team1HomeLast3, selectedSurpriseMatch.HomeTeam);
                                const team1AwayScores = getScorePattern(team1AwayLast3, selectedSurpriseMatch.AwayTeam);
                                const team2HomeScores = getScorePattern(team2HomeLast3, match.HomeTeam);
                                const team2AwayScores = getScorePattern(team2AwayLast3, match.AwayTeam);
                                let matchingTeam = '';
                                let matchingScores = [];
                                if (JSON.stringify(team1HomeScores) === JSON.stringify(team2HomeScores)) {
                                    matchingTeam = `${selectedSurpriseMatch.HomeTeam} ve ${match.HomeTeam}`;
                                    matchingScores = team1HomeScores;
                                }
                                else if (JSON.stringify(team1HomeScores) === JSON.stringify(team2AwayScores)) {
                                    matchingTeam = `${selectedSurpriseMatch.HomeTeam} ve ${match.AwayTeam}`;
                                    matchingScores = team1HomeScores;
                                }
                                else if (JSON.stringify(team1AwayScores) === JSON.stringify(team2HomeScores)) {
                                    matchingTeam = `${selectedSurpriseMatch.AwayTeam} ve ${match.HomeTeam}`;
                                    matchingScores = team1AwayScores;
                                }
                                else if (JSON.stringify(team1AwayScores) === JSON.stringify(team2AwayScores)) {
                                    matchingTeam = `${selectedSurpriseMatch.AwayTeam} ve ${match.AwayTeam}`;
                                    matchingScores = team1AwayScores;
                                }
                                similarResults.push({
                                    match,
                                    similarity: similarity.similarity,
                                    commonPatterns: [
                                        similarity.similarity >= 80 ? 'Birebir Skor Eşleşmesi' : 'Kısmi Skor Eşleşmesi',
                                        `Eşleşen Takımlar: ${matchingTeam}`,
                                        `Son 3 Maç Skorları: ${matchingScores.join(', ')}`
                                    ],
                                    matchingTeam,
                                    matchingScores,
                                    isPartialMatch: similarity.similarity < 80
                                });
                            }
                        });
                    });
                });
                console.log(`Toplam ${processedMatches} maç analiz edildi`);
                // Sonuçları benzerlik oranına göre sırala
                similarResults.sort((a, b) => b.similarity - a.similarity);
                console.log(`${similarResults.length} benzer maç bulundu`);
                setSimilarMatches(similarResults);
            }
            catch (error) {
                console.error('Benzerlik analizi hatası:', error);
            }
            finally {
                setIsLoadingSimilar(false);
            }
        }, 0);
    };
    // Köprü analizi yapan fonksiyon
    const findBridgePatterns = () => {
        if (!selectedTeamA || !selectedTeamZ)
            return;
        setIsLoadingBridge(true);
        setBridgeResults([]);
        setTimeout(() => {
            try {
                const results = [];
                // Mevcut sezonu bul
                const currentSeason = seasons.find(s => s.id === selectedSeason);
                if (!currentSeason)
                    return;
                // Mevcut sezonda A takımının son maçını ve rakibini bul
                const currentSeasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= currentSeason.startDate && matchDate <= currentSeason.endDate;
                }).sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateB.getTime() - dateA.getTime(); // En son maç başta olsun
                });
                // A takımının son maçını bul
                const lastMatchOfA = currentSeasonMatches.find(match => match.HomeTeam === selectedTeamA || match.AwayTeam === selectedTeamA);
                if (!lastMatchOfA)
                    return;
                // A'nın son rakibini bul (X takımı)
                const teamX = lastMatchOfA.HomeTeam === selectedTeamA ?
                    lastMatchOfA.AwayTeam :
                    lastMatchOfA.HomeTeam;
                // Her sezon için analiz yap (mevcut sezon hariç)
                seasons.forEach(season => {
                    if (season.id === currentSeason.id)
                        return; // Mevcut sezonu atla
                    const seasonResult = {
                        season: season.name,
                        pattern: []
                    };
                    // Sezon maçlarını filtrele ve tarihe göre sırala
                    const seasonMatches = matchData.filter(match => {
                        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                        return matchDate >= season.startDate && matchDate <= season.endDate;
                    }).sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateA.getTime() - dateB.getTime();
                    });
                    // Z takımının sürpriz maçlarını bul
                    const zSurprises = seasonMatches.filter(match => {
                        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                            (match.HTR === 'A' && match.FTR === 'H');
                        const involvesZ = match.HomeTeam === selectedTeamZ ||
                            match.AwayTeam === selectedTeamZ;
                        return isSurprise && involvesZ;
                    });
                    // Her sürpriz maç için
                    zSurprises.forEach(surpriseMatch => {
                        // Y takımını bul (Z'yi yenen takım)
                        const teamY = surpriseMatch.HomeTeam === selectedTeamZ ?
                            surpriseMatch.AwayTeam :
                            surpriseMatch.HomeTeam;
                        // Y takımının sürpriz maçtan önceki son maçını bul
                        const previousMatchOfY = seasonMatches.filter(match => {
                            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                            const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                            const isBeforeSurprise = matchDate < surpriseDate;
                            const involvesY = match.HomeTeam === teamY || match.AwayTeam === teamY;
                            return isBeforeSurprise && involvesY;
                        }).pop(); // Son maçı al
                        if (previousMatchOfY) {
                            // Y'nin rakibini bul (X takımı)
                            const previousX = previousMatchOfY.HomeTeam === teamY ?
                                previousMatchOfY.AwayTeam :
                                previousMatchOfY.HomeTeam;
                            // Eğer bu X takımı, mevcut sezonda A'nın son rakibiyse
                            if (previousX === teamX) {
                                // X → Y → Z paternini ekle
                                seasonResult.pattern.push({
                                    teamX: previousX,
                                    teamY,
                                    teamZ: selectedTeamZ,
                                    firstMatch: previousMatchOfY,
                                    surpriseMatch
                                });
                                // A → Z arasında henüz oynanmamış maç var mı?
                                const potentialAZMatch = currentSeasonMatches.find(match => (match.HomeTeam === selectedTeamA && match.AwayTeam === selectedTeamZ) ||
                                    (match.HomeTeam === selectedTeamZ && match.AwayTeam === selectedTeamA));
                                seasonResult.currentPattern = {
                                    teamX,
                                    teamA: selectedTeamA,
                                    teamZ: selectedTeamZ,
                                    firstMatch: lastMatchOfA,
                                    potentialMatch: potentialAZMatch
                                };
                            }
                        }
                    });
                    if (seasonResult.pattern.length > 0) {
                        results.push(seasonResult);
                    }
                });
                setBridgeResults(results);
            }
            catch (error) {
                console.error('Köprü analizi hatası:', error);
            }
            finally {
                setIsLoadingBridge(false);
            }
        }, 100);
    };
    // Köprü modu görünümü
    const renderBridgeMode = () => {
        return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "A Tak\u0131m\u0131 (K\u00F6pr\u00FC)" }), _jsxs("select", { value: selectedTeamA, onChange: (e) => {
                                        setSelectedTeamA(e.target.value);
                                        setBridgeResults([]);
                                    }, className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.filter(team => team !== selectedTeamZ).map(team => (_jsx("option", { value: team, children: team }, team)))] })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Z Tak\u0131m\u0131 (Hedef)" }), _jsxs("select", { value: selectedTeamZ, onChange: (e) => {
                                        setSelectedTeamZ(e.target.value);
                                        setBridgeResults([]);
                                    }, className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.filter(team => team !== selectedTeamA).map(team => (_jsx("option", { value: team, children: team }, team)))] })] }), _jsx("button", { onClick: findBridgePatterns, "data-auto-bridge": true, disabled: !selectedTeamA || !selectedTeamZ || isLoadingBridge, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded h-[42px] mt-8 disabled:opacity-50 min-w-[120px]", children: isLoadingBridge ? (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Analiz..." })] })) : ('Analiz Et') })] }), bridgeResults.length > 0 ? (_jsx("div", { className: "space-y-4", children: bridgeResults.map((result, index) => {
                        const seasonKey = `season-${result.season}`;
                        const isSeasonExpanded = expandedSeasons.includes(seasonKey);
                        return (_jsxs("div", { className: "bg-gray-800/50 rounded-lg overflow-hidden", children: [_jsxs("div", { onClick: () => {
                                        const newExpanded = isSeasonExpanded
                                            ? expandedSeasons.filter(s => s !== seasonKey)
                                            : [...expandedSeasons, seasonKey];
                                        setExpandedSeasons(newExpanded);
                                    }, className: "flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50", children: [_jsxs("h3", { className: "text-lg font-semibold text-white", children: [result.season, " Sezonu"] }), _jsx("svg", { className: `w-5 h-5 text-gray-400 transform transition-transform ${isSeasonExpanded ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), isSeasonExpanded && (_jsx("div", { className: "p-4 space-y-6", children: result.pattern.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h4", { className: "text-md font-medium text-gray-300", children: "Bulunan X \u2192 Y \u2192 Z Paternleri:" }), result.pattern.map((p, pIndex) => {
                                                const patternKey = `pattern-${result.season}-${pIndex}`;
                                                const isPatternExpanded = expandedPatterns.includes(patternKey);
                                                return (_jsxs("div", { className: "bg-gray-700/30 rounded-lg overflow-hidden", children: [_jsxs("div", { onClick: () => {
                                                                const newExpanded = isPatternExpanded
                                                                    ? expandedPatterns.filter(p => p !== patternKey)
                                                                    : [...expandedPatterns, patternKey];
                                                                setExpandedPatterns(newExpanded);
                                                            }, className: "flex items-center justify-between p-4 cursor-pointer hover:bg-gray-600/50", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: p.teamX, className: "w-5 h-5" }), _jsx("span", { className: "text-gray-300", children: p.teamX })] }), _jsx("span", { className: "text-gray-500", children: "\u2192" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: p.teamY, className: "w-5 h-5" }), _jsx("span", { className: "text-gray-300", children: p.teamY })] }), _jsx("span", { className: "text-gray-500", children: "\u2192" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: p.teamZ, className: "w-5 h-5" }), _jsx("span", { className: "text-orange-400", children: p.teamZ })] })] }), _jsx("svg", { className: `w-5 h-5 text-gray-400 transform transition-transform ${isPatternExpanded ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), isPatternExpanded && (_jsxs("div", { className: "p-4 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-center gap-8", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: formatDate(p.firstMatch.Date) }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white", children: p.firstMatch.HomeTeam }), _jsx(TeamLogo, { name: p.firstMatch.HomeTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("span", { className: "text-white font-bold", children: [p.firstMatch.FTHG, " - ", p.firstMatch.FTAG] }), _jsxs("span", { className: "text-sm text-gray-400", children: ["(\u0130Y: ", p.firstMatch.HTHG, "-", p.firstMatch.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: p.firstMatch.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: p.firstMatch.AwayTeam })] })] })] }), _jsx("div", { className: "flex items-center text-gray-500", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 8l4 4m0 0l-4 4m4-4H3" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: formatDate(p.surpriseMatch.Date) }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white", children: p.surpriseMatch.HomeTeam }), _jsx(TeamLogo, { name: p.surpriseMatch.HomeTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("span", { className: "text-white font-bold", children: [p.surpriseMatch.FTHG, " - ", p.surpriseMatch.FTAG] }), _jsxs("span", { className: "text-sm text-gray-400", children: ["(\u0130Y: ", p.surpriseMatch.HTHG, "-", p.surpriseMatch.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: p.surpriseMatch.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: p.surpriseMatch.AwayTeam })] })] })] })] }), result.currentPattern && (_jsxs("div", { className: "mt-6 pt-6 border-t border-gray-600", children: [_jsx("div", { className: "text-sm font-medium text-blue-400 mb-4", children: "Kar\u015F\u0131l\u0131k Gelen X \u2192 A \u2192 Z Paterni:" }), _jsxs("div", { className: "flex items-center justify-center gap-8", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: formatDate(result.currentPattern.firstMatch.Date) }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white", children: result.currentPattern.firstMatch.HomeTeam }), _jsx(TeamLogo, { name: result.currentPattern.firstMatch.HomeTeam, className: "w-6 h-6" })] }), _jsxs("div", { className: "flex flex-col items-center", children: [_jsxs("span", { className: "text-white font-bold", children: [result.currentPattern.firstMatch.FTHG, " - ", result.currentPattern.firstMatch.FTAG] }), _jsxs("span", { className: "text-sm text-gray-400", children: ["(\u0130Y: ", result.currentPattern.firstMatch.HTHG, "-", result.currentPattern.firstMatch.HTAG, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.currentPattern.firstMatch.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: result.currentPattern.firstMatch.AwayTeam })] })] })] }), _jsx("div", { className: "flex items-center text-gray-500", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17 8l4 4m0 0l-4 4m4-4H3" }) }) }), _jsx("div", { className: "flex-1", children: result.currentPattern.potentialMatch ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-sm text-gray-400 mb-2", children: formatDate(result.currentPattern.potentialMatch.Date) }), _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white", children: result.currentPattern.potentialMatch.HomeTeam }), _jsx(TeamLogo, { name: result.currentPattern.potentialMatch.HomeTeam, className: "w-6 h-6" })] }), _jsx("div", { className: "flex flex-col items-center", children: _jsx("span", { className: "text-white font-bold", children: "vs" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.currentPattern.potentialMatch.AwayTeam, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: result.currentPattern.potentialMatch.AwayTeam })] })] })] })) : (_jsx("div", { className: "text-center text-gray-400", children: "Hen\u00FCz ma\u00E7 planlanmam\u0131\u015F" })) })] }), _jsxs("div", { className: "flex items-center justify-center gap-4 mt-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.currentPattern.teamX, className: "w-5 h-5" }), _jsx("span", { className: "text-gray-300", children: result.currentPattern.teamX })] }), _jsx("span", { className: "text-gray-500", children: "\u2192" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.currentPattern.teamA, className: "w-5 h-5" }), _jsx("span", { className: "text-blue-400", children: result.currentPattern.teamA })] }), _jsx("span", { className: "text-gray-500", children: "\u2192" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: result.currentPattern.teamZ, className: "w-5 h-5" }), _jsx("span", { className: "text-orange-400", children: result.currentPattern.teamZ })] })] })] }))] }))] }, pIndex));
                                            })] })) }))] }, index));
                    }) })) : !isLoadingBridge && selectedTeamA && selectedTeamZ && (_jsx("div", { className: "text-center text-gray-400 py-8", children: "E\u015Fle\u015Fen patern bulunamad\u0131" }))] }));
    };
    // Otomatik hesaplama fonksiyonları
    const startAutoCalculation = () => {
        setShowTeamSelectionModal(true);
    };
    const handleTeamSelection = () => {
        if (!autoSelectedTeam1 || !autoSelectedTeam2)
            return;
        setShowTeamSelectionModal(false);
        setIsAutoCalculating(true);
        setCurrentAutoStep('bridge');
        setActiveTab('bridge');
        // Köprü analizi başlat
        setSelectedTeamA(autoSelectedTeam1);
        setSelectedTeamZ(autoSelectedTeam2);
        setTimeout(() => {
            // Köprü analizi butonuna tıkla
            const bridgeButton = document.querySelector('button[data-auto-bridge]');
            if (bridgeButton)
                bridgeButton.click();
            setShowContinueButton(true);
        }, 500);
    };
    const continueToNextStep = () => {
        setShowContinueButton(false);
        if (currentAutoStep === 'bridge') {
            setCurrentAutoStep('similar');
            setActiveTab('similar');
            setAnalysisMode('prediction');
            setSelectedHomeTeam(autoSelectedTeam1);
            setSelectedAwayTeam(autoSelectedTeam2);
            setTimeout(() => {
                // Benzer maçlar butonuna tıkla
                const similarButton = document.querySelector('button[data-auto-similar]');
                if (similarButton)
                    similarButton.click();
                setShowContinueButton(true);
            }, 500);
        }
        else if (currentAutoStep === 'similar') {
            setCurrentAutoStep('custom1');
            setActiveTab('custom');
            // İlk takımın son 3 rakibini bul
            const team1LastOpponents = findLastThreeOpponents(autoSelectedTeam1);
            setSelectedOpponents(team1LastOpponents);
            setTimeout(() => {
                // Kendi üçlün analiz butonuna tıkla
                const customButton = document.querySelector('button[data-auto-custom]');
                if (customButton)
                    customButton.click();
                setShowContinueButton(true);
            }, 500);
        }
        else if (currentAutoStep === 'custom1') {
            setCurrentAutoStep('custom2');
            setActiveTab('custom');
            // İkinci takımın son 3 rakibini bul
            const team2LastOpponents = findLastThreeOpponents(autoSelectedTeam2);
            setSelectedOpponents(team2LastOpponents);
            setTimeout(() => {
                // Kendi üçlün analiz butonuna tıkla
                const customButton = document.querySelector('button[data-auto-custom]');
                if (customButton)
                    customButton.click();
                setShowContinueButton(true);
            }, 500);
        }
        else {
            // Hesaplama bitti
            setIsAutoCalculating(false);
            setCurrentAutoStep(null);
            setShowContinueButton(false);
        }
    };
    const findLastThreeOpponents = (team) => {
        const season = seasons.find(s => s.id === selectedSeason);
        if (!season)
            return [];
        const seasonMatches = matchData
            .filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return match.Div === selectedLeague &&
                matchDate >= season.startDate &&
                matchDate <= season.endDate &&
                (match.HomeTeam === team || match.AwayTeam === team);
        })
            .sort((a, b) => {
            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
            return dateB.getTime() - dateA.getTime();
        })
            .slice(0, 3)
            .map(match => match.HomeTeam === team ? match.AwayTeam : match.HomeTeam);
        return seasonMatches;
    };
    // Sürpriz maç rakiplerinin benzerliğini kontrol et
    const analyzeSurpriseOpponents = () => {
        const currentSeasonSurprises = filteredMatches.filter(match => {
            const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
            const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
            return isHomeToAwaySurprise || isAwayToHomeSurprise;
        });
        // Sürpriz maçlardaki rakipleri al
        const currentSurpriseOpponents = currentSeasonSurprises.map(match => match.HomeTeam === selectedTeam ? match.AwayTeam : match.HomeTeam);
        const similarityResults = [];
        // Diğer sezonları kontrol et
        seasons.forEach(season => {
            if (season.id === selectedSeason)
                return; // Mevcut sezonu atla
            // Ligdeki tüm takımları kontrol et
            const allTeamsInSeason = new Set(matchData
                .filter(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                return matchDate >= season.startDate &&
                    matchDate <= season.endDate &&
                    match.Div === selectedLeague;
            })
                .flatMap(match => [match.HomeTeam, match.AwayTeam]));
            allTeamsInSeason.forEach(team => {
                // Takımın o sezondaki sürpriz maçlarını bul
                const teamSurprises = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
                    const isTeamMatch = match.HomeTeam === team || match.AwayTeam === team;
                    const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A';
                    const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H';
                    return isInSeason && isTeamMatch && (isHomeToAwaySurprise || isAwayToHomeSurprise);
                });
                // Sürpriz maçlardaki rakipleri al
                const teamSurpriseOpponents = teamSurprises.map(match => match.HomeTeam === team ? match.AwayTeam : match.HomeTeam);
                // Rakip benzerliğini hesapla
                if (currentSurpriseOpponents.length > 0 && teamSurpriseOpponents.length > 0) {
                    let matchingOpponents = 0;
                    currentSurpriseOpponents.forEach(opponent => {
                        if (teamSurpriseOpponents.includes(opponent)) {
                            matchingOpponents++;
                        }
                    });
                    const similarity = (matchingOpponents / Math.max(currentSurpriseOpponents.length, teamSurpriseOpponents.length)) * 100;
                    if (similarity >= 80) {
                        similarityResults.push({
                            team,
                            season: season.id,
                            similarity
                        });
                    }
                }
            });
        });
        setSurpriseTeamSimilarity(similarityResults);
    };
    // Analiz fonksiyonunu güncelle
    const analyzeScheduleSimilarity = async () => {
        setIsAnalyzingSchedule(true);
        analyzeSurpriseOpponents(); // Sürpriz rakip analizini çağır
        const currentSeasonMatches = filteredMatches;
        const results = [];
        try {
            // Tüm sezonları kontrol et (seçili sezon hariç)
            const otherSeasons = seasons.filter(s => s.id !== selectedSeason);
            for (const season of otherSeasons) {
                // Aynı ligdeki takımları bul
                const allTeamsInSeason = new Set(matchData
                    .filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= season.startDate &&
                        matchDate <= season.endDate &&
                        match.Div === selectedLeague;
                })
                    .flatMap(match => [match.HomeTeam, match.AwayTeam]));
                // Her takım için analiz yap
                for (const team of Array.from(allTeamsInSeason)) {
                    // Karşılaştırılacak takımın maçlarını al
                    const teamMatches = matchData
                        .filter(match => {
                        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                        const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
                        const isTeamMatch = match.HomeTeam === team || match.AwayTeam === team;
                        return isInSeason && isTeamMatch;
                    })
                        .sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateA.getTime() - dateB.getTime();
                    });
                    // En az 5 maç olmalı
                    if (teamMatches.length < 5 || currentSeasonMatches.length < 5)
                        continue;
                    // Benzerlik puanlarını hesapla
                    let firstOpponentMatch = false;
                    let opponentMatches = 0;
                    let homeAwayMatch = 0;
                    let scoreMatch = 0;
                    const matchCount = Math.min(currentSeasonMatches.length, teamMatches.length);
                    // İlk rakip kontrolü
                    const currentFirstMatch = currentSeasonMatches[0];
                    const compareFirstMatch = teamMatches[0];
                    if (currentFirstMatch && compareFirstMatch) {
                        const currentFirstOpponent = currentFirstMatch.HomeTeam === selectedTeam ? currentFirstMatch.AwayTeam : currentFirstMatch.HomeTeam;
                        const compareFirstOpponent = compareFirstMatch.HomeTeam === team ? compareFirstMatch.AwayTeam : compareFirstMatch.HomeTeam;
                        firstOpponentMatch = currentFirstOpponent === compareFirstOpponent;
                    }
                    // Diğer maçları karşılaştır
                    for (let i = 0; i < matchCount; i++) {
                        const currentMatch = currentSeasonMatches[i];
                        const compareMatch = teamMatches[i];
                        // Rakip kontrolü
                        const currentOpponent = currentMatch.HomeTeam === selectedTeam ? currentMatch.AwayTeam : currentMatch.HomeTeam;
                        const compareOpponent = compareMatch.HomeTeam === team ? compareMatch.AwayTeam : compareMatch.HomeTeam;
                        if (currentOpponent === compareOpponent) {
                            opponentMatches++;
                        }
                        // Ev sahibi/deplasman kontrolü
                        const currentIsHome = currentMatch.HomeTeam === selectedTeam;
                        const compareIsHome = compareMatch.HomeTeam === team;
                        if (currentIsHome === compareIsHome) {
                            homeAwayMatch++;
                        }
                        // Skor benzerliği kontrolü
                        const currentResult = currentMatch.FTR;
                        const compareResult = compareMatch.FTR;
                        if (currentResult === compareResult) {
                            scoreMatch++;
                        }
                    }
                    const actualMatchCount = matchCount;
                    const similarity = ((firstOpponentMatch ? 20 : 0) +
                        (opponentMatches / actualMatchCount) * 35 +
                        (homeAwayMatch / actualMatchCount) * 25 +
                        (scoreMatch / actualMatchCount) * 20);
                    if (similarity >= 50) {
                        results.push({
                            team,
                            season: season.id,
                            similarity,
                            matches: teamMatches.slice(0, actualMatchCount),
                            similarityDetails: {
                                firstOpponentMatch,
                                opponentMatches: (opponentMatches / actualMatchCount) * 100,
                                homeAwayMatch: (homeAwayMatch / actualMatchCount) * 100,
                                scoreMatch: (scoreMatch / actualMatchCount) * 100
                            }
                        });
                    }
                    // Her takım analizi sonrası sonuçları güncelle
                    results.sort((a, b) => b.similarity - a.similarity);
                    setScheduleAnalysisResults([...results]);
                }
                // Seçili takımın bu sezondaki maçlarını da karşılaştır
                if (allTeamsInSeason.has(selectedTeam)) {
                    const selectedTeamOtherSeasonMatches = matchData
                        .filter(match => {
                        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                        const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
                        const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
                        return isInSeason && isTeamMatch;
                    })
                        .sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateA.getTime() - dateB.getTime();
                    });
                    if (selectedTeamOtherSeasonMatches.length >= 5 && currentSeasonMatches.length >= 5) {
                        let firstOpponentMatch = false;
                        let opponentMatches = 0;
                        let homeAwayMatch = 0;
                        let scoreMatch = 0;
                        const matchCount = Math.min(currentSeasonMatches.length, selectedTeamOtherSeasonMatches.length);
                        // İlk rakip kontrolü
                        const currentFirstMatch = currentSeasonMatches[0];
                        const compareFirstMatch = selectedTeamOtherSeasonMatches[0];
                        if (currentFirstMatch && compareFirstMatch) {
                            const currentFirstOpponent = currentFirstMatch.HomeTeam === selectedTeam ? currentFirstMatch.AwayTeam : currentFirstMatch.HomeTeam;
                            const compareFirstOpponent = compareFirstMatch.HomeTeam === selectedTeam ? compareFirstMatch.AwayTeam : compareFirstMatch.HomeTeam;
                            firstOpponentMatch = currentFirstOpponent === compareFirstOpponent;
                        }
                        // Diğer maçları karşılaştır
                        for (let i = 0; i < matchCount; i++) {
                            const currentMatch = currentSeasonMatches[i];
                            const compareMatch = selectedTeamOtherSeasonMatches[i];
                            // Rakip kontrolü
                            const currentOpponent = currentMatch.HomeTeam === selectedTeam ? currentMatch.AwayTeam : currentMatch.HomeTeam;
                            const compareOpponent = compareMatch.HomeTeam === selectedTeam ? compareMatch.AwayTeam : compareMatch.HomeTeam;
                            if (currentOpponent === compareOpponent) {
                                opponentMatches++;
                            }
                            // Ev sahibi/deplasman kontrolü
                            const currentIsHome = currentMatch.HomeTeam === selectedTeam;
                            const compareIsHome = compareMatch.HomeTeam === selectedTeam;
                            if (currentIsHome === compareIsHome) {
                                homeAwayMatch++;
                            }
                            // Skor benzerliği kontrolü
                            const currentResult = currentMatch.FTR;
                            const compareResult = compareMatch.FTR;
                            if (currentResult === compareResult) {
                                scoreMatch++;
                            }
                        }
                        const actualMatchCount = matchCount;
                        const similarity = ((firstOpponentMatch ? 20 : 0) +
                            (opponentMatches / actualMatchCount) * 35 +
                            (homeAwayMatch / actualMatchCount) * 25 +
                            (scoreMatch / actualMatchCount) * 20);
                        if (similarity >= 50) {
                            results.push({
                                team: selectedTeam,
                                season: season.id,
                                similarity,
                                matches: selectedTeamOtherSeasonMatches.slice(0, actualMatchCount),
                                similarityDetails: {
                                    firstOpponentMatch,
                                    opponentMatches: (opponentMatches / actualMatchCount) * 100,
                                    homeAwayMatch: (homeAwayMatch / actualMatchCount) * 100,
                                    scoreMatch: (scoreMatch / actualMatchCount) * 100
                                }
                            });
                        }
                        // Her analiz sonrası sonuçları güncelle
                        results.sort((a, b) => b.similarity - a.similarity);
                        setScheduleAnalysisResults([...results]);
                    }
                }
            }
        }
        catch (error) {
            console.error('Analiz sırasında hata:', error);
        }
        finally {
            setIsAnalyzingSchedule(false);
        }
    };
    const renderScheduleAnalysis = () => {
        const highSimilarityResults = scheduleAnalysisResults.filter(result => result.similarity >= 80);
        const lowSimilarityResults = scheduleAnalysisResults.filter(result => result.similarity >= 50 && result.similarity < 80);
        return (_jsxs("div", { className: "space-y-6", children: [surpriseTeamSimilarity.length > 0 && (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 border-l-4 border-green-500", children: [_jsx("div", { className: "text-green-400 font-medium mb-2", children: "Dikkat: Sadece s\u00FCrprizler benziyor" }), _jsx("div", { className: "space-y-1", children: surpriseTeamSimilarity.map((result, index) => (_jsxs("div", { className: "text-green-400", children: [result.team, " (", result.season, ")"] }, index))) })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium", children: "Karde\u015F Takvim Analizi" }), _jsx("p", { className: "text-sm text-gray-400 mt-1", children: isAnalyzingSchedule ? 'Analiz devam ediyor...' :
                                        scheduleAnalysisResults.length > 0 ? `${scheduleAnalysisResults.length} sonuç bulundu` :
                                            'Henüz analiz yapılmadı' })] }), _jsx("button", { onClick: analyzeScheduleSimilarity, disabled: isAnalyzingSchedule, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2", children: isAnalyzingSchedule ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : ('Analiz Et') })] }), scheduleAnalysisResults.length > 0 && (_jsxs("div", { className: "space-y-4", children: [highSimilarityResults.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("h4", { className: "text-lg font-medium text-green-400", children: "Y\u00FCksek Benzerlik (%80+)" }), highSimilarityResults.map((result, index) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-yellow-400", children: result.team }), _jsxs("span", { className: "text-gray-400 ml-2", children: ["(", result.season, " Sezonu)"] })] }), _jsxs("span", { className: "text-green-400 font-medium", children: ["%", result.similarity.toFixed(1), " Benzerlik"] })] }), _jsxs("div", { className: "text-sm text-gray-300 space-y-1", children: [_jsxs("p", { children: ["\u0130lk Rakip E\u015Fle\u015Fmesi: ", result.similarityDetails.firstOpponentMatch ? 'Evet' : 'Hayır'] }), _jsxs("p", { children: ["Rakip E\u015Fle\u015Fme Oran\u0131: %", result.similarityDetails.opponentMatches.toFixed(1)] }), _jsxs("p", { children: ["Ev/Deplasman E\u015Fle\u015Fme Oran\u0131: %", result.similarityDetails.homeAwayMatch.toFixed(1)] }), _jsxs("p", { children: ["Skor E\u015Fle\u015Fme Oran\u0131: %", result.similarityDetails.scoreMatch.toFixed(1)] })] })] }, index)))] })), lowSimilarityResults.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "text-lg font-medium text-yellow-400", children: "Orta Benzerlik (%50-80)" }), _jsx("button", { onClick: () => setShowLowSimilarity(!showLowSimilarity), className: "text-sm text-gray-400 hover:text-white", children: showLowSimilarity ? 'Gizle' : 'Göster' })] }), showLowSimilarity && (_jsx("div", { className: "space-y-3", children: lowSimilarityResults.map((result, index) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-yellow-400", children: result.team }), _jsxs("span", { className: "text-gray-400 ml-2", children: ["(", result.season, " Sezonu)"] })] }), _jsxs("span", { className: "text-yellow-400 font-medium", children: ["%", result.similarity.toFixed(1), " Benzerlik"] })] }), _jsxs("div", { className: "text-sm text-gray-300 space-y-1", children: [_jsxs("p", { children: ["\u0130lk Rakip E\u015Fle\u015Fmesi: ", result.similarityDetails.firstOpponentMatch ? 'Evet' : 'Hayır'] }), _jsxs("p", { children: ["Rakip E\u015Fle\u015Fme Oran\u0131: %", result.similarityDetails.opponentMatches.toFixed(1)] }), _jsxs("p", { children: ["Ev/Deplasman E\u015Fle\u015Fme Oran\u0131: %", result.similarityDetails.homeAwayMatch.toFixed(1)] }), _jsxs("p", { children: ["Skor E\u015Fle\u015Fme Oran\u0131: %", result.similarityDetails.scoreMatch.toFixed(1)] })] })] }, index))) }))] }))] })), scheduleAnalysisResults.length === 0 && !isAnalyzingSchedule && (_jsx("p", { className: "text-gray-400", children: "Hen\u00FCz analiz yap\u0131lmad\u0131. Analiz etmek i\u00E7in butona t\u0131klay\u0131n." }))] }));
    };
    // Hafta modunda maçları filtrele
    useEffect(() => {
        if (isWeekMode && selectedLeague && selectedSeason) {
            const season = seasons.find(s => s.id === selectedSeason);
            if (season) {
                // Seçilen sezonun maçlarını al
                const seasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= season.startDate && matchDate <= season.endDate && match.Div === selectedLeague;
                });
                // Maçları tarihe göre sırala
                const sortedMatches = seasonMatches.sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                // Her takım için seçilen sayıda maç al
                const filteredTeamMatches = {};
                teams.forEach(team => {
                    const teamMatchList = sortedMatches.filter(match => match.HomeTeam === team || match.AwayTeam === team);
                    if (teamMatchList.length >= selectedMatchCount) {
                        filteredTeamMatches[team] = teamMatchList.slice(0, selectedMatchCount);
                    }
                });
                setTeamMatches(filteredTeamMatches);
            }
        }
    }, [isWeekMode, selectedLeague, selectedSeason, selectedMatchCount, matchData, teams, seasons]);
    // Maksimum maç sayısını hesapla
    useEffect(() => {
        if (selectedLeague && selectedSeason) {
            const season = seasons.find(s => s.id === selectedSeason);
            if (season) {
                // Seçilen sezonun maçlarını al
                const seasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= season.startDate && matchDate <= season.endDate && match.Div === selectedLeague;
                });
                // Her takımın maç sayısını bul ve en küçük olanı al
                const teamMatchCounts = new Map();
                teams.forEach(team => {
                    const count = seasonMatches.filter(match => match.HomeTeam === team || match.AwayTeam === team).length;
                    teamMatchCounts.set(team, count);
                });
                const minMatchCount = Math.min(...Array.from(teamMatchCounts.values()));
                setMaxMatchCount(minMatchCount);
                // Eğer seçili maç sayısı maksimumdan büyükse, maksimuma ayarla
                if (selectedMatchCount > minMatchCount) {
                    setSelectedMatchCount(minMatchCount);
                }
            }
        }
    }, [selectedLeague, selectedSeason, matchData, teams, seasons]);
    // Sürpriz analizi yap
    const analyzeSurprisesByDay = useCallback(() => {
        const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
        const analysis = {};
        const totalSurprises = {};
        // Her gün için boş obje oluştur
        days.forEach(day => {
            analysis[day] = {};
        });
        // Tüm maçları analiz et
        matchData.forEach(match => {
            const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A';
            const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H';
            if (isHomeToAwaySurprise || isAwayToHomeSurprise) {
                const date = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                const day = days[date.getDay()];
                if (!analysis[day][match.Div]) {
                    analysis[day][match.Div] = 0;
                }
                analysis[day][match.Div]++;
                // Toplam sürpriz sayısını hesapla
                if (!totalSurprises[match.Div]) {
                    totalSurprises[match.Div] = 0;
                }
                totalSurprises[match.Div]++;
            }
        });
        // En çok sürpriz çıkaran ligi bul
        const mostSurprisingLeague = Object.entries(totalSurprises)
            .sort((a, b) => b[1] - a[1])[0]?.[0];
        // Her gün için en çok sürpriz çıkaran ligleri bul
        const result = {};
        days.forEach(day => {
            const leagues = Object.entries(analysis[day])
                .map(([league, count]) => ({ league, count }))
                .sort((a, b) => b.count - a.count);
            if (leagues.length > 0) {
                result[day] = {
                    league: leagues[0].league,
                    count: leagues[0].count,
                    otherLeagues: leagues.slice(1, 4).map(l => ({
                        league: l.league,
                        count: l.count
                    })),
                    totalSurprises: totalSurprises[leagues[0].league]
                };
            }
        });
        setSurpriseAnalysis(result);
    }, [matchData]);
    // Info modal açıldığında analizi yap
    useEffect(() => {
        if (showInfoModal) {
            analyzeSurprisesByDay();
        }
    }, [showInfoModal, analyzeSurprisesByDay]);
    // Son Rakip analizi için fonksiyon
    const analyzeLastOpponents = () => {
        setIsAnalyzingLastOpponent(true);
        setLastOpponentResults([]);
        setTimeout(() => {
            try {
                const results = [];
                // Seçilen sezonun maçlarını al
                const currentSeason = seasons.find(s => s.id === selectedSeason);
                if (!currentSeason)
                    return;
                const currentSeasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= currentSeason.startDate && matchDate <= currentSeason.endDate;
                });
                // Her iki takım için analiz yap
                [
                    { team: selectedTeamForLastOpponent1, setState: setSelectedTeamForLastOpponent1 },
                    { team: selectedTeamForLastOpponent2, setState: setSelectedTeamForLastOpponent2 }
                ].forEach(({ team }) => {
                    // Takımın son maçını bul
                    const lastMatch = currentSeasonMatches
                        .filter(m => m.HomeTeam === team || m.AwayTeam === team)
                        .sort((a, b) => {
                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                        return dateB.getTime() - dateA.getTime();
                    })[0];
                    if (!lastMatch)
                        return;
                    // Son rakibi ve skoru belirle
                    const lastOpponent = lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;
                    const score = `${lastMatch.FTHG}-${lastMatch.FTAG}`; // Artık ev sahibi/deplasman kontrolü yapmıyoruz
                    // Önceki sezonlarda benzer durumları ara
                    const potentialMatches = [];
                    // Her sezonu kontrol et
                    seasons.forEach(season => {
                        if (season.id === selectedSeason)
                            return; // Mevcut sezonu atla
                        // Sezon maçlarını al (hem seçili lig hem de bir alt lig için)
                        const seasonMatches = matchData.filter(match => {
                            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                            const isInSeason = matchDate >= season.startDate && matchDate <= season.endDate;
                            // Seçili lig veya bir alt lig kontrolü
                            const currentLeague = selectedLeague;
                            const lowerLeague = currentLeague.slice(0, -1) + (Number(currentLeague.slice(-1)) + 1);
                            return isInSeason && (match.Div === currentLeague || match.Div === lowerLeague);
                        });
                        // lastOpponent'ın maçlarını bul
                        const opponentMatches = seasonMatches.filter(m => (m.HomeTeam === lastOpponent || m.AwayTeam === lastOpponent)).sort((a, b) => {
                            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                            return dateA.getTime() - dateB.getTime();
                        });
                        // Her maç için kontrol et
                        opponentMatches.forEach(match => {
                            const matchOpponent = match.HomeTeam === lastOpponent ? match.AwayTeam : match.HomeTeam;
                            const matchScore = `${match.FTHG}-${match.FTAG}`; // Artık ev sahibi/deplasman kontrolü yapmıyoruz
                            // Skor eşleşmesi kontrolü
                            if (matchScore === score || matchScore === score.split('-').reverse().join('-')) { // Her iki skor varyasyonunu da kontrol et
                                // Bu takımın sonraki maçını bul
                                const nextMatches = seasonMatches.filter(m => (m.HomeTeam === matchOpponent || m.AwayTeam === matchOpponent) &&
                                    new Date((Number(m.Date) - 25569) * 86400 * 1000) > new Date((Number(match.Date) - 25569) * 86400 * 1000)).sort((a, b) => {
                                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                    return dateA.getTime() - dateB.getTime();
                                });
                                // İlk maçta sürpriz var mı kontrol et
                                const nextMatch = nextMatches[0];
                                if (nextMatch) {
                                    const isSurprise = (nextMatch.HTR === 'H' && nextMatch.FTR === 'A') ||
                                        (nextMatch.HTR === 'A' && nextMatch.FTR === 'H');
                                    if (isSurprise) {
                                        potentialMatches.push({
                                            season: season.id,
                                            similarTeam: matchOpponent,
                                            surpriseMatch: nextMatch,
                                            originalMatch: match
                                        });
                                    }
                                }
                            }
                        });
                    });
                    // Sonuçları ekle
                    results.push({
                        team,
                        lastOpponent,
                        score,
                        potentialMatches
                    });
                });
                setLastOpponentResults(results);
            }
            catch (error) {
                console.error('Son rakip analizi hatası:', error);
            }
            finally {
                setIsAnalyzingLastOpponent(false);
            }
        }, 0);
    };
    const renderLastOpponentTab = () => {
        // Mevcut sezon için seçili ligdeki maçları al
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        const currentSeasonMatches = currentSeason ? matchData.filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= currentSeason.startDate &&
                matchDate <= currentSeason.endDate &&
                match.Div === selectedLeague;
        }) : [];
        // Seçili ligdeki benzersiz takım listesini oluştur
        const teams = Array.from(new Set(currentSeasonMatches.flatMap(match => [match.HomeTeam, match.AwayTeam]))).sort();
        return (_jsxs("div", { className: "last-opponent-analysis p-4 bg-gray-800 rounded-lg", children: [_jsxs("div", { className: "team-selection-container flex justify-center items-center gap-8 mb-6", children: [_jsxs("div", { className: "team-select-group flex-1 max-w-xs", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["1. Tak\u0131m (", LEAGUE_NAMES[selectedLeague], ")"] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedTeamForLastOpponent1, onChange: (e) => setSelectedTeamForLastOpponent1(e.target.value), className: "w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map((team) => (_jsx("option", { value: team, children: team }, team)))] }), selectedTeamForLastOpponent1 && (_jsx("div", { className: "absolute left-2 top-1/2 transform -translate-y-1/2", children: _jsx(TeamLogo, { name: selectedTeamForLastOpponent1, className: "w-6 h-6" }) }))] })] }), _jsx("div", { className: "divider flex items-center", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-indigo-500", children: _jsx("span", { className: "text-indigo-400 font-medium text-lg", children: "VS" }) }) }), _jsxs("div", { className: "team-select-group flex-1 max-w-xs", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["2. Tak\u0131m (", LEAGUE_NAMES[selectedLeague], ")"] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedTeamForLastOpponent2, onChange: (e) => setSelectedTeamForLastOpponent2(e.target.value), className: "w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map((team) => (_jsx("option", { value: team, children: team }, team)))] }), selectedTeamForLastOpponent2 && (_jsx("div", { className: "absolute left-2 top-1/2 transform -translate-y-1/2", children: _jsx(TeamLogo, { name: selectedTeamForLastOpponent2, className: "w-6 h-6" }) }))] })] })] }), _jsx("div", { className: "analyze-button-container flex justify-center mb-8", children: _jsx("button", { onClick: analyzeLastOpponents, disabled: !selectedTeamForLastOpponent1 || !selectedTeamForLastOpponent2 || isAnalyzingLastOpponent, className: "px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform transition-all hover:scale-105", children: isAnalyzingLastOpponent ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z", clipRule: "evenodd" }) }), _jsx("span", { children: "Analiz Et" })] })) }) }), lastOpponentResults.length > 0 && (_jsxs("div", { className: "results-container space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 gap-6", children: lastOpponentResults.map((result, index) => (_jsx("div", { className: "result-card bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600", children: _jsxs("div", { className: "bg-gray-600 px-4 py-3 border-b border-gray-500", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TeamLogo, { name: result.team, className: "w-8 h-8" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-white", children: result.team }), _jsxs("div", { className: "mt-1 text-sm text-gray-300 flex items-center gap-2", children: [_jsx("span", { children: "Son Rakip:" }), _jsx(TeamLogo, { name: result.lastOpponent, className: "w-5 h-5" }), _jsx("span", { className: "font-medium", children: result.lastOpponent }), _jsx("span", { className: "mx-2", children: "\u2022" }), _jsx("span", { className: "font-medium", children: result.score })] }), _jsx("div", { className: "mt-2 text-xs text-gray-300", children: (() => {
                                                                const teamMatches = matchData.filter(m => {
                                                                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                                                    return matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                                                        matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate &&
                                                                        (m.HomeTeam === result.team || m.AwayTeam === result.team);
                                                                }).sort((a, b) => {
                                                                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                                                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                                                    return dateA.getTime() - dateB.getTime();
                                                                });
                                                                const firstMatch = teamMatches[0];
                                                                const lastMatch = teamMatches[teamMatches.length - 1];
                                                                const getOpponent = (match, team) => match.HomeTeam === team ? match.AwayTeam : match.HomeTeam;
                                                                return (_jsxs("div", { children: ["\u0130lk ma\u00E7\u0131: ", _jsx("span", { className: "text-orange-400", children: getOpponent(firstMatch, result.team) }), " ile, Son ma\u00E7\u0131: ", _jsx("span", { className: "text-orange-400", children: getOpponent(lastMatch, result.team) }), " ile"] }));
                                                            })() })] })] }), _jsxs("div", { className: "px-4 py-3", children: [result.potentialMatches.length > 0 ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "border-t border-gray-600 -mx-4 pt-4", children: _jsx("h4", { className: "text-sm font-medium text-gray-300 px-4", children: "Benzer Senaryolar" }) }), _jsx("div", { className: "space-y-4 mt-4", children: result.potentialMatches.map((match, idx) => (_jsxs("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-indigo-500 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(TeamLogo, { name: match.similarTeam, className: "w-6 h-6" }), _jsx("span", { className: "text-white font-medium", children: match.similarTeam }), _jsxs("span", { className: "text-gray-400", children: ["(", match.season, ")"] })] }), _jsxs("div", { className: "text-sm text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }), _jsxs("span", { children: ["S\u00FCrpriz Ma\u00E7 Tarihi: ", formatDate(match.surpriseMatch.Date)] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) }), _jsxs("span", { children: ["S\u00FCrpriz Ma\u00E7: ", match.surpriseMatch.HomeTeam, " vs ", match.surpriseMatch.AwayTeam] })] }), _jsxs("div", { className: "mt-1 text-xs bg-gray-900 rounded px-2 py-1 inline-block", children: [match.surpriseMatch.FTHG, "-", match.surpriseMatch.FTAG] }), _jsx("div", { className: "mt-2 text-xs space-y-1", children: (() => {
                                                                                    // Ev sahibi takımın sezon maçlarını bul
                                                                                    const homeTeamMatches = matchData.filter(m => {
                                                                                        const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                                                                        return matchDate >= seasons.find(s => s.id === match.season)?.startDate &&
                                                                                            matchDate <= seasons.find(s => s.id === match.season)?.endDate &&
                                                                                            (m.HomeTeam === match.surpriseMatch.HomeTeam || m.AwayTeam === match.surpriseMatch.HomeTeam);
                                                                                    }).sort((a, b) => {
                                                                                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                                                                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                                                                        return dateA.getTime() - dateB.getTime();
                                                                                    });
                                                                                    // Deplasman takımın sezon maçlarını bul
                                                                                    const awayTeamMatches = matchData.filter(m => {
                                                                                        const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                                                                        return matchDate >= seasons.find(s => s.id === match.season)?.startDate &&
                                                                                            matchDate <= seasons.find(s => s.id === match.season)?.endDate &&
                                                                                            (m.HomeTeam === match.surpriseMatch.AwayTeam || m.AwayTeam === match.surpriseMatch.AwayTeam);
                                                                                    }).sort((a, b) => {
                                                                                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                                                                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                                                                        return dateA.getTime() - dateB.getTime();
                                                                                    });
                                                                                    const homeFirstMatch = homeTeamMatches[0];
                                                                                    const homeLastMatch = homeTeamMatches[homeTeamMatches.length - 1];
                                                                                    const awayFirstMatch = awayTeamMatches[0];
                                                                                    const awayLastMatch = awayTeamMatches[awayTeamMatches.length - 1];
                                                                                    const getOpponent = (match, team) => match.HomeTeam === team ? match.AwayTeam : match.HomeTeam;
                                                                                    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "text-gray-400", children: [_jsx("span", { className: "text-orange-400", children: match.surpriseMatch.HomeTeam }), ": \u0130lk ma\u00E7\u0131: ", _jsx("span", { className: "text-orange-400", children: getOpponent(homeFirstMatch, match.surpriseMatch.HomeTeam) }), " ile, Son ma\u00E7\u0131: ", _jsx("span", { className: "text-orange-400", children: getOpponent(homeLastMatch, match.surpriseMatch.HomeTeam) }), " ile"] }), _jsxs("div", { className: "text-gray-400", children: [_jsx("span", { className: "text-orange-400", children: match.surpriseMatch.AwayTeam }), ": \u0130lk ma\u00E7\u0131: ", _jsx("span", { className: "text-orange-400", children: getOpponent(awayFirstMatch, match.surpriseMatch.AwayTeam) }), " ile, Son ma\u00E7\u0131: ", _jsx("span", { className: "text-orange-400", children: getOpponent(awayLastMatch, match.surpriseMatch.AwayTeam) }), " ile"] }), (() => {
                                                                                                const firstOpponent1 = getOpponent(homeFirstMatch, match.surpriseMatch.HomeTeam);
                                                                                                const firstOpponent2 = getOpponent(awayFirstMatch, match.surpriseMatch.AwayTeam);
                                                                                                const surpriseMatches = matchData.filter(m => {
                                                                                                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                                                                                    const isInSeason = matchDate >= seasons.find(s => s.id === match.season)?.startDate &&
                                                                                                        matchDate <= seasons.find(s => s.id === match.season)?.endDate;
                                                                                                    const isFirstOpponentsMatch = (m.HomeTeam === firstOpponent1 && m.AwayTeam === firstOpponent2) ||
                                                                                                        (m.HomeTeam === firstOpponent2 && m.AwayTeam === firstOpponent1);
                                                                                                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                                                                                                    return isInSeason && isFirstOpponentsMatch && isSurprise;
                                                                                                });
                                                                                                return surpriseMatches.length > 0 && (_jsxs("div", { className: "mt-2 pt-2 border-t border-gray-700", children: [_jsx("div", { className: "text-xs text-gray-400", children: "\u0130lk rakipler aras\u0131 s\u00FCrpriz ma\u00E7lar:" }), surpriseMatches.map((m, idx) => (_jsxs("div", { className: "text-xs mt-1", children: [m.HomeTeam, " vs ", m.AwayTeam, " (", formatDate(m.Date), "): ", m.FTHG, "-", m.FTAG] }, idx)))] }));
                                                                                            })()] }));
                                                                                })() })] })] }, idx))) })] })) : (_jsx("div", { className: "text-sm text-gray-400 italic", children: "Benzer senaryo bulunamad\u0131" })), index === lastOpponentResults.length - 1 && lastOpponentResults.length === 2 && (() => {
                                                    // İlk rakipleri al
                                                    const firstOpponents = lastOpponentResults.map(r => {
                                                        const teamMatches = matchData.filter(m => {
                                                            const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                                            return matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                                                matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate &&
                                                                (m.HomeTeam === r.team || m.AwayTeam === r.team);
                                                        }).sort((a, b) => {
                                                            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                                            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                                            return dateA.getTime() - dateB.getTime();
                                                        });
                                                        const firstMatch = teamMatches[0];
                                                        return firstMatch ? (firstMatch.HomeTeam === r.team ? firstMatch.AwayTeam : firstMatch.HomeTeam) : null;
                                                    }).filter(Boolean);
                                                    if (firstOpponents.length === 2) {
                                                        // İlk rakipler arası sürpriz maçları bul
                                                        const surpriseMatches = matchData.filter(m => {
                                                            const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                                            const isInSeason = matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                                                matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate;
                                                            const isFirstOpponentsMatch = (m.HomeTeam === firstOpponents[0] && m.AwayTeam === firstOpponents[1]) ||
                                                                (m.HomeTeam === firstOpponents[1] && m.AwayTeam === firstOpponents[0]);
                                                            const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                                                            return isInSeason && isFirstOpponentsMatch && isSurprise;
                                                        });
                                                        return surpriseMatches.length > 0 ? (_jsxs("div", { className: "mt-4 pt-4 border-t border-gray-600", children: [_jsx("h4", { className: "text-sm font-medium text-gray-300 mb-2", children: "\u0130lk Rakipler Aras\u0131 S\u00FCrpriz Ma\u00E7lar" }), _jsx("div", { className: "space-y-2", children: surpriseMatches.map((match, idx) => (_jsx("div", { className: "text-sm bg-gray-800 rounded p-2 border border-gray-600", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: match.HomeTeam, className: "w-4 h-4" }), _jsx("span", { className: "text-white", children: match.HomeTeam }), _jsx("span", { className: "text-gray-400", children: "vs" }), _jsx(TeamLogo, { name: match.AwayTeam, className: "w-4 h-4" }), _jsx("span", { className: "text-white", children: match.AwayTeam }), _jsxs("span", { className: "text-gray-400 ml-2", children: ["(", formatDate(match.Date), ")"] }), _jsxs("span", { className: "text-orange-400 ml-2", children: [match.FTHG, "-", match.FTAG] })] }) }, idx))) })] })) : (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-600", children: _jsxs("div", { className: "text-sm text-gray-400 italic", children: ["\u0130lk rakipler (", firstOpponents.join(' ve '), ") aras\u0131nda s\u00FCrpriz ma\u00E7 bulunamad\u0131"] }) }));
                                                    }
                                                    return null;
                                                })()] })] }) }, index))) }), lastOpponentResults.length === 2 && (() => {
                            // İlk rakipleri al
                            const firstOpponents = lastOpponentResults.map(r => {
                                const teamMatches = matchData.filter(m => {
                                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                    return matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                        matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate &&
                                        (m.HomeTeam === r.team || m.AwayTeam === r.team);
                                }).sort((a, b) => {
                                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                    return dateA.getTime() - dateB.getTime();
                                });
                                const firstMatch = teamMatches[0];
                                return firstMatch ? (firstMatch.HomeTeam === r.team ? firstMatch.AwayTeam : firstMatch.HomeTeam) : null;
                            }).filter(Boolean);
                            if (firstOpponents.length === 2) {
                                // İlk rakipler arası sürpriz maçları bul
                                const surpriseMatches = matchData.filter(m => {
                                    const matchDate = new Date((Number(m.Date) - 25569) * 86400 * 1000);
                                    const isInSeason = matchDate >= seasons.find(s => s.id === selectedSeason)?.startDate &&
                                        matchDate <= seasons.find(s => s.id === selectedSeason)?.endDate;
                                    const isFirstOpponentsMatch = (m.HomeTeam === firstOpponents[0] && m.AwayTeam === firstOpponents[1]) ||
                                        (m.HomeTeam === firstOpponents[1] && m.AwayTeam === firstOpponents[0]);
                                    const isSurprise = (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H');
                                    return isInSeason && isFirstOpponentsMatch && isSurprise;
                                });
                                return (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4 border border-gray-600 mt-6", children: [_jsx("h3", { className: "text-lg font-medium text-white mb-4", children: "Se\u00E7ilen Tak\u0131mlar\u0131n \u0130lk Rakipleri Aras\u0131 Analiz" }), surpriseMatches.length > 0 ? (_jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-300 mb-3", children: ["\u0130lk rakipler (", firstOpponents.join(' ve '), ") aras\u0131ndaki s\u00FCrpriz ma\u00E7lar:"] }), _jsx("div", { className: "space-y-2", children: surpriseMatches.map((match, idx) => (_jsx("div", { className: "bg-gray-800 rounded p-3 border border-gray-600", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: match.HomeTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: match.HomeTeam }), _jsx("span", { className: "text-gray-400", children: "vs" }), _jsx(TeamLogo, { name: match.AwayTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: match.AwayTeam }), _jsxs("span", { className: "text-gray-400 ml-2", children: ["(", formatDate(match.Date), ")"] }), _jsxs("span", { className: "text-orange-400 ml-2", children: [match.FTHG, "-", match.FTAG] })] }) }, idx))) })] })) : (_jsxs("div", { className: "text-gray-400 italic", children: ["\u0130lk rakipler (", firstOpponents.join(' ve '), ") aras\u0131nda s\u00FCrpriz ma\u00E7 bulunamad\u0131"] }))] }));
                            }
                            return null;
                        })()] }))] }));
    };
    // İki Yarı analizi fonksiyonu
    const analyzeTwoHalves = () => {
        setIsAnalyzingTwoHalves(true);
        setTwoHalvesResults([]);
        setTimeout(() => {
            try {
                const results = [];
                // Mevcut sezonu bul
                const currentSeason = seasons.find(s => s.id === selectedSeason);
                if (!currentSeason)
                    return;
                // Sezon maçlarını al ve tarihe göre sırala
                const currentSeasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= currentSeason.startDate &&
                        matchDate <= currentSeason.endDate &&
                        match.Div === selectedLeague;
                }).sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                // Her iki takımı da kontrol et
                [
                    { team1: selectedTeamForTwoHalves1, team2: selectedTeamForTwoHalves2 },
                    { team1: selectedTeamForTwoHalves2, team2: selectedTeamForTwoHalves1 }
                ].forEach(({ team1, team2 }) => {
                    // team1'in sürpriz maçlarını bul
                    const surpriseMatches = currentSeasonMatches.filter(match => {
                        const isTeam1 = match.HomeTeam === team1 || match.AwayTeam === team1;
                        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') ||
                            (match.HTR === 'A' && match.FTR === 'H');
                        return isTeam1 && isSurprise;
                    });
                    // Her sürpriz maç için
                    surpriseMatches.forEach(surpriseMatch => {
                        // Sürpriz maçtan önceki son maçı bul
                        const previousMatches = currentSeasonMatches.filter(match => {
                            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                            const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                            const isBeforeSurprise = matchDate < surpriseDate;
                            const isTeam1 = match.HomeTeam === team1 || match.AwayTeam === team1;
                            return isBeforeSurprise && isTeam1;
                        }).sort((a, b) => {
                            const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                            const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                            return dateB.getTime() - dateA.getTime();
                        });
                        const previousMatch = previousMatches[0];
                        if (previousMatch) {
                            // E takımını bul (team1'in son rakibi)
                            const teamE = previousMatch.HomeTeam === team1 ?
                                previousMatch.AwayTeam :
                                previousMatch.HomeTeam;
                            // team2'nin son maçını bul
                            const team2LastMatch = currentSeasonMatches.filter(match => match.HomeTeam === team2 || match.AwayTeam === team2).pop();
                            // team2'nin son rakibi E mi kontrol et
                            if (team2LastMatch) {
                                const team2LastOpponent = team2LastMatch.HomeTeam === team2 ?
                                    team2LastMatch.AwayTeam :
                                    team2LastMatch.HomeTeam;
                                if (team2LastOpponent === teamE) {
                                    results.push({
                                        triggerTeam: team1,
                                        otherTeam: team2,
                                        teamE,
                                        eMatch: previousMatch,
                                        surpriseMatch
                                    });
                                }
                            }
                        }
                    });
                });
                setTwoHalvesResults(results);
            }
            catch (error) {
                console.error('İki Yarı analizi hatası:', error);
            }
            finally {
                setIsAnalyzingTwoHalves(false);
            }
        }, 0);
    };
    // Sonuçları gösterme fonksiyonu
    const renderTwoHalvesResults = () => {
        return (_jsx("div", { className: "results-container", children: _jsx("div", { className: "grid grid-cols-1 gap-6", children: twoHalvesResults.map((result, index) => (_jsxs("div", { className: "result-card bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600", children: [_jsx("div", { className: "bg-gray-600 px-4 py-3 border-b border-gray-500", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TeamLogo, { name: result.triggerTeam, className: "w-8 h-8" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-white", children: result.triggerTeam }), _jsxs("div", { className: "mt-1 text-sm text-gray-300", children: [_jsx("span", { children: "E Tak\u0131m\u0131:" }), _jsx(TeamLogo, { name: result.teamE, className: "w-5 h-5 inline-block mx-2" }), _jsx("span", { className: "font-medium", children: result.teamE })] })] })] }) }), _jsx("div", { className: "px-4 py-3", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-600", children: _jsxs("div", { className: "text-sm text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }), _jsxs("span", { children: ["E ile Ma\u00E7: ", formatDate(result.eMatch.Date)] }), _jsxs("span", { className: "text-xs bg-gray-900 rounded px-2 py-1 ml-2", children: [result.eMatch.FTHG, "-", result.eMatch.FTAG] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" }) }), _jsxs("span", { children: ["S\u00FCrpriz Ma\u00E7: ", formatDate(result.surpriseMatch.Date)] }), _jsxs("span", { className: "text-xs bg-gray-900 rounded px-2 py-1 ml-2", children: [result.surpriseMatch.FTHG, "-", result.surpriseMatch.FTAG] })] })] }) }), _jsxs("div", { className: "bg-gray-800 rounded-lg p-4 border border-gray-600", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx(TeamLogo, { name: result.otherTeam, className: "w-6 h-6" }), _jsx("span", { className: "text-white font-medium", children: result.otherTeam })] }), _jsx("div", { className: "text-sm text-gray-400", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" }) }), _jsxs("span", { children: ["Son Rakip: ", result.teamE] })] }) })] })] }) })] }, index))) }) }));
    };
    // İki Yarı sekmesi render fonksiyonu
    const renderTwoHalvesTab = () => {
        // Mevcut sezon için seçili ligdeki maçları al
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        const currentSeasonMatches = currentSeason ? matchData.filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= currentSeason.startDate &&
                matchDate <= currentSeason.endDate &&
                match.Div === selectedLeague;
        }) : [];
        // Seçili ligdeki benzersiz takım listesini oluştur
        const teams = Array.from(new Set(currentSeasonMatches.flatMap(match => [match.HomeTeam, match.AwayTeam]))).sort();
        return (_jsxs("div", { className: "last-opponent-analysis p-4 bg-gray-800 rounded-lg", children: [_jsxs("div", { className: "team-selection-container flex justify-center items-center gap-8 mb-6", children: [_jsxs("div", { className: "team-select-group flex-1 max-w-xs", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["O Tak\u0131m\u0131 (", LEAGUE_NAMES[selectedLeague], ")"] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedTeamForTwoHalves1, onChange: (e) => setSelectedTeamForTwoHalves1(e.target.value), className: "w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map((team) => (_jsx("option", { value: team, children: team }, team)))] }), selectedTeamForTwoHalves1 && (_jsx("div", { className: "absolute left-2 top-1/2 transform -translate-y-1/2", children: _jsx(TeamLogo, { name: selectedTeamForTwoHalves1, className: "w-6 h-6" }) }))] })] }), _jsx("div", { className: "divider flex items-center", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-indigo-500", children: _jsx("span", { className: "text-indigo-400 font-medium text-lg", children: "VS" }) }) }), _jsxs("div", { className: "team-select-group flex-1 max-w-xs", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["M Tak\u0131m\u0131 (", LEAGUE_NAMES[selectedLeague], ")"] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedTeamForTwoHalves2, onChange: (e) => setSelectedTeamForTwoHalves2(e.target.value), className: "w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map((team) => (_jsx("option", { value: team, children: team }, team)))] }), selectedTeamForTwoHalves2 && (_jsx("div", { className: "absolute left-2 top-1/2 transform -translate-y-1/2", children: _jsx(TeamLogo, { name: selectedTeamForTwoHalves2, className: "w-6 h-6" }) }))] })] })] }), _jsx("div", { className: "analyze-button-container flex justify-center mb-8", children: _jsx("button", { onClick: analyzeTwoHalves, disabled: !selectedTeamForTwoHalves1 || !selectedTeamForTwoHalves2 || isAnalyzingTwoHalves, className: "px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform transition-all hover:scale-105", children: isAnalyzingTwoHalves ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z", clipRule: "evenodd" }) }), _jsx("span", { children: "Analiz Et" })] })) }) }), twoHalvesResults.length > 0 && renderTwoHalvesResults()] }));
    };
    // Gizli sekmeler için state
    const [showHiddenTabs, setShowHiddenTabs] = useState(false);
    // Tost Formülü analiz fonksiyonu
    const analyzeToastFormula = (targetSeason) => {
        setIsAnalyzingToast(true);
        const analyzeSeason = targetSeason || selectedSeason;
        setTimeout(() => {
            try {
                const results = [];
                // Mevcut sezonu bul
                const currentSeason = seasons.find(s => s.id === selectedSeason);
                if (!currentSeason)
                    return;
                // Mevcut sezondaki maçları al
                const currentSeasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= currentSeason.startDate &&
                        matchDate <= currentSeason.endDate &&
                        match.Div === selectedLeague;
                });
                // A ve B takımlarının mevcut sezondaki son rakiplerini bul
                const getLastOpponent = (team) => {
                    const lastMatch = currentSeasonMatches.filter(m => m.HomeTeam === team || m.AwayTeam === team).pop();
                    if (!lastMatch)
                        return null;
                    return lastMatch.HomeTeam === team ? lastMatch.AwayTeam : lastMatch.HomeTeam;
                };
                const team1LastOpponent = getLastOpponent(selectedTeamForToast1);
                const team2LastOpponent = getLastOpponent(selectedTeamForToast2);
                if (!team1LastOpponent || !team2LastOpponent)
                    return;
                // Analiz edilecek sezonu bul
                const season = seasons.find(s => s.id === analyzeSeason);
                if (!season)
                    return;
                // Analiz edilecek sezondaki maçları al
                const seasonMatches = matchData.filter(match => {
                    const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                    return matchDate >= season.startDate &&
                        matchDate <= season.endDate &&
                        match.Div === selectedLeague;
                }).sort((a, b) => {
                    const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                    const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                    return dateA.getTime() - dateB.getTime();
                });
                // Sürpriz maçları bul
                const surpriseMatches = seasonMatches.filter(match => (match.HTR === 'H' && match.FTR === 'A') ||
                    (match.HTR === 'A' && match.FTR === 'H'));
                // Her sürpriz maç için kontrol et
                surpriseMatches.forEach(surpriseMatch => {
                    const teams = [surpriseMatch.HomeTeam, surpriseMatch.AwayTeam];
                    // Sürpriz maçta A veya B var mı kontrol et
                    if (teams.includes(selectedTeamForToast1) || teams.includes(selectedTeamForToast2)) {
                        // Sürpriz maçtaki diğer takımı bul (Y takımı)
                        const yTeam = teams.find(team => team !== selectedTeamForToast1 && team !== selectedTeamForToast2);
                        if (yTeam) {
                            // Y takımının son maçını bul
                            const yPreviousMatches = seasonMatches.filter(match => {
                                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                                const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                                const isBeforeSurprise = matchDate < surpriseDate;
                                const isTeamInvolved = match.HomeTeam === yTeam || match.AwayTeam === yTeam;
                                return isBeforeSurprise && isTeamInvolved;
                            }).sort((a, b) => {
                                const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                return dateB.getTime() - dateA.getTime();
                            });
                            const yPreviousMatch = yPreviousMatches[0];
                            if (yPreviousMatch) {
                                // Y'nin son rakibini bul (Tost başlangıcı)
                                const yLastOpponent = yPreviousMatch.HomeTeam === yTeam ?
                                    yPreviousMatch.AwayTeam :
                                    yPreviousMatch.HomeTeam;
                                // Eğer Y'nin son rakibi, seçmediğimiz takımın MEVCUT SEZONDAKİ son rakibi ile aynıysa
                                if ((teams.includes(selectedTeamForToast1) && yLastOpponent === team2LastOpponent) ||
                                    (teams.includes(selectedTeamForToast2) && yLastOpponent === team1LastOpponent)) {
                                    // Y'nin sonraki maçını bul
                                    const yNextMatches = seasonMatches.filter(match => {
                                        const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                                        const surpriseDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                                        const isAfterSurprise = matchDate > surpriseDate;
                                        const isTeamInvolved = match.HomeTeam === yTeam || match.AwayTeam === yTeam;
                                        return isAfterSurprise && isTeamInvolved;
                                    }).sort((a, b) => {
                                        const dateA = new Date((Number(a.Date) - 25569) * 86400 * 1000);
                                        const dateB = new Date((Number(b.Date) - 25569) * 86400 * 1000);
                                        return dateA.getTime() - dateB.getTime();
                                    });
                                    const yNextMatch = yNextMatches[0];
                                    if (yNextMatch) {
                                        const nextOpponent = yNextMatch.HomeTeam === yTeam ?
                                            yNextMatch.AwayTeam :
                                            yNextMatch.HomeTeam;
                                        results.push({
                                            surpriseMatch,
                                            toastStart: {
                                                team: yLastOpponent,
                                                isHome: yPreviousMatch.HomeTeam === yLastOpponent
                                            },
                                            toastMiddle: {
                                                team: teams.includes(selectedTeamForToast1) ? selectedTeamForToast1 : selectedTeamForToast2,
                                                isHome: surpriseMatch.HomeTeam === (teams.includes(selectedTeamForToast1) ? selectedTeamForToast1 : selectedTeamForToast2)
                                            },
                                            toastEnd: {
                                                team: nextOpponent,
                                                isHome: yNextMatch.HomeTeam === nextOpponent,
                                                match: yNextMatch
                                            },
                                            season: analyzeSeason
                                        });
                                    }
                                }
                            }
                        }
                    }
                });
                setToastResults(prevResults => [...prevResults, ...results]);
                setCurrentToastSeason(analyzeSeason);
                setShowMoreSeasonsButton(true);
            }
            catch (error) {
                console.error('Tost Formülü analizi hatası:', error);
            }
            finally {
                setIsAnalyzingToast(false);
            }
        }, 0);
    };
    // Tost Formülü sekmesi render fonksiyonu
    const renderToastFormulaTab = () => {
        // Mevcut sezon için seçili ligdeki maçları al
        const currentSeason = seasons.find(s => s.id === selectedSeason);
        const currentSeasonMatches = currentSeason ? matchData.filter(match => {
            const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
            return matchDate >= currentSeason.startDate &&
                matchDate <= currentSeason.endDate &&
                match.Div === selectedLeague;
        }) : [];
        // Seçili ligdeki benzersiz takım listesini oluştur
        const teams = Array.from(new Set(currentSeasonMatches.flatMap(match => [match.HomeTeam, match.AwayTeam]))).sort();
        return (_jsxs("div", { className: "last-opponent-analysis p-4 bg-gray-800 rounded-lg", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-6 text-center", children: "Tost Form\u00FCl\u00FC" }), _jsxs("div", { className: "team-selection-container flex justify-center items-center gap-8 mb-6", children: [_jsxs("div", { className: "team-select-group flex-1 max-w-xs", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["A Tak\u0131m\u0131 (", LEAGUE_NAMES[selectedLeague], ")"] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedTeamForToast1, onChange: (e) => setSelectedTeamForToast1(e.target.value), className: "w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map((team) => (_jsx("option", { value: team, children: team }, team)))] }), selectedTeamForToast1 && (_jsx("div", { className: "absolute left-2 top-1/2 transform -translate-y-1/2", children: _jsx(TeamLogo, { name: selectedTeamForToast1, className: "w-6 h-6" }) }))] })] }), _jsx("div", { className: "divider flex items-center", children: _jsx("div", { className: "w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-indigo-500", children: _jsx("span", { className: "text-indigo-400 font-medium text-lg", children: "VS" }) }) }), _jsxs("div", { className: "team-select-group flex-1 max-w-xs", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: ["B Tak\u0131m\u0131 (", LEAGUE_NAMES[selectedLeague], ")"] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedTeamForToast2, onChange: (e) => setSelectedTeamForToast2(e.target.value), className: "w-full p-2 pl-10 bg-gray-700 text-white border border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map((team) => (_jsx("option", { value: team, children: team }, team)))] }), selectedTeamForToast2 && (_jsx("div", { className: "absolute left-2 top-1/2 transform -translate-y-1/2", children: _jsx(TeamLogo, { name: selectedTeamForToast2, className: "w-6 h-6" }) }))] })] })] }), _jsx("div", { className: "analyze-button-container flex justify-center mb-8", children: _jsx("button", { onClick: () => {
                            setToastResults([]);
                            setShowMoreSeasonsButton(false);
                            analyzeToastFormula();
                        }, disabled: !selectedTeamForToast1 || !selectedTeamForToast2 || isAnalyzingToast, className: "px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform transition-all hover:scale-105", children: isAnalyzingToast ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), _jsx("span", { children: "Analiz Ediliyor..." })] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z", clipRule: "evenodd" }) }), _jsx("span", { children: "Analiz Et" })] })) }) }), selectedTeamForToast1 && selectedTeamForToast2 && (_jsxs("div", { className: "results-container space-y-6", children: [_jsxs("div", { className: "text-lg font-medium text-white text-center mb-4", children: [currentToastSeason, " Sezonu Sonu\u00E7lar\u0131", toastResults.filter(result => result.season === currentToastSeason).length === 0 && (_jsx("div", { className: "text-gray-400 text-sm mt-2", children: "Bu sezonda sonu\u00E7 bulunamad\u0131" }))] }), toastResults.filter(result => result.season === currentToastSeason).length > 0 && (_jsx("div", { className: "grid grid-cols-1 gap-6", children: toastResults.filter(result => result.season === currentToastSeason).map((result, index) => (_jsxs("div", { className: "result-card bg-gray-700 rounded-lg shadow-xl overflow-hidden border border-gray-600", children: [_jsx("div", { className: "bg-gray-600 px-4 py-3 border-b border-gray-500", children: _jsxs("div", { className: "text-lg font-medium text-white", children: ["S\u00FCrpriz Ma\u00E7: ", formatDate(result.surpriseMatch.Date)] }) }), _jsxs("div", { className: "px-4 py-3 space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "bg-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-sm font-medium", children: "Tost Ba\u015Flang\u0131c\u0131" }), _jsx(TeamLogo, { name: result.toastStart.team, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: result.toastStart.team }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(", result.toastStart.isHome ? 'Ev Sahibi' : 'Deplasman', ")"] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "bg-blue-500/20 px-3 py-1 rounded-full text-blue-400 text-sm font-medium", children: "Tost Ortas\u0131" }), _jsx(TeamLogo, { name: result.toastMiddle.team, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: result.toastMiddle.team }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(", result.toastMiddle.isHome ? 'Ev Sahibi' : 'Deplasman', ")"] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "bg-green-500/20 px-3 py-1 rounded-full text-green-400 text-sm font-medium", children: "Tost Biti\u015F" }), _jsx(TeamLogo, { name: result.toastEnd.team, className: "w-6 h-6" }), _jsx("span", { className: "text-white", children: result.toastEnd.team }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(", result.toastEnd.isHome ? 'Ev Sahibi' : 'Deplasman', ")"] }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["- ", formatDate(result.toastEnd.match.Date)] })] })] })] }, index))) })), _jsx("div", { className: "flex justify-center mt-6", children: _jsxs("button", { onClick: () => {
                                    const currentSeasonIndex = seasons.findIndex(s => s.id === currentToastSeason);
                                    if (currentSeasonIndex < seasons.length - 1) {
                                        analyzeToastFormula(seasons[currentSeasonIndex + 1].id);
                                    }
                                }, disabled: isAnalyzingToast, className: "px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z", clipRule: "evenodd" }) }), _jsx("span", { children: "Daha Fazla Sezona Bak\u0131ls\u0131n m\u0131?" })] }) })] }))] }));
    };
    // Modal header'ı güncelleyelim
    return (_jsxs("div", { className: "flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900", children: [_jsx("div", { className: "w-40 min-w-[160px] bg-gray-800 p-4 border-r border-gray-700", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Lig Se\u00E7imi" }), _jsxs("select", { value: selectedLeague, onChange: (e) => setSelectedLeague(e.target.value), className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Lig Se\u00E7in" }), Object.entries(LEAGUE_NAMES).map(([id, name]) => (_jsx("option", { value: id, children: name }, id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Tak\u0131m Se\u00E7imi" }), _jsxs("select", { value: selectedTeam, onChange: (e) => setSelectedTeam(e.target.value), disabled: !selectedLeague, className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map(team => (_jsx("option", { value: team, children: team }, team)))] })] })] }) }), _jsx("div", { className: "flex-1 p-6 overflow-auto min-w-[1200px]", children: _jsxs("div", { className: "flex gap-6", children: [_jsxs("div", { className: `${isComparisonMode ? 'w-1/2' : 'w-full'} min-w-[600px]`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [selectedSeason && (_jsxs("div", { className: "text-white font-medium", children: [selectedSeason, " Sezonu"] })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Switch, { checked: isSurpriseMode, onChange: setIsSurpriseMode, className: `${isSurpriseMode ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`, children: [_jsx("span", { className: "sr-only", children: "S\u00FCrpriz Modu" }), _jsx("span", { className: `${isSurpriseMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform` })] }), _jsx("span", { className: "text-white text-sm", children: "S\u00FCrpriz Modu" })] })] }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow-xl overflow-x-auto", children: !isWeekMode ? (_jsxs("table", { className: "w-full table-fixed", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-900", children: [_jsx("th", { className: "w-[8%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Ma\u00E7" }), _jsx("th", { className: "w-[15%] px-4 py-3 text-left text-sm font-medium text-gray-300", children: "Tarih" }), _jsx("th", { className: "w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Ev Sahibi" }), _jsx("th", { className: "w-[23%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Skor" }), _jsx("th", { className: "w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Deplasman" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: filteredMatches.map((match, index) => {
                                                    // Sürpriz senaryolarını kontrol et
                                                    const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A'; // 1/2
                                                    const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H'; // 2/1
                                                    const isHomeToDrawSurprise = match.HTR === 'H' && match.FTR === 'D'; // 1/X
                                                    const isAwayToDrawSurprise = match.HTR === 'A' && match.FTR === 'D'; // 2/X
                                                    return (_jsxs("tr", { className: `
                            relative
                            ${match.HomeTeam === selectedTeam
                                                            ? match.FTR === 'H'
                                                                ? 'bg-green-900/20'
                                                                : match.FTR === 'A'
                                                                    ? 'bg-red-900/20'
                                                                    : 'bg-gray-700/20'
                                                            : match.FTR === 'A'
                                                                ? 'bg-green-900/20'
                                                                : match.FTR === 'H'
                                                                    ? 'bg-red-900/20'
                                                                    : 'bg-gray-700/20'}
                            ${
                                                        // 1/2 veya 2/1 senaryoları
                                                        (isHomeToAwaySurprise || isAwayToHomeSurprise)
                                                            ? 'outline outline-2 outline-orange-500 z-20'
                                                            : ''}
                            ${
                                                        // 1/X veya 2/X senaryoları
                                                        (isHomeToDrawSurprise || isAwayToDrawSurprise)
                                                            ? 'outline outline-2 outline-blue-500 z-20'
                                                            : ''}
                          `, children: [_jsxs("td", { className: "px-4 py-3 text-center text-sm font-medium text-gray-400", children: [index + 1, "."] }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: formatDate(match.Date) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [match.HR > 0 && (_jsx("div", { className: "w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse", children: _jsx("span", { className: "text-white text-[10px] font-bold", children: "R" }) })), _jsx(TeamLogo, { name: match.HomeTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: match.HomeTeam })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsxs("span", { className: "text-white font-bold", children: [match.FTHG, " - ", match.FTAG] }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(\u0130Y: ", match.HTHG, "-", match.HTAG, ")"] })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("span", { className: "text-white", children: match.AwayTeam }), _jsx(TeamLogo, { name: match.AwayTeam, className: "w-5 h-5" }), match.AR > 0 && (_jsx("div", { className: "w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse", children: _jsx("span", { className: "text-white text-[10px] font-bold", children: "R" }) }))] }) })] }, index));
                                                }) })] })) : (
                                    // Maç sayısı modu tablosu
                                    _jsx("div", { className: "space-y-4 p-4", children: Object.entries(teamMatches).map(([team, matches]) => (_jsxs("div", { className: "bg-gray-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(TeamLogo, { name: team, className: "w-6 h-6" }), _jsx("span", { className: "text-white font-medium", children: team })] }), _jsx("table", { className: "w-full", children: _jsx("tbody", { className: "divide-y divide-gray-600", children: matches.map((match, index) => (_jsxs("tr", { className: `
                              ${match.HomeTeam === team
                                                                ? match.FTR === 'H'
                                                                    ? 'bg-green-900/20'
                                                                    : match.FTR === 'A'
                                                                        ? 'bg-red-900/20'
                                                                        : 'bg-gray-700/20'
                                                                : match.FTR === 'A'
                                                                    ? 'bg-green-900/20'
                                                                    : match.FTR === 'H'
                                                                        ? 'bg-red-900/20'
                                                                        : 'bg-gray-700/20'}
                              ${
                                                            // 1/2 veya 2/1 senaryoları
                                                            (match.HTR === 'H' && match.FTR === 'A') || (match.HTR === 'A' && match.FTR === 'H')
                                                                ? 'outline outline-2 outline-orange-500 z-20'
                                                                : ''}
                              ${
                                                            // 1/X veya 2/X senaryoları
                                                            (match.HTR === 'H' && match.FTR === 'D') || (match.HTR === 'A' && match.FTR === 'D')
                                                                ? 'outline outline-2 outline-blue-500 z-20'
                                                                : ''}
                            `, children: [_jsx("td", { className: "py-2 px-3 text-sm text-gray-300", children: formatDate(match.Date) }), _jsx("td", { className: "py-2 px-3", children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx("span", { className: "text-white", children: match.HomeTeam }), _jsx(TeamLogo, { name: match.HomeTeam, className: "w-4 h-4" })] }) }), _jsx("td", { className: "py-2 px-3 text-center", children: _jsxs("span", { className: "text-white font-medium", children: [match.FTHG, " - ", match.FTAG] }) }), _jsx("td", { className: "py-2 px-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TeamLogo, { name: match.AwayTeam, className: "w-4 h-4" }), _jsx("span", { className: "text-white", children: match.AwayTeam })] }) })] }, index))) }) })] }, team))) })) })] }), isComparisonMode && (_jsxs("div", { className: "w-1/2 min-w-[600px]", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [comparisonSeason && (_jsxs("div", { className: "text-white font-medium", children: [comparisonSeason, " Sezonu"] })), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Switch, { checked: isComparisonSurpriseMode, onChange: setIsComparisonSurpriseMode, className: `${isComparisonSurpriseMode ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`, children: [_jsx("span", { className: "sr-only", children: "S\u00FCrpriz Modu" }), _jsx("span", { className: `${isComparisonSurpriseMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform` })] }), _jsx("span", { className: "text-white text-sm", children: "S\u00FCrpriz Modu" })] })] }), _jsx("div", { className: "bg-gray-800 rounded-lg shadow-xl overflow-x-auto", children: _jsxs("table", { className: "w-full table-fixed", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-gray-900", children: [_jsx("th", { className: "w-[8%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Ma\u00E7" }), _jsx("th", { className: "w-[15%] px-4 py-3 text-left text-sm font-medium text-gray-300", children: "Tarih" }), _jsx("th", { className: "w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Ev Sahibi" }), _jsx("th", { className: "w-[23%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Skor" }), _jsx("th", { className: "w-[27%] px-4 py-3 text-center text-sm font-medium text-gray-300", children: "Deplasman" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-700", children: comparisonMatches.map((match, index) => {
                                                    // Sürpriz senaryolarını kontrol et
                                                    const isHomeToAwaySurprise = match.HTR === 'H' && match.FTR === 'A';
                                                    const isAwayToHomeSurprise = match.HTR === 'A' && match.FTR === 'H';
                                                    const isHomeToDrawSurprise = match.HTR === 'H' && match.FTR === 'D';
                                                    const isAwayToDrawSurprise = match.HTR === 'A' && match.FTR === 'D';
                                                    return (_jsxs("tr", { className: `
                            relative
                            ${match.HomeTeam === selectedTeam
                                                            ? match.FTR === 'H'
                                                                ? 'bg-green-900/20'
                                                                : match.FTR === 'A'
                                                                    ? 'bg-red-900/20'
                                                                    : 'bg-gray-700/20'
                                                            : match.FTR === 'A'
                                                                ? 'bg-green-900/20'
                                                                : match.FTR === 'H'
                                                                    ? 'bg-red-900/20'
                                                                    : 'bg-gray-700/20'}
                              ${(isHomeToAwaySurprise || isAwayToHomeSurprise)
                                                            ? 'outline outline-2 outline-orange-500 z-20'
                                                            : ''}
                              ${(isHomeToDrawSurprise || isAwayToDrawSurprise)
                                                            ? 'outline outline-2 outline-blue-500 z-20'
                                                            : ''}
                            `, children: [_jsxs("td", { className: "px-4 py-3 text-center text-sm font-medium text-gray-400", children: [index + 1, "."] }), _jsx("td", { className: "px-4 py-3 text-gray-300", children: formatDate(match.Date) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [match.HR > 0 && (_jsx("div", { className: "w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse", children: _jsx("span", { className: "text-white text-[10px] font-bold", children: "R" }) })), _jsx(TeamLogo, { name: match.HomeTeam, className: "w-5 h-5" }), _jsx("span", { className: "text-white", children: match.HomeTeam })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsxs("span", { className: "text-white font-bold", children: [match.FTHG, " - ", match.FTAG] }), _jsxs("span", { className: "text-gray-400 text-sm", children: ["(\u0130Y: ", match.HTHG, "-", match.HTAG, ")"] })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("span", { className: "text-white", children: match.AwayTeam }), _jsx(TeamLogo, { name: match.AwayTeam, className: "w-5 h-5" }), match.AR > 0 && (_jsx("div", { className: "w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse", children: _jsx("span", { className: "text-white text-[10px] font-bold", children: "R" }) }))] }) })] }, index));
                                                }) })] }) })] }))] }) }), _jsx("div", { className: "w-40 min-w-[160px] bg-gray-800 p-4 border-l border-gray-700", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex justify-end mb-2", children: _jsx("button", { onClick: () => setShowInfoModal(true), className: "text-gray-400 hover:text-white focus:outline-none", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }) }), showInfoModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-bold text-white", children: "\u0130pu\u00E7lar\u0131 ve Bilgiler" }), _jsx("button", { onClick: () => setShowInfoModal(false), className: "text-gray-400 hover:text-white", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "border border-gray-700 rounded-lg", children: [_jsxs("button", { className: "w-full px-4 py-2 text-left text-white font-medium flex items-center justify-between hover:bg-gray-700", onClick: () => setIsAnalysisOpen(!isAnalysisOpen), children: [_jsx("span", { children: "G\u00FCnlere G\u00F6re S\u00FCrpriz E\u011Filimleri" }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: `h-5 w-5 transform transition-transform ${isAnalysisOpen ? 'rotate-180' : ''}`, viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z", clipRule: "evenodd" }) })] }), isAnalysisOpen && (_jsx("div", { className: "px-4 py-2 border-t border-gray-700", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsx("tr", { children: Object.keys(surpriseAnalysis).map(day => (_jsx("th", { className: "px-4 py-2 text-gray-300 font-medium border-b border-gray-700", children: day }, day))) }) }), _jsx("tbody", { children: _jsx("tr", { children: Object.entries(surpriseAnalysis).map(([day, data]) => {
                                                                            const isHighestTotal = Object.values(surpriseAnalysis).every(otherData => (data.totalSurprises || 0) >= (otherData.totalSurprises || 0));
                                                                            return (_jsxs("td", { className: "px-4 py-2 text-center", children: [_jsx("div", { className: `font-medium ${isHighestTotal ? 'text-orange-400' : 'text-green-400'}`, children: LEAGUE_NAMES[data.league] }), data.otherLeagues && data.otherLeagues.length > 0 && (_jsx("div", { className: "mt-1 text-sm text-gray-400", children: data.otherLeagues.map(league => (_jsx("div", { children: LEAGUE_NAMES[league.league] }, league.league))) }))] }, day));
                                                                        }) }) })] }) }) }))] }) })] }) })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "K\u0131yaslama Modu" }), _jsx(Switch, { checked: isComparisonMode, onChange: setIsComparisonMode, className: `${isComparisonMode ? 'bg-blue-600' : 'bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`, children: _jsx("span", { className: `${isComparisonMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform` }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Ma\u00E7 Say\u0131s\u0131 Modu" }), _jsxs("div", { className: "space-y-2", children: [_jsx(Switch, { checked: isWeekMode, onChange: setIsWeekMode, className: `${isWeekMode ? 'bg-blue-600' : 'bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`, children: _jsx("span", { className: `${isWeekMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform` }) }), isWeekMode && (_jsx("select", { value: selectedMatchCount, onChange: (e) => setSelectedMatchCount(Number(e.target.value)), className: "w-full bg-gray-700 text-white rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500", children: Array.from({ length: 40 }, (_, i) => i + 1).map(count => (_jsxs("option", { value: count, children: [count, " Ma\u00E7"] }, count))) }))] })] }), isComparisonMode && (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Kar\u015F\u0131la\u015Ft\u0131rma Sezonu" }), _jsxs("select", { value: comparisonSeason, onChange: (e) => setComparisonSeason(e.target.value), className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Sezon Se\u00E7in" }), seasons.map(season => (_jsx("option", { value: season.id, children: season.name }, season.id)))] })] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "Sezon Se\u00E7imi" }), _jsx("select", { value: selectedSeason, onChange: (e) => setSelectedSeason(e.target.value), className: "w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500", children: seasons.map(season => (_jsx("option", { value: season.id, children: season.name }, season.id))) })] }), _jsx("div", { children: _jsx("button", { onClick: () => setShowDetailModal(true), disabled: !selectedLeague || !selectedTeam, className: `
                w-full text-white text-sm font-medium py-2 px-4 rounded transition-colors duration-200
                ${!selectedLeague || !selectedTeam
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'}
              `, children: "Detayl\u0131 Analiz" }) })] }) }), showDetailModal && (_jsx("div", { className: "fixed inset-0 z-40", children: _jsx(Draggable, { handle: ".modal-header", nodeRef: nodeRef, disabled: isFullScreen, defaultPosition: { x: 0, y: 0 }, position: isFullScreen ? { x: 0, y: 0 } : undefined, children: _jsxs("div", { ref: nodeRef, className: `${getModalStyle()} ${!isFullScreen ? 'resize overflow-auto' : ''}`, style: {
                            resize: isFullScreen ? 'none' : 'both',
                            minWidth: isFullScreen ? '100%' : '800px',
                            minHeight: isFullScreen ? '100%' : '500px',
                            maxWidth: isFullScreen ? '100%' : 'calc(100vw - 40px)',
                            maxHeight: isFullScreen ? '100%' : 'calc(100vh - 40px)',
                            transform: isFullScreen ? 'none' : undefined
                        }, children: [_jsxs("div", { className: "modal-header cursor-move p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg", children: [_jsxs("div", { className: "flex space-x-4", children: [_jsx("button", { onClick: () => setActiveTab('custom'), className: `px-4 py-2 rounded-md transition-colors duration-200 ${activeTab === 'custom' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`, children: "\u00D6zel \u00DC\u00E7l\u00FC" }), _jsx("button", { onClick: () => setActiveTab('bridge'), className: `px-4 py-2 rounded-md transition-colors duration-200 ${activeTab === 'bridge' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`, children: "K\u00F6pr\u00FC" }), _jsx("button", { onClick: () => setActiveTab('lastOpponent'), className: `px-4 py-2 rounded-md transition-colors duration-200 ${activeTab === 'lastOpponent' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`, children: "Son Rakip" }), _jsx("button", { onClick: () => setActiveTab('twoHalves'), className: `px-4 py-2 rounded-md ${activeTab === 'twoHalves'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700'}`, children: "\u0130ki Yar\u0131" }), _jsx("button", { onClick: () => setActiveTab('toast'), className: `px-4 py-2 rounded-md ${activeTab === 'toast'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700'}`, children: "Tost Form\u00FCl\u00FC" }), _jsx("button", { onClick: () => setActiveTab('chain'), className: `px-4 py-2 rounded-md transition-colors duration-200 ${activeTab === 'chain' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`, children: "Tak\u0131m Zinciri" }), _jsx("button", { onClick: () => setActiveTab('matches'), className: `px-4 py-2 rounded-md transition-colors duration-200 ${activeTab === 'matches' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`, children: "Ma\u00E7 S\u0131ras\u0131" }), showHiddenTabs && (_jsx(_Fragment, { children: _jsx("button", { onClick: () => setActiveTab('surprises'), className: `px-4 py-2 rounded-md transition-colors duration-200 ${activeTab === 'surprises' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`, children: "Sezondaki S\u00FCrprizler" }) })), _jsx("button", { onClick: () => setActiveTab('newAnalysis'), className: `px-4 py-2 rounded-md ${activeTab === 'newAnalysis'
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700'}`, children: "Yeni Analiz" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Switch, { checked: showHiddenTabs, onChange: setShowHiddenTabs, className: `${showHiddenTabs ? 'bg-blue-600' : 'bg-gray-700'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800`, children: [_jsx("span", { className: "sr-only", children: "Gizli Sekmeleri G\u00F6ster" }), _jsx("span", { className: `${showHiddenTabs ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform` })] }), _jsx("span", { className: "text-sm text-gray-400", children: "Gizli Sekmeler" })] }), _jsx("button", { onClick: startAutoCalculation, className: "text-gray-400 hover:text-white p-1", title: "Otomatik Hesaplama", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" }) }) }), _jsx("button", { onClick: () => setIsFullScreen(!isFullScreen), className: "text-gray-400 hover:text-white p-1", title: "Tam Ekran", children: isFullScreen ? (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }) })) : (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" }) })) }), _jsx("button", { onClick: () => {
                                                    setShowDetailModal(false);
                                                    setIsFullScreen(false);
                                                    setTeamChains([]);
                                                    setMatchPairs([]);
                                                }, className: "text-gray-400 hover:text-white p-1", title: "Kapat", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] })] }), _jsx("div", { className: `p-6 ${isFullScreen ? 'h-[calc(100vh-80px)]' : 'max-h-[calc(100%-80px)]'} overflow-auto`, children: activeTab === 'chain' ? (_jsx("div", { className: "text-white", children: renderTeamChain() })) : activeTab === 'matches' ? (_jsx("div", { className: "text-white", children: renderMatchSequence() })) : activeTab === 'surprises' ? (_jsx("div", { className: "text-white", children: renderSeasonSurprises() })) : activeTab === 'custom' ? (_jsx("div", { className: "text-white", children: renderCustomTriplet() })) : activeTab === 'bridge' ? (_jsx("div", { className: "text-white", children: renderBridgeMode() })) : activeTab === 'lastOpponent' ? (_jsx("div", { className: "space-y-4", children: renderLastOpponentTab() })) : activeTab === 'twoHalves' ? (renderTwoHalvesTab()) : activeTab === 'toast' ? (renderToastFormulaTab()) : activeTab === 'newAnalysis' ? (_jsx(NewAnalysisTab, { matchData: matchData, teamData: teamData, selectedLeague: selectedLeague, selectedTeam: selectedTeam, selectedSeason: selectedSeason })) : null })] }) }) })), showTeamSelectionModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50", children: _jsxs("div", { className: "bg-gray-800 rounded-lg p-6 w-96", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Tak\u0131m Se\u00E7imi" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "1. Tak\u0131m" }), _jsxs("select", { value: autoSelectedTeam1, onChange: (e) => setAutoSelectedTeam1(e.target.value), className: "w-full bg-gray-700 text-white rounded-md px-3 py-2", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.map(team => (_jsx("option", { value: team, children: team }, team)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-300 mb-2", children: "2. Tak\u0131m" }), _jsxs("select", { value: autoSelectedTeam2, onChange: (e) => setAutoSelectedTeam2(e.target.value), className: "w-full bg-gray-700 text-white rounded-md px-3 py-2", children: [_jsx("option", { value: "", children: "Tak\u0131m Se\u00E7in" }), teams.filter(t => t !== autoSelectedTeam1).map(team => (_jsx("option", { value: team, children: team }, team)))] })] }), _jsxs("div", { className: "flex justify-end gap-2 mt-6", children: [_jsx("button", { onClick: () => setShowTeamSelectionModal(false), className: "px-4 py-2 text-gray-400 hover:text-white", children: "\u0130ptal" }), _jsx("button", { onClick: handleTeamSelection, disabled: !autoSelectedTeam1 || !autoSelectedTeam2, className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50", children: "Ba\u015Flat" })] })] })] }) })), showContinueButton && (_jsx("div", { className: "fixed bottom-4 right-4 z-50", children: _jsxs("button", { onClick: continueToNextStep, className: "bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg flex items-center gap-2", children: [currentAutoStep === 'custom2' ? 'Bitir' : 'Devam Et', currentAutoStep !== 'custom2' && (_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7l5 5m0 0l-5 5m5-5H6" }) }))] }) }))] }));
}
