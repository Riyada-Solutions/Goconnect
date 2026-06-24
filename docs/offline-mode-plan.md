# Offline Mode — Implementation Plan

## Scope

- Read cached data (home, patients, visits, schedule) when offline
- Queue write actions when offline and sync on reconnect
- Queue persists across app restarts (AsyncStorage)

## Affected Mutations

- Start visit / End visit
- Flow-sheet form submissions (all sections)
- Nursing / Doctor / Social worker progress notes

---

## Files to Create

| File | Purpose |
|------|---------|
| `utils/network.ts` | NetInfo wrapper, exposes `isOnline` |
| `data/offline_queue.ts` | AsyncStorage-backed queue (id, type, payload, timestamp, retries) |
| `hooks/useNetworkStatus.ts` | Reactive hook, triggers sync on reconnect |
| `hooks/useOfflineMutation.ts` | Drop-in replacement for `useMutation`; queues when offline, executes when online |
| `hooks/useOfflineSync.ts` | Processes queue in order when connectivity returns |
| `components/common/OfflineBanner.tsx` | Thin red bar shown when offline |

## Files to Modify

| File | Change |
|------|--------|
| `app/_layout.tsx` | Mount `useOfflineSync`, wrap with `OfflineBanner`, set QueryClient `networkMode: 'offlineFirst'` |
| `hooks/useVisits.ts` | Use `useOfflineMutation` for start/end visit |
| `app/visits/components/visitForms/FlowSheetForm.tsx` | Use `useOfflineMutation` for submissions |
| `app/visits/components/visitForms/NursingProgressNoteForm.tsx` | Use `useOfflineMutation` |
| `app/visits/components/visitForms/DoctorProgressNoteForm.tsx` | Use `useOfflineMutation` |
| `app/visits/components/visitForms/SocialWorkerProgressNoteForm.tsx` | Use `useOfflineMutation` |

---

## Queue Item Shape

```typescript
interface QueuedAction {
  id: string           // uuid
  type: string         // e.g. 'start_visit', 'submit_flow_sheet', 'nursing_note'
  endpoint: string     // e.g. '/visits/123/start'
  method: 'POST' | 'PUT' | 'PATCH'
  payload: unknown
  timestamp: number    // Date.now() when queued
  retries: number      // incremented on failure, dropped after 3
}
```

## Queue Behavior

- Persists in AsyncStorage under key `@goconnect/offline_queue`
- On reconnect: items replayed in insertion order, one at a time
- Success → item removed from queue immediately
- Failure (non-2xx) → retry counter incremented; dropped after 3 failures with a FeedbackDialog error
- Optimistic update applied immediately in UI when action is queued

## QueryClient Config Change

```typescript
// app/_layout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 60_000,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
})
```

## OfflineBanner

- Shown at top of screen when `isOnline === false`
- Shows count of pending queued actions
- Disappears automatically when connectivity is restored

---

## Notes

- `@react-native-community/netinfo` is the network detection library (check if already installed before adding)
- The queue must be drained in order — parallel replay risks race conditions on the backend
- Progress note forms already have a `ReadOnlyBanner` — check that offline queuing does not conflict with the read-only state logic
