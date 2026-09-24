import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Volume2, VolumeX, X, Play, Pause } from 'lucide-react'
import { quizApi } from '../../services/api'
import { detectFace, faceModelsReady, loadFaceModels, type DetectedFace } from '../../utils/faceDetector'
import Swal from 'sweetalert2'
import { useForceLightMode } from '../../hooks/useForceLightMode'
import DraggableCamera from '../../components/quiz/DraggableCamera'

const cleanQuillHtml = (html: string | null | undefined) =>
  (html ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

interface PlayQuestion {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: (string | { text?: string; image_url?: string | null; image_path?: string | null })[]
  points: number
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
  audio_plays?: number
  selected_index?: number | null
  answer_text?: string | null
  section?: string | null
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

function QuestionAudio({ src, maxPlays, plays, attemptId, questionId, onCompleted }: {
  src: string
  maxPlays: number | null
  plays: number
  attemptId: number
  questionId: number
  onCompleted: (count: number) => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

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

  const handleTimeUpdate = () => {
    const a = audioRef.current
    if (a && a.duration) setProgress(Math.min(1, a.currentTime / a.duration))
  }

  const handleEnded = async () => {
    const a = audioRef.current
    if (!a) return
    setPlaying(false)
    a.currentTime = 0
    setProgress(0)
    if (maxPlays !== null) {
      try {
        const { data } = await quizApi.recordAudioPlay(attemptId, questionId)
        onCompleted(data.audio_plays ?? 0)
      } catch {
        onCompleted(plays + 1)
      }
    }
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
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  )
}

const CELEBRATION_HTML = `
    <div style="text-align:center">
      <img src="/celebrate.svg" alt="Hore!" style="width:160px;margin:0 auto 12px;display:block;filter:drop-shadow(0 4px 12px rgba(255,165,0,.25))" />
      <p style="font-size:22px;font-weight:800;color:#1a1a2e;margin:0 0 6px">Hore! Kamu Hebat!</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Kuis berhasil dikumpulkan. Semangat terus ya!</p>
      <p style="font-size:12px;color:#9ca3af;margin:0">Nilai dan pembahasan bisa dilihat di halaman berikutnya.</p>
    </div>
  `

// ── Toleransi proctoring untuk perangkat lemah ──
// Semua didasarkan pada durasi (ms), bukan jumlah tick, agar konsisten
// di perangkat yang frame deteksinya lambat. Tujuannya: hanya siswa yang
// benar-benar meninggalkan layar yang kena, bukan karena false-negative
// kamera/deteksi.
const CAM_GRACE_MS = 15000  // masa pemanasan awal (model + fokus kamera)
const GONE_MS = 12000       // wajah hilang terus-menerus ≥ 12 dtk → warning
const TURN_MS = 5000        // menoleh terus-menerus ≥ 5 dtk → warning
const WARN_COOLDOWN_MS = 20000 // maks 1 warning per 20 dtk
const CAM_DEAD_MS = 10000   // kamera tidak hidup ≥ 10 dtk → banner + coba ulang
const CAM_RETRY_MS = 15000  // interval minimal coba ulang kamera

export default function QuizBasicPlay() {
  useForceLightMode()
  const { paketId, attemptId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navTitle = (location.state as { title?: string } | null)?.title

  const [attempt, setAttempt] = useState<PlayAttempt | null>(null)
  const [questions, setQuestions] = useState<PlayQuestion[]>([])
  const [selected, setSelected] = useState<Record<number, number | null>>({})
  const [essayDrafts, setEssayDrafts] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [remaining, setRemaining] = useState(0)
  const [warnBanner, setWarnBanner] = useState(false)
  const [testTitle, setTestTitle] = useState('')
  const [audioPlays, setAudioPlays] = useState<Record<number, number>>({})
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [blockExit, setBlockExit] = useState(true)
  const [faceMissing, setFaceMissing] = useState(false)
  const [headTurned, setHeadTurned] = useState(false)
  const [streamVersion, setStreamVersion] = useState(0)
  const [monitorMsg, setMonitorMsg] = useState('')

  const endTimeRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraRef = useRef<HTMLVideoElement | null>(null)
  const detectBusyRef = useRef(false)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const snapshotRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const faceMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const essayTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})
  const isLoadingEssayRef = useRef<Record<number, boolean>>({})
  const cameraAttachedRef = useRef(false)
  const goneStartRef = useRef(0)
  const turnStartRef = useRef(0)
  const lastWarnAtRef = useRef(0)
  const camDeadStartRef = useRef(0)
  const graceUntilRef = useRef(0)
  const lastRetryAtRef = useRef(0)
  const offenseRef = useRef(0)

  const stopTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    if (snapshotRef.current) clearInterval(snapshotRef.current)
    if (faceMonitorRef.current) clearInterval(faceMonitorRef.current)
    countdownRef.current = null
    snapshotRef.current = null
    faceMonitorRef.current = null
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  // ── Celebration sound (Web Audio API – no external file) ──
  const playTaDa = useCallback(() => {
    try {
      const ctx = new AudioContext()
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.14)
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + i * 0.14 + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.14 + 0.48)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.14)
        osc.stop(ctx.currentTime + i * 0.14 + 0.5)
      })
    } catch {}
  }, [])

  // ── Load attempt ──
  const load = useCallback(() => {
    if (!attemptId) return
    setIsLoading(true)
    quizApi.attempt(Number(attemptId)).then(res => {
      const a = res.data.attempt
      const data = res.data
      if (a?.status === 'submitted' || a?.score !== undefined) {
        navigate(`/siswa-dashboard/quiz/${paketId}${location.search}`, { replace: true })
        return
      }
      setAttempt(a)
      setTestTitle(navTitle || res.data.paket?.title || res.data.test_name || 'Quiz')
      setCameraEnabled(data.camera_enabled !== false)
      setBlockExit(data.block_exit !== false)
      const pre: Record<number, number | null> = {}
      const preEssay: Record<number, string> = {}
      const preAudio: Record<number, number> = {}
      const qs: PlayQuestion[] = (data.questions || []).map((q: any) => {
        if (q.selected_index !== undefined && q.selected_index !== null) pre[q.id] = q.selected_index
        if (q.answer_text !== undefined && q.answer_text !== null) preEssay[q.id] = q.answer_text
        if (q.audio_plays !== undefined && q.audio_plays !== null) preAudio[q.id] = q.audio_plays
        return {
          id: q.id, question: q.question, question_type: q.question_type ?? 'choice', rating_max: q.rating_max ?? null,
          options: q.options, points: q.points,
          image_url: q.image_url ?? null, audio_url: q.audio_url ?? null,
          audio_max_plays: q.audio_max_plays ?? null, audio_plays: q.audio_plays ?? 0,
          selected_index: q.selected_index ?? null,
          answer_text: q.answer_text ?? null,
          section: q.section ?? null,
        }
      })
      setQuestions(qs)
      setSelected(pre)
      setEssayDrafts(preEssay)
      setFlagged(new Set())
      setAudioPlays(preAudio)
      setCameraActive(false)
      setFaceMissing(false)
      setHeadTurned(false)
      setMonitorMsg('')
      setWarnBanner(false)
      goneStartRef.current = 0
      turnStartRef.current = 0
      camDeadStartRef.current = 0
      lastWarnAtRef.current = 0
      lastRetryAtRef.current = 0
      offenseRef.current = 0
      graceUntilRef.current = Date.now() + CAM_GRACE_MS
      cameraAttachedRef.current = false

      const endTime = Date.parse(a.started_at) + a.time_limit_seconds * 1000
      endTimeRef.current = endTime
      setRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)))
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal memuat percobaan' })
      navigate(`/siswa-dashboard/quiz/${paketId}${location.search}`, { replace: true })
    }).finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, paketId, navigate])

  useEffect(() => {
    load()
    const cleanup = stopTimers
    return cleanup
  }, [load, stopTimers])

  // ── Camera stream for proctoring snapshots ──
  const requestCamera = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraActive(false)
      return false
    }
    try {
      // Resolusi + FPS ditekan agar perangkat bawah tidak berat saat decoding
      // & deteksi wajah. 320p/15fps sudah cukup untuk proctoring; max dipatok
      // keras agar browser tidak naik ke resolusi lebih tinggi di device kencang.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 320, max: 480 }, height: { ideal: 240, max: 360 }, frameRate: { ideal: 10, max: 15 } }, audio: false })
      stopStream()
      streamRef.current = stream
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream
        cameraRef.current.play().catch(() => {})
        setCameraActive(true)
      } else {
        setCameraActive(false)
      }
      setStreamVersion(v => v + 1)
      return true
    } catch {
      setCameraActive(false)
      return false
    }
  }, [stopStream])

  // Request camera with retries — during route transition to play, the previous
  // page's stream may still hold the device, so getUserMedia can briefly fail.
  useEffect(() => {
    if (!cameraEnabled) return
    let cancelled = false
    loadFaceModels()
    const start = async (attempts: number) => {
      const ok = await requestCamera()
      if (cancelled) return
      if (!ok && attempts > 0) {
        setTimeout(() => start(attempts - 1), 900)
      }
    }
    start(4)
    return () => {
      cancelled = true
      stopStream()
    }
  }, [requestCamera, stopStream, cameraEnabled])

  // ── Attach stream to video once element exists ──
  useEffect(() => {
    if (isLoading || !streamRef.current || !cameraRef.current) return
    cameraAttachedRef.current = true
    const v = cameraRef.current
    if (v.srcObject !== streamRef.current) v.srcObject = streamRef.current
    const onMeta = () => setCameraActive(true)
    v.addEventListener('loadedmetadata', onMeta)
    v.play().catch(() => {})
    return () => v.removeEventListener('loadedmetadata', onMeta)
  }, [isLoading, streamVersion])

  // ── Timer + snapshots ──
  const submitNow = useCallback((reason: string) => {
    if (!attemptId || isSubmitting) return
    setIsSubmitting(true)
    stopTimers()
    Object.keys(essayTimersRef.current).forEach(k => clearTimeout(essayTimersRef.current[Number(k)]))
    essayTimersRef.current = {}
    const essayOrders = questions
      .filter(q => q.question_type === 'essay')
      .map(q => quizApi.answer(Number(attemptId), { question_id: q.id, selected_index: null, answer_text: (essayDrafts[q.id] ?? '').trim() || null }))
    Promise.allSettled(essayOrders).finally(() => {
      quizApi.submit(Number(attemptId)).then(() => {
        if (reason === 'manual') {
          playTaDa()
          Swal.fire({
            html: CELEBRATION_HTML,
            icon: undefined,
            showConfirmButton: true,
            confirmButtonColor: '#0E6187',
            confirmButtonText: 'Lihat Hasil',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: { popup: 'celebrate-popup' },
            didOpen: (popup) => {
              const img = popup.querySelector('img')
              if (img) {
                img.animate(
                  [
                    { transform: 'scale(0.3) rotate(-15deg)', opacity: 0 },
                    { transform: 'scale(1.1) rotate(4deg)', opacity: 1 },
                    { transform: 'scale(1) rotate(0deg)', opacity: 1 },
                  ],
                  { duration: 600, easing: 'cubic-bezier(.34,1.56,.64,1)' }
                )
              }
            },
          }).then(() => {
            navigate(`/siswa-dashboard/quiz/${paketId}${location.search}`, { replace: true })
          })
        } else {
          navigate(`/siswa-dashboard/quiz/${paketId}${location.search}`, { replace: true })
        }
      }).catch(() => {
        Swal.fire({ icon: 'error', title: 'Gagal mengumpulkan quiz', text: reason })
        setIsSubmitting(false)
        if (reason === 'waktu habis') setRemaining(0)
      })
    })
  }, [attemptId, paketId, isSubmitting, stopTimers, navigate, questions, essayDrafts, playTaDa])

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
    if (cameraEnabled) {
      snapshotRef.current = setInterval(captureSnapshot, 5000)
      faceMonitorRef.current = setInterval(runDetection, 1000)
    }
    return stopTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, cameraEnabled, submitNow, stopTimers])

  const captureSnapshot = () => {
    const video = cameraRef.current
    if (!video || video.videoWidth === 0 || !attemptId) return
    const maxW = 320
    const scale = Math.min(1, maxW / video.videoWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return
      const fd = new FormData()
      fd.append('photo', new File([blob], `snap-${Date.now()}.jpg`, { type: 'image/jpeg' }))
      quizApi.uploadWebcam(Number(attemptId), fd).catch(() => {})
    }, 'image/jpeg', 0.5)
  }

  // ── Face / presence monitoring (proctoring) ──
  // Setiap offense → warning banner + backend warn. Pengumpulan otomatis
  // ditentukan backend sesuai "Maks Peringatan" (max_warnings) paket.
  const handleOffense = useCallback((reason: string) => {
    if (!attemptId) return
    offenseRef.current += 1
    setFaceMissing(reason === 'wajah tak terdeteksi')
    setMonitorMsg(`Kamera pengawas mendeteksi ${reason}. Jika terulang, pengerjaan akan dikumpulkan otomatis.`)
    quizApi.warn(Number(attemptId)).then(res => {
      const d = res.data
      if (d.auto_submitted || d.status === 'submitted') {
        stopTimers()
        setMonitorMsg('')
        Swal.fire({
          icon: 'warning',
          title: 'Pengerjaan dikumpulkan otomatis',
          text: `Kamera pengawas mendeteksi ${reason} secara berulang. Jawaban disimpan dan quiz dianggap selesai.`,
          confirmButtonColor: '#0069b0',
          confirmButtonText: 'OK',
          allowOutsideClick: false,
        })
        submitNow(reason)
      }
    }).catch(() => {})
  }, [attemptId, submitNow, stopTimers])

  // Draw the detected face bounding box. Green normally, red while head is
  // turned left/right. Coordinates are mapped from video pixels to the
  // displayed (object-cover cropped) size of the widget.
  const drawOverlay = useCallback((face: DetectedFace | null) => {
    const cv = overlayCanvasRef.current
    const video = cameraRef.current
    if (!cv || !video) return
    if (cv.width !== cv.clientWidth || cv.height !== cv.clientHeight) {
      cv.width = cv.clientWidth
      cv.height = cv.clientHeight
    }
    const ctx = cv.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cv.width, cv.height)
    if (!face) return
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return
    const cw = cv.width
    const ch = cv.height
    const scale = Math.max(cw / vw, ch / vh)
    const ox = (cw - vw * scale) / 2
    const oy = (ch - vh * scale) / 2
    const x = face.x * scale + ox
    const y = face.y * scale + oy
    const w = face.width * scale
    const h = face.height * scale
    const color = face.turned ? '#ef4444' : '#22c55e'
    ctx.lineWidth = 2
    ctx.strokeStyle = color
    ctx.strokeRect(x, y, w, h)
    const label = face.turned ? 'MENOLOH' : 'WAJAH'
    ctx.font = 'bold 8px system-ui, sans-serif'
    const tw = ctx.measureText(label).width
    ctx.fillStyle = color
    ctx.fillRect(x, y - 10, tw + 8, 10)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(label, x + 4, y - 3)
  }, [])

  const runDetection = useCallback(async () => {
    const video = cameraRef.current
    // Guard agar deteksi tidak bertumpuk: di perangkat lambat, face-api bisa
    // lebih lama dari interval → tanpa guard CPU menumpuk & aplikasi lag/close.
    if (!video || detectBusyRef.current) return
    detectBusyRef.current = true
    const now = Date.now()
    try {
      // Liveness gate: kalau stream kamera tidak benar-benar hidup, WAJAH TIDAK
      // DIHITUNG sebagai pelanggaran. Kamera hang/mati sering terjadi di
      // perangkat lemah — itu bukan kesalahan siswa.
      const live = !!streamRef.current && video.readyState >= 2 && video.videoWidth > 0
      if (!live) {
        if (!camDeadStartRef.current) {
          camDeadStartRef.current = now
          setMonitorMsg('Kamera pengawas tidak aktif. Pastikan kamera tetap menyala — Anda tidak akan dihukum karena ini.')
        }
        setFaceMissing(false)
        setHeadTurned(false)
        drawOverlay(null)
        // Coba hubungkan ulang beberapa saat setelah kamera mati
        if (now - camDeadStartRef.current >= CAM_DEAD_MS && now - lastRetryAtRef.current >= CAM_RETRY_MS) {
          lastRetryAtRef.current = now
          setMonitorMsg('Kamera pengawas tidak aktif. Mencoba menghubungkan ulang...')
          requestCamera().then(ok => {
            if (ok) {
              setMonitorMsg('')
              graceUntilRef.current = Date.now() + CAM_GRACE_MS
            }
          })
        }
        return
      }
      if (camDeadStartRef.current) {
        camDeadStartRef.current = 0
        setMonitorMsg('')
      }

      const face = await detectFace(video)
      drawOverlay(face)
      setHeadTurned(face?.turned ?? false)

      if (!face) {
        turnStartRef.current = 0
        setFaceMissing(true)
        if (!goneStartRef.current) goneStartRef.current = now
        const absentMs = now - goneStartRef.current
        if (absentMs >= GONE_MS && now >= graceUntilRef.current && now - lastWarnAtRef.current >= WARN_COOLDOWN_MS) {
          lastWarnAtRef.current = now
          handleOffense('wajah tak terdeteksi')
        }
      } else {
        goneStartRef.current = 0
        setFaceMissing(false)
        if (face.turned) {
          if (!turnStartRef.current) turnStartRef.current = now
          if (now - turnStartRef.current >= TURN_MS && now >= graceUntilRef.current && now - lastWarnAtRef.current >= WARN_COOLDOWN_MS) {
            lastWarnAtRef.current = now
            handleOffense('Anda menoleh ke samping')
          }
        } else {
          turnStartRef.current = 0
        }
      }
    } catch {
      if (!faceModelsReady()) return
      drawOverlay(null)
      setHeadTurned(false)
      // Error internal deteksi — di-reset, bukan dihitung pelanggaran.
      goneStartRef.current = 0
      turnStartRef.current = 0
    } finally {
      detectBusyRef.current = false
    }
  }, [drawOverlay, handleOffense, requestCamera])

  // ── Warn on leaving page ──
  const sendWarn = useCallback(() => {
    if (!attemptId) return
    quizApi.warn(Number(attemptId)).then(res => {
      const d = res.data
      if (d.auto_submitted || d.status === 'submitted') {
        submitNow('keluar aplikasi')
      } else {
        setWarnBanner(true)
      }
    }).catch(() => {})
  }, [attemptId, submitNow])

  useEffect(() => {
    if (!blockExit) return
    const onVis = () => {
      if (document.visibilityState === 'hidden') sendWarn()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [sendWarn, blockExit])

  // ── Answer selection ──
  const updateEssay = (qid: number, val: string) => {
    setEssayDrafts(d => ({ ...d, [qid]: val }))
    if (essayTimersRef.current[qid]) clearTimeout(essayTimersRef.current[qid])
    essayTimersRef.current[qid] = setTimeout(() => {
      delete essayTimersRef.current[qid]
      if (!attemptId) return
      if (isLoadingEssayRef.current[qid]) return
      isLoadingEssayRef.current[qid] = true
      quizApi.answer(Number(attemptId), { question_id: qid, selected_index: null, answer_text: val.trim() || null })
        .catch(() => Swal.fire({ icon: 'warning', title: 'Gagal menyimpan jawaban', text: 'Periksa koneksi Anda' }))
        .finally(() => isLoadingEssayRef.current[qid] = false)
    }, 700)
  }

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

  const toggleFlag = (idx: number) => {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const exitQuiz = () => {
    if (isSubmitting) return
    Swal.fire({
      title: 'Yakin akan keluar?',
      text: 'Nilai jawaban Anda akan otomatis tersimpan sebagai nilai akhir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0069b0',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Tetap di Quiz',
    }).then(res => {
      if (res.isConfirmed) submitNow('keluar')
    })
  }

  const submitManually = () => {
    const unanswered = questions.length - questions.filter(isAnsweredQ).length
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

  // ── derived ──
  const lowTime = remaining <= 60
  const isAnsweredQ = (q: PlayQuestion) => q.question_type === 'essay'
    ? !!(essayDrafts[q.id] ?? '').trim()
    : selected[q.id] !== undefined && selected[q.id] !== null
  const answeredCount = questions.filter(isAnsweredQ).length
  const currentQuestion = questions[currentIndex]

  const sections = useMemo(() => {
    const acc: { name: string; total: number; answered: number; startIndex: number }[] = []
    questions.forEach((q, idx) => {
      const name = (q.section || '').trim()
      const answered = q.question_type === 'essay'
        ? !!(essayDrafts[q.id] ?? '').trim()
        : selected[q.id] !== undefined && selected[q.id] !== null
      const last = acc[acc.length - 1]
      if (last && last.name === name) {
        last.total++
        if (answered) last.answered++
      } else {
        acc.push({ name, total: 1, answered: answered ? 1 : 0, startIndex: idx })
      }
    })
    return acc
  }, [questions, selected, essayDrafts])

  const currentSectionName = currentQuestion ? (currentQuestion.section || '').trim() : ''
  const sectionLocalIndex = currentIndex
  const isLast = currentIndex === questions.length - 1

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef4f9]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0069b0]/20 border-t-[#0069b0] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#8B90A0]">Memuat soal...</p>
        </div>
      </div>
    )
  }
  if (!attempt || !currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#eef4f9]">
        <div className="text-center px-6">
          <p className="text-sm font-bold text-[#14182B]">Soal tidak ditemukan</p>
          <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Attempt tidak valid atau sudah diselesaikan</p>
          <button onClick={() => navigate(`/siswa-dashboard/quiz/${paketId}${location.search}`)}
            className="mt-4 text-[11px] font-bold text-[#0069b0] hover:underline">
            Kembali ke quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#eef4f9]">
      {/* ── Top Header (Dark Blue) ── */}
      <div className="relative bg-[#0b2c45] px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <p className="text-[13px] text-white">
              <span className="font-normal text-blue-200">Soal: </span>
              <span className="font-bold">{sectionLocalIndex + 1}</span>
            </p>
            <p className="mt-1 text-[13px] font-normal text-blue-200">Bagian:</p>
            <p className="max-w-[160px] truncate text-[13px] font-semibold text-white">{currentSectionName || '—'}</p>
          </div>

          <div className="flex items-center gap-2">
            {cameraEnabled && streamRef.current && (
              <DraggableCamera
                cameraRef={cameraRef}
                overlayCanvasRef={overlayCanvasRef}
                cameraActive={cameraActive}
                faceMissing={faceMissing}
                headTurned={headTurned}
              />
            )}
            {cameraEnabled && !streamRef.current && (
              <span className="inline-flex items-center gap-1.5 rounded bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> Kamera mati
              </span>
            )}
            <button
              onClick={submitManually}
              disabled={isSubmitting}
              className="shrink-0 rounded bg-[#8fc3e8] px-3 py-1.5 text-xs font-bold text-[#0b2c45] transition-colors hover:bg-[#a3cff0] disabled:opacity-60 sm:px-4 sm:text-sm"
            >
              {isSubmitting ? 'Mengumpulkan...' : 'Kumpulkan'}
            </button>
            <button
              onClick={exitQuiz}
              className="shrink-0 rounded p-1.5 text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
              title="Keluar dari quiz"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="mt-2 flex items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:top-1/2 sm:mt-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="flex items-baseline gap-2 sm:flex-col sm:gap-0">
            <p className="text-[11px] tracking-wide text-blue-200">Waktu Tersisa</p>
            <p className={`text-lg leading-tight font-bold ${lowTime ? 'text-red-400' : 'text-white'}`}>{fmtClock(remaining)}</p>
          </div>
        </div>
      </div>

      {/* ── Subheader (Blue) ── */}
      <div className="flex items-center justify-between border-b border-[#0a5489] bg-[#0069b0] px-4 py-1.5 md:px-6">
        <p className="min-w-0 truncate text-[13px] text-white">
          <span className="font-bold">Tes: </span>
          <span className="font-normal">{testTitle}</span>
        </p>
        <span className="shrink-0 text-[11px] font-semibold text-white/80">{answeredCount}/{questions.length} terjawab</span>
      </div>

      {/* ── Warning banner ── */}
      {warnBanner && (
        <div className="flex items-center gap-2 border-b border-orange-200 bg-orange-50 px-4 py-2">
          <p className="flex-1 text-[11px] font-bold text-orange-600">Deteksi keluar aplikasi. Keluar lagi akan langsung mengumpulkan quiz otomatis.</p>
          <button onClick={() => setWarnBanner(false)} className="text-xs font-bold text-orange-400 hover:text-orange-600">✕</button>
        </div>
      )}

      {/* ── Camera monitor banner ── */}
      {monitorMsg && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2">
          <p className="flex-1 text-[11px] font-bold text-amber-700">{monitorMsg}</p>
          <button onClick={() => setMonitorMsg('')} className="text-xs font-bold text-amber-400 hover:text-amber-700">✕</button>
        </div>
      )}

      {/* ── Face missing banner ── */}
      {faceMissing && !monitorMsg && (
        <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2">
          <p className="flex-1 text-[11px] font-bold text-red-600">
            Kepala/wajah Anda tidak terdeteksi oleh kamera pengawas. Pastikan wajah terlihat jelas di depan kamera.
          </p>
          <button onClick={() => { setFaceMissing(false); goneStartRef.current = 0 }}
            className="text-xs font-bold text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── Mobile: question navigator ── */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 md:hidden">
        <span className="shrink-0 text-[10px] font-semibold text-gray-400">Soal:</span>
        {questions.map((q, idx) => {
          const isActive = idx === currentIndex
          const isAnswered = isAnsweredQ(q)
          const isFlagged = flagged.has(idx)
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex h-9 min-w-9 shrink-0 items-center justify-center rounded-md px-1 text-xs font-bold transition-all hover:opacity-90 ${
                isActive
                  ? 'bg-[#0069b0] text-white'
                  : isAnswered
                    ? 'bg-[#0b2c45] text-white'
                    : 'border border-gray-200 bg-[#eef4f9] text-gray-700'
              }`}
            >
              {idx + 1}
              {isFlagged && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-400" />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar Navigator (desktop) ── */}
        <aside className="relative hidden md:block md:w-[130px] md:shrink-0 md:overflow-y-auto">
          <div className="flex">
            <div className="absolute inset-y-0 left-0 w-10 bg-white" />
            <div className="relative z-10 mr-2 flex w-10 shrink-0 flex-col py-4">
              {sections.map((section, i) => {
                const pct = section.total > 0 ? (section.answered / section.total) * 100 : 0
                return (
                  <div key={section.name || `sec-${i}`} className="flex flex-col items-center px-2" style={{ flex: section.total }}>
                    {section.name ? (
                      <p className={`mb-1 text-[12px] ${section.name === currentSectionName ? 'font-bold text-black' : 'font-medium text-gray-500'}`}>
                        {section.name.substring(0, 2)}...
                      </p>
                    ) : (
                      <p className="mb-1 text-[12px] text-gray-500">–</p>
                    )}
                    <div className="relative w-2.5 flex-1 overflow-hidden rounded-full bg-[#e2e4e8]">
                      <div className="absolute bottom-0 left-0 w-full rounded-full bg-[#0069b0] transition-all duration-300" style={{ height: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-1 flex-col py-4 pl-1">
              {questions.map((q, idx) => {
                const isActive = idx === currentIndex
                const isAnswered = isAnsweredQ(q)
                const isFlagged = flagged.has(idx)
                const bgColor = idx === currentIndex ? '#0069b0' : isAnswered ? '#0b2c45' : '#0069b0'
                return (
                  <div key={q.id}>
                    <div className="flex items-center pb-2">
                      <button
                        onClick={() => setCurrentIndex(idx)}
                        className="relative flex h-[28px] w-[56px] items-center justify-center rounded text-[13px] font-bold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className="w-full text-center">{idx + 1}</span>
                        {isFlagged && (
                          <svg className="absolute right-[14px] top-1 h-[10px] w-[10px] fill-[#fde047] drop-shadow-sm" viewBox="0 0 24 24">
                            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                          </svg>
                        )}
                      </button>
                      {isActive && (
                        <svg className="h-[14px] w-[10px] shrink-0" viewBox="0 0 10 14" fill={bgColor}>
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
        <div className="flex-1 overflow-y-auto bg-[#eef4f9] p-3 md:p-6">
          <div className="mx-auto w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-4 md:p-6">
              <div className="mb-5 flex flex-col items-center md:mb-6">
                <div className="w-full rounded bg-[#e7f2fc] p-4 md:p-6">
                  {currentQuestion.image_url && (
                    <div className="mb-4 flex justify-center">
                      <img src={currentQuestion.image_url} alt="Soal"
                        className="max-h-56 w-auto max-w-full rounded-lg border border-gray-200 bg-white object-contain" />
                    </div>
                  )}

                  <div className="text-base font-medium text-gray-900 md:text-lg [&_img]:max-w-full [&_img]:mx-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-gray-200 [&_img]:bg-white [&_img]:my-2 [&_p]:my-1" dangerouslySetInnerHTML={{ __html: cleanQuillHtml(currentQuestion.question) }} />
                  {currentQuestion.audio_url && (
                    <QuestionAudio
                      key={currentQuestion.id}
                      src={currentQuestion.audio_url}
                      maxPlays={currentQuestion.audio_max_plays ?? null}
                      plays={audioPlays[currentQuestion.id] ?? 0}
                      attemptId={Number(attemptId)}
                      questionId={currentQuestion.id}
                      onCompleted={count => setAudioPlays(prev => ({ ...prev, [currentQuestion.id]: count }))}
                    />
                  )}
                  {currentQuestion.points > 0 && (
                    <p className="mt-2 text-[11px] font-semibold text-gray-400">{currentQuestion.points} poin</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 md:gap-3">
                {currentQuestion.question_type === 'essay' ? (
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-gray-500">Jawaban Anda</label>
                    <textarea
                      value={essayDrafts[currentQuestion.id] ?? ''}
                      onChange={e => updateEssay(currentQuestion.id, e.target.value)}
                      disabled={isSubmitting}
                      rows={5}
                      placeholder="Tulis jawaban esai Anda di sini..."
                      className="w-full rounded border border-gray-300 bg-white p-3 text-sm leading-relaxed text-gray-800 transition-colors focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-y"
                    />
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-medium text-gray-400">Jawaban tersimpan otomatis · Esai dinilai oleh pengajar</p>
                      <span className="text-[10px] font-semibold text-gray-400">{(essayDrafts[currentQuestion.id] ?? '').length} karakter</span>
                    </div>
                  </div>
                ) : (
                <>
                {currentQuestion.question_type === 'rating' && (
                  <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wide">Skala penilaian 1–{currentQuestion.rating_max || currentQuestion.options.length} — pilih salah satu</p>
                )}
                {currentQuestion.options.map((opt, oi) => {
                  const isSelected = selected[currentQuestion.id] === oi
                  const optLabel = typeof opt === 'string' ? opt : (opt?.text ?? '')
                  const optImg = typeof opt === 'string' ? null : (opt?.image_url || null)
                  const badgeLabel = currentQuestion.question_type === 'rating' ? optLabel : String.fromCharCode(65 + oi)
                  return (
                    <button
                      key={oi}
                      onClick={() => selectAnswer(oi)}
                      disabled={isSaving}
                      className={`flex w-full items-center gap-3 rounded border p-3 text-left transition-colors disabled:opacity-50 md:gap-4 ${
                        isSelected ? (currentQuestion.question_type === 'rating' ? 'border-violet-500 bg-violet-50' : 'border-[#0069b0] bg-[#e7f2fc]') : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isSelected ? (currentQuestion.question_type === 'rating' ? 'bg-violet-500 text-white' : 'bg-[#0069b0] text-white') : 'bg-[#eef4f9] text-gray-600'
                      }`}>
                        {badgeLabel}
                      </span>
                      {optImg && <img src={optImg} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover md:h-16 md:w-16" />}
                      {optLabel && <span className="text-sm text-gray-800 md:text-base">{optLabel}</span>}
                      {isSelected && <span className={`ml-auto ${currentQuestion.question_type === 'rating' ? 'text-violet-500' : 'text-[#0069b0]'}`}>✓</span>}
                    </button>
                  )
                })}
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-2 bg-[#0b2c45] px-3 py-2 md:px-6">
        <button
          onClick={() => toggleFlag(currentIndex)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#0c4a73] transition-colors hover:bg-[#0e5c8f] md:h-9 md:w-10"
          aria-label="Tandai soal"
        >
          <svg className={`h-4 w-4 ${flagged.has(currentIndex) ? 'fill-[#fbd34d]' : 'fill-white'}`} viewBox="0 0 24 24">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="rounded bg-[#0c4a73] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0e5c8f] disabled:opacity-50 md:px-5"
          >
            &lt; Kembali
          </button>

          {!isLast ? (
            <button
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              className="rounded bg-[#0069b0] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00568f] md:px-5"
            >
              Selanjutnya &gt;
            </button>
          ) : (
            <button
              onClick={submitManually}
              disabled={isSubmitting}
              className="rounded bg-[#0069b0] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00568f] disabled:opacity-60"
            >
              {isSubmitting ? 'Mengumpulkan...' : 'Selesai'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}