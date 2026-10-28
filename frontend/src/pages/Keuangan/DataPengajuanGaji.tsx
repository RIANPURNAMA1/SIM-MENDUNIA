import { useState, useEffect, useCallback } from 'react'
import {
  Banknote, User, Clock, CheckCircle2, X, Search, Eye, CalendarCheck, Info,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react'
import { gajiApi } from '../../services/api'
import Swal from 'sweetalert2'

interface PengajuanGajiItem {
  id: number
  user: { id: number; name: string; email: string }
  bulan: string | null
  tahun: number | null
  jumlah: number | null
  keterangan: string | null
  status: string
  catatan: string | null
  ringkasan_kehadiran?: {
    total_kelas?: number
    kehadiran_bulan_ini?: number
    kelas_aktif?: { nama_batch?: string; nama_kelas?: string; level?: string | number; periode?: string }[]
    riwayat?: { tanggal: string; status: string; jam_masuk?: string | null; jam_keluar?: string | null; pertemuan_ke?: number | null }[]
  } | null
  created_at: string
  updated_at: string
}

const statusStyle: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  disetujui: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  ditolak: 'bg-red-50 text-red-600 border-red-200',
  diproses: 'bg-blue-50 text-blue-600 border-blue-200',
}

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  diproses: 'Diproses',
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function formatTanggalRiwayat(dateStr: string) {
  const d = new Date(dateStr)
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(d)} ${d.getFullYear()}`
}

export default function DataPengajuanGaji() {
  const [data, setData] = useState<PengajuanGajiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [perPage, setPerPage] = useState(15)

  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [detailItem, setDetailItem] = useState<PengajuanGajiItem | null>(null)
  const [infoDismissed, setInfoDismissed] = useState(false)

  const pendingCount = data.filter(d => d.status === 'pending').length

  const fetchData = useCallback((p = page) => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: p, per_page: perPage }
    if (filterStatus) params.status = filterStatus
    if (search) params.search = search
    gajiApi.list(params)
      .then(res => {
        setData(res.data.data || res.data || [])
        setTotalPages(res.data.last_page || 1)
        setTotalItems(res.data.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, perPage, filterStatus, search])

  useEffect(() => { fetchData(1) }, [filterStatus, search, perPage])

  const safePage = Math.min(Math.max(1, page), totalPages || 1)

  const handleSetStatus = async (id: number, status: string) => {
    const confirm = await Swal.fire({
      title: status === 'disetujui' ? 'Setujui pengajuan gaji ini?' : 'Tolak pengajuan gaji ini?',
      text: status === 'disetujui' ? 'Data akan ditandai sebagai disetujui.' : 'Data akan ditandai sebagai ditolak.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: status === 'disetujui' ? 'Ya, setujui' : 'Ya, tolak',
      cancelButtonText: 'Batal',
    })
    if (!confirm.isConfirmed) return

    setSavingId(id)
    try {
      await gajiApi.updateStatus(id, { status })
      setData(prev => prev.map(item =>
        item.id === id ? { ...item, status } : item
      ))
      Swal.fire({
        icon: 'success',
        title: status === 'disetujui' ? 'Disetujui' : 'Ditolak',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal mengubah status' })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-3 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Banknote size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Pengajuan Gaji</h1>
            <p className="text-sm text-[#5f6368]">{totalItems} total pengajuan</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-[#dadce0] bg-white px-2 py-2 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="diproses">Diproses</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input
              type="text"
              placeholder="Cari nama guru..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8]"
            />
          </div>
        </div>
      </div>

      {!infoDismissed && pendingCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Info size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {pendingCount} pengajuan gaji baru menunggu tindakan Anda
              </p>
              <p className="mt-0.5 text-xs text-amber-700">Ikuti langkah berikut pada kolom Aksi:</p>
              <ul className="mt-1.5 space-y-1 text-xs text-amber-800">
                <li className="flex items-center gap-2">
                  <Eye size={13} className="shrink-0 text-amber-600" />
                  <span><strong>Lihat detail</strong> — cek riwayat absensi & kehadiran guru sebelum memutuskan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
                  <span><strong>Setujui</strong> — pengajuan ditandai disetujui</span>
                </li>
                <li className="flex items-center gap-2">
                  <X size={13} className="shrink-0 text-red-600" />
                  <span><strong>Tolak</strong> — pengajuan ditandai ditolak</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock size={13} className="shrink-0 text-slate-500" />
                  <span><strong>Kembalikan</strong> — ubah status kembali ke Menunggu</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setInfoDismissed(true)}
              className="rounded p-1 text-amber-500 transition hover:bg-amber-100 hover:text-amber-700"
              title="Tutup info"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-[#dadce0] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm text-black">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th scope="col" className="border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368]">Guru</th>
                <th scope="col" className="border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368]">Bulan / Tahun</th>
                <th scope="col" className="border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368]">Keterangan</th>
                <th scope="col" className="border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Status</th>
                <th scope="col" className="border-b border-[#e8eaed] px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="h-3 bg-[#e8eaed] w-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <Banknote size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">
                      {search ? 'Pengajuan tidak ditemukan' : 'Belum ada pengajuan gaji'}
                    </p>
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="bg-white transition hover:bg-[#f8f9fa] group">
                    <td className="border-b border-[#e8eaed] px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#f1f3f4] flex items-center justify-center text-[#5f6368] flex-none">
                          <User size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-black truncate">{item.user?.name || '-'}</div>
                          <div className="text-[10px] text-[#80868b] truncate">{item.user?.email || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-black">
                        {item.bulan ?? '-'} {item.tahun ?? ''}
                      </div>
                      <div className="text-[10px] text-[#80868b]">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-xs text-black max-w-[220px]">
                      <div className="truncate" title={item.keterangan || ''}>{item.keterangan || '-'}</div>
                      {item.ringkasan_kehadiran && (
                        <div className="mt-1 text-[10px] text-[#80868b]">
                          <span className="font-medium text-[#5f6368]">Hadir {item.ringkasan_kehadiran.kehadiran_bulan_ini ?? 0} hari bulan ini</span>
                          {item.ringkasan_kehadiran.kelas_aktif?.map((k, i) => (
                            <p key={i} className="truncate">
                              {k.nama_batch || k.nama_kelas || '-'} · Level {k.level} · {k.periode || ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle[item.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}
                      >
                        {statusLabel[item.status] || item.status}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="p-1.5 text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
                          title="Lihat detail & riwayat absensi"
                        >
                          <Eye size={15} />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleSetStatus(item.id, 'disetujui')}
                              disabled={savingId === item.id}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                              title="Setujui"
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            <button
                              onClick={() => handleSetStatus(item.id, 'ditolak')}
                              disabled={savingId === item.id}
                              className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                              title="Tolak"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                        {item.status !== 'pending' && (
                          <button
                            onClick={() => handleSetStatus(item.id, 'pending')}
                            disabled={savingId === item.id}
                            className="p-1.5 text-[#80868b] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors"
                            title="Kembalikan ke menunggu"
                          >
                            <Clock size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#dadce0] px-4 py-3 text-sm text-[#5f6368]">
          Menampilkan {data.length} dari {totalItems} pengajuan
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalItems > 0 && (
        <div className="mt-4 flex flex-col gap-3 border border-[#dadce0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm text-[#5f6368]">
            <span className="text-xs font-medium">Per halaman</span>
            <div className="relative">
              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="appearance-none border border-[#dadce0] bg-[#f8f9fa] px-7 py-1.5 text-sm font-medium text-[#3c4043] outline-none transition focus:border-[#1a73e8] focus:bg-white"
              >
                {[10, 15, 25, 50].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#80868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setPage(1); fetchData(1) }}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => { const p = Math.max(1, safePage - 1); setPage(p); fetchData(p) }}
              disabled={safePage <= 1}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft size={15} />
            </button>
            {(() => {
              const pages: (number | '...')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (safePage > 3) pages.push('...')
                const start = Math.max(2, safePage - 1)
                const end = Math.min(totalPages - 1, safePage + 1)
                for (let i = start; i <= end; i++) pages.push(i)
                if (safePage < totalPages - 2) pages.push('...')
                pages.push(totalPages)
              }
              return pages.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1.5 text-sm text-[#9aa0a6]">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => { setPage(p); fetchData(p) }}
                    className={`min-w-[34px] border px-3 py-1.5 text-sm font-medium transition ${p === safePage ? 'border-[#1a73e8] bg-[#0E6187] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa] hover:text-[#202124]'}`}
                  >
                    {p}
                  </button>
                )
              )
            })()}
            <button
              onClick={() => { const p = Math.min(totalPages, safePage + 1); setPage(p); fetchData(p) }}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => { setPage(totalPages); fetchData(totalPages) }}
              disabled={safePage >= totalPages}
              className="border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#5f6368] disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/50 p-2 sm:p-4" onClick={() => setDetailItem(null)}>
          <div className="border border-[#dadce0] flex w-full max-w-3xl max-h-[calc(100vh-1rem)] flex-col bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#dadce0] px-4 py-3 sm:items-center sm:px-6 sm:py-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <div className="h-9 w-9 shrink-0 bg-[#0E6187] flex items-center justify-center sm:h-10 sm:w-10">
                  <span className="text-sm font-bold text-white">{(detailItem.user?.name || '?').charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[#202124] sm:text-base">{detailItem.user?.name || '-'}</h2>
                  <p className="truncate text-xs text-[#5f6368]">{detailItem.user?.email || '-'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold sm:ml-2 ${statusStyle[detailItem.status] || 'border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]'}`}>
                  {statusLabel[detailItem.status] || detailItem.status}
                </span>
              </div>
              <button onClick={() => setDetailItem(null)} className="shrink-0 p-1.5 hover:bg-[#f1f3f4] transition"><X size={18} className="text-[#80868b]" /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {/* Info Pengajuan */}
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <InfoItem label="Guru" value={detailItem.user?.name} />
                <InfoItem label="Email" value={detailItem.user?.email} />
                <InfoItem label="Bulan / Tahun" value={`${detailItem.bulan ?? '-'} ${detailItem.tahun ?? ''}`.trim()} />
                <InfoItem label="Keterangan" value={detailItem.keterangan} />
              </div>

              {/* Riwayat Kehadiran */}
              <div className="mt-5 border border-[#dadce0] bg-[#f8f9fa] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarCheck size={14} className="text-[#0E6187]" />
                  <h3 className="text-xs font-bold text-[#5f6368]">Riwayat Kehadiran</h3>
                </div>

                {detailItem.ringkasan_kehadiran ? (
                  <div className="space-y-4">
                    <InfoItem label="Kehadiran Bulan Ini" value={`${detailItem.ringkasan_kehadiran.kehadiran_bulan_ini ?? 0} hari absen`} />

                    {detailItem.ringkasan_kehadiran.kelas_aktif && detailItem.ringkasan_kehadiran.kelas_aktif.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-[#5f6368]">Kelas</p>
                        <div className="overflow-x-auto border border-[#dadce0] bg-white">
                          <table className="w-full min-w-[420px] border-collapse text-left text-xs text-[#3c4043]">
                            <thead>
                              <tr className="bg-[#f8f9fa]">
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">Kelas</th>
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">Level</th>
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">Periode</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailItem.ringkasan_kehadiran.kelas_aktif.map((k, i) => (
                                <tr key={i} className="bg-white transition hover:bg-[#f8f9fa]">
                                  <td className="border-b border-[#e8eaed] px-3 py-2 font-medium text-black">{k.nama_batch || k.nama_kelas || '-'}</td>
                                  <td className="border-b border-[#e8eaed] px-3 py-2 text-black">Level {k.level}</td>
                                  <td className="border-b border-[#e8eaed] px-3 py-2 whitespace-nowrap text-black">{k.periode || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {detailItem.ringkasan_kehadiran.riwayat && detailItem.ringkasan_kehadiran.riwayat.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-medium text-[#5f6368]">Riwayat Absensi</p>
                        <div className="overflow-x-auto border border-[#dadce0] bg-white">
                          <table className="w-full min-w-[560px] border-collapse text-left text-xs text-[#3c4043]">
                            <thead>
                              <tr className="bg-[#f8f9fa]">
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">Tanggal</th>
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368] text-center">Pertemuan</th>
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">Masuk</th>
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368]">Keluar</th>
                                <th className="border-b border-[#dadce0] px-3 py-2 font-semibold text-[#5f6368] text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detailItem.ringkasan_kehadiran.riwayat.map((r, i) => (
                                <tr key={i} className="bg-white transition hover:bg-[#f8f9fa]">
                                  <td className="border-b border-[#e8eaed] px-3 py-2 font-medium text-black whitespace-nowrap">{formatTanggalRiwayat(r.tanggal)}</td>
                                  <td className="border-b border-[#e8eaed] px-3 py-2 text-center whitespace-nowrap">
                                    <span className="inline-flex px-1.5 py-0.5 bg-[#e8f0fe] text-[#1a73e8] text-[10px] font-bold">
                                      {r.pertemuan_ke ? `Ke-${r.pertemuan_ke}` : '—'}
                                    </span>
                                  </td>
                                  <td className="border-b border-[#e8eaed] px-3 py-2 text-black tabular-nums">{r.jam_masuk ? r.jam_masuk.slice(0, 5) : '—'}</td>
                                  <td className="border-b border-[#e8eaed] px-3 py-2 text-black tabular-nums">{r.jam_keluar ? r.jam_keluar.slice(0, 5) : '—'}</td>
                                  <td className="border-b border-[#e8eaed] px-3 py-2 text-center">
                                    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold ${
                                      r.status === 'HADIR' ? 'bg-[#e6f4ea] text-[#137333]' :
                                      r.status === 'TERLAMBAT' ? 'bg-[#fef7e0] text-[#b06000]' :
                                      r.status === 'LIBUR' ? 'bg-[#f1f3f4] text-[#5f6368]' :
                                      'bg-[#fce8e6] text-[#d93025]'
                                    }`}>{r.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#80868b]">Belum ada data absensi.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#80868b]">Belum ada data kehadiran.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  const show = value !== null && value !== undefined && value !== '' && value !== '-'
  return (
    <div>
      <p className="text-xs font-medium text-[#80868b]">{label}</p>
      <p className={`text-sm font-medium ${show ? 'text-[#202124]' : 'text-[#9aa0a6]'}`}>
        {show ? value : '-'}
      </p>
    </div>
  )
}
