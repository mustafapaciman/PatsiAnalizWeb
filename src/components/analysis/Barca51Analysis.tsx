import React, { useState, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { LEAGUE_INFO } from './FormulaSearchModal';

interface Barca51Match {
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    htScore?: string;  // İlk yarı skoru için
    isHighScore?: boolean;
    isDraw?: boolean;
    isSurprise?: boolean;
}

interface Barca51Result {
    surpriseTeam: string;    // K takımı
    season: string;
    matches: {
        dominantMatch: Barca51Match;  // X vs Y maçı
        drawMatch: Barca51Match;      // Y vs K maçı
        surpriseMatch: Barca51Match;  // X vs K maçı
    };
}

interface Barca51AnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

// Maç kartı komponenti
const MatchCard: React.FC<{
    match: Barca51Match;
}> = ({ match }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg
                    ${match.isHighScore ? 'bg-red-500/10 border border-red-500/20' :
                      match.isDraw ? 'bg-blue-500/10 border border-blue-500/20' :
                      'bg-green-500/10 border border-green-500/20'}`}>
        <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{match.date}</span>
            <div className="flex items-center gap-2">
                <TeamLogo name={match.homeTeam} className="w-6 h-6" />
                <span className="text-gray-300">{match.homeTeam}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-white font-medium">{match.score}</span>
                {match.htScore && (
                    <span className="text-gray-500 text-sm">
                        (İY: {match.htScore})
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <TeamLogo name={match.awayTeam} className="w-6 h-6" />
                <span className="text-gray-300">{match.awayTeam}</span>
            </div>
        </div>
        <div className="text-sm">
            {match.isHighScore && <span className="text-red-400">Büyük Skor</span>}
            {match.isDraw && <span className="text-blue-400">Beraberlik</span>}
            {match.isSurprise && <span className="text-green-400">Sürpriz</span>}
        </div>
    </div>
);

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    league: string;
    results: Barca51Result[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ league, results, onBack, isAnalyzing }) => {
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedScore, setSelectedScore] = useState<string>('');
    const [showFailedMatches, setShowFailedMatches] = useState(false);
    
    // Tüm takımları topla
    const allTeams = useMemo(() => {
        const teams = new Set<string>();
        results.forEach(result => {
            teams.add(result.surpriseTeam);
            teams.add(result.matches.dominantMatch.homeTeam);
            teams.add(result.matches.dominantMatch.awayTeam);
        });
        return Array.from(teams).sort();
    }, [results]);

    // Tüm skorları topla
    const allScores = useMemo(() => {
        const scores = new Set<string>();
        results.forEach(result => {
            // Sadece dominant maçların skorlarını al
            scores.add(result.matches.dominantMatch.score);
        });
        return Array.from(scores).sort((a, b) => {
            // Skorları sayısal olarak sırala (örn: "5-1", "4-0" gibi)
            const [aHome, aAway] = a.split('-').map(Number);
            const [bHome, bAway] = b.split('-').map(Number);
            const aDiff = Math.abs(aHome - aAway);
            const bDiff = Math.abs(bHome - bAway);
            return bDiff - aDiff; // Büyük farktan küçük farka doğru sırala
        });
    }, [results]);

    // Filtrelenmiş sonuçlar
    const filteredResults = useMemo(() => {
        return results.filter(result => {
            // Başarısız maç filtresi - showFailedMatches true ise başarısız maçları da göster
            if (!showFailedMatches && !result.matches.surpriseMatch.isSurprise) return false;

            // Takım filtresi - seçilen takım hem dominant maçta hem de sürpriz maçta olmalı
            if (selectedTeam) {
                const isInDominantMatch = 
                    result.matches.dominantMatch.homeTeam === selectedTeam || 
                    result.matches.dominantMatch.awayTeam === selectedTeam;

                const isInSurpriseMatch = 
                    result.matches.surpriseMatch.homeTeam === selectedTeam || 
                    result.matches.surpriseMatch.awayTeam === selectedTeam;

                if (!isInDominantMatch || !isInSurpriseMatch) return false;
            }

            // Skor filtresi
            const scoreMatch = !selectedScore ||
                result.matches.dominantMatch.score === selectedScore;

            return scoreMatch;
        });
    }, [results, selectedTeam, selectedScore, showFailedMatches]);

    return (
        <div className="space-y-6 h-[calc(100vh-1rem)] flex flex-col">
            {/* Header - Lig Bilgisi */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
                          rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                
                {/* Geri Butonu */}
                <button 
                    onClick={onBack}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-black/20 
                             hover:bg-black/30 transition-colors text-white"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 mt-6">
                    <div className="relative w-24 h-24 bg-white rounded-xl flex items-center justify-center">
                        <img 
                            src={LEAGUE_INFO[league].logo}
                            alt={LEAGUE_INFO[league].name}
                            className="w-20 h-20 object-contain"
                        />
                    </div>
                    <div className="relative">
                        <h2 className="text-3xl font-bold text-white">{LEAGUE_INFO[league].name}</h2>
                        <p className="text-blue-200 mt-1">Barça 5-1 Analizi</p>
                    </div>
                </div>
            </div>

            {/* Filtre Bölümü */}
            <div className="bg-gray-800/50 rounded-xl p-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                    {/* Takım Filtresi */}
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="w-full p-3 rounded-lg bg-gray-800 text-gray-300 border border-gray-700"
                            >
                                <option key="default" value="">Takım Seçin</option>
                                {allTeams.map(team => (
                                    <option key={`team-${team}`} value={team}>{team}</option>
                                ))}
                            </select>
                            {selectedTeam && (
                                <button
                                    onClick={() => setSelectedTeam('')}
                                    className="text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Filtreyi Temizle
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ayırıcı */}
                    <div className="h-8 w-px bg-gray-700" />

                    {/* Skor Filtresi */}
                    <div className="w-64 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <select
                                value={selectedScore}
                                onChange={(e) => setSelectedScore(e.target.value)}
                                className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                            >
                                <option key="default" value="">Skor Seçin</option>
                                {Array.from(new Set(results.map(r => r.matches.dominantMatch.score))).sort().map(score => (
                                    <option key={score} value={score}>{score}</option>
                                ))}
                            </select>
                            {selectedScore && (
                                <button
                                    onClick={() => setSelectedScore('')}
                                    className="text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                >
                                    Temizle
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ayırıcı */}
                    <div className="h-8 w-px bg-gray-700" />

                    {/* Başarısız Maçlar Filtresi */}
                    <div className="flex-shrink-0">
                        <label className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showFailedMatches}
                                onChange={(e) => setShowFailedMatches(e.target.checked)}
                                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                            />
                            Başarısız Maçları Göster
                        </label>
                    </div>
                </div>

                {/* Aktif Filtreler */}
                {(selectedTeam || selectedScore || showFailedMatches) && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
                        <span>Aktif Filtreler:</span>
                        {selectedTeam && (
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                                {selectedTeam}
                            </span>
                        )}
                        {selectedScore && (
                            <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300">
                                {selectedScore}
                            </span>
                        )}
                        {showFailedMatches && (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                                Başarısız Maçlar
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Loading Durumu */}
            {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400">Analiz yapılıyor...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {filteredResults.length > 0 ? (
                        filteredResults.map((result, idx) => (
                            <div key={idx} 
                                 className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                                          rounded-xl border border-gray-700/30 
                                          hover:border-green-500/30 transition-all">
                                <div className="p-6">
                                    {/* Üst Kısım - Sürpriz Takım ve Sezon */}
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="absolute -inset-2 bg-green-500/20 rounded-full blur-lg opacity-0 
                                                              group-hover:opacity-100 transition-opacity" />
                                                <TeamLogo name={result.surpriseTeam} 
                                                         className="w-16 h-16 relative" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">
                                                    {result.surpriseTeam}
                                                </h3>
                                                <p className="text-sm text-gray-400">Sürpriz Adayı</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300">
                                            {result.season} Sezonu
                                        </div>
                                    </div>

                                    {/* Alt Kısım - Maç Detayları */}
                                    <div className="space-y-3">
                                        <MatchCard match={result.matches.dominantMatch} />
                                        <MatchCard match={result.matches.drawMatch} />
                                        <MatchCard match={result.matches.surpriseMatch} />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                            <p className="text-gray-400">
                                {selectedTeam 
                                    ? `${selectedTeam} için sonuç bulunamadı.` 
                                    : 'Bu ligde pattern bulunamadı.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

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

// Tab seçenekleri için enum'u güncelleyelim
enum TabType {
    RESULTS = 'results',
    DETAILS = 'details',
    CANDIDATES = 'candidates'
}

// Detaylar komponenti
const DetailsTab: React.FC<{
    results: Barca51Result[];
}> = ({ results }) => {
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [showLeagueSuccessExamples, setShowLeagueSuccessExamples] = useState(false);
    const [showLeagueFailedExamples, setShowLeagueFailedExamples] = useState(false);
    const [showTeamSuccessExamples, setShowTeamSuccessExamples] = useState(false);
    const [showTeamFailedExamples, setShowTeamFailedExamples] = useState(false);
    const [onlyLeagueTwoTwo, setOnlyLeagueTwoTwo] = useState(false);
    const [onlyTeamTwoTwo, setOnlyTeamTwoTwo] = useState(false);
    const [isLeagueStatsVisible, setIsLeagueStatsVisible] = useState(true);

    // Tüm takımları topla
    const allTeams = useMemo(() => {
        const teams = new Set<string>();
        results.forEach(result => {
            teams.add(result.surpriseTeam);
            teams.add(result.matches.dominantMatch.homeTeam);
            teams.add(result.matches.dominantMatch.awayTeam);
        });
        return Array.from(teams).sort();
    }, [results]);

    // Lig geneli istatistikleri için 2-2 filtresi
    const scoreStats = useMemo(() => {
        const stats = new Map<string, {
            total: number;
            success: number;
            last10Years: {
                total: number;
                success: number;
            };
            examples: {
                success: Barca51Result[];
                failed: Barca51Result[];
            };
        }>();

        // Şu anki yılı al
        const currentYear = new Date().getFullYear();

        // 2-2 filtresine göre sonuçları filtrele
        const filteredResults = onlyLeagueTwoTwo 
            ? results.filter(r => r.matches.drawMatch.score === "2-2")
            : results;

        filteredResults.forEach(result => {
            const score = result.matches.dominantMatch.score;
            if (!stats.has(score)) {
                stats.set(score, { 
                    total: 0, 
                    success: 0,
                    last10Years: { total: 0, success: 0 },
                    examples: { success: [], failed: [] }
                });
            }
            const data = stats.get(score)!;
            data.total++;
            
            // Sezon yılını al
            const seasonYear = parseInt(result.season.split('-')[0]);
            const isLast10Years = currentYear - seasonYear <= 10;

            if (isLast10Years) {
                data.last10Years.total++;
            }
            
            if (result.matches.surpriseMatch.isSurprise) {
                data.success++;
                if (isLast10Years) {
                    data.last10Years.success++;
                }
                if (data.examples.success.length < 1) {
                    data.examples.success.push(result);
                }
            } else {
                if (data.examples.failed.length < 1) {
                    data.examples.failed.push(result);
                }
            }
        });

        return Array.from(stats.entries())
            .map(([score, data]) => ({
                score,
                successRate: (data.success / data.total) * 100,
                total: data.total,
                success: data.success,
                last10Years: {
                    successRate: data.last10Years.total > 0 
                        ? (data.last10Years.success / data.last10Years.total) * 100 
                        : 0,
                    total: data.last10Years.total,
                    success: data.last10Years.success
                },
                examples: data.examples
            }))
            .sort((a, b) => b.successRate - a.successRate);
    }, [results, onlyLeagueTwoTwo]);  // dependency'i güncelle

    // Takım bazlı istatistikler için 2-2 filtresi
    const teamStats = useMemo(() => {
        if (!selectedTeam) return [];

        const stats = new Map<string, {
            total: number;
            success: number;
            last10Years: {
                total: number;
                success: number;
            };
            examples: {
                success: Barca51Result[];
                failed: Barca51Result[];
            };
        }>();

        const currentYear = new Date().getFullYear();

        // Önce seçili takımın hem dominant hem de sürpriz maçta olduğu sonuçları filtrele
        const teamResults = results.filter(result => {
            // Seçili takımın dominant maçta olması gerekiyor
            const isInDominantMatch = 
                result.matches.dominantMatch.homeTeam === selectedTeam ||
                result.matches.dominantMatch.awayTeam === selectedTeam;

            // Seçili takımın sürpriz maçta olması gerekiyor
            const isInSurpriseMatch = 
                result.matches.surpriseMatch.homeTeam === selectedTeam ||
                result.matches.surpriseMatch.awayTeam === selectedTeam;

            return isInDominantMatch && isInSurpriseMatch;
        });

        // Sonra 2-2 filtresini uygula
        const filteredResults = onlyTeamTwoTwo 
            ? teamResults.filter(r => r.matches.drawMatch.score === "2-2")
            : teamResults;

        filteredResults.forEach(result => {
            const dominantMatch = result.matches.dominantMatch;
            const score = dominantMatch.score;
            
            if (!stats.has(score)) {
                stats.set(score, { 
                    total: 0, 
                    success: 0,
                    last10Years: { total: 0, success: 0 },
                    examples: { success: [], failed: [] }
                });
            }
            const data = stats.get(score)!;
            data.total++;

            // Sezon yılını al
            const seasonYear = parseInt(result.season.split('-')[0]);
            const isLast10Years = currentYear - seasonYear <= 10;

            if (isLast10Years) {
                data.last10Years.total++;
            }
            
            // Sürpriz maçta başarılı olup olmadığını kontrol et
            if (result.matches.surpriseMatch.isSurprise) {
                data.success++;
                if (isLast10Years) {
                    data.last10Years.success++;
                }
                if (data.examples.success.length < 1) {
                    data.examples.success.push(result);
                }
            } else {
                if (data.examples.failed.length < 1) {
                    data.examples.failed.push(result);
                }
            }
        });

        return Array.from(stats.entries())
            .map(([score, data]) => ({
                score,
                successRate: (data.success / data.total) * 100,
                total: data.total,
                success: data.success,
                last10Years: {
                    successRate: data.last10Years.total > 0 
                        ? (data.last10Years.success / data.last10Years.total) * 100 
                        : 0,
                    total: data.last10Years.total,
                    success: data.last10Years.success
                },
                examples: data.examples
            }))
            .sort((a, b) => b.successRate - a.successRate);
    }, [results, selectedTeam, onlyTeamTwoTwo]);

    // Renk belirleme fonksiyonlarını ayıralım
    const getSuccessRateColor = (rate: number) => {
        if (rate >= 70) return 'bg-green-500/20 text-green-400';
        if (rate >= 40) return 'bg-orange-500/20 text-orange-400';
        return 'bg-red-500/20 text-red-400';
    };

    const getLast10YearsColor = (rate: number) => {
        if (rate >= 70) return 'bg-yellow-500/20 text-yellow-400';
        if (rate >= 40) return 'bg-yellow-600/20 text-yellow-500';
        return 'bg-yellow-700/20 text-yellow-600';
    };

    return (
        <div className="h-[calc(100vh-10rem)] space-y-8">
            {/* Lig Geneli İstatistikler */}
            <div className="h-[calc(50vh-6rem)]">
                <div className="sticky top-0 bg-gray-900 py-2 mb-4 z-10 space-y-2">
                    <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setIsLeagueStatsVisible(!isLeagueStatsVisible)}
                    >
                        <h3 className="text-xl font-semibold text-white">
                            Lig Geneli Başarı Oranları
                        </h3>
                        <button className="text-gray-400 hover:text-white transition-colors">
                            {isLeagueStatsVisible ? '▼' : '▶'}
                        </button>
                    </div>
                    {isLeagueStatsVisible && (
                        <div className="flex items-center gap-4 text-sm">
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={onlyLeagueTwoTwo}
                                    onChange={(e) => setOnlyLeagueTwoTwo(e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                Sadece 2-2 Beraberlikler
                            </label>
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={showLeagueSuccessExamples}
                                    onChange={(e) => setShowLeagueSuccessExamples(e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                Başarılı Örnekleri Göster
                            </label>
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={showLeagueFailedExamples}
                                    onChange={(e) => setShowLeagueFailedExamples(e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                Başarısız Örnekleri Göster
                            </label>
                        </div>
                    )}
                </div>
                {isLeagueStatsVisible && (
                    <div className="h-full overflow-y-auto pr-2 space-y-4">
                        {scoreStats.map(stat => (
                            <div key={stat.score} className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl font-bold text-white">{stat.score}</div>
                                        <div className="space-y-1">
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSuccessRateColor(stat.successRate)}`}>
                                                Genel: %{stat.successRate.toFixed(1)}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLast10YearsColor(stat.last10Years.successRate)}`}>
                                                Son 10 Yıl: %{stat.last10Years.successRate.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1 text-right">
                                        <div className="text-gray-400">
                                            Genel: {stat.success} / {stat.total} Başarılı
                                        </div>
                                        <div className="text-yellow-500/80">
                                            Son 10 Yıl: {stat.last10Years.success} / {stat.last10Years.total} Başarılı
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Örnek maçlar - sadece checkbox seçili ise göster */}
                                {(showLeagueSuccessExamples || showLeagueFailedExamples) && (
                                    <div className="border-t border-gray-700 pt-4 space-y-4">
                                        {showLeagueSuccessExamples && stat.examples.success.length > 0 && (
                                            <div>
                                                <div className="text-sm text-green-400 mb-2">Başarılı Örnek:</div>
                                                <div className="space-y-2">
                                                    <MatchCard match={stat.examples.success[0].matches.dominantMatch} />
                                                    <MatchCard match={stat.examples.success[0].matches.drawMatch} />
                                                    <MatchCard match={stat.examples.success[0].matches.surpriseMatch} />
                                                </div>
                                            </div>
                                        )}
                                        {showLeagueFailedExamples && stat.examples.failed.length > 0 && (
                                            <div>
                                                <div className="text-sm text-red-400 mb-2">Başarısız Örnek:</div>
                                                <div className="space-y-2">
                                                    <MatchCard match={stat.examples.failed[0].matches.dominantMatch} />
                                                    <MatchCard match={stat.examples.failed[0].matches.drawMatch} />
                                                    <MatchCard match={stat.examples.failed[0].matches.surpriseMatch} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Takım Bazlı İstatistikler */}
            <div className="h-[calc(50vh-6rem)]">
                <div className="flex items-center justify-between sticky top-0 bg-gray-900 py-2 mb-4 z-10">
                    <div className="space-y-2 flex-1">
                        <h3 className="text-xl font-semibold text-white">Takım Bazlı Başarı Oranları</h3>
                        <div className="flex items-center gap-4 text-sm">
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={onlyTeamTwoTwo}
                                    onChange={(e) => setOnlyTeamTwoTwo(e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                Sadece 2-2 Beraberlikler
                            </label>
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={showTeamSuccessExamples}
                                    onChange={(e) => setShowTeamSuccessExamples(e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                Başarılı Örnekleri Göster
                            </label>
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    checked={showTeamFailedExamples}
                                    onChange={(e) => setShowTeamFailedExamples(e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                                />
                                Başarısız Örnekleri Göster
                            </label>
                        </div>
                    </div>
                    <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full p-3 rounded-lg bg-gray-800 text-gray-300 border border-gray-700"
                    >
                        <option key="default" value="">Takım Seçin</option>
                        {allTeams.map(team => (
                            <option key={`team-${team}`} value={team}>{team}</option>
                        ))}
                    </select>
                </div>

                <div className="h-full overflow-y-auto pr-2">
                    {selectedTeam ? (
                        <div className="space-y-4">
                            {teamStats.map(stat => (
                                <div key={stat.score} className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="text-2xl font-bold text-white">{stat.score}</div>
                                            <div className="space-y-1">
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSuccessRateColor(stat.successRate)}`}>
                                                    Genel: %{stat.successRate.toFixed(1)}
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getLast10YearsColor(stat.last10Years.successRate)}`}>
                                                    Son 10 Yıl: %{stat.last10Years.successRate.toFixed(1)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm space-y-1 text-right">
                                            <div className="text-gray-400">
                                                Genel: {stat.success} / {stat.total} Başarılı
                                            </div>
                                            <div className="text-yellow-500/80">
                                                Son 10 Yıl: {stat.last10Years.success} / {stat.last10Years.total} Başarılı
                                            </div>
                                        </div>
                                    </div>
                                    {/* Örnek maçlar - sadece checkbox seçili ise göster */}
                                    {(showTeamSuccessExamples || showTeamFailedExamples) && (
                                        <div className="border-t border-gray-700 pt-4 space-y-4">
                                            {showTeamSuccessExamples && stat.examples.success.length > 0 && (
                                                <div>
                                                    <div className="text-sm text-green-400 mb-2">Başarılı Örnek:</div>
                                                    <div className="space-y-2">
                                                        <MatchCard match={stat.examples.success[0].matches.dominantMatch} />
                                                        <MatchCard match={stat.examples.success[0].matches.drawMatch} />
                                                        <MatchCard match={stat.examples.success[0].matches.surpriseMatch} />
                                                    </div>
                                                </div>
                                            )}
                                            {showTeamFailedExamples && stat.examples.failed.length > 0 && (
                                                <div>
                                                    <div className="text-sm text-red-400 mb-2">Başarısız Örnek:</div>
                                                    <div className="space-y-2">
                                                        <MatchCard match={stat.examples.failed[0].matches.dominantMatch} />
                                                        <MatchCard match={stat.examples.failed[0].matches.drawMatch} />
                                                        <MatchCard match={stat.examples.failed[0].matches.surpriseMatch} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                            <p className="text-gray-400">Takım seçin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Muhtemel Adaylar komponenti
const CandidatesTab: React.FC<{
    league: string;
    season: string;
    matchData: any[];
}> = ({ league, season, matchData }) => {
    const candidates = useMemo(() => {
        const results: {
            dominantMatch: Barca51Match;
            drawMatch: Barca51Match;
            potentialMatch: {
                team: string;  // K takımı
                homeMatch?: boolean;  // K takımı ev sahibi mi olacak
                date: string;
            };
        }[] = [];

        // Sezon maçlarını al
        const seasonMatches = matchData.filter(m => 
            m.Div === league && 
            getSeasonFromDate(Number(m.Date)) === season
        );

        // 1. Büyük skorlu maçları bul (X vs Y)
        const dominantMatches = seasonMatches.filter(m => {
            const homeGoals = Number(m.FTHG);
            const awayGoals = Number(m.FTAG);
            
            // Mevcut büyük skor kontrolü (3 gol farkı)
            const isLargeScoreDifference = Math.abs(homeGoals - awayGoals) >= 3;
            
            // 3-3 skoru için kontrol
            const isHighScoringDraw = homeGoals === 3 && awayGoals === 3;
            
            // Yeni büyük skor kontrolleri
            const isHighScoring = (
                (homeGoals === 4 && awayGoals === 2) ||
                (homeGoals === 2 && awayGoals === 4) ||
                (homeGoals === 5 && awayGoals === 2) ||
                (homeGoals === 2 && awayGoals === 5) ||
                (homeGoals === 3 && awayGoals === 2) ||
                (homeGoals === 2 && awayGoals === 3)
            );
            
            return isLargeScoreDifference || isHighScoringDraw || isHighScoring;
        });

        dominantMatches.forEach(dominantMatch => {
            const dominantDate = Number(dominantMatch.Date);
            const winnerTeam = Number(dominantMatch.FTHG) > Number(dominantMatch.FTAG) 
                ? dominantMatch.HomeTeam 
                : dominantMatch.AwayTeam;
            const loserTeam = Number(dominantMatch.FTHG) < Number(dominantMatch.FTAG)
                ? dominantMatch.HomeTeam
                : dominantMatch.AwayTeam;

            // 2. Y'nin berabere kaldığı maçları bul (Y vs K)
            const drawMatches = seasonMatches.filter(m => 
                (m.HomeTeam === loserTeam || m.AwayTeam === loserTeam) &&
                m.FTR === 'D' &&
                Number(m.FTHG) >= 2
            );

            drawMatches.forEach(drawMatch => {
                const drawDate = Number(drawMatch.Date);
                const drawOpponent = drawMatch.HomeTeam === loserTeam 
                    ? drawMatch.AwayTeam 
                    : drawMatch.HomeTeam;

                // 3. Gelecek X vs K maçını bul
                const futureMatch = seasonMatches.find(m => {
                    const matchDate = Number(m.Date);
                    const isCorrectTeams = (m.HomeTeam === winnerTeam && m.AwayTeam === drawOpponent) ||
                                         (m.AwayTeam === winnerTeam && m.HomeTeam === drawOpponent);
                    const isAfterBothMatches = matchDate > Math.max(dominantDate, drawDate);
                    
                    return isCorrectTeams && isAfterBothMatches;
                });

                // Eğer maç henüz oynanmamışsa aday olarak ekle
                if (!futureMatch) {
                    results.push({
                        dominantMatch: {
                            date: formatDate(Number(dominantMatch.Date)),
                            homeTeam: dominantMatch.HomeTeam,
                            awayTeam: dominantMatch.AwayTeam,
                            score: `${dominantMatch.FTHG}-${dominantMatch.FTAG}`,
                            htScore: `${dominantMatch.HTHG}-${dominantMatch.HTAG}`,
                            isHighScore: true
                        },
                        drawMatch: {
                            date: formatDate(Number(drawMatch.Date)),
                            homeTeam: drawMatch.HomeTeam,
                            awayTeam: drawMatch.AwayTeam,
                            score: `${drawMatch.FTHG}-${drawMatch.FTAG}`,
                            htScore: `${drawMatch.HTHG}-${drawMatch.HTAG}`,
                            isDraw: true
                        },
                        potentialMatch: {
                            team: drawOpponent,
                            date: formatDate(Number(drawMatch.Date) + 1), // Yaklaşık tarih
                            homeMatch: Math.random() > 0.5 // Rastgele ev/deplasman
                        }
                    });
                }
            });
        });

        return results;
    }, [league, season, matchData]);

    return (
        <div className="h-[calc(100vh-10rem)] overflow-y-auto pr-2">
            <div className="space-y-4">
                {candidates.length > 0 ? (
                    candidates.map((candidate, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                                                rounded-xl border border-gray-700/30 p-6 space-y-6">
                            {/* Muhtemel Sürpriz Takım */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <TeamLogo name={candidate.potentialMatch.team} className="w-16 h-16" />
                                    <div>
                                        <h3 className="text-xl font-bold text-white">
                                            {candidate.potentialMatch.team}
                                        </h3>
                                        <p className="text-sm text-gray-400">Muhtemel Sürpriz Adayı</p>
                                    </div>
                                </div>
                            </div>

                            {/* Maç Detayları */}
                            <div className="space-y-3">
                                <MatchCard match={candidate.dominantMatch} />
                                <MatchCard match={candidate.drawMatch} />
                                
                                {/* Muhtemel Maç */}
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-400 text-sm">
                                                {candidate.potentialMatch.date} sonrası
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <TeamLogo 
                                                    name={candidate.potentialMatch.homeMatch ? 
                                                          candidate.potentialMatch.team : 
                                                          candidate.dominantMatch.homeTeam} 
                                                    className="w-6 h-6" 
                                                />
                                                <span className="text-gray-300">
                                                    {candidate.potentialMatch.homeMatch ? 
                                                     candidate.potentialMatch.team : 
                                                     candidate.dominantMatch.homeTeam}
                                                </span>
                                            </div>
                                            <span className="text-white font-medium">vs</span>
                                            <div className="flex items-center gap-2">
                                                <TeamLogo 
                                                    name={candidate.potentialMatch.homeMatch ? 
                                                          candidate.dominantMatch.homeTeam : 
                                                          candidate.potentialMatch.team} 
                                                    className="w-6 h-6" 
                                                />
                                                <span className="text-gray-300">
                                                    {candidate.potentialMatch.homeMatch ? 
                                                     candidate.dominantMatch.homeTeam : 
                                                     candidate.potentialMatch.team}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-yellow-400">Muhtemel Maç</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                        <p className="text-gray-400">Muhtemel aday bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Ana komponent
export const Barca51Analysis: React.FC<Barca51AnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<TabType>(TabType.RESULTS);
    const [results, setResults] = useState<Barca51Result[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    // Component mount olduğunda analizi başlat
    React.useEffect(() => {
        const startAnalysis = () => {
            setTimeout(() => {
                // Analiz fonksiyonunu çağır
                const analysisResults = analyzeBarca51(league, season, matchData);
                setResults(analysisResults);
                setIsAnalyzing(false);
            }, 100);
        };

        startAnalysis();
    }, [league, season, matchData]);

    return (
        <div className="p-4">
            <Tab.Group selectedIndex={Object.values(TabType).indexOf(activeTab)} 
                      onChange={index => setActiveTab(Object.values(TabType)[index])}>
                <div className="space-y-6">
                    <Tab.List className="flex space-x-2 rounded-xl bg-gray-800/50 p-1">
                        {['Sonuçlar', 'Detaylar', 'Muhtemel Adaylar'].map((tab, index) => (
                            <Tab
                                key={`tab-${index}`}
                                className={({ selected }) =>
                                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                     ${selected 
                                         ? 'bg-blue-500 text-white shadow'
                                         : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`
                                }
                            >
                                {tab}
                            </Tab>
                        ))}
                    </Tab.List>

                    <Tab.Panels>
                        <Tab.Panel>
                            <ResultsDisplay
                                league={league}
                                results={results}
                                onBack={onClose}
                                isAnalyzing={isAnalyzing}
                            />
                        </Tab.Panel>
                        <Tab.Panel>
                            <DetailsTab results={results} />
                        </Tab.Panel>
                        <Tab.Panel>
                            <CandidatesTab 
                                league={league}
                                season={season}
                                matchData={matchData}
                            />
                        </Tab.Panel>
                    </Tab.Panels>
                </div>
            </Tab.Group>
        </div>
    );
};

