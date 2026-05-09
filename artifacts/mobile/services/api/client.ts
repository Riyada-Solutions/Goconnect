// Legacy fetch-based client — kept for backward compatibility.
// New code should use data/api_client.ts (axios-based) instead.
import { ENV } from '../../constants/env'

export const apiClient = {
  baseUrl: ENV.API_BASE_URL,

  async get<T>(endpoint: string, token?: string): Promise<T> {
    const res = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  },

  async post<T>(endpoint: string, body: unknown, token?: string): Promise<T> {
    const res = await fetch(`${ENV.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API Error: ${res.status}`)
    return res.json()
  },
}
