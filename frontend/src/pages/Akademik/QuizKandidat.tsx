import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Clock, ListChecks, Award, Camera, ShieldAlert, X, Play,
  AlertTriangle, CheckCircle2, BookOpen, LayoutDashboard, CalendarCheck,
  Wallet, User, FileQuestion, Lock, Check, Video, FileText,
} from 'lucide-react'
import { quizApi, lmsApi } from '../../services/api'
import LessonSlidesViewer from '../../components/LessonSlidesViewer'
import TrackedVideo from '../../components/TrackedVideo'
import Swal from 'sweetalert2'

const cleanQuillHtml = (html: string) =>
  html
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

interface PaketList {
  id: number
  title: string
  description: string | null
  cover_url: string | null
  course_title: string | null
  batch_name: string | null
  questions_count: number
  time_limit_minutes: number
  max_attempts: number
  passing_score: number
  attempts_used: number
  best_score: number | null
  can_start: boolean
}

interface AttemptHistory {
  attempt_id: number
  attempt_number: number
  status: string
  score: number | null
  correct_count: number | null
  total_count: number | null
  warnings: number
  auto_submitted: boolean
  started_at: string | null
  submitted_at: string | null
}

interface PaketDetail {
  id: number
  title: string
  description: string | null
  cover_url: string | null
  course_id: number | null
  course_title: string | null
  questions_count: number
  time_limit_minutes: number
  max_attempts: number
  passing_score: number
  max_warnings: number
  has_prerequisite_course: boolean
}

interface LessonPayload {
  id: number
  title: string
  sort: number
  video_url: string | null
  content: string | null
  has_video: boolean
  has_content: boolean
  file_name: string | null
  file_url: string | null
  slides?: { id: number; file_name: string; url: string }[]
  completed: boolean
}

interface PlayQuestion {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: string[]
  points: number
  selected_index?: number | null
}

interface ResultPayload {
  attempt_id: number
  attempt_number: number
  status: string
  score: number | null
  correct_count: number | null
  total_count: number | null
  answered_count: number
  warnings: number
  max_warnings: number
  auto_submitted: boolean
  started_at: string | null
  submitted_at: string | null
  time_limit_seconds: number
  passing_score: number
}

interface LessonProgress {
  lesson_id: number
  video_required: boolean
  read_required: boolean
  video_watched_seconds: number
  video_duration_seconds: number
  video_percent: number
  read_seconds: number
  video_green: boolean
  read_green: boolean
  video_green_percent: number
  modul_min_seconds: number
  completed?: boolean
}

type View = 'list' | 'materi' | 'rules' | 'play' | 'result'

const bottomNav = [
  { label: 'Dashboard', to: '/siswa-dashboard', icon: LayoutDashboard },
  { label: 'Kelas Mendunia', to: '/siswa-dashboard/lms', icon: BookOpen },
  { label: 'Absensi', to: '/siswa-dashboard/absensi', icon: CalendarCheck },
  { label: 'Pembayaran', to: '/siswa-dashboard/pembayaran', icon: Wallet },
  { label: 'Profil', to: '/siswa-dashboard/profil', icon: User },
]

