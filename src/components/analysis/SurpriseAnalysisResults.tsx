import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, Tab } from '@headlessui/react';
import { TeamLogo } from '../TeamLogo';
import { X, ChevronDown, Filter, SortAsc, Info } from 'lucide-react';

interface SurpriseAnalysisStep {
    stepNumber: number;
    description: string;
    point: number;
    details?: {
        opponent?: string;
        date?: string;
        score?: string;
        additionalInfo?: string;
    };
}

interface SurpriseTeamAnalysis {
    team: string;
    totalPoints: number;
    steps: SurpriseAnalysisStep[];
}

interface SurpriseAnalysisResult {
    date: string;
    homeTeam: string;
    awayTeam: string;
    htScore: string;
    ftScore: string;
    weekNumber: number;
    homeAnalysis: SurpriseTeamAnalysis;
    awayAnalysis: SurpriseTeamAnalysis;
    totalPoints: number;
}

interface SurpriseAnalysisResultsProps {
    results: SurpriseAnalysisResult[];
    league: string;
    season: string;
    onBack: () => void;
    allTeams: string[];
    analyzeSurpriseSteps: (team: string, match: any) => any[];
    matchData: any[];
}

// Puan rengi belirleme fonksiyonu
const getScoreColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 4) return 'bg-orange-500';
    return 'bg-red-500';
};

// Puan yüzdesi hesaplama
const calculatePercentage = (score: number) => (score / 9) * 100;

// Yeni tip tanımlamaları
type SortType = 'date' | 'points';
type FilterType = 'all' | 'high' | 'medium' | 'low';
type TabType = 'analysis' | 'statistics' | 'history';

// CSS keyframes ekleyelim (global style'a eklenebilir)
const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// Tarih formatlama fonksiyonu
const formatDate = (excelDate: number): string => {
    // Excel tarihi (1900'den itibaren geçen gün sayısı) JavaScript tarihine çevrilir
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    
    // Gün, ay ve yıl değerlerini al
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // DD.MM.YYYY formatında döndür
    return `${day}.${month}.${year}`;
};

// Maç kartı için yeni komponent
const MatchCard = ({ result, onClick }: { result: SurpriseAnalysisResult; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                 rounded-xl border border-gray-700/30 hover:border-green-500/50 
                 transition-all overflow-hidden hover:bg-green-900/20
                 hover:shadow-xl hover:shadow-green-900/20 duration-300 ease-out"
    >
        <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* Ev Sahibi */}
                    <div className="flex flex-col items-center space-y-2">
                        <div className="relative">
                            <TeamLogo name={result.homeTeam} className="w-12 h-12" />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                                        ${getScoreColor(result.homeAnalysis.totalPoints)}
                                        flex items-center justify-center text-white text-xs font-bold`}>
                                {result.homeAnalysis.totalPoints}
                            </div>
                        </div>
                        <span className="text-sm text-gray-300">{result.homeTeam}</span>
                    </div>

                    {/* Skor */}
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{result.htScore}</span>
                            <div className="relative w-12 h-6 group-hover:scale-110 transition-transform">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="h-[2px] w-full bg-gradient-to-r from-gray-500 to-gray-400" />
                                </div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2
                                            group-hover:translate-x-1 transition-transform">
                                    <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none">
                                        <path d="M13 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-white">{result.ftScore}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Sürpriz Dönüş</div>
                    </div>

                    {/* Deplasman */}
                    <div className="flex flex-col items-center space-y-2">
                        <div className="relative">
                            <TeamLogo name={result.awayTeam} className="w-12 h-12" />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                                        ${getScoreColor(result.awayAnalysis.totalPoints)}
                                        flex items-center justify-center text-white text-xs font-bold`}>
                                {result.awayAnalysis.totalPoints}
                            </div>
                        </div>
                        <span className="text-sm text-gray-300">{result.awayTeam}</span>
                    </div>
                </div>

                {/* Sağ Taraf - Tarih ve Puan */}
                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-400">{result.date}</div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium
                                    ${getScoreColor(result.totalPoints)} bg-opacity-20
                                    text-${getScoreColor(result.totalPoints).split('-')[1]}-400`}>
                            Hafta {result.weekNumber}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full transition-all ${getScoreColor(result.totalPoints)}`}
                                 style={{ width: `${calculatePercentage(result.totalPoints)}%` }} />
                        </div>
                        <span className="text-sm font-medium text-white">
                            {result.totalPoints}/18
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Hover durumunda görünen inceleme butonu */}
        <div className="absolute inset-0 bg-green-900/30 opacity-0 group-hover:opacity-100 
                     backdrop-blur-sm transition-all duration-300 flex items-center justify-center">
            <span className="px-6 py-2.5 bg-green-500/20 rounded-lg text-green-400 
                         border border-green-500/30 font-medium
                         transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                İncele
            </span>
        </div>
    </button>
);

// Sık puan veren basamakları hesaplama fonksiyonu
const calculateFrequentSteps = (results: SurpriseAnalysisResult[]) => {
    const stepCounts = new Map<number, { total: number; success: number }>();

    // Her sonuç için basamakları kontrol et
    results.forEach(result => {
        // Ev sahibi ve deplasman analizlerini birleştir
        const allSteps = [...result.homeAnalysis.steps, ...result.awayAnalysis.steps];
        
        // Her basamak için sayaç güncelle
        allSteps.forEach(step => {
            if (!stepCounts.has(step.stepNumber)) {
                stepCounts.set(step.stepNumber, { total: 0, success: 0 });
            }
            const count = stepCounts.get(step.stepNumber)!;
            count.total++;
            if (step.point > 0) count.success++;
        });
    });

    // Başarı oranı %98'in üzerinde olan basamakları döndür
    const frequentSteps = new Set<number>();
    stepCounts.forEach((count, stepNumber) => {
        const successRate = (count.success / count.total) * 100;
        // Minimum 10 örnek olması şartıyla %98 üzeri başarı oranı
        if (count.total >= 10 && successRate >= 98) {
            frequentSteps.add(stepNumber);
        }
    });

    return frequentSteps;
};

// ScoreCard komponentini dışarı çıkaralım ve props'a frequentSteps ekleyelim
interface ScoreCardProps {
    step: SurpriseAnalysisStep;
    team: string;
    frequentSteps: Set<number>;
}

