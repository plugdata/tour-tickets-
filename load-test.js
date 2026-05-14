import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const errorRate = new Rate('errors')
const pageLoadTime = new Trend('page_load_time', true)

export const options = {
  stages: [
    { duration: '10s', target: 10 },   // ramp up → 10 users
    { duration: '20s', target: 50 },   // ramp up → 50 users
    { duration: '30s', target: 50 },   // hold 50 users
    { duration: '10s', target: 0  },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% ต้องตอบใน 3 วิ
    errors:            ['rate<0.1'],    // error < 10%
  },
}

const BASE = 'http://154.197.124.146:5173'

export default function () {
  // 1. หน้าแรก
  let r = http.get(BASE + '/', { tags: { name: 'home' } })
  pageLoadTime.add(r.timings.duration)
  check(r, { 'home 200': (res) => res.status === 200 }) || errorRate.add(1)
  errorRate.add(r.status !== 200 ? 1 : 0)

  sleep(1)

  // 2. หน้า trips (เหมือน user browse ทริป)
  let r2 = http.get(BASE + '/trips', { tags: { name: 'trips' } })
  check(r2, { 'trips ok': (res) => res.status < 400 }) || errorRate.add(1)

  sleep(Math.random() * 2 + 1)  // random think time 1-3 วิ
}
