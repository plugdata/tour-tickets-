export function initCookieNotice() {
  if (localStorage.getItem('cookiesAccepted') === 'true') {
    document.getElementById('cookieNotice')?.classList.add('hidden')
  }

  document.getElementById('cookieNotice')
    ?.querySelector('.btn-cookie')
    ?.addEventListener('click', () => {
      document.getElementById('cookieNotice').classList.add('hidden')
      localStorage.setItem('cookiesAccepted', 'true')
    })
}
