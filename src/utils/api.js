const BASE_URL = 'https://api.football-data.org/v4';
const CORS_PROXY = 'https://corsproxy.io/?';
export async function fetchTodaysMatches() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log('Fetching matches for date:', today);
        const targetUrl = `${BASE_URL}/matches?dateFrom=${today}&dateTo=${today}`;
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`, {
            method: 'GET',
            headers: {
                'X-Auth-Token': 'c98e3e627e4947f4a8a4c2d7b38c8a82'
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API isteği başarısız oldu: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        console.log('API Response:', data);
        if (!data.matches || !Array.isArray(data.matches)) {
            throw new Error('API yanıtı beklenen formatta değil');
        }
        return data.matches;
    }
    catch (error) {
        console.error('API hatası:', error);
        throw error;
    }
}
// API yanıtını bizim Match tipimize dönüştüren yardımcı fonksiyon
export function convertApiFixtureToMatch(fixture) {
    const date = new Date(fixture.utcDate);
    return {
        id: fixture.id.toString(),
        Div: fixture.competition.name,
        Date: date.toLocaleDateString('tr-TR'),
        Time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        HomeTeam: fixture.homeTeam.name,
        AwayTeam: fixture.awayTeam.name,
        FTHG: fixture.score.fullTime.home,
        FTAG: fixture.score.fullTime.away,
        FTR: fixture.status,
        league: {
            id: fixture.competition.id,
            name: fixture.competition.name,
            country: fixture.competition.code,
            logo: fixture.competition.emblem
        }
    };
}
