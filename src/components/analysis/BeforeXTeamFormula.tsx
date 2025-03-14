import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
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

interface BeforeXTeamFormulaProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    surpriseMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
        previousHomeMatch?: {
            opponent: string;
            htScore: string;
            ftScore: string;
            date: string;
        };
        previousAwayMatch?: {
            opponent: string;
            htScore: string;
            ftScore: string;
            date: string;
        };
    };
    matchWithY: {
        date: string;
        score: string;
        isHome: boolean;
    };
}

// Takım Seçme Modalı
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
    selectedTeams: string[];
    title: string;
}> = ({ isOpen, onClose, teams, onSelect, selectedTeams, title }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
                <p className="text-gray-400 mb-6">
                    {selectedTeams.length === 0 ? "X Takımını Seçin" : "Y Takımını Seçin"}
                </p>
                
                {/* Scroll container */}
                <div className="grid grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {teams
                        .filter(team => !selectedTeams.includes(team))
                        .map((team, index) => (
                            <button
                                key={`${team}-${index}`}
                                onClick={() => onSelect(team)}
                                className="flex flex-col items-center p-4 rounded-xl 
                                         bg-gray-800/50 hover:bg-gray-800/70 transition-all
                                         hover:scale-105 hover:shadow-lg"
                            >
                                <TeamLogo name={team} className="w-16 h-16 mb-2" />
                                <span className="text-sm text-gray-300">{team}</span>
                            </button>
                        ))}
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    teamX: string;
    teamY: string;
    results: AnalysisResult[];
    onBack: () => void;
    isAnalyzing: boolean;
    matchData: any[];
}> = ({ teamX, teamY, results, onBack, isAnalyzing, matchData }) => {
    const [showNonSurprises, setShowNonSurprises] = useState(false);
    const [nonSurpriseResults, setNonSurpriseResults] = useState<AnalysisResult[]>([]);
    const [isAnalyzingNonSurprises, setIsAnalyzingNonSurprises] = useState(false);

    const handleShowNonSurprises = () => {
        setShowNonSurprises(true);
        setIsAnalyzingNonSurprises(true);

        // Analizi başlat
        setTimeout(() => {
            const results = analyzeBeforeXTeam(teamX, teamY, matchData, false); // false = sürpriz filtresi olmadan
            setNonSurpriseResults(results);
            setIsAnalyzingNonSurprises(false);
        }, 100);
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
                          rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden">
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
                        <ArrowRight className="w-6 h-6 text-blue-300" />
                        <TeamLogo name={teamY} className="w-16 h-16" />
                    </div>
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-white">X Takımdan Önce Analizi</h2>
                        <p className="text-blue-200 mt-1">
                            {teamX}'in sürpriz sonrası {teamY} karşılaşmaları
                        </p>
                    </div>
                </div>
            </div>

            {/* Sonuçlar - Scrollable container */}
            <div className="flex-1 overflow-auto mt-8 px-2">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Analiz yapılıyor...</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-8">
                        {/* Sürpriz Maçlar Bölümü */}
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">Sürpriz Maçlar</h3>
                            <div className="space-y-6">
                                {results.map((result, idx) => (
                                    <div key={idx} 
                                         className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                                  border border-gray-700/30 hover:border-blue-500/30 
                                                  transition-all duration-300 p-6">
                                        {/* Sürpriz Maç */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 group relative">
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={result.surpriseMatch.homeTeam} className="w-10 h-10" />
                                                        <span className="text-gray-200">{result.surpriseMatch.homeTeam}</span>
                                                    </div>
                                                    <span className="text-gray-400">vs</span>
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={result.surpriseMatch.awayTeam} className="w-10 h-10" />
                                                        <span className="text-gray-200">{result.surpriseMatch.awayTeam}</span>
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute left-full top-0 ml-4 w-96 
                                                                    bg-gray-900/95 backdrop-blur rounded-lg p-6 
                                                                    shadow-xl opacity-0 invisible
                                                                    group-hover:opacity-100 group-hover:visible 
                                                                    transition-all duration-200 z-[9999]
                                                                    border border-gray-700/50">
                                                        {/* Ok işareti */}
                                                        <div className="absolute left-0 top-4 -translate-x-full">
                                                            <div className="border-8 border-transparent 
                                                                          border-r-gray-900/95 
                                                                          h-0 w-0" />
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            {result.surpriseMatch.previousHomeMatch && (
                                                                <div>
                                                                    <div className="text-sm mb-3">
                                                                        <span className="text-blue-400">{result.surpriseMatch.homeTeam}</span>'nin önceki maçı:
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-6">
                                                                            <div className="flex flex-col items-center">
                                                                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-8 h-8 mb-1" />
                                                                                <span className="text-gray-300 text-sm">{result.surpriseMatch.homeTeam}</span>
                                                                            </div>
                                                                            <span className="text-gray-500">vs</span>
                                                                            <div className="flex flex-col items-center">
                                                                                <TeamLogo name={result.surpriseMatch.previousHomeMatch.opponent} className="w-8 h-8 mb-1" />
                                                                                <span className="text-gray-300 text-sm">{result.surpriseMatch.previousHomeMatch.opponent}</span>
                                                                            </div>
                                                                        </div>
                                                                        <span className={result.surpriseMatch.homeTeam === teamX ? 
                                                                            "text-green-400 text-lg" : "text-gray-300 text-lg"}>
                                                                            {result.surpriseMatch.previousHomeMatch.htScore} →{' '}
                                                                            {result.surpriseMatch.previousHomeMatch.ftScore}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-2">
                                                                        {result.surpriseMatch.previousHomeMatch.date}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {result.surpriseMatch.previousAwayMatch && (
                                                                <div className="mt-4 pt-4 border-t border-gray-800">
                                                                    <div className="text-sm mb-3">
                                                                        <span className="text-red-400">{result.surpriseMatch.awayTeam}</span>'nin önceki maçı:
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-6">
                                                                            <div className="flex flex-col items-center">
                                                                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-8 h-8 mb-1" />
                                                                                <span className="text-gray-300 text-sm">{result.surpriseMatch.awayTeam}</span>
                                                                            </div>
                                                                            <span className="text-gray-500">vs</span>
                                                                            <div className="flex flex-col items-center">
                                                                                <TeamLogo name={result.surpriseMatch.previousAwayMatch.opponent} className="w-8 h-8 mb-1" />
                                                                                <span className="text-gray-300 text-sm">{result.surpriseMatch.previousAwayMatch.opponent}</span>
                                                                            </div>
                                                                        </div>
                                                                        <span className={result.surpriseMatch.awayTeam === teamX ? 
                                                                            "text-green-400 text-lg" : "text-gray-300 text-lg"}>
                                                                            {result.surpriseMatch.previousAwayMatch.htScore} →{' '}
                                                                            {result.surpriseMatch.previousAwayMatch.ftScore}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-2">
                                                                        {result.surpriseMatch.previousAwayMatch.date}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-blue-400">{result.surpriseMatch.date}</div>
                                                    <div className="text-lg font-semibold text-white">
                                                        {result.surpriseMatch.htScore} → {result.surpriseMatch.ftScore}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Y ile Maç */}
                                        <div className="mt-4 p-4 bg-blue-900/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {result.matchWithY.isHome ? (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={teamX} className="w-8 h-8" />
                                                                <span className="text-gray-200">{teamX}</span>
                                                            </div>
                                                            <span className="text-blue-400">vs</span>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={teamY} className="w-8 h-8" />
                                                                <span className="text-gray-200">{teamY}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={teamY} className="w-8 h-8" />
                                                                <span className="text-gray-200">{teamY}</span>
                                                            </div>
                                                            <span className="text-blue-400">vs</span>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={teamX} className="w-8 h-8" />
                                                                <span className="text-gray-200">{teamX}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-blue-400">{result.matchWithY.date}</div>
                                                    <div className="text-white">{result.matchWithY.score}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Başarısız Sürprizler Bölümü */}
                        {showNonSurprises ? (
                            <div>
                                <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                                    <span>Başarısız Sürprizler</span>
                                    <span className="text-sm font-normal text-gray-500">
                                        (İlk yarı üstünlüğünü koruyabilen maçlar)
                                    </span>
                                </h3>
                                {isAnalyzingNonSurprises ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                        <p className="text-gray-400">Analiz yapılıyor...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {nonSurpriseResults.map((result, idx) => (
                                            <div key={idx} 
                                                 className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                                          border border-gray-700/30 hover:border-blue-500/30 
                                                          transition-all duration-300 p-6">
                                                {/* Sürpriz Maç */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 group relative">
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-10 h-10" />
                                                                <span className="text-gray-200">{result.surpriseMatch.homeTeam}</span>
                                                            </div>
                                                            <span className="text-gray-400">vs</span>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-10 h-10" />
                                                                <span className="text-gray-200">{result.surpriseMatch.awayTeam}</span>
                                                            </div>

                                                            {/* Tooltip */}
                                                            <div className="absolute left-full top-0 ml-4 w-96 
                                                                            bg-gray-900/95 backdrop-blur rounded-lg p-6 
                                                                            shadow-xl opacity-0 invisible
                                                                            group-hover:opacity-100 group-hover:visible 
                                                                            transition-all duration-200 z-[9999]
                                                                            border border-gray-700/50">
                                                                {/* Ok işareti */}
                                                                <div className="absolute left-0 top-4 -translate-x-full">
                                                                    <div className="border-8 border-transparent 
                                                                                  border-r-gray-900/95 
                                                                                  h-0 w-0" />
                                                                </div>
                                                                
                                                                <div className="space-y-4">
                                                                    {result.surpriseMatch.previousHomeMatch && (
                                                                        <div>
                                                                            <div className="text-sm mb-3">
                                                                                <span className="text-blue-400">{result.surpriseMatch.homeTeam}</span>'nin önceki maçı:
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-6">
                                                                                    <div className="flex flex-col items-center">
                                                                                        <TeamLogo name={result.surpriseMatch.homeTeam} className="w-8 h-8 mb-1" />
                                                                                        <span className="text-gray-300 text-sm">{result.surpriseMatch.homeTeam}</span>
                                                                                    </div>
                                                                                    <span className="text-gray-500">vs</span>
                                                                                    <div className="flex flex-col items-center">
                                                                                        <TeamLogo name={result.surpriseMatch.previousHomeMatch.opponent} className="w-8 h-8 mb-1" />
                                                                                        <span className="text-gray-300 text-sm">{result.surpriseMatch.previousHomeMatch.opponent}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <span className={result.surpriseMatch.homeTeam === teamX ? 
                                                                                    "text-green-400 text-lg" : "text-gray-300 text-lg"}>
                                                                                    {result.surpriseMatch.previousHomeMatch.htScore} →{' '}
                                                                                    {result.surpriseMatch.previousHomeMatch.ftScore}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 mt-2">
                                                                                {result.surpriseMatch.previousHomeMatch.date}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {result.surpriseMatch.previousAwayMatch && (
                                                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                                                            <div className="text-sm mb-3">
                                                                                <span className="text-red-400">{result.surpriseMatch.awayTeam}</span>'nin önceki maçı:
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-6">
                                                                                    <div className="flex flex-col items-center">
                                                                                        <TeamLogo name={result.surpriseMatch.awayTeam} className="w-8 h-8 mb-1" />
                                                                                        <span className="text-gray-300 text-sm">{result.surpriseMatch.awayTeam}</span>
                                                                                    </div>
                                                                                    <span className="text-gray-500">vs</span>
                                                                                    <div className="flex flex-col items-center">
                                                                                        <TeamLogo name={result.surpriseMatch.previousAwayMatch.opponent} className="w-8 h-8 mb-1" />
                                                                                        <span className="text-gray-300 text-sm">{result.surpriseMatch.previousAwayMatch.opponent}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <span className={result.surpriseMatch.awayTeam === teamX ? 
                                                                                    "text-green-400 text-lg" : "text-gray-300 text-lg"}>
                                                                                    {result.surpriseMatch.previousAwayMatch.htScore} →{' '}
                                                                                    {result.surpriseMatch.previousAwayMatch.ftScore}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 mt-2">
                                                                                {result.surpriseMatch.previousAwayMatch.date}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-blue-400">{result.surpriseMatch.date}</div>
                                                            <div className="text-lg font-semibold text-white">
                                                                {result.surpriseMatch.htScore} → {result.surpriseMatch.ftScore}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Y ile Maç */}
                                                <div className="mt-4 p-4 bg-blue-900/20 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            {result.matchWithY.isHome ? (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <TeamLogo name={teamX} className="w-8 h-8" />
                                                                        <span className="text-gray-200">{teamX}</span>
                                                                    </div>
                                                                    <span className="text-blue-400">vs</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <TeamLogo name={teamY} className="w-8 h-8" />
                                                                        <span className="text-gray-200">{teamY}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center gap-2">
                                                                        <TeamLogo name={teamY} className="w-8 h-8" />
                                                                        <span className="text-gray-200">{teamY}</span>
                                                                    </div>
                                                                    <span className="text-blue-400">vs</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <TeamLogo name={teamX} className="w-8 h-8" />
                                                                        <span className="text-gray-200">{teamX}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-blue-400">{result.matchWithY.date}</div>
                                                            <div className="text-white">{result.matchWithY.score}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={handleShowNonSurprises}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 
                                             text-white rounded-lg transition-colors
                                             flex items-center gap-2"
                                >
                                    <span>Başarısız Sürprizleri Göster</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Analiz Fonksiyonu
const analyzeBeforeXTeam = (
    teamX: string,
    teamY: string,
    matchData: any[],
    onlySurprises: boolean = true
): AnalysisResult[] => {
    const results: AnalysisResult[] = [];
    
    const sortedMatches = [...matchData].sort((a, b) => {
        const dateA = new Date(Number(a.Date)).getTime();
        const dateB = new Date(Number(b.Date)).getTime();
        return dateA - dateB;
    });

    // Önceki maçı bulan yardımcı fonksiyon
    const findPreviousMatch = (team: string, currentDate: number) => {
        for (let i = sortedMatches.length - 1; i >= 0; i--) {
            const match = sortedMatches[i];
            if (Number(match.Date) >= currentDate) continue;
            
            if (match.HomeTeam === team || match.AwayTeam === team) {
                return {
                    opponent: match.HomeTeam === team ? match.AwayTeam : match.HomeTeam,
                    htScore: `${match.HTHG}-${match.HTAG}`,
                    ftScore: `${match.FTHG}-${match.FTAG}`,
                    date: formatDate(Number(match.Date))
                };
            }
        }
        return undefined;
    };

    console.log(`${teamX} ve ${teamY} için analiz başlıyor...`);

    // Her maçı kontrol et
    for (let i = 0; i < sortedMatches.length - 1; i++) {
        const match = sortedMatches[i];
        
        const isXMatch = match.HomeTeam === teamX || match.AwayTeam === teamX;
        if (!isXMatch) continue;

        // Sürpriz kontrolünü onlySurprises parametresine göre yap
        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                          (match.HTR === 'A' && match.FTR === 'H');
        if (onlySurprises && !isSurprise) continue;

        console.log(`Sürpriz maç bulundu:`, {
            date: formatDate(Number(match.Date)),
            match: `${match.HomeTeam} vs ${match.AwayTeam}`,
            htScore: `${match.HTHG}-${match.HTAG}`,
            ftScore: `${match.FTHG}-${match.FTAG}`
        });

        // 3. Bu maçtan sonraki ilk maçı bul
        const matchDate = new Date(Number(match.Date)).getTime();
        
        // Önceki maçları bul
        const currentDate = Number(match.Date);
        const homeTeam = match.HomeTeam;
        const awayTeam = match.AwayTeam;

        const previousHomeMatch = findPreviousMatch(homeTeam, currentDate);
        const previousAwayMatch = findPreviousMatch(awayTeam, currentDate);

        // Bu maçtan sonraki tüm maçları kontrol et
        for (let j = i + 1; j < sortedMatches.length; j++) {
            const nextMatch = sortedMatches[j];
            const nextDate = new Date(Number(nextMatch.Date)).getTime();
            
            // Eğer bu maç X vs Y maçı ise
            const isXYMatch = (
                (nextMatch.HomeTeam === teamX && nextMatch.AwayTeam === teamY) ||
                (nextMatch.HomeTeam === teamY && nextMatch.AwayTeam === teamX)
            );

            if (isXYMatch) {
                console.log(`Ve sonraki maç ${teamY} ile:`, {
                    date: formatDate(Number(nextMatch.Date)),
                    match: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`,
                    score: `${nextMatch.FTHG}-${nextMatch.FTAG}`,
                    daysDiff: Math.round((nextDate - matchDate) / (1000 * 60 * 60 * 24))
                });

                results.push({
                    surpriseMatch: {
                        date: formatDate(Number(match.Date)),
                        homeTeam: match.HomeTeam,
                        awayTeam: match.AwayTeam,
                        htScore: `${match.HTHG}-${match.HTAG}`,
                        ftScore: `${match.FTHG}-${match.FTAG}`,
                        previousHomeMatch,
                        previousAwayMatch
                    },
                    matchWithY: {
                        date: formatDate(Number(nextMatch.Date)),
                        score: `${nextMatch.FTHG}-${nextMatch.FTAG}`,
                        isHome: nextMatch.HomeTeam === teamX
                    }
                });
                break; // Bu sürpriz maç için ilk Y maçını bulduk, diğerlerine bakmaya gerek yok
            }

            // Eğer başka bir X maçı bulduysa, bu sürpriz için Y maçı yok demektir
            if (nextMatch.HomeTeam === teamX || nextMatch.AwayTeam === teamX) {
                break;
            }
        }
    }

    console.log(`Analiz tamamlandı. ${results.length} sonuç bulundu.`);
    return results;
};

// Ana Komponent
export const BeforeXTeamFormula: React.FC<BeforeXTeamFormulaProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Ligin tüm takımlarını al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league)
            .forEach(m => {
                teamSet.add(m.HomeTeam);
                teamSet.add(m.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league]);

    const handleTeamSelect = (team: string) => {
        const newSelectedTeams = [...selectedTeams, team];
        setSelectedTeams(newSelectedTeams);

        if (newSelectedTeams.length === 2) {
            setShowTeamSelection(false);
            setIsAnalyzing(true);
            
            setTimeout(() => {
                const analysisResults = analyzeBeforeXTeam(
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
        setResults([]);
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
                title="X Takımdan Önce Formülü için Takım Seçin"
            />

            {!showTeamSelection && selectedTeams.length === 2 && (
                <div className="p-6">
                    <ResultsDisplay
                        teamX={selectedTeams[0]}
                        teamY={selectedTeams[1]}
                        results={results}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                        matchData={matchData}
                    />
                </div>
            )}
        </>
    );
}; 