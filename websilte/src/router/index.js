import { createRouter } from '@nanostores/router'

// ต้องตรงกับ path ที่ vite.config.js (urlRewrites) เสิร์ฟจริง — ใช้ query string ไม่ใช่ :param ใน path
export const router = createRouter({
  home: '/',
  booking: '/booking',
  form: '/booking/form',
  seats: '/booking/seats',
  insurance: '/booking/insurance',
  rental: '/booking/rental',
  ticket: '/booking/ticket',
  status: '/booking/status',
})

/**
 * Navigate to a route
 * @param {string} name - route name (e.g. 'seats')
 * @param {object} params - reserved for nanostores path segments (ว่างถ้าใช้แค่ query)
 * @param {object} query  - query string params (เช่น roundId, token)
 */
export function navigate(name, params = {}, query = {}) {
  const qs = new URLSearchParams(query).toString()
  router.open(router.buildPath(name, params) + (qs ? '?' + qs : ''))
}

/**
 * Get all URL params for the current page:
 * - path params from nanostores router
 * - query string params from window.location.search
 */
export function getParams() {
  const page = router.get()
  const pathParams = page?.params ?? {}
  const queryParams = Object.fromEntries(new URLSearchParams(window.location.search))
  return { ...pathParams, ...queryParams }
}

/**
 * Subscribe to route changes
 */
export function onRouteChange(callback) {
  return router.subscribe((page) => {
    if (!page) return
    callback({
      route: page.route,
      params: { ...page.params, ...Object.fromEntries(new URLSearchParams(window.location.search)) },
    })
  })
}
