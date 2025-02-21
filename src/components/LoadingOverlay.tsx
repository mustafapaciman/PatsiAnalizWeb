import React from 'react';
import { Loader2, Database } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'Veriler yükleniyor...', 
  progress 
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl border border-blue-100">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <Database className="w-16 h-16 text-blue-600 opacity-20" />
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin absolute top-0 left-0" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">{message}</h3>
          
          <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-300 ease-out relative"
              style={{ 
                width: `${progress ?? 0}%`,
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          
          {progress != null && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-blue-600 text-lg">{Math.round(progress)}%</span>
              <span className="text-gray-500">tamamlandı</span>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500 text-center">
            <span className="inline-block animate-bounce">Lütfen</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}> bekleyin</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>...</span>
          </div>
        </div>
      </div>
    </div>
  );
} 