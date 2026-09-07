import AsyncStorage from "@react-native-async-storage/async-storage";
import { log } from "@/utils/logger";

export interface VisitCacheEntry {
  visitId: number;
  slotId: number | null;
  patientId: number;

  // Raw payloads (stored as JSON)
  visit: Record<string, any>; // Full visit response from GET /visits/{id}
  slot: Record<string, any> | null; // Slot if opened from appointment
  patient: Record<string, any>; // Patient details for offline access

  // Rules: cached globally, keyed once per session
  rules: string[]; // Array of rule strings

  // Metadata
  cachedAt: number; // milliseconds since epoch
  userId: number; // User who cached this (logout = invalidate all)
  appVersion: string; // Invalidate on app upgrade if schema changes

  // Optional detailed sub-caches (if prefetch succeeded)
  inventory: Record<string, any> | null;
  medicationAdministration: Record<string, any> | null;
  dialysisOrders: Record<string, any> | null;

  // Completeness flags
  isFull: boolean; // true = all prefetch calls succeeded; false = partial
  prefetchErrors?: Record<string, string>;
}

export interface VisitMutationQueueItem {
  id: string; // UUID
  visitId: number;
  operationType: string; // e.g., "submit_flow_sheet"
  endpoint: string; // e.g., "/visits/{id}/forms/flowsheet"
  method: "POST" | "PUT" | "PATCH";
  payload: Record<string, any>;
  idempotencyKey: string; // UUID
  createdAt: number;
  appliedToCache: boolean; // true = optimistic update done
  retries: number;
  lastError?: string;
  syncedAt?: number;
}

export interface VisitCacheRepository {
  // Prefetch on check-in
  prefetchVisitData(
    slotId: number | null,
    visitId: number,
    userId: number,
    permissions: Record<string, boolean>,
  ): Promise<{ success: boolean; errors?: Record<string, string> }>;

  // Offline-first reads
  getVisitFromCache(visitId: number): Promise<VisitCacheEntry | null>;
  getCachedRules(): Promise<string[] | null>;

  // Local cache updates (for optimistic UX)
  updateVisitCache(
    visitId: number,
    updates: Partial<Record<string, any>>,
  ): Promise<void>;
  updateCachedRules(rules: string[]): Promise<void>;

  // Queue management
  queueMutation(
    mutation: Omit<VisitMutationQueueItem, "id" | "createdAt">,
  ): Promise<string>; // returns id
  getMutationQueue(visitId: number): Promise<VisitMutationQueueItem[]>;
  markMutationSynced(
    mutationId: string,
    serverResponse: Record<string, any>,
  ): Promise<void>;
  clearMutationQueue(visitId: number): Promise<void>;

  // Lifecycle
  invalidateVisitCache(visitId: number): Promise<void>;
  invalidateAllCaches(): Promise<void>; // On logout, user switch
  clearExpiredCaches(ttlMs?: number): Promise<void>;
}

