import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2, Search, Globe2, X } from 'lucide-react';
import { LEAGUE_INFO } from './FormulaSearchModal';

interface MatchPattern {
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    isSurprise?: boolean;
    matchNumber?: number;
}

interface PatternResult {
    team: string;
    season: string;
    league: string;
    matches: MatchPattern[];
    surpriseDate: string;
    surpriseOpponent: string;
    exceptionCount: number;
}

interface SurpriseAndScoresAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

// Takım Seçme Modalı
const TeamSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    teams: string[];
    onSelect: (team: string) => void;
    league: string;
}> = ({ isOpen, onClose, teams, onSelect, league }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Takım Seçin</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                
                <div className={`grid grid-cols-4 gap-4 ${league === 'UEFA' ? 'max-h-[60vh] overflow-y-auto pr-2' : ''}`}>
                    {teams.map(team => (
                        <button
                            key={team}
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

// Dünya Geneli Arama Modalı
const WorldwideSearchModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                    Ligden Sonuç Bulunamadı
                </h2>
                <p className="text-gray-400 mb-6">
                    Tüm dünyadan aramak ister misiniz?
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 
                                 hover:bg-gray-700 transition-colors"
                    >
                        Hayır
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white 
                                 hover:bg-blue-700 transition-colors"
                    >
                        Evet, Ara
                    </button>
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Sonuç Kartı Komponenti
const ResultCard: React.FC<{
    result: PatternResult;
}> = ({ result }) => (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                  border border-gray-700/30 hover:border-blue-500/30 
                  transition-all duration-300 group">
        <div className="p-6">
            <div className="flex items-center justify-between">
                {/* Sol Taraf - Takım Bilgisi */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl 
                                      opacity-0 group-hover:opacity-100 transition-opacity" />
                        <TeamLogo name={result.team} 
                                 className="w-20 h-20 relative transform 
                                          group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 
                                     transition-colors">
                            {result.team}
                        </h3>
                        <p className="text-gray-400 mt-1">{result.season} Sezonu</p>
                        <p className="text-sm text-gray-500">{LEAGUE_INFO[result.league].name}</p>
                    </div>
                </div>

                {/* Sağ Taraf - Sürpriz Maç Bilgisi */}
                <div className="text-right">
                    <div className="text-sm text-gray-400 mb-2">Sürpriz Maç</div>
                    <div className="flex items-center gap-2 justify-end">
                        <TeamLogo name={result.surpriseOpponent} className="w-5 h-5" />
                        <span className="text-gray-300">{result.surpriseOpponent}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{result.surpriseDate}</div>
                </div>
            </div>

            {/* Maç Listesi */}
            <div className="mt-6 space-y-2">
                {result.matches.map((match, idx) => (
                    <div key={idx} 
                         className={`flex items-center justify-between p-3 rounded-lg
                                   ${match.isSurprise 
                                       ? 'bg-blue-500/10 border border-blue-500/20' 
                                       : match.isException
                                       ? 'bg-orange-500/10 border border-orange-500/20'
                                       : 'bg-gray-800/50'}`}>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{match.date}</span>
                            <div className="flex items-center gap-2">
                                <TeamLogo name={match.homeTeam} className="w-5 h-5" />
                                <span className="text-gray-300">{match.homeTeam}</span>
                            </div>
                            <span className={`font-medium ${match.isException ? 'text-orange-400' : 'text-white'}`}>
                                {match.score}
                            </span>
                            <div className="flex items-center gap-2">
                                <TeamLogo name={match.awayTeam} className="w-5 h-5" />
                                <span className="text-gray-300">{match.awayTeam}</span>
                            </div>
                        </div>
                        <div className="text-sm">
                            {match.isSurprise && (
                                <span className="text-blue-400">Sürpriz Maç</span>
                            )}
                            {match.isException && (
                                <span className="text-orange-400">Farklı Skor</span>
                            )}
                            {!match.isSurprise && !match.isException && match.matchNumber && (
                                <span className="text-gray-500">
                                    {match.matchNumber}. Maç
                                </span>
                            )}
                        </div>
                    </div>
                ))}
                {result.exceptionCount > 0 && (
                    <div className="text-sm text-orange-400 mt-2">
                        {result.exceptionCount} maç farklı skorla sonuçlanmış
                    </div>
                )}
            </div>
        </div>
    </div>
);

// Yardımcı fonksiyonlar
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
};

const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Filtre tipini güncelle
type FilterType = 'exact' | 'one-diff' | 'two-diff' | 'three-diff' | 'five-diff' | 'all';

// Header komponenti
const AnalysisHeader: React.FC<{
    team: string;
    season: string;
    league: string;
    surpriseMatch: MatchPattern;
    onWorldwideSearch: () => void;
    onBack: () => void;
}> = ({ team, season, league, surpriseMatch, onWorldwideSearch, onBack }) => (
    <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/20">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl opacity-75" />
                        <TeamLogo name={team} className="w-24 h-24 relative" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{team}</h2>
                        <p className="text-gray-400">{season} Sezonu</p>
                        <p className="text-sm text-gray-500">{LEAGUE_INFO[league].name}</p>
                    </div>
                </div>
            </div>
            
            <button
                onClick={onWorldwideSearch}
                className="p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all
                         hover:scale-105 group flex items-center gap-2"
            >
                <Globe2 className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
                <span className="text-sm text-gray-400 group-hover:text-blue-400">
                    Dünyada Ara
                </span>
            </button>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Son Sürpriz Maç</div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TeamLogo name={surpriseMatch.homeTeam} className="w-6 h-6" />
                    <span className="text-white">{surpriseMatch.homeTeam}</span>
                    <span className="text-lg font-bold text-white px-3">{surpriseMatch.score}</span>
                    <TeamLogo name={surpriseMatch.awayTeam} className="w-6 h-6" />
                    <span className="text-white">{surpriseMatch.awayTeam}</span>
                </div>
                <span className="text-sm text-gray-500">{surpriseMatch.date}</span>
            </div>
        </div>
    </div>
);

// Ana komponent
export const SurpriseAndScoresAnalysis: React.FC<SurpriseAndScoresAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [results, setResults] = useState<PatternResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [showWorldwideSearch, setShowWorldwideSearch] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');

    // Ligin tüm takımlarını al
    const teams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .forEach(m => {
                teamSet.add(m.HomeTeam);
                teamSet.add(m.AwayTeam);
            });
        return Array.from(teamSet).sort();
    }, [matchData, league, season]);

    // Sürpriz maç kontrolü için yardımcı fonksiyon
    const isSurpriseMatch = (match: any) => {
        // Sadece ilk yarı lider değişen maçları sürpriz olarak kabul et
        return (match.HTR === 'H' && match.FTR === 'A') || (match.HTR === 'A' && match.FTR === 'H');
    };

    // Takımın ligini bulmak için yardımcı fonksiyon
    const findTeamLeague = (team: string, season: string) => {
        return matchData.find(m => 
            (m.HomeTeam === team || m.AwayTeam === team) && 
            m.Div !== 'UEFA' && 
            getSeasonFromDate(Number(m.Date)) === season
        )?.Div;
    };

    // Skor pattern'ini bul - Tüm ligler için UEFA maçlarını da dahil et
    const findScorePattern = (team: string) => {
        // Takımın UEFA maçları var mı kontrol et
        const hasUefaMatches = matchData.some(m => 
            m.Div === 'UEFA' && 
            getSeasonFromDate(Number(m.Date)) === season &&
            (m.HomeTeam === team || m.AwayTeam === team)
        );

        // Takımın tüm maçlarını al (lig + varsa UEFA)
        const teamMatches = matchData
            .filter(m => {
                const matchSeason = getSeasonFromDate(Number(m.Date));
                return matchSeason === season && 
                       (m.HomeTeam === team || m.AwayTeam === team) && 
                       (m.Div === league || (hasUefaMatches && m.Div === 'UEFA'));
            })
            .sort((a, b) => Number(b.Date) - Number(a.Date));

        // En son sürpriz maçı bul - yeni kontrolü kullan
        const lastSurpriseMatch = teamMatches.find(m => isSurpriseMatch(m));

        if (!lastSurpriseMatch) return null;

        // Sürpriz maçtan son maça kadar olan tüm maçları al
        const matchIndex = teamMatches.findIndex(m => m === lastSurpriseMatch);
        const patternMatches = teamMatches.slice(0, matchIndex + 1).reverse();

        // Pattern'i oluştur
        return patternMatches.map((match, idx) => ({
            date: formatDate(Number(match.Date)),
            homeTeam: match.HomeTeam,
            awayTeam: match.AwayTeam,
            score: `${match.FTHG}-${match.FTAG}`,
            isSurprise: match === lastSurpriseMatch,
            matchNumber: idx
        }));
    };

    // Pattern'i diğer takımlarda ara - Tüm ligler için UEFA maçlarını da dahil et
    const searchPattern = async (pattern: MatchPattern[], searchWorldwide: boolean = false) => {
        const results: PatternResult[] = [];

        if (!searchWorldwide) {
            // Önce seçili takımın önceki sezonlarında ara
            const previousSeasons = new Set(
                matchData
                    .filter(m => m.Div === league || m.Div === 'UEFA')
                    .map(m => getSeasonFromDate(Number(m.Date)))
                    .filter(s => s !== season)
            );

            // Seçili takımın önceki sezonlarında ara
            previousSeasons.forEach(checkingSeason => {
                // O sezonda UEFA'da oynuyor mu kontrol et
                const hasUefaInSeason = matchData.some(m => 
                    m.Div === 'UEFA' && 
                    getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                    (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
                );

                const seasonMatches = matchData
                    .filter(m => 
                        getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                        (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam) &&
                        (m.Div === league || (hasUefaInSeason && m.Div === 'UEFA'))
                    )
                    .sort((a, b) => Number(a.Date) - Number(b.Date));

                checkPatternInMatches(seasonMatches, selectedTeam!, checkingSeason, league, pattern, results);
            });

            // Eğer önceki sezonlarda sonuç bulunamadıysa
            if (results.length === 0) {
                // Ligin diğer takımlarında ara
                const otherTeams = new Set(
                    matchData
                        .filter(m => m.Div === league)
                        .flatMap(m => [m.HomeTeam, m.AwayTeam])
                        .filter(t => t !== selectedTeam)
                );

                otherTeams.forEach(team => {
                    previousSeasons.forEach(checkingSeason => {
                        // O takımın o sezonda UEFA maçları var mı kontrol et
                        const hasUefaInSeason = matchData.some(m => 
                            m.Div === 'UEFA' && 
                            getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                            (m.HomeTeam === team || m.AwayTeam === team)
                        );

                        const teamMatches = matchData
                            .filter(m => 
                                getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                                (m.HomeTeam === team || m.AwayTeam === team) &&
                                (m.Div === league || (hasUefaInSeason && m.Div === 'UEFA'))
                            )
                            .sort((a, b) => Number(a.Date) - Number(b.Date));

                        checkPatternInMatches(teamMatches, team, checkingSeason, league, pattern, results);
                    });
                });
            }
        } else {
            // Worldwide arama mantığı aynı kalabilir...
        }

        return results;
    };

    // Yardımcı fonksiyon: Maç listesinde pattern'i kontrol et
    const checkPatternInMatches = (
        matches: any[],
        team: string,
        checkingSeason: string,
        checkingLeague: string,
        pattern: MatchPattern[],
        results: PatternResult[]
    ) => {
        for (let i = 0; i < matches.length - pattern.length + 1; i++) {
            const potentialPattern = matches.slice(i, i + pattern.length);
            
            // İlk maçın sürpriz maç olup olmadığını kontrol et
            const firstMatch = potentialPattern[0];
            if (!isSurpriseMatch(firstMatch)) {
                continue; // Sürpriz maç değilse bu pattern'i atla
            }

            const matchedMatches = potentialPattern.map((match, idx) => {
                const currentScore = `${match.FTHG}-${match.FTAG}`;
                const [h1, a1] = currentScore.split('-').map(Number);
                const [h2, a2] = pattern[idx].score.split('-').map(Number);
                
                const isScoreMatch = (h1 === h2 && a1 === a2) || (h1 === a2 && a1 === h2);

                return {
                    date: formatDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    score: currentScore,
                    matchNumber: idx,
                    isSurprise: idx === 0,
                    isException: !isScoreMatch
                };
            });

            // Exception sayısını hesapla
            const exceptionCount = matchedMatches.filter(m => m.isException).length;

            // En fazla 5 exception'a izin ver
            if (exceptionCount <= 5) {
                results.push({
                    team,
                    season: checkingSeason,
                    league: checkingLeague,
                    matches: matchedMatches,
                    surpriseDate: matchedMatches[0].date,
                    surpriseOpponent: matchedMatches[0].homeTeam === team 
                        ? matchedMatches[0].awayTeam 
                        : matchedMatches[0].homeTeam,
                    exceptionCount
                });
            }
        }
    };

    // Takım seçildiğinde
    const handleTeamSelect = async (team: string) => {
        setSelectedTeam(team);
        setShowTeamSelection(false);
        setIsAnalyzing(true);

        const pattern = findScorePattern(team);
        if (!pattern) {
            setIsAnalyzing(false);
            return;
        }

        // Önce sadece ligde ara
        const leagueResults = await searchPattern(pattern, false);
        
        if (leagueResults.length === 0) {
            // Ligde sonuç bulunamadıysa dünya geneli arama seçeneği sun
            setIsAnalyzing(false);
            setShowWorldwideSearch(true);
        } else {
            setResults(leagueResults);
            setIsAnalyzing(false);
        }
    };

    // Dünya genelinde arama
    const handleWorldwideSearch = async () => {
        setIsAnalyzing(true);
        const pattern = findScorePattern(selectedTeam!);
        if (pattern) {
            const worldwideResults = await searchPattern(pattern, true);
            setResults(worldwideResults);
        }
        setIsAnalyzing(false);
        setShowWorldwideSearch(false); // Modal'ı kapat
    };

    // Filtrelenmiş sonuçları hesapla
    const filteredResults = useMemo(() => {
        if (filter === 'all') return results;
        
        return results.filter(result => {
            switch (filter) {
                case 'exact':
                    return result.exceptionCount === 0;
                case 'one-diff':
                    return result.exceptionCount === 1;
                case 'two-diff':
                    return result.exceptionCount === 2;
                case 'three-diff':
                    return result.exceptionCount === 3;
                case 'five-diff':
                    return result.exceptionCount === 4 || result.exceptionCount === 5;
                default:
                    return true;
            }
        });
    }, [results, filter]);

    return (
        <>
            <TeamSelectionModal
                isOpen={showTeamSelection}
                onClose={onClose}
                teams={teams}
                onSelect={handleTeamSelect}
                league={league}
            />

            <WorldwideSearchModal
                isOpen={showWorldwideSearch}
                onClose={() => setShowWorldwideSearch(false)}
                onConfirm={handleWorldwideSearch}
            />

            {!showTeamSelection && selectedTeam && (
                <div className="p-6 h-[calc(100vh-2rem)] flex flex-col">
                    {/* Pattern kontrolü ekle */}
                    {(() => {
                        const pattern = findScorePattern(selectedTeam);
                        if (!pattern) {
                            return (
                                <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                    <p className="text-gray-400">
                                        Seçili takım için sürpriz maç bulunamadı.
                                    </p>
                                </div>
                            );
                        }

                        return (
                            <>
                                <AnalysisHeader
                                    team={selectedTeam}
                                    season={season}
                                    league={league}
                                    surpriseMatch={pattern[0]}
                                    onWorldwideSearch={handleWorldwideSearch}
                                    onBack={() => {
                                        setSelectedTeam(null);
                                        setResults([]);
                                        setShowTeamSelection(true);
                                        setFilter('all');
                                    }}
                                />

                                {/* Filtre Butonları */}
                                <div className="flex items-center gap-2 mb-6">
                                    <button
                                        onClick={() => setFilter('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                            ${filter === 'all' 
                                                ? 'bg-gray-700 text-white' 
                                                : 'text-gray-400 hover:bg-gray-800'}`}
                                    >
                                        Tümü
                                    </button>
                                    <button
                                        onClick={() => setFilter('exact')}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                            ${filter === 'exact' 
                                                ? 'bg-green-500/20 text-green-400' 
                                                : 'text-gray-400 hover:bg-gray-800'}`}
                                    >
                                        Birebir Eşleşen
                                    </button>
                                    <button
                                        onClick={() => setFilter('one-diff')}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                            ${filter === 'one-diff' 
                                                ? 'bg-blue-500/20 text-blue-400' 
                                                : 'text-gray-400 hover:bg-gray-800'}`}
                                    >
                                        1 Fark
                                    </button>
                                    <button
                                        onClick={() => setFilter('two-diff')}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                            ${filter === 'two-diff' 
                                                ? 'bg-yellow-500/20 text-yellow-400' 
                                                : 'text-gray-400 hover:bg-gray-800'}`}
                                    >
                                        2 Fark
                                    </button>
                                    <button
                                        onClick={() => setFilter('three-diff')}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                            ${filter === 'three-diff' 
                                                ? 'bg-orange-500/20 text-orange-400' 
                                                : 'text-gray-400 hover:bg-gray-800'}`}
                                    >
                                        3 Fark
                                    </button>
                                    <button
                                        onClick={() => setFilter('five-diff')}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                                            ${filter === 'five-diff' 
                                                ? 'bg-red-500/20 text-red-400' 
                                                : 'text-gray-400 hover:bg-gray-800'}`}
                                    >
                                        5 Fark
                                    </button>
                                </div>

                                {/* Sonuçlar */}
                                <div className="flex-1 overflow-y-auto pr-2">
                                    {isAnalyzing ? (
                                        <div className="flex flex-col items-center justify-center py-20">
                                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                            <p className="text-gray-400">Analiz yapılıyor...</p>
                                        </div>
                                    ) : filteredResults.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredResults.map((result, idx) => (
                                                <ResultCard key={idx} result={result} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                            <p className="text-gray-400">
                                                {results.length > 0 
                                                    ? 'Bu filtrede sonuç bulunamadı.' 
                                                    : 'Benzer pattern bulunamadı.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </>
    );
}; 