import Lenis from 'lenis'

let lenis

export function initLenis() {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 1.5,
    mouseMultiplier: 1,
  })

  // Chrome/Edge บล็อก window.scrollTo() ก่อน document มี focus
  // (focus ยังอยู่ที่ address bar ถ้าเพิ่งพิมพ์ URL หรือ navigate มา)
  // → ให้ focus ทันทีที่ mouse เข้า document ครั้งแรก ก่อนที่จะ scroll
  document.addEventListener('pointerenter', function giveFocus() {
    window.focus()
    document.removeEventListener('pointerenter', giveFocus)
  }, { passive: true })

  function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  window.__lenis = lenis
  return lenis
}

export function stopLenis() {
  lenis?.stop()
}

export function startLenis() {
  lenis?.start()
}

export function scrollTo(target, options = {}) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.0, ...options })
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    const top = typeof target === 'number'
      ? target
      : window.scrollY + el.getBoundingClientRect().top - (options.offset ?? 0)
    window.scrollTo({ top, behavior: 'smooth' })
  }
}
