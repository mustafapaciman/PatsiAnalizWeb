import React from 'react';
import { X } from 'lucide-react';
import { Match } from '../utils/types';
import { parseDateString } from '../utils/dateUtils';

interface MatchModalProps {
  match: Match;
  onClose: () => void;
}

export function MatchModal({ match, onClose }: MatchModalProps) {
  const formatDateTime = (date: string, time: string) => {
    const dateObj = parseDateString(date, time);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Maç Detayları</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Genel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Tarih ve Saat:</div>
              <div className="font-medium">{formatDateTime(match.Date, match.Time)}</div>
              <div>Lig:</div>
              <div className="font-medium">{match.Div}</div>
              <div>Skor:</div>
              <div className="font-medium">{match.FTHG} - {match.FTAG}</div>
              <div>İlk Yarı:</div>
              <div className="font-medium">{match.HTHG} - {match.HTAG}</div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Bahis Oranları</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Ev Sahibi:</div>
              <div className="font-medium">{match.B365CH}</div>
              <div>Beraberlik:</div>
              <div className="font-medium">{match.B365CD}</div>
              <div>Deplasman:</div>
              <div className="font-medium">{match.B365CA}</div>
              <div>2.5 Üst:</div>
              <div className="font-medium">{match['B365C>2.5']}</div>
              <div>2.5 Alt:</div>
              <div className="font-medium">{match['B365C<2.5']}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}