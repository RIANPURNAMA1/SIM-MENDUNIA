import axios from 'axios'
import { config } from './config.js'

class WebhookNotifier {
  constructor() {
    this.running = true
  }

  shutdown() {
    this.running = false
  }

  async post(event, payload) {
    if (!this.running) return
    try {
      const url = `${config.backendBaseUrl}/api/wa-gateway/webhook`
      await axios.post(url, { event, ...payload }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': config.backendWebhookSecret,
        },
        timeout: 8000,
      })
    } catch (err) {
      console.error(`[webhook] Gagal kirim event "${event}":`, err.response?.data || err.message)
    }
  }

  status(slug, status, extra = {}) {
    return this.post('status', { device: slug, status, ...extra })
  }

  message(slug, payload) {
    return this.post('message', { device: slug, ...payload })
  }

  qr(slug, qr) {
    return this.post('qr', { device: slug, qr })
  }
}

export const notifier = new WebhookNotifier()
export default notifier