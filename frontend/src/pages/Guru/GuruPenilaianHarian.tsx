import { useState, useEffect } from 'react'
import { BookOpen, Users, ChevronLeft, Check, Minus, X } from 'lucide-react'
import { guruKelasApi, penilaianApi } from '../../services/api'
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

interface SiswaPenilaian {
  id: number
  nama: string
  level: string
  daily_status: Record<string, { is_terisi: boolean; catatan: string | null }>
}

interface PenilaianResponse {
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

interface DayDetailData {
  level: string
  siswa: string
  total_pertemuan: number
  categories: CategoryItem[]
}

const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

const RESIKO_STYLE: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
}

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

export default function GuruPenilaianHarian() {
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedData, setSelectedData] = useState<PenilaianResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<DayDetailData | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaPenilaian | null>(null)
  const [selectedTanggal, setSelectedTanggal] = useState('')
  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({})

  useEffect(() => {
    guruKelasApi.list().then(res => {
      setKelasList(res.data.kelas || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const openKelas = async (k: KelasItem) => {
    setLoadingData(true)
    setSelectedData(null)
    try {
      const res = await guruKelasApi.penilaianHarian(k.id)
      setSelectedData(res.data)
    } catch {
      setSelectedData(null)
    } finally {
      setLoadingData(false)
    }
  }

  const backToList = () => {
    setSelectedData(null)
  }

  const openPenilaianModal = async (siswa: SiswaPenilaian, tanggal: string) => {
    if (!selectedData) return
    setSelectedSiswa(siswa)
    setSelectedTanggal(tanggal)
    setShowModal(true)
    setModalLoading(true)
    setModalData(null)
    setScoreInputs({})
    try {
      const res = await penilaianApi.dayDetail({
        siswa_id: siswa.id,
        level: selectedData.kelas.level,
        kelas_sensei_id: selectedData.kelas.id,
        tanggal,
      })
      setModalData(res.data)
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
      setModalData(null)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setModalData(null)
    setSelectedSiswa(null)
    setSelectedTanggal('')
  }

  const handleSave = async () => {
    if (!selectedSiswa || !selectedData || !modalData) return
    setSaving(true)
    try {
      const scores = Object.entries(scoreInputs)
        .filter(([, val]) => val !== '')
        .map(([compId, val]) => ({
          component_id: Number(compId),
          nilai: val ? Number(val) : null,
        }))
      await penilaianApi.storeStudentAssessment({
        siswa_id: selectedSiswa.id,
        batch_id: selectedData.kelas.batch_id,
        kelas_sensei_id: selectedData.kelas.id,
        tanggal: selectedTanggal,
        scores,
      })
      await guruKelasApi.simpanPenilaianHarian({
        siswa_id: selectedSiswa.id,
        kelas_sensei_id: selectedData.kelas.id,
        tanggal: selectedTanggal,
        is_terisi: true,
      })
      setSelectedData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          siswa: prev.siswa.map(s =>
            s.id === selectedSiswa.id
              ? { ...s, daily_status: { ...s.daily_status, [selectedTanggal]: { is_terisi: true, catatan: null } } }
              : s
          ),
        }
      })
      closeModal()
    } catch {
      alert('Gagal menyimpan penilaian')
    } finally {
      setSaving(false)
    }
  }

  const SCORE_BADGE = (s: number | null): string => {
    if (s === null) return 'bg-gray-100 text-gray-400'
    if (s >= 90) return 'bg-emerald-100 text-emerald-700'
    if (s >= 75) return 'bg-blue-100 text-blue-700'
    if (s >= 60) return 'bg-amber-100 text-amber-700'
    return 'bg-rose-100 text-rose-700'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-8 h-8" />
        </div>
      </div>
    )
  }

  if (selectedData || loadingData) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] pb-24">
        <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

        <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center gap-3">
          <button onClick={backToList} className="p-1 -ml-1 rounded-lg hover:bg-[#F4F5F8] transition-colors">
            <ChevronLeft size={20} className="text-[#4B5063]" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-[#14182B]">Penilaian Harian</h1>
            <p className="text-[11px] text-[#8B90A0] font-medium">Klik sel tanggal untuk mengisi penilaian siswa</p>
          </div>
        </div>

        <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
          {loadingData ? (
            <div className="bg-white rounded-xl border border-[#E5E7EF] p-8 flex items-center justify-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0069b0] animate-spin" />
                <Users size={18} className="text-[#8B90A0]" />
              </div>
            </div>
          ) : selectedData ? (
            <>
              <div className="bg-white rounded-xl border border-[#E5E7EF] p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                    <BookOpen size={18} className="text-[#0069b0]" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#14182B]">{selectedData.kelas.nama_kelas}</h3>
                    <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                      {selectedData.kelas.batch_relasi?.nama_batch && `${selectedData.kelas.batch_relasi.nama_batch} · `}
                      Level {selectedData.kelas.level}
                    </p>
                    <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                      {formatDateShort(selectedData.kelas.tanggal_mulai)} – {formatDateShort(selectedData.kelas.tanggal_selesai)} · {selectedData.siswa.length} siswa
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#8B90A0] px-1">
                <div className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Terisi</span>
                </div>
                <div className="flex items-center gap-1">
                  <Minus className="w-3.5 h-3.5 text-slate-300" />
                  <span>Kosong</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E5E7EF] overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#F0F1F5]">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider sticky left-0 bg-white">Nama</th>
                      <th className="text-center px-2 py-2.5 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider w-10">Lv</th>
                      {selectedData.dates.map(date => (
                        <th key={date} className="text-center px-1.5 py-2.5 text-[9px] font-bold text-[#8B90A0] uppercase tracking-wider min-w-[48px]">
                          {formatDayDate(date)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedData.siswa.map((s, idx) => (
                      <tr key={s.id} className={`border-t border-[#F0F1F5] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                        <td className="px-4 py-2 text-xs font-semibold text-[#14182B] sticky left-0 bg-inherit">{s.nama}</td>
                        <td className="text-center px-2 py-2 text-[11px] font-semibold text-[#8B90A0]">{s.level || '-'}</td>
                        {selectedData.dates.map(date => {
                          const status = s.daily_status[date]
                          const isTerisi = status?.is_terisi ?? false
                          return (
                            <td key={date} className="text-center px-1.5 py-2">
                              <button
                                onClick={() => openPenilaianModal(s, date)}
                                className="mx-auto cursor-pointer hover:scale-110 transition-transform"
                                title={isTerisi ? `Lihat/edit penilaian ${s.nama} ${formatDateLongIndo(date)}` : `Isi penilaian ${s.nama} ${formatDateLongIndo(date)}`}
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

                {selectedData.siswa.length === 0 && (
                  <div className="text-center py-8">
                    <Users size={22} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-[#4B5063]">Tidak ada siswa aktif</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <KaryawanBottomNav
          activeTab="home"
          absenStatus="belum"
          homeHref="/guru-dashboard"
          jadwalHref="/guru-dashboard"
          laporanHref="/guru-dashboard"
          profilHref="/guru-dashboard"
        />

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Penilaian Siswa</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {selectedSiswa?.nama} · Level {selectedData?.kelas.level}
                    {modalData && ` · ${modalData.total_pertemuan} pertemuan`}
                    {selectedTanggal && ` · ${formatDateLongIndo(selectedTanggal)}`}
                  </p>
                </div>
                <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-5 space-y-5">
                {modalLoading ? (
                  <div className="py-8 text-center text-sm text-gray-400">Memuat data penilaian...</div>
                ) : !modalData ? (
                  <div className="py-8 text-center text-sm text-rose-500">Gagal memuat data penilaian</div>
                ) : modalData.categories.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    <BookOpen size={24} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-[#4B5063]">Belum ada kategori penilaian</p>
                    <p className="text-xs text-[#8B90A0] mt-1">Tidak ada penilaian untuk level ini</p>
                  </div>
                ) : (
                  modalData.categories.map((cat, ci) => (
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
                <button onClick={closeModal} className="px-4 py-2 text-xs font-semibold text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition">
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || modalLoading || !modalData || modalData.categories.length === 0}
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

      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
        <h1 className="text-sm font-bold text-[#14182B]">Penilaian Harian</h1>
        <p className="text-[11px] text-[#8B90A0] font-medium">Pilih kelas untuk mengelola penilaian harian siswa</p>
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
                  <h3 className="text-sm font-bold text-[#14182B]">{k.nama_kelas}</h3>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                    {k.batch_relasi?.nama_batch && `${k.batch_relasi.nama_batch} · `}
                    Level {k.level}
                  </p>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                    {k.tanggal_mulai_formatted || formatDateShort(k.tanggal_mulai)}
                    {' – '}
                    {k.tanggal_selesai_formatted || formatDateShort(k.tanggal_selesai)}
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <span className="text-[10px] font-bold text-[#0069b0] opacity-0 group-hover:opacity-100 transition-opacity">
                    Kelola &rarr;
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-8 text-center">
            <BookOpen size={24} className="mx-auto text-[#D5D8E3] mb-3" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[#4B5063]">Belum ada kelas</p>
            <p className="text-xs text-[#8B90A0] mt-1">Buat kelas terlebih dahulu di dashboard guru</p>
          </div>
        )}
      </div>

      <KaryawanBottomNav
        activeTab="home"
        absenStatus="belum"
        homeHref="/guru-dashboard"
        jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard"
        profilHref="/guru-dashboard"
      />
    </div>
  )
}
