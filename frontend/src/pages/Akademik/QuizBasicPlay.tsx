import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { quizApi } from '../../services/api'
import Swal from 'sweetalert2'

interface PlayQuestion {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: string[]
  points: number
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
  selected_index?: number | null
}

interface PlayAttempt {
  id: number
  attempt_number: number
  status: string
  started_at: string | null
  submitted_at: string | null
  score: number | null
  passing_score: number
  max_warnings: number
  time_limit_seconds: number
}

const fmtClock = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function QuizBasicPlay() {
  const { paketId, attemptId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navTitle = (location.state as { title?: string } | null)?.title

  const [attempt, setAttempt] = useState<PlayAttempt | null>(null)
  const [questions, setQuestions] = useState<PlayQuestion[]>([])
  const [selected, setSelected] = useState<Record<number, number | null>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [testTitle, setTestTitle] = useState('')

  const endTimeRef = useRef(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = null
  }, [])

  const load = useCallback(() => {
    if (!attemptId) return
    setIsLoading(true)
    quizApi.attempt(Number(attemptId)).then(res => {
      const a = res.data.attempt
      const data = res.data
      if (a?.status === 'submitted' || a?.score !== undefined) {
        navigate(`/siswa-dashboard/quiz/${paketId}`, { replace: true })
        return
      }
      setAttempt(a)
      setTestTitle(navTitle || res.data.paket?.title || res.data.test_name || 'Quiz')
      const pre: Record<number, number | null> = {}
      const qs: PlayQuestion[] = (data.questions || []).map((q: any) => {
        if (q.selected_index !== undefined && q.selected_index !== null) pre[q.id] = q.selected_index
        return {
          id: q.id, question: q.question, question_type: q.question_type ?? 'choice',
          rating_max: q.rating_max ?? null, options: q.options, points: q.points,
          image_url: q.image_url ?? null, audio_url: q.audio_url ?? null,
          audio_max_plays: q.audio_max_plays ?? null, selected_index: q.selected_index ?? null,
        }
      })
      setQuestions(qs)
      setSelected(pre)

      const endTime = Date.parse(a.started_at) + a.time_limit_seconds * 1000
      endTimeRef.current = endTime
      setRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)))
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal memuat percobaan' })
      navigate(`/siswa-dashboard/quiz/${paketId}`, { replace: true })
    }).finally(() => setIsLoading(false))
  }, [attemptId, paketId, navigate, navTitle])

  useEffect(() => {
    load()
    return stopTimers
  }, [load, stopTimers])

  const submitNow = useCallback((reason: string) => {
    if (!attemptId || isSubmitting) return
    setIsSubmitting(true)
    stopTimers()
    quizApi.submit(Number(attemptId)).then(() => {
      navigate(`/siswa-dashboard/quiz/${paketId}`, { replace: true })
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal mengumpulkan quiz', text: reason })
      setIsSubmitting(false)
      if (reason === 'waktu habis') setRemaining(0)
    })
  }, [attemptId, paketId, isSubmitting, stopTimers, navigate])

  useEffect(() => {
    if (!attempt) return
    countdownRef.current = setInterval(() => {
      const r = Math.max(0, Math.floor((endTimeRef.current - Date.now()) / 1000))
      setRemaining(r)
      if (r <= 0) {
        stopTimers()
        submitNow('waktu habis')
      }
    }, 1000)
    return stopTimers
  }, [attempt, submitNow, stopTimers])

  const selectAnswer = (idx: number) => {
    const q = questions[currentIndex]
    if (!q || !attemptId || isSaving) return
    setIsSaving(true)
    const current = selected[q.id]
    const next = current === idx ? null : idx
    setSelected({ ...selected, [q.id]: next })
    quizApi.answer(Number(attemptId), { question_id: q.id, selected_index: next === null ? -1 : next })
      .then(() => setIsSaving(false))
      .catch(() => {
        setSelected({ ...selected, [q.id]: current })
        setIsSaving(false)
        Swal.fire({ icon: 'warning', title: 'Gagal menyimpan jawaban', text: 'Periksa koneksi Anda' })
      })
  }

  const submitManually = () => {
    const unanswered = questions.length - questions.filter(q => selected[q.id] !== undefined && selected[q.id] !== null).length
    Swal.fire({
      title: 'Kumpulkan quiz?',
      text: unanswered > 0 ? `Masih ada ${unanswered} soal yang belum dijawab. Jawaban yang sudah dipilih akan dinilai.` : 'Semua soal sudah terjawab. Yakin ingin mengumpulkan?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0069b0',
      confirmButtonText: 'Ya, Kumpulkan',
      cancelButtonText: 'Periksa lagi',
    }).then(res => {
      if (res.isConfirmed) submitNow('manual')
    })
  }

  const lowTime = remaining <= 60
  const answeredCount = questions.filter(q => selected[q.id] !== undefined && selected[q.id] !== null).length
  const currentQuestion = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F5F8]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0069b0]/20 border-t-[#0069b0] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#8B90A0]">Memuat soal...</p>
        </div>
      </div>
    )
  }

  if (!attempt || !currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F4F5F8]">
        <div className="text-center px-6">
          <AlertTriangle size={32} className="text-orange-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#14182B]">Soal tidak ditemukan</p>
          <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Attempt tidak valid atau sudah diselesaikan</p>
          <button onClick={() => navigate(`/siswa-dashboard/quiz/${paketId}`)}
            className="mt-4 text-[11px] font-bold text-[#0069b0] hover:underline">
            Kembali ke quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#F4F5F8]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-[#E5E7EF] px-4 py-3 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => navigate(`/siswa-dashboard/quiz/${paketId}`)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF] transition-colors shrink-0">
                <ArrowLeft size={15} className="text-[#4B5063]" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#14182B] truncate">{testTitle}</p>
                <p className="text-[10px] text-[#8B90A0] font-medium">Soal {currentIndex + 1} / {questions.length}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 ${lowTime ? 'bg-red-50 border border-red-200' : 'bg-[#F4F5F8]'}`}>
              <Clock size={13} className={lowTime ? 'text-red-500' : 'text-[#8B90A0]'} />
              <span className={`text-xs font-bold tabular-nums ${lowTime ? 'text-red-500' : 'text-[#14182B]'}`}>
                {fmtClock(remaining)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2.5 h-1.5 bg-[#F0F1F5] rounded-full overflow-hidden">
            <div className="h-full bg-[#0069b0] rounded-full transition-all duration-300"
              style={{ width: `${questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-[#8B90A0] font-medium">{answeredCount} / {questions.length} terjawab</p>
            <p className="text-[10px] text-[#8B90A0] font-medium">{currentQuestion.points} poin</p>
          </div>
        </div>
      </div>

      {/* ── Question navigator strip ── */}
      <div className="bg-white border-b border-[#E5E7EF] px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 max-w-lg mx-auto">
          {questions.map((q, idx) => {
            const isActive = idx === currentIndex
            const isAnswered = selected[q.id] !== undefined && selected[q.id] !== null
            return (
              <button key={q.id} onClick={() => setCurrentIndex(idx)}
                className={`relative flex h-8 min-w-[32px] shrink-0 items-center justify-center rounded-lg px-1.5 text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#0069b0] text-white shadow-sm'
                    : isAnswered
                      ? 'bg-[#0069b0]/10 text-[#0069b0]'
                      : 'bg-[#F4F5F8] text-[#8B90A0] hover:bg-[#E5E7EF]'
                }`}>
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5 shadow-sm">
            {/* Question number badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0069b0]/[0.06] text-[11px] font-bold text-[#0069b0]">
                {currentIndex + 1}
              </span>
              <div className="h-px flex-1 bg-[#F0F1F5]" />
              <span className="text-[10px] font-bold text-[#8B90A0] bg-[#F4F5F8] px-2 py-0.5 rounded-full">
                {currentQuestion.points} poin
              </span>
            </div>

            {/* Question image */}
            {currentQuestion.image_url && (
              <div className="mb-4 flex justify-center">
                <img src={currentQuestion.image_url} alt="Soal"
                  className="max-h-56 w-auto max-w-full rounded-xl border border-[#E5E7EF] object-contain" />
              </div>
            )}

            {/* Question text */}
            <p className="text-sm font-semibold text-[#14182B] leading-relaxed">
              {currentQuestion.question}
            </p>

            {/* Options */}
            <div className="mt-5 space-y-2.5">
              {currentQuestion.question_type === 'rating' && (
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide mb-1">
                  Skala penilaian 1–{currentQuestion.rating_max || currentQuestion.options.length} — pilih salah satu
                </p>
              )}
              {currentQuestion.options.map((opt, oi) => {
                const isSelected = selected[currentQuestion.id] === oi
                const badgeLabel = currentQuestion.question_type === 'rating' ? opt : String.fromCharCode(65 + oi)
                return (
                  <button key={oi} onClick={() => selectAnswer(oi)} disabled={isSaving}
                    className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-xl border-2 transition-all disabled:opacity-50 ${
                      isSelected
                        ? currentQuestion.question_type === 'rating'
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-[#0069b0] bg-[#0069b0]/[0.04]'
                        : 'border-[#F0F1F5] bg-white hover:border-[#D6D9E1] hover:bg-[#FAFBFC]'
                    }`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                      isSelected
                        ? currentQuestion.question_type === 'rating'
                          ? 'bg-violet-500 text-white'
                          : 'bg-[#0069b0] text-white'
                        : 'bg-[#F4F5F8] text-[#8B90A0]'
                    }`}>
                      {badgeLabel}
                    </span>
                    <span className={`text-[13px] flex-1 ${
                      isSelected
                        ? currentQuestion.question_type === 'rating'
                          ? 'font-bold text-violet-600'
                          : 'font-bold text-[#0069b0]'
                        : 'font-medium text-[#4B5063]'
                    }`}>
                      {opt}
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={18} className={`shrink-0 ${
                        currentQuestion.question_type === 'rating' ? 'text-violet-500' : 'text-[#0069b0]'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer navigation ── */}
      <div className="bg-white border-t border-[#E5E7EF] px-4 py-3 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={isFirst}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E5E7EF] text-[12px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] transition-colors disabled:opacity-40 disabled:pointer-events-none">
            <ArrowLeft size={14} /> Kembali
          </button>

          <div className="flex-1" />

          {!isLast ? (
            <button onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0069b0] text-[12px] font-bold text-white hover:bg-[#004d7a] transition-colors">
              Selanjutnya <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={submitManually} disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-[12px] font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50">
              <CheckCircle2 size={14} />
              {isSubmitting ? 'Mengumpulkan...' : 'Selesai & Kumpulkan'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
