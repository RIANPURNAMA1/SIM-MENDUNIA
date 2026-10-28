import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, Plus, X, CalendarCheck, ChevronLeft } from 'lucide-react'
import api, { gajiApi } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

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
    riwayat?: { tanggal: string; status: string; jam_masuk?: string | null; jam_keluar?: string | null }[]
  } | null
  created_at: string
  updated_at: string
}

interface DashboardRingkasan {
  total_kelas: number
  kehadiran_bulan_ini: number
  kelas_aktif: {
    id: number
    nama_kelas: string
    level: string | number
    tanggal_mulai: string
    tanggal_selesai: string
    tanggal_mulai_formatted?: string
    tanggal_selesai_formatted?: string
    batch_relasi?: { id: number; nama_batch: string } | null
  }[]
  riwayat_sensei: {
    id: number
    tanggal: string
    jam_masuk: string | null
    jam_keluar: string | null
    status: string
    kelas_sensei?: { nama_kelas: string; level?: number; batch_relasi?: { nama_batch: string } | null } | null
  }[]
}

interface RiwayatAbsensiRow {
  id: number
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  kelas: string
  pertemuan_ke?: number | null
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function formatTanggalRiwayat(dateStr: string) {
  const d = new Date(dateStr)
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(d)} ${d.getFullYear()}`
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

export default function GuruPengajuanGaji() {
  const navigate = useNavigate()
  const [data, setData] = useState<PengajuanGajiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [gajiForm, setGajiForm] = useState({ keterangan: '' })
  const [gajiSaving, setGajiSaving] = useState(false)
  const [ringkasan, setRingkasan] = useState<DashboardRingkasan | null>(null)
  const [ringkasanLoading, setRingkasanLoading] = useState(false)
  const [riwayatAll, setRiwayatAll] = useState<RiwayatAbsensiRow[]>([])

  useEffect(() => {
    if (!showModal) return
    setRingkasan(null)
    setRiwayatAll([])
    setRingkasanLoading(true)
    api.get('/guru-dashboard')
      .then(res => {
        setRingkasan(res.data)
        return api.get('/kehadiran-sensei', { params: { user_id: res.data.user?.id, start_date: '2020-01-01' } })
      })
      .then(res => {
        const rows: RiwayatAbsensiRow[] = []
        const groups = res.data?.data || []
        for (const group of (Array.isArray(groups) ? groups : [])) {
          for (const a of group.absensis || []) {
            rows.push({
              id: a.id,
              tanggal: a.tanggal,
              jam_masuk: a.jam_masuk,
              jam_keluar: a.jam_keluar,
              status: a.status,
              kelas: group.kelas?.batch_relasi?.nama_batch || group.kelas?.nama_kelas || '-',
              pertemuan_ke: a.pertemuan_ke ?? null,
            })
          }
        }
        rows.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        setRiwayatAll(rows)
      })
      .catch(() => setRingkasan(null))
      .finally(() => setRingkasanLoading(false))
  }, [showModal])

  const fetchData = useCallback((p = page) => {
    setLoading(true)
    const params: Record<string, string | number | undefined> = { page: p, per_page: 15, my: 'true' }
    if (filterStatus) params.status = filterStatus
    if (search) params.search = search
    gajiApi.list(params)
      .then(res => {
        setData(res.data.data || res.data || [])
        setTotalPages(res.data.last_page || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, filterStatus, search])

  useEffect(() => { fetchData(1) }, [fetchData, filterStatus, search])

  const hitungStatusAbsensi = () => {
    const rows = riwayatAll.length > 0 ? riwayatAll : (ringkasan?.riwayat_sensei ?? [])
    const count = (statuses: string[]) =>
      rows.filter(r => statuses.includes((r.status || '').toUpperCase())).length
    return {
      hadir: count(['HADIR']),
      terlambat: count(['TERLAMBAT']),
      tidakAbsenPulang: count(['TIDAK ABSEN PULANG']),
      alpa: count(['ALPA']),
      izin: count(['IZIN', 'IZIN DISETUJUI']),
      total: rows.length,
    }
  }

  const handleKirimGaji = async (e: React.FormEvent) => {
    e.preventDefault()

    const s = hitungStatusAbsensi()
    const statRow = (label: string, value: number) =>
      `<div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0">
        <span class="text-xs text-gray-600">${label}</span>
        <span class="text-sm font-semibold text-gray-900">${value}</span>
      </div>`

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Ajukan Pengajuan Gaji?',
      html: `
        <p class="text-sm text-gray-600 mb-3">Yakin ingin mengajukan gaji? Berikut ringkasan absensi Anda yang akan ikut terkirim:</p>
        <div class="border border-gray-200 rounded-lg overflow-hidden text-left">
          ${statRow('Hadir', s.hadir)}
          ${statRow('Terlambat', s.terlambat)}
          ${statRow('Tidak Absen Pulang', s.tidakAbsenPulang)}
          ${statRow('Alpa', s.alpa)}
          ${statRow('Izin', s.izin)}
          ${statRow('Total Absensi', s.total)}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ya, Ajukan Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0069b0',
      cancelButtonColor: '#9CA3AF',
    })
    if (!confirm.isConfirmed) return

    setGajiSaving(true)
    try {
      const fd = new FormData()
      if (gajiForm.keterangan) fd.append('keterangan', gajiForm.keterangan)
      if (ringkasan) {
        fd.append('ringkasan_kehadiran', JSON.stringify({
          total_kelas: ringkasan.total_kelas,
          kehadiran_bulan_ini: ringkasan.kehadiran_bulan_ini,
          kelas_aktif: ringkasan.kelas_aktif.map(k => ({
            nama_batch: k.batch_relasi?.nama_batch || k.nama_kelas,
            level: k.level,
            periode: `${k.tanggal_mulai_formatted || k.tanggal_mulai} – ${k.tanggal_selesai_formatted || k.tanggal_selesai}`,
          })),
          riwayat: (riwayatAll.length > 0 ? riwayatAll : ringkasan.riwayat_sensei).map(r => ({
            tanggal: r.tanggal,
            status: r.status,
            jam_masuk: r.jam_masuk,
            jam_keluar: r.jam_keluar,
            pertemuan_ke: (r as RiwayatAbsensiRow).pertemuan_ke ?? null,
          })),
        }))
      }
      await gajiApi.store(fd)
      setGajiForm({ keterangan: '' })
      setShowModal(false)
      await Swal.fire({
        icon: 'success',
        title: 'Pengajuan Gaji Terkirim!',
        html: '<p class="text-sm text-gray-600">Selamat! Pengajuan gaji Anda sedang diajukan.<br/>Mohon tunggu proses review & persetujuan dari admin.</p>',
        confirmButtonColor: '#0069b0',
        confirmButtonText: 'Baik, Mengerti',
      })
      fetchData(1)
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal mengajukan gaji'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setGajiSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 rounded-lg hover:bg-[#F4F5F8] transition-colors"
              title="Kembali"
            >
              <ChevronLeft size={20} className="text-[#4B5063]" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368] rounded-lg">
              <Banknote size={20} />
            </div>
            <div>
              <h1 className="text-xl font-medium text-[#202124]">Pengajuan Gaji</h1>
              <p className="text-sm text-[#5f6368]">Kelola pengajuan gaji Anda</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-[#0069b0] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#004d7a]"
          >
            <Plus size={16} />
            Ajukan Gaji
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-[#E5E7EF] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-[#E5E7EF] pb-4">
            <div className="flex flex-wrap gap-2">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-[#E5E7EF] bg-white px-3 py-2 text-sm text-[#3c4043] outline-none focus:border-[#0069b0] rounded-lg"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="diproses">Diproses</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Cari keterangan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full border border-[#E5E7EF] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#8B90A0] focus:border-[#0069b0] rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
              <thead className="text-sm text-[#8B90A0]">
                <tr>
                  <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Bulan / Tahun</th>
                  <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Keterangan</th>
                  <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Status</th>
                  <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="h-3 bg-[#E5E7EF] w-full animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#F4F5F8] text-[#8B90A0]">
                        <Banknote size={24} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-[#8B90A0]">
                        {search ? 'Pengajuan tidak ditemukan' : 'Belum ada pengajuan gaji'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item.id} className="bg-white transition hover:bg-[#FAFBFD]">
                      <td className="border-t border-[#E5E7EF] px-4 py-3 text-sm whitespace-nowrap">
                        <p className="text-xs font-medium text-[#14182B]">
                          {item.bulan ?? '-'} {item.tahun ?? ''}
                        </p>
                        <p className="text-[10px] text-[#8B90A0]">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="border-t border-[#E5E7EF] px-4 py-3 text-sm max-w-[200px] truncate">
                        {item.keterangan || '-'}
                      </td>
                      <td className="border-t border-[#E5E7EF] px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle[item.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}
                        >
                          {statusLabel[item.status] || item.status}
                        </span>
                        {item.catatan && (
                          <p className="text-[10px] text-[#8B90A0] mt-1 truncate max-w-[150px]">{item.catatan}</p>
                        )}
                      </td>
                      <td className="border-t border-[#E5E7EF] px-4 py-3 text-center text-[10px] text-[#8B90A0]">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#8B90A0]">Halaman {page} dari {totalPages}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => { setPage(p => Math.max(1, p - 1)); fetchData(Math.max(1, page - 1)) }}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-[#E5E7EF] text-[#8B90A0] hover:bg-[#F4F5F8] disabled:opacity-50 rounded-lg"
                >
                  Prev
                </button>
                <button
                  onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchData(Math.min(totalPages, page + 1)) }}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm border border-[#E5E7EF] text-[#8B90A0] hover:bg-[#F4F5F8] disabled:opacity-50 rounded-lg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajukan Gaji */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg mx-3 bg-white rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Ajukan Gaji</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleKirimGaji} className="p-5 space-y-4">
              <div className="rounded-xl border border-[#E5E7EF] bg-[#FAFBFD] overflow-hidden">
                <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
                  <CalendarCheck size={14} className="text-[#0069b0]" />
                  <p className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Riwayat Kehadiran Anda</p>
                  <p className="text-[10px] text-[#8B90A0] ml-auto">Ikut terkirim saat pengajuan</p>
                </div>

                {ringkasanLoading ? (
                  <div className="px-4 pb-3.5 space-y-2">
                    <div className="h-3 bg-[#E5E7EF] rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-[#E5E7EF] rounded w-1/2 animate-pulse" />
                  </div>
                ) : ringkasan ? (
                  <div className="px-4 pb-3.5 space-y-3">
                    <table className="w-full border-collapse text-left text-sm text-[#3c4043] bg-white rounded-lg">
                      <tbody>
                        <tr>
                          <td className="border border-[#E5E7EF] px-3 py-2 text-[11px] font-medium text-[#8B90A0] w-1/2">Kehadiran Bulan Ini</td>
                          <td className="border border-[#E5E7EF] px-3 py-2 text-[11px] font-bold text-[#0069b0]">{ringkasan.kehadiran_bulan_ini} hari absen</td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="w-full border-collapse text-left text-sm text-[#3c4043] bg-white rounded-lg">
                      <thead>
                        <tr>
                          <th colSpan={3} className="text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Kelas Hari Ini</th>
                        </tr>
                        <tr>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5">Kelas</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5">Level</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5">Periode</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ringkasan.kelas_aktif.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="border border-[#E5E7EF] px-3 py-2 text-[11px] text-[#8B90A0] text-center">Tidak ada kelas aktif hari ini</td>
                          </tr>
                        ) : (
                          ringkasan.kelas_aktif.map(k => (
                            <tr key={k.id}>
                              <td className="border border-[#E5E7EF] px-3 py-2 text-[11px] font-semibold text-[#14182B] truncate max-w-[140px]">{k.batch_relasi?.nama_batch || k.nama_kelas}</td>
                              <td className="border border-[#E5E7EF] px-3 py-2 text-[11px] font-semibold text-[#0069b0]">Level {k.level}</td>
                              <td className="border border-[#E5E7EF] px-3 py-2 text-[11px] text-[#3c4043] whitespace-nowrap">
                                {k.tanggal_mulai_formatted || k.tanggal_mulai} – {k.tanggal_selesai_formatted || k.tanggal_selesai}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <table className="w-full border-collapse text-left text-sm text-[#3c4043] bg-white rounded-lg">
                      <thead>
                        <tr>
                          <th colSpan={5} className="text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Riwayat Absensi</th>
                        </tr>
                        <tr>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5">Tanggal</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 text-center">Pertemuan</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5">Jam Masuk</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5">Jam Keluar</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 text-center">Status</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="max-h-56 overflow-y-auto border border-t-0 border-[#E5E7EF] rounded-b-lg">
                      <table className="w-full border-collapse text-left text-sm text-[#3c4043] bg-white">
                        <tbody>
                          {riwayatAll.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-3 py-3 text-[11px] text-[#8B90A0] text-center">Belum ada riwayat absensi</td>
                            </tr>
                          ) : (
                            riwayatAll.map(r => (
                              <tr key={r.id}>
                                <td className="border-b border-[#E5E7EF] px-3 py-2 text-[11px] font-semibold text-[#14182B] whitespace-nowrap">{formatTanggalRiwayat(r.tanggal)}</td>
                                <td className="border-b border-[#E5E7EF] px-3 py-2 text-[11px] text-center whitespace-nowrap">
                                  <span className="inline-flex px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#0069b0] text-[9px] font-bold">
                                    {r.pertemuan_ke ? `Ke-${r.pertemuan_ke}` : '—'}
                                  </span>
                                </td>
                                <td className="border-b border-[#E5E7EF] px-3 py-2 text-[11px] text-[#3c4043] tabular-nums">{r.jam_masuk ? r.jam_masuk.slice(0, 5) : '—'}</td>
                                <td className="border-b border-[#E5E7EF] px-3 py-2 text-[11px] text-[#3c4043] tabular-nums">{r.jam_keluar ? r.jam_keluar.slice(0, 5) : '—'}</td>
                                <td className="border-b border-[#E5E7EF] px-3 py-2 text-center">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    r.status === 'HADIR' ? 'bg-[#DCFCE7] text-[#15803D]' :
                                    r.status === 'TERLAMBAT' ? 'bg-[#FEF3C7] text-[#B45309]' :
                                    r.status === 'LIBUR' ? 'bg-[#F0F1F5] text-[#6B7280]' :
                                    'bg-[#FEE2E2] text-[#B91C1C]'
                                  }`}>{r.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="px-4 pb-3.5 text-xs text-[#8B90A0]">Data kehadiran tidak tersedia</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan <span className="text-gray-400">(Opsional)</span></label>
                <textarea value={gajiForm.keterangan} onChange={e => setGajiForm(f => ({ ...f, keterangan: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0] resize-none" rows={3} placeholder="Tambahkan keterangan jika diperlukan..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                  Batal
                </button>
                <button type="submit" disabled={gajiSaving}
                  className="rounded-lg bg-[#0069b0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                  {gajiSaving ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <KaryawanBottomNav
        activeTab="home"
        absenStatus="belum"
        hasJadwal={false}
        homeHref="/guru-dashboard"
        jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard"
        profilHref="/guru-profil"
      />
    </div>
  )
}