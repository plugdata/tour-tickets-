/**
 * Homepage CMS Loader
 * โหลดข้อมูลทั้งหมดจาก API แล้ว inject เข้า index.html
 */
import { getSettings } from '../../api/settings.js'
import { getContents } from '../../api/content.js'
import { getGalleryAlbums } from '../../api/gallery.js'
import { apiFetch } from '../../api/config.js'

// ── Util ──────────────────────────────────────────────────
const $ = id => document.getElementById(id)
const qs = sel => document.querySelector(sel)
const UPLOAD_BASE = '/uploads/'

function imgSrc(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return url  // relative — served by vite proxy /uploads
}

// Swipers are initialized by initSwipers() in main.js after loadHomepage() resolves

// ── 1. Site Settings → Navbar / Hero / Cookie / Social ──
export async function loadSiteSettings() {
  const s = await getSettings()

  // Navbar brand name
  const brandSpan = qs('.navbar-brand span')
  if (brandSpan && s.site_name) brandSpan.textContent = s.site_name

  // Announcement bar
  if (s.announcement_active === 'true' && s.announcement_text) {
    let bar = $('announcementBar')
    if (!bar) {
      bar = document.createElement('div')
      bar.id = 'announcementBar'
      bar.className = 'announcement-bar'
      bar.innerHTML = `<div class="container d-flex align-items-center justify-content-between gap-2">
        <span><i class="bi bi-megaphone-fill me-2"></i><span id="announcementText"></span></span>
        <button onclick="this.parentElement.parentElement.style.display='none'"
          style="background:none;border:none;color:inherit;font-size:1rem;opacity:.7;cursor:pointer">
          <i class="bi bi-x-lg"></i></button>
      </div>`
      document.body.prepend(bar)
    }
    const t = $('announcementText')
    if (t) t.textContent = s.announcement_text
    bar.style.display = ''
  }

  // Hero
  const heroSection = $('heroSection')
  if (heroSection && s.hero_bg_url) {
    heroSection.style.background =
      `linear-gradient(rgba(15,20,25,.6),rgba(15,20,25,.85)), url('${imgSrc(s.hero_bg_url)}') center/cover`
  }
  const heroTitle = $('heroTitle')
  if (heroTitle && s.hero_title) {
    heroTitle.textContent = s.hero_title
    heroTitle.setAttribute('data-th', s.hero_title)
    heroTitle.removeAttribute('data-en')  // CMS content → use API translation
  }

  const heroSubtitle = $('heroSubtitle')
  if (heroSubtitle && s.hero_subtitle) {
    heroSubtitle.textContent = s.hero_subtitle
    heroSubtitle.setAttribute('data-th', s.hero_subtitle)
    heroSubtitle.removeAttribute('data-en')  // CMS content → use API translation
  }

  // Social links
  const socials = {
    'social-facebook': s.social_facebook,
    'social-line': s.social_line_oa ? `https://line.me/ti/p/~${s.social_line_oa}` : '',
    'social-instagram': s.social_instagram,
    'social-tiktok': s.social_tiktok,
    'social-email': s.contact_email ? `mailto:${s.contact_email}` : '',
  }
  Object.entries(socials).forEach(([id, href]) => {
    const el = $(id)
    if (el && href) el.href = href
  })

  // Contact info section
  const cPhone = $('contactPhone')
  const cEmail = $('contactEmail')
  const cAddress = $('contactAddress')
  const cHours = $('contactHours')
  if (cPhone && s.contact_phone) cPhone.textContent = s.contact_phone
  if (cEmail && s.contact_email) cEmail.textContent = s.contact_email
  if (cAddress && s.contact_address) cAddress.textContent = s.contact_address
  if (cHours && s.contact_hours) cHours.textContent = s.contact_hours

  // Map embed
  if (s.contact_map_embed) {
    const mapWrap = $('contactMapWrap')
    if (mapWrap) {
      mapWrap.innerHTML = `<iframe src="${s.contact_map_embed}"
        width="100%" height="250" style="border:0;border-radius:12px" allowfullscreen loading="lazy"></iframe>`
    }
  }

  // Cookie notice text
  const cookieText = $('cookiePolicyText')
  if (cookieText && s.cookie_policy_text) cookieText.textContent = s.cookie_policy_text

  // Page title + meta
  if (s.site_name) document.title = `${s.site_name} — ${s.site_tagline || 'Travel'}`
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc && s.seo_description) metaDesc.content = s.seo_description

  return s
}

