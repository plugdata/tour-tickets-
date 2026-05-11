import { navigate, getParams } from './index.js'

// Booking flow navigation helpers (URL ต้องตรงกับ Vite rewrite + หน้า HTML จริง)
export const booking = {
  /** ไปหน้า seats — roundId อยู่ใน query ตาม seats.html */
  toSeats(roundId, query = {}) {
    navigate('seats', {}, { ...query, roundId: String(roundId) })
  },

  toForm(query = {}) {
    navigate('form', {}, query)
  },

  toInsurance(query = {}) {
    navigate('insurance', {}, query)
  },

  toRental(query = {}) {
    navigate('rental', {}, query)
  },

  toTicket(query = {}) {
    navigate('ticket', {}, query)
  },

  toStatus(query = {}) {
    navigate('status', {}, query)
  },
}

/**
 * อ่าน params ของหน้า booking ปัจจุบัน (path + query)
 * ตัวอย่าง: /booking/seats?roundId=42&token=...
 */
export function getBookingParams() {
  return getParams()
}