const ScoreCard = ({ step, team, frequentSteps }: ScoreCardProps) => {
    const [selectedSimilarity, setSelectedSimilarity] = useState<any>(null);

    // Tıklama işleyicisi
    const handleClick = () => {
        if (step.stepNumber === 10) {
            setSelectedSimilarity(step.details);
        }
    };

    return (
        <>
            <div 
                onClick={handleClick}
                className={`relative group bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                  rounded-xl border border-gray-700/30 hover:border-gray-600 
                          transition-all overflow-hidden hover:shadow-lg
                          ${step.stepNumber === 10 ? 'cursor-pointer' : ''}`}
            >
                {/* Mevcut kart içeriği */}
        <div className={`absolute top-0 left-0 w-1 h-full ${getScoreColor(step.point)}`} />
        
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                     opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="p-4 relative">
            {/* Başlık kısmı */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${getScoreColor(step.point)} 
                                flex items-center justify-center text-white text-sm font-bold
                                shadow-lg group-hover:scale-110 transition-transform`}>
                        {step.stepNumber}
                    </div>
                        <span className="text-sm font-medium text-white block group-hover:text-blue-400 transition-colors">
                            {step.description}
                        </span>
                            {frequentSteps && frequentSteps.has(step.stepNumber) && (
                                <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center
                                            group-hover:scale-110 transition-transform"
                                     title="Bu basamak genellikle puan verir">
                                    <span className="text-yellow-500 text-sm">!</span>
                                </div>
                            )}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium
                             ${getScoreColor(step.point)} bg-opacity-20 
                             text-${getScoreColor(step.point).split('-')[1]}-400
                             group-hover:scale-105 transition-transform`}>
                    {step.point} puan
                </div>
            </div>

            {/* Detay bilgileri */}
            {step.details && (
                <div className="ml-11 p-3 bg-gray-900/30 rounded-lg space-y-2 text-xs
                             group-hover:bg-gray-900/50 transition-colors">
                    {step.details.opponent && (
                                <div>Rakip: {step.details.opponent}</div>
                    )}
                    {step.details.date && (
                                <div>Tarih: {step.details.date}</div>
                    )}
                    {step.details.score && (
                                <div>Skor: {step.details.score}</div>
                            )}
                            {step.details.additionalInfo && (
                                <div>{step.details.additionalInfo}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {step.stepNumber === 10 && (
                <SimilarityModal 
                    isOpen={!!selectedSimilarity}
                    onClose={() => setSelectedSimilarity(null)}
                    data={selectedSimilarity}
                />
            )}
        </>
    );
};

// Puanlama sistemi için yeni bir modal komponenti
const ScoringSystemModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl bg-gray-900 rounded-xl shadow-xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-medium text-white">Sürpriz Analiz Puanlama Sistemi</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
        </div>
                    
                    <div className="space-y-4">
                        {[
                            {
                                step: 1,
                                title: "Son Rakibin Başka Sürprizlere Tetikçiliği",
                                description: "Son rakibin daha önce başka takımların sürpriz yapmasına sebep olup olmadığı kontrol edilir."
                            },
                            {
                                step: 2,
                                title: "Önceki Sezonlarda Aynı Rakiple Sürpriz",
                                description: "Geçmiş sezonlarda aynı rakiple benzer bir sürpriz yapılıp yapılmadığı incelenir."
                            },
                            {
                                step: 3,
                                title: "Skor Paterni Kontrolü",
                                description: "Son maçın skorunun daha önce sürprizlere yol açıp açmadığı kontrol edilir."
                            },
                            {
                                step: 4,
                                title: "Ortak Rakip Kontrolü",
                                description: "Ortak rakiplerle yapılan sürprizler incelenir."
                            },
                            {
                                step: 5,
                                title: "Takvim Uyumu",
                                description: "Benzer tarih aralıklarında sürpriz yapma eğilimi kontrol edilir."
                            },
                            {
                                step: 6,
                                title: "Son İki Maç Paterni",
                                description: "Son iki maçtaki sonuçların benzer paternleri kontrol edilir."
                            },
                            {
                                step: 7,
                                title: "Beraberlik Piyangosu",
                                description: "Maç içi skor değişimlerinin sürpriz potansiyeli incelenir."
                            },
                            {
                                step: 8,
                                title: "Sonraki Maç Paterni",
                                description: "Bir sonraki maçın sürpriz potansiyeli değerlendirilir."
                            },
                            {
                                step: 9,
                                title: "Rakip-Sürpriz Takımı Bağlantısı",
                                description: "Rakip ile sürpriz yapan takım arasındaki geçmiş bağlantılar incelenir."
                            }
                        ].map(({ step, title, description }) => (
                            <div key={step} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                                <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-green-500/20 text-green-400
                                                flex items-center justify-center text-sm font-bold
                                                border border-green-500/30`}>
                                        {step}
    </div>
                                    <div>
                                        <h4 className="text-white font-medium">{title}</h4>
                                        <p className="text-sm text-gray-400 mt-1">{description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                        <p className="text-sm text-gray-300">
                            Her basamak 1 puan değerindedir. Toplam 9 puan üzerinden değerlendirme yapılır. 
                            Yüksek puanlar (7+) yüksek sürpriz potansiyelini gösterir.
                        </p>
                    </div>
                </div>
            </Dialog.Panel>
        </div>
    </Dialog>
);

// Yeni interface'ler
interface TeamOption {
    name: string;
    logo: string;
}

interface PotentialSurpriseFormProps {
    league: string;
    teams: TeamOption[];
    onAnalyze: (teamX: string, teamY: string) => void;
}

// Potansiyel Sürpriz Form komponenti
const PotentialSurpriseForm = ({ league, teams, onAnalyze }: PotentialSurpriseFormProps) => {
    const [selectedTeamX, setSelectedTeamX] = useState<string | null>(null);
    const [selectedTeamY, setSelectedTeamY] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
                {/* X Takımı Seçimi */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">X Takımını Seçin</h3>
                    <div className="grid grid-cols-1 gap-4 h-[calc(100vh-400px)]">
                        <div className="text-sm font-medium text-gray-400">Takım Seçin</div>
                        <div className="grid grid-cols-4 gap-4 
                                      overflow-y-auto h-full
                                      scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"> 
                            {teams.map((team) => (
                                <button
                                    key={`x-${team.name}`}
                                    onClick={() => setSelectedTeamX(team.name)}
                                    className={`p-4 rounded-xl transition-all
                                        ${selectedTeamX === team.name 
                                            ? 'bg-blue-900/30 ring-2 ring-blue-500' 
                                            : 'bg-gray-800/50 hover:bg-gray-800/70'}`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <TeamLogo name={team.name} className="w-12 h-12" />
                                        <span className="text-sm text-gray-300 text-center">
                                            {team.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Y Takımı Seçimi */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">Y Takımını Seçin</h3>
                    <div className="grid grid-cols-1 gap-4 h-[calc(100vh-400px)]">
                        <div className="text-sm font-medium text-gray-400">Takım Seçin</div>
                        <div className="grid grid-cols-4 gap-4 
                                      overflow-y-auto h-full
                                      scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"> 
                            {teams.map((team) => (
                                <button
                                    key={`y-${team.name}`}
                                    onClick={() => setSelectedTeamY(team.name)}
                                    disabled={selectedTeamX === team.name}
                                    className={`p-4 rounded-xl transition-all
                                        ${selectedTeamY === team.name 
                                            ? 'bg-blue-900/30 ring-2 ring-blue-500' 
                                            : selectedTeamX === team.name
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'bg-gray-800/50 hover:bg-gray-800/70'}`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <TeamLogo name={team.name} className="w-12 h-12" />
                                        <span className="text-sm text-gray-300 text-center">
                                            {team.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Analiz Butonu */}
            {selectedTeamX && selectedTeamY && (
                <div className="flex justify-center">
                    <button
                        onClick={() => onAnalyze(selectedTeamX, selectedTeamY)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 
                                 text-white rounded-lg transition-colors"
                    >
                        Sürpriz Potansiyelini Analiz Et
                    </button>
                </div>
            )}
        </div>
    );
};

// Yeni interface ekleyelim
interface SimilarityModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

// Benzerlik tiplerine göre renkler ve başlıklar
const similarityStyles = {
    score: {
        bg: 'bg-green-500/20',
        hover: 'hover:bg-green-500/30',
        text: 'text-green-400',
        icon: '⚽',
        title: 'Aynı Skor'
    },
    opponent: {
        bg: 'bg-blue-500/20',
        hover: 'hover:bg-blue-500/30',
        text: 'text-blue-400',
        icon: '👥',
        title: 'Aynı Rakip'
    },
    drawLottery: {
        bg: 'bg-yellow-500/20',
        hover: 'hover:bg-yellow-500/30',
        text: 'text-yellow-400',
        icon: '🎲',
        title: 'Beraberlik Piyangosu'
    },
    surpriseChain: {
        bg: 'bg-red-500/20',
        hover: 'hover:bg-red-500/30',
        text: 'text-red-400',
        icon: '⚡',
        title: 'Sürpriz Üstüne Sürpriz'
    }
};

// Yeni modal komponenti
const SimilarityModal = ({ isOpen, onClose, data }: SimilarityModalProps) => {
    if (!isOpen || !data || !data.extendedData) return null;

    const similarities = data.extendedData;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header kısmı */}
                <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm p-6 border-b border-gray-800 
                               flex justify-between items-center shadow-lg">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        Benzerlik Paterni Detayları
                    </h3>
                    <button onClick={onClose} 
                            className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {similarities.map((similarity: any, index: number) => (
                        <div key={index} className="space-y-6 pb-8 border-b border-gray-800 last:border-0">
                            {/* Geçmiş maç başlığı */}
                            <div className="text-lg font-medium text-white mb-6 flex items-center gap-3">
                                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-700" />
                                <span className="px-4 py-2 bg-gray-800 rounded-full">
                                    Geçmiş Sürpriz Maç: {similarity.date}
                                </span>
                                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-gray-700" />
                            </div>

                            {/* Fikstür Tablosu */}
                            <div className="w-full overflow-hidden rounded-xl border border-gray-800 
                                          shadow-xl shadow-black/20 backdrop-blur-sm
                                          bg-gradient-to-b from-gray-900 to-gray-800/50">
                                {/* Tablo Başlığı */}
                                <div className="grid grid-cols-3 bg-gradient-to-r from-gray-800 via-gray-800/70 to-gray-800
                                              border-b-2 border-gray-700">
                                    <div className="p-4 flex items-center justify-center">
                                        <h4 className="text-blue-400 font-medium flex items-center gap-2 
                                                     hover:text-blue-300 transition-colors">
                                            <TeamLogo name={similarity.team1Analysis.team} 
                                                     className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            {similarity.team1Analysis.team}
                                        </h4>
                                    </div>
                                    <div className="p-4 text-center font-medium bg-gray-800/30
                                                  text-gray-400">
                                        Maç Sırası
                                    </div>
                                    <div className="p-4 flex items-center justify-center">
                                        <h4 className="text-blue-400 font-medium flex items-center gap-2
                                                     hover:text-blue-300 transition-colors">
                                            <TeamLogo name={similarity.team2Analysis.team} 
                                                     className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            {similarity.team2Analysis.team}
                                        </h4>
                                    </div>
                                </div>

                                {/* Maç Sıralaması (1'den 5'e) */}
                                {[1, 2, 3, 4, 5].map(matchNumber => (
                                    <div key={matchNumber} 
                                         className={`grid grid-cols-3 border-b border-gray-800/50 
                                                    hover:bg-gray-800/30 transition-all duration-200
                                                    ${matchNumber === 1 ? 'bg-gray-800/20' : ''}`}>
                                        {/* Sol Takım */}
                                        <div className="p-4 border-r border-gray-800/50">
                                            {similarity.team1Analysis.similarities
                                                .filter(m => m.matchNumber === matchNumber)
                                                .map((matchSim: any, idx: number) => (
                                                    <div key={idx} className="space-y-3 relative">
                                                        {/* Maç Karşılaştırma Kartları */}
                                                        <div className="grid grid-cols-2 gap-3 text-sm relative">
                                                            {/* Güncel Maç Kartı */}
                                                            <div className="group">
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-green-500/20 
                                                                              rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200" />
                                                                <div className="relative bg-gray-800/80 p-3 rounded-lg 
                                                                              hover:shadow-lg transition-all duration-200
                                                                              border border-gray-700/50 hover:border-gray-600">
                                                                    <div className="font-medium text-white">
                                                                        {matchSim.currentMatch.opponent}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-gray-300 mt-1">
                                                                        {matchSim.currentMatch.score}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {matchSim.currentMatch.date}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Geçmiş Maç Kartı */}
                                                            <div className="group">
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                                                                              rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200" />
                                                                <div className="relative bg-gray-800/80 p-3 rounded-lg
                                                                              hover:shadow-lg transition-all duration-200
                                                                              border border-gray-700/50 hover:border-gray-600">
                                                                    <div className="font-medium text-white">
                                                                        {matchSim.historicalMatch.opponent}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-gray-300 mt-1">
                                                                        {matchSim.historicalMatch.score}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {matchSim.historicalMatch.date}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Benzerlik Etiketleri */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {matchSim.similarities.map((sim: any, i: number) => {
                                                                const style = similarityStyles[sim.type as keyof typeof similarityStyles];
                                                                return (
                                                                    <span key={i} 
                                                                          className={`px-3 py-1.5 rounded-full text-xs font-medium
                                                                                     flex items-center gap-2 group relative
                                                                                     ${style.bg} ${style.text} ${style.hover}
                                                                                     hover:scale-105 transition-all duration-200`}
                                                                          title={sim.details}>
                                                                        {style.icon}
                                                                        <span className="font-semibold">{style.title}</span>
                                                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                                                                                       bg-gray-900 text-white px-2 py-1 rounded text-xs
                                                                                       opacity-0 group-hover:opacity-100 transition-opacity
                                                                                       whitespace-nowrap pointer-events-none">
                                                                            {sim.details}
                                                                        </div>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>

                                        {/* Orta - Maç Sırası */}
                                        <div className="p-4 bg-gray-800/10 flex items-center justify-center">
                                            <div className="text-gray-400 font-medium px-4 py-2 rounded-full
                                                          bg-gray-800/40 hover:bg-gray-800/60 transition-colors">
                                                {matchNumber}. Maç
                                            </div>
                                        </div>

                                        {/* Sağ Takım */}
                                        <div className="p-4 border-l border-gray-800/50">
                                            {similarity.team2Analysis.similarities
                                                .filter(m => m.matchNumber === matchNumber)
                                                .map((matchSim: any, idx: number) => (
                                                    <div key={idx} className="space-y-3 relative">
                                                        {/* Maç Karşılaştırma Kartları */}
                                                        <div className="grid grid-cols-2 gap-3 text-sm relative">
                                                            {/* Güncel Maç Kartı */}
                                                            <div className="group">
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-green-500/20 
                                                                              rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200" />
                                                                <div className="relative bg-gray-800/80 p-3 rounded-lg 
                                                                              hover:shadow-lg transition-all duration-200
                                                                              border border-gray-700/50 hover:border-gray-600">
                                                                    <div className="font-medium text-white">
                                                                        {matchSim.currentMatch.opponent}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-gray-300 mt-1">
                                                                        {matchSim.currentMatch.score}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {matchSim.currentMatch.date}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Geçmiş Maç Kartı */}
                                                            <div className="group">
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                                                                              rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-200" />
                                                                <div className="relative bg-gray-800/80 p-3 rounded-lg
                                                                              hover:shadow-lg transition-all duration-200
                                                                              border border-gray-700/50 hover:border-gray-600">
                                                                    <div className="font-medium text-white">
                                                                        {matchSim.historicalMatch.opponent}
                                                                    </div>
                                                                    <div className="text-lg font-bold text-gray-300 mt-1">
                                                                        {matchSim.historicalMatch.score}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {matchSim.historicalMatch.date}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Benzerlik Etiketleri */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {matchSim.similarities.map((sim: any, i: number) => {
                                                                const style = similarityStyles[sim.type as keyof typeof similarityStyles];
                                                                return (
                                                                    <span key={i} 
                                                                          className={`px-3 py-1.5 rounded-full text-xs font-medium
                                                                                     flex items-center gap-2 group relative
                                                                                     ${style.bg} ${style.text} ${style.hover}
                                                                                     hover:scale-105 transition-all duration-200`}
                                                                          title={sim.details}>
                                                                        {style.icon}
                                                                        <span className="font-semibold">{style.title}</span>
                                                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                                                                                       bg-gray-900 text-white px-2 py-1 rounded text-xs
                                                                                       opacity-0 group-hover:opacity-100 transition-opacity
                                                                                       whitespace-nowrap pointer-events-none">
                                                                            {sim.details}
                                                                        </div>
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Sürpriz Maç (En Alt) */}
                                <div className="relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-red-500/20 to-yellow-500/20
                                                  animate-pulse" />
                                    <div className="relative grid grid-cols-3 border-t-2 border-yellow-500/30">
                                        <div className="p-4 text-center col-span-3 text-yellow-400 font-medium
                                                      flex items-center justify-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                                            Sürpriz Maç
                                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const SurpriseAnalysisResults: React.FC<SurpriseAnalysisResultsProps> = ({ 
    results, 
    league, 
    season, 
    onBack,
    allTeams,
    analyzeSurpriseSteps,
    matchData
}) => {
    const [selectedMatch, setSelectedMatch] = useState<SurpriseAnalysisResult | null>(null);
    const [sortBy, setSortBy] = useState<SortType>('date');
    const [filterByScore, setFilterByScore] = useState<FilterType>('all');
    const [activeTab, setActiveTab] = useState('results');
    const [animatedStats, setAnimatedStats] = useState({
        totalSurprises: 0,
        averageScore: 0,
        highestScore: 0
    });
    const [showScoringSystem, setShowScoringSystem] = useState(false);
    const [showPotentialAnalysis, setShowPotentialAnalysis] = useState(false);
    const [potentialAnalysisResult, setPotentialAnalysisResult] = useState<any>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const [selectedSimilarity, setSelectedSimilarity] = useState<any>(null);

    // Animasyonlu sayaç efekti
    useEffect(() => {
        const duration = 1000;
        const steps = 20;
        const interval = duration / steps;
        
        const targetStats = {
            totalSurprises: results.length,
            averageScore: Number((results.reduce((acc, curr) => acc + curr.totalPoints, 0) / results.length).toFixed(1)),
            highestScore: Math.max(...results.map(r => r.totalPoints))
        };

        let currentStep = 0;
        
        const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            setAnimatedStats({
                totalSurprises: Math.round(targetStats.totalSurprises * progress),
                averageScore: Number((targetStats.averageScore * progress).toFixed(1)),
                highestScore: Math.round(targetStats.highestScore * progress)
            });

            if (currentStep === steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, [results]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.team-dropdown')) {
                setIsTeamDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtreleme ve sıralama
    const filteredAndSortedResults = useMemo(() => {
        let filtered = [...results];
        
        // Takım filtresi
        if (selectedTeam) {
            filtered = filtered.filter(result => 
                result.homeTeam === selectedTeam || result.awayTeam === selectedTeam
            );
        }

        // Puan filtresi
        if (filterByScore !== 'all') {
            filtered = filtered.filter(result => {
                const totalPoints = result.totalPoints;
                if (filterByScore === 'high') return totalPoints >= 14;
                if (filterByScore === 'medium') return totalPoints >= 10 && totalPoints < 14;
                return totalPoints < 10;
            });
        }

        // Sıralama
        return filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return b.totalPoints - a.totalPoints;
        });
    }, [results, sortBy, filterByScore, selectedTeam]);

    // Etiket oluşturma
    const getMatchTags = (result: SurpriseAnalysisResult) => {
        const tags = [];
        
        if (result.totalPoints >= 7) {
            tags.push({ label: 'Yüksek Potansiyel', color: 'bg-green-500' });
        }
        
        if (result.homeAnalysis.totalPoints === result.awayAnalysis.totalPoints) {
            tags.push({ label: 'Dengeli Analiz', color: 'bg-blue-500' });
        }
        
        if (Math.abs(result.homeAnalysis.totalPoints - result.awayAnalysis.totalPoints) >= 3) {
            tags.push({ label: 'Büyük Fark', color: 'bg-purple-500' });
        }
        
        return tags;
    };

    // Puan dağılımı grafiği
    const getPointsDistribution = () => {
        const distribution = [0, 0, 0]; // düşük, orta, yüksek
        results.forEach(result => {
            if (result.totalPoints >= 7) distribution[2]++;
            else if (result.totalPoints >= 4) distribution[1]++;
            else distribution[0]++;
        });
        return distribution;
    };

    // Takımları al
    const teams = useMemo(() => {
        return allTeams.map(team => ({
            name: team,
            logo: '' // Logo URL'sini buraya ekleyin
        }));
    }, [allTeams]);

    // Potansiyel analiz fonksiyonu
    const analyzePotential = (teamX: string, teamY: string) => {
        console.log('Potansiyel Analiz Başlatılıyor:', { teamX, teamY });

        // matchData'nın array olduğundan emin olalım
        if (!Array.isArray(matchData)) {
            console.error('matchData bir array değil');
            return;
        }

        // Son maçları bul
        const teamXLastMatch = findLastMatchInData(teamX);
        const teamYLastMatch = findLastMatchInData(teamY);

        if (!teamXLastMatch || !teamYLastMatch) {
            console.error('Son maçlar bulunamadı');
            return;
        }

        console.log('Son Maçlar:', {
            teamX: {
                opponent: teamXLastMatch.HomeTeam === teamX ? teamXLastMatch.AwayTeam : teamXLastMatch.HomeTeam,
                date: formatDate(Number(teamXLastMatch.Date)),
                score: `${teamXLastMatch.FTHG}-${teamXLastMatch.FTAG}`
            },
            teamY: {
                opponent: teamYLastMatch.HomeTeam === teamY ? teamYLastMatch.AwayTeam : teamYLastMatch.HomeTeam,
                date: formatDate(Number(teamYLastMatch.Date)),
                score: `${teamYLastMatch.FTHG}-${teamYLastMatch.FTAG}`
            }
        });

        // Excel formatında güncel tarih oluştur (1900'den itibaren geçen gün sayısı)
        const today = Math.floor((new Date().getTime() / (86400 * 1000)) + 25569);

        // Sahte bir sürpriz maç oluştur
        const potentialSurpriseMatch = {
            Date: today.toString(), // Excel formatında tarih
            HomeTeam: teamX,
            AwayTeam: teamY,
            HTHG: "0",
            HTAG: "0",
            FTHG: "0",
            FTAG: "0",
            HTR: "H",
            FTR: "A",
            date: new Date().toISOString(),
            homeTeam: teamX,
            awayTeam: teamY,
            htScore: "0-0",
            ftScore: "0-0",
            weekNumber: 0,
            homeAnalysis: {
                team: teamX,
                totalPoints: 0,
                steps: []
            },
            awayAnalysis: {
                team: teamY,
                totalPoints: 0,
                steps: []
            },
            totalPoints: 0
        };

        // Analiz fonksiyonunu kullan
        console.log('X Takımı Analizi Başlıyor:', teamX);
        const homeSteps = analyzeSurpriseSteps(
            teamX, 
            potentialSurpriseMatch,
            matchData,
            league
        );
        console.log('X Takımı Analiz Sonuçları:', {
            steps: homeSteps,
            totalPoints: homeSteps.reduce((acc, step) => acc + step.point, 0)
        });

        console.log('Y Takımı Analizi Başlıyor:', teamY);
        const awaySteps = analyzeSurpriseSteps(
            teamY, 
            potentialSurpriseMatch,
            matchData,
            league
        );
        console.log('Y Takımı Analiz Sonuçları:', {
            steps: awaySteps,
            totalPoints: awaySteps.reduce((acc, step) => acc + step.point, 0)
        });

        // Sonuçları güncelle
        potentialSurpriseMatch.homeAnalysis.steps = homeSteps;
        potentialSurpriseMatch.homeAnalysis.totalPoints = homeSteps.reduce((acc, step) => acc + step.point, 0);
        
        potentialSurpriseMatch.awayAnalysis.steps = awaySteps;
        potentialSurpriseMatch.awayAnalysis.totalPoints = awaySteps.reduce((acc, step) => acc + step.point, 0);
        
        potentialSurpriseMatch.totalPoints = potentialSurpriseMatch.homeAnalysis.totalPoints + 
                                           potentialSurpriseMatch.awayAnalysis.totalPoints;

        console.log('Final Analiz Sonucu:', {
            totalPoints: potentialSurpriseMatch.totalPoints,
            homeTeam: {
                team: teamX,
                points: potentialSurpriseMatch.homeAnalysis.totalPoints,
                steps: potentialSurpriseMatch.homeAnalysis.steps.length
            },
            awayTeam: {
                team: teamY,
                points: potentialSurpriseMatch.awayAnalysis.totalPoints,
                steps: potentialSurpriseMatch.awayAnalysis.steps.length
            }
        });

        setPotentialAnalysisResult(potentialSurpriseMatch);
        setShowPotentialAnalysis(true);
    };

    // Son maç bulma yardımcı fonksiyonu - güncellendi
    const findLastMatchInData = (team: string) => {
        return matchData
            .filter(m => 
                m.Div === league && 
                (m.HomeTeam === team || m.AwayTeam === team)
            )
            .sort((a, b) => Number(b.Date) - Number(a.Date))[0];
    };

    // Sık puan veren basamakları hesapla
    const frequentSteps = useMemo(() => calculateFrequentSteps(results), [results]);

    // ScoreCard komponenti için handler
    const handleSimilarityClick = (details: any) => {
        setSelectedSimilarity(details);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-800/70 rounded-lg">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="text-lg font-medium text-gray-300">
                        Sürpriz Analiz Sonuçları
                    </h3>
                </div>

                {/* Filtreleme ve Sıralama */}
                <div className="flex items-center gap-4">
                    {/* Takım Filtresi */}
                    <div className="relative team-dropdown">
                        <button
                            onClick={() => {
                                if (selectedTeam) {
                                    setSelectedTeam(null);
                                } else {
                                    setIsTeamDropdownOpen(!isTeamDropdownOpen);
                                }
                            }}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm
                                    ${selectedTeam 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                        >
                            {selectedTeam ? (
                                <>
                                    <TeamLogo name={selectedTeam} className="w-5 h-5" />
                                    {selectedTeam}
                                    <X className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <Filter className="w-4 h-4" />
                                    Takım Seç
                                </>
                            )}
                        </button>

                        {/* Takım Listesi Dropdown */}
                        {!selectedTeam && isTeamDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl 
                                        border border-gray-700 max-h-96 overflow-y-auto z-50">
                                {allTeams.map(team => (
                                    <button
                                        key={team}
                                        onClick={() => {
                                            setSelectedTeam(team);
                                            setIsTeamDropdownOpen(false);
                                        }}
                                        className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-700 text-left"
                                    >
                                        <TeamLogo name={team} className="w-5 h-5" />
                                        <span className="text-gray-300">{team}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Puanlama Sistemi Butonu */}
                    <button
                        onClick={() => setShowScoringSystem(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 
                                 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                        <Info className="w-4 h-4" />
                        Puan Sistemi
                    </button>

                    <div className="relative">
                        <select
                            value={filterByScore}
                            onChange={(e) => setFilterByScore(e.target.value as FilterType)}
                            className="appearance-none bg-gray-800 text-gray-300 px-4 py-2 pr-8 rounded-lg border border-gray-700"
                        >
                            <option value="all">Tüm Puanlar</option>
                            <option value="high">Yüksek Puan (7+)</option>
                            <option value="medium">Orta Puan (4-6)</option>
                            <option value="low">Düşük Puan (0-3)</option>
                        </select>
                        <Filter className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
                    </div>

                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortType)}
                            className="appearance-none bg-gray-800 text-gray-300 px-4 py-2 pr-8 rounded-lg border border-gray-700"
                        >
                            <option value="date">Tarihe Göre</option>
                            <option value="points">Puana Göre</option>
                        </select>
                        <SortAsc className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* İstatistik Özeti */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-sm text-gray-400 mb-1">Toplam Sürpriz</div>
                    <div className="text-2xl font-bold text-white">{animatedStats.totalSurprises}</div>
                    <div className="mt-2 flex items-end gap-1 h-8">
                        {getPointsDistribution().map((count, idx) => (
                            <div
                                key={idx}
                                className={`w-2 transition-all duration-500 ${
                                    idx === 0 ? 'bg-red-500' :
                                    idx === 1 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ height: `${(count / results.length) * 100}%` }}
                            />
                        ))}
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-sm text-gray-400 mb-1">Ortalama Puan</div>
                    <div className="text-2xl font-bold text-white">
                        {animatedStats.averageScore.toFixed(1)}
                    </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
                    <div className="text-sm text-gray-400 mb-1">En Yüksek Puan</div>
                    <div className="text-2xl font-bold text-white">
                        {animatedStats.highestScore}
                    </div>
                </div>
            </div>

            <Tab.Group>
                <Tab.List className="flex space-x-4 border-b border-gray-700">
                    <Tab 
                        className={({ selected }) => 
                            `px-4 py-2 ${selected ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`
                        }
                    >
                        Sürpriz Sonuçlar
                    </Tab>
                    <Tab 
                        className={({ selected }) => 
                            `px-4 py-2 ${selected ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`
                        }
                    >
                        Potansiyel Sürpriz
                    </Tab>
                </Tab.List>

                <Tab.Panels>
                    <Tab.Panel>
            {/* Maç Listesi */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {filteredAndSortedResults.map((result, index) => (
                    <MatchCard 
                        key={index}
                        result={result}
                        onClick={() => setSelectedMatch(result)}
                    />
                ))}
            </div>
                    </Tab.Panel>

                    <Tab.Panel>
                        <PotentialSurpriseForm 
                            league={league}
                            teams={teams}
                            onAnalyze={analyzePotential}
                        />
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* Detay Modal */}
            <Dialog 
                open={!!selectedMatch} 
                onClose={() => setSelectedMatch(null)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-xl 
                                   max-h-[90vh] flex flex-col">
                        {selectedMatch && (
                            <>
                                {/* Banner Bölümü */}
                                <div className="relative p-8 border-b border-gray-800 
                                            bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
                                            overflow-hidden flex-shrink-0">
                                    {/* Pattern arka plan */}
                                    <div className="absolute inset-0 opacity-10">
                                        <div className="absolute inset-0" 
                                             style={{
                                                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.344 0L13.858 8.485 15.272 9.9l7.9-7.9h-.828zm13.312 0L44.17 8.485 42.756 9.9l-7.9-7.9h.8zM32 0l8.485 8.485-1.414 1.414L30 .828 20.93 9.9l-1.414-1.414L28 0h4zM0 0l8.485 8.485-1.414 1.414L0 2.828V0zm0 5.373l6.485 6.485-1.414 1.415L0 8.2V5.374zm0 5.656l4.485 4.485-1.414 1.414L0 13.858v-2.829zm0 5.657l2.485 2.485-1.414 1.414L0 19.514v-2.828zM54.627 60L60 54.627V60h-5.373zM5.373 60L0 54.627V60h5.373zm8.485 0L0 46.343V49.17L11.03 60h2.828zm5.657 0L0 41.686V44.514L16.686 60h2.829zm5.657 0L0 36.029V38.857L22.344 60h2.829zm5.656 0L0 30.372V33.2L28 60h2.828zm5.657 0L0 24.715V27.543L33.657 60h2.829zm5.657 0L0 19.057V21.886L39.314 60h2.829zm5.656 0L0 13.4V16.23L44.97 60h2.829zm5.657 0L0 7.743V10.57L50.627 60h2.829zm5.657 0L0 2.086V4.914L56.284 60h2.829zM60 60L0-3.543V.286L54.627 60H60zm0-5.373L0 3.085V6.914L60 54.627v-5.373zm0-5.657L0 8.742v2.829L60 48.97v-5.373zm0-5.657L0 14.4v2.828L60 43.314v-5.373zm0-5.657L0 20.057v2.828L60 37.657V32zm0-5.657L0 25.714v2.829L60 32v-5.373zm0-5.657L0 31.371v2.829L60 26.343V20.97zm0-5.657L0 37.029v2.828L60 20.686v-5.373zm0-5.656L0 42.686v2.828L60 15.029V9.656zm0-5.657L0 48.343v2.829L60 9.372V3.999z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                                             }}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => setSelectedMatch(null)}
                                        className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    
                                    <div className="flex items-center justify-between relative z-10">
                                        {/* Ev Sahibi */}
                                        <div className="flex flex-col items-center space-y-2">
                                            <TeamLogo name={selectedMatch.homeTeam} className="w-24 h-24" />
                                            <span className="text-lg font-medium text-white">
                                                {selectedMatch.homeTeam}
                                            </span>
                                            <div className="relative w-20 h-20">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full border-4 border-gray-700" />
                                                    <div 
                                                        className={`absolute top-0 left-0 w-16 h-16 rounded-full border-4 
                                                                  ${getScoreColor(selectedMatch.homeAnalysis.totalPoints)} border-l-transparent border-t-transparent`}
                                                        style={{ 
                                                            transform: `rotate(${calculatePercentage(selectedMatch.homeAnalysis.totalPoints) * 3.6}deg)`,
                                                            transition: 'transform 1s ease-out'
                                                        }}
                                                    />
                                                    <span className="absolute text-xl font-bold text-white">
                                                        {selectedMatch.homeAnalysis.totalPoints}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skor */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-3xl font-bold text-white mb-2">
                                                {selectedMatch.htScore} → {selectedMatch.ftScore}
                                            </div>
                                            <div className="text-sm text-gray-400">{selectedMatch.date}</div>
                                            <div className="mt-4 px-4 py-2 bg-gray-800 rounded-lg">
                                                <span className="text-sm text-gray-300">Toplam Puan: </span>
                                                <span className={`text-lg font-bold ${getScoreColor(selectedMatch.totalPoints).replace('bg-', 'text-')}`}>
                                                    {selectedMatch.totalPoints}/18
                                                </span>
                                            </div>
                                        </div>

                                        {/* Deplasman */}
                                        <div className="flex flex-col items-center space-y-2">
                                            <TeamLogo name={selectedMatch.awayTeam} className="w-24 h-24" />
                                            <span className="text-lg font-medium text-white">
                                                {selectedMatch.awayTeam}
                                            </span>
                                            <div className="relative w-20 h-20">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 rounded-full border-4 border-gray-700" />
                                                    <div 
                                                        className={`absolute top-0 left-0 w-16 h-16 rounded-full border-4 
                                                                  ${getScoreColor(selectedMatch.awayAnalysis.totalPoints)} border-l-transparent border-t-transparent`}
                                                        style={{ 
                                                            transform: `rotate(${calculatePercentage(selectedMatch.awayAnalysis.totalPoints) * 3.6}deg)`,
                                                            transition: 'transform 1s ease-out'
                                                        }}
                                                    />
                                                    <span className="absolute text-xl font-bold text-white">
                                                        {selectedMatch.awayAnalysis.totalPoints}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analiz İçeriği - Scroll olacak */}
                                <div className="flex-1 overflow-y-auto">
                                <div className="p-6 grid grid-cols-2 gap-6">
                                    {/* Ev Sahibi Analizi */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-white flex items-center gap-2 mb-6">
                                            <TeamLogo name={selectedMatch.homeTeam} className="w-6 h-6" />
                                            <span className="text-lg">{selectedMatch.homeTeam} Analizi</span>
                                            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium
                                                        ${getScoreColor(selectedMatch.homeAnalysis.totalPoints)} bg-opacity-20
                                                        text-${getScoreColor(selectedMatch.homeAnalysis.totalPoints).split('-')[1]}-400`}>
                                                {selectedMatch.homeAnalysis.totalPoints}/9 Puan
                                            </span>
                                        </h4>
                                        
                                        {selectedMatch.homeAnalysis.steps.map((step, idx) => (
                                                <ScoreCard 
                                                    key={idx} 
                                                    step={step} 
                                                    team={selectedMatch.homeTeam}
                                                    frequentSteps={frequentSteps}
                                                />
                                        ))}
                                    </div>

                                    {/* Deplasman Analizi */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-white flex items-center gap-2 mb-6">
                                            <TeamLogo name={selectedMatch.awayTeam} className="w-6 h-6" />
                                            <span className="text-lg">{selectedMatch.awayTeam} Analizi</span>
                                            <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium
                                                        ${getScoreColor(selectedMatch.awayAnalysis.totalPoints)} bg-opacity-20
                                                        text-${getScoreColor(selectedMatch.awayAnalysis.totalPoints).split('-')[1]}-400`}>
                                                {selectedMatch.awayAnalysis.totalPoints}/9 Puan
                                            </span>
                                        </h4>
                                        
                                        {selectedMatch.awayAnalysis.steps.map((step, idx) => (
                                                <ScoreCard 
                                                    key={idx} 
                                                    step={step} 
                                                    team={selectedMatch.awayTeam}
                                                    frequentSteps={frequentSteps}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Puanlama Sistemi Modal */}
            <ScoringSystemModal 
                isOpen={showScoringSystem} 
                onClose={() => setShowScoringSystem(false)} 
            />

            {/* Potansiyel Analiz Sonuç Modalı */}
            <Dialog 
                open={showPotentialAnalysis} 
                onClose={() => setShowPotentialAnalysis(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-4xl bg-gray-900 rounded-xl shadow-xl 
                                   max-h-[90vh] flex flex-col">
                        {potentialAnalysisResult && (
                            <>
                                {/* Banner Bölümü */}
                                <div className="relative p-8 border-b border-gray-800 
                                            bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
                                            overflow-hidden flex-shrink-0">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-white">Potansiyel Sürpriz Analizi</h3>
                                        <button onClick={() => setShowPotentialAnalysis(false)} className="text-gray-400 hover:text-white">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Takımlar ve Skor */}
                                    <div className="flex items-center justify-between">
                                        {/* X Takımı */}
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="relative">
                                                <TeamLogo name={potentialAnalysisResult.homeTeam} className="w-24 h-24" />
                                                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full 
                                                            ${getScoreColor(potentialAnalysisResult.homeAnalysis.totalPoints)}
                                                            flex items-center justify-center text-white text-sm font-bold`}>
                                                    {potentialAnalysisResult.homeAnalysis.totalPoints}
                                                </div>
                                            </div>
                                            <span className="text-lg font-medium text-white">{potentialAnalysisResult.homeTeam}</span>
                                        </div>

                                        {/* Orta Kısım - Toplam Puan */}
                                        <div className="flex flex-col items-center">
                                            <div className="text-2xl font-bold text-white mb-2">
                                                Toplam Potansiyel
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-40 h-3 bg-gray-700 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all ${getScoreColor(potentialAnalysisResult.totalPoints)}`}
                                                         style={{ width: `${(potentialAnalysisResult.totalPoints / 18) * 100}%` }} />
                                                </div>
                                                <span className={`text-2xl font-bold ${getScoreColor(potentialAnalysisResult.totalPoints).replace('bg-', 'text-')}`}>
                                                    {potentialAnalysisResult.totalPoints}/18
                                                </span>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-400">
                                                {potentialAnalysisResult.totalPoints >= 14 ? 'Yüksek Potansiyel' :
                                                 potentialAnalysisResult.totalPoints >= 10 ? 'Orta Potansiyel' : 'Düşük Potansiyel'}
                                            </div>
                                        </div>

                                        {/* Y Takımı */}
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="relative">
                                                <TeamLogo name={potentialAnalysisResult.awayTeam} className="w-24 h-24" />
                                                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full 
                                                            ${getScoreColor(potentialAnalysisResult.awayAnalysis.totalPoints)}
                                                            flex items-center justify-center text-white text-sm font-bold`}>
                                                    {potentialAnalysisResult.awayAnalysis.totalPoints}
                                                </div>
                                            </div>
                                            <span className="text-lg font-medium text-white">{potentialAnalysisResult.awayTeam}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Analiz İçeriği - Scroll olacak */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="p-6 grid grid-cols-2 gap-6">
                                        {/* Ev Sahibi Analizi */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-white flex items-center gap-2 mb-6">
                                                <TeamLogo name={potentialAnalysisResult.homeTeam} className="w-6 h-6" />
                                                <span className="text-lg">{potentialAnalysisResult.homeTeam} Analizi</span>
                                                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium
                                                            ${getScoreColor(potentialAnalysisResult.homeAnalysis.totalPoints)} bg-opacity-20
                                                            text-${getScoreColor(potentialAnalysisResult.homeAnalysis.totalPoints).split('-')[1]}-400`}>
                                                    {potentialAnalysisResult.homeAnalysis.totalPoints}/9 Puan
                                                </span>
                                            </h4>
                                            
                                            {potentialAnalysisResult.homeAnalysis.steps.map((step, idx) => (
                                                <ScoreCard 
                                                    key={idx} 
                                                    step={step} 
                                                    team={potentialAnalysisResult.homeTeam}
                                                    frequentSteps={frequentSteps}
                                                />
                                            ))}
                                        </div>

                                        {/* Y Takımı Analizi */}
                                        <div className="space-y-4">
                                            <h4 className="font-medium text-white flex items-center gap-2 mb-6">
                                                <TeamLogo name={potentialAnalysisResult.awayTeam} className="w-6 h-6" />
                                                <span className="text-lg">{potentialAnalysisResult.awayTeam} Analizi</span>
                                                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium
                                                            ${getScoreColor(potentialAnalysisResult.awayAnalysis.totalPoints)} bg-opacity-20
                                                            text-${getScoreColor(potentialAnalysisResult.awayAnalysis.totalPoints).split('-')[1]}-400`}>
                                                    {potentialAnalysisResult.awayAnalysis.totalPoints}/9 Puan
                                                </span>
                                            </h4>
                                            
                                            {potentialAnalysisResult.awayAnalysis.steps.map((step, idx) => (
                                                <ScoreCard 
                                                    key={idx} 
                                                    step={step} 
                                                    team={potentialAnalysisResult.awayTeam}
                                                    frequentSteps={frequentSteps}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Benzerlik Modal */}
            <SimilarityModal 
                isOpen={!!selectedSimilarity}
                onClose={() => setSelectedSimilarity(null)}
                data={selectedSimilarity}
            />
        </div>
    );
}; 