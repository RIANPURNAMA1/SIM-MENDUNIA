import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, Plus, X, CalendarCheck, ChevronLeft } from 'lucide-react'
import api, { gajiApi, guruProfileApi, izinSenseiApi } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

  interface PengajuanGajiItem {
  id: number
  user: { id: number; name: string; email: string }
  bulan: string | null
  tahun: number | null
  jumlah: number | null
  keterangan: string | null
  no_req_list?: string[] | null
  status: string
  catatan: string | null
  ringkasan_kehadiran?: {
    total_kelas?: number
    kehadiran_bulan_ini?: number
    kelas_aktif?: { nama_batch?: string; nama_kelas?: string; level?: string | number; periode?: string }[]
    riwayat?: { tanggal: string; status: string; jam_masuk?: string | null; jam_keluar?: string | null }[]
    riwayat_izin?: { jenis_izin: string; tgl_mulai: string; tgl_selesai: string; status: string; alasan?: string | null; kelas?: string | null; pengganti?: string | null }[]
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
  kelas_id?: number | null
  pertemuan_ke?: number | null
}

interface RiwayatIzinItem {
  id: number
  jenis_izin: string
  tgl_mulai: string
  tgl_selesai: string
  alasan: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  nama_pengganti: string | null
  pengganti?: { id: number; name: string } | null
  kelas?: {
    nama_kelas: string
    level?: string | number
    batch_relasi?: { nama_batch: string } | null
  } | null
}

const jenisIzinLabel: Record<string, string> = {
  IZIN_PRIBADI: 'Izin Pribadi',
  SAKIT: 'Sakit',
  URUSAN_KELUARGA: 'Urusan Keluarga',
  DINAS_LEMBAGA: 'Dinas Lembaga',
  IZIN_MENDADAK: 'Izin Mendadak',
}

const statusIzinStyle: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
}

const statusIzinLabel: Record<string, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
}

