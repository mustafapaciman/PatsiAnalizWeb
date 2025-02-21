export class TeamManager {
    constructor(initialTeams) {
        Object.defineProperty(this, "teams", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "teamStats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "FORM_LENGTH", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 5
        });
        if (initialTeams) {
            this.teams = { ...initialTeams };
        }
    }
    addTeam(team) {
        this.teams[team.name] = team;
    }
    getTeam(teamName) {
        return this.teams[teamName];
    }
    updateTeamStats(matches) {
        // Her takım için istatistikleri sıfırla
        this.teamStats.clear();
        // Tüm maçları işle
        matches.forEach(match => {
            this.processMatch(match);
        });
        // Ortalama istatistikleri hesapla
        this.calculateAverageStats();
    }
    processMatch(match) {
        const homeTeam = match.HomeTeam;
        const awayTeam = match.AwayTeam;
        const homeGoals = match.FTHG ?? 0;
        const awayGoals = match.FTAG ?? 0;
        // Ev sahibi takım istatistiklerini güncelle
        this.updateTeamMatchStats(homeTeam, homeGoals, awayGoals, true);
        // Deplasman takımı istatistiklerini güncelle
        this.updateTeamMatchStats(awayTeam, awayGoals, homeGoals, false);
    }
    updateTeamMatchStats(teamName, goalsScored, goalsConceded, isHome) {
        let stats = this.teamStats.get(teamName);
        if (!stats) {
            stats = this.initializeTeamStats();
            this.teamStats.set(teamName, stats);
        }
        // Genel istatistikleri güncelle
        stats.totalMatches++;
        stats.goalsScored += goalsScored;
        stats.goalsConceded += goalsConceded;
        if (goalsConceded === 0) {
            stats.cleanSheets++;
        }
        // Sonuç bazlı istatistikleri güncelle
        if (goalsScored > goalsConceded) {
            stats.wins++;
            stats.form.push('W');
        }
        else if (goalsScored < goalsConceded) {
            stats.losses++;
            stats.form.push('L');
        }
        else {
            stats.draws++;
            stats.form.push('D');
        }
        // Form geçmişini sınırla
        if (stats.form.length > this.FORM_LENGTH) {
            stats.form = stats.form.slice(-this.FORM_LENGTH);
        }
        // Saha bazlı istatistikleri güncelle
        const venueStats = isHome ? stats.homeStats : stats.awayStats;
        if (venueStats) {
            venueStats.matches++;
            venueStats.goalsScored += goalsScored;
            venueStats.goalsConceded += goalsConceded;
            if (goalsConceded === 0)
                venueStats.cleanSheets++;
            if (goalsScored > goalsConceded) {
                venueStats.wins++;
            }
            else if (goalsScored < goalsConceded) {
                venueStats.losses++;
            }
            else {
                venueStats.draws++;
            }
        }
    }
    initializeTeamStats() {
        return {
            totalMatches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsScored: 0,
            goalsConceded: 0,
            cleanSheets: 0,
            form: [],
            homeStats: {
                matches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsScored: 0,
                goalsConceded: 0,
                cleanSheets: 0
            },
            awayStats: {
                matches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsScored: 0,
                goalsConceded: 0,
                cleanSheets: 0
            },
            averageStats: {
                goalsScored: 0,
                goalsConceded: 0,
                points: 0
            }
        };
    }
    calculateAverageStats() {
        this.teamStats.forEach(stats => {
            const totalMatches = stats.totalMatches || 1; // Sıfıra bölmeyi önle
            const totalPoints = (stats.wins * 3) + stats.draws;
            stats.averageStats = {
                goalsScored: stats.goalsScored / totalMatches,
                goalsConceded: stats.goalsConceded / totalMatches,
                points: totalPoints / totalMatches
            };
        });
    }
    getTeamStats(teamName) {
        return this.teamStats.get(teamName);
    }
    getAllTeamStats() {
        return new Map(this.teamStats);
    }
    getFormStrength(teamName) {
        const stats = this.teamStats.get(teamName);
        if (!stats || !stats.form.length)
            return 0;
        return stats.form.reduce((strength, result, index) => {
            const weight = (index + 1) / stats.form.length; // Son maçlara daha fazla ağırlık ver
            switch (result) {
                case 'W': return strength + (3 * weight);
                case 'D': return strength + (1 * weight);
                default: return strength;
            }
        }, 0) / stats.form.length;
    }
    getHeadToHeadStats(team1, team2, matches) {
        const h2hMatches = matches.filter(m => (m.HomeTeam === team1 && m.AwayTeam === team2) ||
            (m.HomeTeam === team2 && m.AwayTeam === team1));
        let team1Wins = 0;
        let team2Wins = 0;
        let draws = 0;
        let totalGoals = 0;
        h2hMatches.forEach(match => {
            const team1IsHome = match.HomeTeam === team1;
            const homeGoals = match.FTHG ?? 0;
            const awayGoals = match.FTAG ?? 0;
            totalGoals += homeGoals + awayGoals;
            if (homeGoals > awayGoals) {
                team1IsHome ? team1Wins++ : team2Wins++;
            }
            else if (homeGoals < awayGoals) {
                team1IsHome ? team2Wins++ : team1Wins++;
            }
            else {
                draws++;
            }
        });
        return {
            totalMatches: h2hMatches.length,
            team1Wins,
            team2Wins,
            draws,
            averageGoals: h2hMatches.length > 0 ? totalGoals / h2hMatches.length : 0,
            lastEncounter: h2hMatches[0] // Maçlar tarih sırasına göre sıralı olmalı
        };
    }
}
