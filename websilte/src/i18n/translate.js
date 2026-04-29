/**
 * Dynamic content translation utility
 * Uses MyMemory free API (https://mymemory.translated.net)
 * Results are cached in sessionStorage to avoid repeated API calls
 */

const _mem = new Map()
const STORE_PFX = 'gt_'

function load(k) {
  try { return sessionStorage.getItem(STORE_PFX + k) } catch { return null }
}
function save(k, v) {
  try { sessionStorage.setItem(STORE_PFX + k, v) } catch {}
}

async function apiTranslate(text, from, to) {
  const k = `${from}:${to}:${text}`
  if (_mem.has(k)) return _mem.get(k)
  const stored = load(k)
  if (stored !== null) { _mem.set(k, stored); return stored }

  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 6000)
    const r = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${from}|${to}`,
      { signal: controller.signal }
    )
    clearTimeout(tid)
    const d = await r.json()
    const result = (d.responseStatus === 200 && d.responseData?.translatedText)
      ? d.responseData.translatedText
      : text
    _mem.set(k, result)
    save(k, result)
    return result
  } catch {
    return text
  }
}

/**
 * Translate all [data-i18n-dyn] elements in the DOM.
 * - Elements with data-en get that value directly (no API call needed)
 * - Elements with data-th get that as the Thai source text
 * - When restoring to TH, uses data-th attribute
 */
export async function translateElements(lang) {
  const els = [...document.querySelectorAll('[data-i18n-dyn]')]
  if (!els.length) return

  if (lang === 'th') {
    els.forEach(el => {
      const th = el.getAttribute('data-th')
      if (th !== null) el.textContent = th
    })
    return
  }

  // Translate to EN — run in parallel for speed
  await Promise.all(els.map(async el => {
    // Pre-computed EN value (e.g. date strings) — use directly
    const preEn = el.getAttribute('data-en')
    if (preEn !== null) { el.textContent = preEn; return }

    const th = el.getAttribute('data-th') ?? el.textContent.trim()
    if (!el.hasAttribute('data-th')) el.setAttribute('data-th', th)
    if (!th) return

    const en = await apiTranslate(th, 'th', 'en')
    el.textContent = en
  }))
}
