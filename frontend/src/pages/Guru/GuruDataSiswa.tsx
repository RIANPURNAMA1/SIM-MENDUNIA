import { useState, useEffect } from 'react'
import { BookOpen, Users, ChevronLeft, Calendar, X, Check, Minus } from 'lucide-react'
import { guruKelasApi, absensiSiswaApi, penilaianApi } from '../../services/api'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

interface KelasItem {
  id: number
  nama_kelas: string
  level: string
  batch_id: number | null
  batch_relasi: { id: number; nama_batch: string } | null
  tanggal_mulai: string
  tanggal_selesai: string
  tanggal_mulai_formatted?: string
  tanggal_selesai_formatted?: string
  catatan: string | null
  status: string
}

interface SiswaItem {
  id: number
  nama: string
  level: string
  absensi: Record<string, string>
}

interface DataSiswaResponse {
  kelas: KelasItem
  siswa: SiswaItem[]
  dates: string[]
}

interface SiswaPenilaian {
  id: number
  nama: string
  level: string
  daily_status: Record<string, { is_terisi: boolean; catatan: string | null }>
}

interface PenilaianHarianResponse {
  kelas: KelasItem
  siswa: SiswaPenilaian[]
  dates: string[]
}

interface ComponentItem {
  id: number
  nama: string
}

interface PertemuanItem {
  tanggal: string
  hari: string
  pertemuan_ke: number
  scores: (number | null)[]
}

interface CategoryItem {
  nama_kategori: string
  components: ComponentItem[]
  pertemuan: PertemuanItem[]
  summary: {
    averages: Record<string, number | null>
    improvements: Record<string, number | null>
    nilai_akhir: number | null
    resiko: string | null
    resiko_class: string | null
  }
}

interface DayDetailResponse {
  level: string
  siswa: string
  total_pertemuan: number
  categories: CategoryItem[]
}

const STATUS_ABBR: Record<string, string> = {
  HADIR: 'H',
  TERLAMBAT: 'T',
  IZIN: 'I',
  SAKIT: 'S',
  ALPA: 'A',
  LIBUR: 'L',
}

const STATUS_BG: Record<string, string> = {
  HADIR: 'bg-emerald-100 text-emerald-700',
  TERLAMBAT: 'bg-amber-100 text-amber-700',
  IZIN: 'bg-blue-100 text-blue-700',
  SAKIT: 'bg-sky-100 text-sky-700',
  ALPA: 'bg-rose-100 text-rose-700',
  LIBUR: 'bg-slate-100 text-slate-700',
}

const QUICK_STATUS = [
  { key: 'HADIR', label: 'H', sub: 'Hadir' },
  { key: 'IZIN', label: 'I', sub: 'Izin' },
  { key: 'ALPA', label: 'A', sub: 'Alpa' },
  { key: 'SAKIT', label: 'S', sub: 'Sakit' },
]

const RESIKO_STYLE: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
}

const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

function toDate(dateStr: string) {
  return new Date(dateStr.slice(0, 10) + 'T00:00:00')
}