const VISIT_CACHE_PREFIX = "@goconnect/visit-cache:";
const RULES_CACHE_KEY = "@goconnect/rules";
const DEFAULT_OFFLINE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class VisitOfflineCacheService implements VisitCacheRepository {
  async prefetchVisitData(
    slotId: number | null,
    visitId: number,
    userId: number,
    permissions: Record<string, boolean>,
  ): Promise<{ success: boolean; errors?: Record<string, string> }> {
    try {
      log("[VisitOfflineCache]", `Prefetching visit ${visitId}`);

      // TODO: Will be called by usePrefetchVisitData hook
      // For now, just return success placeholder
      return { success: true };
    } catch (error) {
      log("[VisitOfflineCache]", `Prefetch error: ${error}`);
      return {
        success: false,
        errors: { prefetch: String(error) },
      };
    }
  }

  async getVisitFromCache(visitId: number): Promise<VisitCacheEntry | null> {
    try {
      const key = `${VISIT_CACHE_PREFIX}${visitId}`;
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry = JSON.parse(raw) as VisitCacheEntry;

      // Check if cache is expired
      const age = Date.now() - entry.cachedAt;
      if (age > DEFAULT_OFFLINE_TTL) {
        log("[VisitOfflineCache]", `Visit ${visitId} cache expired`);
        await AsyncStorage.removeItem(key);
        return null;
      }

      return entry;
    } catch (error) {
      log("[VisitOfflineCache]", `Error reading visit cache: ${error}`);
      return null;
    }
  }

  async getCachedRules(): Promise<string[] | null> {
    try {
      const raw = await AsyncStorage.getItem(RULES_CACHE_KEY);
      if (!raw) return null;

      const data = JSON.parse(raw) as {
        rules: string[];
        cachedAt: number;
      };

      const age = Date.now() - data.cachedAt;
      if (age > DEFAULT_OFFLINE_TTL) {
        log("[VisitOfflineCache]", "Rules cache expired");
        await AsyncStorage.removeItem(RULES_CACHE_KEY);
        return null;
      }

      return data.rules;
    } catch (error) {
      log("[VisitOfflineCache]", `Error reading rules cache: ${error}`);
      return null;
    }
  }

  async updateVisitCache(
    visitId: number,
    updates: Partial<Record<string, any>>,
  ): Promise<void> {
    try {
      const key = `${VISIT_CACHE_PREFIX}${visitId}`;
      const existing = await this.getVisitFromCache(visitId);

      if (!existing) {
        log("[VisitOfflineCache]", `No existing cache for visit ${visitId}`);
        return;
      }

      const updated: VisitCacheEntry = {
        ...existing,
        visit: {
          ...existing.visit,
          ...updates,
        },
        cachedAt: Date.now(),
      };

      await AsyncStorage.setItem(key, JSON.stringify(updated));
      log("[VisitOfflineCache]", `Updated visit ${visitId} cache`);
    } catch (error) {
      log("[VisitOfflineCache]", `Error updating visit cache: ${error}`);
    }
  }

  async updateCachedRules(rules: string[]): Promise<void> {
    try {
      const data = {
        rules,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(RULES_CACHE_KEY, JSON.stringify(data));
      log("[VisitOfflineCache]", "Updated rules cache");
    } catch (error) {
      log("[VisitOfflineCache]", `Error updating rules cache: ${error}`);
    }
  }

  async queueMutation(
    mutation: Omit<VisitMutationQueueItem, "id" | "createdAt">,
  ): Promise<string> {
    const id = generateUUID();
    const item: VisitMutationQueueItem = {
      ...mutation,
      id,
      createdAt: Date.now(),
    };

    // TODO: Store in SQLite via offline_queue.ts
    log(
      "[VisitOfflineCache]",
      `Queued mutation ${id} for visit ${mutation.visitId}`,
    );

    return id;
  }

  async getMutationQueue(visitId: number): Promise<VisitMutationQueueItem[]> {
    // TODO: Read from SQLite via offline_queue.ts
    return [];
  }

  async markMutationSynced(
    mutationId: string,
    serverResponse: Record<string, any>,
  ): Promise<void> {
    // TODO: Update SQLite queue item, merge response into cache
    log("[VisitOfflineCache]", `Marked mutation ${mutationId} as synced`);
  }

  async clearMutationQueue(visitId: number): Promise<void> {
    // TODO: Clear from SQLite
    log("[VisitOfflineCache]", `Cleared mutation queue for visit ${visitId}`);
  }

  async invalidateVisitCache(visitId: number): Promise<void> {
    try {
      const key = `${VISIT_CACHE_PREFIX}${visitId}`;
      await AsyncStorage.removeItem(key);
      log("[VisitOfflineCache]", `Invalidated visit ${visitId} cache`);
    } catch (error) {
      log("[VisitOfflineCache]", `Error invalidating cache: ${error}`);
    }
  }

  async invalidateAllCaches(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const visitCacheKeys = keys.filter((k) =>
        k.startsWith(VISIT_CACHE_PREFIX),
      );
      const allKeysToRemove = [...visitCacheKeys, RULES_CACHE_KEY];
      await AsyncStorage.multiRemove(allKeysToRemove);
      log("[VisitOfflineCache]", "Invalidated all caches");
    } catch (error) {
      log("[VisitOfflineCache]", `Error invalidating all caches: ${error}`);
    }
  }

  async clearExpiredCaches(ttlMs?: number): Promise<void> {
    try {
      const ttl = ttlMs ?? DEFAULT_OFFLINE_TTL;
      const keys = await AsyncStorage.getAllKeys();
      const visitCacheKeys = keys.filter((k) =>
        k.startsWith(VISIT_CACHE_PREFIX),
      );

      const expired: string[] = [];
      for (const key of visitCacheKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const entry = JSON.parse(raw) as VisitCacheEntry;
          const age = Date.now() - entry.cachedAt;
          if (age > ttl) {
            expired.push(key);
          }
        }
      }

      if (expired.length > 0) {
        await AsyncStorage.multiRemove(expired);
        log(
          "[VisitOfflineCache]",
          `Cleared ${expired.length} expired cache entries`,
        );
      }
    } catch (error) {
      log("[VisitOfflineCache]", `Error clearing expired caches: ${error}`);
    }
  }
}

export const visitCacheRepository = new VisitOfflineCacheService();
