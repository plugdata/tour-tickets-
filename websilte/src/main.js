// GUGA Travels - Main Entry Point
import './assets/css/style.css'
import { initFAQ } from './components/faq.js'
import { initCookieNotice } from './components/cookie.js'
import { initNavbar } from './components/navbar.js'
import { loadHomepage } from './pages/home/loader.js'

import { initSwipers } from './components/swiper.js'

window.__initFAQ = initFAQ
window.__initSwipers = initSwipers

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar()
  initCookieNotice()
  window.__initHomeSectionNav?.()
  await loadHomepage()
  window.__refreshHomeNav?.()
  initSwipers()
  initFAQ()
  // Re-apply static i18n keys, then translate dynamic API content
  window.__applyI18n?.()
  await window.__translateDynamic?.()
})
