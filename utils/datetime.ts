/**
 * Centralised date/time conversion for the whole app.
 *
 * The backend stores KSA wall-clock time in one of two shapes:
 *   • ISO `...Z` (e.g. `2026-05-31T22:53:00.000000Z`)
 *   • plain `YYYY-MM-DD HH:mm:ss` (e.g. `2026-06-06 11:43:41`)
 * Both must be read as **UTC wall-clock** — the digits the nurse sees — NOT
 * the device's local timezone. Using `Date#getHours` made the same stored
 * value render differently on every phone (`22:53Z` → `1:53 AM` on UTC+3).
 *
 * All display + API conversions go through this class so the behaviour is
 * identical everywhere.
 */

const pad = (n: number) => String(n).padStart(2, '0')

export type DateInput = string | number | Date | null | undefined

export class DateTimeConverter {
  /** KSA is Arabia Standard Time, UTC+3, no DST. */
  static readonly KSA_OFFSET_MS = 3 * 60 * 60 * 1000

  /**
   * The backend may send either ISO-8601 with `Z` (wall-clock KSA mislabelled
   * UTC) or a plain `YYYY-MM-DD HH:mm:ss` / `YYYY-MM-DDTHH:mm:ss` with no
   * timezone. The latter must be read as UTC wall-clock — the same convention
   * as the `Z` form — not the device local timezone; otherwise a UTC+3 phone
   * shows `8:43` for a stored `11:43` and the elapsed timer is 3h too long.
   */
  static normalize(input: string): string {
    const s = input.trim()
    if (/[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) return s
    const plain = s.match(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)$/,
    )
    if (plain) return `${plain[1]}T${plain[2]}Z`
    return s
  }

  /** Parse anything date-like into a `Date`, or `null` when empty/invalid. */
  static parse(input: DateInput): Date | null {
    if (input == null || input === '') return null
    if (input instanceof Date) {
      return Number.isNaN(input.getTime()) ? null : input
    }
    if (typeof input === 'number') {
      const d = new Date(input)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const d = new Date(this.normalize(input))
    return Number.isNaN(d.getTime()) ? null : d
  }

  /**
   * The **true** epoch-ms of a stored server timestamp. The backend records
   * wall-clock KSA time but labels it UTC (`…Z`), so the real instant is 3h
   * earlier than a literal parse. Use this for elapsed math (`now − start`) so
   * durations match the web view; display still uses the verbatim wall clock
   * via {@link time}/{@link dateTime}.
   */
  static instant(input: DateInput): number | null {
    const d = this.parse(input)
    return d ? d.getTime() - this.KSA_OFFSET_MS : null
  }

  /** `2026-05-31T22:53:00Z` → `"10:53 PM"` (12-hour, UTC wall-clock). */
  static time(input: DateInput): string {
    const d = this.parse(input)
    if (!d) return ''
    let h = d.getUTCHours()
    const m = pad(d.getUTCMinutes())
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
  }

  /** `2026-05-31T22:53:00Z` → `"2026-05-31"`. */
  static date(input: DateInput): string {
    const d = this.parse(input)
    if (!d) return ''
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
  }

  /** `2026-05-31T22:53:00Z` → `"2026-05-31 10:53 PM"`. */
  static dateTime(input: DateInput): string {
    const d = this.parse(input)
    if (!d) return ''
    return `${this.date(d)} ${this.time(d)}`
  }

  /** `"22:53"` (24-hour `HH:mm`) → `"10:53 PM"`. */
  static clock24hTo12h(s: string): string {
    if (!s) return ''
    const [h = '0', m = '00'] = s.split(':')
    let hh = Number(h) || 0
    const ampm = hh >= 12 ? 'PM' : 'AM'
    hh = hh % 12 || 12
    return `${hh}:${pad(Number(m) || 0)} ${ampm}`
  }

  /** `"10:53 PM"` → `"22:53"` (24-hour `HH:mm`, what `DateTimeField` works in). */
  static clock12hTo24h(s: string): string {
    if (!s) return ''
    const m = s.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (!m) return s.length >= 5 ? s.slice(0, 5) : s
    let h = Number(m[1])
    const suffix = m[3]?.toUpperCase()
    if (suffix === 'PM' && h < 12) h += 12
    if (suffix === 'AM' && h === 12) h = 0
    return `${pad(h)}:${m[2]}`
  }

  /** `"10:53 PM"` → `"22:53:00"` — the `H:i:s` format the visit edit-time API wants. */
  static toApiTime(twelveHour: string): string {
    const hhmm = this.clock12hTo24h(twelveHour)
    if (!hhmm) return ''
    const [h = '00', m = '00'] = hhmm.split(':')
    return `${h}:${m}:00`
  }

  /**
   * Format any date-like value as `"YYYY-MM-DD HH:MM:SS"` — the standard
   * datetime format for all API payloads in this project.
   * Defaults to the current time when `input` is null/undefined.
   */
  static toApiDatetime(input?: DateInput): string {
    const d = input != null ? this.parse(input) : null
    const dt = d ?? new Date()
    const date = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
    const time = `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`
    return `${date} ${time}`
  }

  /**
   * Format any date-like value as `"YYYY-MM-DD"` only — for fields that need
   * just the date portion in the API payload.
   */
  static toApiDate(input?: DateInput): string {
    const d = input != null ? this.parse(input) : null
    const dt = d ?? new Date()
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
  }
}
