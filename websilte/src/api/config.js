export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}
