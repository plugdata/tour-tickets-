import { apiFetch } from './config.js'

export function getGalleryAlbums(params = {}) {
  const qs = new URLSearchParams(params).toString()
  return apiFetch(`/gallery/albums${qs ? '?' + qs : ''}`)
}

export function getGalleryAlbum(id) {
  return apiFetch(`/gallery/albums/${id}`)
}
