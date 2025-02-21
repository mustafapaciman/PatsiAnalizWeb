import { PERFORMANCE_CONFIG, CACHE_KEYS } from './constants';
export class Cache {
    constructor() {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.cache = new Map();
        this.maxSize = PERFORMANCE_CONFIG.CACHE_SIZE;
    }
    static getInstance() {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }
    set(key, data, options = {}) {
        const now = Date.now();
        const duration = options.duration || PERFORMANCE_CONFIG.CACHE_DURATION;
        const maxSize = options.maxSize || this.maxSize;
        // Cache boyutu aşıldıysa en eski öğeleri kaldır
        if (this.cache.size >= maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + duration,
        });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        // Süresi dolmuş öğeleri temizle
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    has(key) {
        const item = this.cache.get(key);
        if (!item)
            return false;
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    clearExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    evictOldest() {
        let oldestKey = null;
        let oldestTimestamp = Infinity;
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTimestamp) {
                oldestTimestamp = item.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    // Yardımcı metodlar
    getMatchKey(date, league) {
        return `${CACHE_KEYS.MATCHES}:${date}${league ? `:${league}` : ''}`;
    }
    getTeamKey(teamId) {
        return `${CACHE_KEYS.TEAMS}:${teamId}`;
    }
    getLeagueKey(leagueId) {
        return `${CACHE_KEYS.LEAGUES}:${leagueId}`;
    }
    getStatsKey(teamId, season) {
        return `${CACHE_KEYS.STATS}:${teamId}:${season}`;
    }
    // İstatistikler
    getStats() {
        const now = Date.now();
        const keys = Array.from(this.cache.keys());
        const expired = Array.from(this.cache.values())
            .filter(item => now > item.expiresAt)
            .length;
        return {
            size: this.cache.size,
            expired,
            keys,
        };
    }
}
// Cache kullanım örneği:
/*
const cache = Cache.getInstance();

// Veri kaydetme
cache.set('key', data, { duration: 5 * 60 * 1000 }); // 5 dakika

// Veri alma
const data = cache.get('key');

// Maç verisi önbelleğe alma
const matchKey = cache.getMatchKey('2024-01-20', 'Premier League');
cache.set(matchKey, matches);

// Takım verisi önbelleğe alma
const teamKey = cache.getTeamKey('team123');
cache.set(teamKey, teamData);
*/ 
