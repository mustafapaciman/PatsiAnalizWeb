import React, { useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { TeamLogo } from '../TeamLogo';

interface BeforeXTeamUnconditionalProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    season: string;
    surpriseMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
    };
    nextMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        htScore: string;
        ftScore: string;
        opponent: string;
        isHome: boolean;
    };
}

const excelDateToDate = (value: any): Date => {
    const numeric = Number(value);
    return new Date((numeric - 25569) * 86400 * 1000);
};

const formatDate = (value: any): string =>
    excelDateToDate(value).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

const calculateSeason = (value: any): string => {
    const date = excelDateToDate(value);
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const isSurprise = (match: any): boolean =>
    (match.HTR === 'H' && match.FTR === 'A') ||
    (match.HTR === 'A' && match.FTR === 'H');

const analyze = (teamX: string, league: string, matchData: any[]): AnalysisResult[] => {
    const sortedMatches = matchData
        .filter(match => match.Div === league)
        .filter(match => Number.isFinite(Number(match.Date)))
        .sort((a, b) => Number(a.Date) - Number(b.Date));

    const teamMatches = sortedMatches.filter(
        match => match.HomeTeam === teamX || match.AwayTeam === teamX
    );

    const results: AnalysisResult[] = [];

    for (let i = 0; i < teamMatches.length - 1; i++) {
        const current = teamMatches[i];
        if (!isSurprise(current)) continue;

        // Mevcut "X Takımdan Önce" formülündeki sıra mantığını koruyoruz:
        // X'in sürpriz maçından sonra oynadığı ilk maç alınır.
        // Tek fark: sonraki rakibin belirli bir Y takımı olması şartı yoktur.
        const next = teamMatches[i + 1];

        results.push({
            season: calculateSeason(current.Date),
            surpriseMatch: {
                date: formatDate(current.Date),
                homeTeam: current.HomeTeam,
                awayTeam: current.AwayTeam,
                htScore: `${current.HTHG}-${current.HTAG}`,
                ftScore: `${current.FTHG}-${current.FTAG}`
            },
            nextMatch: {
                date: formatDate(next.Date),
                homeTeam: next.HomeTeam,
                awayTeam: next.AwayTeam,
                htScore: `${next.HTHG}-${next.HTAG}`,
                ftScore: `${next.FTHG}-${next.FTAG}`,
                opponent: next.HomeTeam === teamX ? next.AwayTeam : next.HomeTeam,
                isHome: next.HomeTeam === teamX
            }
        });
    }

    return results.sort((a, b) => b.season.localeCompare(a.season));
};

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
                <Dialog.Title className="text-xl font-semibold text-white mb-2">
                    X Takımından Önce (Şartsız Takım)
                </Dialog.Title>
                <p className="text-gray-400 mb-6">
                    Sadece X takımını seçin. Y takımı şartı uygulanmaz.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {teams.map(team => (
                        <button
                            key={team}
                            onClick={() => onSelect(team)}
                            className="flex flex-col items-center p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-all hover:scale-105 hover:shadow-lg"
                        >
                            <TeamLogo name={team} className="w-16 h-16 mb-2" />
                            <span className="text-sm text-gray-300 text-center">{team}</span>
                        </button>
                    ))}
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

export const BeforeXTeamUnconditional: React.FC<BeforeXTeamUnconditionalProps> = ({
    league,
    matchData,
    onClose
}) => {
    const [teamX, setTeamX] = useState<string | null>(null);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const teams = useMemo(() => {
        const set = new Set<string>();
        matchData
            .filter(match => match.Div === league)
            .forEach(match => {
                if (match.HomeTeam) set.add(match.HomeTeam);
                if (match.AwayTeam) set.add(match.AwayTeam);
            });
        return Array.from(set).sort();
    }, [league, matchData]);

    const groupedResults = useMemo(() => {
        const groups = new Map<string, AnalysisResult[]>();
        results.forEach(result => {
            if (!groups.has(result.season)) groups.set(result.season, []);
            groups.get(result.season)!.push(result);
        });
        return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
    }, [results]);

    const handleSelect = (team: string) => {
        setTeamX(team);
        setIsAnalyzing(true);
        setTimeout(() => {
            setResults(analyze(team, league, matchData));
            setIsAnalyzing(false);
        }, 50);
    };

    const handleBack = () => {
        setTeamX(null);
        setResults([]);
    };

    if (!teamX) {
        return (
            <TeamSelectionModal
                isOpen={true}
                onClose={onClose}
                teams={teams}
                onSelect={handleSelect}
            />
        );
    }

    return (
        <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 shadow-xl shadow-blue-900/20 relative overflow-hidden">
                <button
                    onClick={handleBack}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors text-white"
                    title="Takım seçimine dön"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-5 mt-5">
                    <TeamLogo name={teamX} className="w-16 h-16" />
                    <div>
                        <h2 className="text-3xl font-bold text-white">
                            X Takımından Önce (Şartsız Takım)
                        </h2>
                        <p className="text-blue-200 mt-1">
                            {teamX} için Y takımı şartı olmadan tüm sezonlardaki sürpriz → sonraki maç zincirleri
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto mt-8 px-2 pb-8">
                {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                        <p className="text-gray-400">Analiz yapılıyor...</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="text-center py-16 bg-gray-800/30 rounded-xl border border-gray-700/30">
                        <p className="text-gray-300 text-lg">Bu takım için sürpriz zinciri bulunamadı.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="text-gray-300">
                                Toplam <span className="font-semibold text-white">{results.length}</span> sonuç
                            </div>
                            <div className="text-sm text-gray-500">
                                {groupedResults.length} sezon
                            </div>
                        </div>

                        {groupedResults.map(([seasonName, seasonResults]) => (
                            <section key={seasonName} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-white">{seasonName}</h3>
                                    <span className="px-2.5 py-1 text-xs rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                                        {seasonResults.length} sonuç
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {seasonResults.map((result, index) => (
                                        <div
                                            key={`${seasonName}-${index}`}
                                            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/30 hover:border-blue-500/30 transition-all p-6"
                                        >
                                            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-5 items-center">
                                                <div>
                                                    <div className="text-xs uppercase tracking-wide text-red-300 mb-3">
                                                        Sürpriz
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <TeamLogo name={result.surpriseMatch.homeTeam} className="w-10 h-10" />
                                                        <span className="text-gray-200">{result.surpriseMatch.homeTeam}</span>
                                                        <span className="text-gray-500">vs</span>
                                                        <TeamLogo name={result.surpriseMatch.awayTeam} className="w-10 h-10" />
                                                        <span className="text-gray-200">{result.surpriseMatch.awayTeam}</span>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between gap-4">
                                                        <span className="text-sm text-gray-500">{result.surpriseMatch.date}</span>
                                                        <span className="font-semibold text-white">
                                                            {result.surpriseMatch.htScore} → {result.surpriseMatch.ftScore}
                                                        </span>
                                                    </div>
                                                </div>

                                                <ArrowRight className="w-6 h-6 text-blue-400 mx-auto" />

                                                <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/10">
                                                    <div className="text-xs uppercase tracking-wide text-blue-300 mb-3">
                                                        X'in sonraki maçı — rakip şartsız
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <TeamLogo name={result.nextMatch.homeTeam} className="w-9 h-9" />
                                                        <span className="text-gray-200">{result.nextMatch.homeTeam}</span>
                                                        <span className="text-gray-500">vs</span>
                                                        <TeamLogo name={result.nextMatch.awayTeam} className="w-9 h-9" />
                                                        <span className="text-gray-200">{result.nextMatch.awayTeam}</span>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between gap-4">
                                                        <span className="text-sm text-blue-300">{result.nextMatch.date}</span>
                                                        <span className="font-semibold text-white">
                                                            {result.nextMatch.htScore} → {result.nextMatch.ftScore}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
