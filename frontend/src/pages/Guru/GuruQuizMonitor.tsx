import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Camera, CheckCircle2, X, RefreshCw, Pause, Play, ShieldAlert, Users, ListChecks, Timer, CalendarDays,
  ImageIcon, Volume2, Trophy,
} from 'lucide-react'
import { guruQuizApi, APP_URL } from '../../services/api'
import { getEcho, leaveChannel } from '../../services/echo'
import { cleanQuillHtml } from '../../utils/quillHtml'
import Swal from 'sweetalert2'

type OptionEntry = string | { text?: string; image_path?: string | null; image_url?: string | null }

interface MonitorSiswa {
  id: number
  nama: string
  cabang?: string | null
  batch?: string | null
  level?: number | string | null
}

interface MonitorAttempt {
  attempt_id: number
  attempt_number: number
  status: string
  auto_submitted: boolean
  score: number | null
  live_points: number
  max_points: number
  rank: number
  warnings: number
  max_warnings: number
  time_limit_seconds: number
  remaining_seconds: number | null
  started_at: string | null
  submitted_at: string | null
  answered_count: number
  total_count: number
  correct_count: number
  answers_status: string[]
  webcam_photo: string | null
  last_activity: string | null
  siswa: MonitorSiswa
}

interface MonitorDateEntry {
  date: string
  count: number
  is_today: boolean
}

interface MonitorData {
  paket: { id: number; title: string; template: string; time_limit_minutes: number; max_warnings: number; questions_count: number }
  server_time: string
  date: string
  dates: MonitorDateEntry[]
  attempts: MonitorAttempt[]
}

interface DetailQuestion {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: OptionEntry[]
  correct_index: number | null
  correct_indexes?: number[] | null
  keyword: string | null
  points: number
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
  selected_index?: number | null
  selected_indexes?: number[] | null
  answer_text?: string | null
  earned_points?: number | null
  is_correct?: boolean | null
}

interface AttemptDetail {
  attempt: { id: number; attempt_number: number; score?: number | null; correct_count?: number | null; total_count?: number | null; warnings?: number; webcam_photo?: string | null }
  siswa?: { id: number; nama: string } | null
  questions: DetailQuestion[]
}

const optText = (o: OptionEntry) => (typeof o === 'string' ? o : (o?.text ?? ''))
const optAbsUrl = (o: OptionEntry) => {
  const p = typeof o === 'string' ? null : (o?.image_url || o?.image_path || null)
  if (!p) return undefined
  return p.startsWith('http') ? p : `${APP_URL}/storage/${p}`
}

const mediaUrl = (u?: string | null) => {
  if (!u) return undefined
  return u.startsWith('http') ? u : `${APP_URL}/storage/${u}`
}

const fmtClock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

const toDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const fmtDay = (d: string, isToday: boolean) => {
  if (isToday) return 'Hari ini'
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch {
    return d
  }
}

const RANK_CLS: Record<number, string> = {
  1: 'bg-[#fef7e0] border-[#f9ab00] text-[#b06000]',
  2: 'bg-[#f1f3f4] border-[#bdc1c6] text-[#5f6368]',
  3: 'bg-[#fce8e6] border-[#f28b82] text-[#a50e0e]',
}

const STATUS_UI: Record<string, { cls: string; label: string }> = {
  benar: { cls: 'bg-[#188038] border-[#0d652d] text-[#202124]', label: 'Dijawab benar' },
  salah: { cls: 'bg-[#d93025] border-[#a50e0e] text-[#202124]', label: 'Dijawab salah' },
  pending: { cls: 'bg-[#fef7e0] border-[#f9ab00] text-[#b06000]', label: 'Menunggu dinilai' },
  kosong: { cls: 'bg-[#f8f9fa] border-[#dadce0] text-[#80868b]', label: 'Belum dijawab' },
}

