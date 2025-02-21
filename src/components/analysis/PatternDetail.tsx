import React from 'react';
import { useParams } from 'react-router-dom';
import { TeamLogo } from '../TeamLogo';

export const PatternDetail: React.FC = () => {
    const { patternData } = useParams();
    const { team, pattern } = JSON.parse(decodeURIComponent(patternData || ''));

    // Pattern tipine göre özel açıklama oluştur
    const getDetailedDescription = () => {
        switch (pattern.type) {
            case 'score':
                return {
                    title: 'Skor Paterni',
                    explanation: `${team} takımı, ${pattern.opponent} ile karşılaştığında genellikle benzer skor farkları oluşturuyor. Bu durum ${pattern.occurrences} kez tekrarlanmış ve %${pattern.confidence.toFixed(1)} oranında tutarlılık gösteriyor.`,
                    strategy: 'Bu pattern, takımların birbirlerine karşı oyun stillerinin çok benzer olduğunu ve maçların genellikle benzer şekilde geliştiğini gösteriyor.'
                };
            case 'season':
                const half = pattern.matches[0]?.seasonHalf === 'first' ? 'ilk' : 'ikinci';
                return {
                    title: 'Sezon Zamanlaması Paterni',
                    explanation: `${team} takımı, ${pattern.opponent} ile sezonun ${half} yarısında oynadığı maçlarda sürpriz sonuçlar almaya daha yatkın. Bu durum ${pattern.occurrences} farklı sezonda gözlemlendi.`,
                    strategy: 'Bu zamanlama paterni, takımların form durumu ve sezon hedefleriyle ilişkili olabilir.'
                };
            default:
                return {
                    title: 'Genel Pattern Analizi',
                    explanation: pattern.description,
                    strategy: 'Bu pattern üzerinde daha detaylı analiz yapılabilir.'
                };
        }
    };

    const details = getDetailedDescription();

    return (
        <div className="bg-gray-900 text-white min-h-screen p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Üst Banner */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 shadow-xl">
                    <div className="flex items-center gap-6">
                        <TeamLogo name={team} className="w-16 h-16" />
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">
                                {team} - {pattern.opponent} Pattern Analizi
                            </h1>
                            <div className="text-gray-400 text-lg">
                                {details.title}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-blue-400">
                                {pattern.occurrences}
                            </div>
                            <div className="text-gray-400">Tekrar</div>
                        </div>
                    </div>
                </div>

                {/* Ana İçerik Grid */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Pattern Özeti */}
                    <div className="col-span-2 bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4 text-blue-400">
                            Pattern Açıklaması
                        </h2>
                        <p className="text-gray-300 text-lg leading-relaxed mb-6">
                            {details.explanation}
                        </p>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <h3 className="text-lg font-medium mb-2 text-yellow-400">
                                Stratejik Değerlendirme
                            </h3>
                            <p className="text-gray-400">
                                {details.strategy}
                            </p>
                        </div>
                    </div>

                    {/* Güven Skoru Kartı */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Güven Analizi</h2>
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-32 mb-4">
                                <svg className="w-full h-full" viewBox="0 0 36 36">
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#2563eb"
                                        strokeWidth="3"
                                        strokeDasharray={`${pattern.confidence}, 100`}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-blue-400">
                                        {pattern.confidence.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-center text-gray-400">
                                Pattern Güven Skoru
                            </div>
                        </div>
                    </div>
                </div>

                {/* Maç Detayları */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold mb-6 text-blue-400">
                        Pattern Örnekleri
                    </h2>
                    <div className="space-y-4">
                        {pattern.matches.map((match, index) => (
                            <div key={index} 
                                 className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-lg font-medium">
                                                {match.score}
                                            </div>
                                            <div className="text-gray-400">
                                                {match.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gray-300">
                                            {match.season}
                                        </div>
                                        <div className="text-gray-500 text-sm">
                                            {match.seasonHalf === 'first' ? 'İlk Yarı' : 'İkinci Yarı'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}; 