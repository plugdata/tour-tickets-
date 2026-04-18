const express = require('express')
const cors = require('cors')
const path = require('path')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('./config/swagger')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// ป้องกัน browser ขอ favicon แล้วได้ 404
app.get('/favicon.ico', (req, res) => res.status(204).end())

// Serve frontend static files
// __dirname = .../backend/src → ../.. = D:/project_ticket → ../frontend
const frontendPath = path.join(__dirname, '../../frontend')
app.use('/frontend', express.static(frontendPath))
app.get('/frontend', (req, res) => res.redirect('/frontend/pages/login.html'))
app.get('/', (req, res) => res.redirect('/frontend/pages/login.html'))

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Ticket Backoffice API'
}))

// Routes
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/users', require('./routes/user.routes'))
app.use('/api/trips', require('./routes/trip.routes'))
app.use('/api/bus-rounds', require('./routes/busRound.routes'))
app.use('/api/bookings', require('./routes/booking.routes'))
app.use('/api/payments', require('./routes/payment.routes'))
app.use('/api/addons', require('./routes/addon.routes'))
app.use('/api/contents', require('./routes/content.routes'))
app.use('/api/expenses', require('./routes/expense.routes'))
app.use('/api/reports', require('./routes/report.routes'))
app.use('/api/insurance', require('./routes/insurance.routes'))
app.use('/api/seat-bookings', require('./routes/seatBooking.routes'))
app.use('/api/booking-sessions', require('./routes/bookingSession.routes'))

module.exports = app
