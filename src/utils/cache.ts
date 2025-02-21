import { PERFORMANCE_CONFIG, CACHE_KEYS } from './constants';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  duration?: number;
  maxSize?: number;
}

export class Cache {
  private static instance: Cache;
  private cache: Map<string, CacheItem<any>>;
  private maxSize: number;

  private constructor() {
    this.cache = new Map();
    this.maxSize = PERFORMANCE_CONFIG.CACHE_SIZE;
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public set<T>(key: string, data: T, options: CacheOptions = {}): void {
    // Mevcut cache boyutunu kontrol et
    if (this.cache.size >= this.maxSize * 0.9) { // %90 doluluk
      this.clearOldCache(); // Eski cache'i temizle
    }
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

  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Süresi dolmuş öğeleri temizle
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
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

  private clearOldCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > 24 * 60 * 60 * 1000) { // 24 saatten eski
        this.cache.delete(key);
      }
    }
  }

  // Yardımcı metodlar
  public getMatchKey(date: string, league?: string): string {
    return `${CACHE_KEYS.MATCHES}:${date}${league ? `:${league}` : ''}`;
  }

  public getTeamKey(teamId: string): string {
    return `${CACHE_KEYS.TEAMS}:${teamId}`;
  }

  public getLeagueKey(leagueId: string): string {
    return `${CACHE_KEYS.LEAGUES}:${leagueId}`;
  }

  public getStatsKey(teamId: string, season: string): string {
    return `${CACHE_KEYS.STATS}:${teamId}:${season}`;
  }

  // İstatistikler
  public getStats(): {
    size: number;
    expired: number;
    keys: string[];
  } {
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