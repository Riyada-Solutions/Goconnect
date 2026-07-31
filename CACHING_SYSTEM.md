# App Caching System

A unified offline-first caching layer for all API requests in GoConnect.

## Architecture

### How It Works

- **Online**: Fetch from API → cache result → return data
- **Offline**: Return cached data → throw error if no cache
- **Network Error**: Fall back to cache if API call fails
- **TTL**: Auto-invalidate stale data after configured time

### Components

1. **`data/cache_service.ts`** — Generic cache storage
   - Get/set/invalidate cache entries
   - TTL support
   - Backed by AsyncStorage

2. **`hooks/useOfflineQuery.ts`** — Hook for single-item queries
   - Drop-in replacement for `useQuery`
   - Automatic caching + offline fallback
   - Example: `useVisit`, `usePatient`, `useLabResults`

3. **`hooks/useOfflineInfiniteQuery.ts`** — Hook for paginated queries
   - Drop-in replacement for `useInfiniteQuery`
   - Caches each page separately
   - Example: `useVisits`, `usePatients`

## Updated Hooks

All read-side queries now use the new caching system:

- ✅ `useVisits` / `useVisit` (visits)
- ✅ `usePatients` / `usePatient` (patients)
- ✅ `useLabResults` (lab results)
- ✅ `useHome` (home dashboard)
- ✅ `useNotifications` / `useUnreadCount` (notifications)
- ✅ `useRules` (permissions)

## Cache Lifecycle

### On Logout
- All caches cleared via `cacheService.clearAll()`
- Ensures stale data doesn't leak to next user

### On Workspace Switch
- Workspace-scoped caches invalidated
- Prevents cross-workspace data mixup
- Clears: visits, slots, patients, home, notifications, lab-results, inventory

## Usage

**Before:**
```typescript
const { data } = useQuery({
  queryKey: ['visits', id],
  queryFn: () => getVisit(id),
  staleTime: 5 * 60 * 1000,
})
```

**After:**
```typescript
const { data } = useOfflineQuery({
  queryKey: ['visits', id],
  queryFn: () => getVisit(id),
  cacheTtl: 5 * 60 * 1000, // TTL in ms
})
```

## TTL Values (Recommendations)

- **Critical data** (patient info, visits): 5 min (300,000 ms)
- **Semi-stable** (home dashboard): 1 min (60,000 ms)
- **Real-time** (unread count): 30 sec (30,000 ms)
- **Never expires**: 0 (zero)

## Mutations & Offline Queue

**Write-side** (mutations) handled by existing system:
- `offlinePost` / `offlinePostMultipart` queue mutations
- React Query cache invalidation on success
- Sync service replays queued items when online

**This caching system** handles read-side only.

## Testing

1. **Online → Offline**: App still shows cached data
2. **Offline → Online**: Fresh data fetches automatically
3. **Network error**: Falls back to cache gracefully
4. **Logout**: Cache cleared, no data leaks
5. **Workspace switch**: Cache invalidated for new context

## Debugging

Cache entries logged with:
```
log(`useOfflineQuery(${cacheKey}) → fresh`, { online: true })
log(`useOfflineQuery(${cacheKey}) → cached (network error)`, { online: true })
```

Check device console for cache hit/miss logs.
