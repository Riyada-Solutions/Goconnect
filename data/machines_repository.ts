import { ENV } from '../constants/env'
import { apiClient } from './api_client'
import { type Machine, parseMachine } from './models/machine'

const MACHINES_PER_PAGE = 100
/** Safety cap so a misconfigured server can't trap us in a long fetch loop. */
const MAX_PAGES = 50

interface RawPage {
  items: any[]
  currentPage: number
  lastPage: number
}

/** Read one page and normalize it across the three supported response shapes. */
async function fetchPage(page: number, perPage: number): Promise<RawPage> {
  const res = await apiClient.get('/settings/machines', {
    params: { per_page: perPage, page },
  })
  const body = res.data
  const items: any[] = Array.isArray(body?.data) ? body.data
    : Array.isArray(body) ? body
    : []
  const meta = body?.meta ?? {}
  const currentPage = Number(meta.current_page ?? page)
  const lastPage = Number(meta.last_page ?? currentPage)
  return { items, currentPage, lastPage }
}

/**
 * Fetch the catalog of dialysis machines. Walks the paginator until the last
 * page so the Flow Sheet selector can show every machine in one list.
 *
 * Endpoint: `GET /settings/machines?per_page=100&page=N`
 *
 * Response shapes tolerated per page:
 *  - `{ data: Machine[], meta: { current_page, last_page, ... } }` (Laravel)
 *  - `{ data: Machine[] }`
 *  - `Machine[]`
 */
export async function getMachines(): Promise<Machine[]> {
  if (ENV.USE_MOCK_DATA) return []

  const first = await fetchPage(1, MACHINES_PER_PAGE)
  const allRaw: any[] = [...first.items]

  const totalPages = Math.min(first.lastPage, MAX_PAGES)
  // Fetch pages 2..totalPages in parallel — the catalog is small enough that
  // serial walking would just add latency. parallel calls share the axios
  // interceptor and the user's token.
  if (totalPages > 1) {
    const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
    const rest = await Promise.all(pageNumbers.map(p => fetchPage(p, MACHINES_PER_PAGE)))
    for (const p of rest) allRaw.push(...p.items)
  }

  return allRaw.map(parseMachine).filter((m): m is Machine => m !== null)
}
