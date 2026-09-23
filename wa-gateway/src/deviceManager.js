import fs from 'node:fs'
import path from 'node:path'
import QRCode from 'qrcode'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  Browsers,
  isJidBroadcast,
  isJidStatusBroadcast,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { config } from './config.js'
import notifier from './webhook.js'

const pinoLogger = pino({ level: 'warn' })

const DEVICE_META_FILE = 'device.json'
const REGISTRY_FILE = 'registry.json'

const DISCONNECT_NAMES = {
  [DisconnectReason.connectionClosed]: 'connectionClosed (428)',
  [DisconnectReason.connectionLost]: 'connectionLost / timedOut (408)',
  [DisconnectReason.connectionReplaced]: 'connectionReplaced (440)',
  [DisconnectReason.loggedOut]: 'loggedOut (401)',
  [DisconnectReason.badSession]: 'badSession (500)',
  [DisconnectReason.restartRequired]: 'restartRequired (515)',
  [DisconnectReason.multideviceMismatch]: 'multideviceMismatch (411)',
  [DisconnectReason.forbidden]: 'forbidden (403)',
  [DisconnectReason.unavailableService]: 'unavailableService (503)',
}

const UNABLE_TO_RECOVER = new Set([
  DisconnectReason.badSession,
  DisconnectReason.multideviceMismatch,
])

function slugify(name) {
  const slug = String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
  return slug || `device-${Date.now()}`
}

