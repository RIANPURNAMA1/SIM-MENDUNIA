import { useState, useEffect } from 'react'
import { Building2, Layers, ChevronLeft, FileText, School, Hash, User, MapPin, ChevronRight, Notebook } from 'lucide-react'
import api, { adminCabangApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface CabangItem {
  id: number
  nama_cabang: string
  kode_cabang?: string
}

interface BatchData {
  id: number
  nama_batch: string
  cabang_id: number
  status?: string
  cabang?: { nama_cabang: string }
  siswas_count?: number
}

interface LevelData {
  level: number
  has_jadwal: boolean
  tanggal_mulai: string | null
  tanggal_selesai: string | null
}

interface ComponentData {
  id: number
  nama: string
  rata_rata: number | null
  total_nilai: number
}

interface KategoriData {
  id: number
  nama: string
  rata_rata: number | null
  total_nilai: number
  components: ComponentData[]
}

interface SiswaRaport {
  id: number
  nama: string
  nik: string | null
  no_registrasi: string | null
  level: number | string | null
  rata_rata: number | null
  total_nilai: number
  per_kategori: KategoriData[]
}

interface RaportResponse {
  batch: {
    id: number
    nama_batch: string
    cabang: string | null
  }
  level: number
  categories: { id: number; nama: string; components: { id: number; nama: string }[] }[]
  siswa: SiswaRaport[]
}

const SCORE_BADGE = (s: number | null): string => {
  if (s === null) return 'bg-gray-100 text-gray-400'
  if (s >= 90) return 'bg-emerald-100 text-emerald-700'
  if (s >= 75) return 'bg-blue-100 text-blue-700'
  if (s >= 60) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

export default function RaportPage() {
  const [cabangs, setCabangs] = useState<CabangItem[]>([])
  const [batches, setBatches] = useState<BatchData[]>([])
  const [levels, setLevels] = useState<LevelData[]>([])
  const [raport, setRaport] = useState<RaportResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const [selectedCabang, setSelectedCabang] = useState<CabangItem | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  const [expandedSiswa, setExpandedSiswa] = useState<Set<number>>(new Set())

  const { user } = useAuth()
  const isAdminCabang = user?.role === 'ADMIN_CABANG'

  useEffect(() => {
    setLoading(true)
    const load = isAdminCabang
      ? Promise.all([
          adminCabangApi.myBranches(),
          adminCabangApi.batches(),
        ]).then(([cabangRes, batchRes]) => {
          setCabangs(cabangRes.data?.data || cabangRes.data || [])
          setBatches(batchRes.data?.data || batchRes.data || [])
        })
      : Promise.all([
          api.get('/cabang'),
          api.get('/batches'),
        ]).then(([cabangRes, batchRes]) => {
          setCabangs(cabangRes.data.data || cabangRes.data || [])
          setBatches(batchRes.data.data || batchRes.data.batches || [])
        })
    load.catch(() => {}).finally(() => setLoading(false))
  }, [isAdminCabang])

  const filteredBatches = selectedCabang
    ? batches.filter((b) => b.cabang_id === selectedCabang.id)
    : []

  const fetchLevels = async (batch: BatchData) => {
    setSelectedBatch(batch)
    setSelectedLevel(null)
    setRaport(null)
    setLoading(true)
    try {
      const res = await api.get(`/raport/${batch.id}/levels`)
      setLevels(res.data.data || [])
    } catch {
      setLevels([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRaport = async (level: number) => {
    if (!selectedBatch) return
    setSelectedLevel(level)
    setRaport(null)
    setLoading(true)
    try {
      const res = await api.get(`/raport/${selectedBatch.id}/${level}`)
      setRaport(res.data)
    } catch {
      console.error
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (siswaId: number) => {
    setExpandedSiswa((prev) => {
      const next = new Set(prev)
      if (next.has(siswaId)) next.delete(siswaId)
      else next.add(siswaId)
      return next
    })
  }

  const goBack = () => {
    if (raport || selectedLevel) {
      setRaport(null)
      setSelectedLevel(null)
      setExpandedSiswa(new Set())
    } else if (selectedBatch) {
      setSelectedBatch(null)
      setLevels([])
    } else if (selectedCabang) {
      setSelectedCabang(null)
    }
  }

  const cardClass = 'rounded-lg border border-slate-200 bg-white shadow-sm'

  return (
    <div className="min-h-screen bg-[#F4F5F8] p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedCabang && (
            <button onClick={goBack} className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200">
              <ChevronLeft size={18} className="text-slate-500" />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Notebook size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Raport Siswa / Kandidat</h1>
            <p className="text-sm text-slate-500">Rekap nilai per level dan per batch</p>
          </div>
        </div>
      </div>

      {selectedCabang && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          {raport || selectedLevel ? (
            <>
              <button onClick={() => { setSelectedCabang(null); setSelectedBatch(null); setSelectedLevel(null); setRaport(null); }} className="hover:text-slate-600 transition-colors">
                {raport?.batch.cabang || selectedCabang.nama_cabang}
              </button>
              <ChevronRight size={12} />
              <button onClick={() => { setSelectedBatch(null); setSelectedLevel(null); setRaport(null); }} className="hover:text-slate-600 transition-colors">
                {raport?.batch.nama_batch || selectedBatch?.nama_batch}
              </button>
              {raport && (
                <>
                  <ChevronRight size={12} />
                  <span className="text-slate-600 font-medium">Level {raport.level}</span>
                </>
              )}
            </>
          ) : (
            <>
              <MapPin size={12} />
              <span>{selectedCabang.nama_cabang}</span>
              {selectedBatch && (
                <>
                  <ChevronRight size={12} />
                  <Layers size={12} />
                  <span>{selectedBatch.nama_batch}</span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {(() => {
        if (loading) {
          return (
            <div className="flex items-center justify-center py-20">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
              </div>
            </div>
          )
        }

        if (!selectedCabang) {
          if (cabangs.length === 0) {
            return (
              <div className={`${cardClass} p-8 text-center`}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Building2 size={24} />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada cabang tersedia</p>
              </div>
            )
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cabangs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCabang(c)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-[#0E6187] transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#0E6187]/[0.06] flex items-center justify-center flex-none">
                      <Building2 size={18} className="text-[#0E6187]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#14182B] truncate">{c.nama_cabang}</p>
                      {c.kode_cabang && <p className="text-[11px] text-[#8B90A0] font-medium">{c.kode_cabang}</p>}
                    </div>
                  </div>
                  <p className="text-[11px] text-[#8B90A0] font-medium pl-[52px]">
                    {batches.filter((b) => b.cabang_id === c.id).length} batch
                  </p>
                  <span className="text-[10px] font-bold text-[#0E6187] opacity-0 group-hover:opacity-100 transition-opacity pl-[52px]">
                    Lihat &rarr;
                  </span>
                </button>
              ))}
            </div>
          )
        }

        if (selectedCabang && !selectedBatch) {
          if (filteredBatches.length === 0) {
            return (
              <div className={`${cardClass} p-8 text-center`}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Layers size={24} />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada batch untuk cabang ini</p>
              </div>
            )
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBatches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => fetchLevels(b)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-[#0E6187] transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#0E6187]/[0.06] flex items-center justify-center flex-none">
                      <Layers size={18} className="text-[#0E6187]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#14182B] truncate">{b.nama_batch}</p>
                      <p className="text-[11px] text-[#8B90A0] font-medium">{b.cabang?.nama_cabang || selectedCabang.nama_cabang}</p>
                    </div>
                  </div>
                  {b.siswas_count !== undefined && (
                    <p className="text-[11px] text-[#8B90A0] font-medium pl-[52px]">{b.siswas_count} siswa</p>
                  )}
                  <span className="text-[10px] font-bold text-[#0E6187] opacity-0 group-hover:opacity-100 transition-opacity pl-[52px]">
                    Lihat Level &rarr;
                  </span>
                </button>
              ))}
            </div>
          )
        }

        if (selectedBatch && !raport) {
          if (levels.length === 0) {
            return (
              <div className={`${cardClass} p-8 text-center`}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <School size={24} />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada level tersedia</p>
              </div>
            )
          }
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {levels.map((l) => (
                <button
                  key={l.level}
                  onClick={() => fetchRaport(l.level)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-[#0E6187] transition-colors group shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#0E6187]/[0.06] flex items-center justify-center flex-none">
                      <School size={18} className="text-[#0E6187]" strokeWidth={1.8} />
                    </div>
                    <p className="text-sm font-bold text-[#14182B]">Level {l.level}</p>
                  </div>
                  {l.has_jadwal && l.tanggal_mulai && l.tanggal_selesai && (
                    <p className="text-[11px] text-[#8B90A0] font-medium pl-[52px]">
                      {new Date(l.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} &mdash; {new Date(l.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  <span className="text-[10px] font-bold text-[#0E6187] opacity-0 group-hover:opacity-100 transition-opacity pl-[52px]">
                    Lihat Nilai &rarr;
                  </span>
                </button>
              ))}
            </div>
          )
        }
      })()}

      {raport && !loading && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="bg-[#0e6187]">
              <tr>
                <th className="border border-slate-600 px-4 py-3 font-medium text-white w-10">#</th>
                <th className="border border-slate-600 px-4 py-3 font-medium text-white">Nama Siswa</th>
                <th className="border border-slate-600 px-4 py-3 font-medium text-white text-center">NIK</th>
                <th className="border border-slate-600 px-4 py-3 font-medium text-white text-center">No. Registrasi</th>
                {raport.categories.map((cat) => (
                  <th key={cat.id} className="border border-slate-600 px-4 py-3 font-medium text-white text-center whitespace-nowrap">
                    {cat.nama}
                  </th>
                ))}
                <th className="border border-slate-600 px-4 py-3 font-medium text-white text-center">Rata-rata</th>
                <th className="border border-slate-600 px-4 py-3 font-medium text-white text-center w-20">Detail</th>
              </tr>
            </thead>
            <tbody>
              {raport.siswa.length === 0 ? (
                <tr>
                  <td colSpan={raport.categories.length + 6} className="border border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    Belum ada data nilai
                  </td>
                </tr>
              ) : (
                raport.siswa.map((s, idx) => (
                  <tr key={s.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-400 text-center">{idx + 1}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-800 font-medium">{s.nama}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500 text-center">{s.nik || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500 text-center">{s.no_registrasi || '-'}</td>
                    {raport.categories.map((cat) => {
                      const k = s.per_kategori.find((pk) => pk.id === cat.id)
                      const val = k?.rata_rata ?? null
                      return (
                        <td key={cat.id} className="border border-slate-200 px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${SCORE_BADGE(val)}`}>
                            {val !== null ? val : '-'}
                          </span>
                        </td>
                      )
                    })}
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${SCORE_BADGE(s.rata_rata)}`}>
                        {s.rata_rata !== null ? s.rata_rata : '-'}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <button
                        onClick={() => toggleExpand(s.id)}
                        className="text-[11px] font-semibold text-[#0E6187] hover:underline"
                      >
                        {expandedSiswa.has(s.id) ? 'Sembunyi' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {raport?.siswa.map((s) =>
        expandedSiswa.has(s.id) ? (
          <RaportDetail key={s.id} siswa={s} categories={raport.categories} />
        ) : null
      )}
    </div>
  )
}

function RaportDetail({
  siswa,
  categories,
}: {
  siswa: SiswaRaport
  categories: { id: number; nama: string; components: { id: number; nama: string }[] }[]
}) {
  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden fade-in">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <User size={14} className="text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">{siswa.nama}</p>
        <span className={`ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full ${SCORE_BADGE(siswa.rata_rata)}`}>
          Rata-rata: {siswa.rata_rata ?? '-'}
        </span>
      </div>
      <div className="p-5 space-y-6">
        {categories.map((cat) => {
          const k = siswa.per_kategori.find((pk) => pk.id === cat.id)
          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">{cat.nama}</h3>
                {k?.rata_rata !== null && k?.rata_rata !== undefined && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${SCORE_BADGE(k.rata_rata)}`}>
                    {k.rata_rata}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {cat.components.map((comp) => {
                  const c = k?.components.find((c) => c.id === comp.id)
                  const val = c?.rata_rata ?? null
                  return (
                    <div key={comp.id} className="rounded-lg border border-slate-100 bg-white p-3">
                      <p className="text-[11px] text-slate-500 font-medium mb-1">{comp.nama}</p>
                      <p className={`text-sm font-bold ${val !== null ? (val >= 90 ? 'text-emerald-700' : val >= 75 ? 'text-blue-700' : val >= 60 ? 'text-amber-700' : 'text-rose-700') : 'text-slate-300'}`}>
                        {val !== null ? val : '-'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{c?.total_nilai ?? 0} data</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
