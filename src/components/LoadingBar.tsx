import React from 'react';

interface LoadingBarProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingBar({ isLoading, message = 'Veriler yükleniyor...' }: LoadingBarProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-blue-600 h-1 animate-progress"></div>
      <div className="text-center text-sm text-blue-600 mt-1">{message}</div>
    </div>
  );
} 