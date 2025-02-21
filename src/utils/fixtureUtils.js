import { parseDateString } from './dateUtils';
export function groupFixturesByLeague(fixtures) {
    const grouped = {};
    fixtures.sort((a, b) => {
        const dateA = parseDateString(a.Date, a.Time);
        const dateB = parseDateString(b.Date, b.Time);
        return dateA.getTime() - dateB.getTime();
    });
    fixtures.forEach(match => {
        if (!grouped[match.Div]) {
            grouped[match.Div] = [];
        }
        grouped[match.Div].push(match);
    });
    return grouped;
}
export function sortStatistics(stats) {
    return Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
    }, {});
}