function formatPeriodeIzin(mulai: string, selesai: string) {
  const pendek = (v: string) =>
    new Date(`${v}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  return mulai === selesai ? pendek(mulai) : `${pendek(mulai)} – ${pendek(selesai)}`
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
  const [noReqInputs, setNoReqInputs] = useState<string[]>([''])
  const [rekeningOptions, setRekeningOptions] = useState<any[]>([])
  const [selectedRekeningIdx, setSelectedRekeningIdx] = useState<number>(-1)
  const [ringkasan, setRingkasan] = useState<DashboardRingkasan | null>(null)
  const [ringkasanLoading, setRingkasanLoading] = useState(false)
  const [riwayatAll, setRiwayatAll] = useState<RiwayatAbsensiRow[]>([])
  const [riwayatIzin, setRiwayatIzin] = useState<RiwayatIzinItem[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null)
  const [selectedKelasName, setSelectedKelasName] = useState<string | null>(null)
  const [currentUserRekening, setCurrentUserRekening] = useState<any[]>([])

  useEffect(() => {
    if (!showModal) return
    setRingkasan(null)
    setRiwayatAll([])
    setRiwayatIzin([])
    setSelectedKelasId(null)
    setSelectedKelasName(null)
    setGajiForm({ keterangan: '' })
    setNoReqInputs([''])
    setSelectedRekeningIdx(-1)
    setRekeningOptions([])
    guruProfileApi.profile().then(res => {
      const u = res.data?.user || res.data
      const rl = Array.isArray(u?.rekening_list) ? u.rekening_list : []
      setRekeningOptions(rl)
      setCurrentUserRekening(rl)
    }).catch(() => {})
    setRingkasanLoading(true)
    izinSenseiApi.list({ my: true, per_page: 10 })
      .then(res => setRiwayatIzin(res.data?.data ?? []))
      .catch(() => setRiwayatIzin([]))
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
              kelas: group.kelas?.batch_relasi?.nama_batch || group.kelas?.nama_kelass || '-',
              kelas_id: group.kelas?.id ?? null,
              pertemuan_ke: a.pertemuan_ke ?? null,
            })
          }
        }
        rows.sort((a, b) => {
          const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
          if (dateDiff !== 0) return dateDiff
          const aPertemuan = a.pertemuan_ke ?? 0
          const bPertemuan = b.pertemuan_ke ?? 0
          return aPertemuan - bPertemuan
        })
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
    const allRows = riwayatAll.length > 0 ? riwayatAll : (ringkasan?.riwayat_sensei ?? [])
    const rows = selectedKelasId !== null
      ? allRows.filter(r => (r as RiwayatAbsensiRow).kelas_id === selectedKelasId)
      : allRows
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

    const filteredNoReq = noReqInputs.map(v => v.trim()).filter(v => v !== '')
    const selectedRek = selectedRekeningIdx >= 0 ? rekeningOptions[selectedRekeningIdx] : null
    const noReqHtml = filteredNoReq.length > 0 || selectedRek
      ? `<div class="border border-gray-200 rounded-lg overflow-hidden text-left mb-3">
           <div class="px-3 py-2 bg-gray-50 text-[11px] font-bold text-gray-600 uppercase">Data Rekening</div>
           ${selectedRek ? `<div class="px-3 py-2 text-xs text-gray-700 border-t border-gray-100">${[selectedRek.nama_rekening, selectedRek.no_rekening, selectedRek.bank].filter(Boolean).join(' - ')}</div>` : ''}
           ${filteredNoReq.length > 0 && !selectedRek ? filteredNoReq.map(n => `<div class="px-3 py-2 text-xs text-gray-700 border-t border-gray-100">${n}</div>`).join('') : ''}
         </div>`
      : ''

    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Ajukan Pengajuan Gaji?',
      html: `
        <p class="text-sm text-gray-600 mb-3">Yakin ingin mengajukan gaji? Berikut ringkasan absensi Anda yang akan ikut terkirim:</p>
        ${noReqHtml}
        <div class="border border-gray-200 rounded-lg overflow-hidden text-left">
          ${statRow('Hadir', s.hadir)}
          ${statRow('Terlambat', s.terlambat)}
          ${statRow('Tidak Absen Pulang', s.tidakAbsenPulang)}
          ${statRow('Alpa', s.alpa)}
          ${statRow('Izin', s.izin)}
          ${statRow('Total Absensi', s.total)}
          ${statRow('Riwayat Pengajuan Izin', riwayatIzin.length)}
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
      if (selectedKelasId) fd.append('selected_kelas_id', String(selectedKelasId))
      if (selectedKelasName) fd.append('selected_kelas_name', selectedKelasName)
      const noReqToSend = selectedRekeningIdx >= 0 && rekeningOptions[selectedRekeningIdx]
        ? [`${rekeningOptions[selectedRekeningIdx].nama_rekening || ''} ${rekeningOptions[selectedRekeningIdx].no_rekening || ''} ${rekeningOptions[selectedRekeningIdx].bank || ''}`.trim()]
        : noReqInputs.map(v => v.trim()).filter(v => v !== '')
      if (noReqToSend.length > 0) {
        fd.append('no_req_list', JSON.stringify(noReqToSend))
      }
      if (ringkasan) {
        fd.append('ringkasan_kehadiran', JSON.stringify({
          total_kelas: ringkasan.total_kelas,
          kehadiran_bulan_ini: ringkasan.kehadiran_bulan_ini,
          kelas_aktif: ringkasan.kelas_aktif.map(k => ({
            id: k.id,
            nama_batch: k.batch_relasi?.nama_batch || k.nama_kelas,
            level: k.level,
            periode: `${k.tanggal_mulai_formatted || k.tanggal_mulai} – ${k.tanggal_selesai_formatted || k.tanggal_selesai}`,
          })),
          riwayat: (selectedKelasId !== null
            ? riwayatAll.filter(r => (r as RiwayatAbsensiRow).kelas_id === selectedKelasId)
            : riwayatAll
          ).map(r => ({
            id: r.id,
            tanggal: r.tanggal,
            status: r.status,
            jam_masuk: r.jam_masuk,
            jam_keluar: r.jam_keluar,
            pertemuan_ke: (r as RiwayatAbsensiRow).pertemuan_ke ?? null,
            kelas_id: (r as RiwayatAbsensiRow).kelas_id ?? null,
            kelas: r.kelas,
          })),
          riwayat_izin: riwayatIzin.map(i => ({
            id: i.id,
            jenis_izin: i.jenis_izin,
            tgl_mulai: i.tgl_mulai,
            tgl_selesai: i.tgl_selesai,
            status: i.status,
            alasan: i.alasan,
            kelas: i.kelas ? (i.kelas.batch_relasi?.nama_batch || i.kelas?.nama_kelas) : null,
            pengganti: i.nama_pengganti || i.pengganti?.name || null,
          })),
        }))
      }
      await gajiApi.store(fd)
              setGajiForm({ keterangan: '' })
              setNoReqInputs([''])
              setSelectedRekeningIdx(-1)
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
                       <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Data Rekening</th>
                  <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Status</th>
                  <th className="text-xs font-medium text-[#8B90A0] px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="h-3 bg-[#E5E7EF] w-full animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
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
                      </td>
                      <td className="border-t border-[#E5E7EF] px-4 py-3 text-sm max-w-[200px] truncate">
                        {item.keterangan || '-'}
                      </td>
                      <td className="border-t border-[#E5E7EF] px-4 py-3 text-sm">
                        {(() => {
                          const nr = Array.isArray((item as any).no_req_list) ? (item as any).no_req_list.filter(Boolean) : []
                          if (nr.length > 0) return nr.join(', ')
                          const rl = (item as any).user?.rekening_list || currentUserRekening
                          if (Array.isArray(rl) && rl.length > 0) {
                            const r = rl[0]
                            const s = [r?.nama_rekening, r?.no_rekening, r?.bank].filter(Boolean).join(' - ')
                            if (s) return s
                          }
                          return '-'
                        })()}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg mx-3 bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Ajukan Gaji</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleKirimGaji} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                           <th colSpan={3} className="text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Pilih Kelas</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr>
                           <td colSpan={3} className="border border-[#E5E7EF] px-3 py-2">
                             <select
                               value={selectedKelasId ?? ''}
                               onChange={e => {
                                 const val = e.target.value ? Number(e.target.value) : null
                                 setSelectedKelasId(val)
                                 const selected = ringkasan?.kelas_aktif.find(k => k.id === val)
                                 setSelectedKelasName(selected ? (selected.batch_relasi?.nama_batch || selected.nama_kelas) : null)
                               }}
                               className="w-full border border-[#E5E7EF] bg-white px-3 py-2 text-[11px] text-[#3c4043] outline-none focus:border-[#0069b0] rounded-lg"
                             >
                               <option value="">-- Pilih Kelas Aktif --</option>
                               {ringkasan.kelas_aktif.map(k => (
                                 <option key={k.id} value={k.id}>
                                   {k.batch_relasi?.nama_batch || k.nama_kelas} (Level {k.level})
                                 </option>
                               ))}
                             </select>
                           </td>
                         </tr>
                         {selectedKelasId && (
                           <tr>
                             <td className="border border-[#E5E7EF] px-3 py-2 text-[11px] text-[#8B90A0]">
                               Periode: {ringkasan.kelas_aktif.find(k => k.id === selectedKelasId)?.tanggal_mulai_formatted || ringkasan.kelas_aktif.find(k => k.id === selectedKelasId)?.tanggal_mulai} – {ringkasan.kelas_aktif.find(k => k.id === selectedKelasId)?.tanggal_selesai_formatted || ringkasan.kelas_aktif.find(k => k.id === selectedKelasId)?.tanggal_selesai}
                             </td>
                           </tr>
                         )}
                       </tbody>
                     </table>

                    <div className="max-h-56 overflow-y-auto overflow-x-auto border border-t-0 border-[#E5E7EF] rounded-b-lg">
                    <table className="w-full border-collapse text-left text-sm text-[#3c4043] bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Tanggal</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 text-center bg-[#FAFBFD]">Pertemuan</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Jam Masuk</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Jam Keluar</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 text-center bg-[#FAFBFD]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedKelasId === null ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-[11px] text-[#8B90A0] text-center border-b border-[#E5E7EF]">Silakan pilih kelas terlebih dahulu untuk melihat riwayat kehadiran</td>
                          </tr>
                        ) : riwayatAll.filter(r => (r as RiwayatAbsensiRow).kelas_id === selectedKelasId).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-[11px] text-[#8B90A0] text-center border-b border-[#E5E7EF]">Belum ada riwayat absensi untuk kelas ini</td>
                          </tr>
                        ) : (
                          riwayatAll.filter(r => (r as RiwayatAbsensiRow).kelas_id === selectedKelasId).map(r => (
                            <tr key={r.id} className="border-b border-[#E5E7EF]">
                              <td className="px-3 py-2 text-[11px] font-semibold text-[#14182B] whitespace-nowrap">{formatTanggalRiwayat(r.tanggal)}</td>
                              <td className="px-3 py-2 text-[11px] text-center whitespace-nowrap">
                                <span className="inline-flex px-1.5 py-0.5 rounded bg-[#E8F0FE] text-[#0069b0] text-[9px] font-bold">
                                  {r.pertemuan_ke ? `Ke-${r.pertemuan_ke}` : '—'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] text-[#3c4043] tabular-nums">{r.jam_masuk ? r.jam_masuk.slice(0, 5) : '—'}</td>
                              <td className="px-3 py-2 text-[11px] text-[#3c4043] tabular-nums">{r.jam_keluar ? r.jam_keluar.slice(0, 5) : '—'}</td>
                              <td className="px-3 py-2 text-center">
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

                  <div className="max-h-40 overflow-y-auto overflow-x-auto border border-t-0 border-[#E5E7EF] rounded-b-lg">
                    <table className="w-full border-collapse text-left text-sm text-[#3c4043] bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Jenis</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Periode</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Kelas</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 bg-[#FAFBFD]">Pengganti</th>
                          <th className="text-[10px] font-medium text-[#8B90A0] border border-[#E5E7EF] px-3 py-1.5 text-center bg-[#FAFBFD]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riwayatIzin.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-[11px] text-[#8B90A0] text-center border-b border-[#E5E7EF]">Belum ada riwayat izin</td>
                          </tr>
                        ) : (
                          riwayatIzin.map(i => (
                            <tr key={i.id} className="border-b border-[#E5E7EF]">
                              <td className="px-3 py-2 text-[11px] font-semibold text-[#14182B] whitespace-nowrap">
                                {jenisIzinLabel[i.jenis_izin] || i.jenis_izin}
                              </td>
                              <td className="px-3 py-2 text-[11px] text-[#3c4043] whitespace-nowrap">
                                {formatPeriodeIzin(i.tgl_mulai, i.tgl_selesai)}
                              </td>
                              <td className="px-3 py-2 text-[11px] text-[#3c4043] truncate max-w-[80px]">
                                {i.kelas ? (i.kelas.batch_relasi?.nama_batch || i.kelas.nama_kelas) : '—'}
                              </td>
                              <td className="px-3 py-2 text-[11px] text-[#3c4043] truncate max-w-[80px]">
                                {i.nama_pengganti || i.pengganti?.name || <span className="text-[#8B90A0]">—</span>}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex px-1.5 py-0.5 rounded border text-[9px] font-bold ${statusIzinStyle[i.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                  {statusIzinLabel[i.status] || i.status}
                                </span>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Rekening <span className="text-gray-400">(Opsional)</span></label>
                {rekeningOptions.length > 0 ? (
                  <select
                    value={selectedRekeningIdx}
                    onChange={e => setSelectedRekeningIdx(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  >
                    <option value={-1}>Pilih Rekening</option>
                    {rekeningOptions.map((r, idx) => {
                      const label = [r.nama_rekening, r.no_rekening, r.bank].filter(Boolean).join(' - ')
                      return <option key={idx} value={idx}>{label || `Rekening ${idx + 1}`}</option>
                    })}
                  </select>
                ) : (
                  <div className="space-y-2">
                    {noReqInputs.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={val}
                          onChange={e => {
                            const next = [...noReqInputs]
                            next[idx] = e.target.value
                            setNoReqInputs(next)
                          }}
                          placeholder="Masukkan Data Rekening"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                        />
                        {noReqInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setNoReqInputs(noReqInputs.filter((_, i) => i !== idx))}
                            className="rounded-lg border border-gray-300 px-2 py-2 text-gray-500 hover:bg-gray-50"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNoReqInputs([...noReqInputs, ''])}
                      className="text-xs font-semibold text-[#0069b0] hover:text-[#004d7a]"
                    >
                      + Tambah Rekening
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data Rekening <span className="text-gray-400">(Opsional)</span></label>
                <div className="space-y-2">
                  {noReqInputs.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={val}
                        onChange={e => {
                          const next = [...noReqInputs]
                          next[idx] = e.target.value
                          setNoReqInputs(next)
                        }}
                        placeholder="Masukkan No. Req"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                      />
                      {noReqInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNoReqInputs(noReqInputs.filter((_, i) => i !== idx))}
                          className="rounded-lg border border-gray-300 px-2 py-2 text-gray-500 hover:bg-gray-50"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNoReqInputs([...noReqInputs, ''])}
                    className="text-xs font-semibold text-[#0069b0] hover:text-[#004d7a]"
                  >
                    + Tambah No. Req
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan <span className="text-gray-400">(Opsional)</span></label>
                <textarea value={gajiForm.keterangan} onChange={e => setGajiForm(f => ({ ...f, keterangan: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0] resize-none" rows={3} placeholder="Tambahkan keterangan jika diperlukan..." />
              </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-white px-5 py-3.5 shrink-0">
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