function formatPhone(to) {
  let p = String(to || '').replace(/[^0-9]/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  if (!p.startsWith('62')) p = '62' + p
  return p
}

function phoneFromJid(jid = '') {
  const p = jid.split('@')[0] || ''
  return p.replace(/\D/g, '')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class DeviceManager {
  constructor() {
    this.devices = new Map()
    this.registryFile = path.join(config.sessionDir, REGISTRY_FILE)
    fs.mkdirSync(config.sessionDir, { recursive: true })
  }

  ensureSessionDir(slug) {
    fs.mkdirSync(path.join(config.sessionDir, slug), { recursive: true })
  }

  get(slug) {
    return this.devices.get(slug) || null
  }

  list() {
    return Array.from(this.devices.values()).map((d) => d.toJSON())
  }

  hasSession(slug) {
    return fs.existsSync(path.join(config.sessionDir, slug, 'creds.json'))
  }

  listStoredSessions() {
    try {
      return fs.readdirSync(config.sessionDir).filter((f) => {
        const p = path.join(config.sessionDir, f)
        return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'creds.json'))
      })
    } catch {
      return []
    }
  }

  listSessionDirs() {
    try {
      return fs.readdirSync(config.sessionDir).filter((f) => {
        const p = path.join(config.sessionDir, f)
        return fs.statSync(p).isDirectory()
      })
    } catch {
      return []
    }
  }

  saveRegistry() {
    try {
      fs.mkdirSync(config.sessionDir, { recursive: true })
      const entries = Array.from(this.devices.values()).map((d) => ({ slug: d.slug, name: d.name }))
      fs.writeFileSync(this.registryFile, JSON.stringify(entries, null, 2), 'utf8')
    } catch {
      /* ignore */
    }
  }

  loadRegistry() {
    try {
      const list = JSON.parse(fs.readFileSync(this.registryFile, 'utf8'))
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }

  /**
   * Buat/daftarkan device baru. Jika sudah ada sesi tersimpan, langsung
   * mencoba koneksi (tanpa QR). Jika belum, akan menunggu QR.
   */
  register(name) {
    const slug = slugify(name)
    if (this.devices.has(slug)) {
      return { device: this.devices.get(slug).toJSON(), existing: true }
    }
    const device = new DeviceState(slug, name || slug)
    device.readMeta()
    this.devices.set(slug, device)
    this.saveRegistry()
    return { device: device.toJSON(), existing: false }
  }

  rename(slug, name) {
    const device = this.devices.get(slug)
    if (!device) return null
    device.rename(name)
    return device.toJSON()
  }

  unregister(slug) {
    const device = this.devices.get(slug)
    if (device) {
      device.logout()
      this.devices.delete(slug)
      this.saveRegistry()
    }
  }

  /**
   * Muat ulang device dari sesi yang tersimpan di disk, lalu coba
   * sambungkan kembali otomatis. Dipanggil saat gateway start agar
   * device yang sudah pernah di-scan tetap aktif setelah restart.
   */
  async hydrate() {
    const stored = this.listStoredSessions()

    if (stored.length > 0) {
      console.log(`[gateway] ${stored.length} sesi tersimpan ditemukan, mencoba koneksi ulang...`)
    }

    for (const slug of stored) {
      if (this.devices.has(slug)) continue
      const device = new DeviceState(slug, slug)
      device.readMeta()
      this.devices.set(slug, device)
    }

    const registered = this.loadRegistry()
    const sessionDirs = this.listSessionDirs()
    for (const item of registered) {
      if (this.devices.has(item.slug)) continue
      const device = new DeviceState(item.slug, item.name || item.slug)
      device.readMeta()
      this.devices.set(item.slug, device)
    }
    for (const slug of sessionDirs) {
      if (this.devices.has(slug)) continue
      const device = new DeviceState(slug, slug)
      device.readMeta()
      this.devices.set(slug, device)
    }

    await Promise.allSettled(stored.map((slug) => this.connect(slug)))
  }

  async connect(slug) {
    let device = this.devices.get(slug)
    if (!device) {
      device = new DeviceState(slug, slug)
      this.devices.set(slug, device)
    }
    await device.connect()
    return device.toJSON()
  }

  async logout(slug) {
    const device = this.devices.get(slug)
    if (!device) return null
    await device.logout()
    return device.toJSON()
  }

  async reconnect(slug) {
    const device = this.devices.get(slug)
    if (!device) throw new Error('Device tidak ditemukan')
    await device.reconnect()
    return device.toJSON()
  }

  async sendText(slug, to, message) {
    const device = this.devices.get(slug)
    if (!device) throw new Error('Device tidak ditemukan')
    return device.sendText(to, message)
  }

  async sendMedia(slug, to, fileUrl, caption = '', type = 'image') {
    const device = this.devices.get(slug)
    if (!device) throw new Error('Device tidak ditemukan')
    return device.sendMedia(to, fileUrl, caption, type)
  }

  getQr(slug) {
    const device = this.devices.get(slug)
    if (!device) return null
    return device.qr || null
  }
}

class DeviceState {
  constructor(slug, name) {
    this.slug = slug
    this.name = name
    this.status = 'disconnected'
    this.qr = null
    this.qrImage = null
    this.phone = null
    this.lastConnectedAt = null
    this.sock = null
    this.loggedOut = false
    this.connecting = false
    this.connectTimer = null
    this.reconnectAttempt = 0
    this.sendQueue = []
    this.processingQueue = false
    this.lastSendAt = 0
    this.sentAt = []
  }

  getSessionPath() {
    return path.join(config.sessionDir, this.slug)
  }

  getMetaPath() {
    return path.join(this.getSessionPath(), DEVICE_META_FILE)
  }

  hasStoredSession() {
    return fs.existsSync(path.join(this.getSessionPath(), 'creds.json'))
  }

  readMeta() {
    try {
      const raw = fs.readFileSync(this.getMetaPath(), 'utf8')
      const meta = JSON.parse(raw)
      if (meta?.name) this.name = meta.name
    } catch {
      /* ignore */
    }
  }

  saveMeta() {
    try {
      fs.mkdirSync(this.getSessionPath(), { recursive: true })
      fs.writeFileSync(this.getMetaPath(), JSON.stringify({ slug: this.slug, name: this.name }, null, 2), 'utf8')
    } catch {
      /* ignore */
    }
  }

  rename(name) {
    const cleaned = String(name || '').trim()
    if (cleaned) {
      this.name = cleaned
      this.saveMeta()
    }
    return this.name
  }

  toJSON() {
    return {
      slug: this.slug,
      name: this.name,
      status: this.status,
      qr: this.status === 'qr' ? this.qr : null,
      qrImage: this.status === 'qr' ? this.qrImage : null,
      phone: this.phone,
      hasSession: this.hasStoredSession(),
      lastConnectedAt: this.lastConnectedAt,
    }
  }

  async connect() {
    if (this.sock) return
    await this.buildSocket()
  }

  async reconnect() {
    // Jika sesi sudah logout dari WhatsApp (401), creds lama sudah tidak valid.
    // Hapus sesi agar gateway membuat pasangan baru & menampilkan QR scan ulang.
    if (this.loggedOut) {
      this.clearSession()
    }
    this.loggedOut = false
    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
    try {
      this.sock?.end?.()
    } catch {
      /* abaikan */
    }
    this.sock = null
    this.reconnectAttempt = 0
    this.connecting = false
    await this.buildSocket()
  }

  async buildSocket() {
    if (this.connecting || this.sock) return
    this.connecting = true
    const sessionPath = this.getSessionPath()
    fs.mkdirSync(sessionPath, { recursive: true })

    this.status = 'connecting'
    this.qr = null
    this.qrImage = null
    await notifier.status(this.slug, 'connecting', { name: this.name, phone: this.phone })

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
      const socket = makeWASocket({
        logger: pinoLogger,
        browser: Browsers.appropriate('SIM Mendunia'),
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pinoLogger),
        },
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      })

      socket.ev.on('creds.update', saveCreds)

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
          this.status = 'qr'
          this.qr = qr || null
          try {
            this.qrImage = await QRCode.toDataURL(qr, {
              width: 320,
              margin: 1,
              errorCorrectionLevel: 'M',
            })
          } catch {
            this.qrImage = null
          }
          await notifier.qr(this.slug, this.qr)
          return
        }

        if (connection === 'open') {
          this.status = 'connected'
          this.qr = null
          this.qrImage = null
          this.phone = phoneFromJid(socket.user?.id)
          this.lastConnectedAt = new Date().toISOString()
          this.reconnectAttempt = 0
          this.sock = socket
          this.saveMeta()
          await notifier.status(this.slug, 'connected', { name: this.name, phone: this.phone })
          return
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode
          const reasonName = DISCONNECT_NAMES[statusCode] || `unknown(${statusCode})`
          const reasonMsg =
            lastDisconnect?.error?.message || lastDisconnect?.error?.output?.payload?.message || ''
          console.warn(
            `[device ${this.slug}] Terputus: ${reasonName}${reasonMsg ? ` - ${reasonMsg}` : ''}`
          )
          this.sock = null

          if (statusCode === DisconnectReason.loggedOut) {
            this.loggedOut = true
            this.status = 'loggedOut'
            this.phone = null
            await notifier.status(this.slug, 'loggedOut', { name: this.name })
            return
          }

          if (statusCode === DisconnectReason.connectionReplaced) {
            this.status = 'replaced'
            await notifier.status(this.slug, 'replaced', { name: this.name, phone: this.phone })
            return
          }

          if (UNABLE_TO_RECOVER.has(statusCode)) {
            this.clearSession()
            this.status = 'disconnected'
            this.phone = null
            console.warn(
              `[device ${this.slug}] Sesi tidak bisa dipakai ulang, silakan scan QR baru`
            )
            await notifier.status(this.slug, 'disconnected', {
              name: this.name,
              loggedOut: true,
              reset: true,
            })
            return
          }

          this.status = 'disconnected'
          if (!this.loggedOut) {
            await notifier.status(this.slug, 'disconnected', { name: this.name })
            this.scheduleReconnect(statusCode === DisconnectReason.restartRequired ? 1000 : null)
          }
        }
      })

      socket.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages || []) {
          await this.handleIncoming(msg)
        }
      })

      this.sock = socket
    } finally {
      this.connecting = false
    }
  }

  clearSession() {
    const dir = this.getSessionPath()
    try {
      if (fs.existsSync(dir)) {
        for (const entry of fs.readdirSync(dir)) {
          if (entry === DEVICE_META_FILE) continue
          const p = path.join(dir, entry)
          const stat = fs.statSync(p)
          if (stat.isDirectory()) fs.rmSync(p, { recursive: true, force: true })
          else fs.rmSync(p, { force: true })
        }
      }
    } catch {
      /* ignore */
    }
  }

  scheduleReconnect(delay) {
    const backoff = delay ?? Math.min(2000 + this.reconnectAttempt * 1000, 30000)
    this.reconnectAttempt += 1
    if (this.connectTimer) clearTimeout(this.connectTimer)
    this.connectTimer = setTimeout(async () => {
      if (this.loggedOut || this.connecting || this.sock) return
      try {
        await this.buildSocket()
      } catch (err) {
        console.error(`[device ${this.slug}] Gagal reconnect:`, err.message)
        this.scheduleReconnect()
      }
    }, backoff)
  }

  async handleIncoming(msg) {
    const jid = msg.key?.remoteJid || ''
    if (isJidBroadcast(jid) || isJidStatusBroadcast(jid)) return

    const isMensajeTexto =
      msg.message &&
      (msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption)

    if (!msg.key?.fromMe && isMensajeTexto) {
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption

      await notifier.message(this.slug, {
        fromJid: jid,
        from: phoneFromJid(jid),
        text,
        messageId: msg.key?.id || '',
        timestamp: msg.messageTimestamp ? new Date(Number(msg.messageTimestamp) * 1000).toISOString() : null,
      })
    }
  }

  /**
   * Antrian pengiriman aman: pesan diurutkan satu per satu, diberi jarak
   * minimal + jitter, dan dibatasi jumlahnya per menit/jam/hari agar
   * WhatsApp tidak menandai device sebagai spam.
   */
  enqueueSend(task) {
    return new Promise((resolve, reject) => {
      this.sendQueue.push({ task, resolve, reject })
      this.runQueue()
    })
  }

  async runQueue() {
    if (this.processingQueue) return
    this.processingQueue = true
    try {
      while (this.sendQueue.length) {
        const limit = this.rateLimit()
        if (!limit.ok) {
          await sleep(limit.waitMs + 1000)
          continue
        }

        const sinceLast = this.lastSendAt ? this.lastSendAt + config.send.minIntervalMs - Date.now() : 0
        const jitter = Math.floor(Math.random() * (config.send.jitterMs + 1))
        const delay = Math.max(0, sinceLast) + jitter
        if (delay > 0) await sleep(delay)

        const job = this.sendQueue.shift()
        this.sentAt.push(Date.now())
        if (this.sentAt.length > 10000) this.sentAt = this.sentAt.slice(-10000)
        this.lastSendAt = Date.now()

        try {
          job.resolve(await job.task())
        } catch (err) {
          job.reject(err)
        }
      }
    } finally {
      this.processingQueue = false
    }
  }

  rateLimit() {
    const now = Date.now()
    const windows = [
      { max: config.send.maxPerMinute, ms: 60_000 },
      { max: config.send.maxPerHour, ms: 3_600_000 },
      { max: config.send.maxPerDay, ms: 86_400_000 },
    ]
    for (const w of windows) {
      this.sentAt = this.sentAt.filter((t) => now - t < w.ms)
      if (this.sentAt.length >= w.max) {
        const waitMs = this.sentAt[0] + w.ms - now
        return { ok: false, waitMs }
      }
    }
    return { ok: true, waitMs: 0 }
  }

  estimatedSendWaitMs() {
    const limit = this.rateLimit()
    const avgPerItem = config.send.minIntervalMs + config.send.jitterMs
    const queueTotal = (this.sendQueue.length + 1) * avgPerItem
    return limit.waitMs + queueTotal
  }

  async sendText(to, message) {
    if (!this.sock || this.status !== 'connected') throw new Error('Device belum terhubung')
    const jid = `${formatPhone(to)}@s.whatsapp.net`
    await this.enqueueSend(() => this.sock.sendMessage(jid, { text: String(message) }))
    return { ok: true, jid }
  }

  async sendMedia(to, fileUrl, caption, type) {
    if (!this.sock || this.status !== 'connected') throw new Error('Device belum terhubung')
    const jid = `${formatPhone(to)}@s.whatsapp.net`
    const validType = ['image', 'video', 'document', 'audio'].includes(type) ? type : 'image'
    await this.enqueueSend(() =>
      this.sock.sendMessage(jid, {
        [validType]: { url: fileUrl },
        caption: caption || '',
      })
    )
    return { ok: true, jid }
  }

  async logout() {
    this.loggedOut = true
    if (this.connectTimer) clearTimeout(this.connectTimer)
    try {
      await this.sock?.logout()
    } catch {
      /* ignore */
    }
    this.sock = null
    this.status = 'disconnected'
    this.qr = null
    this.phone = null
    await notifier.status(this.slug, 'disconnected', { name: this.name, loggedOut: true })
  }
}

export const deviceManager = new DeviceManager()
export default deviceManager