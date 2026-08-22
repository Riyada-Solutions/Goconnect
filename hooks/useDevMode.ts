import { useCallback, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DEV_MODE_KEY = '@goconnect/dev_mode'

/** Consecutive taps on the version label needed to reveal the Developer entry. */
export const TAPS_TO_UNLOCK = 7
/** Taps further apart than this restart the count, so stray taps never add up. */
const TAP_WINDOW_MS = 3000

export interface TapResult {
  /** True on the tap that flipped dev mode on (fires once per unlock). */
  unlocked: boolean
  /** Taps still needed. 0 once unlocked or already on. */
  remaining: number
}

/**
 * Runtime toggle for the hidden Developer screen (`app/(settings)/dev.tsx`).
 *
 * The screen is registered in the settings stack but has no entry point, so it
 * is unreachable in a release build. Tapping the version label
 * {@link TAPS_TO_UNLOCK} times reveals it — the Android "developer options"
 * gesture — and the choice persists so testers only do it once per install.
 */
export function useDevMode() {
  const [enabled, setEnabled] = useState(false)
  const tapCount = useRef(0)
  const lastTapAt = useRef(0)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(DEV_MODE_KEY)
      .then((v) => { if (!cancelled) setEnabled(v === '1') })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const persist = useCallback((next: boolean) => {
    setEnabled(next)
    AsyncStorage.setItem(DEV_MODE_KEY, next ? '1' : '0').catch(() => {
      // non-fatal — the toggle just won't survive a restart
    })
  }, [])

  /** Count one tap on the version label. Returns progress so the caller can
   *  give feedback (haptics, a countdown hint, the unlock dialog). */
  const registerTap = useCallback((): TapResult => {
    if (enabled) return { unlocked: false, remaining: 0 }

    const now = Date.now()
    tapCount.current = now - lastTapAt.current > TAP_WINDOW_MS ? 1 : tapCount.current + 1
    lastTapAt.current = now

    const remaining = TAPS_TO_UNLOCK - tapCount.current
    if (remaining > 0) return { unlocked: false, remaining }

    tapCount.current = 0
    persist(true)
    return { unlocked: true, remaining: 0 }
  }, [enabled, persist])

  const disable = useCallback(() => {
    tapCount.current = 0
    persist(false)
  }, [persist])

  return { enabled, registerTap, disable }
}
