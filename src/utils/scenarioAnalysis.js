export function findScenarioMatches(matches, team) {
    return matches.filter(match => {
        const isHome = match.HomeTeam === team;
        const isAway = match.AwayTeam === team;
        // 1/2 Senaryosu
        const scenario1 = (isHome && match.HalfTimeHomeGoals > match.HalfTimeAwayGoals && match.FullTimeHomeGoals < match.FullTimeAwayGoals) ||
            (isAway && match.HalfTimeHomeGoals < match.HalfTimeAwayGoals && match.FullTimeHomeGoals > match.FullTimeAwayGoals);
        // 2/1 Senaryosu
        const scenario2 = (isHome && match.HalfTimeHomeGoals < match.HalfTimeAwayGoals && match.FullTimeHomeGoals > match.FullTimeAwayGoals) ||
            (isAway && match.HalfTimeHomeGoals > match.HalfTimeAwayGoals && match.FullTimeHomeGoals < match.FullTimeAwayGoals);
        return scenario1 || scenario2;
    }).map(match => ({
        ...match,
        similarity: calculateSimilarity(match)
    })).sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
}
export function groupMatchesByOpponent(matches) {
    return matches.reduce((acc, match) => {
        const opponent = match.HomeTeam === matches[0].HomeTeam ? match.AwayTeam : match.HomeTeam;
        if (!acc[opponent]) {
            acc[opponent] = [];
        }
        acc[opponent].push(match);
        return acc;
    }, {});
}
function calculateSimilarity(match) {
    // Basit bir benzerlik skoru hesaplama
    // Bu fonksiyon geliştirilebilir
    return Math.random(); // Şimdilik rastgele bir değer döndürüyoruz
}
