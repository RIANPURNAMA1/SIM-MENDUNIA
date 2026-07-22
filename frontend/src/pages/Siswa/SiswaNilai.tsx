import { useState, useEffect, useCallback } from 'react'
import {
  Award, ChevronDown, ChevronRight,
  Calendar, BarChart3, Clock, MessageSquare, ArrowLeft, Star,
  ChevronLeft, Send, BookOpen, Users, Shield, ClipboardCheck
} from 'lucide-react'
import Swal from 'sweetalert2'
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
  levels: { level: string; tanggal_mulai: string | null; tanggal_selesai: string | null }[]
}

export default function SiswaNilai() {
  const [batches, setBatches] = useState<BatchInfo[]>([])
  const [selectedBatch, setSelectedBatch] = useState<BatchInfo | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const [levels, setLevels] = useState<LevelData[]>([])
  const [overallAvg, setOverallAvg] = useState<number | null>(null)
  const [totalPenilaian, setTotalPenilaian] = useState(0)
  const [totalHari, setTotalHari] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<Record<string, { evaluasi: string | null; user?: { name: string } }>>({})
  const [studentEvals, setStudentEvals] = useState<Record<string, { rating: number; komentar: string | null; scores?: Record<string, number> | null; text_responses?: Record<string, string> | null }>>({})
  const [evalRating, setEvalRating] = useState<Record<string, number>>({})
  const [evalKomentar, setEvalKomentar] = useState<Record<string, string>>({})
  const [savingEval, setSavingEval] = useState<string | null>(null)
  const [showEvalModal, setShowEvalModal] = useState<string | null>(null)
  const [evalStep, setEvalStep] = useState(0)
  const [evalScores, setEvalScores] = useState<Record<string, number>>({})
  const [evalTexts, setEvalTexts] = useState<Record<string, string>>({})
  const [evalModalComment, setEvalModalComment] = useState('')

  useEffect(() => {
    api.get('/siswa/siswa-batches').then((res: any) => {
      setBatches(res.data.batches || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadBatchDetail = useCallback((batch: BatchInfo, level?: string) => {
    setSelectedBatch(batch)
    setSelectedLevel(level || null)
    setLoadingDetail(true)
    setExpandedLevel(level || null)
    setLevels([])
    setOverallAvg(null)
    setTotalPenilaian(0)
    setTotalHari(0)
    setEvaluations({})

    api.get('/siswa/nilai-lms', { params: { batch_id: batch.id } }).then((res: any) => {
      setLevels(res.data.levels || [])
      setOverallAvg(res.data.summary?.overall_avg ?? null)
      setTotalPenilaian(res.data.summary?.total_penilaian ?? 0)
      setTotalHari(res.data.summary?.total_hari ?? 0)
    }).catch(() => {}).finally(() => setLoadingDetail(false))

    api.get('/siswa/evaluations', { params: { batch_id: batch.id } }).then((res: any) => {
      setEvaluations(res.data.evaluations || {})
    }).catch(() => {})
    api.get('/siswa/evaluasi-guru', { params: { batch_id: batch.id } }).then((res: any) => {
      const raw = res.data.evaluations || {}
      setStudentEvals(raw)
      const r: Record<string, number> = {}
      const k: Record<string, string> = {}
      for (const [lv, ev] of Object.entries(raw)) {
        r[lv] = (ev as any).rating || 0
        k[lv] = (ev as any).komentar || ''
      }
      setEvalRating(r)
      setEvalKomentar(k)
    }).catch(() => {})
  }, [])

  const goBack = () => {
    setSelectedBatch(null)
    setSelectedLevel(null)
    setLevels([])
    setOverallAvg(null)
    setTotalPenilaian(0)
    setTotalHari(0)
    setEvaluations({})
    setStudentEvals({})
    setEvalRating({})
    setEvalKomentar({})
    setExpandedLevel(null)
  }

  const getBarColor = (score: number | null) => {
    if (score === null) return 'bg-gray-200'
    if (score >= 80) return 'bg-[#0E6187]'
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

  const formatDateRange = (mulai: string | null, selesai: string | null) => {
    if (!mulai || !selesai) return null
    const m = new Date(mulai)
    const s = new Date(selesai)
    return `${m.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const saveStudentEval = async (level: string) => {
    if (!selectedBatch || !evalRating[level]) return
    setSavingEval(level)
    try {
      await api.post('/siswa/evaluasi-guru', {
        batch_id: selectedBatch.id,
        level,
        rating: evalRating[level],
        komentar: evalKomentar[level] || null,
      })
      setStudentEvals(prev => ({
        ...prev,
        [level]: { rating: evalRating[level], komentar: evalKomentar[level] || null }
      }))
    } catch { }
    setSavingEval(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
        </div>
        <div className="p-8 text-center">
          <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-[#0E6187] animate-spin" />
          </div>
          <p className="text-xs text-gray-400 mt-3">Memuat data...</p>
        </div>
      </div>
    )
  }

  // ─── BATCH LIST VIEW ───
  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] pb-24">
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Hasil penilaian harian per level</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 pt-4 space-y-3">
          {batches.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-14 h-14 rounded-full border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3">
                <BarChart3 size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Belum ada penilaian</p>
              <p className="text-xs text-gray-400 mt-1">Penilaian akan muncul setelah sensei mengisi</p>
            </div>
          ) : (
            <div className="space-y-3">
            {batches.flatMap(batch =>
              batch.levels && batch.levels.length > 0
                ? batch.levels.map(lv => (
                    <button
                      key={`${batch.id}-${lv.level}`}
                      onClick={() => loadBatchDetail(batch, lv.level)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-gray-500">L{lv.level}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{batch.nama_batch}</p>
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">Level {lv.level}</span>
                        </div>
                        {lv.tanggal_mulai && lv.tanggal_selesai && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDateRange(lv.tanggal_mulai, lv.tanggal_selesai)}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  ))
                : [
                    <button
                      key={`batch-${batch.id}`}
                      onClick={() => loadBatchDetail(batch)}
                      className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shrink-0">
                        <Award size={18} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{batch.nama_batch}</p>
                        {batch.tanggal_mulai && batch.tanggal_selesai && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {formatDateRange(batch.tanggal_mulai, batch.tanggal_selesai)}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </button>
                  ]
            )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── BATCH DETAIL VIEW ───
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={goBack} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 -ml-1 transition-colors">
            <ArrowLeft size={16} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">Penilaian</h1>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">Hasil penilaian harian per level</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">

        {loadingDetail ? (
          <div className="p-8 text-center">
            <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-[#0E6187] animate-spin" />
            </div>
            <p className="text-xs text-gray-400 mt-3">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Level List */}
            {(() => {
              const displayLevels = selectedLevel
                ? levels.filter(l => l.level === selectedLevel)
                : levels

              return displayLevels.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-full border border-gray-200 bg-white flex items-center justify-center mx-auto mb-3">
                    <BarChart3 size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada penilaian</p>
                  <p className="text-xs text-gray-400 mt-1">Penilaian akan muncul setelah sensei mengisi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayLevels.map(level => {
                    const isExpanded = expandedLevel === level.level
                    const componentNames = [...new Set(
                      level.daily.flatMap(d => d.komponen.map(k => k.nama))
                    )]

                  return (
                    <div key={level.level} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="border-t border-gray-100">
                          {/* Evaluasi Guru */}
                          {evaluations[level.level]?.evaluasi && (
                            <div className="p-4 border-b border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={12} className="text-[#0E6187]" />
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

                          {/* Beri Evaluasi untuk Sensei */}
                          <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                              <Star size={12} className="text-amber-500" />
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                {studentEvals[level.level] ? 'Evaluasi Anda' : 'Beri Evaluasi'}
                              </p>
                            </div>
                            {studentEvals[level.level] && !evalRating[level.level] ? (
                              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="flex items-center gap-1 mb-2">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={14} className={s <= (studentEvals[level.level].scores ? Math.round(Object.values(studentEvals[level.level].scores!).reduce((a,b)=>a+b,0)/Object.values(studentEvals[level.level].scores!).length) : studentEvals[level.level].rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                  ))}
                                  <span className="text-xs text-gray-400 ml-1">
                                    {studentEvals[level.level].scores
                                      ? (Object.values(studentEvals[level.level].scores!).reduce((a,b)=>a+b,0)/Object.values(studentEvals[level.level].scores!).length).toFixed(1)
                                      : studentEvals[level.level].rating}/5
                                  </span>
                                </div>
                                {studentEvals[level.level].komentar && (
                                  <p className="text-xs text-gray-600">{studentEvals[level.level].komentar}</p>
                                )}
                                <button
                                  onClick={() => {
                                    const ev = studentEvals[level.level]
                                    setEvalRating(prev => ({ ...prev, [level.level]: ev.rating }))
                                    setEvalKomentar(prev => ({ ...prev, [level.level]: ev.komentar || '' }))
                                    setEvalScores(ev.scores || {})
                                    setEvalTexts(ev.text_responses || {})
                                    setEvalModalComment(ev.komentar || '')
                                    setShowEvalModal(level.level)
                                    setEvalStep(0)
                                  }}
                                  className="text-[10px] text-[#0E6187] font-medium mt-2 hover:underline"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setShowEvalModal(level.level)
                                  setEvalStep(0)
                                  setEvalScores({})
                                  setEvalTexts({})
                                  setEvalModalComment('')
                                }}
                                className="w-full rounded-lg bg-[#42b72a] px-3 py-2.5 text-xs font-semibold text-white hover:bg-[#36a022] transition flex items-center justify-center gap-2"
                              >
                                <ClipboardCheck size={14} />
                                {studentEvals[level.level] ? 'Edit Evaluasi' : 'Beri Evaluasi'}
                              </button>
                            )}
                          </div>

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
                    </div>
                  )
                })}
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* Evaluasi Instruktur Modal */}
      {showEvalModal && (
        <EvalInstrukturModal
          level={showEvalModal}
          batchId={selectedBatch!.id}
          step={evalStep}
          setStep={setEvalStep}
          scores={evalScores}
          setScores={setEvalScores}
          texts={evalTexts}
          setTexts={setEvalTexts}
          comment={evalModalComment}
          setComment={setEvalModalComment}
          existingRatings={evalRating[showEvalModal] || 0}
          existingKomentar={evalKomentar[showEvalModal] || ''}
          onClose={() => {
            setShowEvalModal(null)
            setEvalStep(0)
            setEvalScores({})
            setEvalTexts({})
            setEvalModalComment('')
          }}
          onSuccess={(scores, avg, komentar) => {
            setEvalRating(prev => ({ ...prev, [showEvalModal!]: avg }))
            setEvalKomentar(prev => ({ ...prev, [showEvalModal!]: komentar }))
            setStudentEvals(prev => ({
              ...prev,
              [showEvalModal!]: { rating: avg, komentar, scores, text_responses: evalTexts }
            }))
            setShowEvalModal(null)
            setEvalStep(0)
            setEvalScores({})
            setEvalTexts({})
            setEvalModalComment('')
          }}
          batchName={selectedBatch!.nama_batch}
        />
      )}
    </div>
  )
}

interface EvalInstrukturModalProps {
  level: string
  batchId: number
  step: number
  setStep: (s: number) => void
  scores: Record<string, number>
  setScores: (fn: (prev: Record<string, number>) => Record<string, number>) => void
  texts: Record<string, string>
  setTexts: (fn: (prev: Record<string, string>) => Record<string, string>) => void
  comment: string
  setComment: (v: string) => void
  existingRatings: number
  existingKomentar: string
  onClose: () => void
  onSuccess: (scores: Record<string, number>, avg: number, komentar: string) => void
  batchName: string
}

function EvalInstrukturModal({
  level, batchId, step, setStep, scores, setScores, texts, setTexts,
  comment, setComment, existingRatings, existingKomentar, onClose, onSuccess, batchName
}: EvalInstrukturModalProps) {
  const [saving, setSaving] = useState(false)

  const steps = [
    { label: 'Petunjuk', icon: BookOpen },
    { label: 'Penguasaan Materi', icon: BookOpen },
    { label: 'Metode Mengajar', icon: Users },
    { label: 'Komunikasi & Interaksi', icon: MessageSquare },
    { label: 'Kedisiplinan & Tanggung Jawab', icon: Shield },
    { label: 'Evaluasi & Masukan', icon: ClipboardCheck },
    { label: 'Kirim', icon: Send },
  ]

  const scoreLabels: Record<string, string[]> = {
    penguasaan_materi: [
      'Instruktur menguasai materi yang diajarkan dengan baik',
      'Penjelasan instruktur mudah dipahami',
      'Instruktur mampu menjawab pertanyaan kandidat dengan baik dan jelas',
      'Materi yang disampaikan sesuai dengan topik/materi level ini',
    ],
    metode_mengajar: [
      'Instruktur mengajar dengan cara yang menarik dan tidak membosankan',
      'Instruktur memberikan contoh yang membantu pemahaman materi',
      'Kecepatan penyampaian materi sudah sesuai',
      'Instruktur memberikan kesempatan kandidat untuk berlatih',
    ],
    komunikasi: [
      'Instruktur berkomunikasi dengan sopan dan profesional',
      'Instruktur mendorong kandidat untuk aktif dalam kelas',
      'Instruktur memberikan perhatian yang cukup kepada seluruh kandidat',
      'Instruktur menciptakan suasana kelas yang nyaman',
    ],
    kedisiplinan: [
      'Instruktur hadir tepat waktu',
      'Instruktur mempersiapkan kelas dengan baik',
      'Instruktur menyelesaikan materi sesuai jadwal yang ditentukan',
      'Instruktur memberikan umpan balik yang membantu perkembangan kandidat',
    ],
  }

  const textFields = [
    { key: 'perlu_ditingkatkan', label: 'Apa yang perlu ditingkatkan oleh instruktur?', required: true },
    { key: 'topik_belum_dimengerti', label: 'Topik yang belum dimengerti di Level ini. Sebutkan alasannya', required: true },
    { key: 'evaluasi_instruktur', label: 'Evaluasi untuk Instruktur', required: true },
    { key: 'saran_kualitas', label: 'Saran untuk meningkatkan kualitas pembelajaran', required: true },
  ]

  const avgScore = Object.keys(scores).length > 0
    ? Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    : 0

  const canProceed = () => {
    if (step === 0) return true
    if (step >= 1 && step <= 4) {
      const keys = Object.keys(scoreLabels)[step - 1]
      const required = scoreLabels[keys as keyof typeof scoreLabels]
      return required.every((_, i) => scores[`${keys}_${i}`])
    }
    if (step === 5) {
      return textFields.every(f => !f.required || texts[f.key]?.trim())
    }
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.post('/siswa/evaluasi-guru', {
        batch_id: batchId,
        level,
        rating: Math.round(avgScore * 10) / 10,
        komentar: comment || null,
        scores,
        text_responses: texts,
      })
      Swal.fire({ icon: 'success', title: 'Evaluasi Terkirim', text: 'Terima kasih atas evaluasi Anda!', timer: 2000, showConfirmButton: false })
      onSuccess(scores, Math.round(avgScore * 10) / 10, comment)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengirim evaluasi' })
    }
    setSaving(false)
  }

  const renderScaleQuestion = (key: string, question: string, idx: number) => (
    <div key={key} className="py-4 border-b border-gray-100 last:border-0">
      <p className="text-sm text-gray-800 font-medium mb-3">
        <span className="text-gray-400 mr-1">{idx + 1}.</span>
        {question}
        <span className="text-red-400 ml-0.5">*</span>
      </p>
      <div className="flex items-center gap-1 sm:gap-2">
        <span className="text-[10px] text-gray-400 shrink-0 w-16 text-right">Sangat tidak setuju</span>
        <div className="flex gap-1 sm:gap-2 mx-2">
          {[1,2,3,4,5].map(v => (
            <button key={v} type="button" onClick={() => setScores(prev => ({ ...prev, [key]: v }))}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-sm font-semibold transition-all ${
                scores[key] === v
                  ? 'bg-[#0E6187] text-white shadow-md scale-110'
                  : scores[key] && scores[key] > v
                    ? 'bg-[#0E6187]/10 text-[#0E6187]'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}>
              {v}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 w-16">Sangat setuju</span>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#0E6187] px-5 py-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">Evaluasi Instruktur</h2>
              <p className="text-[11px] text-white/70 mt-0.5">Level {level} — {batchName}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <span className="text-white text-lg leading-none">&times;</span>
            </button>
          </div>
          {/* Progress */}
          <div className="mt-3 flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Step 0: Petunjuk */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#0E6187]/10 flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck size={28} className="text-[#0E6187]" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Evaluasi Instruktur</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                  Formulir ini bertujuan untuk mengevaluasi kinerja instruktur selama proses pembelajaran berlangsung. Penilaian dari peserta sangat penting untuk meningkatkan kualitas pengajaran, metode, dan pendekatan instruktur dalam menyampaikan materi.
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-xs text-gray-600 leading-relaxed">
                  Kandidat diminta untuk memberikan penilaian secara jujur, objektif, dan bertanggung jawab berdasarkan pengalaman mengikuti kelas. Hasil evaluasi akan digunakan sebagai bahan perbaikan dan pengembangan profesional bagi instruktur, serta untuk peningkatan mutu pelatihan di <strong>Mendunia.id</strong>
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-xs text-gray-600">
                  <strong>Catatan:</strong> Semua penilaian bersifat rahasia dan tidak memengaruhi nilai akhir kandidat.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Keterangan Skor:</p>
                <div className="space-y-1">
                  {[1,2,3,4,5].map(v => (
                    <div key={v} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-[#0E6187] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{v}</span>
                      <span>{v === 1 ? 'Sangat Tidak Setuju' : v === 2 ? 'Tidak Setuju' : v === 3 ? 'Netral' : v === 4 ? 'Setuju' : 'Sangat Setuju'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1-4: Rating Sections */}
          {step >= 1 && step <= 4 && (() => {
            const keys = Object.keys(scoreLabels)[step - 1]
            const questions = scoreLabels[keys as keyof typeof scoreLabels]
            const sectionNames = ['Penguasaan Materi', 'Metode Mengajar', 'Komunikasi dan Interaksi', 'Kedisiplinan dan Tanggung Jawab']
            const sectionIcons = [BookOpen, Users, MessageSquare, Shield]
            const Icon = sectionIcons[step - 1]
            return (
              <div>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-[#0E6187]/10 flex items-center justify-center">
                    <Icon size={16} className="text-[#0E6187]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{sectionNames[step - 1]}</h3>
                    <p className="text-[10px] text-gray-400">{questions.length} pertanyaan • Skor 1-5</p>
                  </div>
                </div>
                <div>
                  {questions.map((q, i) => renderScaleQuestion(`${keys}_${i}`, q, i))}
                </div>
              </div>
            )
          })()}

          {/* Step 5: Text Fields */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-[#0E6187]/10 flex items-center justify-center">
                  <ClipboardCheck size={16} className="text-[#0E6187]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Evaluasi & Masukan</h3>
                  <p className="text-[10px] text-gray-400">Berikan penilaian dan saran Anda</p>
                </div>
              </div>
              {textFields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm text-gray-700 font-medium mb-2">
                    {f.label}
                    {f.required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  <textarea
                    value={texts[f.key] || ''}
                    onChange={e => setTexts(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0E6187] focus:outline-none focus:ring-1 focus:ring-[#0E6187] resize-none transition"
                    rows={3}
                    placeholder="Tulis jawaban Anda..."
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 6: Review & Submit */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Send size={24} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Kirim Evaluasi</h3>
                <p className="text-xs text-gray-400">Pastikan semua jawaban sudah benar</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Ringkasan Penilaian</p>
                <div className="space-y-2">
                  {Object.keys(scoreLabels).map((key, idx) => {
                    const questions = scoreLabels[key as keyof typeof scoreLabels]
                    const sectionAvg = questions.map((_, i) => scores[`${key}_${i}`] || 0).filter(v => v > 0)
                    const avg = sectionAvg.length > 0 ? (sectionAvg.reduce((a,b)=>a+b,0) / sectionAvg.length).toFixed(1) : '-'
                    const names = ['Penguasaan Materi', 'Metode Mengajar', 'Komunikasi & Interaksi', 'Kedisiplinan & Tanggung Jawab']
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                        <span className="text-xs text-gray-600">{names[idx]}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(v => (
                              <div key={v} className={`w-2.5 h-2.5 rounded-full ${typeof avg === 'string' && avg !== '-' && Number(avg) >= v ? 'bg-amber-400' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-gray-800">{avg}</span>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-gray-800">Rata-rata Total</span>
                    <span className="text-lg font-bold text-[#0E6187]">{avgScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 font-medium mb-2">Komentar untuk sensei (opsional)</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#0E6187] focus:outline-none focus:ring-1 focus:ring-[#0E6187] resize-none transition"
                  rows={3}
                  placeholder="Tulis komentar untuk sensei (opsional)..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3 bg-white">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <ChevronLeft size={16} /> Kembali
            </button>
          ) : <div />}

          {step < steps.length - 1 ? (
            <button onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#0E6187] rounded-lg hover:bg-[#005a96] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Selanjutnya <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#42b72a] rounded-lg hover:bg-[#36a022] transition-colors disabled:opacity-50">
              {saving ? (
                <><span className="animate-spin">&#9696;</span> Mengirim...</>
              ) : (
                <><Send size={14} /> Kirim Evaluasi</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
