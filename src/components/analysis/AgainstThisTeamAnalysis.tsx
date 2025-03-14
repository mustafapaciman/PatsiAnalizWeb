import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';
import { LEAGUE_INFO } from './FormulaSearchModal';

interface AgainstThisTeamAnalysisProps {
    matchData: any[];
    onClose: () => void;
    league?: string;  // Opsiyonel, kullanılmayacak
    season?: string;  // Opsiyonel, kullanılmayacak
}

interface MatchResult {
    type: 'direct' | 'surprise';  // Maç tipi: direkt karşılaşma veya sürpriz maç
    date: string;
    season: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    competition: string;
    htResult: string; // H, D, A
    ftResult: string; // H, D, A
    surpriseTeam?: string; // Sürpriz yapan takım (X veya Y)
}

// Yardımcı fonksiyonlar
const formatDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const getSeasonFromDate = (excelDate: number): string => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

// Takım Seçim Modalı
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
            <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl">
                <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <p className="text-gray-400 mt-2">Analiz etmek istediğiniz takımı seçin</p>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
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
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Lig Seçim Modalı
const LeagueSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    leagues: string[];
    onSelect: (league: string) => void;
}> = ({ isOpen, onClose, leagues, onSelect }) => {
    // Lig isimlerini dönüştür ve undefined kontrolü yap
    const leagueNames = leagues
        .filter(league => league && LEAGUE_INFO[league]) // Sadece geçerli ligleri al
        .map(league => ({
            code: league,
            name: LEAGUE_INFO[league].name
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl bg-gray-900 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-white">Lig Seçin</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {leagueNames.map(({ code, name }) => (
                            <button
                                key={code}
                                onClick={() => onSelect(code)}
                                className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 
                                         transition-all text-left flex items-center gap-3"
                            >
                                {LEAGUE_INFO[code]?.logo && (
                                    <img 
                                        src={LEAGUE_INFO[code].logo} 
                                        alt={name}
                                        className={`w-8 h-8 object-contain ${
                                            LEAGUE_INFO[code].needsWhiteBg ? 'bg-white rounded' : ''
                                        }`}
                                    />
                                )}
                                <span className="text-white">{name}</span>
                            </button>
                        ))}
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

// Sürpriz kontrolü için yardımcı fonksiyon
const isSurpriseMatch = (match: any): boolean => {
    const htResult = match.HTHG > match.HTAG ? 'H' : match.HTHG < match.HTAG ? 'A' : 'D';
    const ftResult = match.FTHG > match.FTAG ? 'H' : match.FTHG < match.FTAG ? 'A' : 'D';
    
    return (htResult === 'H' && ftResult === 'A') || (htResult === 'A' && ftResult === 'H');
};

// Sonuçları Göster
const ResultsDisplay: React.FC<{
    teamX: string;
    teamY: string;
    results: MatchResult[];
    onBack: () => void;
    isAnalyzing: boolean;
}> = ({ teamX, teamY, results, onBack, isAnalyzing }) => {
    if (isAnalyzing) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    const directMatches = results.filter(r => r.type === 'direct');
    const surpriseMatches = results.filter(r => r.type === 'surprise');

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            {/* Header - Sabit kalacak */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center text-purple-500 hover:text-purple-400">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Geri Dön
                </button>
                <div className="flex items-center gap-3">
                    <TeamLogo name={teamX} className="w-8 h-8" />
                    <span className="text-gray-400">vs</span>
                    <TeamLogo name={teamY} className="w-8 h-8" />
                </div>
            </div>

            {/* Sonuçlar - Scrollable alan */}
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <div className="space-y-8">
                    {/* Direkt Karşılaşmalar */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white sticky top-0 bg-gray-900 py-2 z-10">
                            Karşılaşmalar ({directMatches.length})
                        </h3>
                        <div className="space-y-4">
                            {directMatches.map((match) => (
                                <div key={`${match.date}-${match.homeTeam}-${match.awayTeam}`} 
                                     className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{match.date}</span>
                                        <span className="text-purple-400">{match.competition}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <TeamLogo name={match.homeTeam} className="w-8 h-8" />
                                            <span className="text-white">{match.homeTeam}</span>
                                            <span className="text-gray-400 mx-2">vs</span>
                                            <TeamLogo name={match.awayTeam} className="w-8 h-8" />
                                            <span className="text-white">{match.awayTeam}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">İlk Yarı</div>
                                            <div className="text-lg font-semibold text-white">{match.htScore}</div>
                                            <div className="text-sm text-gray-400">Maç Sonu</div>
                                            <div className="text-lg font-semibold text-white">{match.ftScore}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sürpriz Maçlar */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white sticky top-0 bg-gray-900 py-2 z-10">
                            Sürpriz Maçlar ({surpriseMatches.length})
                        </h3>
                        <div className="space-y-4">
                            {surpriseMatches.map((match) => (
                                <div key={`${match.date}-${match.homeTeam}-${match.awayTeam}`} 
                                     className="bg-purple-900/20 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{match.date}</span>
                                        <span className="text-purple-400">{match.competition}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <TeamLogo name={match.homeTeam} className="w-8 h-8" />
                                            <span className="text-white">{match.homeTeam}</span>
                                            <span className="text-gray-400 mx-2">vs</span>
                                            <TeamLogo name={match.awayTeam} className="w-8 h-8" />
                                            <span className="text-white">{match.awayTeam}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-400">İlk Yarı</div>
                                            <div className="text-lg font-semibold text-white">{match.htScore}</div>
                                            <div className="text-sm text-gray-400">Maç Sonu</div>
                                            <div className="text-lg font-semibold text-white">{match.ftScore}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Ana Komponent
export const AgainstThisTeamAnalysis: React.FC<AgainstThisTeamAnalysisProps> = ({
    matchData,
    onClose
}) => {
    const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [showTeamSelection, setShowTeamSelection] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Tüm takımları al
    const allTeams = useMemo(() => {
        const teamSet = new Set<string>();
        matchData.forEach(m => {
            teamSet.add(m.HomeTeam);
            teamSet.add(m.AwayTeam);
        });
        return Array.from(teamSet).filter(Boolean).sort();
    }, [matchData]);

    const handleTeamSelect = (team: string) => {
        const newSelectedTeams = [...selectedTeams, team];
        setSelectedTeams(newSelectedTeams);

        if (newSelectedTeams.length === 2) {
            setShowTeamSelection(false);
            setIsAnalyzing(true);
            analyzeMatches(newSelectedTeams[0], newSelectedTeams[1]);
        }
    };

    const analyzeMatches = (teamX: string, teamY: string) => {
        console.log("Analiz başlıyor:", { teamX, teamY });
        const results: MatchResult[] = [];
        
        // Y'nin ligini bul
        const teamYLeague = matchData.find(m => 
            m.HomeTeam === teamY || m.AwayTeam === teamY
        )?.Div;

        console.log("Y'nin ligi:", teamYLeague);

        if (!teamYLeague) {
            console.log("Y'nin ligi bulunamadı");
            setResults([]);
            setIsAnalyzing(false);
            return;
        }

        // Y'nin ligindeki tüm takımları bul
        const leagueTeams = new Set<string>();
        matchData
            .filter(m => m.Div === teamYLeague)
            .forEach(m => {
                leagueTeams.add(m.HomeTeam);
                leagueTeams.add(m.AwayTeam);
            });

        console.log("Ligdeki takımlar:", Array.from(leagueTeams));

        // X'in bu ligin takımlarıyla olan TÜM maçlarını bul (lig kısıtlaması olmadan)
        const xMatches = matchData
            .filter(m => 
                (m.HomeTeam === teamX && leagueTeams.has(m.AwayTeam)) ||
                (m.AwayTeam === teamX && leagueTeams.has(m.HomeTeam))
                // m.Div === teamYLeague kısıtlamasını kaldırdık
            )
            .sort((a, b) => Number(a.Date) - Number(b.Date));

        console.log("X'in maçları:", xMatches);

        // Her maç için kontrol yap
        xMatches.forEach(match => {
            const opponent = match.HomeTeam === teamX ? match.AwayTeam : match.HomeTeam;
            
            // X'in sonraki maçını kontrol et
            const nextXMatch = matchData.find(m => 
                (m.HomeTeam === teamX || m.AwayTeam === teamX) &&
                Number(m.Date) > Number(match.Date)
            );

            // Rakibin sonraki maçını kontrol et
            const nextOpponentMatch = matchData.find(m => 
                (m.HomeTeam === opponent || m.AwayTeam === opponent) &&
                Number(m.Date) > Number(match.Date)
            );

            // Sürpriz kontrolü
            const hasSurprise = (nextXMatch && isSurpriseMatch(nextXMatch)) || 
                               (nextOpponentMatch && isSurpriseMatch(nextOpponentMatch));

            console.log("Maç kontrolü:", {
                match,
                opponent,
                nextXMatch,
                nextOpponentMatch,
                hasSurprise
            });

            // Ana maçı ve varsa sürpriz maçları ekle
            if (hasSurprise) {
                // Ana maçı ekle
                results.push({
                    type: 'direct',
                    date: formatDate(Number(match.Date)),
                    season: getSeasonFromDate(Number(match.Date)),
                    homeTeam: match.HomeTeam,
                    awayTeam: match.AwayTeam,
                    htScore: `${match.HTHG}-${match.HTAG}`,
                    ftScore: `${match.FTHG}-${match.FTAG}`,
                    competition: LEAGUE_INFO[match.Div]?.name || match.Div,
                    htResult: match.HTHG > match.HTAG ? 'H' : match.HTHG < match.HTAG ? 'A' : 'D',
                    ftResult: match.FTHG > match.FTAG ? 'H' : match.FTHG < match.FTAG ? 'A' : 'D'
                });

                if (nextXMatch && isSurpriseMatch(nextXMatch)) {
                    results.push({
                        type: 'surprise',
                        date: formatDate(Number(nextXMatch.Date)),
                        season: getSeasonFromDate(Number(nextXMatch.Date)),
                        homeTeam: nextXMatch.HomeTeam,
                        awayTeam: nextXMatch.AwayTeam,
                        htScore: `${nextXMatch.HTHG}-${nextXMatch.HTAG}`,
                        ftScore: `${nextXMatch.FTHG}-${nextXMatch.FTAG}`,
                        competition: LEAGUE_INFO[nextXMatch.Div]?.name || nextXMatch.Div,
                        htResult: nextXMatch.HTHG > nextXMatch.HTAG ? 'H' : nextXMatch.HTHG < nextXMatch.HTAG ? 'A' : 'D',
                        ftResult: nextXMatch.FTHG > nextXMatch.FTAG ? 'H' : nextXMatch.FTHG < nextXMatch.FTAG ? 'A' : 'D',
                        surpriseTeam: teamX
                    });
                }

                if (nextOpponentMatch && isSurpriseMatch(nextOpponentMatch)) {
                    results.push({
                        type: 'surprise',
                        date: formatDate(Number(nextOpponentMatch.Date)),
                        season: getSeasonFromDate(Number(nextOpponentMatch.Date)),
                        homeTeam: nextOpponentMatch.HomeTeam,
                        awayTeam: nextOpponentMatch.AwayTeam,
                        htScore: `${nextOpponentMatch.HTHG}-${nextOpponentMatch.HTAG}`,
                        ftScore: `${nextOpponentMatch.FTHG}-${nextOpponentMatch.FTAG}`,
                        competition: LEAGUE_INFO[nextOpponentMatch.Div]?.name || nextOpponentMatch.Div,
                        htResult: nextOpponentMatch.HTHG > nextOpponentMatch.HTAG ? 'H' : nextOpponentMatch.HTHG < nextOpponentMatch.HTAG ? 'A' : 'D',
                        ftResult: nextOpponentMatch.FTHG > nextOpponentMatch.FTAG ? 'H' : nextOpponentMatch.FTHG < nextOpponentMatch.FTAG ? 'A' : 'D',
                        surpriseTeam: opponent
                    });
                }
            }
        });

        console.log("Bulunan sonuçlar:", results);
        setResults(results);
        setIsAnalyzing(false);
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
                teams={allTeams}
                onSelect={handleTeamSelect}
                selectedTeams={selectedTeams}
                title={selectedTeams.length === 0 ? "İlk Takımı Seçin" : "İkinci Takımı Seçin"}
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