import React, { useState, useMemo } from 'react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, ChevronDown, ChevronUp, Search } from 'lucide-react';

// Yardımcı fonksiyonlar
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const calculateSeason = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year-1}-${year}`;
};

interface TeamAllSurprisesProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface SurpriseResult {
    season: string;
    surpriseMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
    };
    previousMatches: Array<{
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
        isHome: boolean;
    }>;
}

export function TeamAllSurprisesAnalysis({
    league,
    season,
    matchData,
    onClose
}: TeamAllSurprisesProps) {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [showPreviousMatches, setShowPreviousMatches] = useState(true);
    const [searchOpponent, setSearchOpponent] = useState('');
    const [openResults, setOpenResults] = useState<number[]>([]);

    // Ligteki tüm takımları al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league)
            .forEach(match => {
                teamSet.add(match.HomeTeam);
                teamSet.add(match.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league]);

    // Takım ismini güvenli bir şekilde render et
    const renderTeamName = (teamName: string) => {
        return (
            <span className="text-sm text-gray-300 text-center font-medium">
                {teamName}
            </span>
        );
    };

    // Sürprizleri analiz et
    const analyzeTeamSurprises = (team: string): SurpriseResult[] => {
        const results: SurpriseResult[] = [];

        // Takımın tüm sürpriz maçlarını bul (tüm sezonlar için)
        const surpriseMatches = matchData
            .filter(m => 
                // Lig kontrolünü ekleyelim
                m.Div === league &&
                // Sürpriz kontrolü
                ((m.HomeTeam === team && m.HTR === 'H' && m.FTR === 'A') || 
                 (m.AwayTeam === team && m.HTR === 'A' && m.FTR === 'H'))
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date)); // En yeni sürprizler üstte

        surpriseMatches.forEach(surpriseMatch => {
            // Sürpriz maçtan önceki son 5 maçı bul
            const previousMatches = matchData
                .filter(m => 
                    m.Div === league && // Aynı ligdeki maçlar
                    (m.HomeTeam === team || m.AwayTeam === team) &&
                    Number(m.Date) < Number(surpriseMatch.Date)
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date)) // Eskiden yeniye sırala
                .slice(-5);

            if (previousMatches.length === 5) {
                const matchDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                results.push({
                    season: calculateSeason(matchDate),
                    surpriseMatch: {
                        date: formatDate(Number(surpriseMatch.Date)),
                        homeTeam: surpriseMatch.HomeTeam,
                        awayTeam: surpriseMatch.AwayTeam,
                        htScore: `${surpriseMatch.HTHG}-${surpriseMatch.HTAG}`,
                        ftScore: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`
                    },
                    previousMatches: previousMatches.map(match => ({
                        date: formatDate(Number(match.Date)),
                        homeTeam: match.HomeTeam,
                        awayTeam: match.AwayTeam,
                        htScore: `${match.HTHG}-${match.HTAG}`,
                        ftScore: `${match.FTHG}-${match.FTAG}`,
                        isHome: match.HomeTeam === team
                    }))
                });
            }
        });

        return results;
    };

    // Filtrelenmiş sonuçlar
    const filteredResults = useMemo(() => {
        if (!selectedTeam) return [];
        
        const results = analyzeTeamSurprises(selectedTeam);
        if (!searchOpponent) return results;

        return results.filter(result => 
            result.previousMatches.some(match => 
                match.homeTeam.toLowerCase().includes(searchOpponent.toLowerCase()) ||
                match.awayTeam.toLowerCase().includes(searchOpponent.toLowerCase())
            )
        );
    }, [selectedTeam, searchOpponent, matchData]);

    return (
        <div className="space-y-6 h-[calc(100vh-200px)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <h2 className="text-xl font-semibold text-white">
                        Takım Tüm Sürprizler
                    </h2>
                </div>
                
                {selectedTeam && (
                    <div className="flex items-center gap-4">
                        {/* Son 2 Maç Göster/Gizle */}
                        <button
                            onClick={() => setShowPreviousMatches(!showPreviousMatches)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 
                                     rounded-lg transition-colors text-gray-300"
                        >
                            {showPreviousMatches ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    <span>Son 2 Maçı Gizle</span>
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    <span>Son 2 Maçı Göster</span>
                                </>
                            )}
                        </button>

                        {/* Rakip Arama */}
                        <div className="w-64">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchOpponent}
                                    onChange={(e) => setSearchOpponent(e.target.value)}
                                    placeholder="Rakip takım ara..."
                                    className="w-full p-3 pl-10 rounded-lg bg-gray-800 text-gray-300 
                                             border border-gray-700 focus:border-blue-500 transition-colors"
                                />
                                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!selectedTeam ? (
                // Takım Seçim Ekranı
                <div className="grid grid-cols-6 gap-4 p-4 overflow-y-auto">
                    {teams.map(team => (
                        <button
                            key={team}
                            onClick={() => setSelectedTeam(team)}
                            className="flex flex-col items-center gap-3 p-4 bg-gray-800/50 
                                     hover:bg-gray-700/50 rounded-xl transition-colors group"
                        >
                            <div className="relative">
                                <TeamLogo 
                                    name={team} 
                                    className="w-20 h-20 transition-transform group-hover:scale-110" 
                                />
                            </div>
                            {renderTeamName(team)}
                        </button>
                    ))}
                </div>
            ) : (
                // Sonuçlar
                <div className="overflow-y-auto flex-1 pr-4">
                    <div className="space-y-4">
                        {filteredResults.map((result, index) => (
                            <div key={index} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50">
                                {/* Sürpriz Maç */}
                                <button
                                    onClick={() => setOpenResults(prev => 
                                        prev.includes(index) 
                                            ? prev.filter(i => i !== index)
                                            : [...prev, index]
                                    )}
                                    className="w-full p-6 hover:bg-gray-700/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-4">
                                                <TeamLogo name={result.surpriseMatch.homeTeam} className="w-16 h-16" />
                                                <span className="text-2xl text-gray-400">vs</span>
                                                <TeamLogo name={result.surpriseMatch.awayTeam} className="w-16 h-16" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 text-lg">
                                                    <span className="text-white font-medium">{result.surpriseMatch.homeTeam}</span>
                                                    <span className="text-gray-400">vs</span>
                                                    <span className="text-white font-medium">{result.surpriseMatch.awayTeam}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <div className="flex items-center gap-4 text-lg">
                                                <div className="px-3 py-1 rounded bg-purple-900/20 border border-purple-900/30">
                                                    <span className="text-purple-300">İY: {result.surpriseMatch.htScore}</span>
                                                </div>
                                                <div className="px-3 py-1 rounded bg-blue-900/20 border border-blue-900/30">
                                                    <span className="text-blue-300">MS: {result.surpriseMatch.ftScore}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-400">{result.surpriseMatch.date}</div>
                                                <div className="text-sm text-gray-500">{result.season}</div>
                                            </div>
                                        </div>
                                    </div>
                                </button>

                                {/* Önceki Maçlar */}
                                {showPreviousMatches && openResults.includes(index) && (
                                    <div className="p-6 pt-0">
                                        <div className="text-sm text-gray-400 mb-3 font-medium">Son 5 Maç:</div>
                                        <div className="space-y-2">
                                            {result.previousMatches.map((match, matchIndex) => (
                                                <div 
                                                    key={matchIndex}
                                                    className={`flex items-center justify-between p-4 rounded-lg 
                                                              transition-colors ${
                                                        matchIndex === 4 
                                                            ? 'bg-yellow-900/20 border border-yellow-900/30' // Son maç
                                                            : 'bg-gray-800/70 border border-gray-700/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-8">
                                                        <div className="flex items-center gap-4">
                                                            <TeamLogo name={match.homeTeam} className="w-12 h-12" />
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-xl text-gray-400">vs</span>
                                                                <span className="text-xs text-gray-500 mt-1">
                                                                    {match.isHome ? 'Ev' : 'Dep'}
                                                                </span>
                                                            </div>
                                                            <TeamLogo name={match.awayTeam} className="w-12 h-12" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-white ${match.isHome ? 'font-medium' : ''}`}>
                                                                    {match.homeTeam}
                                                                </span>
                                                                <span className="text-gray-400">vs</span>
                                                                <span className={`text-white ${!match.isHome ? 'font-medium' : ''}`}>
                                                                    {match.awayTeam}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="px-3 py-1 rounded bg-purple-900/20 border border-purple-900/30">
                                                                <span className="text-purple-300">İY: {match.htScore}</span>
                                                            </div>
                                                            <div className="px-3 py-1 rounded bg-blue-900/20 border border-blue-900/30">
                                                                <span className="text-blue-300">MS: {match.ftScore}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-gray-400 text-sm">{match.date}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {filteredResults.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-gray-400">
                                    {searchOpponent 
                                        ? 'Aranan rakiple ilgili sonuç bulunamadı.'
                                        : 'Seçilen takım için sürpriz sonuç bulunamadı.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 