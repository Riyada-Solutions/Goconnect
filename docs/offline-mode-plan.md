# GoConnect Offline Mode — Implementation Plan

## Overview

GoConnect is currently a fully online-dependent app — every screen requires an active API connection. This plan describes a phased offline-first upgrade that lets nurses view their visit list, open visit detail, and submit forms even when the clinic network is unavailable. Pending submissions are queued locally and automatically synced when connectivity is restored.

---

## Current Architecture (Baseline)

| Area | Current State |
|------|--------------|
| Data fetching | React Query 5 — 30 s staleTime, no persistence |
| HTTP | Axios, 15 s timeout, no retry |
| Storage | AsyncStorage (token + prefs only) |
| Database | None — everything is in-memory |
| Network detection | None |
| Offline support | None — API failure = blank screen / error |

---

## Goals

1. **Read offline** — nurses can open visits and patient data without a connection, using data cached from the last successful sync.
2. **Write offline (queue)** — form saves, status transitions, and progress notes made while offline are queued locally and replayed in order when connectivity returns.
3. **Transparent UX** — clear indicators when the app is offline, when data is stale, and when a sync is in progress.
4. **No data loss** — queued actions survive app restarts.
5. **Conflict-safe** — the server is the source of truth; conflicts surface a UI prompt rather than silent overwrites.

---

## Scope

### In scope (Phase 1 & 2)
- Visits list (today's date, cached)
- Visit detail (full record: patient, flow sheet, medications, inventory, forms)
- Patients list + patient detail
- All form mutations (flow sheet sections, progress notes, referral, refusal, blood sugar, SARI, incidents, visual triage, allergies, inventory usage)
- Visit lifecycle transitions (start, end procedure, checkout)
- Offline queue with ordered replay

### Out of scope (deferred)
- Lab results (read-only, can be cached but low priority)
- Notifications (real-time, skip)
- Scheduler / appointments (low write frequency, skip Phase 1)
- File / image uploads while offline (complex — defer to Phase 3)
- Signature uploads while offline (defer to Phase 3)

---

## Library Choices

### 1. SQLite via `expo-sqlite` (v14+)
Replaces the current zero-persistence model. The new Expo SQLite API supports `useSQLiteContext()`, WAL mode, and works on iOS + Android with Expo Go.

```bash
npx expo install expo-sqlite
```

Used for:
- Offline mutation queue (ordered, persisted across restarts)

### 2. `@tanstack/react-query-persist-client` + `AsyncStoragePersister`
Keeps the existing React Query layer but adds a persistence adapter so the in-memory cache survives app restarts. This is the quickest win — zero API changes.

```bash
npx expo install @tanstack/react-query-persist-client @tanstack/async-storage-persister
```

### 3. `@react-native-community/netinfo`
Provides real-time network state (connected / not connected, connection type). Used to gate mutations and drive the offline banner.

```bash
npx expo install @react-native-community/netinfo
```

### 4. `expo-background-fetch` + `expo-task-manager`
Runs a background sync task to flush the queue when the app is in the background and connectivity is restored.

```bash
npx expo install expo-background-fetch expo-task-manager
```

---

## Architecture After Implementation

```
┌────────────────────────────────────────────────────────────┐
│                      React Native UI                       │
│   Reads from React Query cache (persisted to AsyncStorage) │
│   Writes go to: Online → API directly                      │
│                 Offline → SQLite queue                     │
└────────────┬───────────────────────────┬───────────────────┘
             │                           │
    ┌────────▼────────┐       ┌──────────▼──────────┐
    │  React Query 5  │       │   Offline Queue      │
    │  + Persist      │       │   (SQLite table)     │
    │  (AsyncStorage) │       │   ordered inserts    │
    └────────┬────────┘       └──────────┬───────────┘
             │                           │
    ┌────────▼───────────────────────────▼───────────┐
    │              Network Layer (Axios)              │
    │  NetInfo gate: skip API call if offline        │
    │  Queue mutations → replay on reconnect         │
    └─────────────────────────────────────────────────┘
```

---

## Phase 1 — Read Offline (Cache Persistence)

**Goal:** Visits list and visit detail pages load from cache when offline.

### 1.1 Add React Query persistence

**File: `app/_layout.tsx`**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: '@goconnect/rq-cache',
  throttleTime: 1000,
});

