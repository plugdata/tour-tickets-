// Dynamic API base URL based on current host
const getApiBaseUrl = () => {
  // For Vite development, check environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // For production or when environment variable is not set
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

  // If running on production server
  if (currentHost === '154.197.124.146') {
    return 'http://154.197.124.146:5000/api'
  }

  // If running locally or default
  return 'http://localhost:5000/api'
}

export const API_BASE = getApiBaseUrl()

export async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}
