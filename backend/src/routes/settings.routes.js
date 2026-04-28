const router = require('express').Router()
const prisma = require('../config/prisma')
const { authenticate, authorize } = require('../middleware/auth')

// Default setting keys with initial values
const DEFAULTS = {
  site_name:              'GUGA Travels',
  site_tagline:           'GROW UP GO ANYWHERE',
  site_description:       'บริการจัดทริปท่องเที่ยว ทริปเดินป่า และทัวร์ต่างประเทศ',
  site_logo_url:          '',
  site_favicon_url:       '',
  seo_title:              'GUGA Travels — ทริปท่องเที่ยว',
  seo_description:        'จองทริปท่องเที่ยวกับ GUGA Travels ทริปในประเทศและต่างประเทศ',
  seo_keywords:           'ทริป,ท่องเที่ยว,เดินป่า,ทัวร์,booking',
  seo_og_image:           '',
  social_facebook:        '',
  social_line_oa:         '@guga',
  social_instagram:       '',
  social_tiktok:          '',
  social_youtube:         '',
  contact_phone:          '',
  contact_email:          '',
  contact_address:        '',
  contact_map_embed:      '',
  contact_hours:          'จ-ศ 09:00-18:00',
  hero_title:             'โตละ...จะไปไหนก็ได้',
  hero_subtitle:          'Grow up, Go anywhere — เปิดโลกกว้าง สัมผัสธรรมชาติ',
  hero_bg_url:            '',
  announcement_text:      '',
  announcement_active:    'false',
  analytics_gtm:          '',
  analytics_ga4:          '',
  cookie_policy_text:     'เว็บไซต์นี้ใช้คุกกี้เพื่อนำเสนอประสบการณ์ที่ดีที่สุด',
  email_notify_to:        '',
  line_notify_token:      '',
}

// GET /api/settings — public: return all as flat {key:value}
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.siteSetting.findMany()
    const map = { ...DEFAULTS }
    rows.forEach(r => { map[r.key] = r.value ?? '' })
    res.json(map)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/settings/:key — public
router.get('/:key', async (req, res) => {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: req.params.key } })
    res.json({ key: req.params.key, value: row?.value ?? DEFAULTS[req.params.key] ?? null })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/settings — admin: bulk upsert {key:value,...}
router.put('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const updates = req.body
    if (typeof updates !== 'object') return res.status(400).json({ message: 'Body must be object' })
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.siteSetting.upsert({
          where:  { key },
          update: { value: String(value ?? '') },
          create: { key, value: String(value ?? '') },
        })
      )
    )
    const rows = await prisma.siteSetting.findMany()
    const map = { ...DEFAULTS }
    rows.forEach(r => { map[r.key] = r.value ?? '' })
    res.json(map)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PUT /api/settings/:key — admin: single key
router.put('/:key', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { value } = req.body
    const row = await prisma.siteSetting.upsert({
      where:  { key: req.params.key },
      update: { value: String(value ?? '') },
      create: { key: req.params.key, value: String(value ?? '') },
    })
    res.json(row)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