const fmtClock = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function QuizKandidat() {
  const location = useLocation()
  const navigate = useNavigate()
  const { paketId, lessonId } = useParams()
  const [view, setView] = useState<View>('list')
  const [pakets, setPakets] = useState<PaketList[]>([])
  const [loading, setLoading] = useState(true)

  const [detail, setDetail] = useState<{ paket: PaketDetail; attempts: AttemptHistory[]; lessons: LessonPayload[]; completed_lesson_ids: number[]; is_unlocked: boolean } | null>(null)

  const [activeLesson, setActiveLesson] = useState<LessonPayload | null>(null)
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgress>>({})

  const [questions, setQuestions] = useState<PlayQuestion[]>([])
  const [selected, setSelected] = useState<Record<number, number | null>>({})
  const [remaining, setRemaining] = useState(0)
  const [warnBanner, setWarnBanner] = useState(false)

  const [cameraModal, setCameraModal] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [camBusy, setCamBusy] = useState(false)
  const [camActive, setCamActive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [result, setResult] = useState<ResultPayload | null>(null)

  const attemptRef = useRef<number | null>(null)
  const paketTitleRef = useRef('')
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const cameraRef = useRef<HTMLVideoElement | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const snapshotRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const readTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef(Date.now())
  const autoCompletedRef = useRef<number | null>(null)

  const stopTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (snapshotRef.current) clearInterval(snapshotRef.current)
    if (readTickRef.current) clearInterval(readTickRef.current)
    countdownRef.current = null
    snapshotRef.current = null
    readTickRef.current = null
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      stopTimers()
      stopStream()
    }
  }, [stopTimers, stopStream])

  const fetchPakets = () => {
    setLoading(true)
    quizApi.pakets().then(res => {
      setPakets(res.data.pakets || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPakets()
    const openId = paketId ? Number(paketId) : 0
    if (openId) {
      setView('materi')
      openPaket(openId)
    } else {
      setView('list')
      setDetail(null)
      setActiveLesson(null)
      setLessonProgressMap({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paketId])

  // Sync lessonId from URL → set activeLesson + view
  useEffect(() => {
    if (!lessonId || !detail) return
    const lid = Number(lessonId)
    const lesson = detail.lessons.find(l => l.id === lid)
    if (lesson) {
      setActiveLesson(lesson)
      setView('materi')
    }
  }, [lessonId, detail])

  // When lessonId removed from URL → back to materi list
  useEffect(() => {
    if (lessonId || !detail) return
    if (view === 'materi' && activeLesson) {
      setActiveLesson(null)
    }
  }, [lessonId])

  const openPaket = (id: number) => {
    setDetail(null)
    setCamError(null)
    setActiveLesson(null)
    setLessonProgressMap({})
    quizApi.paket(id).then(res => {
      paketTitleRef.current = res.data.paket.title
      setDetail({
        paket: res.data.paket,
        attempts: res.data.attempts || [],
        lessons: res.data.lessons || [],
        completed_lesson_ids: res.data.completed_lesson_ids || [],
        is_unlocked: res.data.is_unlocked ?? true,
      })
      loadLessonProgress((res.data.lessons || []) as LessonPayload[])
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal memuat detail paket' })
      setView('list')
      navigate('/siswa-dashboard/quiz')
    })
  }

  const loadLessonProgress = (ls: LessonPayload[]) => {
    ls.forEach(l => {
      lmsApi.lessonDetail(l.id).then(res => {
        if (res.data?.progress) {
          setLessonProgressMap(prev => ({ ...prev, [l.id]: res.data.progress }))
        }
      }).catch(() => {})
    })
  }

  const goBack = () => {
    if (view === 'play' || view === 'result') {
      stopTimers()
      stopStream()
      setView('list')
      setResult(null)
      setQuestions([])
      attemptRef.current = null
      fetchPakets()
    } else if (view === 'rules') {
      setView('list')
      navigate('/siswa-dashboard/lms')
      refreshDetail()
    } else if (view === 'materi') {
      if (lessonId) {
        navigate(`/siswa-dashboard/quiz/${detail?.paket.id ?? paketId}`)
      } else {
        navigate('/siswa-dashboard/lms')
      }
    }
  }

  const refreshDetail = () => {
    if (!detail) return
    quizApi.paket(detail.paket.id).then(res => {
      paketTitleRef.current = res.data.paket.title
      setDetail({
        paket: res.data.paket,
        attempts: res.data.attempts || [],
        lessons: res.data.lessons || [],
        completed_lesson_ids: res.data.completed_lesson_ids || [],
        is_unlocked: res.data.is_unlocked ?? true,
      })
      loadLessonProgress((res.data.lessons || []) as LessonPayload[])
    }).catch(() => {})
  }

  const openLesson = (l: LessonPayload) => {
    const pkgId = detail?.paket.id ?? paketId ?? ''
    navigate(`/siswa-dashboard/quiz/${pkgId}/materi/${l.id}`)
  }

  const applyReadProgress = (lessonId: number, p: LessonProgress) => {
    setLessonProgressMap(prev => ({ ...prev, [lessonId]: p }))
  }

  const sendVideoHeartbeat = useCallback((lessonId: number, currentTime: number, duration: number) => {
    if (duration <= 0 && currentTime <= 0) return
    lmsApi.videoProgress(lessonId, { current_time: currentTime, duration }).then(res => {
      if (res.data?.progress) applyReadProgress(lessonId, res.data.progress)
    }).catch(() => {})
  }, [])

  const sendReadTick = useCallback((lessonId: number) => {
    lmsApi.readProgress(lessonId, { seconds: 10 }).then(res => {
      if (res.data?.progress) applyReadProgress(lessonId, res.data.progress)
    }).catch(() => {})
  }, [])

  const goToRules = () => {
    setView('rules')
  }

  // ==================== CAMERA ====================

  const requestCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Kamera tidak didukung perangkat ini')
      return
    }
    setCamBusy(true)
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 } },
        audio: false,
      })
      stopStream()
      streamRef.current = stream
      setCamActive(true)
    } catch {
      setCamError('Izin kamera ditolak. Kamera diperlukan untuk mengikuti quiz.')
    } finally {
      setCamBusy(false)
    }
  }, [stopStream])

  useEffect(() => {
    const el = videoRef.current || cameraRef.current
    if (el && streamRef.current) {
      el.srcObject = streamRef.current
      el.play().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camActive, cameraModal])

  // Track reading of the open modul (activity hijau) when viewing material detail.
  useEffect(() => {
    if (view !== 'materi' || !activeLesson) return
    if (!activeLesson.has_content) return
    lastActivityRef.current = Date.now()
    const markActivity = () => { lastActivityRef.current = Date.now() }
    window.addEventListener('keydown', markActivity)
    window.addEventListener('scroll', markActivity, true)
    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastActivityRef.current > 20000) return
      sendReadTick(activeLesson.id)
    }, 8000)
    readTickRef.current = tick
    return () => {
      clearInterval(tick)
      readTickRef.current = null
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('scroll', markActivity, true)
    }
  }, [view, activeLesson, sendReadTick])

  // Auto-mark lesson complete once its activity turns green (mirrors LMS flow),
  // which is what unlocks the quiz on the backend.
  useEffect(() => {
    if (view !== 'materi' || !activeLesson) return
    if (activeLesson.completed) return
    const p = lessonProgressMap[activeLesson.id]
    const green = (!activeLesson.has_video || !!p?.video_green) && (!activeLesson.has_content || !!p?.read_green)
    if (green && autoCompletedRef.current !== activeLesson.id) {
      autoCompletedRef.current = activeLesson.id
      lmsApi.completeLesson(activeLesson.id).then(() => {
        setDetail(prev => prev ? {
          ...prev,
          completed_lesson_ids: prev.completed_lesson_ids.includes(activeLesson.id)
            ? prev.completed_lesson_ids
            : [...prev.completed_lesson_ids, activeLesson.id],
          lessons: prev.lessons.map(ol => ol.id === activeLesson.id ? { ...ol, completed: true } : ol),
          is_unlocked: prev.lessons.every(ol => ol.id === activeLesson.id || ol.completed) || prev.is_unlocked,
        } : prev)
      }).catch(() => { autoCompletedRef.current = null })
    }
  }, [view, activeLesson, lessonProgressMap])

  // ==================== PLAY ====================

  const finishSelf = useCallback((reason: string) => {
    if (!attemptRef.current || submitting) return
    setSubmitting(true)
    stopTimers()
    quizApi.submit(attemptRef.current).then(res => {
      setResult(res.data.attempt)
      setView('result')
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal mengumpulkan quiz', text: reason })
      setSubmitting(false)
      if (reason === 'waktu habis') setRemaining(0)
    })
  }, [submitting, stopTimers])

  const enterPlay = useCallback((attemptId: number, packageId: number) => {
    stopTimers()
    stopStream()
    setCameraModal(false)
    navigate(`/siswa-dashboard/quiz/${packageId}/play/${attemptId}`, { state: { title: paketTitleRef.current } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopTimers, stopStream, navigate])

  const resumeAttempt = (attemptId: number) => {
    quizApi.attempt(attemptId).then(res => {
      const data = res.data
      if (data.attempt?.status === 'submitted' || data.attempt?.score !== undefined) {
        setResult(data.attempt)
        setView('result')
        return
      }
      const packageId = detail?.paket.id ?? paketId ?? 0
      navigate(`/siswa-dashboard/quiz/${packageId}/play/${attemptId}`, { state: { title: paketTitleRef.current } })
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal melanjutkan percobaan' })
      goBack()
    })
  }

  const startNew = () => {
    const packageId = detail?.paket.id
    if (!packageId) return
    setStarting(true)
    quizApi.start(packageId).then(res => {
      const d = res.data
      enterPlay(d.attempt.id, packageId)
    }).catch(err => {
      const attemptId = err?.response?.data?.attempt_id
      if (attemptId) {
        resumeAttempt(attemptId)
      } else {
        const msg = err?.response?.data?.message || 'Gagal memulai quiz'
        Swal.fire({ icon: 'warning', title: msg })
        fetchPakets()
      }
    }).finally(() => setStarting(false))
  }

  const selectAnswer = (q: PlayQuestion, idx: number) => {
    if (!attemptRef.current) return
    const current = selected[q.id]
    const next = current === idx ? -1 : idx
    setSelected({ ...selected, [q.id]: next === -1 ? null : idx })
    quizApi.answer(attemptRef.current, { question_id: q.id, selected_index: next })
      .catch(() => {
        setSelected({ ...selected, [q.id]: current })
        Swal.fire({ icon: 'warning', title: 'Gagal menyimpan jawaban', text: 'Periksa koneksi Anda' })
      })
  }

  const sendWarn = useCallback(() => {
    if (!attemptRef.current || view !== 'play') return
    quizApi.warn(attemptRef.current).then(res => {
      const d = res.data
      if (d.auto_submitted || d.status === 'submitted') {
        finishSelf('keluar aplikasi')
      } else {
        setWarnBanner(true)
      }
      return d
    }).catch(() => {})
  }, [view, finishSelf])

  useEffect(() => {
    if (view !== 'play') return
    const onVis = () => {
      if (document.visibilityState === 'hidden') sendWarn()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [view, sendWarn])

  const submitManually = () => {
    Swal.fire({
      title: 'Kumpulkan quiz?',
      text: 'Jawaban yang sudah dipilih akan dinilai.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0E6187',
      confirmButtonText: 'Ya, Kumpulkan',
      cancelButtonText: 'Periksa lagi',
    }).then(res => {
      if (res.isConfirmed) finishSelf('manual')
    })
  }

  const answeredCount = questions.filter(q => selected[q.id] !== undefined && selected[q.id] !== null).length

  // ==================== RENDER ====================

  if (view === 'play') {
    const lowTime = remaining <= 60
    return (
      <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
        {/* Sticky Header */}
        <div className="bg-[#0E6187] text-white sticky top-0 z-30 shadow-sm">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={goBack} className="flex items-center gap-1 text-[11px] font-bold text-white/60 hover:text-white transition-colors">
                <ArrowLeft size={12} /> Keluar
              </button>
              <span className="text-white/30 text-[10px]">/</span>
              <span className="text-[11px] font-medium text-white/60 truncate">{paketTitleRef.current}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileQuestion size={17} className="text-white/80" />
                <h1 className="text-sm font-bold truncate">Pengerjaan Quiz</h1>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${lowTime ? 'bg-red-500/90' : 'bg-white/10'} text-[11px] font-bold tabular-nums`}>
                <Clock size={12} /> {fmtClock(remaining)}
              </div>
            </div>
          </div>
        </div>

        {camActive && streamRef.current && (
          <div className="max-w-lg mx-auto px-4 pt-3">
            <div className="flex items-center gap-2 bg-white rounded-md border border-[#E5E7EF] px-3 py-2">
              <video ref={cameraRef} muted playsInline autoPlay className="w-14 h-10 rounded-lg object-cover bg-black" />
              <div className="flex-1">
                <p className="text-[10.5px] font-bold text-[#0E6187]">Kamera pengawas aktif</p>
                <p className="text-[9.5px] text-slate-400 font-medium">Foto dikirim berkala ke pengawas</p>
              </div>
              <Camera size={15} className="text-[#0E6187]" />
            </div>
          </div>
        )}

        {warnBanner && (
          <div className="max-w-lg mx-auto px-4 pt-3">
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-md px-3 py-2.5">
              <ShieldAlert size={15} className="text-orange-500 shrink-0" />
              <div className="flex-1">
                <p className="text-[10.5px] font-bold text-orange-600">Deteksi keluar aplikasi</p>
                <p className="text-[9.5px] text-orange-500 font-medium">Keluar lagi akan langsung mengumpulkan quiz otomatis.</p>
              </div>
              <button onClick={() => setWarnBanner(false)} className="p-1 text-orange-400 hover:text-orange-600">
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          <div className="bg-white rounded-md border border-[#E5E7EF] px-4 py-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500">Terjawab</p>
            <p className="text-[11px] font-bold text-[#0E6187]">{answeredCount} / {questions.length}</p>
          </div>

          {questions.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-md border border-[#E5E7EF] p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-bold text-slate-800 leading-snug">
                  <span className="text-[#0E6187]">{qi + 1}.</span> {q.question}
                </p>
                <span className="text-[9.5px] font-bold text-slate-300 shrink-0 mt-0.5">{q.points} poin</span>
              </div>
              <div className="mt-3 space-y-2">
                {q.question_type === 'rating' && (
                  <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">Skala penilaian 1–{q.rating_max || q.options.length} — pilih salah satu</p>
                )}
                {q.options.map((opt, oi) => {
                  const isSel = selected[q.id] === oi
                  const badgeLabel = q.question_type === 'rating' ? opt : String.fromCharCode(65 + oi)
                  return (
                    <button key={oi} onClick={() => selectAnswer(q, oi)}
                      className={`w-full flex items-center gap-2.5 text-left text-[12px] px-3.5 py-3 rounded-md border-2 transition-all ${isSel ? (q.question_type === 'rating' ? 'border-violet-500 bg-violet-50 font-bold text-violet-600' : 'border-[#0E6187] bg-[#0E6187]/[0.04] font-bold text-[#0E6187]') : 'border-transparent bg-slate-50 text-slate-600 font-medium hover:bg-slate-100'}`}>
                      <span className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] font-bold shrink-0 ${isSel ? (q.question_type === 'rating' ? 'bg-violet-500 text-white' : 'bg-[#0E6187] text-white') : 'bg-white border border-slate-200 text-slate-400'}`}>
                        {badgeLabel}
                      </span>
                      {opt}
                      {isSel && <CheckCircle2 size={15} className={`ml-auto shrink-0 ${q.question_type === 'rating' ? 'text-violet-500' : 'text-[#0E6187]'}`} />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-lg mx-auto px-4 pb-4">
          <button onClick={submitManually} disabled={submitting}
            className="w-full text-[12.5px] font-bold text-white bg-[#0E6187] py-3.5 rounded-md hover:bg-[#0a4d6b] transition-colors disabled:opacity-50">
            {submitting ? 'Mengumpulkan...' : 'Selesai & Kumpulkan'}
          </button>
        </div>

        {/* Bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {bottomNav.map(nav => {
              const Icon = nav.icon
              const isActive = nav.to === location.pathname
              return (
                <Link key={nav.label} to={nav.to}
                  className={`flex flex-col items-center gap-1 py-2.5 transition ${isActive ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{nav.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    )
  }

  if (view === 'result' && result) {
    const lulus = result.passing_score > 0 && (result.score ?? 0) >= result.passing_score
    return (
      <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="bg-white rounded-md border border-[#E5E7EF] p-6 text-center">
            <div className={`w-16 h-16 mx-auto rounded-md flex items-center justify-center ${lulus ? 'bg-emerald-50' : 'bg-[#0E6187]/[0.06]'}`}>
              {lulus ? <Award size={30} className="text-emerald-500" /> : <ListChecks size={30} className="text-[#0E6187]" />}
            </div>
            <h1 className="text-lg font-bold text-slate-800 mt-4">{lulus ? 'Selamat, Anda lulus!' : 'Quiz Selesai'}</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{paketTitleRef.current} · Percobaan #{result.attempt_number}
              {result.auto_submitted && <span className="ml-1 text-[10px] font-bold text-orange-500">(Dikumpulkan otomatis)</span>}
            </p>

            <div className="mt-5">
              <p className="text-5xl font-black text-[#0E6187] tabular-nums">{Number(result.score) || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1">Nilai Akhir · Lulus jika ≥ {result.passing_score}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className="bg-slate-50 rounded-md p-3">
                <p className="text-sm font-bold text-slate-700">{result.correct_count ?? 0}/{result.total_count ?? 0}</p>
                <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Benar</p>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <p className="text-sm font-bold text-slate-700">{result.answered_count}</p>
                <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Terjawab</p>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <p className="text-sm font-bold text-slate-700">{result.warnings}</p>
                <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5">Peringatan</p>
              </div>
            </div>

            <p className="text-[10.5px] text-slate-400 font-medium mt-5 leading-relaxed">
              Kunci jawaban dan rekap detail hanya dapat dilihat oleh instruktur/guru.
            </p>

            <div className="flex gap-2 mt-5">
              <button onClick={goBack}
                className="flex-1 text-[12px] font-bold text-white bg-[#0E6187] py-3 rounded-md hover:bg-[#0a4d6b] transition-colors">
                Selesai
              </button>
            </div>
          </div>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {bottomNav.map(nav => {
              const Icon = nav.icon
              const isActive = nav.to === location.pathname
              return (
                <Link key={nav.label} to={nav.to}
                  className={`flex flex-col items-center gap-1 py-2.5 transition ${isActive ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{nav.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    )
  }

  if (view === 'materi' && detail) {
    const { paket, lessons } = detail
    const isGreen = (l: LessonPayload) => {
      const p = lessonProgressMap[l.id]
      if (!l.has_video && !l.has_content) return true
      if (l.has_video && l.has_content) return !!(p?.video_green && p?.read_green)
      if (l.has_video) return !!p?.video_green
      return !!p?.read_green
    }
    const greenCount = lessons.filter(isGreen).length
    const progressPct = lessons.length > 0 ? Math.round((greenCount / lessons.length) * 100) : 0
    const allGreen = lessons.length > 0 && lessons.every(isGreen)

    if (lessonId && activeLesson) {
      const lp = lessonProgressMap[activeLesson.id]
      const lessonGreen = isGreen(activeLesson)
      const modulMin = lp?.modul_min_seconds || 30
      const readSecs = lp?.read_seconds || 0
      return (
        <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
          {/* Hero */}
          <div className="relative h-52 bg-gradient-to-br from-[#0E6187] to-[#1a3355] overflow-hidden">
            {paket.cover_url && (
              <img src={paket.cover_url} alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0E6187] via-[#0E6187]/60 to-transparent" />
            <div className="relative max-w-lg mx-auto px-4 h-full flex flex-col justify-end pb-6">
              <button onClick={goBack}
                className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white transition-colors mb-4 self-start">
                <ArrowLeft size={12} /> Daftar Materi
              </button>
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-white truncate">{paket.course_title || paket.title}</h1>
                  <p className="text-[11px] text-teal-100 truncate mt-1">{activeLesson.title}</p>
                </div>
                {lessonGreen && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 px-2.5 py-1 rounded-md">
                    <Check size={11} /> Hijau
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
            {/* Progress Panel */}
            {activeLesson.has_content && (
              <div className={`bg-white rounded-md border border-slate-200 p-4 shadow-sm ${lessonGreen ? 'border-emerald-200' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${lessonGreen ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                      {lessonGreen ? <Check size={18} className="text-emerald-500" /> : <BookOpen size={18} className="text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">Progress membaca modul</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        Baca modul minimal {modulMin} detik
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!lessonGreen && (
                      <span className="text-[11px] font-bold text-[#0E6187] tabular-nums">
                        {Math.min(readSecs, modulMin)}/{modulMin}s
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md ${lessonGreen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {lessonGreen ? <><Check size={11} /> Hijau</> : <><BookOpen size={11} /> Belum hijau</>}
                    </span>
                  </div>
                </div>
                {!lessonGreen && (
                  <div className="mt-3 h-1.5 rounded-md bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-md bg-[#0E6187] transition-all duration-500"
                      style={{ width: `${Math.min((readSecs / modulMin) * 100, 100)}%` }} />
                  </div>
                )}
              </div>
            )}

            {/* Materi Content */}
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-[#0E6187]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Materi</p>
                    <h2 className="text-sm font-bold text-gray-900 truncate">{activeLesson.title}</h2>
                  </div>
                </div>
                {lessonGreen ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md">
                    <Check size={11} /> Hijau
                  </span>
                ) : (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                    <BookOpen size={11} /> Belum hijau
                  </span>
                )}
              </div>

              {activeLesson.video_url && (
                <div className="bg-black">
                  <TrackedVideo
                    url={activeLesson.video_url}
                    title={activeLesson.title}
                    progress={lp}
                    onHeartbeat={(currentTime, duration) => sendVideoHeartbeat(activeLesson.id, currentTime, duration)} />
                  {lp && lp.video_percent > 0 && (
                    <div className="px-3 py-2 flex items-center gap-2 bg-[#0E6187]/95">
                      <div className="flex-1 h-1.5 bg-white/20 rounded-md overflow-hidden">
                        <div className="h-full bg-emerald-300 rounded-md transition-all"
                          style={{ width: `${lp.video_percent}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${lp.video_green ? 'text-emerald-300' : 'text-white/70'}`}>
                        {lp.video_green ? 'Video selesai' : `${Math.round(lp.video_percent)}%`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeLesson.content && (
                <div className="p-5">
                  <div className="prose prose-sm max-w-none text-gray-600 text-[13px] leading-relaxed
                    [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-4 [&_img]:shadow-sm
                    [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-md
                    [&_a]:text-[#0E6187] [&_a]:underline [&_a]:break-words
                    [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                    [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2
                    [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                    [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1.5 [&_li]:pl-1
                    [&_li_ul]:mt-1.5 [&_li_ol]:mt-1.5
                    [&_blockquote]:border-l-4 [&_blockquote]:border-[#0E6187]/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500"
                    dangerouslySetInnerHTML={{ __html: cleanQuillHtml(activeLesson.content) }} />
                </div>
              )}

              {activeLesson.slides && activeLesson.slides.length > 0 && (
                <div className="px-5 pb-5">
                  <LessonSlidesViewer slides={activeLesson.slides} />
                </div>
              )}

              {activeLesson.file_url && (
                <a href={activeLesson.file_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 mx-5 mb-5 bg-[#0E6187]/5 border border-[#0E6187]/10 rounded-md p-3 hover:bg-[#0E6187]/10 transition-colors group">
                  <div className="w-9 h-9 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                    <FileQuestion size={16} className="text-[#0E6187]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#0E6187] transition-colors">
                      {activeLesson.file_name || 'File materi'}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Buka file pendukung</p>
                  </div>
                  <span className="ml-auto text-[11px] font-bold text-[#0E6187] shrink-0">Buka →</span>
                </a>
              )}
            </div>

            {/* Back Button */}
            <div>
              <button onClick={() => { refreshDetail(); navigate(`/siswa-dashboard/quiz/${detail?.paket.id ?? paketId}`) }}
                className={`w-full flex items-center justify-center gap-2 text-[13px] font-bold py-3.5 rounded-md transition-colors ${lessonGreen ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-[#0E6187] text-white hover:bg-[#0a4d6b]'}`}>
                {lessonGreen ? <><Check size={15} /> Selesai Membaca · Kembali ke Materi</> : <><ArrowLeft size={15} /> Kembali ke Daftar Materi</>}
              </button>
            </div>
          </div>

          {/* Bottom nav */}
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="mx-auto grid max-w-lg grid-cols-5">
              {bottomNav.map(nav => {
                const Icon = nav.icon
                const isActive = nav.to === location.pathname
                return (
                  <Link key={nav.label} to={nav.to}
                    className={`flex flex-col items-center gap-1 py-2.5 transition ${isActive ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                    <span className="text-[10px] font-medium">{nav.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
        {/* Hero */}
        <div className="relative h-52 bg-gradient-to-br from-[#0E6187] to-[#1a3355] overflow-hidden">
          {detail.paket.cover_url && (
            <img src={detail.paket.cover_url} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E6187] via-[#0E6187]/60 to-transparent" />
          <div className="relative max-w-lg mx-auto px-4 h-full flex flex-col justify-end pb-6">
            <button onClick={goBack}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white transition-colors mb-4 self-start">
              <ArrowLeft size={12} /> Semua Kursus
            </button>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{paket.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {paket.course_title && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/15 text-white/80 truncate">
                      {paket.course_title}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                    allGreen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                  }`}>
                    {allGreen ? 'Selesai' : `${greenCount} dari ${lessons.length} hijau`}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-3xl font-black ${allGreen ? 'text-emerald-400' : 'text-white'}`}>
                  {progressPct}%
                </div>
                <p className="text-[10px] font-bold text-white/50 mt-0.5">Progres</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {/* Progress */}
          <div className="bg-white rounded-md border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-slate-700">Daftar Materi</p>
              <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                {greenCount}/{lessons.length} Hijau
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1">
                <div className="h-2 rounded-md bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-md bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <span className="text-lg font-black text-emerald-600 tabular-nums">{progressPct}%</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium mt-2.5">
              Baca seluruh materi hingga activity hijau untuk membuka kuis.
            </p>
          </div>

          {/* Lesson list */}
          <div className="bg-white rounded-md border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {lessons.map((l, idx) => {
              const lGreen = isGreen(l)
              return (
                <button key={l.id} onClick={() => openLesson(l)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${lGreen ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {lGreen ? <Check size={15} /> : <span className="text-[10.5px] font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{l.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      {l.has_video && <><Video size={10} /> Video</>}
                      {l.has_video && l.has_content && <span>·</span>}
                      {l.has_content && <><FileText size={10} /> Modul</>}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${lGreen ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                    {lGreen ? 'Hijau' : 'Belum hijau'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* CTA */}
          {allGreen ? (
            <button onClick={goToRules}
              className="w-full flex items-center justify-center gap-2 text-[13px] font-bold py-3.5 rounded-md bg-[#0E6187] text-white hover:bg-[#0a4d6b] transition-colors">
              <Play size={15} /> Mulai Mengerjakan Quiz
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[12px] font-bold text-slate-400 bg-slate-100 rounded-md py-3.5">
              <Lock size={15} /> Selesaikan semua materi hingga hijau untuk membuka quiz
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {bottomNav.map(nav => {
              const Icon = nav.icon
              const isActive = nav.to === location.pathname
              return (
                <Link key={nav.label} to={nav.to}
                  className={`flex flex-col items-center gap-1 py-2.5 transition ${isActive ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{nav.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    )
  }

  if (view === 'rules' && !detail) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4">
            <ArrowLeft size={12} /> Daftar Paket Soal
          </button>
          <div className="text-center text-xs text-slate-400 py-16">Memuat detail paket...</div>
        </div>
      </div>
    )
  }

  if (view === 'rules' && detail) {
    const { paket, attempts, lessons, is_unlocked } = detail
    const used = attempts.length
    const inProgress = attempts.find(a => a.status === 'in_progress')
    const remainingAttempts = paket.max_attempts - used
    const canStartNew = remainingAttempts > 0
    const completedCount = lessons.filter(l => l.completed).length
    const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

    const startFlow = () => {
      if (inProgress) {
        setCamError(null)
        setCameraModal(false)
        resumeAttempt(inProgress.attempt_id)
        return
      }
      setView('rules')
      setCameraModal(true)
      requestCamera()
    }

    return (
      <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
        <div className="max-w-lg mx-auto px-4 py-6 pb-4">
          <button onClick={goBack}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4">
            <ArrowLeft size={12} /> Daftar Paket Soal
          </button>

          <div className="bg-[#0E6187] rounded-md overflow-hidden shadow-sm">
            <div className="px-5 py-5">
              <h1 className="text-lg font-bold text-white leading-snug">{paket.title}</h1>
              {paket.description && <p className="text-[11px] text-teal-100 mt-1.5">{paket.description}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {paket.course_title && (
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-[10px] font-bold text-white/80">{paket.course_title}</span>
                )}
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-[10px] font-bold text-white/80">{paket.questions_count} soal</span>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-white rounded-md border border-slate-200 p-5 mt-4 shadow-sm">
            <h2 className="text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-4">Aturan & Ketentuan</h2>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-[#0E6187]/[0.06] flex items-center justify-center shrink-0">
                  <Clock size={15} className="text-[#0E6187]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-700">Durasi {paket.time_limit_minutes} menit</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Quiz akan dikumpulkan otomatis saat waktu habis.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-[#0E6187]/[0.06] flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} className="text-[#0E6187]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-700">Max {paket.max_warnings} peringatan</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Meninggalkan halaman quiz dapat memicu peringatan. Peringatan terakhir mengumpulkan quiz otomatis.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-[#0E6187]/[0.06] flex items-center justify-center shrink-0">
                  <Camera size={15} className="text-[#0E6187]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-700">Kamera pengawas</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Kamera wajib aktif selama pengerjaan sebagai bentuk kejujuran.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-[#0E6187]/[0.06] flex items-center justify-center shrink-0">
                  <ListChecks size={15} className="text-[#0E6187]" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-700">Maks {paket.max_attempts} percobaan</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Nilai terbaik akan diambil. Minimal nilai lulus: {paket.passing_score}.</p>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          {attempts.length > 0 && (
            <div className="bg-white rounded-md border border-slate-200 p-5 mt-4 shadow-sm">
              <h2 className="text-[11px] font-bold tracking-wide text-slate-500 uppercase mb-3">Riwayat Percobaan</h2>
              <div className="space-y-2">
                {attempts.map(a => (
                  <div key={a.attempt_id} className="flex items-center gap-3 bg-slate-50 rounded-md border border-slate-100 px-3 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${a.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                      #{a.attempt_number}
                    </span>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-slate-700">
                        {a.status === 'submitted' ? (Number(a.score) || 0) + ' poin' : 'Sedang berjalan'}
                        {a.auto_submitted && <span className="ml-1 text-[9px] font-bold text-orange-500">AUTO</span>}
                      </p>
                      <p className="text-[9.5px] text-slate-400 font-medium mt-0.5">
                        {a.started_at ? new Date(a.started_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    {a.status === 'in_progress' && <span className="text-[9.5px] font-bold text-orange-500 shrink-0">LANJUTKAN*</span>}
                  </div>
                ))}
              </div>
              {remainingAttempts > 0 && (
                <p className="text-[10px] text-slate-400 font-medium mt-2.5">Sisa percobaan: {remainingAttempts}×</p>
              )}
            </div>
          )}

          {/* Materi Wajib */}
          <div className="bg-white rounded-md border border-slate-200 p-5 mt-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">Materi Wajib</h2>
              <span className="text-[10px] font-bold text-slate-500">{completedCount}/{lessons.length} selesai</span>
            </div>
            <div className="mt-3 h-2 rounded-md bg-slate-100 overflow-hidden">
              <div className="h-full rounded-md transition-all duration-500"
                style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#10b981' : '#0E6187' }} />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-2">
              Selesaikan seluruh materi di bawah untuk membuka kuis.
            </p>
          </div>

          {/* Lesson list */}
          {lessons.length > 0 && (
            <div className="bg-white rounded-md border border-slate-200 mt-3 overflow-hidden shadow-sm">
              {lessons.map((l, idx) => (
                <button key={l.id} onClick={() => openLesson(l)}
                  className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${idx !== 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${l.completed ? 'bg-emerald-50 text-emerald-500' : 'bg-[#0E6187]/[0.06] text-[#0E6187]'}`}>
                    {l.completed ? <Check size={17} /> : <BookOpen size={17} />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{l.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                      {l.has_video && <><Video size={10} /> Video</>}
                      {l.has_video && l.has_content && <span>·</span>}
                      {l.has_content && <><FileText size={10} /> Modul</>}
                    </p>
                  </div>
                  {l.completed && (
                    <span className="text-[9.5px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md shrink-0">Selesai</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4">
            <button onClick={startFlow} disabled={!is_unlocked || (!inProgress && !canStartNew) || starting}
              className={`w-full flex items-center justify-center gap-2 text-[12.5px] font-bold py-3.5 rounded-md transition-colors ${!is_unlocked || (!inProgress && !canStartNew) ? 'bg-slate-200 text-slate-400' : 'bg-[#0E6187] text-white hover:bg-[#0a4d6b]'}`}>
              <Play size={15} />
              {starting ? 'Menyiapkan...' : is_unlocked ? 'Kerjakan Quiz' : 'Selesaikan semua materi untuk membuka kuis'}
            </button>
          </div>
        </div>

        {/* Camera gate modal */}
        {cameraModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setCameraModal(false)}>
            <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-md p-5" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-10 rounded-md bg-[#0E6187]/[0.06] flex items-center justify-center mb-3">
                <Camera size={18} className="text-[#0E6187]" />
              </div>
              <h2 className="text-sm font-bold text-slate-800">Aktifkan kamera pengawas</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Kamera akan merekam Anda saat mengerjakan quiz. Izinkan akses kamera untuk memulai.
              </p>

              <div className="mt-4">
                {camActive && streamRef.current ? (
                  <video ref={videoRef} muted playsInline autoPlay className="w-full h-52 rounded-md object-cover bg-black" />
                ) : (
                  <div className="w-full h-52 rounded-md bg-slate-100 flex items-center justify-center">
                    {camBusy ? (
                      <p className="text-[11px] font-semibold text-slate-400">Meminta izin kamera...</p>
                    ) : (
                      <button onClick={requestCamera} className="flex items-center gap-2 text-[11px] font-bold text-[#0E6187]">
                        <Camera size={14} /> Coba lagi akses kamera
                      </button>
                    )}
                  </div>
                )}
                {camError && <p className="text-[10.5px] font-bold text-red-500 mt-2">{camError}</p>}
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setCameraModal(false)}
                  className="flex-1 text-[12px] font-bold text-slate-500 bg-slate-100 py-3 rounded-md hover:bg-slate-200 transition-colors">
                  Batal
                </button>
                <button onClick={startNew} disabled={!camActive || starting}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold text-white bg-[#0E6187] py-3 rounded-md hover:bg-[#0a4d6b] transition-colors disabled:opacity-40">
                  <Play size={13} /> {starting ? 'Menyiapkan...' : 'Kerjakan Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {bottomNav.map(nav => {
              const Icon = nav.icon
              const isActive = nav.to === location.pathname
              return (
                <Link key={nav.label} to={nav.to}
                  className={`flex flex-col items-center gap-1 py-2.5 transition ${isActive ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{nav.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    )
  }

  // ==================== LIST VIEW ====================
  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
      <header className="bg-[#0E6187] px-4 pb-6 pt-5 text-white">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center gap-2">
            <img src="/logo-sm1.png" alt="Kelas Mendunia" className="h-8 w-auto" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
              <ListChecks size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Paket Soal / Quiz</h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Evaluasi pemahaman materi kamu</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3 pb-4">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-16">Memuat paket soal...</div>
        ) : pakets.length === 0 ? (
          <div className="bg-white rounded-md border border-dashed border-[#E5E7EF] p-10 text-center">
            <ListChecks size={28} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum ada paket soal</p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Guru/instruktur belum membuka quiz untuk Anda</p>
          </div>
        ) : (
          pakets.map(p => {
            const lulus = p.best_score !== null && p.passing_score > 0 && p.best_score >= p.passing_score
            return (
              <button key={p.id} onClick={() => openPaket(p.id)}
                className="w-full text-left bg-white rounded-md border border-[#E5E7EF] p-5 transition-all hover:shadow-sm">
                {p.cover_url && (
                  <div className="w-full h-32 rounded-md overflow-hidden border border-slate-100 mb-4 -mt-1">
                    <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-800 truncate">{p.title}</h2>
                    {p.description && <p className="text-[11px] text-slate-400 font-medium mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                  {p.best_score !== null && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 ${lulus ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0E6187]/[0.06] text-[#0E6187]'}`}>
                      Nilai {p.best_score}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[10.5px] font-semibold text-slate-400">
                  {[p.course_title, p.batch_name, `${p.questions_count} soal`, `${p.time_limit_minutes} menit`].filter(Boolean).map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-slate-300" /> {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[10.5px] font-semibold text-slate-400">
                    {p.attempts_used}/{p.max_attempts} percobaan dipakai
                  </p>
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold py-1.5 px-3 rounded-lg ${p.can_start ? 'bg-[#0E6187] text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Play size={11} /> {p.can_start ? 'Kerjakan' : 'Selesai'}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {bottomNav.map(nav => {
            const Icon = nav.icon
            const isActive = nav.to === location.pathname
            return (
              <Link key={nav.label} to={nav.to}
                className={`flex flex-col items-center gap-1 py-2.5 transition ${isActive ? 'text-[#0E6187]' : 'text-slate-400'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                <span className="text-[10px] font-medium">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}