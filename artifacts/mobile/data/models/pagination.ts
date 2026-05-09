export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface Page<T> {
  items: T[]
  meta: PaginationMeta
  hasMore: boolean
}

export const EMPTY_META: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
  from: null,
  to: null,
}

export function parsePage<T>(raw: any, page: number, perPage: number): Page<T> {
  const meta: PaginationMeta = raw?.meta ?? { ...EMPTY_META, current_page: page, per_page: perPage }
  const items: T[] = raw?.data ?? raw ?? []
  return { items, meta, hasMore: meta.current_page < meta.last_page }
}
