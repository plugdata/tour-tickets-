# Environment Setup Guide

## Development Commands

### Local Development (localhost:5000)
```bash
npm run dev:local
```
- Uses `.env.local` configuration
- API Base URL: `http://localhost:5000`
- Frontend URL: `http://localhost:5000`

### Production Development (154.197.124.146)
```bash
npm run dev:production
```
- Uses `.env.production` configuration
- API Base URL: `http://154.197.124.146`
- Frontend URL: `http://154.197.124.146`

### Production Server
```bash
npm run start:production
```
- Uses `.env.production` configuration
- Starts server in production mode

## Environment Files

### `.env.local`
- For local development
- Uses localhost URLs
- Development database settings

### `.env.production`
- For production server (154.197.124.146)
- Uses production server URLs
- Production database settings

## Frontend Configuration

The frontend automatically detects the server:
- If accessing `154.197.124.146` → Uses production API
- If accessing `localhost` → Uses local API
- Dynamic API base URL configuration in `frontend/assets/js/config.js`

## Database Commands

### Clear Database
```bash
npm run clear
```

### Seed Admin User Only
```bash
npm run seed:admin
```

### Clear and Seed Admin
```bash
npm run seed:clean
```

### Full Seeding
```bash
npm run seed
```

## Deployment

1. Update environment variables in `.env.production`
2. Run `npm run start:production`
3. Frontend will automatically connect to production API

## Notes

- The environment switching script handles copying the appropriate `.env` file
- Frontend automatically adapts to the server URL
- Both local and production configurations use the same codebase
