import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';

// Yardımcı fonksiyonlar
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Sezon hesaplama fonksiyonunu güncelle
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11 arası
    // Ağustos (7) ve sonrası için yeni sezon
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Takımın ana ligini bulma fonksiyonu
const getTeamMainLeague = (team: string, matchData: any[]): string | null => {
    // UEFA maçları hariç en çok maç yaptığı ligi bul
    const leagueCounts = matchData
        .filter(m => 
            (m.HomeTeam === team || m.AwayTeam === team) && 
            !['UEFA', 'UEL', 'UECL'].includes(m.Div)
        )
        .reduce((acc, match) => {
            acc[match.Div] = (acc[match.Div] || 0) + 1;
            return acc;
        }, {});

    console.log('Takım Lig Dağılımı:', {
        team,
        leagues: leagueCounts
    });

    // Eğer hiç lig maçı yoksa null dön
    if (Object.keys(leagueCounts).length === 0) {
        console.log('Takımın lig maçı bulunamadı:', team);
        return null;
    }

    const mainLeague = Object.entries(leagueCounts)
        .sort(([,a], [,b]) => b - a)[0][0];

    console.log('Ana Lig:', {
        team,
        mainLeague,
        matchCount: leagueCounts[mainLeague]
    });

    return mainLeague;
};

interface AnalysisResult {
    teamA: string;
    surpriseMatch: {
        date: string;
        season: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
    };
    lastMatchA: {
        date: string;
        opponent: string;
        score: string;
    };
    lastMatchY: {
        date: string;
        opponent: string;
        score: string;
    };
    previousSurpriseWithX?: {
        date: string;
        score: string;
    };
    sameSeasonSurpriseWithX?: {
        date: string;
        score: string;
        homeTeam: string;
        awayTeam: string;
    };
    commonSurpriseTeams?: {
        team: string;
        surpriseWithA: {
            date: string;
            score: string;
        };
        surpriseWithX: {
            date: string;
            score: string;
        };
    }[];
    yCommonSurprises?: {
        withA?: {
            team: string;
            date: string;
            score: string;
        }[];
        withX?: {
            team: string;
            date: string;
            score: string;
        }[];
    };
}

