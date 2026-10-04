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
  new_bill: { label: 'Tagihan Baru', color: 'bg-[#d2e3fc] text-[#1967d2]' },
  registration_approved: { label: 'Pendaftaran Disetujui', color: 'bg-[#d2e3fc] text-[#1967d2]' },
  payment_success: { label: 'Pembayaran Berhasil', color: 'bg-[#ceead6] text-[#137333]' },
  payment_verified: { label: 'Verifikasi Pembayaran', color: 'bg-[#ceead6] text-[#137333]' },
  payment_rejected: { label: 'Pembayaran Ditolak', color: 'bg-[#f6d7d5] text-[#a50e0e]' },
  payment_partial: { label: 'Pembayaran Cicilan', color: 'bg-[#feefc3] text-[#b06000]' },
  full_payment: { label: 'Tagihan Lunas', color: 'bg-[#f3e8fd] text-[#7627bb]' },
  reminder_h7: { label: 'Pengingat H-7', color: 'bg-[#d2e3fc] text-[#1967d2]' },
  reminder_h3: { label: 'Pengingat H-3', color: 'bg-[#d2e3fc] text-[#1967d2]' },
  reminder_h1: { label: 'Pengingat H-1', color: 'bg-[#feefc3] text-[#b06000]' },
  reminder_overdue: { label: 'Pengingat Jatuh Tempo', color: 'bg-[#f6d7d5] text-[#a50e0e]' },
  payment_to_admin: { label: 'Notif ke Admin', color: 'bg-[#f1f3f4] text-[#5f6368]' },
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
      confirmButtonColor: '#0E6187',
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
    const t = TYPE_LABELS[type] || { label: type, color: 'bg-[#f1f3f4] text-[#5f6368]' }
    return <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold ${t.color}`}>{t.label}</span>
  }

  const statusIcon = (success: boolean) => {
    return success
      ? <CheckCircle size={14} className="text-[#188038]" />
      : <XCircle size={14} className="text-[#d93025]" />
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <MessageSquare size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Notifikasi WhatsApp</h1>
            <p className="text-sm text-[#5f6368]">Riwayat pengiriman notifikasi pembayaran</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#dadce0] p-4 ">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-[#80868b]" />
              <span className="text-xs text-[#5f6368]">Total</span>
            </div>
            <p className="text-2xl font-bold text-[#202124]">{stats.total}</p>
          </div>
          <div className="bg-white border border-[#dadce0] p-4 ">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-[#188038]" />
              <span className="text-xs text-[#5f6368]">Berhasil</span>
            </div>
            <p className="text-2xl font-bold text-[#137333]">{stats.berhasil}</p>
          </div>
          <div className="bg-white border border-[#dadce0] p-4 ">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={16} className="text-[#d93025]" />
              <span className="text-xs text-[#5f6368]">Gagal</span>
            </div>
            <p className="text-2xl font-bold text-[#c5221f]">{stats.gagal}</p>
          </div>
          <div className="bg-white border border-[#dadce0] p-4 ">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-[#1a73e8]" />
              <span className="text-xs text-[#5f6368]">Hari Ini</span>
            </div>
            <p className="text-2xl font-bold text-[#202124]">{stats.hari_ini}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 border border-[#dadce0] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama atau nomor HP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#80868b]" />
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1) }}
              className="border border-[#dadce0] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:border-[#1a73e8]"
            >
              <option value="">Semua Tipe</option>
              {Object.entries(TYPE_LABELS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <button onClick={resetFilter}
              className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-[#dadce0] bg-white ">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 w-[40px] text-center">#</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Kandidat</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Tipe</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Ke</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Status</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Waktu</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8]/10 border-t-[#1a73e8]" />
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    Belum ada notifikasi
                  </td>
                </tr>
              ) : (
                notifications.map((n, i) => (
                  <tr key={n.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm text-[#5f6368]">
                      {(page - 1) * 25 + i + 1}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <div className="text-sm font-semibold text-[#202124]">{n.pendaftar?.nama || '-'}</div>
                      <div className="text-[10px] text-[#80868b]">{n.pendaftar?.no_registrasi || '-'}</div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3">{typeBadge(n.type)}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">{n.to_phone}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        {statusIcon(n.success)}
                        <span className={`text-xs font-semibold ${n.success ? 'text-[#137333]' : 'text-[#c5221f]'}`}>
                          {n.success ? 'Terkirim' : 'Gagal'}
                        </span>
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368] whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 max-w-[300px]">
                      <p className="text-xs text-[#5f6368] truncate" title={n.message}>{n.message.substring(0, 80)}...</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#dadce0] px-4 py-3">
            <span className="text-xs text-[#5f6368]">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                className="border border-[#dadce0] px-3 py-1 text-xs font-medium text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                className="border border-[#dadce0] px-3 py-1 text-xs font-medium text-[#5f6368] transition hover:bg-[#f8f9fa] disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
