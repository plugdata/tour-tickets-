/**
 * GUGA Travels — i18n Controller
 * Uses: i18next (open-source, https://github.com/i18next/i18next)
 *       with ICU-compatible message format (same spec used by Google Closure & Angular i18n)
 *
 * Auto-detects browser language, stores preference in localStorage.
 * Apply translations via data-i18n="key" attributes on HTML elements.
 */

import i18next from 'https://cdn.jsdelivr.net/npm/i18next@23.11.5/+esm'
import { resources } from './translations.js'

// ── Detect preferred locale ───────────────────────────────────────────
const stored    = localStorage.getItem('guga_lang')
const browserLg = (navigator.language || 'th').toLowerCase().startsWith('th') ? 'th' : 'en'
const initLng   = stored || browserLg

// ── Init i18next ──────────────────────────────────────────────────────
await i18next.init({
  lng:              initLng,
  fallbackLng:      'th',
  resources,
  interpolation:    { escapeValue: false }
})

// ── Apply translations to DOM ─────────────────────────────────────────
export function applyTranslations() {
  // Simple text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = i18next.t(key)
  })

  // HTML content (use data-i18n-html for rich text)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html')
    if (key) el.innerHTML = i18next.t(key)
  })

  // Placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')
    if (key) el.setAttribute('placeholder', i18next.t(key))
  })

  // Update html lang attribute
  document.documentElement.lang = i18next.language
}

// ── Language switcher ─────────────────────────────────────────────────
export function toggleLanguage() {
  const next = i18next.language === 'th' ? 'en' : 'th'
  i18next.changeLanguage(next).then(() => {
    localStorage.setItem('guga_lang', next)
    applyTranslations()
    updateLangButton()

    // Animate page fade for smooth UX
    document.body.style.opacity = '0'
    document.body.style.transition = 'opacity .18s'
    requestAnimationFrame(() => {
      document.body.style.opacity = '1'
    })
  })
}

function updateLangButton() {
  const btn = document.getElementById('langBtn')
  if (btn) btn.innerHTML = `<i class="bi bi-globe"></i> ${i18next.t('nav_lang')}`
}

// ── Export current lang helper ────────────────────────────────────────
export const getCurrentLang = () => i18next.language

// ── Run on init ───────────────────────────────────────────────────────
function init() {
  applyTranslations()
  updateLangButton()
  
  // Attach event listener instead of relying on global onclick
  const langBtn = document.getElementById('langBtn')
  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.preventDefault()
      toggleLanguage()
    })
  }

  // Also expose globally as a fallback
  window.toggleLanguage = toggleLanguage
}

// Ensure init runs after DOM and await
init()
