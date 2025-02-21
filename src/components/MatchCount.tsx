import React from 'react';
import { Database } from 'lucide-react';

interface MatchCountProps {
  count: number;
}

export function MatchCount({ count }: MatchCountProps) {
  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 rounded-lg shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <Database size={24} />
        <div>
          <h2 className="text-xl font-bold">Toplam Maç Sayısı</h2>
          <p className="text-3xl font-bold">{count}</p>
        </div>
      </div>
    </div>
  );
}