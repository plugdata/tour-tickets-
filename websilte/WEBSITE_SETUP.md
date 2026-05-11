# Website Setup Guide

## Development Commands

### Local Development (localhost:5173)
```bash
npm run dev:local
```
- Uses `.env.example` configuration
- API Base URL: `http://localhost:5000/api`
- Frontend URL: `http://localhost:5173`

### Production Development (154.197.124.146)
```bash
npm run dev:production
```
- Uses `.env.production` configuration
- API Base URL: `http://154.197.124.146:5000/api`
- Frontend URL: `http://localhost:5173` (proxied to production API)

### Build Commands

#### Local Build
```bash
npm run build:local
```
- Builds for local deployment
- Uses local API configuration

#### Production Build
```bash
npm run build:production
```
- Builds for production deployment
- Uses production API configuration

## API Configuration

### Dynamic API Detection
The website automatically detects the server:
- **Localhost** → Uses `http://localhost:5000/api`
- **154.197.124.146** → Uses `http://154.197.124.146:5000/api`
- **Environment Variable** → Uses `VITE_API_URL` if set

### Environment Files

#### `.env.example`
```env
VITE_API_URL=http://localhost:5000/api
NODE_ENV=development
```

#### `.env.production`
```env
VITE_API_URL=http://154.197.124.146:5000/api
NODE_ENV=production
```

## API Integration

### Available API Modules
- `src/api/config.js` - Base API configuration
- `src/api/trip.js` - Trip and bus round APIs
- `src/api/settings.js` - Site settings API
- `src/api/content.js` - Content/CMS API
- `src/api/gallery.js` - Gallery API

### Usage Example
```javascript
import { apiFetch } from '/src/api/config.js'
import { getTrips } from '/src/api/trip.js'

// Get all trips
const trips = await getTrips({ active: true })

// Direct API call
const data = await apiFetch('/trips?search=bangkok')
```

## Vite Configuration

### Proxy Setup
- Development proxy routes `/api` to backend
- Production proxy routes `/api` to production server
- Upload files proxied via `/uploads`

### Build Configuration
- Multiple entry points for different pages
- Output directory: `dist/`
- Path aliases: `@/` → `src/`

## Deployment

### Local Development
1. Run backend server: `cd backend && npm run dev:local`
2. Run website: `cd websilte && npm run dev:local`
3. Access: `http://localhost:5173`

### Production
1. Run backend server: `cd backend && npm run dev:production`
2. Run website: `cd websilte && npm run dev:production`
3. Access: `http://localhost:5173` (proxied to production API)

### Static Build
1. Build: `npm run build:production`
2. Deploy `dist/` folder to web server
3. Ensure backend API is accessible

## Features

### Automatic API Detection
- No manual configuration needed
- Works on both local and production servers
- Fallback to localhost if environment not detected

### CORS Support
- Backend configured for cross-origin requests
- Vite proxy handles development CORS
- Production uses direct API calls

### Error Handling
- Automatic error messages from API
- Fallback data for failed requests
- Graceful degradation for offline mode
