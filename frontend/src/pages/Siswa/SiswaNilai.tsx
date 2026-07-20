import { useState, useEffect } from 'react'
import {
  Award, ChevronDown, TrendingUp,
  Calendar, BarChart3, Clock, MessageSquare
} from 'lucide-react'
import api from '../../services/api'

interface Komponen {
  nama: string
  nilai: number
}

interface DailyEntry {
  tanggal: string
  rata_rata: number | null
  komponen: Komponen[]
}

interface LevelData {
  level: string
  rata_rata: number | null
  total_pertemuan: number
  total_nilai: number
  daily: DailyEntry[]
}

interface BatchInfo {
  id: number
  nama_batch: string
  tanggal_mulai: string | null
  tanggal_selesai: string | null
}

export default function SiswaNilai() {
  const [batch, setBatch] = useState<BatchInfo | null>(null)
  const [levels, setLevels] = useState<LevelData[]>([])
  const [overallAvg, setOverallAvg] = useState<number | null>(null)
  const [totalPenilaian, setTotalPenilaian] = useState(0)
  const [totalHari, setTotalHari] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<Record<string, { evaluasi: string | null; user?: { name: string } }>>({})

  useEffect(() => {
    api.get('/siswa/nilai-lms').then((res: any) => {
      setBatch(res.data.batch)
      setLevels(res.data.levels || [])
      setOverallAvg(res.data.summary?.overall_avg ?? null)
      setTotalPenilaian(res.data.summary?.total_penilaian ?? 0)
      setTotalHari(res.data.summary?.total_hari ?? 0)
    }).catch(() => {}).finally(() => setLoading(false))
    api.get('/siswa/evaluations').then((res: any) => {
      setEvaluations(res.data.evaluations || {})
    }).catch(() => {})
  }, [])

  const getBarColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200'
    if (score >= 80) return 'bg-[#0069b0]'
    if (score >= 60) return 'bg-gray-500'
    return 'bg-gray-400'
  }

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatDateShort = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
        </div>
        <div className="p-8 text-center">
          <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-[#0069b0] animate-spin" />
          </div>
          <p className="text-xs text-gray-400 mt-3">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Hasil penilaian harian per level</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">

        {/* Batch Card */}
        {batch && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
              <Award size={18} className="text-gray-400" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-900">{batch.nama_batch}</h2>
              {batch.tanggal_mulai && batch.tanggal_selesai && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(batch.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – {new Date(batch.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center px-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Pertemuan</p>
              <p className="text-xl font-semibold text-gray-900">{totalHari}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Total Nilai</p>
              <p className="text-xl font-semibold text-gray-900">{totalPenilaian}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Rata-rata</p>
              <p className="text-xl font-semibold text-gray-900">
                {overallAvg !== null ? overallAvg : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Level List */}
        {levels.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-14 h-14 rounded-full border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3">
              <BarChart3 size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">Belum ada penilaian</p>
            <p className="text-xs text-gray-400 mt-1">Penilaian akan muncul setelah sensei mengisi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {levels.map(level => {
              const isExpanded = expandedLevel === level.level
              const componentNames = [...new Set(
                level.daily.flatMap(d => d.komponen.map(k => k.nama))
              )]

              return (
                <div key={level.level} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Level Header */}
                  <button
                    onClick={() => setExpandedLevel(isExpanded ? null : level.level)}
                    className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center shrink-0 bg-white">
                      <span className="text-sm font-semibold text-gray-600">{level.level}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Level {level.level}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {level.total_pertemuan} pertemuan · {level.total_nilai} nilai
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {level.rata_rata !== null ? level.rata_rata : '-'}
                          </span>
                          <ChevronDown size={14} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {/* Progress */}
                      <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getBarColor(level.rata_rata)}`}
                          style={{ width: `${level.rata_rata ?? 0}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Evaluasi Guru */}
                      {evaluations[level.level]?.evaluasi && (
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare size={12} className="text-[#0069b0]" />
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Evaluasi Sensei</p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <p className="text-xs text-gray-600 leading-relaxed">{evaluations[level.level].evaluasi}</p>
                            {evaluations[level.level].user && (
                              <p className="text-[10px] text-gray-400 mt-2">— {evaluations[level.level].user!.name}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {level.daily.length > 0 && (
                        <div className="border-t border-gray-100">
                          {/* Per-day score cards */}
                          {level.daily.map((day, idx) => (
                            <div key={day.tanggal} className={`${idx > 0 ? 'border-t border-gray-100' : ''} p-4`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Clock size={12} className="text-gray-300" />
                                  <p className="text-[11px] font-bold text-gray-500">{formatDate(day.tanggal)}</p>
                                </div>
                                <span className="text-[11px] font-medium text-gray-500">
                                  Rata-rata: {day.rata_rata ?? '-'}
                                </span>
                              </div>

                              {/* Component scores */}
                              <div className="grid grid-cols-3 gap-2">
                                {day.komponen.map(k => (
                                  <div key={k.nama} className="border border-gray-200 rounded-lg p-3 text-center bg-white">
                                    <p className="text-[10px] font-medium text-gray-400 truncate">{k.nama}</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-0.5">{k.nilai}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Summary Table */}
                          {componentNames.length > 0 && (
                            <div className="border-t border-gray-100 overflow-x-auto">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-400 border-b border-r border-gray-200 bg-gray-50">Tanggal</th>
                                    {componentNames.map(name => (
                                      <th key={name} className="text-center px-3 py-3 font-medium text-gray-400 border-b border-r border-gray-200 bg-gray-50">{name}</th>
                                    ))}
                                    <th className="text-center px-3 py-3 font-medium text-gray-400 border-b border-gray-200 bg-gray-50">Rata-rata</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {level.daily.map(day => (
                                    <tr key={day.tanggal}>
                                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap border-b border-r border-gray-200 bg-white">{formatDateShort(day.tanggal)}</td>
                                      {componentNames.map(name => {
                                        const comp = day.komponen.find(k => k.nama === name)
                                        return (
                                          <td key={name} className="text-center px-3 py-3 border-b border-r border-gray-200 bg-white">
                                            {comp ? (
                                              <span className="font-semibold text-gray-900">{comp.nilai}</span>
                                            ) : (
                                              <span className="text-gray-200">-</span>
                                            )}
                                          </td>
                                        )
                                      })}
                                      <td className="text-center px-3 py-3 border-b border-gray-200 bg-white">
                                        <span className="font-semibold text-gray-900">
                                          {day.rata_rata !== null ? day.rata_rata : '-'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
