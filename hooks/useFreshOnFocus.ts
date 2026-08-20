import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useNetwork } from '@/context/NetworkContext'

/**
 * Throws away the cached payload of `queryKey` every time the screen gains
 * focus while online, so the screen falls back to its loading state and only
 * ever renders data that came back from this fetch.
 *
 * `resetQueries` — not `invalidateQueries` — is the point: invalidating keeps
 * the previous payload in the cache and refetches behind it, which is exactly
 * the "old numbers first, then they swap" behaviour we're trying to kill.
 * Resetting clears `data` back to undefined and refetches the active query, so
 * `isPending`/`isFetching` drive the skeleton until the new payload lands.
 *
 * Offline focus is deliberately left alone — the cached payload is the only
 * thing we have to show, and the global `refetchOnMount: false` means nothing
 * else would bring it back.
 */
export function useFreshOnFocus(queryKey: QueryKey) {
  const qc = useQueryClient()
  const { isOnline } = useNetwork()
  // Serialize the key so a caller passing an inline array (`['home']`) doesn't
  // hand us a new identity on every render — that would re-run the effect while
  // focused, and each run resets + refetches, i.e. an endless load loop.
  const serializedKey = JSON.stringify(queryKey)

  useFocusEffect(
    useCallback(() => {
      if (!isOnline) return
      void qc.resetQueries({ queryKey: JSON.parse(serializedKey) as QueryKey })
    }, [qc, isOnline, serializedKey])
  )
}
