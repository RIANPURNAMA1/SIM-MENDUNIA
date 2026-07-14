import { useState, useEffect } from 'react'
import { MessageSquare, CheckCircle, XCircle, Clock, Search, RotateCcw, Send, Bell, Filter } from 'lucide-react'
import Swal from 'sweetalert2'
import { waNotificationApi } from '../../services/api'

interface NotificationItem {
  id: number
  pendaftar_id: number | null
  type: string
  to_phone: string
  message: string
  success: boolean
  error: string | null
  created_at: string
  pendaftar?: { nama: string; no_registrasi: string } | null
}

interface NotificationStats {
  total: number
  berhasil: number
  gagal: number
  hari_ini: number
  per_type: { type: string; total: number; berhasil: number }[]
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  new_bill: { label: 'Tagihan Baru', color: 'bg-blue-100 text-blue-700' },
  registration_approved: { label: 'Pendaftaran Disetujui', color: 'bg-indigo-100 text-indigo-700' },
  payment_success: { label: 'Pembayaran Berhasil', color: 'bg-emerald-100 text-emerald-700' },
  payment_verified: { label: 'Verifikasi Pembayaran', color: 'bg-emerald-100 text-emerald-700' },
  payment_rejected: { label: 'Pembayaran Ditolak', color: 'bg-red-100 text-red-700' },
  payment_partial: { label: 'Pembayaran Cicilan', color: 'bg-amber-100 text-amber-700' },
  full_payment: { label: 'Tagihan Lunas', color: 'bg-purple-100 text-purple-700' },
  reminder_h7: { label: 'Pengingat H-7', color: 'bg-sky-100 text-sky-700' },
  reminder_h3: { label: 'Pengingat H-3', color: 'bg-sky-100 text-sky-700' },
  reminder_h1: { label: 'Pengingat H-1', color: 'bg-orange-100 text-orange-700' },
  reminder_overdue: { label: 'Pengingat Jatuh Tempo', color: 'bg-red-100 text-red-700' },
  payment_to_admin: { label: 'Notif ke Admin', color: 'bg-slate-100 text-slate-600' },
}

export default function DataNotifikasi() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [page, filterType])

  function fetchData() {
    setLoading(true)
    const params: Record<string, string | number> = { page }
    if (search) params.search = search
    if (filterType) params.type = filterType
    waNotificationApi.list(params).then(res => {
      setNotifications(res.data.data)
      setTotalPages(res.data.last_page)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  function fetchStats() {
    waNotificationApi.stats().then(res => setStats(res.data)).catch(() => {})
  }

  function handleSearch() {
    setPage(1)
    fetchData()
  }

  function resetFilter() {
    setSearch('')
    setFilterType('')
    setPage(1)
  }

  function sendReminder(pendaftarId: number) {
    Swal.fire({
      title: 'Kirim Pengingat?',
      text: 'Kirim ulang pengingat pembayaran via WhatsApp',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0D1F3C',
      confirmButtonText: 'Kirim',
    }).then(result => {
      if (result.isConfirmed) {
        waNotificationApi.sendReminder(pendaftarId).then(res => {
          Swal.fire({ icon: 'success', title: 'Terkirim!', text: res.data.message, timer: 2000, showConfirmButton: false })
          fetchData()
          fetchStats()
        }).catch(() => {
          Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengirim pengingat' })
        })
      }
    })
  }

  const typeBadge = (type: string) => {
    const t = TYPE_LABELS[type] || { label: type, color: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.color}`}>{t.label}</span>
  }

  const statusIcon = (success: boolean) => {
    return success
      ? <CheckCircle size={14} className="text-emerald-500" />
      : <XCircle size={14} className="text-red-500" />
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Notifikasi WhatsApp</h1>
            <p className="text-sm text-slate-500">Riwayat pengiriman notifikasi pembayaran</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-slate-400" />
              <span className="text-xs text-slate-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-xs text-slate-500">Berhasil</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.berhasil}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-red-500" />
              <span className="text-xs text-slate-500">Gagal</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.gagal}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-500" />
              <span className="text-xs text-slate-500">Hari Ini</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.hari_ini}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1) }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Tipe</option>
              {Object.entries(TYPE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button onClick={resetFilter}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium w-[40px]">#</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Kandidat</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Tipe</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Ke</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Status</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Waktu</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C]" />
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-200 px-6 py-10 text-center text-sm text-slate-400">
                    Belum ada notifikasi
                  </td>
                </tr>
              ) : (
                notifications.map((n, i) => (
                  <tr key={n.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-500">
                      {(page - 1) * 25 + i + 1}
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-800">{n.pendaftar?.nama || '-'}</div>
                      <div className="text-[10px] text-slate-400">{n.pendaftar?.no_registrasi || '-'}</div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">{typeBadge(n.type)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{n.to_phone}</td>
                    <td className="border border-slate-200 px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {statusIcon(n.success)}
                        <span className={`text-xs font-semibold ${n.success ? 'text-emerald-600' : 'text-red-600'}`}>
                          {n.success ? 'Terkirim' : 'Gagal'}
                        </span>
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 max-w-[300px]">
                      <p className="text-xs text-slate-500 truncate" title={n.message}>{n.message.substring(0, 80)}...</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-xs text-slate-500">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