// Replace <QueryClientProvider> with:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    buster: APP_VERSION,          // invalidate cache on app update
  }}
>
  {children}
</PersistQueryClientProvider>
```

### 1.2 Tune query staleTime and gcTime

**File: `hooks/useVisits.ts`** and **`hooks/usePatients.ts`**

```ts
// Visits list
useInfiniteQuery({
  queryKey: ['visits', date],
  staleTime: 5 * 60 * 1000,        // 5 min (was 30 s)
  gcTime:    24 * 60 * 60 * 1000,  // keep in persisted cache 24 h
  networkMode: 'offlineFirst',
  ...
})

// Visit detail
useQuery({
  queryKey: ['visit', id],
  staleTime: 2 * 60 * 1000,
  gcTime:    24 * 60 * 60 * 1000,
  networkMode: 'offlineFirst',
  refetchOnMount: 'always',         // still try to refresh when online
  ...
})
```

### 1.3 NetInfo context

**New file: `context/NetworkContext.tsx`**

```tsx
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextValue {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({ isOnline: true });

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });
    return unsub;
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
```

Wrap `NetworkProvider` around the app in `app/_layout.tsx`.

### 1.4 Offline banner component

**New file: `components/common/OfflineBanner.tsx`**

```tsx
import { useNetwork } from '@/context/NetworkContext';
import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;
  return (
    <View style={{ backgroundColor: '#F59E0B', padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Feather name="wifi-off" size={14} color="#fff" />
      <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
        You're offline — showing cached data
      </Text>
    </View>
  );
}
```

Add `<OfflineBanner />` to the top of `app/(tabs)/_layout.tsx` and `app/visits/[id].tsx`.

---

## Phase 2 — Write Offline (Mutation Queue)

**Goal:** Form saves and visit transitions made offline are queued locally and replayed when connectivity returns, with no data loss across app restarts.

### 2.1 SQLite queue table

**New file: `data/db.ts`**

```ts
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('goconnect.db');

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      method     TEXT    NOT NULL,  -- 'POST' | 'PATCH' | 'PUT'
      url        TEXT    NOT NULL,  -- e.g. '/visits/123/forms/blood-sugar'
      body       TEXT    NOT NULL,  -- JSON stringified payload
      visit_id   TEXT,              -- for cache invalidation after replay
      retries    INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );
  `);
}
```

Call `initDb()` once during app startup in `app/_layout.tsx`.

### 2.2 Queue helper

**New file: `data/offline_queue.ts`**

```ts
import { db } from './db';

export interface QueuedMutation {
  id: number;
  method: string;
  url: string;
  body: Record<string, unknown>;
  visitId?: string;
  retries: number;
  lastError?: string | null;
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'retries'>): void {
  db.runSync(
    `INSERT INTO offline_queue (method, url, body, visit_id) VALUES (?, ?, ?, ?)`,
    [mutation.method, mutation.url, JSON.stringify(mutation.body), mutation.visitId ?? null],
  );
}

export function peekAll(): QueuedMutation[] {
  const rows = db.getAllSync<any>(`SELECT * FROM offline_queue ORDER BY id ASC`);
  return rows.map((r) => ({ ...r, body: JSON.parse(r.body) }));
}

export function markDone(id: number): void {
  db.runSync(`DELETE FROM offline_queue WHERE id = ?`, [id]);
}

export function markFailed(id: number, error: string): void {
  db.runSync(
    `UPDATE offline_queue SET retries = retries + 1, last_error = ? WHERE id = ?`,
    [error, id],
  );
}

export function clearQueue(): void {
  db.runSync(`DELETE FROM offline_queue`);
}

export function queueCount(): number {
  const row = db.getFirstSync<{ c: number }>(`SELECT COUNT(*) as c FROM offline_queue`);
  return row?.c ?? 0;
}
```

### 2.3 Offline-aware API wrapper

