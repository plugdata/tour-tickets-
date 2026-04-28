import { navigate, getParams } from './index.js'

// Booking flow navigation helpers
export const booking = {
  /** ไปหน้า seats พร้อม roundId + query params */
  toSeats(roundId, query = {}) {
    navigate('seats', { roundId: String(roundId) }, query)
  },

  /** ไปหน้า form กรอกข้อมูลผู้โดยสาร */
  toForm(query = {}) {
    navigate('form', {}, query)
  },

  /** ไปหน้า insurance */
  toInsurance(bookingId, query = {}) {
    navigate('insurance', { bookingId: String(bookingId) }, query)
  },

  /** ไปหน้า rental */
  toRental(bookingId, query = {}) {
    navigate('rental', { bookingId: String(bookingId) }, query)
  },

  /** ไปหน้า ticket */
  toTicket(bookingId, query = {}) {
    navigate('ticket', { bookingId: String(bookingId) }, query)
  },

  /** ไปหน้า status */
  toStatus(bookingId, query = {}) {
    navigate('status', { bookingId: String(bookingId) }, query)
  },
}

/**
 * อ่าน params ของหน้า booking ปัจจุบัน
 * รวม path params + query string
 *
 * ตัวอย่าง URL: /booking/seats/42?seatIds=1,2,3
 * → { roundId: '42', seatIds: '1,2,3' }
 */
export function getBookingParams() {
  return getParams()
}
