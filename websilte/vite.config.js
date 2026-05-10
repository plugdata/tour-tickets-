import { defineConfig } from 'vite'
import { resolve } from 'path'

const urlRewrites = {
  '/trips': '/src/pages/trips/list.html',
  '/booking/seats': '/src/pages/booking/seats.html',
  '/booking/form': '/src/pages/booking/form.html',
  '/booking/insurance': '/src/pages/booking/insurance.html',
  '/booking/rental': '/src/pages/booking/rental.html',
  '/booking/ticket': '/src/pages/booking/ticket.html',
  '/booking/status': '/src/pages/booking/status.html',
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    {
      name: 'url-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const [pathname, qs] = (req.url || '/').split('?')
          const target = urlRewrites[pathname] ||
            (pathname.startsWith('/trips/') ? '/src/pages/trips/list.html' : null)
          if (target) req.url = target + (qs ? '?' + qs : '')
          next()
        })
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' ? 'http://localhost:5000' : 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.NODE_ENV === 'production' ? 'http://localhost:5000' : 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        form: resolve(__dirname, 'src/pages/booking/form.html'),
        seats: resolve(__dirname, 'src/pages/booking/seats.html'),
        insurance: resolve(__dirname, 'src/pages/booking/insurance.html'),
        rental: resolve(__dirname, 'src/pages/booking/rental.html'),
        ticket: resolve(__dirname, 'src/pages/booking/ticket.html'),
        status: resolve(__dirname, 'src/pages/booking/status.html'),
        tripsList: resolve(__dirname, 'src/pages/trips/list.html'),
      }
    }
  }
})
