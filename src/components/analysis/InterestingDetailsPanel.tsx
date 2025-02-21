import { NextDaySurpriseModal } from './NextDaySurpriseModal';
import { CalendarDays } from 'lucide-react';

export const InterestingDetailsPanel: React.FC<InterestingDetailsPanelProps> = ({
    // ... mevcut props ...
}) => {
    // ... mevcut state'ler ...
    const [showNextDaySurpriseModal, setShowNextDaySurpriseModal] = useState(false);

    return (
        <>
            {openPanels.interesting && (
                <div className="space-y-3">
                    {/* UEFA Dönüşü Kartı */}
                    <button
                        onClick={() => setShowUefaModal(true)}
                        className="w-full bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                    >
                        {/* ... mevcut içerik ... */}
                    </button>

                    {/* Son Rakip Kartı */}
                    <button
                        onClick={() => setShowLastOpponentModal(true)}
                        className="w-full bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                    >
                        {/* ... mevcut içerik ... */}
                    </button>

                    {/* İstatistik Kartı */}
                    <button
                        onClick={() => setShowStatisticsModal(true)}
                        className="w-full bg-gray-900/30 rounded-lg p-4 hover:bg-gray-900/40 transition-colors text-left"
                    >
                        {/* ... mevcut içerik ... */}
                    </button>

                    {/* Hafta Analizi Kartı */}
                    <div 
                        onClick={() => setShowWeekAnalysisModal(true)}
                        className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/20 rounded-xl p-6 cursor-pointer"
                    >
                        {/* ... mevcut içerik ... */}
                    </div>

                    {/* Skor Analizi Kartı */}
                    <div 
                        onClick={() => setIsScoreModalOpen(true)}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer"
                    >
                        {/* ... mevcut içerik ... */}
                    </div>

                    {/* Yeni Sıradaki Sürpriz Kartı */}
                    <div 
                        onClick={() => setShowNextDaySurpriseModal(true)}
                        className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/20 rounded-xl p-6 cursor-pointer 
                                 hover:from-indigo-900/60 hover:to-indigo-800/30 transition-colors"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-500/20 rounded-lg">
                                <CalendarDays className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-indigo-400">
                                    Sıradaki Sürpriz
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Takımların belirli günlerdeki sürprizlerinden sonraki gün analizi
                                </p>
                            </div>
                        </div>

                        <div className="text-sm text-gray-400">
                            Seçilen takımın belirli bir gündeki sürprizlerinden sonraki gün gerçekleşen diğer sürprizleri inceleyin.
                        </div>
                    </div>
                </div>
            )}

            {/* ... diğer modallar ... */}

            {/* Sıradaki Sürpriz Modalı */}
            <NextDaySurpriseModal 
                isOpen={showNextDaySurpriseModal}
                onClose={() => setShowNextDaySurpriseModal(false)}
                matchData={matchData}
                selectedLeague={selectedLeague}
            />
        </>
    );
}; 