import React, { useEffect } from 'react';
import { Database, Moon, Sun, Lock } from 'lucide-react';
import { loadMatchData } from '../utils/teamDataLoader';

interface SettingsPanelProps {
  onClose?: () => void;
  onDataLoad: (data: any[]) => void;
  onTeamDataLoad: (data: any) => void;
  onFixturesLoad: (fixtures: any[]) => void;
  isDataLoaded?: boolean;
}

export function SettingsPanel({ 
  onClose, 
  onDataLoad, 
  onTeamDataLoad, 
  onFixturesLoad,
  isDataLoaded = false 
}: SettingsPanelProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  // Program başlatıldığında açık tema ile başlat
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    setIsDarkMode(false);
  }, []);

  const handleLoadMatchData = async () => {
    try {
      console.log('Loading match data...');
      const matchData = await loadMatchData();
      onDataLoad(matchData);
      console.log('Match data loaded successfully');
    } catch (error) {
      console.error('Error loading match data:', error);
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ayarlar</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg transition-all duration-300 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sun size={20} className="text-gray-400 dark:text-gray-500" />
                <Lock size={12} className="absolute -top-1 -right-1 text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Tema</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Eklenecektir...
                </p>
              </div>
            </div>
            <button
              disabled
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-gray-400 dark:bg-gray-600 translate-x-1" />
            </button>
          </div>

          <div className={`flex items-center justify-between p-2 ${
            isDataLoaded 
              ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          } rounded-lg transition-all duration-300`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Database size={20} className={
                  isDataLoaded 
                    ? 'text-gray-400 dark:text-gray-500' 
                    : 'text-blue-600 dark:text-blue-400'
                } />
                {isDataLoaded && (
                  <Lock size={12} className="absolute -top-1 -right-1 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Maç Verilerini Yükle</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDataLoaded ? 'Veriler yüklendi' : 'Verileri yükle'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadMatchData}
              disabled={isDataLoaded}
              className={`p-1.5 rounded transition-all duration-300 ${
                isDataLoaded
                  ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700'
              }`}
            >
              <Database size={16} className={
                isDataLoaded 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-blue-600 dark:text-blue-400'
              } />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}