// ── 2. Hot Trips + Hot Contents → Fire Ticker ─────────────
export async function loadFireTicker() {
  try {
    // ดึง Hot Trips + Hot Content ควบคู่กัน
    const [hotTrips, hotContent] = await Promise.allSettled([
      apiFetch('/trips?hot=true'),
      getContents(null, { hot: 'true', limit: 8 }),
    ])

    const trips = hotTrips.status === 'fulfilled' ? hotTrips.value : []
    const content = hotContent.status === 'fulfilled' ? hotContent.value : []

    // แปลง hot trips เป็น fire-card slides
    const tripSlides = trips.map(t => ({
      bg: imgSrc(t.imageUrl) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      tag: t.country || (t.tripType === 'INTERNATIONAL' ? 'ต่างประเทศ' : 'ในประเทศ'),
      title: t.title,
      price: `฿${Number(t.price || 0).toLocaleString()}`,
      date: '',
      link: '/trips',
    }))

    // แปลง hot content (อาจมี trip ผูกอยู่)
    const contentSlides = content.map(c => ({
      bg: imgSrc(c.imageUrl) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      tag: c.trip?.title || 'GUGA Travels',
      title: c.title,
      price: c.trip ? `฿${Number(c.trip.price || 0).toLocaleString()}` : '',
      date: new Date(c.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
      link: '/trips',
    }))

    let slides = [...tripSlides, ...contentSlides]
    // ตัดสไลด์ที่ซ้ำกันออกโดยใช้ Title เป็นหลัก
    const seen = new Set()
    slides = slides.filter(s => {
      if (seen.has(s.title)) return false
      seen.add(s.title)
      return true
    })

    if (!slides.length) return

    const wrapper = qs('.fire-swiper .swiper-wrapper')
    if (!wrapper) return
    const esc = s => (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
    wrapper.innerHTML = slides.map(s => `
      <div class="swiper-slide fire-slide">
        <div class="fire-card" style="--bg:url('${s.bg}')" onclick="window.location.href='${s.link}'">
          <div class="fire-card-overlay">
            <div class="fire-card-tag">
              <i class="bi bi-geo-alt-fill"></i>
              <span data-i18n-dyn data-th="${esc(s.tag)}">${s.tag}</span>
            </div>
            <div class="fire-card-body">
              <div class="fire-card-title" data-i18n-dyn data-th="${esc(s.title)}">${s.title}</div>
              <div class="fire-card-meta">
                ${s.date ? `<span><i class="bi bi-calendar3"></i> ${s.date}</span>` : ''}
              </div>
              ${s.price ? `<div class="fire-card-price">${s.price} <span data-i18n="per_person">/ คน</span></div>` : ''}
            </div>
          </div>
        </div>
      </div>`).join('')
  } catch (_) { }
}

// ── 3. Trips — handled by Trip Browser JS in index.html ──
export async function loadTrips() {
  // Trip Browser (window.__loadTbData) is initialized directly in index.html
  // Nothing to do here — kept for interface compatibility
}

// ── 4. Blog / Featured Content ────────────────────────────
export async function loadBlogSection() {
  try {
    const posts = await getContents('BLOG', { featured: 'true', limit: 4 })
    const fallback = posts.length < 2
      ? await getContents('TRIP_POST', { limit: 4 })
      : []
    const all = [...posts, ...fallback].slice(0, 4)
    if (!all.length) return

    const grid = $('blogGrid')
    if (!grid) return

    grid.innerHTML = all.slice(0, 4).map((c, i) => {
      const img = imgSrc(c.imageUrl) || `https://images.unsplash.com/photo-151674137202${i}-8eb4fc13bd20?w=800&h=500&fit=crop`
      return `
        <div class="col-lg-${i === 0 ? '6' : '6'}">
          <div class="blog-card" style="cursor:pointer" onclick="openContentModal(${c.id})">
            <div class="blog-image-container">
              <img src="${img}" alt="${c.title}" class="blog-image">
              <div class="blog-overlay">
                <span class="blog-category"><i class="bi bi-tag"></i> ${c.tags || 'บทความ'}</span>
                <h4 class="blog-title">${c.title}</h4>
              </div>
            </div>
          </div>
        </div>`
    }).join('')
  } catch (_) { }
}

// ── 5. Gallery Albums ─────────────────────────────────────
export async function loadGallery() {
  try {
    const albums = await getGalleryAlbums({ active: 'true' })
    const wrap = $('gallerySection')
    if (!wrap) return

    if (!albums.length) { wrap.style.display = 'none'; return }

    const grid = $('galleryGrid')
    if (!grid) return

    grid.innerHTML = albums.slice(0, 8).map(a => {
      const cover = a.coverUrl || a.images?.[0]?.url || ''
      const cnt = a._count?.images ?? 0
      return `
        <div class="col-6 col-md-4 col-lg-3">
          <div class="gallery-card" onclick="openAlbumModal(${a.id})" style="cursor:pointer">
            <div class="gallery-thumb">
              ${cover
          ? `<img src="${imgSrc(cover)}" alt="${a.title}" class="w-100 h-100" style="object-fit:cover">`
          : `<div class="gallery-thumb-placeholder"><i class="bi bi-image"></i></div>`}
              <div class="gallery-thumb-overlay">
                <i class="bi bi-zoom-in" style="font-size:1.5rem"></i>
              </div>
            </div>
            <div class="gallery-info">
              <h6 class="gallery-title">${a.title}</h6>
              <small class="text-muted">${cnt} รูปภาพ${a.category ? ' · ' + a.category : ''}</small>
            </div>
          </div>
        </div>`
    }).join('')
  } catch (_) { }
}

// ── 6. FAQ from API ───────────────────────────────────────
export async function loadFAQ() {
  try {
    const faqs = await getContents('FAQ', { limit: 10 })
    const section = $('faqSection')
    if (!section || !faqs.length) return

    section.innerHTML = faqs.map((f, i) => `
      <div class="faq-item">
        <div class="faq-question">
          <h5>${f.title}</h5>
          <i class="bi bi-chevron-down faq-icon"></i>
        </div>
        <div class="faq-answer">
          <div class="faq-answer-content">${f.body || ''}</div>
        </div>
      </div>`).join('')

    // Re-init FAQ accordion (imported in main.js)
    if (window.__initFAQ) window.__initFAQ()
  } catch (_) { }
}

// ── 7. Announcements (Featured content) → Hero badge ─────
export async function loadFeaturedContent() {
  try {
    const featured = await getContents('TRIP_POST', { featured: 'true', limit: 1 })
    if (!featured.length) return
    const c = featured[0]

    const heroSection = $('heroSection')
    if (heroSection && c.imageUrl && !qs('.fire-card')) {
      heroSection.style.background =
        `linear-gradient(rgba(15,20,25,.6),rgba(15,20,25,.85)), url('${imgSrc(c.imageUrl)}') center/cover`
    }
    const badge = $('heroBadgeLink')
    if (badge) {
      badge.href = '/trips'
      badge.textContent = c.title
    }
  } catch (_) { }
}

// ── Master loader ─────────────────────────────────────────
export async function loadHomepage() {
  try {
    console.log('🏠 Loading homepage...')

    // Run settings first (needed for hero bg), others in parallel
    console.log('⚙️ Loading site settings...')
    await loadSiteSettings()
    console.log('✅ Site settings loaded')

    console.log('📦 Loading homepage content...')
    const results = await Promise.allSettled([
      loadFireTicker(),
      loadTrips(),
      loadBlogSection(),
      loadGallery(),
      loadFAQ(),
      loadFeaturedContent(),
    ])

    // Log any failures for debugging
    results.forEach((result, index) => {
      const loaders = ['FireTicker', 'Trips', 'Blog', 'Gallery', 'FAQ', 'Featured']
      if (result.status === 'rejected') {
        console.warn(`❌ ${loaders[index]} failed:`, result.reason)
      } else {
        console.log(`✅ ${loaders[index]} loaded`)
      }
    })

    console.log('🎉 Homepage loading complete!')
  } catch (error) {
    console.error('💥 Homepage loading failed:', error)
    // Show error message to user
    const heroSection = $('heroSection')
    if (heroSection) {
      heroSection.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;">
          <h2>🚫 ไม่สามารถโหลดข้อมูลได้</h2>
          <p>กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ</p>
          <button onclick="location.reload()" class="btn btn-primary">ลองใหม่</button>
        </div>
      `
    }
  }
}
