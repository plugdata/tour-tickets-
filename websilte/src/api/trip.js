import { apiFetch } from './config.js'

export function getTrips(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/trips${qs ? '?' + qs : ''}`)
}

export function getTrip(id) {
  return apiFetch(`/trips/${id}`)
}

export function getBusRounds(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/bus-rounds${qs ? '?' + qs : ''}`)
}
