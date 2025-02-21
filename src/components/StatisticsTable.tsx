import React from 'react';
import { Match } from '../utils/types/match';

interface StatisticsTableProps {
  data: {
    matches: Match[];
    scores: { [key: string]: number };
    htftScenarios: { [key: string]: number };
    htScores: { [key: string]: number };
    htGoals: { [key: string]: number };
    ftGoals: { [key: string]: number };
  };
}

export function StatisticsTable({ data }: StatisticsTableProps) {
  const getPercentageColor = (percentage: number, totalMatches: number) => {
    // Eğer toplam maç sayısı 50'den fazlaysa daha yüksek eşikler kullan
    if (totalMatches >= 50) {
      if (percentage >= 25) return 'bg-[#4ade80]';  // Yeşil
      if (percentage >= 15) return 'bg-[#fbbf24]';  // Sarı
      return 'bg-[#ef4444]';  // Kırmızı
    }
    // Eğer toplam maç sayısı 20-50 arasındaysa orta eşikler kullan
    else if (totalMatches >= 20) {
      if (percentage >= 20) return 'bg-[#4ade80]';  // Yeşil
      if (percentage >= 10) return 'bg-[#fbbf24]';  // Sarı
      return 'bg-[#ef4444]';  // Kırmızı
    }
    // Eğer toplam maç sayısı 20'den azsa daha düşük eşikler kullan
    else {
      if (percentage >= 15) return 'bg-[#4ade80]';  // Yeşil
      if (percentage >= 8) return 'bg-[#fbbf24]';   // Sarı
      return 'bg-[#ef4444]';  // Kırmızı
    }
  };

  const renderStats = (title: string, stats: { [key: string]: number }, total: number) => {
    const sortedStats = Object.entries(stats)
      .sort(([, a], [, b]) => b - a);

    return (
      <div className="flex flex-col min-w-[120px]">
        <div className="bg-[#1a1f2e] text-white py-1.5 px-2 rounded-t-lg text-center font-medium text-sm mb-1">
          {title}
        </div>
        <div className="space-y-1 p-1 bg-white rounded-b-lg shadow-md">
          {sortedStats.map(([key, value]) => {
            const percentage = ((value / total) * 100).toFixed(0);
            return (
              <div key={key} className="bg-white rounded shadow-md mb-2">
                <div className={`${getPercentageColor(Number(percentage), total)} text-black text-center py-0.5 text-base font-bold rounded-t mb-1`}>
                  %{percentage}
                </div>
                <div className="py-1 px-1.5 text-center space-y-0.5">
                  <div className="text-gray-600 text-xs mb-1">{title}</div>
                  <div className="text-gray-900 font-bold text-base leading-none mb-1">{key}</div>
                  <div className="text-gray-500 text-xs leading-none">{value} Kere</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Eğer benzer maç yoksa mesaj göster
  if (data.matches.length === 0) {
    return (
      <div className="w-full max-w-[650px]">
        <div className="bg-white p-6 rounded-lg text-center">
          <p className="text-gray-600">Seçilen tolerans değerine göre benzer maç bulunamadı. İstatistikler gösterilemiyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px]">
      <div className="bg-white p-4 rounded-lg overflow-y-auto max-h-[600px]">
        <div className="flex gap-3">
          {renderStats("Skorlar", data.scores, data.matches.length)}
          {renderStats("İY/MS", data.htftScenarios, data.matches.length)}
          {renderStats("İlk Yarı Skor", data.htScores, data.matches.length)}
          {renderStats("İlk Yarı Gol", data.htGoals, data.matches.length)}
          {renderStats("Maç Sonu Gol", data.ftGoals, data.matches.length)}
        </div>
      </div>
    </div>
  );
} 