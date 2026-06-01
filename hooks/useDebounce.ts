import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms have
 * passed without `value` changing. Each change cancels the previous pending
 * update and schedules a new one — the React equivalent of the Dart
 * `DelayerHelper` (cancel-and-restart a timer per call).
 *
 * Typical use: debounce a search box before it drives a network request.
 *
 *   const debounced = useDebounce(search, 400)
 *   usePatients(debounced)
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer) // cancel the pending update on change/unmount
  }, [value, delay])

  return debounced
}
