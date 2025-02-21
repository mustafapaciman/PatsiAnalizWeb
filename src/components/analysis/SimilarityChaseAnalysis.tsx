import React, { useState, useMemo } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface SimilarityChaseResult {
    similarTeam: string;
    season: string;
    commonSurprises: string[];
    firstOpponent: string;
}

interface FixtureTriggerResult {
    triggerTeam: string;
    matches: {
        season: string;
        isHome: boolean;
        matchesUntilSurprise: number;
        surpriseOpponent: string;
        isException?: boolean;
    }[];
}

interface RecentPatternResult {
    triggerTeam: string;
    matches: {
        season: string;
        isHome: boolean;
        matchesUntilSurprise: number;
        surpriseOpponent: string;
    }[];
    repeatCount: number;
}

interface SingleTimePattern {
    triggerTeam: string;
    historicalMatch: {
        season: string;
        isHome: boolean;
        matchesUntilSurprise: number;
        surpriseOpponent: string;
    };
    currentMatch: {
        matchesPlayed: number;  // Şu ana kadar oynanan maç sayısı
        isHome: boolean;
    };
}

interface SimilarityChaseAnalysisProps {
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
}> = ({ isOpen, onClose, teams, onSelect }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Takım Seçin</h2>
                <div className="grid grid-cols-4 gap-4">
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

// Sonuç Gösterim Komponenti
const ResultsDisplay: React.FC<{
    selectedTeam: string;
    similarityResults: SimilarityChaseResult[];
    triggerResults: { mainResults: FixtureTriggerResult[], recentPatterns: RecentPatternResult[] };
    singleTimePatterns: SingleTimePattern[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ selectedTeam, similarityResults, triggerResults, singleTimePatterns, onBack, isAnalyzing }) => (
    <div className="space-y-8 h-[calc(100vh-4rem)] flex flex-col">
        {/* Header - Geri Butonu Ekle - Header'ı sabit tutmak için flex-shrink-0 ekledik */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 
                      rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden
                      flex-shrink-0">
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
                <div className="relative">
                    <TeamLogo name={selectedTeam} 
                             className="w-24 h-24 transform hover:scale-105 transition-transform" />
                </div>
                <div className="relative">
                    <h2 className="text-3xl font-bold text-white">{selectedTeam}</h2>
                    <p className="text-blue-200 mt-1">Benzerlik Analizi</p>
                </div>
            </div>
        </div>

        {/* Loading ve Tab'lar için scroll container */}
        <div className="flex-1 overflow-y-auto pr-2">
            {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-400">Analiz yapılıyor...</p>
                </div>
            ) : (
                <Tab.Group>
                    {/* Tab butonlarını sabit tutmak için wrapper */}
                    <div className="sticky top-0 bg-gray-900 py-2 z-10">
                        <Tab.List className="flex space-x-2 rounded-xl bg-blue-900/20 p-1">
                            <Tab className={({ selected }) =>
                                `w-full py-3 text-sm font-medium leading-5 rounded-lg transition-all
                                 ${selected 
                                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                     : 'text-blue-300 hover:text-white hover:bg-blue-800/50'}`
                            }>
                                Fikstür Başlangıç Benzerliği
                            </Tab>
                            <Tab className={({ selected }) =>
                                `w-full py-3 text-sm font-medium leading-5 rounded-lg transition-all
                                 ${selected 
                                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                     : 'text-blue-300 hover:text-white hover:bg-blue-800/50'}`
                            }>
                                Fikstür Tetikçisi
                            </Tab>
                            <Tab className={({ selected }) =>
                                `w-full py-3 text-sm font-medium leading-5 rounded-lg transition-all
                                 ${selected 
                                     ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                     : 'text-blue-300 hover:text-white hover:bg-blue-800/50'}`
                            }>
                                Tek Seferlik Pattern'ler
                            </Tab>
                        </Tab.List>
                    </div>

                    {/* Tab panelleri scroll olacak */}
                    <Tab.Panels className="mt-6">
                        <Tab.Panel className="space-y-4">
                            {similarityResults.length > 0 ? (
                                similarityResults.map((result, idx) => (
                                    <div key={idx} 
                                         className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl 
                                                  border border-gray-700/30 hover:border-green-500/30 
                                                  transition-all duration-300 group">
                                        <div className="p-6">
                                            <div className="flex items-center justify-between">
                                                {/* Sol Taraf - Takım Bilgisi */}
                                                <div className="flex items-center gap-6">
                                                    <div className="relative">
                                                        <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-xl 
                                                                      opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <TeamLogo name={result.similarTeam} 
                                                                 className="w-20 h-20 relative transform 
                                                                          group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white group-hover:text-green-400 
                                                                         transition-colors">
                                                            {result.similarTeam}
                                                        </h3>
                                                        <p className="text-gray-400 mt-1">{result.season} Sezonu</p>
                                                    </div>
                                                </div>

                                                {/* Sağ Taraf - Ortak Sürprizler */}
                                                <div className="flex flex-col items-end">
                                                    <div className="text-sm text-gray-400 mb-2">Ortak Sürprizler</div>
                                                    <div className="flex flex-wrap gap-2 justify-end">
                                                        {result.commonSurprises.map((team, i) => (
                                                            <div key={i} 
                                                                 className="flex items-center gap-2 px-3 py-2 
                                                                          bg-green-500/10 rounded-lg
                                                                          border border-green-500/20
                                                                          hover:bg-green-500/20 transition-colors">
                                                                <TeamLogo name={team} className="w-5 h-5" />
                                                                <span className="text-sm font-medium text-green-400">
                                                                    {team}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                    <p className="text-gray-400">Benzer pattern bulunamadı.</p>
                                </div>
                            )}
                        </Tab.Panel>
                        <Tab.Panel className="space-y-8">
                            {/* Ana Sonuçlar */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-white px-4">Ana Pattern'ler (3+ Tekrar)</h3>
                                {triggerResults.mainResults.length > 0 ? (
                                    triggerResults.mainResults.map((result, idx) => (
                                        <div key={idx} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6">
                                            <div className="flex items-center justify-between">
                                                {/* Sol - Tetikçi Takım */}
                                                <div className="flex items-center gap-6">
                                                    <TeamLogo name={result.triggerTeam} className="w-20 h-20" />
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">
                                                            {result.triggerTeam}
                                                        </h3>
                                                        <p className="text-sm text-gray-400">
                                                            {result.matches.length} kez tetiklemiş
                                                            {result.matches.some(m => m.isException) && 
                                                                " (1 istisna dahil)"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Sağ - Maç Detayları */}
                                                <div className="space-y-3">
                                                    {result.matches.map((match, idx) => (
                                                        <div key={idx} 
                                                             className={`flex items-center gap-4 p-3 rounded-lg
                                                                       ${match.isException 
                                                                           ? 'bg-yellow-500/10 border border-yellow-500/20' 
                                                                           : 'bg-green-500/10 border border-green-500/20'}`}>
                                                            <span className="text-gray-400">{match.season}</span>
                                                            <span className={match.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                                {match.isHome ? 'Ev' : 'Deplasman'}
                                                            </span>
                                                            <span className="text-gray-300">
                                                                {match.matchesUntilSurprise} maç sonra
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={match.surpriseOpponent} className="w-5 h-5" />
                                                                <span className="text-sm text-gray-300">
                                                                    {match.surpriseOpponent}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                        <p className="text-gray-400">Pattern bulunamadı.</p>
                                    </div>
                                )}
                            </div>

                            {/* Son Seneler Bölümü */}
                            {triggerResults.recentPatterns.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium text-white px-4">
                                        Son Seneler (2+ Tekrar)
                                    </h3>
                                    {triggerResults.recentPatterns.map((result, idx) => (
                                        <div key={idx} 
                                             className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                                                      rounded-xl p-6 border border-blue-500/20">
                                            <div className="flex items-center justify-between">
                                                {/* Sol - Tetikçi Takım */}
                                                <div className="flex items-center gap-6">
                                                    <TeamLogo name={result.triggerTeam} className="w-20 h-20" />
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">
                                                            {result.triggerTeam}
                                                        </h3>
                                                        <p className="text-sm text-blue-400">
                                                            Son {result.repeatCount} sezonda tekrarlanmış
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Sağ - Maç Detayları */}
                                                <div className="space-y-3">
                                                    {result.matches.map((match, idx) => (
                                                        <div key={idx} 
                                                             className="flex items-center gap-4 p-3 rounded-lg
                                                                      bg-blue-500/10 border border-blue-500/20">
                                                            <span className="text-gray-400">{match.season}</span>
                                                            <span className={match.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                                {match.isHome ? 'Ev' : 'Deplasman'}
                                                            </span>
                                                            <span className="text-gray-300">
                                                                {match.matchesUntilSurprise} maç sonra
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <TeamLogo name={match.surpriseOpponent} className="w-5 h-5" />
                                                                <span className="text-sm text-gray-300">
                                                                    {match.surpriseOpponent}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Tab.Panel>
                        <Tab.Panel className="space-y-4">
                            {singleTimePatterns.length > 0 ? (
                                singleTimePatterns.map((pattern, idx) => (
                                    <div key={idx} 
                                         className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                                          rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 
                                          transition-all duration-300">
                                        <div className="flex items-center justify-between">
                                            {/* Sol - Tetikçi Takım */}
                                            <div className="flex items-center gap-6">
                                                <TeamLogo name={pattern.triggerTeam} className="w-20 h-20" />
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">
                                                        {pattern.triggerTeam}
                                                    </h3>
                                                    <p className="text-sm text-purple-400">
                                                        {pattern.historicalMatch.season} sezonunda gerçekleşmiş
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sağ - Detaylar */}
                                            <div className="space-y-3">
                                                {/* Geçmiş Pattern */}
                                                <div className="flex items-center gap-4 p-3 rounded-lg
                                                              bg-purple-500/10 border border-purple-500/20">
                                                    <span className="text-gray-400">
                                                        {pattern.historicalMatch.season}
                                                    </span>
                                                    <span className={pattern.historicalMatch.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                        {pattern.historicalMatch.isHome ? 'Ev' : 'Deplasman'}
                                                    </span>
                                                    <span className="text-gray-300">
                                                        {pattern.historicalMatch.matchesUntilSurprise} maç sonra
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <TeamLogo name={pattern.historicalMatch.surpriseOpponent} className="w-5 h-5" />
                                                        <span className="text-sm text-gray-300">
                                                            {pattern.historicalMatch.surpriseOpponent}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Mevcut Durum */}
                                                <div className="flex items-center gap-4 p-3 rounded-lg
                                                              bg-blue-500/10 border border-blue-500/20">
                                                    <span className="text-gray-400">Mevcut Durum</span>
                                                    <span className={pattern.currentMatch.isHome ? 'text-blue-400' : 'text-orange-400'}>
                                                        {pattern.currentMatch.isHome ? 'Ev' : 'Deplasman'}
                                                    </span>
                                                    <span className="text-gray-300">
                                                        {pattern.currentMatch.matchesPlayed} maç oynandı
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                                    <p className="text-gray-400">Tek seferlik pattern bulunamadı.</p>
                                </div>
                            )}
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            )}
        </div>
    </div>
);

// Analiz fonksiyonları
const analyzeSimilarityChase = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): SimilarityChaseResult[] => {
    // Seçili takımın ilk maçını bul
    const currentSeasonFirstMatch = matchData
        .filter(m => 
            m.Div === league && 
            getSeasonFromDate(Number(m.Date)) === season &&
            (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
        )
        .sort((a, b) => Number(a.Date) - Number(b.Date))[0];

    if (!currentSeasonFirstMatch) return [];

    // İlk rakibi belirle
    const firstOpponent = currentSeasonFirstMatch.HomeTeam === selectedTeam 
        ? currentSeasonFirstMatch.AwayTeam 
        : currentSeasonFirstMatch.HomeTeam;

    // Seçili takımın sürpriz maçlarındaki rakipleri bul
    const currentSeasonSurprises = matchData
        .filter(m => 
            m.Div === league &&
            getSeasonFromDate(Number(m.Date)) === season &&
            (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam) &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
        )
        .map(m => m.HomeTeam === selectedTeam ? m.AwayTeam : m.HomeTeam);

    // Tüm sezonları tara
    const results: SimilarityChaseResult[] = [];
    const processedSeasons = new Set<string>();

    matchData
        .filter(m => m.Div === league)
        .forEach(match => {
            const matchSeason = getSeasonFromDate(Number(match.Date));
            if (matchSeason === season || processedSeasons.has(matchSeason)) return;

            const team = match.HomeTeam === firstOpponent ? match.AwayTeam : 
                        match.AwayTeam === firstOpponent ? match.HomeTeam : null;

            if (!team) return;

            // Bu takımın o sezondaki ilk maçı bu mu kontrol et
            const isFirstMatch = !matchData.some(m => 
                m.Div === league &&
                getSeasonFromDate(Number(m.Date)) === matchSeason &&
                (m.HomeTeam === team || m.AwayTeam === team) &&
                Number(m.Date) < Number(match.Date)
            );

            if (!isFirstMatch) return;

            // Bu takımın o sezondaki sürpriz maçlarını bul
            const surprises = matchData
                .filter(m => 
                    m.Div === league &&
                    getSeasonFromDate(Number(m.Date)) === matchSeason &&
                    (m.HomeTeam === team || m.AwayTeam === team) &&
                    ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
                )
                .map(m => m.HomeTeam === team ? m.AwayTeam : m.HomeTeam);

            // Ortak sürprizleri bul
            const commonSurprises = surprises.filter(s => currentSeasonSurprises.includes(s));

            if (commonSurprises.length > 0) {
                results.push({
                    similarTeam: team,
                    season: matchSeason,
                    commonSurprises,
                    firstOpponent
                });
            }

            processedSeasons.add(matchSeason);
        });

    return results;
};

const analyzeFixtureTriggers = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): { mainResults: FixtureTriggerResult[], recentPatterns: RecentPatternResult[] } => {
    const results: FixtureTriggerResult[] = [];
    const recentPatterns: RecentPatternResult[] = [];
    
    // Seçili sezondaki tüm rakipleri bul
    const currentSeasonMatches = matchData
        .filter(m => 
            m.Div === league && 
            getSeasonFromDate(Number(m.Date)) === season &&
            (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
        )
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    // Her rakip için kontrol
    const opponents = new Set(currentSeasonMatches.map(m => 
        m.HomeTeam === selectedTeam ? m.AwayTeam : m.HomeTeam
    ));

    // Her rakip için tüm pattern'leri tutacak bir Map oluştur
    const allPatternsByOpponent = new Map<string, {
        season: string;
        isHome: boolean;
        matchesUntilSurprise: number;
        surpriseOpponent: string;
    }[]>();

    opponents.forEach(opponent => {
        const patterns: {
            season: string;
            isHome: boolean;
            matchesUntilSurprise: number;
            surpriseOpponent: string;
        }[] = [];

        // Tüm sezonları kontrol et
        const allSeasons = new Set(matchData
            .filter(m => m.Div === league)
            .map(m => getSeasonFromDate(Number(m.Date)))
        );

        allSeasons.forEach(checkSeason => {
            // O sezondaki rakiple maçı bul
            const opponentMatch = matchData
                .filter(m => 
                    m.Div === league &&
                    getSeasonFromDate(Number(m.Date)) === checkSeason &&
                    ((m.HomeTeam === selectedTeam && m.AwayTeam === opponent) ||
                     (m.AwayTeam === selectedTeam && m.HomeTeam === opponent))
                )[0];

            if (!opponentMatch) return;

            // Rakiple maçtan sonraki ilk sürprizi bul
            const surpriseMatch = matchData
                .filter(m => 
                    m.Div === league &&
                    getSeasonFromDate(Number(m.Date)) === checkSeason &&
                    Number(m.Date) > Number(opponentMatch.Date) &&
                    (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam) &&
                    ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date))[0];

            if (!surpriseMatch) return;

            // Aradaki maç sayısını hesapla
            const matchesBetween = matchData
                .filter(m => 
                    m.Div === league &&
                    Number(m.Date) > Number(opponentMatch.Date) &&
                    Number(m.Date) < Number(surpriseMatch.Date) &&
                    (m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam)
                ).length;

            patterns.push({
                season: checkSeason,
                isHome: opponentMatch.HomeTeam === selectedTeam,
                matchesUntilSurprise: matchesBetween,
                surpriseOpponent: surpriseMatch.HomeTeam === selectedTeam 
                    ? surpriseMatch.AwayTeam 
                    : surpriseMatch.HomeTeam
            });
        });

        // Toplanan pattern'leri Map'e ekle
        allPatternsByOpponent.set(opponent, patterns);

        // Ana pattern'ler için analiz
        const matchCounts = new Map<number, {
            count: number;
            isHome: boolean;
            patterns: typeof patterns;
        }>();

        patterns.forEach(p => {
            const key = p.matchesUntilSurprise;
            if (!matchCounts.has(key)) {
                matchCounts.set(key, {
                    count: 0,
                    isHome: p.isHome,
                    patterns: []
                });
            }
            const data = matchCounts.get(key)!;
            if (data.isHome === p.isHome || data.count < 3) {
                data.count++;
                data.patterns.push(p);
            }
        });

        // En az 3 kez tekrar eden pattern'i bul
        matchCounts.forEach((data, matchCount) => {
            if (data.count >= 3) {
                const mainPatterns = data.patterns.filter(p => p.isHome === data.isHome);
                const exceptions = data.patterns.filter(p => p.isHome !== data.isHome);
                
                if (mainPatterns.length >= 3) {
                    results.push({
                        triggerTeam: opponent,
                        matches: [
                            ...mainPatterns.map(p => ({...p})),
                            ...exceptions.map(p => ({...p, isException: true}))
                        ]
                    });
                }
            }
        });
    });

    // Son 5 sene için pattern analizi
    const currentYear = new Date().getFullYear();
    const last5Years = new Set(
        Array.from({ length: 5 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`)
    );

    // Her rakip için son 5 yıl analizi
    allPatternsByOpponent.forEach((patterns, opponent) => {
        const recentSeasonPatterns = patterns.filter(p => 
            last5Years.has(p.season)
        );

        // Pattern'leri analiz et (son 5 sene için)
        const recentMatchCounts = new Map<number, {
            count: number;
            isHome: boolean;
            patterns: typeof patterns;
        }>();

        recentSeasonPatterns.forEach(p => {
            const key = p.matchesUntilSurprise;
            if (!recentMatchCounts.has(key)) {
                recentMatchCounts.set(key, {
                    count: 0,
                    isHome: p.isHome,
                    patterns: []
                });
            }
            const data = recentMatchCounts.get(key)!;
            if (data.isHome === p.isHome || data.count < 2) {
                data.count++;
                data.patterns.push(p);
            }
        });

        // En az 2 kez tekrar eden pattern'i bul
        recentMatchCounts.forEach((data, matchCount) => {
            if (data.count >= 2) {
                const mainPatterns = data.patterns.filter(p => p.isHome === data.isHome);
                if (mainPatterns.length >= 2) {
                    recentPatterns.push({
                        triggerTeam: opponent,
                        matches: mainPatterns,
                        repeatCount: mainPatterns.length
                    });
                }
            }
        });
    });

    return { mainResults: results, recentPatterns };
};

// Tek seferlik pattern'leri analiz eden fonksiyon
const analyzeSingleTimePatterns = (
    selectedTeam: string,
    league: string,
    season: string,
    matchData: any[]
): SingleTimePattern[] => {
    const results: SingleTimePattern[] = [];

    // Mevcut sezondaki takımları bul
    const currentSeasonTeams = new Set(
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) === season)
            .flatMap(m => [m.HomeTeam, m.AwayTeam])
    );

    // Tüm sezonları bul ve sırala (mevcut sezon hariç)
    const allSeasons = [...new Set(
        matchData
            .filter(m => m.Div === league && getSeasonFromDate(Number(m.Date)) !== season)
            .map(m => getSeasonFromDate(Number(m.Date)))
    )].sort((a, b) => {
        const yearA = parseInt(a.split('-')[0]);
        const yearB = parseInt(b.split('-')[0]);
        return yearB - yearA;
    });

    // Her sezonu kontrol et
    allSeasons.forEach(checkingSeason => {
        // Bu sezondaki sürpriz maçları bul
        const seasonSurprises = matchData.filter(m => 
            m.Div === league &&
            getSeasonFromDate(Number(m.Date)) === checkingSeason &&
            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
        );

        // Her sürpriz maç için
        seasonSurprises.forEach(surpriseMatch => {
            const surpriseTeam = surpriseMatch.HomeTeam === selectedTeam 
                ? surpriseMatch.HomeTeam 
                : surpriseMatch.AwayTeam === selectedTeam 
                    ? surpriseMatch.AwayTeam 
                    : null;

            if (!surpriseTeam) return;

            // Sürprizden önceki maçları bul
            const previousMatches = matchData
                .filter(m => 
                    m.Div === league &&
                    getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                    Number(m.Date) < Number(surpriseMatch.Date) &&
                    (m.HomeTeam === surpriseTeam || m.AwayTeam === surpriseTeam)
                )
                .sort((a, b) => Number(b.Date) - Number(a.Date));

            // Her önceki maç için
            previousMatches.forEach(triggerMatch => {
                const triggerOpponent = triggerMatch.HomeTeam === surpriseTeam 
                    ? triggerMatch.AwayTeam 
                    : triggerMatch.HomeTeam;

                // Eğer tetikleyici takım bu sezon ligde yoksa atla
                if (!currentSeasonTeams.has(triggerOpponent)) return;

                // Aradaki maç sayısını hesapla
                const matchesBetween = matchData
                    .filter(m => 
                        m.Div === league &&
                        getSeasonFromDate(Number(m.Date)) === checkingSeason &&
                        Number(m.Date) > Number(triggerMatch.Date) &&
                        Number(m.Date) < Number(surpriseMatch.Date) &&
                        (m.HomeTeam === surpriseTeam || m.AwayTeam === surpriseTeam)
                    ).length;

                // Bu pattern'in diğer sezonlarda kullanılıp kullanılmadığını kontrol et
                const isUsedInOtherSeasons = allSeasons
                    .filter(s => s !== checkingSeason)
                    .some(otherSeason => {
                        // Önce bu rakiple maç var mı
                        const triggerExists = matchData.some(m =>
                            m.Div === league &&
                            getSeasonFromDate(Number(m.Date)) === otherSeason &&
                            ((m.HomeTeam === surpriseTeam && m.AwayTeam === triggerOpponent) ||
                             (m.AwayTeam === surpriseTeam && m.HomeTeam === triggerOpponent))
                        );

                        if (!triggerExists) return false;

                        // Sonra benzer pattern var mı
                        return matchData.some(m =>
                            m.Div === league &&
                            getSeasonFromDate(Number(m.Date)) === otherSeason &&
                            ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H')) &&
                            (m.HomeTeam === surpriseTeam || m.AwayTeam === surpriseTeam)
                        );
                    });

                // Eğer başka sezonlarda kullanılmamışsa ekle
                if (!isUsedInOtherSeasons) {
                    results.push({
                        triggerTeam: triggerOpponent,
                        historicalMatch: {
                            season: checkingSeason,
                            isHome: triggerMatch.HomeTeam === surpriseTeam,
                            matchesUntilSurprise: matchesBetween,
                            surpriseOpponent: surpriseMatch.HomeTeam === surpriseTeam 
                                ? surpriseMatch.AwayTeam 
                                : surpriseMatch.HomeTeam
                        },
                        currentMatch: {
                            matchesPlayed: matchesBetween,
                            isHome: triggerMatch.HomeTeam === surpriseTeam
                        }
                    });
                }
            });
        });
    });

    return results;
};

// Yardımcı fonksiyonlar
const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Ana komponent
export const SimilarityChaseAnalysis: React.FC<SimilarityChaseAnalysisProps> = ({
    league,
    season,
    matchData,
    onClose
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [similarityResults, setSimilarityResults] = useState<SimilarityChaseResult[]>([]);
    const [triggerResults, setTriggerResults] = useState<{ mainResults: FixtureTriggerResult[], recentPatterns: RecentPatternResult[] }>({ mainResults: [], recentPatterns: [] });
    const [singleTimePatterns, setSingleTimePatterns] = useState<SingleTimePattern[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    const handleTeamSelect = async (team: string) => {
        setSelectedTeam(team);
        setShowTeamSelection(false);
        setIsAnalyzing(true);
        
        setTimeout(() => {
            const similarity = analyzeSimilarityChase(team, league, season, matchData);
            const triggers = analyzeFixtureTriggers(team, league, season, matchData);
            const singleTime = analyzeSingleTimePatterns(team, league, season, matchData);
            setSimilarityResults(similarity);
            setTriggerResults(triggers);
            setSingleTimePatterns(singleTime);
            setIsAnalyzing(false);
        }, 100);
    };

    const handleBack = () => {
        setSelectedTeam(null);
        setSimilarityResults([]);
        setTriggerResults({ mainResults: [], recentPatterns: [] });
        setSingleTimePatterns([]);
        setShowTeamSelection(true);
    };

    return (
        <>
            <TeamSelectionModal
                isOpen={showTeamSelection}
                onClose={onClose}
                teams={teams}
                onSelect={handleTeamSelect}
            />

            {!showTeamSelection && selectedTeam && (
                <div className="p-6 h-screen">
                    <ResultsDisplay
                        selectedTeam={selectedTeam}
                        similarityResults={similarityResults}
                        triggerResults={triggerResults}
                        singleTimePatterns={singleTimePatterns}
                        onBack={handleBack}
                        isAnalyzing={isAnalyzing}
                    />
                </div>
            )}
        </>
    );
}; 