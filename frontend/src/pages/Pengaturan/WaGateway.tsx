import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Power,
  QrCode,
  RefreshCw,
  Send,
  Settings,
  Smartphone,
  Star,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { waGatewayApi, waSettingApi } from '../../services/api'

type DeviceStatus = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'loggedOut'

interface GatewayDevice {
  slug: string
  name: string
  status: DeviceStatus
  qr?: string | null
  qrImage?: string | null
  phone?: string | null
  hasSession?: boolean
  lastConnectedAt?: string | null
}

interface GatewayStatus {
  online: boolean
  configured: boolean
  base_url: string
  default_device?: string | null
  devices: GatewayDevice[]
  message?: string
  gateway?: Record<string, unknown>
}

const statusMeta: Record<DeviceStatus, { label: string; className: string; dot: string }> = {
  connected: { label: 'Terhubung', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  qr: { label: 'Menunggu Scan QR', className: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  connecting: { label: 'Menghubungkan...', className: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  disconnected: { label: 'Terputus', className: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  loggedOut: { label: 'Logged Out', className: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return value
  }
}

export default function WaGateway() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [renamingSlug, setRenamingSlug] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const [qrModal, setQrModal] = useState<{
    open: boolean
    slug: string
    name: string
    status: DeviceStatus
    qrImage: string | null
    phone: string | null
  }>({ open: false, slug: '', name: '', status: 'connecting', qrImage: null, phone: null })

  const [testModal, setTestModal] = useState<{
    open: boolean
    slug: string
    name: string
    phone: string
    message: string
    sending: boolean
    result: { success: boolean; message: string } | null
  }>({ open: false, slug: '', name: '', phone: '', message: '', sending: false, result: null })

  const [busySlug, setBusySlug] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flashSuccess = (msg: string) => {
    setSuccess(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setSuccess(''), 3500)
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await waGatewayApi.status()
      setGateway(res.data)
      setError('')
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Gagal memuat status gateway')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const timer = setInterval(() => load(true), 5000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  // Polling QR selama modal scan terbuka
  useEffect(() => {
    if (!qrModal.open || !qrModal.slug) return
    let active = true
    const poll = async () => {
      try {
        const res = await waGatewayApi.qr(qrModal.slug)
        if (!active) return
        setQrModal((prev) => ({
          ...prev,
          status: res.data.status,
          qrImage: res.data.qrImage || null,
          phone: res.data.phone || null,
          name: res.data.name || prev.name,
        }))
        if (res.data.status === 'connected') {
          load(true)
        }
      } catch {
        /* abaikan error polling sementara */
      }
    }
    poll()
    const timer = setInterval(poll, 2500)
    return () => { active = false; clearInterval(timer) }
  }, [qrModal.open, qrModal.slug, load])

  const devices = gateway?.devices || []
  const connectedCount = devices.filter((d) => d.status === 'connected').length
  const qrCount = devices.filter((d) => d.status === 'qr').length
  const offlineCount = devices.filter((d) => d.status === 'disconnected' || d.status === 'loggedOut').length

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await waGatewayApi.create(newName.trim())
      const device: GatewayDevice | undefined = res.data?.device
      setShowAdd(false)
      setNewName('')
      flashSuccess('Device berhasil dibuat. Scan QR untuk menghubungkan.')
      await load(true)
      if (device?.slug) {
        setQrModal({ open: true, slug: device.slug, name: device.name || device.slug, status: 'connecting', qrImage: null, phone: null })
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Gagal membuat device')
    } finally {
      setCreating(false)
    }
  }

  const handleScan = async (device: GatewayDevice) => {
    setError('')
    setQrModal({
      open: true,
      slug: device.slug,
      name: device.name,
      status: device.status === 'qr' ? 'qr' : 'connecting',
      qrImage: device.qrImage || null,
      phone: device.phone || null,
    })
    if (device.status !== 'qr') {
      try {
        await waGatewayApi.reconnect(device.slug)
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.response?.data?.message || 'Gagal memulai sesi QR')
      }
    }
  }

  const handleReconnect = async (device: GatewayDevice) => {
    setBusySlug(device.slug)
    setError('')
    try {
      await waGatewayApi.reconnect(device.slug)
      await load(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || 'Gagal menghubungkan ulang device')
    } finally {
      setBusySlug(null)
    }
  }

  const handleRename = async (slug: string) => {
    if (!renameValue.trim()) return
    setBusySlug(slug)
    try {
      await waGatewayApi.rename(slug, renameValue.trim())
      setRenamingSlug(null)
      setRenameValue('')
      flashSuccess('Nama device diperbarui.')
      await load(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal mengubah nama device')
    } finally {
      setBusySlug(null)
    }
  }

  const handleLogout = async (device: GatewayDevice) => {
    if (!confirm(`Logout device "${device.name}"? Sesi WhatsApp akan dihapus dan perlu scan QR ulang.`)) return
    setBusySlug(device.slug)
    try {
      await waGatewayApi.logout(device.slug)
      flashSuccess(`Device "${device.name}" telah logout.`)
      await load(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal logout device')
    } finally {
      setBusySlug(null)
    }
  }

  const handleDelete = async (device: GatewayDevice) => {
    if (!confirm(`Hapus device "${device.name}" secara permanen?`)) return
    setBusySlug(device.slug)
    try {
      await waGatewayApi.destroy(device.slug)
      flashSuccess(`Device "${device.name}" dihapus.`)
      await load(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Gagal menghapus device')
    } finally {
      setBusySlug(null)
    }
  }

  const handleSetDefault = async (device: GatewayDevice) => {
    setBusySlug(device.slug)
    try {
      await waSettingApi.updateGlobalSettings([
        { key: 'wa_gateway_default_device', is_enabled: true, value: device.slug },
      ])
      flashSuccess(`Device "${device.name}" dijadikan device default pengiriman.`)
      await load(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menetapkan device default')
    } finally {
      setBusySlug(null)
    }
  }

  const openTest = (device: GatewayDevice) => {
    setTestModal({ open: true, slug: device.slug, name: device.name, phone: '', message: '', sending: false, result: null })
  }

  const handleSendTest = async () => {
    if (!testModal.phone.trim()) return
    setTestModal((m) => ({ ...m, sending: true, result: null }))
    try {
      await waGatewayApi.send(testModal.slug, {
        to: testModal.phone.trim(),
        message: testModal.message.trim() || '✅ Uji coba WhatsApp dari SIM Mendunia berhasil!',
      })
      setTestModal((m) => ({ ...m, sending: false, result: { success: true, message: `Pesan berhasil dikirim ke ${m.phone}` } }))
    } catch (err: any) {
      setTestModal((m) => ({
        ...m,
        sending: false,
        result: { success: false, message: err?.response?.data?.error || err?.response?.data?.message || 'Gagal mengirim pesan' },
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#0E6187]" size={32} />
      </div>
    )
  }

  const notConfigured = gateway && !gateway.configured

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#0E6187]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-medium text-slate-700">WhatsApp Gateway</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E6187]">
            <MessageCircle size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">WhatsApp Gateway</h1>
            <p className="text-sm text-slate-500">Hubungkan nomor WhatsApp dengan scan QR — tanpa API pihak ketiga</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            Muat Ulang
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2d4d]"
          >
            <Plus size={15} />
            Tambah Device
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {notConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> Gateway belum dikonfigurasi
          </div>
          <p className="mt-1 text-amber-700">
            Isi <span className="font-semibold">WA Gateway Base URL</span> dan <span className="font-semibold">Token</span> pada
            Pengaturan Notifikasi, lalu jalankan service <code className="rounded bg-amber-100 px-1">wa-gateway</code>.
          </p>
          <Link to="/notifikasi-wa-setting" className="mt-2 inline-flex items-center gap-1 font-medium text-[#0E6187] hover:underline">
            <Settings size={13} /> Buka Pengaturan Notifikasi
          </Link>
        </div>
      )}

      {/* Gateway status banner */}
      <div className={`rounded-2xl border p-4 ${gateway?.online ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${gateway?.online ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              {gateway?.online ? <Wifi size={20} className="text-emerald-600" /> : <WifiOff size={20} className="text-slate-400" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {gateway?.online ? 'Gateway Online' : 'Gateway Offline'}
              </p>
              <p className="text-xs text-slate-400 font-mono">{gateway?.base_url || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50 px-4 py-2">
              <p className="text-lg font-bold text-emerald-700">{connectedCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Terhubung</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-4 py-2">
              <p className="text-lg font-bold text-amber-700">{qrCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Menunggu QR</p>
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-2">
              <p className="text-lg font-bold text-slate-600">{offlineCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Offline</p>
            </div>
          </div>
        </div>
        {gateway?.message && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <AlertCircle size={13} /> {gateway.message}
          </p>
        )}
      </div>

      {/* Device list */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Daftar Device ({devices.length})</h2>
        </div>

        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Smartphone size={26} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">Belum ada device WhatsApp</p>
            <p className="max-w-sm text-xs text-slate-400">
              Tambahkan device, beri nama, lalu scan QR menggunakan aplikasi WhatsApp di ponsel Anda
              (Perangkat Tertaut → Tautkan Perangkat).
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2d4d]"
            >
              <Plus size={15} /> Tambah Device
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map((device) => {
              const meta = statusMeta[device.status] || statusMeta.disconnected
              const isBusy = busySlug === device.slug
              const isDefault = gateway?.default_device === device.slug
              return (
                <div key={device.slug} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-slate-50/60">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Smartphone size={20} className={device.status === 'connected' ? 'text-emerald-600' : 'text-slate-400'} />
                  </div>

                  <div className="min-w-[180px] flex-1">
                    {renamingSlug === device.slug ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(device.slug)}
                          className="w-48 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <button onClick={() => handleRename(device.slug)} disabled={isBusy}
                          className="rounded-lg bg-[#0E6187] px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                          Simpan
                        </button>
                        <button onClick={() => { setRenamingSlug(null); setRenameValue('') }}
                          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500">
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{device.name}</span>
                        {isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#0E6187]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0E6187]">
                            <Star size={10} /> Default
                          </span>
                        )}
                        <button
                          onClick={() => { setRenamingSlug(device.slug); setRenameValue(device.name) }}
                          className="text-slate-300 transition-colors hover:text-[#0E6187]"
                          title="Ubah nama"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    )}
                    <p className="mt-0.5 font-mono text-xs text-slate-400">
                      {device.slug}{device.phone ? ` • +${device.phone}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.className}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-slate-400">Terakhir: {formatDate(device.lastConnectedAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(device.status === 'qr' || !device.hasSession) && device.status !== 'connected' && (
                      <button onClick={() => handleScan(device)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">
                        <QrCode size={13} /> Scan QR
                      </button>
                    )}
                    {device.status !== 'connected' && device.hasSession && (
                      <button onClick={() => handleReconnect(device)} disabled={isBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                        {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} Sambungkan
                      </button>
                    )}
                    {device.status === 'connected' && (
                      <button onClick={() => openTest(device)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                        <Send size={13} /> Uji Kirim
                      </button>
                    )}
                    {device.status === 'connected' && !isDefault && (
                      <button onClick={() => handleSetDefault(device)} disabled={isBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        title="Jadikan device default pengiriman notifikasi">
                        <Star size={13} /> Default
                      </button>
                    )}
                    {device.hasSession && (
                      <button onClick={() => handleLogout(device)} disabled={isBusy}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        title="Logout & hapus sesi">
                        <Power size={13} /> Logout
                      </button>
                    )}
                    <button onClick={() => handleDelete(device)} disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      title="Hapus device">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        <p className="mb-1.5 font-medium">Cara menghubungkan WhatsApp:</p>
        <ol className="list-inside list-decimal space-y-1 text-xs">
          <li>Klik <span className="font-semibold">Tambah Device</span> dan beri nama (mis. "CS Mendunia").</li>
          <li>Scan QR yang muncul dengan WhatsApp di ponsel: <span className="font-medium">Pengaturan → Perangkat Tertaut → Tautkan Perangkat</span>.</li>
          <li>Setelah status <span className="font-semibold text-emerald-700">Terhubung</span>, jadikan device <span className="font-semibold">Default</span> agar semua notifikasi dikirim dari nomor tersebut.</li>
        </ol>
      </div>

      {/* Modal Tambah Device */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-800">Tambah Device WhatsApp</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Nama Device</label>
                <input
                  value={newName}
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Contoh: CS Mendunia, Admin Pusat"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0E6187]/20"
                />
                <p className="mt-1 text-xs text-slate-400">Nama ini hanya label internal untuk membedakan device.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button onClick={() => setShowAdd(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a2d4d] disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Buat & Tampilkan QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-800">Scan QR — {qrModal.name}</h3>
                <p className="text-xs text-slate-400">Slug: {qrModal.slug}</p>
              </div>
              <button onClick={() => setQrModal((m) => ({ ...m, open: false }))} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              {qrModal.status === 'connected' ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                  <p className="font-semibold text-slate-700">Device berhasil terhubung!</p>
                  <p className="text-xs text-slate-400">
                    {qrModal.phone ? `Nomor: +${qrModal.phone}` : 'Koneksi WhatsApp aktif.'}
                  </p>
                  <button onClick={() => setQrModal((m) => ({ ...m, open: false }))}
                    className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Selesai
                  </button>
                </div>
              ) : qrModal.qrImage ? (
                <>
                  <div className="rounded-2xl border-4 border-slate-100 p-2">
                    <img src={qrModal.qrImage} alt="QR WhatsApp" className="h-64 w-64" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                    <Loader2 size={13} className="animate-spin" />
                    Menunggu scan... QR diperbarui otomatis.
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Loader2 size={36} className="animate-spin text-[#0E6187]" />
                  <p className="text-sm text-slate-500">
                    {qrModal.status === 'connecting' ? 'Menyiapkan sesi & QR...' : 'Menunggu QR tersedia...'}
                  </p>
                </div>
              )}
              {qrModal.status !== 'connected' && (
                <div className="w-full rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  Buka WhatsApp → <span className="font-medium text-slate-600">Pengaturan</span> →
                  <span className="font-medium text-slate-600"> Perangkat Tertaut</span> →
                  <span className="font-medium text-slate-600"> Tautkan Perangkat</span>, lalu arahkan kamera ke QR di atas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Uji Kirim */}
      {testModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-slate-800">Uji Kirim WhatsApp</h3>
                <p className="text-xs text-slate-400">Device: {testModal.name}</p>
              </div>
              <button onClick={() => setTestModal((m) => ({ ...m, open: false }))} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Nomor Tujuan</label>
                <input
                  value={testModal.phone}
                  autoFocus
                  onChange={(e) => setTestModal((m) => ({ ...m, phone: e.target.value }))}
                  placeholder="628xxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0E6187]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Pesan (opsional)</label>
                <textarea
                  value={testModal.message}
                  onChange={(e) => setTestModal((m) => ({ ...m, message: e.target.value }))}
                  rows={3}
                  placeholder="✅ Uji coba WhatsApp dari SIM Mendunia berhasil!"
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0E6187]/20"
                />
              </div>
              {testModal.result && (
                <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                  testModal.result.success
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                  {testModal.result.success ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                  <span>{testModal.result.message}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button onClick={() => setTestModal((m) => ({ ...m, open: false }))}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Tutup
              </button>
              <button onClick={handleSendTest} disabled={testModal.sending || !testModal.phone.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {testModal.sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
