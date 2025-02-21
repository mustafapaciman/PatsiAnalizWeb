import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { loadFixtures } from '../utils/fixtureLoader';
export function FixtureDownload({ onFixturesLoad }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleLoad = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fixtures = await loadFixtures();
            if (fixtures.length === 0) {
                throw new Error('Fikstür yüklenemedi. Lütfen proxy sunucusunun çalıştığından emin olun.');
            }
            onFixturesLoad(fixtures);
        }
        catch (err) {
            console.error('Fikstür yükleme hatası:', err);
            setError(err instanceof Error ? err.message : 'Fikstür yüklenirken bir hata oluştu');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("button", { onClick: handleLoad, disabled: isLoading, className: "fixture-download-button hidden" }));
}
