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
