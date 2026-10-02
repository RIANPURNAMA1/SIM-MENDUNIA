import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Volume2, VolumeX, Play, Pause, X, FileQuestion, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { guruLmsApi, lmsApi } from '../../services/api'
import { useForceLightMode } from '../../hooks/useForceLightMode'

const cleanQuillHtml = (html: string | null | undefined) =>
  (html ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

const letter = (i: number) => String.fromCharCode(65 + i)

interface PembahasanOption {
  text?: string
  image_url?: string | null
}

interface PembahasanQuestion {
  id: number
  question: string
  section?: { id?: number; name?: string | null } | string | null
  question_type?: string
  rating_max?: number | null
  options?: PembahasanOption[] | null
  correct_index?: number | null
  correct_indexes?: number[] | null
  keyword?: string | null
  points?: number
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
}

interface PembahasanPaket {
  title: string
  quiz_template?: string
  cover_url?: string | null
}

const sectionNameOf = (q: PembahasanQuestion): string => {
  const s = q.section
  if (typeof s === 'string') return s.trim()
  return (s?.name || '').trim()
}

function PembahasanAudio({ src, maxPlays }: { src: string; maxPlays: number | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [plays, setPlays] = useState(0)

  const locked = maxPlays !== null && plays >= maxPlays
  const remaining = maxPlays !== null ? Math.max(0, maxPlays - plays) : null

  const togglePlay = () => {
    const a = audioRef.current
    if (!a || locked || playing) {
      if (a && !a.paused) a.pause()
      return
    }
    if (a.currentTime >= (a.duration || 0) - 0.1) a.currentTime = 0
    a.play().catch(() => {})
  }

  return (
    <div className="mt-4 rounded-lg border border-[#c9e2f0] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {locked ? <VolumeX size={16} className="text-gray-400" /> : <Volume2 size={16} className="text-[#0069b0]" />}
          <p className={`text-[11px] font-bold ${locked ? 'text-gray-400' : 'text-gray-700'}`}>
            {locked ? 'Audio tidak tersedia lagi' : 'Putar soal audio'}
          </p>
        </div>
        {remaining !== null && (
          <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${locked ? 'bg-gray-100 text-gray-400' : 'bg-[#0069b0]/10 text-[#0069b0]'}`}>
            Sisa putar: {remaining}x
          </span>
        )}
      </div>
      {locked ? (
        <div className="mt-2 rounded bg-gray-50 py-3 text-center text-[11px] font-semibold text-gray-400">
          Anda sudah mendengarkan audio sebanyak {plays} kali
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0069b0] text-white shadow transition hover:bg-[#005a96]"
            aria-label={playing ? 'Jeda' : 'Putar'}
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6f2f8]">
              <div className="h-full rounded-full bg-[#0069b0] transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-1 truncate text-[10px] font-medium text-gray-400">
              {playing ? 'Sedang diputar…' : 'Tekan play untuk mendengar (tidak bisa di-skip)'}
            </p>
          </div>
        </div>
      )}
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (a && a.duration) setProgress(Math.min(1, a.currentTime / a.duration))
        }}
        onEnded={() => {
          const a = audioRef.current
          if (!a) return
          setPlaying(false)
          a.currentTime = 0
          setProgress(0)
          setPlays(p => p + 1)
        }}
      />
    </div>
  )
}

interface QuizPembahasanProps {
  source: 'guru' | 'siswa' | 'admin'
}

export default function QuizPembahasan({ source }: QuizPembahasanProps) {
  useForceLightMode()
  const { lessonId, paketId, courseId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paket, setPaket] = useState<PembahasanPaket | null>(null)
  const [questions, setQuestions] = useState<PembahasanQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0)
  const [seen, setSeen] = useState<Set<number>>(new Set())
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [showKey, setShowKey] = useState(false)

  const load = useCallback(() => {
    if (!lessonId || !paketId) return
    setIsLoading(true)
    setError(null)
    setCurrentIndex(0)
    setActiveSectionIdx(0)
    setSeen(new Set())
    setFlagged(new Set())
    setShowKey(false)
    const req = source === 'siswa'
      ? lmsApi.lessonPembahasan(Number(lessonId), Number(paketId))
      : guruLmsApi.lessonPaketQuestions(Number(lessonId), Number(paketId))
    req.then(res => {
      setPaket({
        title: res.data.paket?.title || 'Quiz',
        quiz_template: res.data.paket?.quiz_template,
        cover_url: res.data.paket?.cover_url || null,
      })
      setQuestions(res.data.questions || [])
    }).catch(() => {
      setError('Pembahasan tidak ditemukan atau paket bukan status pembahasan.')
    }).finally(() => setIsLoading(false))
  }, [lessonId, paketId, source])

  useEffect(() => {
    load()
  }, [load])

  const handleBack = useCallback(() => {
    if (source === 'admin') {
      const base = location.pathname.startsWith('/admin-cabang') ? '/admin-cabang/lms' : '/lms'
      navigate(courseId ? `${base}/course/${courseId}/pertemuan/${lessonId}` : (lessonId ? `${base}/course/${courseId}` : `${base}`))
    } else if (source === 'guru') {
      navigate(lessonId ? `/guru-lms/lesson/${lessonId}` : '/guru-lms')
    } else if (courseId && lessonId) {
      navigate(`/siswa-dashboard/lms/${courseId}/materi/${lessonId}`)
    } else if (lessonId) {
      navigate(`/siswa-dashboard/lms/materi/${lessonId}`)
    } else {
      navigate(`/siswa-dashboard/lms/${courseId || ''}`)
    }
  }, [source, location.pathname, courseId, lessonId, navigate])

  const isJft = paket?.quiz_template === 'jft'
  const templateLabel = isJft ? 'JFT UI' : 'Basic'

  const t = useMemo(
    () =>
      isJft
        ? {
            header: 'bg-[#1f2022]',
            headSub: 'text-gray-400',
            sub: 'border-b border-[#4d7a4c] bg-[#5e8b5d]',
            bg: 'bg-[#edf1f5]',
            qblock: 'bg-[#e2f2fa]',
            qText: 'text-gray-900',
            optionSel: 'border-emerald-500 bg-emerald-50',
            optionIdle: 'border-gray-300 bg-white',
            bubbleSel: 'bg-emerald-500 text-white',
            bubbleIdle: 'bg-[#eef2f7] text-gray-600',
            footer: 'bg-[#1f2022]',
            prev: 'bg-[#405640] hover:bg-[#4d664d]',
            next: 'bg-[#5e8b5d] hover:bg-[#4d7a4c]',
            topBtn: 'bg-[#8fc3e8] hover:bg-[#a3cff0] text-[#1f2022]',
            railDone: 'bg-emerald-500',
            railTodo: 'bg-[#5e8b5d]',
            seen: '#1f2022',
            accent: '#5e8b5d',
          }
        : {
            header: 'bg-[#0b2c45]',
            headSub: 'text-blue-200',
            sub: 'border-b border-[#0a5489] bg-[#0069b0]',
            bg: 'bg-[#eef4f9]',
            qblock: 'bg-[#e7f2fc]',
            qText: 'text-gray-900',
            optionSel: 'border-emerald-500 bg-emerald-50',
            optionIdle: 'border-gray-300 bg-white',
            bubbleSel: 'bg-emerald-500 text-white',
            bubbleIdle: 'bg-[#eef4f9] text-gray-600',
            footer: 'bg-[#0b2c45]',
            prev: 'bg-[#0c4a73] hover:bg-[#0e5c8f]',
            next: 'bg-[#0069b0] hover:bg-[#00568f]',
            topBtn: 'bg-[#8fc3e8] hover:bg-[#a3cff0] text-[#0b2c45]',
            railDone: 'bg-emerald-500',
            railTodo: 'bg-[#0069b0]',
            seen: '#0b2c45',
            accent: '#0069b0',
          },
    [isJft]
  )

  // ── derived ──
  const currentQuestion = questions[currentIndex]

  const sections = useMemo(() => {
    const acc: { name: string; total: number; seen: number; startIndex: number }[] = []
    questions.forEach((q, idx) => {
      const name = sectionNameOf(q)
      const isSeen = seen.has(idx)
      const last = acc[acc.length - 1]
      if (last && last.name === name) {
        last.total++
        if (isSeen) last.seen++
      } else {
        acc.push({ name, total: 1, seen: isSeen ? 1 : 0, startIndex: idx })
      }
    })
    return acc
  }, [questions, seen])

  const activeSection = sections[activeSectionIdx] ?? null
  const activeSectionQuestions = useMemo(() => {
    if (!activeSection) return []
    return questions.slice(activeSection.startIndex, activeSection.startIndex + activeSection.total)
  }, [questions, activeSection])
  const activeSectionIsLast = !sections.length || activeSectionIdx === sections.length - 1
  const isLastOfSection = !!activeSection
    && currentIndex === activeSection.startIndex + activeSection.total - 1

  const currentSectionName = currentQuestion ? sectionNameOf(currentQuestion) : ''

  // Tandai soal yang sudah dibuka sebagai "terlihat" untuk progress rail.
  useEffect(() => {
    if (isLoading || !currentQuestion) return
    setSeen(prev => (prev.has(currentIndex) ? prev : new Set(prev).add(currentIndex)))
  }, [currentIndex, isLoading, currentQuestion])

  const goTo = (idx: number) => {
    setCurrentIndex(Math.max(0, Math.min(questions.length - 1, idx)))
  }

  const switchSection = (secIdx: number) => {
    const target = sections[secIdx]
    if (!target) return
    setActiveSectionIdx(secIdx)
    setCurrentIndex(target.startIndex)
  }

  const nextSection = () => {
    const next = sections[activeSectionIdx + 1]
    if (next) {
      setActiveSectionIdx(activeSectionIdx + 1)
      setCurrentIndex(next.startIndex)
    } else {
      handleBack()
    }
  }

  const topButtonLabel = activeSectionIsLast ? 'Selesai Pembahasan' : 'Selesai Bagian'
  const sectionButtonLabel = activeSectionIsLast ? 'Selesai Pembahasan' : 'Selesai Bagian'

  const toggleFlag = (idx: number) => {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className={`flex h-screen items-center justify-center ${t.bg}`}>
        <div className="text-center">
          <div className={`mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-current/20 border-t-current ${t.header}`} />
          <p className="text-xs font-semibold text-[#8B90A0]">Memuat pembahasan...</p>
        </div>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className={`flex h-screen flex-col ${t.bg}`}>
        <div className={`${t.header} px-4 py-2.5 md:px-6`} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <FileQuestion size={30} className="text-gray-300" />
          <p className="text-sm font-bold text-gray-700">
            {error ? 'Pembahasan tidak tersedia' : 'Belum ada soal'}
          </p>
          <p className="max-w-sm text-[11px] text-gray-400">
            {error || 'Paket ini belum memiliki soal untuk ditampilkan.'}
          </p>
          <button onClick={handleBack}
            className={`mt-2 flex items-center gap-1.5 rounded-md ${t.next} px-4 py-2 text-[11px] font-bold text-white transition-colors`}>
            <ArrowLeft size={13} /> Kembali ke Pertemuan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen flex-col overflow-hidden ${t.bg}`}>
      {/* ── Top Header ── */}
      <div className={`relative ${t.header} px-4 py-2 md:px-6`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col leading-tight">
            <p className="text-[13px] text-white">
              <span className={`font-normal ${t.headSub}`}>Soal: </span>
              <span className="font-bold">{currentIndex + 1}</span>
            </p>
            <p className={`mt-1 text-[13px] font-normal ${t.headSub}`}>Bagian:</p>
            <p className="max-w-[160px] truncate text-[13px] font-semibold text-white">{currentSectionName || '—'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKey(v => !v)}
              title={showKey ? 'Sembunyikan kunci jawaban' : 'Tampilkan kunci jawaban'}
              aria-label={showKey ? 'Sembunyikan kunci jawaban' : 'Tampilkan kunci jawaban'}
              className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                showKey
                  ? 'bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35'
                  : 'bg-white/10 text-white/75 hover:bg-white/20 hover:text-white'
              }`}
            >
              {showKey ? <Eye size={12} /> : <EyeOff size={12} />}
              {showKey ? 'Kunci disembunyikan' : 'Tampilkan Kunci'}
            </button>
            <button
              onClick={activeSectionIsLast ? handleBack : nextSection}
              className={`shrink-0 rounded ${t.topBtn} px-3 py-1.5 text-xs font-bold transition-colors sm:px-4 sm:text-sm`}
            >
              {topButtonLabel}
            </button>
            <button
              onClick={handleBack}
              className="shrink-0 rounded p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Kembali ke pertemuan"
              aria-label="Kembali"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Template badge di tengah header */}
        <div className="mt-2 flex items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:top-1/2 sm:mt-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${t.headSub}`}>{templateLabel}</span>
        </div>
      </div>

      {/* ── Subheader ── */}
      <div className={`flex items-center justify-between ${t.sub} px-4 py-1.5 md:px-6`}>
        <p className="min-w-0 truncate text-[13px] text-white">
          <span className="font-bold">Tes: </span>
          <span className="font-normal">{paket?.title || 'Quiz'}</span>
        </p>
        <span className="shrink-0 text-[11px] font-semibold text-white/80">{questions.length} soal</span>
      </div>

      <div className="flex flex-1 overflow-hidden overflow-x-hidden">
        {/* ── Left Sidebar Navigator (desktop & mobile) ── */}
        <aside className="relative mx-1.5 w-[74px] shrink-0 overflow-x-hidden overflow-y-auto sm:mx-2 sm:w-[94px] md:w-[116px]">
          <div className="flex">
            <div className="absolute inset-y-0 left-0 w-6 bg-white sm:w-7 md:w-8" />
            <div className="relative z-10 mr-1 flex w-6 shrink-0 flex-col gap-2.5 py-3 sm:w-7 sm:mr-1.5 md:w-8 md:py-4">
              {sections.map((section, i) => {
                const pct = section.total > 0 ? (section.seen / section.total) * 100 : 0
                const isActiveSection = i === activeSectionIdx
                const isDone = pct >= 100
                return (
                  <div key={section.name || `sec-${i}`} className="flex flex-col items-center px-0.5 md:px-1.5">
                    <button
                      type="button"
                      onClick={() => switchSection(i)}
                      title={section.name || 'Tanpa nama'}
                      className={`mb-0.5 w-full text-center text-[9px] leading-tight md:text-[11px] ${
                        isDone ? 'font-bold text-emerald-600' : isActiveSection ? 'font-bold text-black' : 'font-medium text-gray-500'
                      }`}
                    >
                      {section.name ? `${section.name.substring(0, 2)}...` : '–'}
                    </button>
                    <div className="relative h-[42px] w-2 overflow-hidden rounded-full bg-[#e2e4e8] md:h-[50px]">
                      <div
                        className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-300 ${isDone ? t.railDone : t.railTodo}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex min-w-0 flex-1 flex-col py-3 pl-1 md:py-4 md:pl-1.5">
              {activeSectionQuestions.map((q, k) => {
                const idx = (activeSection?.startIndex ?? 0) + k
                const isActive = idx === currentIndex
                const isSeen = seen.has(idx)
                const isFlagged = flagged.has(idx)
                const bgColor = isActive ? (isJft ? '#5e8b5d' : '#0069b0') : isSeen ? t.seen : (isJft ? '#5e8b5d' : '#0069b0')
                return (
                  <div key={q.id}>
                    <div className="flex items-center pb-1.5 md:pb-2">
                      <button
                        onClick={() => goTo(idx)}
                        className="relative flex h-[24px] w-full max-w-[46px] items-center justify-center rounded text-[11px] font-bold leading-none text-white transition-all hover:opacity-90 sm:max-w-[50px] sm:text-[12px] md:h-[28px] md:max-w-[56px] md:text-[13px]"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className="w-full text-center">{idx + 1}</span>
                        {isFlagged && (
                          <svg className="absolute right-0.5 top-0.5 h-[9px] w-[9px] fill-[#fde047] drop-shadow-sm md:right-2 md:top-1 md:h-[10px] md:w-[10px]" viewBox="0 0 24 24">
                            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                          </svg>
                        )}
                      </button>
                      {isActive && (
                        <svg className="-ml-px hidden h-[12px] w-[8px] shrink-0 md:block md:h-[14px] md:w-[10px]" viewBox="0 0 10 14" fill={bgColor}>
                          <path d="M0 0L10 7L0 14z" />
                        </svg>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* ── Main Question Content ── */}
        <div className={`min-w-0 flex-1 overflow-x-hidden overflow-y-auto ${t.bg} p-3 md:p-6`}>
          <div className="mx-auto w-full max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 md:p-6">
              <div className="mb-5 flex flex-col items-center md:mb-6">
                <div className={`w-full rounded ${t.qblock} p-4 md:p-6`}>
                  {currentQuestion.image_url && (
                    <div className="mb-4 flex justify-center">
                      <img src={currentQuestion.image_url} alt="Soal"
                        className="max-h-56 w-auto max-w-full rounded-lg border border-gray-200 bg-white object-contain" />
                    </div>
                  )}

                  <div
                    className={`text-base font-medium md:text-lg [&_img]:max-w-full [&_img]:mx-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200 [&_img]:bg-white [&_img]:my-2 [&_p]:my-1 ${t.qText}`}
                    dangerouslySetInnerHTML={{ __html: cleanQuillHtml(currentQuestion.question) }}
                  />

                  {currentQuestion.audio_url && (
                    <PembahasanAudio
                      key={currentQuestion.id}
                      src={currentQuestion.audio_url}
                      maxPlays={currentQuestion.audio_max_plays ?? null}
                    />
                  )}

                  {(currentQuestion.points ?? 0) > 0 && (
                    <p className="mt-2 text-[11px] font-semibold text-gray-400">{currentQuestion.points} poin</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 md:gap-3">
                {currentQuestion.question_type === 'essay' ? (
                  !showKey ? (
                    <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                      <p className="text-xs font-semibold text-gray-500">Kunci jawaban disembunyikan.</p>
                      <button
                        type="button"
                        onClick={() => setShowKey(true)}
                        className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-600"
                      >
                        <Eye size={12} /> Tampilkan Kunci Jawaban
                      </button>
                    </div>
                  ) : currentQuestion.keyword ? (
                    <div className="rounded border border-emerald-500 bg-emerald-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Kunci Jawaban</p>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-900">{currentQuestion.keyword}</p>
                    </div>
                  ) : (
                    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                      <p className="text-xs font-medium text-gray-500">Soal essay — kunci jawaban ditentukan instruktur.</p>
                    </div>
                  )
                ) : (
                  <>
                    {currentQuestion.question_type === 'rating' && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">
                        Skala penilaian 1–{currentQuestion.rating_max || currentQuestion.options?.length || 0}
                        {showKey ? ' — kunci jawaban ditandai hijau' : ''}
                      </p>
                    )}
                    {currentQuestion.question_type === 'multi' && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                        Jawaban benar boleh lebih dari satu
                        {showKey ? ' — kunci jawaban ditandai hijau' : ''}
                      </p>
                    )}
                    {(currentQuestion.options || []).map((opt, oi) => {
                      const correctSet = new Set((currentQuestion.correct_indexes || []).map(Number))
                      const isCorrect = showKey && (currentQuestion.question_type === 'multi'
                        ? correctSet.has(oi)
                        : (currentQuestion.correct_index != null && oi === currentQuestion.correct_index))
                      const optLabel = typeof opt === 'string' ? opt : (opt?.text ?? '')
                      const optImg = typeof opt === 'string' ? null : (opt?.image_url || null)
                      const badgeLabel = currentQuestion.question_type === 'rating' ? optLabel : letter(oi)
                      return (
                        <div
                          key={oi}
                          className={`flex w-full items-center gap-3 rounded border p-3 text-left md:gap-4 ${
                            isCorrect ? t.optionSel : t.optionIdle
                          }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isCorrect ? t.bubbleSel : t.bubbleIdle
                          }`}>
                            {badgeLabel}
                          </span>
                          {optImg && <img src={optImg} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover md:h-16 md:w-16" />}
                          {optLabel && <span className="text-sm text-gray-800 md:text-base">{optLabel}</span>}
                          {isCorrect && (
                            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Kunci Jawaban
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
          <p className={`mx-auto mt-3 flex max-w-2xl items-center justify-center gap-1.5 text-center text-[10px] font-medium ${showKey ? 'text-gray-400' : 'text-emerald-600'}`}>
            {showKey ? (
              <>
                Mode pembahasan — kunci jawaban ditandai hijau, tanpa penilaian &amp; percobaan.
                <button
                  type="button"
                  onClick={() => setShowKey(false)}
                  className="inline-flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-300"
                >
                  <EyeOff size={10} /> Sembunyikan
                </button>
              </>
            ) : (
              <>
                <EyeOff size={11} /> Kunci jawaban disembunyikan. Coba jawab sendiri dulu sebelum melihat kunci.
                <button
                  type="button"
                  onClick={() => setShowKey(true)}
                  className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-emerald-600"
                >
                  <Eye size={10} /> Tampilkan Kunci
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={`flex items-center justify-between gap-2 ${t.footer} px-3 py-2 md:px-6`}>
        <button
          onClick={() => toggleFlag(currentIndex)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${t.prev} transition-colors md:h-9 md:w-10`}
          aria-label="Tandai soal"
        >
          <svg className={`h-4 w-4 ${flagged.has(currentIndex) ? 'fill-[#fbd34d]' : 'fill-white'}`} viewBox="0 0 24 24">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className={`rounded ${t.prev} px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 md:px-5`}
          >
            &lt; Kembali
          </button>

          {!isLastOfSection ? (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className={`rounded ${t.next} px-5 py-2 text-sm font-semibold text-white transition-colors md:px-5`}
            >
              Selanjutnya &gt;
            </button>
          ) : (
            <button
              onClick={nextSection}
              className={`rounded ${t.next} px-5 py-2 text-sm font-semibold text-white transition-colors md:px-5`}
            >
              {sectionButtonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
