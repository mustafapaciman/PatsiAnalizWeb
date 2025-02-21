import React, { useState } from 'react';
import { TeamLogo } from '../TeamLogo';
import { ArrowLeft, X, Heart } from 'lucide-react';

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

// Takım isimlerini güvenli ID'lere çevirmek için yardımcı fonksiyon
const createTeamId = (teamName: string) => {
    return teamName.toLowerCase().replace(/\s+/g, '-');
};

// Takım ID'lerini isimlere çevirmek için bir map oluştur
const teamNameMap = new Map<string, string>();

// Özel durumlar için kontrol - tüm boşluklu takımları ekleyelim
const specialTeams = [
    'St Mirren', 
    'Ross County', 
    'St Johnstone',
    'Athens Kallithea',
    'Doxa Dramas',
    'Diagoras Rodos',
    'Egaleo Athens',
    'Ethnikos Piraeus',
    'Kalamata FC',
    'Levadiakos FC',
    'OFI Crete',
    'Panachaiki FC',
    'Panserraikos FC',
    'Veria FC'
];

interface UpDownAnalysisProps {
    league: string;
    season: string;
    matchData: any[];
    onClose: () => void;
}

interface AnalysisResult {
    team: string;
    season: string;
    beforeMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
    };
    surpriseMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
    };
    afterMatch: {
        date: string;
        homeTeam: string;
        awayTeam: string;
        score: string;
    };
}

