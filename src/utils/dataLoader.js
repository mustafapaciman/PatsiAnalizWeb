export async function loadMatchData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/your-repo/data/matches.xlsx');
        if (!response.ok) {
            throw new Error('Failed to fetch match data');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error loading match data:', error);
        return [];
    }
}
