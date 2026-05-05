#!/bin/bash
# =============================================================
#  Tour Tickets — Installation Script
#  รัน: bash install.sh
# =============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# =============================================================
# 0. รับ input จากผู้ใช้
# =============================================================
echo ""
echo "====================================================="
echo "   Tour Tickets — Setup"
echo "====================================================="
echo ""

read -rp "PostgreSQL password (สำหรับ user postgres): " PG_PASS
read -rp "JWT Secret (กด Enter เพื่อใช้ค่า default): " JWT_INPUT
JWT_SECRET="${JWT_INPUT:-TourTickets_JWT_Secret_2026}"

DB_NAME="tour_tickets"
DB_USER="postgres"

# URL-encode อักขระพิเศษใน password
PG_PASS_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PG_PASS', safe=''))")

DATABASE_URL="postgresql://${DB_USER}:${PG_PASS_ENCODED}@localhost:5432/${DB_NAME}"

echo ""
info "DB: $DATABASE_URL"
echo ""

# =============================================================
# 1. ตรวจสอบ dependencies
# =============================================================
info "ตรวจสอบ dependencies..."

command -v node  >/dev/null 2>&1 || err "ไม่พบ Node.js — ติดตั้งก่อน: https://nodejs.org"
command -v npm   >/dev/null 2>&1 || err "ไม่พบ npm"
command -v psql  >/dev/null 2>&1 || err "ไม่พบ PostgreSQL — รัน: sudo apt install postgresql"
command -v python3 >/dev/null 2>&1 || err "ไม่พบ python3"

log "Node $(node -v) | npm $(npm -v) | $(psql --version)"

# =============================================================
# 2. ตั้งรหัสผ่าน PostgreSQL
# =============================================================
info "ตั้งรหัสผ่าน PostgreSQL..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$PG_PASS';" \
  && log "ตั้งรหัสผ่าน postgres สำเร็จ" \
  || err "ตั้งรหัสผ่านไม่สำเร็จ — ลอง: sudo -u postgres psql"

# =============================================================
# 3. สร้าง database
# =============================================================
info "สร้าง database: $DB_NAME..."
PGPASSWORD="$PG_PASS" psql -U "$DB_USER" -h localhost \
  -c "CREATE DATABASE $DB_NAME;" 2>/dev/null \
  && log "สร้าง database สำเร็จ" \
  || warn "Database อาจมีอยู่แล้ว — ข้ามขั้นตอนนี้"

# =============================================================
# 4. ตรวจสอบที่ตั้ง script
# =============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

[ -d "$BACKEND_DIR" ] || err "ไม่พบโฟลเดอร์ backend ที่ $BACKEND_DIR"

cd "$BACKEND_DIR"

# =============================================================
# 5. สร้างไฟล์ .env
# =============================================================
info "สร้างไฟล์ .env..."
python3 -c "
content = '''DATABASE_URL=\"$DATABASE_URL\"
PORT=5000
JWT_SECRET=$JWT_SECRET
NODE_ENV=development
'''
open('.env', 'w').write(content)
"
log "สร้าง .env สำเร็จ"

# =============================================================
# 6. ติดตั้ง dependencies
# =============================================================
info "ติดตั้ง npm packages..."
npm install
log "npm install สำเร็จ"

# =============================================================
# 7. แก้ migration_lock.toml ให้ใช้ postgresql
# =============================================================
LOCK_FILE="prisma/migrations/migration_lock.toml"
if [ -f "$LOCK_FILE" ]; then
  PROVIDER=$(grep "provider" "$LOCK_FILE" | awk -F'"' '{print $2}')
  if [ "$PROVIDER" != "postgresql" ]; then
    warn "migration_lock.toml ใช้ provider: $PROVIDER — แก้เป็น postgresql..."
    python3 -c "
import re, pathlib
p = pathlib.Path('$LOCK_FILE')
p.write_text(re.sub(r'provider\s*=\s*\".*?\"', 'provider = \"postgresql\"', p.read_text()))
"
    log "แก้ migration_lock.toml สำเร็จ"
  fi
fi

# =============================================================
# 8. Generate Prisma client
# =============================================================
info "Generate Prisma client..."
npx prisma generate
log "Prisma generate สำเร็จ"

# =============================================================
# 9. Run migrations
# =============================================================
info "Run database migrations..."
npx prisma migrate deploy 2>/dev/null || {
  warn "migrate deploy มีปัญหา — ลอง migrate dev..."
  npx prisma migrate dev --name init_setup
}
log "Migrations สำเร็จ"

# =============================================================
# 10. Seed ข้อมูล
# =============================================================
info "Seed ข้อมูลตัวอย่าง..."

# แก้ seed.js ให้เรียก main() ก่อน seedBusRounds()
if grep -q "^seedBusRounds()" src/seed.js 2>/dev/null; then
  warn "แก้ seed.js — เพิ่มการเรียก main() ก่อน seedBusRounds()..."
  python3 -c "
import pathlib
p = pathlib.Path('src/seed.js')
content = p.read_text()
content = content.replace(
  'seedBusRounds()\n  .catch(console.error)\n  .finally(() => prisma.\$disconnect())',
  'main()\n  .then(() => seedBusRounds())\n  .catch(console.error)\n  .finally(() => prisma.\$disconnect())'
)
p.write_text(content)
"
fi

node src/seed.js && log "Seed ข้อมูลสำเร็จ"

# =============================================================
# 11. สร้าง admin user
# =============================================================
info "สร้าง admin user..."
node -e "
require('dotenv').config()
const prisma = require('./src/config/prisma')
const bcrypt = require('bcryptjs')
bcrypt.hash('12345', 10).then(hash => {
  return prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hash, name: 'Admin System', role: 'ADMIN', phone: '0812345678', email: 'admin@tour.local' }
  })
}).then(() => {
  console.log('admin user ready')
  prisma.\$disconnect()
}).catch(e => { console.error(e.message); prisma.\$disconnect() })
" && log "Admin user พร้อมแล้ว"

# =============================================================
# 12. ทดสอบ connection
# =============================================================
info "ทดสอบ database connection..."
node -e "
require('dotenv').config()
const prisma = require('./src/config/prisma')
Promise.all([prisma.user.count(), prisma.trip.count()])
  .then(([u, t]) => { console.log('users:', u, '| trips:', t); prisma.\$disconnect() })
  .catch(e => { console.error('Connection failed:', e.message); process.exit(1) })
" && log "Database connection OK"

# =============================================================
echo ""
echo "====================================================="
log "ติดตั้งสำเร็จ!"
echo "====================================================="
echo ""
echo "  เริ่มเซิร์ฟเวอร์:   npm run dev"
echo "  API:               http://localhost:5000"
echo "  Swagger:           http://localhost:5000/api-docs"
echo "  Login:             admin / 12345"
echo ""
