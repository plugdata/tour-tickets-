export function initNavbar() {
  let lastScroll = 0
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar')
    const currentScroll = window.pageYOffset
    if (currentScroll > 100) {
      navbar.style.background = 'rgba(15, 20, 25, 0.98)'
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)'
    } else {
      navbar.style.background = 'rgba(15, 20, 25, 0.95)'
      navbar.style.boxShadow = 'none'
    }
    lastScroll = currentScroll
  })

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href'))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}
