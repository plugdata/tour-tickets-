/**
 * GUGA Travels — i18n Controller
 * Uses: i18next (open-source, https://github.com/i18next/i18next)
 *
 * Auto-detects browser language, stores preference in localStorage.
 * Static elements: use data-i18n="key" attributes.
 * Dynamic API content: use data-i18n-dyn + data-th attributes (handled by translate.js).
 */

import i18next from 'https://cdn.jsdelivr.net/npm/i18next@23.11.5/+esm'
import { resources } from './translations.js'
import { translateElements } from './translate.js'

// ── Detect preferred locale ───────────────────────────────────────────
const stored    = localStorage.getItem('guga_lang')
const browserLg = (navigator.language || 'th').toLowerCase().startsWith('th') ? 'th' : 'en'
const initLng   = stored || browserLg

// ── Init i18next ──────────────────────────────────────────────────────
await i18next.init({
  lng:           initLng,
  fallbackLng:   'th',
  resources,
  interpolation: { escapeValue: false }
})

// ── Apply static translations to DOM ─────────────────────────────────
export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = i18next.t(key)
  })
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html')
    if (key) el.innerHTML = i18next.t(key)
  })
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (key) el.setAttribute('placeholder', i18next.t(key))
  })
  document.documentElement.lang = i18next.language
}

// ── Language switcher ─────────────────────────────────────────────────
export async function toggleLanguage() {
  const next = i18next.language === 'th' ? 'en' : 'th'

  // Fade out while translating
  document.body.style.transition = 'opacity .2s'
  document.body.style.opacity = '0'

  await i18next.changeLanguage(next)
  localStorage.setItem('guga_lang', next)

  applyTranslations()
  updateLangButton()

  // Translate dynamic API content
  await translateElements(next)

  document.body.style.opacity = '1'
}

function updateLangButton() {
  const btn = document.getElementById('langBtn')
  if (btn) btn.innerHTML = `<i class="bi bi-globe"></i> ${i18next.t('nav_lang')}`
}

// ── Export helpers ────────────────────────────────────────────────────
export const getCurrentLang = () => i18next.language

// ── Run on init ───────────────────────────────────────────────────────
function init() {
  applyTranslations()
  updateLangButton()

  const langBtn = document.getElementById('langBtn')
  if (langBtn) {
    langBtn.addEventListener('click', e => { e.preventDefault(); toggleLanguage() })
  }

  // Expose globals for use by other scripts / main.js
  window.toggleLanguage      = toggleLanguage
  window.__applyI18n         = applyTranslations
  window.__getCurrentLang    = getCurrentLang
  window.__translateDynamic  = async () => {
    const lang = getCurrentLang()
    if (lang !== 'th') await translateElements(lang)
  }
}

init()