**New file: `data/offline_api.ts`**

```ts
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from './api_client';
import { enqueue } from './offline_queue';

/**
 * Drop-in wrapper for apiClient.post that:
 *   - Sends directly when online
 *   - Enqueues to SQLite when offline and throws OfflineQueuedError
 *     so callers can show a "saved locally" confirmation instead of an error.
 */
export async function offlinePost(
  url: string,
  body: Record<string, unknown>,
  visitId?: string,
): Promise<any> {
  const state = await NetInfo.fetch();
  const online = !!(state.isConnected && state.isInternetReachable);

  if (online) {
    return apiClient.post(url, body);
  }

  enqueue({ method: 'POST', url, body, visitId });
  throw new OfflineQueuedError();
}

export class OfflineQueuedError extends Error {
  readonly queued = true;
  constructor() {
    super('Saved offline — will sync when connected');
    this.name = 'OfflineQueuedError';
  }
}
```

### 2.4 Integrate into visit_repository.ts

Replace `apiClient.post(...)` calls inside every mutation function with `offlinePost(...)`:

```ts
// Before
const res = await apiClient.post(`/visits/${visitId}/forms/blood-sugar`, body);
return unwrapVisit(res.data);

// After
const res = await offlinePost(
  `/visits/${visitId}/forms/blood-sugar`,
  body,
  String(visitId),
);
return unwrapVisit(res.data);
```

Mutations to convert (all in `data/visit_repository.ts`):

| Function | Endpoint |
|----------|----------|
| `submitNursingProgressNote` | `/visits/:id/forms/progress-notes` |
| `submitDoctorProgressNote` | `/visits/:id/forms/progress-notes` |
| `submitSocialWorkerProgressNote` | `/visits/:id/forms/progress-notes` |
| `submitFlowSheetSection` (all sections) | `/visits/:id/forms/flow-sheet` |
| `submitBloodSugarForm` | `/visits/:id/forms/blood-sugar` |
| `submitAllergiesForm` | `/visits/:id/forms/allergies` |
| `submitSariScreening` | `/visits/:id/forms/sari-screening` |
| `submitMorseFallsRiskAssessment` | `/visits/:id/forms/morse-falls` |
| `submitReferral` | `/visits/:id/forms/referral` |
| `submitRefusal` | `/visits/:id/forms/refusal` |
| `submitSocialAssessmentForm` | `/visits/:id/forms/social-assessment` |
| `submitIncidentsForm` | `/visits/:id/forms/incidents` |
| `submitVisualTriageChecklist` | `/visits/:id/forms/visual-triage` |
| `submitMedicationAdministration` | `/visits/:id/medications/:medId` |
| `submitInventoryUsage` | `/patient-inventory/use` |
| `startVisit` | `/visits/:id/start` |
| `endVisit` | `/visits/:id/end` |
| `checkoutVisit` | `/visits/:id/checkout` |

### 2.5 Handle OfflineQueuedError in mutation callbacks

**File: `app/visits/[id].tsx`** — update every `onError` callback:

```ts
import { OfflineQueuedError } from '@/data/offline_api';

// Pattern for every form onError:
onError: (err: unknown) => {
  if (err instanceof OfflineQueuedError) {
    showDialog({
      variant: 'info',
      title: 'Saved Offline',
      message: 'Your changes are saved locally and will sync automatically when you reconnect.',
    });
    return;
  }
  showDialog({
    variant: 'error',
    title: t('error'),
    message: err instanceof Error ? err.message : t('error'),
  });
},
```

### 2.6 Sync service

**New file: `services/SyncService.ts`**

