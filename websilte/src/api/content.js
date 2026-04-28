import { apiFetch } from './config.js'

export const ContentType = {
  TRIP_POST:    'TRIP_POST',
  BLOG:         'BLOG',
  FAQ:          'FAQ',
  ABOUT:        'ABOUT',
  SERVICE:      'SERVICE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  EXPERIENCE:   'EXPERIENCE',
  GALLERY:      'GALLERY',
  INQUIRY:      'INQUIRY',
}

export const ContentTypeLabel = {
  TRIP_POST:    'บทความทริป',
  BLOG:         'บล็อก',
  FAQ:          'คำถามที่พบบ่อย',
  ABOUT:        'เกี่ยวกับเรา',
  SERVICE:      'บริการ',
  ANNOUNCEMENT: 'ประกาศ',
  EXPERIENCE:   'แชร์ประสบการณ์',
  GALLERY:      'แกลเลอรี่',
  INQUIRY:      'สอบถาม/ติดต่อ',
}

export function getContents(type = null, extra = {}) {
  const params = new URLSearchParams(extra)
  if (type) params.set('type', type)
  return apiFetch(`/contents?${params}`)
}

export function getContent(id) {
  return apiFetch(`/contents/${id}`)
}

export function submitInquiry(data) {
  return apiFetch('/contents/inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, type: 'INQUIRY', isActive: true }),
  })
}
