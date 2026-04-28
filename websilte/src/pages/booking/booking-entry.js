// Shared entry for all booking pages — import in each booking HTML
import { getBookingParams } from '@/router/booking.js'
import { onRouteChange } from '@/router/index.js'

// Expose to window so inline scripts in HTML can use it
window.__booking = {
  getParams: getBookingParams,
  onRouteChange,
}

// Log params on load (dev helper)
const params = getBookingParams()
console.log('[booking] page params:', params)
