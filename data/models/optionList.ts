/**
 * Shared option-list coercion.
 *
 * The API is not shape-stable about dropdown sources: the same endpoint can
 * return an array of `{ key, value }` pairs for one field, a bare
 * `{ key: label }` map for the next, and a plain list of strings for a third.
 * Every screen that renders a picker funnels its raw payload through
 * `toOptionList()` so the UI only ever deals with one shape.
 */

export interface OptionItem {
  key: string
  value: string
}

export function toOptionList(raw: any): OptionItem[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    const out: OptionItem[] = []
    for (const item of raw) {
      if (item == null) continue
      if (typeof item === 'object') {
        const key = item.key ?? item.value ?? item.id ?? item.code
        if (key == null) continue
        out.push({ key: String(key), value: String(item.value ?? item.label ?? item.name ?? item.text ?? key) })
      } else {
        out.push({ key: String(item), value: String(item) })
      }
    }
    return out
  }
  if (typeof raw === 'object') {
    return Object.entries(raw).map(([key, label]) => ({
      key: String(key),
      value:
        label != null && typeof label === 'object'
          ? String((label as any).value ?? (label as any).label ?? key)
          : String(label ?? key),
    }))
  }
  return []
}

/** Human label for an option key, falling back to the key itself. */
export function optionLabel(list: any, key: string): string {
  if (!key) return ''
  return toOptionList(list).find((o) => o.key === key)?.value ?? key
}

/** The plain string list behind an option payload (used for free-text fields). */
export function toStringList(raw: any): string[] {
  return toOptionList(raw).map((o) => o.value)
}
