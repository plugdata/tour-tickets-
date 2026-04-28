// GUGA Travels - Main Entry Point
import './assets/css/style.css'
import { initFAQ } from './components/faq.js'
import { initCookieNotice } from './components/cookie.js'
import { initNavbar } from './components/navbar.js'
import { loadHomepage } from './pages/home/loader.js'

window.__initFAQ = initFAQ

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar()
  initCookieNotice()
  await loadHomepage()
  initFAQ()
})