export default function GuruQuizMonitor() {
  const { paketId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navTitle = (location.state as { title?: string } | null)?.title

  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [now, setNow] = useState(Date.now())
  const [lastSync, setLastSync] = useState<number | null>(null)

  const todayStr = toDateInput(new Date())
  const urlDateParam = useRef(new URLSearchParams(window.location.search).get('date')).current
  const urlKelasRef = useRef(new URLSearchParams(window.location.search).get('kelas_sensei_id')).current
  const urlKelas = (() => {
    const n = urlKelasRef ? Number(urlKelasRef) : NaN
    return Number.isInteger(n) && n > 0 ? n : undefined
  })()
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const p = new URLSearchParams(window.location.search).get('date')
    return p && /^\d{4}-\d{2}-\d{2}$/.test(p) ? p : todayStr
  })
  const [userPickedDate, setUserPickedDate] = useState(false)
  const isToday = selectedDate === todayStr

  useEffect(() => {
    if (!data || userPickedDate || urlDateParam) return
    const dates = data.dates || []
    if (dates.length === 0) return
    const hasAny = dates.some(d => d.date === selectedDate && d.count > 0)
    if (!hasAny) {
      const pick = dates.find(d => d.date < selectedDate) ?? dates[0]
      if (pick && pick.date !== selectedDate) setSelectedDate(pick.date)
    }
  }, [data, selectedDate, userPickedDate, urlDateParam])

  const [detail, setDetail] = useState<AttemptDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [savingGrade, setSavingGrade] = useState<number | null>(null)

  const fetchingRef = useRef(false)

  const fetchMonitor = useCallback(() => {
    if (!paketId || fetchingRef.current) return
    fetchingRef.current = true
    guruQuizApi.monitor(Number(paketId), selectedDate, urlKelas).then(res => {
      setData(res.data)
      setLastSync(Date.now())
      setFailed(false)
    }).catch(() => {
      setFailed(true)
    }).finally(() => {
      fetchingRef.current = false
      setLoading(false)
    })
  }, [paketId, selectedDate, urlKelas])

  useEffect(() => {
    fetchMonitor()
    const poll = setInterval(() => {
      if (!paused && selectedDate === toDateInput(new Date())) fetchMonitor()
    }, 3000)
    return () => clearInterval(poll)
  }, [fetchMonitor, paused, selectedDate])

  // Realtime push: saat ada snapshot kamera baru dari siswa, segarkan data
  // seketika tanpa menunggu polling berikutnya.
  useEffect(() => {
    if (!paketId) return
    const echo = getEcho()
    if (!echo) return
    const channel = echo.channel(`quiz-monitor.${paketId}`)
    channel.listen('.snapshot.updated', () => {
      if (!paused && selectedDate === toDateInput(new Date())) fetchMonitor()
    })
    return () => leaveChannel(`quiz-monitor.${paketId}`)
  }, [paketId, paused, selectedDate, fetchMonitor])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const openDetail = (attemptId: number) => {
    setShowDetail(true)
    setDetailLoading(true)
    setDetail(null)
    setGrades({})
    guruQuizApi.attemptDetail(attemptId).then(res => {
      setDetail({ attempt: res.data.attempt, questions: res.data.questions || [], siswa: res.data.siswa })
    }).catch(() => {
      setDetail(null)
      Swal.fire({ icon: 'error', title: 'Gagal memuat detail' })
    }).finally(() => setDetailLoading(false))
  }

  const saveGrade = async (qid: number) => {
    if (!detail) return
    const q = detail.questions.find(x => x.id === qid)
    if (!q) return
    const earned = Math.max(0, Math.min(Number(grades[qid] ?? 0) || 0, Number(q.points) || 0))
    setSavingGrade(qid)
    try {
      await guruQuizApi.gradeAttempt(detail.attempt.id, { grades: [{ question_id: qid, earned_points: earned }] })
      setGrades(g => { const n = { ...g }; delete n[qid]; return n })
      setDetailLoading(true)
      const res = await guruQuizApi.attemptDetail(detail.attempt.id)
      setDetail({ attempt: res.data.attempt, questions: res.data.questions || [], siswa: res.data.siswa })
      Swal.fire({ icon: 'success', title: 'Nilai esai tersimpan', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan nilai' })
    } finally {
      setSavingGrade(null)
      setDetailLoading(false)
    }
  }

  const remOf = (a: MonitorAttempt) => (a.status === 'in_progress' && a.started_at
    ? Math.max(0, Math.floor((Date.parse(a.started_at) + a.time_limit_seconds * 1000 - now) / 1000))
    : null)

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '-'
    try {
      return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    } catch {
      return '-'
    }
  }

  const ago = (iso?: string | null) => {
    if (!iso) return null
    const ms = now - Date.parse(iso)
    if (ms < 0) return 'baru saja'
    const m = Math.floor(ms / 60000)
    if (m < 1) return 'baru saja'
    if (m < 60) return `${m} mnt lalu`
    return `${Math.floor(m / 60)} jam lalu`
  }

  const attempts = data?.attempts || []
  const live = attempts.filter(a => a.status === 'in_progress')
  const finished = attempts.filter(a => a.status === 'submitted')
  const warningsTotal = live.reduce((s, a) => s + a.warnings, 0)
  const answeredTotal = live.reduce((s, a) => s + a.answered_count, 0)
  const liveCount = live.length

  const finishedDurations = finished
    .filter(a => a.started_at && a.submitted_at)
    .map(a => Math.max(0, Math.floor((Date.parse(a.submitted_at!) - Date.parse(a.started_at!)) / 1000)))
  const fastest = finishedDurations.length ? Math.min(...finishedDurations) : null

  const topPoints = attempts.length
    ? Math.max(...attempts.map(a => Number(a.live_points) || 0))
    : null
  const maxPointsTotal = attempts.length ? Math.max(...attempts.map(a => Number(a.max_points) || 0)) : 0

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1a73e8]/20 border-t-[#1a73e8] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#5f6368]">Membuka ruang monitoring...</p>
        </div>
      </div>
    )
  }

  if (failed && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa] px-6">
        <div className="text-center">
          <ShieldAlert size={30} className="text-[#d93025] mx-auto mb-2" />
          <p className="text-sm font-medium text-[#202124]">Gagal memuat monitoring</p>
          <p className="text-xs text-[#5f6368] mt-1">Periksa koneksi atau pastikan paket ini milik Anda</p>
          <button onClick={() => { setLoading(true); fetchMonitor() }}
            className="mt-4 text-xs font-medium text-[#1a73e8] hover:underline">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#202124]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 border-b border-[#dadce0] bg-white backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => navigate(-1)}
                className="btn btn-neutral btn-sm w-8 h-8 p-0 shrink-0">
                <ArrowLeft size={15} className="text-[#5f6368]" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-medium text-[#202124] truncate">{navTitle || data?.paket.title || 'Monitoring Quiz'}</h1>
                  <span className={`inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium shrink-0 ${isToday ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isToday && liveCount > 0 ? 'bg-[#d93025] animate-pulse' : 'bg-[#bdc1c6]'}`} />
                    {isToday ? 'LIVE' : 'RIWAYAT'}
                  </span>
                </div>
                <p className="text-xs text-[#5f6368] mt-0.5">
                  {fmtDay(selectedDate, isToday)}
                  {liveCount > 0 ? ` · ${liveCount} kandidat sedang mengerjakan` : ' · tidak ada kandidat aktif'}
                  {lastSync && ` · diperbarui ${ago(new Date(lastSync).toISOString())}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setPaused(p => !p)}
                className={`flex items-center gap-1.5 border border-[#dadce0] bg-white px-3 py-2 text-[11px] font-medium text-[#3c4043] hover:bg-[#f8f9fa] transition-colors`}>
                {paused ? <Play size={13} /> : <Pause size={13} />}
                {paused ? 'Lanjut' : 'Jeda'}
              </button>
              <button onClick={fetchMonitor} disabled={fetchingRef.current}
                className="flex items-center gap-1.5 bg-[#0E6187] px-3 py-2 text-[11px] font-medium text-white hover:bg-[#084c63] transition-colors disabled:opacity-60">
                <RefreshCw size={13} className={fetchingRef.current ? 'animate-spin' : ''} />
                Segarkan
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <div className="border border-[#dadce0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                <Users size={12} className="text-[#80868b] shrink-0" />
                <span className="truncate">Sedang Mengerjakan</span>
              </div>
              <p className="text-xl font-medium text-[#202124] leading-none mt-2 tabular-nums">{liveCount}</p>
            </div>
            <div className="border border-[#dadce0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                <CheckCircle2 size={12} className="text-[#80868b] shrink-0" />
                <span className="truncate">Sudah Kumpul</span>
              </div>
              <p className="text-xl font-medium text-[#202124] leading-none mt-2 tabular-nums">{finished.length}</p>
            </div>
            <div className="border border-[#dadce0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                <ShieldAlert size={12} className="text-[#80868b] shrink-0" />
                <span className="truncate">Total Peringatan</span>
              </div>
              <p className={`text-xl font-medium leading-none mt-2 tabular-nums ${warningsTotal > 0 ? 'text-[#d93025]' : 'text-[#202124]'}`}>{warningsTotal}</p>
            </div>
            <div className="border border-[#dadce0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                <ListChecks size={12} className="text-[#80868b] shrink-0" />
                <span className="truncate">Soal Terjawab</span>
              </div>
              <p className="text-xl font-medium text-[#202124] leading-none mt-2 tabular-nums">{answeredTotal}/{live.reduce((s, a) => s + a.total_count, 0)}</p>
            </div>
            <div className="border border-[#dadce0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                <Trophy size={12} className="text-[#e37400] shrink-0" />
                <span className="truncate">Poin Tertinggi</span>
              </div>
              <p className="text-xl font-medium text-[#b06000] leading-none mt-2 tabular-nums">
                {topPoints !== null ? `${topPoints}/${maxPointsTotal || '--'}` : '--/--'}
              </p>
            </div>
            <div className="border border-[#dadce0] bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                <Timer size={12} className="text-[#80868b] shrink-0" />
                <span className="truncate">Waktu Tercepat</span>
              </div>
              <p className="text-xl font-medium text-[#202124] leading-none mt-2 tabular-nums">{fastest !== null ? fmtClock(fastest) : '--:--'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Pilih hari */}
        <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368] mr-1">
            <CalendarDays size={12} /> Hari:
          </span>
          {(data?.dates || []).map(dt => (
            <button key={dt.date} onClick={() => { setUserPickedDate(true); setSelectedDate(dt.date) }}
              className={`inline-flex items-center gap-1.5 border border-[#dadce0] px-2.5 py-1.5 text-[10px] font-medium transition-colors ${
                selectedDate === dt.date
                  ? 'bg-[#0E6187] text-white'
                  : 'border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]'
              }`}>
              {fmtDay(dt.date, dt.is_today)}
              <span className={selectedDate === dt.date ? 'text-white/80' : 'text-[#80868b]'}>({dt.count})</span>
            </button>
          ))}
          <input type="date" value={selectedDate} max={todayStr}
            onChange={e => { if (!e.target.value) return; setUserPickedDate(true); setSelectedDate(e.target.value) }}
            className="ml-auto border border-[#dadce0] bg-white text-[#3c4043] text-xs px-2 py-1.5 focus:outline-none focus:border-[#1a73e8]"
            title="Pilih tanggal lain" />
        </div>

        {attempts.length === 0 ? (
          <div className="border border-dashed border-[#dadce0] bg-white p-12 text-center">
            <CheckCircle2 size={28} className="text-[#80868b] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#202124]">Belum ada kandidat mengerjakan pada {fmtDay(selectedDate, isToday).toLowerCase()}</p>
            <p className="text-xs text-[#5f6368] mt-1">
              {(data?.dates || []).length > 0
                ? 'History pengerjaan ada di hari lain — pilih chip Hari di atas.'
                : 'Kandidat yang mulai mengerjakan quiz ini pada hari tersebut akan muncul di sini.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {attempts.map(a => {
                const remaining = remOf(a)
                const lowTime = remaining !== null && remaining <= 60
                const stale = a.status === 'in_progress' && a.last_activity
                  ? (now - Date.parse(a.last_activity)) > 90 * 1000
                  : false
                const isLive = a.status === 'in_progress'
                const statuses = Array.from({ length: a.total_count }, (_, i) => a.answers_status[i] || 'kosong')
                return (
                  <div key={a.attempt_id} onClick={() => openDetail(a.attempt_id)}
                    className="border border-[#dadce0] bg-white p-3.5 cursor-pointer active:bg-[#f8f9fa] transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex w-7 h-7 items-center justify-center border text-xs font-medium tabular-nums shrink-0 ${RANK_CLS[a.rank] ?? 'bg-[#f1f3f4] border-[#dadce0] text-[#5f6368]'}`}>{a.rank}</span>
                        <p className="text-[13px] font-medium text-[#202124] truncate">{a.siswa.nama}</p>
                        <span className={`shrink-0 text-[10px] font-medium tabular-nums ${a.rank === 1 ? 'text-[#b06000]' : 'text-[#5f6368]'}`}>
                          {Number(a.live_points) || 0} poin
                        </span>
                      </div>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-medium text-[#1967d2] shrink-0">
                          <span className="h-1 w-1 rounded-full bg-[#0E6187] animate-pulse" />LAKUKAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368] shrink-0">
                          <CheckCircle2 size={9} />KUMPUL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#80868b] mt-1">
                      {[a.siswa.batch && `Batch ${a.siswa.batch}`, a.siswa.level !== null && a.siswa.level !== undefined && `Level ${a.siswa.level}`].filter(Boolean).join(' · ') || '-'}
                      {isLive ? ` · ${a.answered_count}/${a.total_count} terjawab${a.auto_submitted ? ' · auto' : ''}` : ` · ${Number(a.score) || 0} poin${a.auto_submitted ? ' · auto' : ''}`}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {statuses.map((s, i) => {
                        const ui = STATUS_UI[s] || STATUS_UI.kosong
                        return (
                          <span key={i} title={`Soal ${i + 1} — ${ui.label}`}
                            className={`h-6 w-6 border flex items-center justify-center text-[10px] font-medium ${ui.cls}`}>
                            {i + 1}
                          </span>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2.5">
                      <div className="flex items-center gap-2 text-xs font-medium min-w-0">
                        <span className="text-[#5f6368] whitespace-nowrap">{a.correct_count}/{a.total_count} benar</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 font-medium whitespace-nowrap ${a.warnings >= a.max_warnings ? 'bg-[#d93025]/15 text-[#d93025]' : a.warnings > 0 ? 'bg-#e37400/15 text-[#e37400]' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                          <ShieldAlert size={10} /> {a.warnings}/{a.max_warnings}
                        </span>
                      </div>
                      {isLive ? (
                        <span className={`text-xs font-medium text-right whitespace-nowrap ${lowTime ? 'text-[#d93025]' : 'text-[#5f6368]'}`}>
                          {remaining !== null ? `${fmtClock(remaining)} tersisa` : '0:00 tersisa'}
                        </span>
                      ) : (
                        <span className="text-xs text-[#80868b] text-right whitespace-nowrap">
                          selesai {fmtDate(a.submitted_at)}
                        </span>
                      )}
                    </div>
                    {stale && (
                      <p className="text-[10px] font-medium text-[#e37400] mt-1.5">Tidak aktif</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block border border-[#dadce0] bg-white overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-[#e8eaed] text-xs font-medium text-[#5f6368]">
                    <th className="px-3 py-2.5 whitespace-nowrap">Peringkat</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Kandidat</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Jawaban per Soal</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-center">Benar</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-center">Poin</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-center">Peringatan</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(a => {
                    const remaining = remOf(a)
                    const lowTime = remaining !== null && remaining <= 60
                    const stale = a.status === 'in_progress' && a.last_activity
                      ? (now - Date.parse(a.last_activity)) > 90 * 1000
                      : false
                    const statuses = Array.from({ length: a.total_count }, (_, i) => a.answers_status[i] || 'kosong')
                    return (
                      <tr key={a.attempt_id} onClick={() => openDetail(a.attempt_id)}
                        className="border-b border-[#e8eaed] last:border-0 cursor-pointer transition-colors hover:bg-[#f8f9fa]">
                        <td className="px-3 py-3 align-top">
                          <span className={`inline-flex w-7 h-7 items-center justify-center   border text-xs font-medium tabular-nums ${RANK_CLS[a.rank] ?? 'bg-[#f1f3f4] border-[#dadce0] text-[#5f6368]'}`}>
                            {a.rank}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium text-[#202124] leading-tight">{a.siswa.nama}</p>
                            {a.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1 bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-medium text-[#1967d2] shrink-0">
                                <span className="h-1 w-1 rounded-full bg-[#0E6187] animate-pulse" />LAKUKAN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368] shrink-0">
                                <CheckCircle2 size={9} />KUMPUL
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#80868b] font-medium mt-0.5">
                            {[a.siswa.batch && `Batch ${a.siswa.batch}`, a.siswa.level !== null && a.siswa.level !== undefined && `Level ${a.siswa.level}`].filter(Boolean).join(' · ') || '-'}
                          </p>
                          <p className="text-[10px] text-[#80868b] mt-1">
                            {a.status === 'in_progress'
                              ? `${a.answered_count}/${a.total_count} terjawab${a.auto_submitted ? ' · auto' : ''}`
                              : `${Number(a.score) || 0} poin${a.auto_submitted ? ' · auto' : ''}`}
                          </p>
                          {stale && (
                            <p className="text-[10px] font-medium text-[#e37400] mt-0.5">Tidak aktif</p>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[520px]">
                            {statuses.map((s, i) => {
                              const ui = STATUS_UI[s] || STATUS_UI.kosong
                              return (
                                <span key={i} title={`Soal ${i + 1} — ${ui.label}`}
                                  className={`h-6 w-6 border flex items-center justify-center text-[10px] font-medium ${ui.cls}`}>
                                  {i + 1}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                          <p className="text-[13px] font-medium text-[#202124]">{a.correct_count}/{a.total_count}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                          <p className={`text-[13px] font-medium tabular-nums ${a.rank === 1 ? 'text-[#b06000]' : 'text-[#202124]'}`}>
                            {Number(a.live_points) || 0}
                            <span className="text-[10px] text-[#80868b] font-normal">/{Number(a.max_points) || 0}</span>
                          </p>
                        </td>
                        <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 ${a.warnings >= a.max_warnings ? 'bg-[#d93025]/15 text-[#d93025]' : a.warnings > 0 ? 'bg-#e37400/15 text-[#e37400]' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                            <ShieldAlert size={10} /> {a.warnings}/{a.max_warnings}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top whitespace-nowrap">
                          {a.status === 'in_progress' ? (
                            <span className={`text-xs font-medium ${lowTime ? 'text-[#d93025]' : 'text-[#5f6368]'}`}>
                              {remaining !== null ? `${fmtClock(remaining)} tersisa` : '0:00 tersisa'}
                            </span>
                          ) : (
                            <span className="text-xs text-[#80868b]">
                              selesai {fmtDate(a.submitted_at)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border border-[#dadce0] bg-white px-3 py-2.5">
              {Object.entries(STATUS_UI).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
                  <span className={`h-3.5 w-3.5 border ${v.cls}`} />
                  {v.label}
                </span>
              ))}
              <span className="text-xs text-[#80868b] md:ml-auto">Klik untuk melihat detail & menilai esai</span>
            </div>
          </>
        )}
      </div>

      {/* ── Detail modal ── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e8eaed] sticky top-0 bg-white">
              <div>
                <h2 className="text-base font-medium text-[#202124]">Detail Pengerjaan</h2>
                <p className="text-[10px] text-[#80868b] font-medium">{detail?.siswa?.nama || 'Kandidat'} · Percobaan #{detail?.attempt?.attempt_number}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="btn btn-neutral btn-sm w-8 h-8 p-0 shrink-0">
                <X size={15} className="text-[#3c4043]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {detailLoading || !detail ? (
                <div className="text-center text-xs text-[#80868b] py-12">Memuat detail...</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#f1f3f4] p-3 text-center">
                      <p className="text-xl font-medium text-[#202124]">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-[10px] text-[#80868b] font-semibold">Skor</p>
                    </div>
                    <div className="bg-[#f1f3f4] p-3 text-center">
                      <p className="text-xl font-medium text-[#202124]">{detail.attempt.correct_count}/{detail.attempt.total_count}</p>
                      <p className="text-[10px] text-[#80868b] font-semibold">Jawaban Benar</p>
                    </div>
                    <div className="bg-[#f1f3f4] p-3 text-center">
                      <p className="text-xl font-medium text-[#202124]">{detail.attempt.warnings}</p>
                      <p className="text-[10px] text-[#80868b] font-semibold">Peringatan</p>
                    </div>
                  </div>

                  {detail.attempt.webcam_photo && (
                    <div>
                      <p className="text-[11px] font-medium text-[#3c4043] mb-2 flex items-center gap-1.5"><Camera size={12} /> Foto Pengerjaan</p>
                      <img src={detail.attempt.webcam_photo ?? undefined} alt="Webcam" className="w-full border border-[#e8eaed] max-h-52 object-cover" />
                    </div>
                  )}

                  <div className="space-y-3">
                    {detail.questions.map((q, i) => (
                      <div key={q.id} className="border border-[#e8eaed] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[12px] font-medium text-[#202124] leading-snug min-w-0"><span className="font-medium">{i + 1}.</span>{' '}<span className="[&_p]:my-0.5 [&_h1]:text-[12px] [&_h2]:text-[12px] [&_h3]:text-[12px] [&_h4]:text-[12px] [&_h1]:font-medium [&_h2]:font-medium [&_h3]:font-medium [&_h4]:font-medium [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 [&_img]:max-h-40 [&_img]:rounded [&_img]:my-1.5 [&_img]:border [&_img]:border-[#e8eaed] inline-block" dangerouslySetInnerHTML={{ __html: cleanQuillHtml(q.question) }} /></div>
                          <span className={`text-[10px] font-medium shrink-0 px-2 py-0.5 rounded-full ${q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'bg-[#fef7e0] text-[#e37400]' : q.is_correct === true ? 'bg-[#e6f4ea] text-[#137333]' : q.is_correct === false ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                            {q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'BELUM DINILAI' : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'}
                          </span>
                        </div>
                        {(q.image_url || q.audio_url) && (
                          <div className="mt-2 space-y-2">
                            {q.image_url && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1a73e8] mb-1"><ImageIcon size={10} /> Soal Gambar</span>
                                <img src={mediaUrl(q.image_url)} alt="Gambar soal" className="w-full max-h-44 object-contain border border-[#e8eaed] bg-[#f1f3f4]" />
                              </div>
                            )}
                            {q.audio_url && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1a73e8] mb-1"><Volume2 size={10} /> Soal Suara</span>
                                <audio src={mediaUrl(q.audio_url)} controls className="w-full h-9" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="mt-2 space-y-1.5">
                          {q.question_type === 'rating' ? (
                            <div>
                              <div className="flex gap-1 flex-wrap">
                                {q.options.map((opt, oi) => {
                                  const isSelected = q.selected_index === oi
                                  return (
                                    <span key={oi} className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-medium border-2 ${isSelected ? 'border-#8430ce bg-#8430ce text-[#202124]' : 'border-[#e8eaed] bg-[#f1f3f4] text-[#80868b]'}`}>
                                      {optText(opt)}
                                    </span>
                                  )
                                })}
                              </div>
                              <p className="text-[10px] text-[#80868b] font-medium mt-1.5">
                                Jawaban: <span className="font-medium text-[#8430ce]">{q.selected_index !== null && q.selected_index !== undefined ? optText(q.options[q.selected_index]) : 'Tidak diisi'}</span>
                                {q.is_correct === true && <span className="ml-2 text-[10px] font-medium text-[#7627bb]">TERISI · POIN DIBERIKAN</span>}
                              </p>
                            </div>
                          ) : q.question_type === 'essay' ? (
                            <div>
                              <div className="text-[10px] font-medium text-[#3c4043] mb-1.5">Jawaban Siswa</div>
                              <p className="text-[11px] text-[#202124] bg-[#f1f3f4] border border-[#e8eaed] px-3 py-2.5 whitespace-pre-wrap min-h-[44px]">
                                {q.answer_text?.trim() ? q.answer_text : <span className="text-[#80868b]">Tidak diisi</span>}
                              </p>
                              {q.keyword && (
                                <p className="text-[10px] text-[#e37400] font-medium mt-1.5"><span className="font-medium text-[#b06000]">Kata kunci:</span> {q.keyword}</p>
                              )}
                              {q.answer_text?.trim() && (
                                <div className="flex items-center gap-2 mt-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#3c4043] block mb-1">Nilai (0–{q.points})</label>
                                    <input type="number" min={0} max={q.points}
                                      value={grades[q.id] ?? ''}
                                      onChange={e => setGrades(g => ({ ...g, [q.id]: e.target.value }))}
                                      className="w-24 text-xs border border-[#e8eaed] px-3 py-2 focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/10"
                                      placeholder="-" />
                                  </div>
                                  <button type="button" disabled={savingGrade !== null || !grades[q.id]?.trim()}
                                    onClick={() => saveGrade(q.id)}
                                    className="btn btn-primary btn-sm disabled:opacity-40">
                                    {savingGrade === q.id ? 'Menyimpan...' : 'Simpan Nilai'}
                                  </button>
                                  {q.earned_points !== null && q.earned_points !== undefined && (
                                    <span className={`self-end text-[11px] font-medium px-2 py-1 rounded-full ${q.is_correct === true ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fef7e0] text-[#e37400]'}`}>
                                      {q.earned_points}/{q.points} poin
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (q.options.map((opt, oi) => {
                            const isMultiQ = q.question_type === 'multi'
                            const correctSet = new Set((q.correct_indexes || []).map(Number))
                            const selectedSet = new Set((q.selected_indexes || []).map(Number))
                            const isCorrect = isMultiQ ? correctSet.has(oi) : (q.correct_index === oi)
                            const isSelected = isMultiQ ? selectedSet.has(oi) : (q.selected_index === oi)
                            return (
                              <div key={oi}
                                className={`flex items-center gap-2 text-[11px] px-3 py-1.5 font-medium ${isCorrect ? 'bg-[#e6f4ea] text-[#0d652d]' : isSelected ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#f1f3f4] text-[#3c4043]'}`}>
                                <span className={`w-4 h-4 flex items-center justify-center text-[10px] font-medium shrink-0 ${isMultiQ ? ' ' : 'rounded-full'} ${isCorrect ? 'bg-#188038 text-[#202124]' : isSelected ? 'bg-[#d93025] text-[#202124]' : 'bg-[#e8eaed] text-[#80868b]'}`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                {optAbsUrl(opt) && <img src={optAbsUrl(opt)} className="h-5 w-5 object-cover shrink-0" alt="" />}
                                <span className="flex-1">{optText(opt)}</span>
                                {isCorrect && <span className="text-[10px] font-medium shrink-0">KUNCI</span>}
                                {isSelected && <span className="text-[10px] font-medium shrink-0">JAWABAN</span>}
                              </div>
                            )
                          }))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}