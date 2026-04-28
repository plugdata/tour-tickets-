import { apiFetch } from './config.js'

let _cache = null

export async function getSettings() {
  if (_cache) return _cache
  try {
    _cache = await apiFetch('/settings')
    return _cache
  } catch (_) {
    return {}
  }
}

export function getSetting(settings, key, fallback = '') {
  return settings[key] ?? fallback
}