export function UpDownAnalysis({
    league,
    season,
    matchData,
    onClose
}: UpDownAnalysisProps) {
    const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
    const [step, setStep] = useState<'team-select' | 'results'>('team-select');
    const [results, setResults] = useState<AnalysisResult[]>([]);

    // X, Y, Z değişkenlerini component scope'unda tanımla
    const X = teamNameMap.get(selectedTeamIds[0]);
    const Y = teamNameMap.get(selectedTeamIds[1]);
    const Z = teamNameMap.get(selectedTeamIds[2]);

    // Ligteki tüm takımları al ve ID'lerini oluştur
    const teams = React.useMemo(() => {
        if (!matchData || !league) return [];

        const teamSet = new Set<string>();
        matchData
            .filter(m => m.Div === league)
            .forEach(match => {
                if (match.HomeTeam) teamSet.add(match.HomeTeam);
                if (match.AwayTeam) teamSet.add(match.AwayTeam);
            });

        // ID'leri oluştur ve map'e ekle
        Array.from(teamSet).forEach(team => {
            if (team) {
                const teamId = createTeamId(team);
                teamNameMap.set(teamId, team);
            }
        });

        return Array.from(teamSet)
            .filter(Boolean)
            .map(team => ({
                id: createTeamId(team),
                name: team
            }));
    }, [matchData, league]);

    // Analizi başlat
    const startAnalysis = () => {
        if (selectedTeamIds.length !== 3) return;
        const results: AnalysisResult[] = [];

        // Tüm takımlar için kontrol
        teams.forEach(K => {
            if ([X, Y, Z].includes(K.name)) return; // X, Y, Z takımlarını atla

            // K'nın X ile olan sürpriz maçlarını bul
            const surpriseMatches = matchData
                .filter(m => 
                    ((m.HomeTeam === K.name && m.AwayTeam === X) || 
                     (m.HomeTeam === X && m.AwayTeam === K.name)) &&
                    ((m.HTR === 'H' && m.FTR === 'A') || (m.HTR === 'A' && m.FTR === 'H'))
                )
                .sort((a, b) => Number(a.Date) - Number(b.Date));

            surpriseMatches.forEach(surpriseMatch => {
                // K'nın tüm maçlarını tarih sırasına göre al
                const kMatches = matchData
                    .filter(m => m.HomeTeam === K.name || m.AwayTeam === K.name)
                    .sort((a, b) => Number(a.Date) - Number(b.Date));

                // Sürpriz maçın indeksini bul
                const surpriseIndex = kMatches.findIndex(m => 
                    m.Date === surpriseMatch.Date
                );

                if (surpriseIndex > 0 && surpriseIndex < kMatches.length - 1) {
                    const beforeMatch = kMatches[surpriseIndex - 1];
                    const afterMatch = kMatches[surpriseIndex + 1];

                    // Önceki maçta Y veya Z var mı kontrol et
                    const beforeOpponent = beforeMatch.HomeTeam === K.name ? 
                        beforeMatch.AwayTeam : beforeMatch.HomeTeam;
                    
                    // Sonraki maçta diğer takım var mı kontrol et
                    const afterOpponent = afterMatch.HomeTeam === K.name ? 
                        afterMatch.AwayTeam : afterMatch.HomeTeam;

                    if (
                        (beforeOpponent === Y && afterOpponent === Z) ||
                        (beforeOpponent === Z && afterOpponent === Y)
                    ) {
                        const matchDate = new Date((Number(surpriseMatch.Date) - 25569) * 86400 * 1000);
                        results.push({
                            team: K.name,
                            season: calculateSeason(matchDate),
                            beforeMatch: {
                                date: formatDate(Number(beforeMatch.Date)),
                                homeTeam: beforeMatch.HomeTeam,
                                awayTeam: beforeMatch.AwayTeam,
                                score: `${beforeMatch.FTHG}-${beforeMatch.FTAG}`
                            },
                            surpriseMatch: {
                                date: formatDate(Number(surpriseMatch.Date)),
                                homeTeam: surpriseMatch.HomeTeam,
                                awayTeam: surpriseMatch.AwayTeam,
                                score: `${surpriseMatch.FTHG}-${surpriseMatch.FTAG}`
                            },
                            afterMatch: {
                                date: formatDate(Number(afterMatch.Date)),
                                homeTeam: afterMatch.HomeTeam,
                                awayTeam: afterMatch.AwayTeam,
                                score: `${afterMatch.FTHG}-${afterMatch.FTAG}`
                            }
                        });
                    }
                }
            });
        });

        setResults(results);
        setStep('results');
    };

    // Takım seçimi
    const handleTeamSelect = (teamId: string) => {
        if (!teamId) return;
        if (selectedTeamIds.includes(teamId)) return;
        if (selectedTeamIds.length >= 3) return;
        
        setSelectedTeamIds(prev => [...prev, teamId]);
    };

    // Takım seçimini kaldır
    const removeTeam = (index: number) => {
        setSelectedTeamIds(prev => prev.filter((_, i) => i !== index));
    };

    // Takım ismini güvenli bir şekilde render et
    const renderTeamName = (teamName: string | undefined) => {
        if (!teamName) return null;
        
        if (specialTeams.includes(teamName)) {
            return (
                <div className="text-sm text-gray-300 text-center">
                    {teamName}
                </div>
            );
        }
        return teamName;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={step === 'team-select' ? onClose : () => setStep('team-select')}
                    className="p-2 hover:bg-gray-800/70 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <h2 className="text-xl font-semibold text-white">
                    Alt Üst Analizi
                </h2>
            </div>

            {step === 'team-select' ? (
                <div>
                    {/* Seçili takımlar */}
                    <div className="flex items-center gap-4 mb-6">
                        {selectedTeamIds.map((teamId, index) => (
                            <div key={teamId} className="relative group">
                                <div className="flex items-center gap-2 p-2 pr-4 bg-gray-800 rounded-lg">
                                    <div className="w-8 h-8">
                                        <TeamLogo name={teamNameMap.get(teamId)!} className="w-full h-full" />
                                    </div>
                                    <div className="text-white">
                                        {teamNameMap.get(teamId)}
                                    </div>
                                    <button
                                        onClick={() => removeTeam(index)}
                                        className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Takım seçim grid'i */}
                    <div className="grid grid-cols-6 gap-4">
                        {teams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => handleTeamSelect(team.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl 
                                    ${selectedTeamIds.includes(team.id) 
                                        ? 'bg-gray-800/30 opacity-50 cursor-not-allowed' 
                                        : 'bg-gray-800/50 hover:bg-gray-800/70'}`}
                                disabled={selectedTeamIds.includes(team.id) || selectedTeamIds.length >= 3}
                            >
                                <div className="w-16 h-16">
                                    <TeamLogo name={team.name} className="w-full h-full" />
                                </div>
                                <div className="text-sm text-gray-300 text-center">
                                    {team.name}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Analiz başlatma butonu */}
                    {selectedTeamIds.length === 3 && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={startAnalysis}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                Analizi Başlat
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {results.length > 0 ? (
                        <div className="space-y-6">
                            {results.map((result, index) => (
                                <div key={index} className="bg-gray-800/50 rounded-xl p-6">
                                    {/* Ana takım ve sürpriz maç bilgisi */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <TeamLogo name={result.team} className="w-12 h-12" />
                                        <div>
                                            <div className="text-lg font-medium text-white">{result.team}</div>
                                            <div className="text-sm text-gray-400">Sürpriz Maç Detayları</div>
                                        </div>
                                    </div>

                                    {/* Maç detayları */}
                                    <div className="space-y-4">
                                        {/* Önceki maç */}
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400">Sürpriz Öncesi</span>
                                                <TeamLogo 
                                                    name={result.beforeMatch.homeTeam} 
                                                    className={`w-8 h-8 ${[X, Y, Z].includes(result.beforeMatch.homeTeam) ? 'ring-2 ring-blue-500' : ''}`} 
                                                />
                                                <span className="text-white">{result.beforeMatch.score}</span>
                                                <TeamLogo 
                                                    name={result.beforeMatch.awayTeam} 
                                                    className={`w-8 h-8 ${[X, Y, Z].includes(result.beforeMatch.awayTeam) ? 'ring-2 ring-blue-500' : ''}`} 
                                                />
                                            </div>
                                            <span className="text-gray-400">{result.beforeMatch.date}</span>
                                        </div>

                                        {/* Sürpriz maç */}
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/20 border border-red-900/30">
                                            <div className="flex items-center gap-3">
                                                <span className="text-red-400">Sürpriz Maç</span>
                                                <TeamLogo 
                                                    name={result.surpriseMatch.homeTeam} 
                                                    className={`w-8 h-8 ${[X, Y, Z].includes(result.surpriseMatch.homeTeam) ? 'ring-2 ring-red-500' : ''}`} 
                                                />
                                                <span className="text-white">{result.surpriseMatch.score}</span>
                                                <TeamLogo 
                                                    name={result.surpriseMatch.awayTeam} 
                                                    className={`w-8 h-8 ${[X, Y, Z].includes(result.surpriseMatch.awayTeam) ? 'ring-2 ring-red-500' : ''}`} 
                                                />
                                            </div>
                                            <span className="text-red-400">{result.surpriseMatch.date}</span>
                                        </div>

                                        {/* Sonraki maç */}
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-400">Sürpriz Sonrası</span>
                                                <TeamLogo 
                                                    name={result.afterMatch.homeTeam} 
                                                    className={`w-8 h-8 ${[X, Y, Z].includes(result.afterMatch.homeTeam) ? 'ring-2 ring-blue-500' : ''}`} 
                                                />
                                                <span className="text-white">{result.afterMatch.score}</span>
                                                <TeamLogo 
                                                    name={result.afterMatch.awayTeam} 
                                                    className={`w-8 h-8 ${[X, Y, Z].includes(result.afterMatch.awayTeam) ? 'ring-2 ring-blue-500' : ''}`} 
                                                />
                                            </div>
                                            <span className="text-gray-400">{result.afterMatch.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">
                                Seçilen takımlar için Alt Üst Pattern sonucu bulunamadı.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 