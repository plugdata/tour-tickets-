/**
 * GUGA Travels — i18n Controller
 * Source of truth: /public/i18n/{lang}.json (managed by Tolgee)
 * ไม่มี CDN dependency — static JSON + MyMemory สำหรับ dynamic content
 *
 * Workflow:
 *   1. เพิ่ม key ใน public/i18n/th.json (ภาษาไทยเท่านั้น)
 *   2. npm run i18n:push  → upload ขึ้น Tolgee
 *   3. Tolgee AI แปล → npm run i18n:pull → ได้ en.json กลับมา
 */

import { translateElements } from './translate.js'

const STORAGE_KEY = 'guga_lang'
const DEFAULT_LANG = 'th'
const SUPPORTED = ['th', 'en']

// ── State ─────────────────────────────────────────────────────────────
const stored    = localStorage.getItem(STORAGE_KEY)
const browserLg = (navigator.language || 'th').toLowerCase().startsWith('th') ? 'th' : 'en'
let _lang = stored || browserLg
let _dict = {}

// ── Load JSON from /i18n/ ─────────────────────────────────────────────
async function loadDict(lang) {
  try {
    const res = await fetch(`/i18n/${lang}.json`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return lang !== DEFAULT_LANG ? loadDict(DEFAULT_LANG) : {}
  }
}

// ── Apply [data-i18n] to DOM ──────────────────────────────────────────
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    const val = _dict[key]
    if (!val) return
    el.textContent = val
  })
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html')
    const val = _dict[key]
    if (val) el.innerHTML = val
  })
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')
    const val = _dict[key]
    if (val) el.setAttribute('placeholder', val)
  })
  document.documentElement.lang = _lang
}

/** แปล key → text (ใช้ใน JS ที่ต้องการ string) */
export function t(key, fallback = key) {
  return _dict[key] ?? fallback
}

export const getCurrentLang = () => _lang

// ── Language switcher ─────────────────────────────────────────────────
export async function toggleLanguage() {
  const next = _lang === 'th' ? 'en' : 'th'
  if (!SUPPORTED.includes(next)) return

  document.body.style.transition = 'opacity .2s'
  document.body.style.opacity = '0'

  _lang = next
  localStorage.setItem(STORAGE_KEY, next)
  _dict = await loadDict(next)

  applyTranslations()
  updateLangButton()
  await translateElements(next)

  document.body.style.opacity = '1'
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: next } }))
}

function updateLangButton() {
  const btn = document.getElementById('langBtn')
  if (btn) btn.innerHTML = `<i class="bi bi-globe"></i> ${_dict['nav_lang'] ?? 'EN'}`
}

// ── Init ──────────────────────────────────────────────────────────────
_dict = await loadDict(_lang)
applyTranslations()
updateLangButton()

const langBtn = document.getElementById('langBtn')
if (langBtn) langBtn.addEventListener('click', e => { e.preventDefault(); toggleLanguage() })

// Expose globals (compat กับ main.js + components เดิม)
window.toggleLanguage     = toggleLanguage
window.__t                = t
window.__applyI18n        = () => applyTranslations()
window.__getCurrentLang   = getCurrentLang
window.__translateDynamic = async () => {
  if (_lang !== 'th') await translateElements(_lang)
}
