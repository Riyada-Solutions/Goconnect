export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  if (h > 0) return `${h}h ${mm}:${ss}`
  return `${mm}:${ss}`
}

import { DateTimeConverter } from './datetime'

/**
 * Format a `Date` as a 12-hour clock string. Delegates to
 * {@link DateTimeConverter} so it shares the app's UTC-verbatim handling — a
 * stored `…T22:53Z` always reads back as `10:53 PM` regardless of device
 * timezone. Prefer `DateTimeConverter.time(...)` directly for new code.
 */
export function formatClockTime(d: Date): string {
  return DateTimeConverter.time(d)
}

/** "8:00 AM" → "08:00" (24-hour `HH:mm`, the shape `DateTimeField` works in). */
export const clock12hTo24h = (s: string) => DateTimeConverter.clock12hTo24h(s)

/** "9:37 PM" → "21:37:00" — the `H:i:s` format the visit edit-time API expects. */
export const clock12hToApiTime = (s: string) => DateTimeConverter.toApiTime(s)

/** "08:00" (24-hour `HH:mm`) → "8:00 AM". */
export const clock24hTo12h = (s: string) => DateTimeConverter.clock24hTo12h(s)
