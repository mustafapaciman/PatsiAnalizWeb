import React, { useState, useMemo } from 'react';
import { TeamLogo } from '../../TeamLogo';

interface WeekAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchData: any[];
    selectedLeague: string;
    formatDate: (date: number) => string;
}

interface WeekMatch {
    date: string;
    dayName: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    isSurprise: boolean;
}

interface WeekData {
    weekNumber: number;
    matches: WeekMatch[];
    hasSurprise: boolean;
    surpriseMatch?: WeekMatch;
}

interface SeasonData {
    season: string;
    weeks: WeekData[];
}

// Sezon başlangıç ayını belirleyelim (Temmuz ortası)
const SEASON_START_MONTH = 6; // 0-based index: 6 = Temmuz
const SEASON_START_DAY = 15; // Temmuz'un 15'i

// Yeni hafta hesaplama fonksiyonu
const calculateWeekNumber = (matchDate: Date, seasonMatches: any[], team: string): number => {
    // Sezon başlangıç tarihini belirle
    const year = matchDate.getFullYear();
    const seasonStartYear = matchDate.getMonth() >= SEASON_START_MONTH ? year : year - 1;
    const seasonStart = new Date(seasonStartYear, SEASON_START_MONTH, SEASON_START_DAY);

    // Takımın sezon maçlarını filtrele ve sırala
    const teamMatches = seasonMatches
        .filter(match => 
            (match.HomeTeam === team || match.AwayTeam === team) &&
            new Date((Number(match.Date) - 25569) * 86400 * 1000) >= seasonStart
        )
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    // Bu maçın takım için kaçıncı maç olduğunu bul
    const matchIndex = teamMatches.findIndex(m => 
        new Date((Number(m.Date) - 25569) * 86400 * 1000).getTime() === matchDate.getTime()
    );

    // Hafta numarası = maç sırası + 1
    return matchIndex + 1;
};

