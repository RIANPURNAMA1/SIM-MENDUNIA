import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function int(value, fallback) {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const config = {
  port: int(process.env.PORT, 4300),
  gatewayToken: process.env.GATEWAY_TOKEN || 'mendunia-gateway-token',
  backendBaseUrl: (process.env.BACKEND_BASE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
  backendWebhookSecret: process.env.BACKEND_WEBHOOK_SECRET || 'mendunia-gateway-secret',
  sessionDir: path.resolve(rootDir, process.env.SESSION_DIR || './sessions'),
  maxPayload: int(process.env.MAX_PAYLOAD, 1024 * 1024),
  send: {
    // Jarak minimum antar pesan (ms). Semakin besar, semakin aman dari flag WhatsApp.
    minIntervalMs: int(process.env.SEND_MIN_INTERVAL_MS, 3000),
    // Jitter acak tambahan (ms) agar pola kirim tidak terdeteksi sebagai bot.
    jitterMs: int(process.env.SEND_JITTER_MS, 1000),
    // Batas per device per periode waktu. Jika tercapai, pesan ditunda hingga jendela reset.
    maxPerMinute: int(process.env.SEND_MAX_PER_MINUTE, 20),
    maxPerHour: int(process.env.SEND_MAX_PER_HOUR, 200),
    maxPerDay: int(process.env.SEND_MAX_PER_DAY, 1000),
  },
}

export default config