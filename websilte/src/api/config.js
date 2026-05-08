// Dynamic API base URL based on current host
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const currentPort = typeof window !== 'undefined' ? window.location.port : ''

  // Vite dev server (port 5173) — ใช้ relative path ให้ Vite proxy จัดการ
  if (currentPort === '5173') {
    return '/api'
  }

  return `http://${currentHost}:5000/api`
}

export const API_BASE = getApiBaseUrl()

export async function apiFetch(path, options = {}) {
  try {
    console.log(`🌐 API Request: ${API_BASE}${path}`)
    const res = await fetch(API_BASE + path, options)
    console.log(`📡 API Response: ${res.status} ${res.statusText}`)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      console.error(`❌ API Error:`, err)
      throw new Error(err.message || `HTTP ${res.status}`)
    }

    const data = await res.json()
    console.log(`✅ API Success:`, data)
    return data
  } catch (error) {
    console.error(`💥 API Fetch Failed:`, error)
    throw error
  }
}
