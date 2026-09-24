import React, { useRef, useCallback } from 'react';
import { Calendar, BarChart2, Settings, Image, CalendarDays, Upload, Calculator } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import * as XLSX from 'xlsx';
import { Team } from '../utils/types/team';
import { FixtureDownload } from './FixtureDownload';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface NavigationProps {
  activePage: 'fixtures' | 'analysis';
  onPageChange: (page: 'fixtures' | 'analysis') => void;
  onDataLoad: (data: any[]) => void;
  onTeamDataLoad: (data: any) => void;
  onFixturesLoad: (fixtures: any[]) => void;
  isDataLoaded?: boolean;
}

export function Navigation({ 
  activePage, 
  onPageChange,
  onDataLoad,
  onTeamDataLoad,
  onFixturesLoad,
  isDataLoaded = false
}: NavigationProps) {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fixtureInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Team & { logoURL?: string }>;

      const teamMapping = jsonData.reduce((acc, team) => {
        const name = String(team.name || '').trim();
        const logoUrl = String(team.logoUrl || team.logoURL || '').trim();
        if (!name || !/^https?:\/\//i.test(logoUrl)) return acc;
        const normalizedTeam = { ...team, name, logoUrl };
        acc[name] = normalizedTeam;
        if (team.shortDisplayName && team.shortDisplayName !== name) {
          acc[team.shortDisplayName.trim()] = normalizedTeam;
        }
        return acc;
      }, {} as { [key: string]: Team });

      if (Object.keys(teamMapping).length === 0) {
        throw new Error('Dosyada name ve logoURL/ logoUrl sütunları bulunamadı');
      }
      onTeamDataLoad(teamMapping);
    } catch (error) {
      console.error('Error loading team logos:', error);
      toast.error('Logo dosyası okunamadı. name ve logoURL sütunlarını kontrol edin.');
    }
  }, [onTeamDataLoad]);

  const handleFixtureFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      onFixturesLoad(jsonData);
    } catch (error) {
      console.error('Error loading fixture file:', error);
    }
  }, [onFixturesLoad]);

  const tabs = [
    { name: 'Maçlar', path: '/' },
    { name: 'İstatistik Analizi', path: '/surpriz-analiz' },
    { name: 'Özel Analiz', path: '/ozel-analiz' },
    { name: 'Maç Programı', path: '/match-schedule' }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-4">
          {tabs.map((tab) => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                location.pathname === tab.path
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white'
              }`}
            >
              {tab.path === '/' && <Calendar size={20} className="transition-transform duration-300 group-hover:rotate-12" />}
              {tab.path === '/surpriz-analiz' && <BarChart2 size={20} className="transition-transform duration-300 group-hover:rotate-12" />}
              {tab.path === '/ozel-analiz' && <BarChart2 size={20} className="transition-transform duration-300 group-hover:rotate-12" />}
              {tab.path === '/match-schedule' && <CalendarDays size={20} className="transition-transform duration-300 group-hover:rotate-12" />}
              <span>{tab.name}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={handleImageClick}
              title="Takım logolarını CSV veya Excel dosyasından yükle"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110 group"
            >
              <Image size={24} className="text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                Takım Logolarını Yükle
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>

          <div className="relative group">
            <button
              onClick={() => {
                const fixtureDownloadButton = document.querySelector('.fixture-download-button') as HTMLButtonElement;
                if (fixtureDownloadButton) {
                  fixtureDownloadButton.click();
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            >
              <CalendarDays size={24} className="text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Bu Haftanın Maçlarını Yükle
            </div>
            <div className="hidden">
              <FixtureDownload onFixturesLoad={onFixturesLoad} />
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => fixtureInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            >
              <Upload size={24} className="text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </button>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Fixture Dosyası Yükle
            </div>
            <input
              type="file"
              ref={fixtureInputRef}
              className="hidden"
              accept=".csv,.xlsx"
              onChange={handleFixtureFileChange}
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-110"
            >
              <Settings size={24} className="text-gray-600 dark:text-gray-400 transition-all duration-300 hover:rotate-90" />
            </button>
            
            {isSettingsOpen && (
              <SettingsPanel
                onClose={() => setIsSettingsOpen(false)}
                onDataLoad={onDataLoad}
                onTeamDataLoad={onTeamDataLoad}
                onFixturesLoad={onFixturesLoad}
                isDataLoaded={isDataLoaded}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
