const router = require('express').Router()

console.log('Workaround routes file loaded, adding /test route')

// Test endpoint
router.get('/test', (req, res) => {
  console.log('GET /api/data/test called')
  res.json({ message: 'Workaround routes are working!' })
})

console.log('Router setup complete, exporting')

module.exports = router