```ts
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from '@/data/api_client';
import { peekAll, markDone, markFailed } from '@/data/offline_queue';
import { queryClient } from '@/data/query_client';

const MAX_RETRIES = 5;

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const pending = peekAll();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  const state = await NetInfo.fetch();
  if (!state.isConnected || !state.isInternetReachable) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;
  const invalidateVisitIds = new Set<string>();

  for (const item of pending) {
    if (item.retries >= MAX_RETRIES) {
      failed++;
      continue; // skip permanently failed items
    }
    try {
      await apiClient({ method: item.method, url: item.url, data: item.body });
      markDone(item.id);
      synced++;
      if (item.visitId) invalidateVisitIds.add(item.visitId);
    } catch (e: any) {
      markFailed(item.id, e?.message ?? 'Unknown error');
      failed++;
      break; // stop on first failure to preserve ordering
    }
  }

  // Invalidate affected visit caches so UI refreshes after sync
  for (const visitId of invalidateVisitIds) {
    queryClient.invalidateQueries({ queryKey: ['visit', visitId] });
  }

  return { synced, failed };
}
```

### 2.7 Trigger sync on reconnect

**File: `context/NetworkContext.tsx`** — extend to call sync on transition to online:

```tsx
import { flushQueue } from '@/services/SyncService';

useEffect(() => {
  let wasOnline = true;
  const unsub = NetInfo.addEventListener(async (state) => {
    const online = !!(state.isConnected && state.isInternetReachable);
    setIsOnline(online);
    // Flush only on transition from offline → online
    if (online && !wasOnline) {
      const result = await flushQueue();
      if (result.synced > 0) {
        console.log(`[Sync] Flushed ${result.synced} queued mutations`);
      }
    }
    wasOnline = online;
  });
  return unsub;
}, []);
```

### 2.8 Clear queue on logout

**File: `context/AppContext.tsx`** — inside `logout()`:

```ts
import { clearQueue } from '@/data/offline_queue';

async function logout() {
  clearQueue();                   // discard unsent changes
  await authRepository.logout();
  await AsyncStorage.removeItem('access_token');
  queryClient.clear();
  setUser(null);
  setToken(null);
}
```

### 2.9 Background sync task

**New file: `services/BackgroundSyncTask.ts`**

```ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { flushQueue } from './SyncService';

const TASK_NAME = 'GOCONNECT_BACKGROUND_SYNC';

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const { synced } = await flushQueue();
    return synced > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

Call `registerBackgroundSync()` in `app/_layout.tsx` after `initDb()`.

---

## Phase 3 — Conflict Resolution & Deep Offline (Deferred)

These are planned but not part of the initial rollout:

### 3.1 Conflict detection
When the sync service replays a queued mutation, the server may return a 409 Conflict (e.g., another nurse already submitted the same form section). The sync service should:
1. Surface a `ConflictResolutionSheet` to the nurse showing both versions.
2. Allow "Keep mine" (re-submit) or "Discard mine" (pull fresh from server).
3. Store the conflicted item in a separate `sync_conflicts` SQLite table for audit.

### 3.2 Signature + file upload queue
Currently `offlinePost` skips uploads when offline. Phase 3 adds:
- Store file URIs in a `pending_uploads` SQLite table.
- On reconnect, upload files first, obtain server URLs, then replay the form mutation with the real URL.

### 3.3 Selective background data prefetch
When the nurse logs in or the app foregrounds, proactively fetch and cache:
- Today's visit list
- All visit detail records for today
- Patient records for those visits
- Medications and inventory per visit

This ensures the cache is warm before the nurse goes on a home visit.

---

## File Map — New and Modified Files

### New files

| File | Purpose |
|------|---------|
| `context/NetworkContext.tsx` | NetInfo subscription, online/offline state, flush-on-reconnect |
| `components/common/OfflineBanner.tsx` | Yellow banner shown when offline |
| `data/db.ts` | SQLite database singleton + `initDb()` |
| `data/offline_queue.ts` | `enqueue` / `markDone` / `markFailed` / `peekAll` helpers |
| `data/offline_api.ts` | `offlinePost()` wrapper + `OfflineQueuedError` class |
| `services/SyncService.ts` | `flushQueue()` — ordered replay of queue against API |
| `services/BackgroundSyncTask.ts` | Expo background fetch task registration |

### Modified files

| File | Change |
|------|--------|
| `app/_layout.tsx` | Wrap with `PersistQueryClientProvider` + `NetworkProvider`; call `initDb()` + `registerBackgroundSync()` |
| `data/visit_repository.ts` | Replace `apiClient.post()` in all mutations with `offlinePost()` |
| `hooks/useVisits.ts` | Increase `staleTime` to 5 min, set `gcTime` to 24 h, add `networkMode: 'offlineFirst'` |
| `hooks/usePatients.ts` | Same staleTime / gcTime / networkMode changes |
| `app/visits/[id].tsx` | Handle `OfflineQueuedError` in all mutation `onError` callbacks |
| `app/(tabs)/_layout.tsx` | Add `<OfflineBanner />` |
| `context/AppContext.tsx` | Call `clearQueue()` in `logout()` |

---

## Implementation Order (Sprint Plan)

### Sprint 1 — Read Offline (3–4 days)
1. Install `@tanstack/react-query-persist-client`, `@tanstack/async-storage-persister`, `@react-native-community/netinfo`
2. Wire `PersistQueryClientProvider` in `_layout.tsx`
3. Increase staleTime / gcTime in all queries; add `networkMode: 'offlineFirst'`
4. Build `NetworkContext` and `OfflineBanner`
5. **Test:** kill wifi → navigate visits → data visible from cache

### Sprint 2 — Write Queue (4–5 days)
1. Install `expo-sqlite`, `expo-background-fetch`, `expo-task-manager`
2. Create `data/db.ts`; call `initDb()` on startup
3. Build `data/offline_queue.ts`
4. Build `data/offline_api.ts` with `offlinePost()`
5. Replace `apiClient.post()` in all mutation functions in `visit_repository.ts`
6. Update all `onError` handlers in `app/visits/[id].tsx`
7. Build `SyncService.ts`; wire flush into `NetworkContext` on reconnect
8. Wire `clearQueue()` into logout
9. Register background sync task
10. **Test:** fill blood sugar form offline → reconnect → verify server received data

### Sprint 3 — Polish & Edge Cases (2–3 days)
1. Show pending queue count badge / indicator in settings screen
2. "Pending changes: N items" row with manual "Sync Now" button in settings
3. Handle permanently failed mutations (retries ≥ 5): surface to nurse with retry/discard option
4. Write E2E tests: offline form submit → reconnect → server verified

---

## Testing Checklist

- [ ] App loads visit list from cache with airplane mode on
- [ ] Visit detail opens from cache with airplane mode on
- [ ] Patient detail opens from cache
- [ ] Blood sugar form saves offline, queued item appears in SQLite
- [ ] Reconnecting triggers `flushQueue()` automatically
- [ ] Flushed mutation invalidates the correct visit query (UI refreshes)
- [ ] `OfflineQueuedError` shows "Saved Offline" dialog (not error dialog)
- [ ] Queue survives app kill and restart (SQLite persistence)
- [ ] Items with 5+ retries are skipped by the flush loop
- [ ] Logout clears the queue entirely
- [ ] App version bump invalidates persisted React Query cache (`buster`)
- [ ] `OfflineBanner` appears and disappears correctly as network changes
- [ ] Background sync fires when app is backgrounded and network returns

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| API shape mismatch after queue replay | Low | Queue stores raw payloads exactly as sent; same as live path |
| Queue grows unbounded if never online | Low | Max retries = 5; items permanently failed are skipped |
| SQLite unavailable on web | Medium | Web is not a supported target; feature-detect and disable queue on web |
| Background task disabled by OS (battery optimisation) | Medium | Foreground sync on reconnect is the primary path; background is a bonus |
| Token expiry while offline | Medium | On reconnect, if 401 received during flush, pause queue, trigger re-auth, then continue |
| Two nurses editing the same visit offline | Low (role-based access limits this) | Phase 3 conflict detection; Phase 1–2 accept last-write-wins from server |

---

## Dependencies to Install

```bash
# Phase 1
npx expo install @tanstack/react-query-persist-client
npx expo install @tanstack/async-storage-persister
npx expo install @react-native-community/netinfo

# Phase 2
npx expo install expo-sqlite
npx expo install expo-background-fetch
npx expo install expo-task-manager
```

All packages above are available in Expo Go and the managed workflow — no custom dev client required.

---

*Last updated: 2026-06-28*
