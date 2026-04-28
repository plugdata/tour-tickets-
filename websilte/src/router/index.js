import { createRouter } from '@nanostores/router'

// Route definitions — path params ใช้ :paramName
export const router = createRouter({
  home:      '/',
  booking:   '/booking',
  form:      '/booking/form',
  seats:     '/booking/seats/:roundId',
  insurance: '/booking/insurance/:bookingId',
  rental:    '/booking/rental/:bookingId',
  ticket:    '/booking/ticket/:bookingId',
  status:    '/booking/status/:bookingId',
})

/**
 * Navigate to a route
 * @param {string} name - route name (e.g. 'seats')
 * @param {object} params - path params (e.g. { roundId: '42' })
 * @param {object} query  - query string params (e.g. { from: 'home' })
 */
export function navigate(name, params = {}, query = {}) {
  const qs = new URLSearchParams(query).toString()
  router.open(router.buildPath(name, params) + (qs ? '?' + qs : ''))
}

/**
 * Get all URL params for the current page:
 * - path params from nanostores router
 * - query string params from window.location.search
 * Returns a plain object merged together.
 */
export function getParams() {
  const page = router.get()
  const pathParams = page?.params ?? {}
  const queryParams = Object.fromEntries(new URLSearchParams(window.location.search))
  return { ...pathParams, ...queryParams }
}

/**
 * Subscribe to route changes
 * @param {function} callback - called with { route, params } on every change
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