// TeamSelectionModal bileşeni
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
    selectedTeams: string[];
    title: string;
}> = ({ isOpen, onClose, teams, onSelect, selectedTeams, title }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState<{ team: string; type: 'X' | 'Y' } | null>(null);

    // Filtrelenmiş takımlar
    const filteredTeams = teams
        .filter(team => team && !selectedTeams.includes(team))
        .filter(team => 
            !searchQuery ||
            (team && team.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const handleTeamSelect = (team: string) => {
        const type = selectedTeams.length === 0 ? 'X' : 'Y';
        setNotification({ team, type });
        
        // 1.5 saniye sonra bildirimi kaldır
        setTimeout(() => {
            setNotification(null);
        }, 1500);

        onSelect(team);
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white">{title}</h2>
                        <p className="text-gray-400 mt-2">
                            {selectedTeams.length === 0 ? "X Takımını Seçin" : "Y Takımını Seçin"}
                        </p>

                        {/* Arama Kutusu */}
                        <div className="mt-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Takım ara..."
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 
                                         rounded-lg text-white placeholder-gray-500 focus:outline-none 
                                         focus:border-purple-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Bildirim */}
                    {notification && (
                        <div className="absolute top-4 right-4 p-4 bg-green-900/90 text-green-100 
                                      rounded-lg shadow-lg transform transition-all duration-300 
                                      animate-fade-in">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span>
                                    <strong>{notification.team}</strong>
                                    {` ${notification.type} takımı olarak seçildi`}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {filteredTeams.length > 0 ? (
                            <div className="grid grid-cols-4 gap-4">
                                {filteredTeams.map((team, index) => (
                                    <button
                                        key={`${team}-${index}`}
                                        onClick={() => handleTeamSelect(team)}
                                        className="flex flex-col items-center p-4 rounded-xl 
                                                 bg-gray-800/50 hover:bg-gray-800/70 transition-all
                                                 hover:scale-105 hover:shadow-lg"
                                    >
                                        <TeamLogo name={team} className="w-16 h-16 mb-2" />
                                        <span className="text-sm text-gray-300">{team}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                Eşleşen takım bulunamadı
                            </div>
                        )}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// ResultsDisplay bileşeni
const ResultsDisplay: React.FC<{
    teamX: string;
    teamY: string;
    results: { 
        results: AnalysisResult[]; 
        xySurprise?: { date: string; score: string } 
    };
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ teamX, teamY, results, onBack, isAnalyzing }) => {
    // Hangi sonuçların detaylarının gösterileceğini takip eden state
    const [expandedResults, setExpandedResults] = useState<number[]>([]);

    const toggleResultDetails = (idx: number) => {
        setExpandedResults(prev => 
            prev.includes(idx) 
                ? prev.filter(i => i !== idx)
                : [...prev, idx]
        );
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 
                          rounded-2xl p-8 shadow-xl shadow-purple-900/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                
                <button 
                    onClick={onBack}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-black/20 
                             hover:bg-black/30 transition-colors text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-4">
                        <TeamLogo name={teamX} className="w-16 h-16" />
                        <ArrowRight className="w-6 h-6 text-purple-300" />
                        <TeamLogo name={teamY} className="w-16 h-16" />
                    </div>
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-white">Bermuda Üçgeni Analizi</h2>
                        <p className="text-purple-200 mt-1">
                            {teamY} ile sürpriz yapan takımların {teamX} ile ilişkisi
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto mt-8 px-2">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                        <p className="text-gray-400">Analiz yapılıyor...</p>
                    </div>
                ) : results.results.length > 0 ? (
                    <div className="space-y-6 pb-8">
                        {results.results.map((result, idx) => (
                            <div key={idx} 
                                 className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                          border border-gray-700/30 hover:border-purple-500/30 
                                          transition-all duration-300 p-6">
                                {/* Ok Tasarımı */}
                                <div className="relative py-8">
                                    <div className="flex items-center justify-between">
                                        {/* Sol: X Takımı */}
                                        <div className="flex flex-col items-center w-1/4">
                                            <TeamLogo name={teamX} className="w-14 h-14" />
                                            <span className="mt-2 text-sm font-medium text-gray-300">{teamX}</span>
                                        </div>

                                        {/* Orta: Y Takımı - Yukarı taşındı */}
                                        <div className="flex flex-col items-center w-1/4 -mt-8">
                                            <TeamLogo name={teamY} className="w-16 h-16" />
                                            <span className="mt-2 text-sm font-semibold text-purple-400">{teamY}</span>
                                        </div>

                                        {/* Sağ: A Takımı */}
                                        <div className="flex flex-col items-center w-1/4">
                                            <TeamLogo name={result.teamA} className="w-14 h-14" />
                                            <span className="mt-2 text-sm font-medium text-gray-300">{result.teamA}</span>
                                        </div>
                                    </div>

                                    {/* Oklar - Yeniden konumlandırıldı */}
                                    <div className="absolute top-[40%] left-0 w-full -translate-y-1/2 pointer-events-none">
                                        {/* Sol Ok (X'den Y'ye) */}
                                        <div className="absolute left-[20%] w-[30%] h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -rotate-[15deg]" />
                                        <div className="absolute left-[48%] top-[-4px] w-3 h-3 border-t-2 border-r-2 border-purple-500 transform rotate-45" />

                                        {/* Sağ Ok (A'dan Y'ye) */}
                                        <div className="absolute right-[20%] w-[30%] h-0.5 bg-gradient-to-l from-blue-500 to-purple-500 transform rotate-[15deg]" />
                                        <div className="absolute right-[48%] top-[-4px] w-3 h-3 border-t-2 border-l-2 border-purple-500 transform -rotate-45" />
                                    </div>
                                </div>

                                {/* Sürpriz Maç Detayları */}
                                <div className="mt-4 space-y-4">
                                    <div className="bg-purple-900/20 p-4 rounded-lg">
                                        <div className="text-sm text-purple-400 mb-2">Sürpriz Maç:</div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-8 h-8" />
                                                <span className="text-lg font-bold text-white">vs</span>
                                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-8 h-8" />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-400">
                                                    {result.surpriseMatch.date}
                                                    <span className="ml-2 text-purple-400">
                                                        ({result.surpriseMatch.season})
                                                    </span>
                                                </div>
                                                <div className="text-lg">
                                                    <span className="text-yellow-500">{result.surpriseMatch.htScore}</span>
                                                    {' → '}
                                                    <span className="text-green-500">{result.surpriseMatch.ftScore}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Son Maçlar Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/20 rounded-lg p-4">
                                            <div className="text-sm text-purple-400 mb-2">
                                                {`${result.teamA}'nın son maçı:`}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <TeamLogo name={result.lastMatchA.opponent} className="w-8 h-8" />
                                                    <span className="text-gray-300">{result.lastMatchA.opponent}</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-400">{result.lastMatchA.date}</div>
                                                    <div className="text-white">{result.lastMatchA.score}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 rounded-lg p-4">
                                            <div className="text-sm text-purple-400 mb-2">
                                                {`${teamY}'nin son maçı:`}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <TeamLogo name={result.lastMatchY.opponent} className="w-8 h-8" />
                                                    <span className="text-gray-300">{result.lastMatchY.opponent}</span>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-400">{result.lastMatchY.date}</div>
                                                    <div className="text-white">{result.lastMatchY.score}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* X ile A arasındaki Sürpriz */}
                                    {result.previousSurpriseWithX && (
                                        <div className="p-4 bg-blue-900/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <TeamLogo name={teamX} className="w-8 h-8" />
                                                        <span className="text-xs text-gray-400 mt-1">{teamX}</span>
                                                    </div>
                                                    <span className="text-blue-400">vs</span>
                                                    <div className="flex flex-col items-center">
                                                        <TeamLogo name={result.teamA} className="w-8 h-8" />
                                                        <span className="text-xs text-gray-400 mt-1">{result.teamA}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-blue-400">
                                                        Son Sürpriz: {result.previousSurpriseWithX.date}
                                                    </div>
                                                    <div className="text-white">
                                                        {result.previousSurpriseWithX.score}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Aynı Sezon Sürpriz Kontrolü */}
                                    <div className="mt-4 p-4 bg-green-900/20 border border-green-900/30 rounded-lg">
                                        <div className="text-sm text-green-400 mb-2">Aynı Sezon Sürpriz Kontrolü:</div>
                                        {result.sameSeasonSurpriseWithX ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={result.sameSeasonSurpriseWithX.homeTeam} className="w-8 h-8" />
                                                        <span className="text-sm text-gray-300">
                                                            {result.sameSeasonSurpriseWithX.homeTeam}
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-500">vs</span>
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={result.sameSeasonSurpriseWithX.awayTeam} className="w-8 h-8" />
                                                        <span className="text-sm text-gray-300">
                                                            {result.sameSeasonSurpriseWithX.awayTeam}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-green-400">
                                                        {result.sameSeasonSurpriseWithX.date}
                                                    </div>
                                                    <div className="text-lg font-semibold text-white">
                                                        {result.sameSeasonSurpriseWithX.score}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-400">
                                                {result.teamA} ile {teamX} arasında bu sezon sürpriz olmamış
                                            </div>
                                        )}
                                    </div>

                                    {/* Detay Göster/Gizle Butonu */}
                                    <button
                                        onClick={() => toggleResultDetails(idx)}
                                        className="w-full py-2 px-4 mb-4 text-sm font-medium text-purple-400 
                                                 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {expandedResults.includes(idx) ? (
                                            <>
                                                <span>Ortak sürprizleri gizle</span>
                                                <ChevronUp className="w-4 h-4" />
                                            </>
                                        ) : (
                                            <>
                                                <span>Ortak sürprizleri göster</span>
                                                <ChevronDown className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    {/* Sürpriz İlişkileri Bölümü */}
                                    {expandedResults.includes(idx) && (
                                        <div className="space-y-4 mt-6">
                                            {/* X ve A arasındaki ortak sürprizler */}
                                            <div className="p-4 bg-blue-900/20 border border-blue-900/30 rounded-lg">
                                                <div className="text-sm text-blue-400 mb-3">
                                                    {`${teamX} ve ${result.teamA} arasındaki ortak sürprizler:`}
                                                </div>
                                                {result.commonSurpriseTeams && result.commonSurpriseTeams.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {result.commonSurpriseTeams.map((commonTeam, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-blue-900/10 p-3 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <TeamLogo name={commonTeam.team} className="w-8 h-8" />
                                                                    <span className="text-blue-300">{commonTeam.team}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-blue-400">
                                                                        {commonTeam.surpriseWithA.date} vs {commonTeam.team}:
                                                                    </div>
                                                                    <div className="flex justify-between text-gray-300">
                                                                        <span>{commonTeam.surpriseWithA.date}</span>
                                                                        <span>{commonTeam.surpriseWithA.score}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        {teamX} ve {result.teamA} arasında bu sezon başka ortak sürpriz yok
                                                    </div>
                                                )}
                                            </div>

                                            {/* Y'nin X ile ortak sürprizleri */}
                                            <div className="p-4 bg-purple-900/20 border border-purple-900/30 rounded-lg">
                                                <div className="text-sm text-purple-400 mb-3">
                                                    {`${teamY} ve ${teamX} arasındaki ortak sürprizler: ${
                                                        result.yCommonSurprises?.withX
                                                            ?.map(s => s.team)
                                                            .join(', ') || 'Yok'
                                                    }`}
                                                </div>
                                                {result.yCommonSurprises?.withX && result.yCommonSurprises.withX.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {result.yCommonSurprises.withX.map((surprise, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-purple-900/10 p-3 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <TeamLogo name={surprise.team} className="w-8 h-8" />
                                                                    <span className="text-purple-300">{surprise.team}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-purple-400">{surprise.date}</div>
                                                                    <div className="text-white">{surprise.score}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        {teamY} ve {teamX} arasında bu sezon başka ortak sürpriz yok
                                                    </div>
                                                )}
                                            </div>

                                            {/* Y'nin A ile ortak sürprizleri */}
                                            <div className="p-4 bg-green-900/20 border border-green-900/30 rounded-lg">
                                                <div className="text-sm text-green-400 mb-3">
                                                    {`${teamY} ve ${result.teamA} arasındaki ortak sürprizler: ${
                                                        result.yCommonSurprises?.withA
                                                            ?.map(s => s.team)
                                                            .join(', ') || 'Yok'
                                                    }`}
                                                </div>
                                                {result.yCommonSurprises?.withA && result.yCommonSurprises.withA.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {result.yCommonSurprises.withA.map((surprise, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-green-900/10 p-3 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <TeamLogo name={surprise.team} className="w-8 h-8" />
                                                                    <span className="text-green-300">{surprise.team}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-green-400">{surprise.date}</div>
                                                                    <div className="text-white">{surprise.score}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-400">
                                                        {teamY} ve {result.teamA} arasında bu sezon başka ortak sürpriz yok
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* X-Y Sürpriz Bilgisi */}
                        {results.xySurprise && (
                            <div className="mt-8 p-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <TeamLogo name={teamX} className="w-10 h-10" />
                                        <span className="text-yellow-500">ve</span>
                                        <TeamLogo name={teamY} className="w-10 h-10" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-yellow-500">
                                            Aralarındaki Son Sürpriz: {results.xySurprise.date}
                                        </div>
                                        <div className="text-lg text-white">
                                            {results.xySurprise.score}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                        <p className="text-gray-400">Eşleşen sonuç bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sürpriz detaylarını bulan yardımcı fonksiyon
const findSurpriseDetails = (team1: string, team2: string, matches: any[]) => {
    const match = matches.find(m => 
        ((m.HomeTeam === team1 && m.AwayTeam === team2) ||
         (m.HomeTeam === team2 && m.AwayTeam === team1)) &&
        ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
    );

    if (!match) return { date: '', score: '' };

    return {
        date: formatDate(Number(match.Date)),
        score: `${match.FTHG}-${match.FTAG}`
    };
};

// Ortak sürprizleri bulan yardımcı fonksiyon
const findCommonSurprises = (teamA: string, teamX: string, teamY: string, season: string, surpriseMatches: any[]) => {
    // Sezon maçlarını filtrele
    const seasonMatches = surpriseMatches.filter(m => 
        getSeasonFromDate(Number(m.Date)) === season
    );

    // A'nın sürpriz yaptığı takımları bul
    const aSurprises = seasonMatches
        .filter(m => 
            (m.HomeTeam === teamA || m.AwayTeam === teamA) &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
        )
        .map(m => m.HomeTeam === teamA ? m.AwayTeam : m.HomeTeam);

    // X'in sürpriz yaptığı takımları bul
    const xSurprises = seasonMatches
        .filter(m => 
            (m.HomeTeam === teamX || m.AwayTeam === teamX) &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
        )
        .map(m => m.HomeTeam === teamX ? m.AwayTeam : m.HomeTeam);

    // Ortak takımları bul
    const commonTeams = aSurprises.filter(team => 
        xSurprises.includes(team) && team !== teamY
    );

    // Her ortak takım için detayları bul
    return commonTeams.map(team => ({
        team,
        surpriseWithA: findSurpriseDetails(teamA, team, seasonMatches),
        surpriseWithX: findSurpriseDetails(teamX, team, seasonMatches)
    }));
};

// Y'nin ortak sürprizlerini bulan fonksiyon
const findYCommonSurprises = (teamY: string, teamToCheck: string, season: string, surpriseMatches: any[]) => {
    const seasonMatches = surpriseMatches.filter(m => 
        getSeasonFromDate(Number(m.Date)) === season
    );

    // Y'nin sürpriz yaptığı takımlar
    const ySurprises = seasonMatches
        .filter(m => 
            (m.HomeTeam === teamY || m.AwayTeam === teamY) &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
        )
        .map(m => ({
            team: m.HomeTeam === teamY ? m.AwayTeam : m.HomeTeam,
            date: formatDate(Number(m.Date)),
            score: `${m.FTHG}-${m.FTAG}`
        }));

    // Diğer takımın sürpriz yaptığı takımlar
    const otherTeamSurprises = seasonMatches
        .filter(m => 
            (m.HomeTeam === teamToCheck || m.AwayTeam === teamToCheck) &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
        )
        .map(m => ({
            team: m.HomeTeam === teamToCheck ? m.AwayTeam : m.HomeTeam,
            date: formatDate(Number(m.Date)),
            score: `${m.FTHG}-${m.FTAG}`
        }));

    return ySurprises.filter(ys => 
        otherTeamSurprises.some(os => os.team === ys.team)
    );
};

// Analiz Fonksiyonu
const analyzeBermudaTriangle = (
    teamX: string,
    teamY: string,
    matchData: any[]
): { results: AnalysisResult[]; xySurprise?: { date: string; score: string } } => {
    const results: AnalysisResult[] = [];
    const mainLeague = getTeamMainLeague(teamX, matchData);
    const yLeague = getTeamMainLeague(teamY, matchData);

    if (!mainLeague || !yLeague) {
        console.log('Analiz yapılamıyor:', {
            teamX, teamY, xLeague: mainLeague, yLeague,
            reason: 'Takımlardan birinin lig maçı bulunamadı'
        });
        return { results: [] };
    }

    // X ligindeki takımları başlangıçta bul
    const xLeagueTeams = new Set(
        matchData
            .filter(m => m.Div === mainLeague)
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
    );

    console.log('X Ligindeki Takımlar:', {
        league: mainLeague,
        teamCount: xLeagueTeams.size,
        teams: [...xLeagueTeams]
    });

    // Başlangıçta tüm gerekli verileri hazırla
    const sortedMatches = matchData.sort((a, b) => Number(b.Date) - Number(a.Date));
    
    // Sürpriz maçları önceden filtrele
    const surpriseMatches = sortedMatches.filter(m => 
        (m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')
    );

    // Y'nin sürpriz maçlarını bul
    const ySurprises = surpriseMatches.filter(m => 
        m.HomeTeam === teamY || m.AwayTeam === teamY
    );

    // X'in sürprizlerini sezon bazında hazırla
    const xSurprisesBySeason = surpriseMatches
        .filter(m => m.Div === mainLeague && (m.HomeTeam === teamX || m.AwayTeam === teamX))
        .reduce((acc, m) => {
            const season = getSeasonFromDate(Number(m.Date));
            if (!acc[season]) acc[season] = [];
            acc[season].push(m);
            return acc;
        }, {});

    // Her Y sürprizi için analiz yap
    ySurprises.forEach(match => {
        const teamA = match.HomeTeam === teamY ? match.AwayTeam : match.HomeTeam;
        const season = getSeasonFromDate(Number(match.Date));

        // A takımı kontrolü
        if (!xLeagueTeams.has(teamA) || teamA === teamX) return;

        // Son maçları bul
        const matchDate = Number(match.Date);
        const lastMatchA = sortedMatches.find(m => 
            Number(m.Date) < matchDate && 
            (m.HomeTeam === teamA || m.AwayTeam === teamA)
        );
        const lastMatchY = sortedMatches.find(m => 
            Number(m.Date) < matchDate && 
            (m.HomeTeam === teamY || m.AwayTeam === teamY)
        );

        if (!lastMatchA || !lastMatchY) return;

        // Aynı sezondaki sürprizleri kontrol et
        const seasonSurprises = xSurprisesBySeason[season] || [];
        const sameSeasonSurprises = seasonSurprises.filter(m => 
            (m.HomeTeam === teamA && m.AwayTeam === teamX) ||
            (m.HomeTeam === teamX && m.AwayTeam === teamA)
        );

        // Ortak sürpriz takımlarını bul
        const commonSurprises = findCommonSurprises(
            teamA, teamX, teamY, season, surpriseMatches
        );

        // Y'nin ortak sürprizlerini bul
        const yCommonSurprises = findYCommonSurprises(teamY, teamA, season, surpriseMatches);

        // Result oluştur
        results.push({
            teamA,
            surpriseMatch: {
                date: formatDate(Number(match.Date)),
                season: getSeasonFromDate(Number(match.Date)),
                homeTeam: match.HomeTeam,
                awayTeam: match.AwayTeam,
                htScore: `${match.HTHG}-${match.HTAG}`,
                ftScore: `${match.FTHG}-${match.FTAG}`
            },
            lastMatchA: {
                date: formatDate(Number(lastMatchA.Date)),
                opponent: lastMatchA.HomeTeam === teamA ? lastMatchA.AwayTeam : lastMatchA.HomeTeam,
                score: `${lastMatchA.FTHG}-${lastMatchA.FTAG}`
            },
            lastMatchY: {
                date: formatDate(Number(lastMatchY.Date)),
                opponent: lastMatchY.HomeTeam === teamY ? lastMatchY.AwayTeam : lastMatchY.HomeTeam,
                score: `${lastMatchY.FTHG}-${lastMatchY.FTAG}`
            },
            ...(sameSeasonSurprises.length > 0 && {
                sameSeasonSurpriseWithX: {
                    date: formatDate(Number(sameSeasonSurprises[0].Date)),
                    score: `${sameSeasonSurprises[0].FTHG}-${sameSeasonSurprises[0].FTAG}`,
                    homeTeam: sameSeasonSurprises[0].HomeTeam,
                    awayTeam: sameSeasonSurprises[0].AwayTeam
                }
            }),
            ...(commonSurprises.length > 0 && {
                commonSurpriseTeams: commonSurprises
            }),
            yCommonSurprises: {
                withA: yCommonSurprises.map(ys => ({
                    team: ys.team,
                    date: ys.date,
                    score: ys.score
                })),
                withX: findYCommonSurprises(teamY, teamX, season, surpriseMatches).map(ys => ({
                    team: ys.team,
                    date: ys.date,
                    score: ys.score
                }))
            }
        });
    });

    // X-Y sürprizlerini kontrol et
    const xySurprises = surpriseMatches.filter(m => 
        ((m.HomeTeam === teamX && m.AwayTeam === teamY) ||
         (m.HomeTeam === teamY && m.AwayTeam === teamX))
    );

    return {
        results,
        xySurprise: xySurprises.length > 0 ? {
            date: formatDate(Number(xySurprises[0].Date)),
            score: `${xySurprises[0].FTHG}-${xySurprises[0].FTAG}`
        } : undefined
    };
};

// Ana Komponent
export const BermudaTriangleFormula: React.FC<{
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}> = ({ matchData, onClose }) => {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [results, setResults] = useState<{ 
        results: AnalysisResult[]; 
        xySurprise?: { date: string; score: string } 
    }>({ results: [] });
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Tüm takımları al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData.forEach(m => {
            if (m.HomeTeam) teamSet.add(m.HomeTeam);
            if (m.AwayTeam) teamSet.add(m.AwayTeam);
        });
        return Array.from(teamSet)
            .filter(team => team) // undefined/null değerleri filtrele
            .sort();
    }, [matchData]);

    const handleTeamSelect = (team: string) => {
        const newSelectedTeams = [...selectedTeams, team];
        setSelectedTeams(newSelectedTeams);

        if (newSelectedTeams.length === 2) {
            setShowTeamSelection(false);
            setIsAnalyzing(true);
            
            setTimeout(() => {
                const analysisResults = analyzeBermudaTriangle(
                    newSelectedTeams[0],
                    newSelectedTeams[1],
                    matchData
                );
                setResults(analysisResults);
                setIsAnalyzing(false);
            }, 100);
        }
    };

    const handleBack = () => {
        setSelectedTeams([]);
        setResults({ results: [] });
        setShowTeamSelection(true);
    };

    return (
        <>
            <TeamSelectionModal
                isOpen={showTeamSelection}
                onClose={onClose}
                teams={teams}
                onSelect={handleTeamSelect}
                selectedTeams={selectedTeams}
                title="Bermuda Üçgeni Analizi için Takım Seçin"
            />

            {!showTeamSelection && selectedTeams.length === 2 && (
                <div className="p-6">
                    <ResultsDisplay
                        teamX={selectedTeams[0]}
                        teamY={selectedTeams[1]}
                        results={results}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                    />
                </div>
            )}
        </>
    );
}; 