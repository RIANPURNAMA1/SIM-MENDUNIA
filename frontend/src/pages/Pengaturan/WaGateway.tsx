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

const statusMeta: Record<DeviceStatus, { label: string; className: string }> = {
  connected: { label: 'Terhubung', className: 'bg-[#137333]' },
  qr: { label: 'Menunggu Scan QR', className: 'bg-[#e37400]' },
  connecting: { label: 'Menghubungkan...', className: 'bg-[#1a73e8]' },
  disconnected: { label: 'Terputus', className: 'bg-[#9aa0a6]' },
  loggedOut: { label: 'Logged Out', className: 'bg-[#c5221f]' },
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
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const notConfigured = gateway && !gateway.configured

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">WhatsApp Gateway</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">WhatsApp Gateway</h1>
            <p className="text-sm text-[#5f6368]">Hubungkan nomor WhatsApp dengan scan QR — tanpa API pihak ketiga</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Muat Ulang
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
          >
            <Plus size={16} />
            Tambah Device
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="mb-4 flex items-start gap-3 border border-[#b7e1c1] bg-[#e6f4ea] p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#ceead6]">
            <CheckCircle2 size={16} className="text-[#137333]" />
          </div>
          <p className="pt-1.5 text-sm font-medium text-[#137333]">{success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-start gap-3 border border-[#f6aea9] bg-[#fce8e6] p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f6d7d5]">
            <AlertCircle size={16} className="text-[#c5221f]" />
          </div>
          <p className="pt-1.5 text-sm font-medium text-[#c5221f]">{error}</p>
        </div>
      )}

      {notConfigured && (
        <div className="mb-4 flex items-start gap-3 border border-[#fdd663] bg-[#fef7e0] p-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#feefc3]">
            <AlertCircle size={16} className="text-[#b06000]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#8f4b00]">Gateway belum dikonfigurasi</p>
            <p className="mt-0.5 text-xs text-[#b06000]">
              Isi <span className="font-semibold">WA Gateway Base URL</span> dan <span className="font-semibold">Token</span> pada
              Pengaturan Notifikasi, lalu jalankan service <code className="bg-[#feefc3] px-1">wa-gateway</code>.
            </p>
            <Link to="/notifikasi-wa-setting" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1967d2] hover:underline">
              <Settings size={13} /> Buka Pengaturan Notifikasi
            </Link>
          </div>
        </div>
      )}

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {([
          { label: 'Status Gateway', value: gateway?.online ? 'Online' : 'Offline', icon: gateway?.online ? Wifi : WifiOff, chip: gateway?.online ? 'bg-[#137333]' : 'bg-[#9aa0a6]', hint: gateway?.base_url || '-' },
          { label: 'Total Device', value: devices.length, icon: Smartphone, chip: 'bg-[#0E6187]', hint: 'terdaftar di gateway' },
          { label: 'Terhubung', value: connectedCount, icon: CheckCircle2, chip: 'bg-[#137333]', hint: 'siap kirim pesan' },
          { label: 'Menunggu QR', value: qrCount, icon: QrCode, chip: 'bg-[#e37400]', hint: 'perlu scan manual' },
          { label: 'Offline', value: offlineCount, icon: Power, chip: 'bg-[#5f6368]', hint: 'terputus / logout' },
        ] as const).map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="border border-[#dadce0] bg-white p-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center text-white ${s.chip}`}>
                  <Icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-[#5f6368]">{s.label}</p>
                  <p className="truncate text-[10px] text-[#80868b]">{s.hint}</p>
                </div>
              </div>
              <p className="mt-2 truncate text-xl font-bold text-[#202124]">{s.value}</p>
            </div>
          )
        })}
      </div>

      {gateway?.message && (
        <div className="mb-4 flex items-start gap-3 border border-[#dadce0] bg-[#f8f9fa] p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f1f3f4]">
            <AlertCircle size={16} className="text-[#5f6368]" />
          </div>
          <p className="pt-1.5 text-xs text-[#5f6368]">{gateway.message}</p>
        </div>
      )}

      {/* Table Device */}
      <div className="overflow-x-auto border border-[#dadce0] bg-white">
        <table className="w-full border-collapse text-left text-sm text-black" style={{ tableLayout: 'fixed', minWidth: '1000px' }}>
          <colgroup>
            <col className="w-[260px]" />
            <col className="w-[180px]" />
            <col className="w-[140px]" />
            <col className="w-[100px]" />
            <col className="w-[170px]" />
            <col className="w-[330px]" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Device</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Status</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Nomor</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Default</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Terakhir Connect</th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                    <Smartphone size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada device WhatsApp</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs text-[#80868b]">
                    Tambahkan device, beri nama, lalu scan QR menggunakan aplikasi WhatsApp di ponsel Anda
                    (Perangkat Tertaut → Tautkan Perangkat).
                  </p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="mt-3 inline-flex items-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]"
                  >
                    <Plus size={15} /> Tambah Device
                  </button>
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const meta = statusMeta[device.status] || statusMeta.disconnected
                const isBusy = busySlug === device.slug
                const isDefault = gateway?.default_device === device.slug
                return (
                  <tr key={device.slug} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      {renamingSlug === device.slug ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={renameValue}
                            autoFocus
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(device.slug)}
                            className="w-40 border border-[#dadce0] bg-white px-2 py-1.5 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8]"
                          />
                          <button onClick={() => handleRename(device.slug)} disabled={isBusy}
                            className="bg-[#0E6187] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50">
                            Simpan
                          </button>
                          <button onClick={() => { setRenamingSlug(null); setRenameValue('') }}
                            className="border border-[#dadce0] bg-white px-2.5 py-1.5 text-xs text-[#3c4043] transition hover:bg-[#f8f9fa]">
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#f1f3f4] text-[#5f6368]">
                            <Smartphone size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-[#202124]">{device.name}</span>
                              <button
                                onClick={() => { setRenamingSlug(device.slug); setRenameValue(device.name) }}
                                className="shrink-0 text-[#9aa0a6] transition-colors hover:text-[#1a73e8]"
                                title="Ubah nama"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                            <div className="truncate font-mono text-xs text-[#80868b]">{device.slug}</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold text-white ${meta.className}`}>
                        <span className="h-1.5 w-1.5 shrink-0 bg-white/90" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      <span className="block truncate font-mono text-xs text-black">
                        {device.phone ? `+${device.phone}` : <span className="text-[#80868b]">-</span>}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      {isDefault ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap bg-[#e8f0fe] px-2 py-1 text-[11px] font-semibold text-[#1967d2]">
                          <Star size={11} /> Default
                        </span>
                      ) : (
                        <span className="text-[#80868b]">-</span>
                      )}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-sm whitespace-nowrap text-black">
                      {formatDate(device.lastConnectedAt)}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(device.status === 'qr' || !device.hasSession) && device.status !== 'connected' && (
                          <button onClick={() => handleScan(device)}
                            className="inline-flex items-center gap-1.5 bg-[#e37400] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#c26500]">
                            <QrCode size={13} /> Scan QR
                          </button>
                        )}
                        {device.status !== 'connected' && device.hasSession && (
                          <button onClick={() => handleScan(device)} disabled={isBusy}
                            className="inline-flex items-center gap-1.5 border border-[#aecbfa] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1967d2] transition hover:bg-[#e8f0fe] disabled:opacity-50">
                            {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} Sambungkan
                          </button>
                        )}
                        {device.status === 'connected' && (
                          <button onClick={() => openTest(device)}
                            className="inline-flex items-center gap-1.5 bg-[#137333] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#0d5c28]">
                            <Send size={13} /> Uji Kirim
                          </button>
                        )}
                        {device.status === 'connected' && !isDefault && (
                          <button onClick={() => handleSetDefault(device)} disabled={isBusy}
                            className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] disabled:opacity-50"
                            title="Jadikan device default pengiriman notifikasi">
                            <Star size={13} /> Default
                          </button>
                        )}
                        {device.hasSession && (
                          <button onClick={() => handleLogout(device)} disabled={isBusy}
                            className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3c4043] transition hover:bg-[#f8f9fa] disabled:opacity-50"
                            title="Logout & hapus sesi">
                            <Power size={13} /> Logout
                          </button>
                        )}
                        <button onClick={() => handleDelete(device)} disabled={isBusy}
                          className="inline-flex items-center justify-center border border-[#f6aea9] bg-white p-1.5 text-[#c5221f] transition hover:bg-[#fce8e6] disabled:opacity-50"
                          title="Hapus device">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
          Total {devices.length} device &middot; {connectedCount} terhubung &middot; {offlineCount} offline
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 border border-[#aecbfa] bg-[#e8f0fe] p-4">
        <p className="text-sm font-semibold text-[#174ea6]">Cara menghubungkan WhatsApp:</p>
        <ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs text-[#174ea6]">
          <li>Klik <span className="font-semibold">Tambah Device</span> dan beri nama (mis. &quot;CS Mendunia&quot;).</li>
          <li>Scan QR yang muncul dengan WhatsApp di ponsel: <span className="font-semibold">Pengaturan → Perangkat Tertaut → Tautkan Perangkat</span>.</li>
          <li>Setelah status <span className="font-semibold">Terhubung</span>, jadikan device <span className="font-semibold">Default</span> agar semua notifikasi dikirim dari nomor tersebut.</li>
        </ol>
      </div>

      {/* Modal Tambah Device */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md border border-[#dadce0] bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e8eaed] px-5 py-3.5">
              <h3 className="text-sm font-semibold text-[#202124]">Tambah Device WhatsApp</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 transition-colors hover:bg-[#f1f3f4]">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#3c4043]">Nama Device</label>
                <input
                  value={newName}
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Contoh: CS Mendunia, Admin Pusat"
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
                />
                <p className="mt-1 text-xs text-[#80868b]">Nama ini hanya label internal untuk membedakan device.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e8eaed] px-5 py-3.5">
              <button onClick={() => setShowAdd(false)}
                className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Batal
              </button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()}
                className="inline-flex items-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Buat & Tampilkan QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR */}
      {qrModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setQrModal((m) => ({ ...m, open: false }))}>
          <div className="w-full max-w-md border border-[#dadce0] bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e8eaed] px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-[#202124]">Scan QR — {qrModal.name}</h3>
                <p className="font-mono text-xs text-[#80868b]">Slug: {qrModal.slug}</p>
              </div>
              <button onClick={() => setQrModal((m) => ({ ...m, open: false }))} className="p-1.5 transition-colors hover:bg-[#f1f3f4]">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 px-5 py-6">
              {qrModal.status === 'connected' ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center bg-[#ceead6]">
                    <CheckCircle2 size={28} className="text-[#137333]" />
                  </div>
                  <p className="text-sm font-semibold text-[#202124]">Device berhasil terhubung!</p>
                  <p className="text-xs text-[#80868b]">
                    {qrModal.phone ? `Nomor: +${qrModal.phone}` : 'Koneksi WhatsApp aktif.'}
                  </p>
                  <button onClick={() => setQrModal((m) => ({ ...m, open: false }))}
                    className="mt-2 bg-[#137333] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d5c28]">
                    Selesai
                  </button>
                </div>
              ) : qrModal.qrImage ? (
                <>
                  <div className="border border-[#dadce0] p-2">
                    <img src={qrModal.qrImage} alt="QR WhatsApp" className="h-64 w-64" />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#b06000]">
                    <Loader2 size={13} className="animate-spin" />
                    Menunggu scan... QR diperbarui otomatis.
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Loader2 size={36} className="animate-spin text-[#1a73e8]" />
                  <p className="text-sm text-[#5f6368]">
                    {qrModal.status === 'connecting' ? 'Menyiapkan sesi & QR...' : 'Menunggu QR tersedia...'}
                  </p>
                </div>
              )}
              {qrModal.status !== 'connected' && (
                <div className="w-full bg-[#f8f9fa] px-4 py-3 text-xs text-[#5f6368]">
                  Buka WhatsApp → <span className="font-semibold text-[#3c4043]">Pengaturan</span> →
                  <span className="font-semibold text-[#3c4043]"> Perangkat Tertaut</span> →
                  <span className="font-semibold text-[#3c4043]"> Tautkan Perangkat</span>, lalu arahkan kamera ke QR di atas.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Uji Kirim */}
      {testModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-4" onClick={() => setTestModal((m) => ({ ...m, open: false }))}>
          <div className="w-full max-w-md border border-[#dadce0] bg-white" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e8eaed] px-5 py-3.5">
              <div>
                <h3 className="text-sm font-semibold text-[#202124]">Uji Kirim WhatsApp</h3>
                <p className="text-xs text-[#80868b]">Device: {testModal.name}</p>
              </div>
              <button onClick={() => setTestModal((m) => ({ ...m, open: false }))} className="p-1.5 transition-colors hover:bg-[#f1f3f4]">
                <X size={18} className="text-[#80868b]" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#3c4043]">Nomor Tujuan</label>
                <input
                  value={testModal.phone}
                  autoFocus
                  onChange={(e) => setTestModal((m) => ({ ...m, phone: e.target.value }))}
                  placeholder="628xxxxxxxxxx"
                  className="w-full border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#3c4043]">Pesan (opsional)</label>
                <textarea
                  value={testModal.message}
                  onChange={(e) => setTestModal((m) => ({ ...m, message: e.target.value }))}
                  rows={3}
                  placeholder="✅ Uji coba WhatsApp dari SIM Mendunia berhasil!"
                  className="w-full resize-none border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
                />
              </div>
              {testModal.result && (
                <div className={`flex items-start gap-2 border p-3 text-sm ${
                  testModal.result.success
                    ? 'border-[#b7e1c1] bg-[#e6f4ea] text-[#137333]'
                    : 'border-[#f6aea9] bg-[#fce8e6] text-[#c5221f]'
                }`}>
                  {testModal.result.success ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                  <span>{testModal.result.message}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e8eaed] px-5 py-3.5">
              <button onClick={() => setTestModal((m) => ({ ...m, open: false }))}
                className="border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Tutup
              </button>
              <button onClick={handleSendTest} disabled={testModal.sending || !testModal.phone.trim()}
                className="inline-flex items-center gap-2 bg-[#137333] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0d5c28] disabled:opacity-50">
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