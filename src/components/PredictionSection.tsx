import React from 'react';
import { Match } from '../utils/types/match';
import { Brain, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Flag } from 'lucide-react';
import { analyzePrediction } from '../utils/predictionAnalysis';

interface PredictionSectionProps {
  match: Match;
  selectedMatch: Match;
}

export function PredictionSection({ match, selectedMatch }: PredictionSectionProps) {
  const prediction = analyzePrediction(match, selectedMatch);

  return (
    <div className="bg-slate-100 rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <Brain className="text-[#1e3a8a]" size={24} />
        <h2 className="text-lg font-bold text-gray-800">AI Tahmin Analizi</h2>
      </div>

      <div className="space-y-6">
        {/* Skor Tahminleri */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <span className="text-sm font-medium text-[#1e3a8a]">İlk Yarı Tahmini</span>
            <span className="text-lg font-bold text-[#1e3a8a]">{prediction.halfTimeScore}</span>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <span className="text-sm font-medium text-[#1e3a8a]">İY/MS Senaryosu</span>
            <span className="text-lg font-bold text-[#1e3a8a]">{prediction.htftScenario}</span>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <span className="text-sm font-medium text-[#1e3a8a]">Maç Sonucu</span>
            <span className="text-lg font-bold text-[#1e3a8a]">{prediction.finalScore}</span>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded-lg">
            <span className="text-sm font-medium text-[#1e3a8a]">Toplam Korner</span>
            <span className="text-lg font-bold text-[#1e3a8a]">{prediction.cornerPrediction}</span>
          </div>
        </div>

        {/* Güven Seviyesi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1e3a8a]">Tahmin Güven Seviyesi</span>
            <span className="text-sm font-medium text-[#1e3a8a]">%{prediction.confidence}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                prediction.confidence >= 70 
                  ? 'bg-green-600' 
                  : prediction.confidence >= 50 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${prediction.confidence}%` }}
            ></div>
          </div>
        </div>

        {/* En Yüksek Güvenli Tahmin */}
        {prediction.highestConfidenceComment && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <Flag size={16} />
              <span className="text-sm font-medium">En Yüksek Güvenli Tahmin</span>
            </div>
            <p className="text-sm text-yellow-900 bg-yellow-100/50 px-2 py-1 rounded">
              {prediction.highestConfidenceComment}
            </p>
          </div>
        )}

        {/* Analiz Faktörleri */}
        <div className="space-y-4">
          {prediction.positiveFactors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                Olumlu Faktörler
              </h3>
              <ul className="space-y-1">
                {prediction.positiveFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prediction.negativeFactors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <XCircle size={16} className="text-red-600" />
                Olumsuz Faktörler
              </h3>
              <ul className="space-y-1">
                {prediction.negativeFactors.map((factor, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Uyarı Notu */}
        <div className="text-xs text-gray-500 border-t pt-4">
          Not: Bu tahminler yapay zeka analizi sonucunda oluşturulmuştur ve sadece bilgi amaçlıdır. 
          Kesin sonuçları garanti etmez.
        </div>
      </div>
    </div>
  );
} 