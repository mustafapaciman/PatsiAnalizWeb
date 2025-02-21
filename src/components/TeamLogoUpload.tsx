import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';
import { Team } from '../utils/types/team';

interface TeamLogoUploadProps {
  onTeamDataLoad: (data: { [key: string]: Team }) => void;
}

export function TeamLogoUpload({ onTeamDataLoad }: TeamLogoUploadProps) {
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Team[];

    // Convert array to mapping object
    const teamMapping = jsonData.reduce((acc, team) => {
      acc[team.name] = team;
      // Also add mapping for shortDisplayName
      if (team.shortDisplayName !== team.name) {
        acc[team.shortDisplayName] = team;
      }
      return acc;
    }, {} as { [key: string]: Team });

    onTeamDataLoad(teamMapping);
  }, [onTeamDataLoad]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-6">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Takım logolarını yüklemek için tıklayın</span>
          </p>
          <p className="text-xs text-gray-500">CSV dosyası</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}