// Analiz fonksiyonu - mantığı daha sonra eklenecek
const analyzeBarca51 = (
    league: string,
    season: string,
    matchData: any[]
): Barca51Result[] => {
    const results: Barca51Result[] = [];
    const seasons = new Set(matchData
        .filter(m => m.Div === league)
        .map(m => getSeasonFromDate(Number(m.Date)))
    );

    seasons.forEach(season => {
        const seasonMatches = matchData.filter(m => 
            m.Div === league && 
            getSeasonFromDate(Number(m.Date)) === season
        );

        // 1. Büyük skorlu maçları bul (X vs Y)
        const dominantMatches = seasonMatches.filter(m => {
            const homeGoals = Number(m.FTHG);
            const awayGoals = Number(m.FTAG);
            
            // Mevcut büyük skor kontrolü (3 gol farkı)
            const isLargeScoreDifference = Math.abs(homeGoals - awayGoals) >= 3;
            
            // 3-3 skoru için kontrol
            const isHighScoringDraw = homeGoals === 3 && awayGoals === 3;
            
            // Yeni büyük skor kontrolleri
            const isHighScoring = (
                (homeGoals === 4 && awayGoals === 2) ||
                (homeGoals === 2 && awayGoals === 4) ||
                (homeGoals === 5 && awayGoals === 2) ||
                (homeGoals === 2 && awayGoals === 5) ||
                (homeGoals === 3 && awayGoals === 2) ||
                (homeGoals === 2 && awayGoals === 3)
            );
            
            return isLargeScoreDifference || isHighScoringDraw || isHighScoring;
        });

        dominantMatches.forEach(dominantMatch => {
            const dominantDate = Number(dominantMatch.Date);
            
            // Her iki takımı da kontrol et (X ve Y pozisyonları için)
            [dominantMatch.HomeTeam, dominantMatch.AwayTeam].forEach(currentTeam => {
                const otherTeam = dominantMatch.HomeTeam === currentTeam 
                    ? dominantMatch.AwayTeam 
                    : dominantMatch.HomeTeam;

                // 2. Diğer takımın berabere kaldığı maçları bul (Y vs K veya X vs K)
                const drawMatches = seasonMatches.filter(m => {
                    const isTeamInvolved = m.HomeTeam === otherTeam || m.AwayTeam === otherTeam;
                    const isDraw = m.FTR === 'D';
                    const homeGoals = Number(m.FTHG);
                    const awayGoals = Number(m.FTAG);
                    
                    // Beraberlik skorları kontrolü
                    const isTwoTwo = homeGoals === 2 && awayGoals === 2;
                    const isOneOne = homeGoals === 1 && awayGoals === 1;
                    const isThreeThree = homeGoals === 3 && awayGoals === 3;  // 3-3'ü de ekleyelim
                    
                    return isTeamInvolved && isDraw && (isTwoTwo || isOneOne || isThreeThree);
                });

                drawMatches.forEach(drawMatch => {
                    const drawDate = Number(drawMatch.Date);
                    const drawOpponent = drawMatch.HomeTeam === otherTeam 
                        ? drawMatch.AwayTeam 
                        : drawMatch.HomeTeam;

                    // 3. Seçili takımın maçlarını bul (X vs K veya Y vs K)
                    const potentialSurprises = seasonMatches.filter(m => {
                        const matchDate = Number(m.Date);
                        const isCorrectTeams = (m.HomeTeam === currentTeam && m.AwayTeam === drawOpponent) ||
                                             (m.AwayTeam === currentTeam && m.HomeTeam === drawOpponent);
                        const isAfterBothMatches = matchDate > Math.max(dominantDate, drawDate);
                        
                        return isCorrectTeams && isAfterBothMatches;
                    });

                    // Her potansiyel maç için sonucu ekle
                    potentialSurprises.forEach(match => {
                        const isSurprise = (match.HTR === 'H' && match.FTR === 'A') || 
                                         (match.HTR === 'A' && match.FTR === 'H');

                        results.push({
                            surpriseTeam: drawOpponent,
                            season,
                            matches: {
                                dominantMatch: {
                                    date: formatDate(Number(dominantMatch.Date)),
                                    homeTeam: dominantMatch.HomeTeam,
                                    awayTeam: dominantMatch.AwayTeam,
                                    score: `${dominantMatch.FTHG}-${dominantMatch.FTAG}`,
                                    htScore: `${dominantMatch.HTHG}-${dominantMatch.HTAG}`,
                                    isHighScore: true
                                },
                                drawMatch: {
                                    date: formatDate(Number(drawMatch.Date)),
                                    homeTeam: drawMatch.HomeTeam,
                                    awayTeam: drawMatch.AwayTeam,
                                    score: `${drawMatch.FTHG}-${drawMatch.FTAG}`,
                                    htScore: `${drawMatch.HTHG}-${drawMatch.HTAG}`,
                                    isDraw: true
                                },
                                surpriseMatch: isSurprise ? {
                                    date: formatDate(Number(match.Date)),
                                    homeTeam: match.HomeTeam,
                                    awayTeam: match.AwayTeam,
                                    score: `${match.FTHG}-${match.FTAG}`,
                                    htScore: `${match.HTHG}-${match.HTAG}`,
                                    isSurprise: true
                                } : {
                                    date: formatDate(Number(match.Date)),
                                    homeTeam: match.HomeTeam,
                                    awayTeam: match.AwayTeam,
                                    score: `${match.FTHG}-${match.FTAG}`,
                                    htScore: `${match.HTHG}-${match.HTAG}`,
                                    isSurprise: false
                                }
                            }
                        });
                    });
                });
            });
        });
    });

    return results;
}; 