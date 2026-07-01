import { Platform } from 'react-native'
import { db } from './db'

export interface QueuedMutation {
  id: number
  method: string
  url: string
  body: Record<string, unknown>
  visitId?: string
  retries: number
  lastError?: string | null
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'retries'>): void {
  if (Platform.OS === 'web' || !db) return
  db.runSync(
    `INSERT INTO offline_queue (method, url, body, visit_id) VALUES (?, ?, ?, ?)`,
    [mutation.method, mutation.url, JSON.stringify(mutation.body), mutation.visitId ?? null],
  )
}

export function peekAll(): QueuedMutation[] {
  if (Platform.OS === 'web' || !db) return []
  const rows = db.getAllSync<any>(`SELECT * FROM offline_queue ORDER BY id ASC`)
  return rows.map((r) => ({
    id:        r.id,
    method:    r.method,
    url:       r.url,
    body:      JSON.parse(r.body),
    visitId:   r.visit_id ?? undefined,
    retries:   r.retries,
    lastError: r.last_error ?? null,
  }))
}

export function markDone(id: number): void {
  if (Platform.OS === 'web' || !db) return
  db.runSync(`DELETE FROM offline_queue WHERE id = ?`, [id])
}

export function markFailed(id: number, error: string): void {
  if (Platform.OS === 'web' || !db) return
  db.runSync(
    `UPDATE offline_queue SET retries = retries + 1, last_error = ? WHERE id = ?`,
    [error, id],
  )
}

export function clearQueue(): void {
  if (Platform.OS === 'web' || !db) return
  db.runSync(`DELETE FROM offline_queue`)
}

export function queueCount(): number {
  if (Platform.OS === 'web' || !db) return 0
  const row = db.getFirstSync<{ c: number }>(`SELECT COUNT(*) as c FROM offline_queue`)
  return row?.c ?? 0
}
