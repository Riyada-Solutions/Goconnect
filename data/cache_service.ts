import AsyncStorage from '@react-native-async-storage/async-storage'
import { log } from '@/utils/logger'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // milliseconds; 0 = no expiry
}

const CACHE_PREFIX = '@goconnect/cache:'

/**
 * Generic cache service for all API responses.
 * - Online: fetch from API, cache result
 * - Offline: return cached data
 * - TTL support: invalidate stale data
 */
export const cacheService = {
  /**
   * Get cached data. Returns null if not found, expired, or cache error.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
      if (!raw) return null

      const entry: CacheEntry<T> = JSON.parse(raw)
      const isExpired = entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl

      if (isExpired) {
        await this.invalidate(key)
        return null
      }

      return entry.data
    } catch {
      return null
    }
  },

  /**
   * Set cached data with optional TTL.
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time-to-live in milliseconds (0 = never expire)
   */
  async set<T>(key: string, data: T, ttlMs: number = 0): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttlMs,
      }
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
      log(`cache.set(${key})`, { ttlMs })
    } catch {
      // non-fatal — just skip caching if storage fails
    }
  },

  /**
   * Invalidate a cache entry.
   */
  async invalidate(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key)
    } catch {
      // ignore
    }
  },

  /**
   * Clear all cached entries.
   */
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys()
      const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX))
      await AsyncStorage.multiRemove(cacheKeys)
      log('cache.clearAll()', { count: cacheKeys.length })
    } catch {
      // ignore
    }
  },

  /**
   * Rewrite every cached entry whose key starts with `keyPrefix`, in place.
   *
   * Used by offline mutations that need the *persisted* copy to reflect an
   * optimistic change — patching only the React-Query cache would lose it as
   * soon as the screen remounts and re-reads from storage while still offline.
   *
   * The updater receives the stored payload and returns the replacement, or
   * `null`/the same reference to leave that entry untouched. The original
   * timestamp and TTL are preserved so patching doesn't extend cache lifetime.
   */
  async updateMatching<T>(keyPrefix: string, updater: (data: T) => T | null): Promise<void> {
    try {
      const fullPrefix = CACHE_PREFIX + keyPrefix
      const allKeys = await AsyncStorage.getAllKeys()
      const matching = allKeys.filter((k) => k.startsWith(fullPrefix))
      if (matching.length === 0) return

      const pairs = await AsyncStorage.multiGet(matching)
      const writes: [string, string][] = []

      for (const [key, raw] of pairs) {
        if (!raw) continue
        try {
          const entry: CacheEntry<T> = JSON.parse(raw)
          const next = updater(entry.data)
          if (next == null || next === entry.data) continue
          writes.push([key, JSON.stringify({ ...entry, data: next })])
        } catch {
          // skip unparseable entries
        }
      }

      if (writes.length > 0) await AsyncStorage.multiSet(writes)
      log(`cache.updateMatching(${keyPrefix})`, JSON.stringify({ scanned: matching.length, written: writes.length }))
    } catch {
      // non-fatal — an un-patched cache just shows stale data until the next fetch
    }
  },
}