export const WeekAnalysisModal: React.FC<WeekAnalysisModalProps> = ({
    isOpen,
    onClose,
    matchData,
    selectedLeague,
    formatDate
}) => {
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    // Takımları al
    const teams = useMemo(() => {
        return Array.from(new Set(
            matchData
                .filter(m => m.Div === selectedLeague)
                .flatMap(m => [m.HomeTeam, m.AwayTeam])
        )).sort();
    }, [matchData, selectedLeague]);

    // Hafta analizini yap
    const weekAnalysis = useMemo(() => {
        if (!selectedTeam) return [];

        const seasons: SeasonData[] = [];
        const seasonMatches: Record<string, any[]> = {};

        // Maçları sezonlara ayır
        matchData
            .filter(m => m.Div === selectedLeague)
            .forEach(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                const year = matchDate.getFullYear();
                const month = matchDate.getMonth();
                // Sezon başlangıcını Temmuz 15'e göre ayarla
                const seasonStartYear = (month > SEASON_START_MONTH || 
                                       (month === SEASON_START_MONTH && matchDate.getDate() >= SEASON_START_DAY)) 
                                      ? year : year - 1;
                const season = `${seasonStartYear}-${seasonStartYear + 1}`;

                if (!seasonMatches[season]) {
                    seasonMatches[season] = [];
                }
                seasonMatches[season].push(match);
            });

        // İlk 5 maçı logla
        Object.entries(seasonMatches).forEach(([season, matches]) => {
            const sortedSeasonMatches = matches.sort((a, b) => Number(a.Date) - Number(b.Date));
            console.log(`=== ${season} Sezonu İlk Maçlar ===`);
            console.log('Toplam maç sayısı:', matches.length);
            console.log('İlk maç tarihi:', formatDate(Number(sortedSeasonMatches[0].Date)));
            
            // Seçili takımın ilk maçını bul
            const firstTeamMatch = sortedSeasonMatches.find(m => 
                m.HomeTeam === selectedTeam || m.AwayTeam === selectedTeam
            );
            
            if (firstTeamMatch) {
                console.log('Seçili Takımın İlk Maçı:', {
                    date: formatDate(Number(firstTeamMatch.Date)),
                    homeTeam: firstTeamMatch.HomeTeam,
                    awayTeam: firstTeamMatch.AwayTeam,
                    score: `${firstTeamMatch.FTHG}-${firstTeamMatch.FTAG}`,
                    weekNumber: calculateWeekNumber(
                        new Date((Number(firstTeamMatch.Date) - 25569) * 86400 * 1000), 
                        matches,
                        selectedTeam
                    ),
                    matchIndex: sortedSeasonMatches.indexOf(firstTeamMatch)
                });
            }
            
            // Tüm haftanın ilk 5 maçı
            sortedSeasonMatches.slice(0, 5).forEach(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                console.log({
                    date: formatDate(Number(match.Date)),
                    jsDate: matchDate.toISOString(),
                    weekNumber: calculateWeekNumber(matchDate, matches, selectedTeam),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    score: `${match.FTHG}-${match.FTAG}`,
                    rawDate: match.Date
                });
            });
        });

        // Her sezon için hafta hesaplaması yap
        Object.entries(seasonMatches).forEach(([season, matches]) => {
            const seasonData: SeasonData = { season, weeks: [] };
            
            matches.forEach(match => {
                const matchDate = new Date((Number(match.Date) - 25569) * 86400 * 1000);
                
                // Maç seçili takımın maçıysa hafta numarasını hesapla
                const isTeamMatch = match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam;
                const weekNumber = isTeamMatch 
                    ? calculateWeekNumber(matchDate, matches, selectedTeam)
                    : calculateWeekNumber(matchDate, matches, match.HomeTeam); // Diğer maçlar için ev sahibi takımın haftasını kullan

                // Maç bilgilerini oluştur
                const matchInfo: WeekMatch = {
                    date: formatDate(Number(match.Date)),
                    dayName: matchDate.toLocaleDateString('tr-TR', { weekday: 'long' }),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    htScore: `${match.HTHG}-${match.HTAG}`,
                    ftScore: `${match.FTHG}-${match.FTAG}`,
                    isSurprise: (match.HTR === 'H' && match.FTR === 'A') || 
                               (match.HTR === 'A' && match.FTR === 'H')
                };

                // Hafta verilerini güncelle
                let weekData = seasonData.weeks.find(w => w.weekNumber === weekNumber);
                if (!weekData) {
                    weekData = { weekNumber, matches: [], hasSurprise: false };
                    seasonData.weeks.push(weekData);
                }

                weekData.matches.push(matchInfo);

                // Sürpriz kontrolü
                if (matchInfo.isSurprise && 
                    (match.HomeTeam === selectedTeam || match.AwayTeam === selectedTeam)) {
                    weekData.hasSurprise = true;
                    weekData.surpriseMatch = matchInfo;
                }
            });

            seasons.push(seasonData);
        });

        return seasons
            .map(season => ({
                ...season,
                weeks: season.weeks.sort((a, b) => a.weekNumber - b.weekNumber)
            }))
            .sort((a, b) => b.season.localeCompare(a.season));
    }, [selectedTeam, matchData, selectedLeague]);

    // Ortak skor analizi
    const findCommonScores = (week: number, seasons: SeasonData[]): Set<string> => {
        const weekData = seasons
            .map(season => season.weeks.find(w => w.weekNumber === week))
            .filter(Boolean);
        
        if (weekData.length < 2) return new Set();

        // Her sezonun maç skorlarını karşılaştır
        const commonScores = new Set<string>();
        
        weekData[0]?.matches.forEach(match1 => {
            const score = `${match1.htScore}-${match1.ftScore}`;
            const isCommon = weekData.slice(1).every(week => 
                week?.matches.some(match2 => 
                    `${match2.htScore}-${match2.ftScore}` === score
                )
            );
            if (isCommon) commonScores.add(score);
        });

        return commonScores;
    };

    // Maç kartını güncelleyelim
    const MatchCard = ({ match, commonScores }: { 
        match: WeekMatch, 
        commonScores: Set<string> 
    }) => {
        const score = `${match.htScore}-${match.ftScore}`;
        const isCommonScore = commonScores.has(score);
        
        return (
            <div className={`flex items-center justify-between rounded-lg p-3 
                ${match.isSurprise ? 'bg-orange-900/30' : 
                  isCommonScore ? 'bg-green-900/30' : 
                  'bg-black/20'}`}
            >
                <div className="flex items-center gap-3">
                    <TeamLogo name={match.homeTeam} className="w-6 h-6" />
                    <span className="text-gray-300">
                        {match.htScore} → {match.ftScore}
                    </span>
                    <TeamLogo name={match.awayTeam} className="w-6 h-6" />
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-400">{match.dayName}</div>
                    <div className="text-sm text-gray-500">{match.date}</div>
                </div>
            </div>
        );
    };

    // Filtrelemeyi güncelleyelim
    const filteredAnalysis = useMemo(() => {
        if (!weekAnalysis) return [];

        let filtered = weekAnalysis;
        
        // Seçili hafta varsa sadece o haftayı göster
        if (selectedWeek !== null) {
            filtered = filtered.map(season => ({
                ...season,
                weeks: season.weeks.filter(week => 
                    week.weekNumber === selectedWeek && week.hasSurprise
                )
            }));
        } else {
            // Sadece sürpriz olan haftaları göster
            filtered = filtered.map(season => ({
                ...season,
                weeks: season.weeks.filter(week => week.hasSurprise)
            }));
        }

        // Boş sezonları filtrele
        filtered = filtered.filter(season => season.weeks.length > 0);
        
        return filtered.sort((a, b) => b.season.localeCompare(a.season));
    }, [weekAnalysis, selectedWeek]);

    // TeamSelector component'i ekleyelim
    const TeamSelector = ({ teams, selectedTeam, onSelect }: { 
        teams: string[], 
        selectedTeam: string, 
        onSelect: (team: string) => void 
    }) => (
        <div className="grid grid-cols-6 gap-4 p-6">
            {teams.map(team => (
                <button
                    key={team}
                    onClick={() => onSelect(team)}
                    className={`flex flex-col items-center p-4 rounded-xl transition-all
                        ${selectedTeam === team 
                            ? 'bg-emerald-900/30 ring-2 ring-emerald-500/50 scale-105' 
                            : 'bg-gray-800/50 hover:bg-gray-800/70'}`}
                >
                    <TeamLogo name={team} className="w-16 h-16 mb-2" />
                    <span className="text-sm text-center text-gray-300">{team}</span>
                </button>
            ))}
        </div>
    );

    // Mevcut tüm haftaları hesapla
    const availableWeeks = useMemo(() => {
        if (!weekAnalysis) return [];
        const weeks = new Set<number>();
        weekAnalysis.forEach(season => 
            season.weeks.forEach(week => weeks.add(week.weekNumber))
        );
        return Array.from(weeks).sort((a, b) => a - b);
    }, [weekAnalysis]);

    return (
        <div className={`fixed inset-0 bg-black/50 z-50 ${isOpen ? 'flex' : 'hidden'}`}>
            <div className="m-auto bg-gray-900 rounded-xl w-[90vw] max-w-7xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-200">Hafta Analizi</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {selectedTeam && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <TeamLogo name={selectedTeam} className="w-8 h-8" />
                                <span className="text-gray-300">{selectedTeam}</span>
                            </div>
                            <div className="h-6 w-px bg-gray-700" /> {/* Ayraç */}
                            <div className="flex items-center gap-4">
                                <span className="text-gray-400">Hafta:</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedWeek(null)}
                                        className={`px-3 py-1 rounded-lg transition-colors text-sm
                                            ${selectedWeek === null 
                                                ? 'bg-emerald-500/20 text-emerald-400' 
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                    >
                                        Tümü
                                    </button>
                                    {availableWeeks.map(week => (
                                        <button
                                            key={week}
                                            onClick={() => setSelectedWeek(week)}
                                            className={`px-3 py-1 rounded-lg transition-colors text-sm
                                                ${selectedWeek === week 
                                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                        >
                                            {week}. Hafta
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content with Scroll */}
                <div className="flex-1 overflow-y-auto">
                    {!selectedTeam ? (
                        // Takım Seçim Ekranı
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-300 mb-6">Takım Seçin</h3>
                            <TeamSelector 
                                teams={teams} 
                                selectedTeam={selectedTeam} 
                                onSelect={setSelectedTeam} 
                            />
                        </div>
                    ) : filteredAnalysis.length === 0 ? (
                        // Sürpriz Bulunamadı Mesajı
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-lg">Bu takım için sürpriz bulunamadı</div>
                        </div>
                    ) : (
                        // Analiz Sonuçları - Sadece Sürpriz Olan Haftalar
                        <div className="space-y-8 p-6">
                            {filteredAnalysis.map(season => (
                                <div key={season.season} className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-medium text-emerald-400">
                                            {season.season} Sezonu
                                        </h3>
                                        <span className="text-sm text-gray-400">
                                            {season.weeks.length} sürpriz hafta
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {season.weeks.map(week => (
                                            <div key={week.weekNumber} className="bg-gray-800/30 rounded-xl overflow-hidden">
                                                {/* Hafta Başlığı */}
                                                <div className="bg-gray-800 p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                                                            <span className="text-lg font-bold text-gray-300">
                                                                {week.weekNumber}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-300">Hafta</span>
                                                    </div>
                                                </div>

                                                {/* Sürpriz Maç */}
                                                <div className="bg-red-900/20 p-6 border-b border-gray-700/50">
                                                    <div className="text-red-400 text-sm mb-3">Sürpriz Maç</div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <TeamLogo name={week.surpriseMatch!.homeTeam} className="w-12 h-12" />
                                                            <div className="text-2xl font-bold text-gray-200">
                                                                {week.surpriseMatch!.htScore} → {week.surpriseMatch!.ftScore}
                                                            </div>
                                                            <TeamLogo name={week.surpriseMatch!.awayTeam} className="w-12 h-12" />
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-400">
                                                                {week.surpriseMatch!.dayName}
                                                            </div>
                                                            <div className="text-lg text-gray-300">
                                                                {week.surpriseMatch!.date}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Haftanın Diğer Maçları */}
                                                <div className="p-6">
                                                    <div className="text-sm text-gray-400 mb-3">Haftanın Diğer Maçları</div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {week.matches
                                                            .filter(m => !(m.homeTeam === week.surpriseMatch?.homeTeam && 
                                                                          m.awayTeam === week.surpriseMatch?.awayTeam))
                                                            .map((match, idx) => (
                                                                <MatchCard key={idx} match={match} commonScores={findCommonScores(week.weekNumber, weekAnalysis)} />
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 