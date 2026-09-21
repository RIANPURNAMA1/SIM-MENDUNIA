import express from 'express'
import { config } from './config.js'
import deviceManager from './deviceManager.js'
import notifier from './webhook.js'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: config.maxPayload }))

function auth(req, res, next) {
  const token = req.headers['x-gateway-token'] || req.headers['x-api-token']
  if (!config.gatewayToken || token !== config.gatewayToken) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

function asyncHandler(fn) {
  return (req, res) => {
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error('[error]', err)
      res.status(500).json({ error: err.message || 'Internal Server Error' })
    })
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'mendunia-wa-gateway', time: new Date().toISOString() })
})

app.get('/api/devices', auth, (req, res) => {
  res.json({ devices: deviceManager.list() })
})

app.post('/api/devices', auth, asyncHandler(async (req, res) => {
  const { name } = req.body || {}
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nama device wajib diisi' })
  }

  const result = deviceManager.register(name)
  const { slug } = result.device
  await deviceManager.connect(slug)

  res.status(result.existing ? 200 : 201).json({ device: result.device })
}))

app.get('/api/devices/:slug/qr', auth, asyncHandler(async (req, res) => {
  const { slug } = req.params
  let device = deviceManager.get(slug)
  if (!device && deviceManager.hasSession(slug)) {
    await deviceManager.connect(slug)
    device = deviceManager.get(slug)
  }
  if (!device) return res.status(404).json({ error: 'Device tidak ditemukan' })

  res.json({
    slug,
    status: device.status,
    qr: device.qr || null,
    qrImage: device.qrImage || null,
    phone: device.phone,
    name: device.name,
    hasSession: device.hasStoredSession(),
  })
}))

app.patch('/api/devices/:slug', auth, (req, res) => {
  const { slug } = req.params
  const { name } = req.body || {}
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nama device wajib diisi' })
  }
  const device = deviceManager.rename(slug, String(name).trim())
  if (!device) return res.status(404).json({ error: 'Device tidak ditemukan' })
  res.json({ device })
})

app.get('/api/devices/:slug/status', auth, (req, res) => {
  const { slug } = req.params
  const device = deviceManager.get(slug)
  if (!device) return res.status(404).json({ error: 'Device tidak ditemukan' })
  res.json(device.toJSON())
})

app.post('/api/devices/:slug/send', auth, asyncHandler(async (req, res) => {
  const { slug } = req.params
  const { to, message, fileUrl, caption, type } = req.body || {}

  if (!to) return res.status(400).json({ error: 'Nomor tujuan (to) wajib diisi' })
  if (!fileUrl && !message) return res.status(400).json({ error: 'Pesan (message) atau fileUrl wajib diisi' })

  const device = deviceManager.get(slug)
  if (!device || !device.sock || device.status !== 'connected') {
    return res.status(409).json({ error: 'Device belum terhubung atau masih terkoneksi ulang' })
  }

  const job = fileUrl
    ? deviceManager.sendMedia(slug, to, fileUrl, caption || '', type || 'image')
    : deviceManager.sendText(slug, to, message)

  // Jika antrian aman sedang panjang, laporkan segera (queued) agar request
  // tidak menggantung melebihi timeout backend, lalu kirim di latar belakang.
  if (device.estimatedSendWaitMs() > 8000) {
    job.catch((err) => console.error(`[device ${slug}] Gagal kirim (queued):`, err.message))
    return res.status(202).json({ ok: true, queued: true })
  }

  res.json(await job)
}))

app.post('/api/devices/:slug/logout', auth, asyncHandler(async (req, res) => {
  const { slug } = req.params
  const device = await deviceManager.logout(slug)
  if (!device) return res.status(404).json({ error: 'Device tidak ditemukan' })
  res.json({ device })
}))

app.post('/api/devices/:slug/reconnect', auth, asyncHandler(async (req, res) => {
  const { slug } = req.params
  const device = deviceManager.get(slug)
  if (!device) return res.status(404).json({ error: 'Device tidak ditemukan' })
  await deviceManager.reconnect(slug)
  res.json({ device: deviceManager.get(slug).toJSON() })
}))

app.delete('/api/devices/:slug', auth, asyncHandler(async (req, res) => {
  const { slug } = req.params
  const existed = deviceManager.get(slug)
  if (!existed) return res.status(404).json({ error: 'Device tidak ditemukan' })
  deviceManager.unregister(slug)
  res.json({ ok: true })
}))

app.listen(config.port, async () => {
  console.log(`[gateway] SIM Mendunia WA Gateway berjalan di http://0.0.0.0:${config.port}`)
  deviceManager.hydrate().catch((err) => {
    console.error('[gateway] Gagal memuat sesi tersimpan:', err.message)
  })
})

const shutdown = () => {
  notifier.shutdown()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

export default app