function formatDayDate(dateStr: string) {
  const d = toDate(dateStr)
  return `${dayAbbr[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

function formatDateShort(dateStr: string) {
  const d = toDate(dateStr)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

function formatDateLongIndo(dateStr: string) {
  const d = toDate(dateStr)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const SCORE_BADGE = (s: number | null): string => {
  if (s === null) return 'bg-gray-100 text-gray-400'
  if (s >= 90) return 'bg-emerald-100 text-emerald-700'
  if (s >= 75) return 'bg-blue-100 text-blue-700'
  if (s >= 60) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

export default function GuruDataSiswa() {
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKelas, setSelectedKelas] = useState<DataSiswaResponse | null>(null)
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [tab, setTab] = useState<'kehadiran' | 'penilaian'>('kehadiran')

  const [penilaianHarian, setPenilaianHarian] = useState<PenilaianHarianResponse | null>(null)
  const [loadingPenilaianHarian, setLoadingPenilaianHarian] = useState(false)

  const [showAbsenModal, setShowAbsenModal] = useState(false)
  const [editSiswa, setEditSiswa] = useState<SiswaItem | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const [showPenilaianModal, setShowPenilaianModal] = useState(false)
  const [penilaianData, setPenilaianData] = useState<DayDetailResponse | null>(null)
  const [penilaianSiswa, setPenilaianSiswa] = useState<SiswaItem | SiswaPenilaian | null>(null)
  const [penilaianTanggal, setPenilaianTanggal] = useState('')
  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({})
  const [loadingPenilaian, setLoadingPenilaian] = useState(false)

  const [showKalenderModal, setShowKalenderModal] = useState(false)
  const [kalenderSiswa, setKalenderSiswa] = useState<SiswaItem | null>(null)
  const [kalenderData, setKalenderData] = useState<{
    absensi: { hari: number; status: string; jam_masuk: string | null; jam_keluar: string | null }[]
    month: number
    year: number
    daysInMonth: number
    startDayOfWeek: number
    monthName: string
  } | null>(null)
  const [kalenderMonth, setKalenderMonth] = useState(new Date().getMonth() + 1)
  const [kalenderYear, setKalenderYear] = useState(new Date().getFullYear())
  const [loadingKalender, setLoadingKalender] = useState(false)

  useEffect(() => {
    guruKelasApi.list().then(res => {
      setKelasList(res.data.kelas || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const openKelas = async (k: KelasItem) => {
    setLoadingSiswa(true)
    setSelectedKelas(null)
    setPenilaianHarian(null)
    setTab('kehadiran')
    try {
      const res = await guruKelasApi.dataSiswa(k.id)
      setSelectedKelas(res.data)
    } catch {
      setSelectedKelas(null)
    } finally {
      setLoadingSiswa(false)
    }
  }

  const loadPenilaianHarian = async () => {
    if (!selectedKelas || penilaianHarian) return
    setLoadingPenilaianHarian(true)
    try {
      const res = await guruKelasApi.penilaianHarian(selectedKelas.kelas.id)
      setPenilaianHarian(res.data)
    } catch {
      setPenilaianHarian(null)
    } finally {
      setLoadingPenilaianHarian(false)
    }
  }

  const switchTab = (t: 'kehadiran' | 'penilaian') => {
    setTab(t)
    if (t === 'penilaian') {
      loadPenilaianHarian()
    }
  }

  const openKalender = async (siswa: SiswaItem) => {
    setKalenderSiswa(siswa)
    setShowKalenderModal(true)
    setLoadingKalender(true)
    setKalenderData(null)
    const now = new Date()
    setKalenderMonth(now.getMonth() + 1)
    setKalenderYear(now.getFullYear())
    try {
      const res = await absensiSiswaApi.kalender(siswa.id, { month: now.getMonth() + 1, year: now.getFullYear() })
      setKalenderData(res.data)
    } catch {
      setKalenderData(null)
    } finally {
      setLoadingKalender(false)
    }
  }

  const navigateKalender = async (dir: number) => {
    if (!kalenderSiswa) return
    const newMonth = kalenderMonth + dir
    let m = newMonth
    let y = kalenderYear
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setKalenderMonth(m)
    setKalenderYear(y)
    setLoadingKalender(true)
    try {
      const res = await absensiSiswaApi.kalender(kalenderSiswa.id, { month: m, year: y })
      setKalenderData(res.data)
    } catch {
      setKalenderData(null)
    } finally {
      setLoadingKalender(false)
    }
  }

  const backToList = () => {
    setSelectedKelas(null)
    setPenilaianHarian(null)
  }

  const openStatusModal = (siswa: SiswaItem, date: string) => {
    setEditSiswa(siswa)
    setEditDate(date)
    setEditStatus(siswa.absensi[date] || '')
    setShowAbsenModal(true)
  }

  const handleSaveStatus = async () => {
    if (!editSiswa || !editDate || !editStatus || !selectedKelas) return
    setSaving(true)
    try {
      await absensiSiswaApi.store({
        siswa_id: editSiswa.id,
        tanggal: editDate,
        status: editStatus,
        kelas_sensei_id: selectedKelas.kelas.id,
      })
      setSelectedKelas(prev => {
        if (!prev) return prev
        return {
          ...prev,
          siswa: prev.siswa.map(s =>
            s.id === editSiswa.id
              ? { ...s, absensi: { ...s.absensi, [editDate]: editStatus } }
              : s
          ),
        }
      })
      setShowAbsenModal(false)
    } catch {
      alert('Gagal menyimpan status kehadiran')
    } finally {
      setSaving(false)
    }
  }

  const openPenilaianModal = async (siswa: SiswaItem | SiswaPenilaian, tanggal: string) => {
    if (!selectedKelas) return
    setPenilaianSiswa(siswa)
    setPenilaianTanggal(tanggal)
    setShowPenilaianModal(true)
    setPenilaianData(null)
    setLoadingPenilaian(true)
    setScoreInputs({})
    try {
      const res = await penilaianApi.dayDetail({
        siswa_id: siswa.id,
        level: selectedKelas.kelas.level,
        kelas_sensei_id: selectedKelas.kelas.id,
        tanggal,
      })
      setPenilaianData(res.data)
      const inputs: Record<number, string> = {}
      if (res.data?.categories) {
        for (const cat of res.data.categories) {
          const lastPt = cat.pertemuan.length > 0 ? cat.pertemuan[cat.pertemuan.length - 1] : null
          if (lastPt) {
            cat.components.forEach((comp, idx) => {
              const val = idx < lastPt.scores.length ? lastPt.scores[idx] : null
              if (val !== null) inputs[comp.id] = String(val)
            })
          }
        }
      }
      setScoreInputs(inputs)
    } catch {
      setPenilaianData(null)
    } finally {
      setLoadingPenilaian(false)
    }
  }

  const handleSavePenilaian = async () => {
    if (!penilaianSiswa || !selectedKelas || !penilaianData) return
    setSaving(true)
    try {
      const scores = Object.entries(scoreInputs)
        .filter(([, val]) => val !== '')
        .map(([compId, val]) => ({
          component_id: Number(compId),
          nilai: val ? Number(val) : null,
        }))
      await penilaianApi.storeStudentAssessment({
        siswa_id: penilaianSiswa.id,
        batch_id: selectedKelas.kelas.batch_id,
        kelas_sensei_id: selectedKelas.kelas.id,
        tanggal: penilaianTanggal,
        scores,
      })
      await guruKelasApi.simpanPenilaianHarian({
        siswa_id: penilaianSiswa.id,
        kelas_sensei_id: selectedKelas.kelas.id,
        tanggal: penilaianTanggal,
        is_terisi: true,
      })
      setPenilaianHarian(prev => {
        if (!prev) return prev
        return {
          ...prev,
          siswa: prev.siswa.map(s =>
            s.id === penilaianSiswa.id
              ? { ...s, daily_status: { ...s.daily_status, [penilaianTanggal]: { is_terisi: true, catatan: null } } }
              : s
          ),
        }
      })
      setShowPenilaianModal(false)
    } catch {
      alert('Gagal menyimpan penilaian')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (selectedKelas || loadingSiswa) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] pb-24">
        <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

        <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center gap-3">
          <button onClick={backToList} className="p-1 -ml-1 rounded-lg hover:bg-[#F4F5F8] transition-colors">
            <ChevronLeft size={20} className="text-[#4B5063]" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-[#14182B]">Batch</h1>
            <p className="text-[11px] text-[#8B90A0] font-medium">Detail batch & kehadiran siswa</p>
          </div>
        </div>

        <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
          {loadingSiswa ? (
            <div className="bg-white rounded-xl border border-[#E5E7EF] p-8 flex items-center justify-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0069b0] animate-spin" />
                <Users size={18} className="text-[#8B90A0]" />
              </div>
            </div>
          ) : selectedKelas ? (
            <>
              <div className="bg-white rounded-xl border border-[#E5E7EF] p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                    <BookOpen size={18} className="text-[#0069b0]" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#14182B]">{selectedKelas.kelas.batch_relasi?.nama_batch || selectedKelas.kelas.nama_kelas}</h3>
                    <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                      Level {selectedKelas.kelas.level}
                    </p>
                    <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                      {formatDateShort(selectedKelas.kelas.tanggal_mulai)} – {formatDateShort(selectedKelas.kelas.tanggal_selesai)} · {selectedKelas.siswa.length} siswa
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-3">
                <button
                  onClick={() => switchTab('kehadiran')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                    tab === 'kehadiran'
                      ? 'bg-[#0069b0] text-white'
                      : 'bg-white text-[#4B5063] border border-[#E5E7EF] hover:bg-[#F4F5F8]'
                  }`}
                >
                  <Calendar size={14} /> Kehadiran Siswa
                </button>
                <button
                  onClick={() => switchTab('penilaian')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                    tab === 'penilaian'
                      ? 'bg-[#0069b0] text-white'
                      : 'bg-white text-[#4B5063] border border-[#E5E7EF] hover:bg-[#F4F5F8]'
                  }`}
                >
                  <BookOpen size={14} /> Penilaian Siswa
                </button>
              </div>

              {/* Kehadiran Siswa Tab */}
              {tab === 'kehadiran' && (
                <div className="bg-white rounded-xl border border-[#E5E7EF] overflow-x-auto">
                  <div className="p-4 pb-2">
                    <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Kehadiran Siswa</h3>
                  </div>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    {Object.entries(STATUS_ABBR).map(([key, abbr]) => (
                      <span key={key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_BG[key]}`}>
                        {abbr}
                      </span>
                    ))}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-t border-[#F0F1F5]">
                        <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider sticky left-0 bg-white">Nama</th>
                        <th className="text-center px-2 py-2.5 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider w-10">Lv</th>
                        {selectedKelas.dates.map(date => (
                          <th key={date} className="text-center px-1.5 py-2.5 text-[9px] font-bold text-[#8B90A0] uppercase tracking-wider min-w-[48px]">
                            {formatDayDate(date)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedKelas.siswa.map((s, idx) => (
                        <tr key={s.id} className={`border-t border-[#F0F1F5] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                          <td className="px-4 py-2 text-xs font-semibold text-[#14182B] sticky left-0 bg-inherit">{s.nama}</td>
                          <td className="text-center px-2 py-2 text-[11px] font-semibold text-[#8B90A0]">{s.level || '-'}</td>
                          {selectedKelas.dates.map(date => {
                            const status = s.absensi[date]
                            return (
                              <td key={date} className="text-center px-1.5 py-2">
                                <button
                                  onClick={() => openStatusModal(s, date)}
                                  className="mx-auto cursor-pointer hover:scale-110 transition-transform"
                                >
                                  {status ? (
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${STATUS_BG[status] || 'bg-gray-100 text-gray-500'}`}>
                                      {STATUS_ABBR[status] || status[0]}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-gray-300 hover:text-[#0069b0] hover:bg-[#0069b0]/[0.06] transition-colors">-</span>
                                  )}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedKelas.siswa.length === 0 && (
                    <div className="text-center py-8">
                      <Users size={22} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
                      <p className="text-sm font-semibold text-[#4B5063]">Tidak ada siswa aktif</p>
                    </div>
                  )}
                </div>
              )}

              {/* Penilaian Siswa Tab */}
              {tab === 'penilaian' && (
                <div className="bg-white rounded-xl border border-[#E5E7EF] overflow-x-auto">
                  <div className="p-4 pb-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Penilaian Siswa</h3>
                  </div>
                  <div className="flex items-center gap-3 px-4 pb-3">
                    <div className="flex items-center gap-1 text-[10px] text-[#8B90A0]">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Terisi</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#8B90A0]">
                      <Minus className="w-3.5 h-3.5 text-slate-300" />
                      <span>Kosong</span>
                    </div>
                  </div>

                  {loadingPenilaianHarian ? (
                    <div className="py-8 text-center text-sm text-gray-400">Memuat data penilaian...</div>
                  ) : !penilaianHarian ? (
                    <div className="py-4 text-center">
                      <button
                        onClick={loadPenilaianHarian}
                        className="text-xs font-semibold text-[#0069b0] hover:underline"
                      >
                        Muat data penilaian
                      </button>
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-t border-[#F0F1F5]">
                            <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider sticky left-0 bg-white">Nama</th>
                            <th className="text-center px-2 py-2.5 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider w-10">Lv</th>
                            {penilaianHarian.dates.map(date => (
                              <th key={date} className="text-center px-1.5 py-2.5 text-[9px] font-bold text-[#8B90A0] uppercase tracking-wider min-w-[48px]">
                                {formatDayDate(date)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {penilaianHarian.siswa.map((s, idx) => (
                            <tr key={s.id} className={`border-t border-[#F0F1F5] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                          <td className="px-4 py-2 text-xs font-semibold text-[#0069b0] sticky left-0 bg-inherit">
                            <button onClick={() => openKalender(s)} className="hover:underline text-left">{s.nama}</button>
                          </td>
                              <td className="text-center px-2 py-2 text-[11px] font-semibold text-[#8B90A0]">{s.level || '-'}</td>
                              {penilaianHarian.dates.map(date => {
                                const status = s.daily_status[date]
                                const isTerisi = status?.is_terisi ?? false
                                return (
                                  <td key={date} className="text-center px-1.5 py-2">
                                    <button
                                      onClick={() => openPenilaianModal(s, date)}
                                      className="mx-auto cursor-pointer hover:scale-110 transition-transform"
                                      title={isTerisi ? `Lihat/edit penilaian ${formatDateLongIndo(date)}` : `Isi penilaian ${formatDateLongIndo(date)}`}
                                    >
                                      {isTerisi ? (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                          <Check className="w-3.5 h-3.5" />
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-slate-300 hover:text-[#0069b0] hover:bg-[#0069b0]/[0.06] transition-colors">
                                          -
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {penilaianHarian.siswa.length === 0 && (
                        <div className="text-center py-8">
                          <Users size={22} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
                          <p className="text-sm font-semibold text-[#4B5063]">Tidak ada siswa aktif</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        <KaryawanBottomNav
          activeTab="home"
          absenStatus="belum"
          homeHref="/guru-dashboard"
          jadwalHref="/guru-dashboard"
          laporanHref="/guru-dashboard"
          profilHref="/guru-profil"
        />

        {showAbsenModal && editSiswa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAbsenModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Ubah Status</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{editSiswa.nama} · {formatDateLongIndo(editDate)}</p>
                </div>
                <button onClick={() => setShowAbsenModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-3">
                {QUICK_STATUS.map(qs => (
                  <button
                    key={qs.key}
                    onClick={() => setEditStatus(qs.key)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                      editStatus === qs.key
                        ? 'border-[#0069b0] bg-[#0069b0]/[0.04]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${STATUS_BG[qs.key]}`}>
                      {qs.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">{qs.sub}</span>
                  </button>
                ))}
                {editStatus && (
                  <button
                    onClick={() => setEditStatus('')}
                    className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 py-2"
                  >
                    Hapus status
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
                <button onClick={() => setShowAbsenModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition">Batal</button>
                <button onClick={handleSaveStatus} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-[#0069b0] rounded-lg hover:bg-[#004d7a] transition disabled:opacity-50">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPenilaianModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPenilaianModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Penilaian Siswa</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {penilaianSiswa && 'nama' in penilaianSiswa ? penilaianSiswa.nama : '-'} · Level {selectedKelas?.kelas.level}
                    {penilaianData && ` · ${penilaianData.total_pertemuan} pertemuan`}
                    {penilaianTanggal && ` · ${formatDateLongIndo(penilaianTanggal)}`}
                  </p>
                </div>
                <button onClick={() => setShowPenilaianModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-5 space-y-5">
                {loadingPenilaian ? (
                  <div className="py-8 text-center text-sm text-gray-400">Memuat data penilaian...</div>
                ) : !penilaianData ? (
                  <div className="py-8 text-center text-sm text-rose-500">Gagal memuat data penilaian</div>
                ) : penilaianData.categories.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    <BookOpen size={24} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-[#4B5063]">Belum ada kategori penilaian</p>
                    <p className="text-xs text-[#8B90A0] mt-1">Tidak ada penilaian untuk level ini</p>
                  </div>
                ) : (
                  penilaianData.categories.map((cat, ci) => (
                    <div key={ci}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-[#4B5063] uppercase tracking-wider">{cat.nama_kategori}</h4>
                        {cat.summary?.nilai_akhir !== null && cat.summary?.nilai_akhir !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RESIKO_STYLE[cat.summary.resiko_class || ''] || 'bg-gray-100 text-gray-500'}`}>
                            {cat.summary.resiko?.replace(/[^\w\s]/g, '') || '-'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {cat.components.map(comp => (
                          <div key={comp.id} className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-gray-700 w-28 shrink-0">{comp.nama}</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={scoreInputs[comp.id] ?? ''}
                              onChange={e => setScoreInputs(prev => ({ ...prev, [comp.id]: e.target.value }))}
                              placeholder="0-100"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                            />
                          </div>
                        ))}
                      </div>
                      {cat.summary?.nilai_akhir !== null && cat.summary?.nilai_akhir !== undefined && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                          <span>Rata-rata: <strong>{cat.summary.nilai_akhir?.toFixed(1)}</strong></span>
                        </div>
                      )}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                          <thead>
                            <tr className="bg-amber-700 text-white">
                              <th className="px-2 py-1 text-left">Tanggal</th>
                              {cat.components.map(comp => (
                                <th key={comp.id} className="px-2 py-1 text-center">{comp.nama}</th>
                              ))}
                              <th className="px-2 py-1 text-center">Rata-Rata</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.pertemuan.map((pt, pi) => {
                              const scores = pt.scores.filter(s => s !== null)
                              const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
                              return (
                                <tr key={pi} className="border-b border-slate-100">
                                  <td className="px-2 py-1 text-slate-600">{pt.hari}, {pt.tanggal}</td>
                                  {pt.scores.map((s, j) => (
                                    <td key={j} className="px-2 py-1 text-center">
                                      {s !== null ? (
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                          {Math.round(s)}
                                        </span>
                                      ) : <span className="text-slate-300">-</span>}
                                    </td>
                                  ))}
                                  <td className="px-2 py-1 text-center font-semibold text-slate-700">
                                    {avg !== null ? avg.toFixed(1) : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
                <button onClick={() => setShowPenilaianModal(false)} className="px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition">Batal</button>
                <button
                  onClick={handleSavePenilaian}
                  disabled={saving || loadingPenilaian || !penilaianData}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0069b0] rounded-lg hover:bg-[#004d7a] transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center gap-3">
        <a href="/guru-dashboard" className="p-1 -ml-1 rounded-lg hover:bg-[#F4F5F8] transition-colors">
          <ChevronLeft size={20} className="text-[#4B5063]" />
        </a>
        <div>
          <h1 className="text-sm font-bold text-[#14182B]">Batch</h1>
          <p className="text-[11px] text-[#8B90A0] font-medium">{kelasList.length} batch tersedia</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-3 max-w-lg mx-auto">
        {kelasList.length > 0 ? (
          kelasList.map(k => (
            <button
              key={k.id}
              onClick={() => openKelas(k)}
              className="w-full bg-white rounded-xl border border-[#E5E7EF] p-4 text-left hover:border-[#0069b0] transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none group-hover:bg-[#0069b0]/[0.1] transition-colors">
                  <BookOpen size={18} className="text-[#0069b0]" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#14182B]">{k.batch_relasi?.nama_batch || k.nama_kelas}</h3>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                    Level {k.level}
                  </p>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                    {k.tanggal_mulai_formatted || formatDateShort(k.tanggal_mulai)}
                    {' – '}
                    {k.tanggal_selesai_formatted || formatDateShort(k.tanggal_selesai)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-[#8B90A0]">
                    <Users size={13} />
                    <span className="font-semibold">-</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#0069b0] opacity-0 group-hover:opacity-100 transition-opacity">Lihat &rarr;</span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-8 text-center">
            <Users size={24} className="mx-auto text-[#D5D8E3] mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[#4B5063]">Belum ada kelas</p>
            <p className="text-xs text-[#8B90A0] mt-1">Buat kelas terlebih dahulu di dashboard guru</p>
          </div>
        )}
      </div>

      {showKalenderModal && kalenderSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowKalenderModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Kehadiran Siswa</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{kalenderSiswa.nama}</p>
              </div>
              <button onClick={() => setShowKalenderModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateKalender(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-gray-800">{kalenderData?.monthName || ''}</span>
                <button onClick={() => navigateKalender(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <ChevronLeft size={18} className="rotate-180" />
                </button>
              </div>

              {loadingKalender ? (
                <div className="py-8 text-center text-sm text-gray-400">Memuat data...</div>
              ) : kalenderData ? (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(h => (
                      <div key={h} className="text-center text-[10px] font-bold text-gray-400 py-1">{h}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: kalenderData.startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: kalenderData.daysInMonth }).map((_, i) => {
                      const hari = i + 1
                      const absen = kalenderData.absensi.find(a => a.hari === hari)
                      return (
                        <div key={hari} className="flex flex-col items-center py-1.5">
                          <span className="text-[10px] text-gray-400 mb-1">{hari}</span>
                          {absen ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold ${
                              absen.status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                              absen.status === 'TERLAMBAT' ? 'bg-amber-100 text-amber-700' :
                              absen.status === 'IZIN' ? 'bg-blue-100 text-blue-700' :
                              absen.status === 'SAKIT' ? 'bg-sky-100 text-sky-700' :
                              absen.status === 'ALPA' ? 'bg-rose-100 text-rose-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {STATUS_ABBR[absen.status] || absen.status[0]}
                            </span>
                          ) : (
                            <span className="w-7 h-7" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(STATUS_ABBR).map(([key, abbr]) => (
                      <span key={key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_BG[key]}`}>
                        {abbr}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-red-500">Gagal memuat data</div>
              )}
            </div>
          </div>
        </div>
      )}

      <KaryawanBottomNav
        activeTab="home"
        absenStatus="belum"
        homeHref="/guru-dashboard"
        jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard"
        profilHref="/guru-profil"
      />
    </div>
  )
}
