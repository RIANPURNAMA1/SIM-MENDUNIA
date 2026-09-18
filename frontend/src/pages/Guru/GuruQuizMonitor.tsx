import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Camera, CheckCircle2, X, RefreshCw, Pause, Play, ShieldAlert, Users, ListChecks, Timer, CalendarDays,
  ImageIcon, Volume2,
} from 'lucide-react'
import { guruQuizApi, APP_URL } from '../../services/api'
import { getEcho, leaveChannel } from '../../services/echo'
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
  keyword: string | null
  points: number
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
  selected_index?: number | null
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

const STATUS_UI: Record<string, { cls: string; label: string }> = {
  benar: { cls: 'bg-emerald-500 border-emerald-400 text-white', label: 'Dijawab benar' },
  salah: { cls: 'bg-red-500 border-red-400 text-white', label: 'Dijawab salah' },
  pending: { cls: 'bg-amber-500 border-amber-400 text-white', label: 'Menunggu dinilai' },
  kosong: { cls: 'bg-white/[0.06] border-white/10 text-slate-500', label: 'Belum dijawab' },
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0E6187]/20 border-t-[#0E6187] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Membuka ruang monitoring...</p>
        </div>
      </div>
    )
  }

  if (failed && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1115] px-6">
        <div className="text-center">
          <ShieldAlert size={30} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">Gagal memuat monitoring</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Periksa koneksi atau pastikan paket ini milik Anda</p>
          <button onClick={() => { setLoading(true); fetchMonitor() }}
            className="mt-4 text-xs font-bold text-[#6fb3d8] hover:underline">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[#16181d]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                <ArrowLeft size={15} className="text-slate-300" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-white truncate">{navTitle || data?.paket.title || 'Monitoring Quiz'}</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${isToday ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-slate-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isToday && liveCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                    {isToday ? 'LIVE' : 'RIWAYAT'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {fmtDay(selectedDate, isToday)}
                  {liveCount > 0 ? ` · ${liveCount} kandidat sedang mengerjakan` : ' · tidak ada kandidat aktif'}
                  {lastSync && ` · diperbarui ${ago(new Date(lastSync).toISOString())}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setPaused(p => !p)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${paused ? 'bg-[#0E6187]/20 text-[#7ec3e4]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {paused ? <Play size={13} /> : <Pause size={13} />}
                {paused ? 'Lanjut' : 'Jeda'}
              </button>
              <button onClick={fetchMonitor} disabled={fetchingRef.current}
                className="flex items-center gap-1.5 rounded-lg bg-[#0E6187] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#0a4d6b] transition-colors disabled:opacity-60">
                <RefreshCw size={13} className={fetchingRef.current ? 'animate-spin' : ''} />
                Segarkan
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-lg bg-[#16181d] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <Users size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">Sedang Mengerjakan</span>
              </div>
              <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{liveCount}</p>
            </div>
            <div className="rounded-lg bg-[#16181d] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <CheckCircle2 size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">Sudah Kumpul</span>
              </div>
              <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{finished.length}</p>
            </div>
            <div className="rounded-lg bg-[#16181d] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <ShieldAlert size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">Total Peringatan</span>
              </div>
              <p className={`text-lg font-bold leading-none mt-2 tabular-nums ${warningsTotal > 0 ? 'text-red-400' : 'text-white'}`}>{warningsTotal}</p>
            </div>
            <div className="rounded-lg bg-[#16181d] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <ListChecks size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">Soal Terjawab</span>
              </div>
              <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{answeredTotal}/{live.reduce((s, a) => s + a.total_count, 0)}</p>
            </div>
            <div className="rounded-lg bg-[#16181d] border border-white/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                <Timer size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">Waktu Tercepat</span>
              </div>
              <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{fastest !== null ? fmtClock(fastest) : '--:--'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Pilih hari */}
        <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mr-1">
            <CalendarDays size={12} /> Hari:
          </span>
          {(data?.dates || []).map(dt => (
            <button key={dt.date} onClick={() => { setUserPickedDate(true); setSelectedDate(dt.date) }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                selectedDate === dt.date
                  ? 'bg-[#0E6187] text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}>
              {fmtDay(dt.date, dt.is_today)}
              <span className={selectedDate === dt.date ? 'text-white/70' : 'text-slate-500'}>({dt.count})</span>
            </button>
          ))}
          <input type="date" value={selectedDate} max={todayStr}
            onChange={e => { if (!e.target.value) return; setUserPickedDate(true); setSelectedDate(e.target.value) }}
            className="ml-auto bg-white/5 border border-white/10 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0E6187]"
            style={{ colorScheme: 'dark' }}
            title="Pilih tanggal lain" />
        </div>

        {attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <CheckCircle2 size={28} className="text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-200">Belum ada kandidat mengerjakan pada {fmtDay(selectedDate, isToday).toLowerCase()}</p>
            <p className="text-xs text-slate-500 font-medium mt-1">
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
                    className="rounded-lg border border-white/10 bg-[#16181d] p-3.5 cursor-pointer active:bg-[#0E6187]/10 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300 shrink-0">#{a.attempt_number}</span>
                        <p className="text-[12px] font-bold text-white truncate">{a.siswa.nama}</p>
                      </div>
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#0E6187]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#7ec3e4] shrink-0">
                          <span className="h-1 w-1 rounded-full bg-[#7ec3e4] animate-pulse" />LAKUKAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-slate-300 shrink-0">
                          <CheckCircle2 size={9} />KUMPUL
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      {[a.siswa.batch && `Batch ${a.siswa.batch}`, a.siswa.level !== null && a.siswa.level !== undefined && `Level ${a.siswa.level}`].filter(Boolean).join(' · ') || '-'}
                      {isLive ? ` · ${a.answered_count}/${a.total_count} terjawab${a.auto_submitted ? ' · auto' : ''}` : ` · ${Number(a.score) || 0} poin${a.auto_submitted ? ' · auto' : ''}`}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {statuses.map((s, i) => {
                        const ui = STATUS_UI[s] || STATUS_UI.kosong
                        return (
                          <span key={i} title={`Soal ${i + 1} — ${ui.label}`}
                            className={`h-6 w-6 rounded-md border flex items-center justify-center text-[9px] font-bold ${ui.cls}`}>
                            {i + 1}
                          </span>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold min-w-0">
                        <span className="text-slate-300 whitespace-nowrap">{a.correct_count}/{a.total_count} benar</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md whitespace-nowrap ${a.warnings >= a.max_warnings ? 'bg-red-500/15 text-red-400' : a.warnings > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-slate-500'}`}>
                          <ShieldAlert size={10} /> {a.warnings}/{a.max_warnings}
                        </span>
                      </div>
                      {isLive ? (
                        <span className={`text-[11px] font-bold text-right whitespace-nowrap ${lowTime ? 'text-red-400' : 'text-slate-300'}`}>
                          {remaining !== null ? `${fmtClock(remaining)} tersisa` : '0:00 tersisa'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium text-right whitespace-nowrap">
                          selesai {fmtDate(a.submitted_at)}
                        </span>
                      )}
                    </div>
                    {stale && (
                      <p className="text-[9.5px] font-bold text-amber-400 mt-1.5">Tidak aktif</p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block rounded-md border border-white/10 bg-[#16181d] overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-2.5 whitespace-nowrap">No</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Kandidat</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Jawaban per Soal</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-center">Benar</th>
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
                        className="border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-[#0E6187]/10">
                        <td className="px-3 py-3 align-top">
                          <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300">
                            {a.attempt_number}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-bold text-white leading-tight">{a.siswa.nama}</p>
                            {a.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#0E6187]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#7ec3e4] shrink-0">
                                <span className="h-1 w-1 rounded-full bg-[#7ec3e4] animate-pulse" />LAKUKAN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-slate-300 shrink-0">
                                <CheckCircle2 size={9} />KUMPUL
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {[a.siswa.batch && `Batch ${a.siswa.batch}`, a.siswa.level !== null && a.siswa.level !== undefined && `Level ${a.siswa.level}`].filter(Boolean).join(' · ') || '-'}
                          </p>
                          <p className="text-[9.5px] text-slate-500 font-medium mt-1">
                            {a.status === 'in_progress'
                              ? `${a.answered_count}/${a.total_count} terjawab${a.auto_submitted ? ' · auto' : ''}`
                              : `${Number(a.score) || 0} poin${a.auto_submitted ? ' · auto' : ''}`}
                          </p>
                          {stale && (
                            <p className="text-[9.5px] font-bold text-amber-400 mt-0.5">Tidak aktif</p>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-1 max-w-[520px]">
                            {statuses.map((s, i) => {
                              const ui = STATUS_UI[s] || STATUS_UI.kosong
                              return (
                                <span key={i} title={`Soal ${i + 1} — ${ui.label}`}
                                  className={`h-6 w-6 rounded-md border flex items-center justify-center text-[9px] font-bold ${ui.cls}`}>
                                  {i + 1}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                          <p className="text-[12px] font-bold text-slate-200">{a.correct_count}/{a.total_count}</p>
                        </td>
                        <td className="px-3 py-3 align-top text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${a.warnings >= a.max_warnings ? 'bg-red-500/15 text-red-400' : a.warnings > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-slate-500'}`}>
                            <ShieldAlert size={10} /> {a.warnings}/{a.max_warnings}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top whitespace-nowrap">
                          {a.status === 'in_progress' ? (
                            <span className={`text-[11px] font-bold ${lowTime ? 'text-red-400' : 'text-slate-300'}`}>
                              {remaining !== null ? `${fmtClock(remaining)} tersisa` : '0:00 tersisa'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
              {Object.entries(STATUS_UI).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className={`h-3.5 w-3.5 rounded-md border ${v.cls}`} />
                  {v.label}
                </span>
              ))}
              <span className="text-[10px] text-slate-500 font-medium md:ml-auto">Klik untuk melihat detail & menilai esai</span>
            </div>
          </>
        )}
      </div>

      {/* ── Detail modal ── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Detail Pengerjaan</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">{detail?.siswa?.nama || 'Kandidat'} · Percobaan #{detail?.attempt?.attempt_number}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {detailLoading || !detail ? (
                <div className="text-center text-xs text-[#8B90A0] py-12">Memuat detail...</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#F4F5F8] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Skor</p>
                    </div>
                    <div className="bg-[#F4F5F8] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{detail.attempt.correct_count}/{detail.attempt.total_count}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Jawaban Benar</p>
                    </div>
                    <div className="bg-[#F4F5F8] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{detail.attempt.warnings}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Peringatan</p>
                    </div>
                  </div>

                  {detail.attempt.webcam_photo && (
                    <div>
                      <p className="text-[11px] font-bold text-[#4B5063] mb-2 flex items-center gap-1.5"><Camera size={12} /> Foto Pengerjaan</p>
                      <img src={detail.attempt.webcam_photo ?? undefined} alt="Webcam" className="w-full rounded-xl border border-[#E5E7EF] max-h-52 object-cover" />
                    </div>
                  )}

                  <div className="space-y-3">
                    {detail.questions.map((q, i) => (
                      <div key={q.id} className="border border-[#E5E7EF] rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] font-bold text-[#14182B] leading-snug">{i + 1}. {q.question}</p>
                          <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'bg-amber-50 text-amber-600' : q.is_correct === true ? 'bg-emerald-50 text-emerald-600' : q.is_correct === false ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-[#8B90A0]'}`}>
                            {q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'BELUM DINILAI' : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'}
                          </span>
                        </div>
                        {(q.image_url || q.audio_url) && (
                          <div className="mt-2 space-y-2">
                            {q.image_url && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0069b0] uppercase tracking-wide mb-1"><ImageIcon size={10} /> Soal Gambar</span>
                                <img src={mediaUrl(q.image_url)} alt="Gambar soal" className="w-full max-h-44 object-contain rounded-lg border border-[#E5E7EF] bg-[#F4F5F8]" />
                              </div>
                            )}
                            {q.audio_url && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0069b0] uppercase tracking-wide mb-1"><Volume2 size={10} /> Soal Suara</span>
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
                                    <span key={oi} className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold border-2 ${isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-[#E5E7EF] bg-[#F4F5F8] text-[#8B90A0]'}`}>
                                      {optText(opt)}
                                    </span>
                                  )
                                })}
                              </div>
                              <p className="text-[10px] text-[#8B90A0] font-medium mt-1.5">
                                Jawaban: <span className="font-bold text-violet-600">{q.selected_index !== null && q.selected_index !== undefined ? optText(q.options[q.selected_index]) : 'Tidak diisi'}</span>
                                {q.is_correct === true && <span className="ml-2 text-[9px] font-bold text-violet-500">TERISI · POIN DIBERIKAN</span>}
                              </p>
                            </div>
                          ) : q.question_type === 'essay' ? (
                            <div>
                              <div className="text-[10px] font-bold text-[#4B5063] mb-1.5">Jawaban Siswa</div>
                              <p className="text-[11px] text-[#14182B] bg-[#F4F5F8] border border-[#E5E7EF] rounded-lg px-3 py-2.5 whitespace-pre-wrap min-h-[44px]">
                                {q.answer_text?.trim() ? q.answer_text : <span className="text-[#8B90A0]">Tidak diisi</span>}
                              </p>
                              {q.keyword && (
                                <p className="text-[10px] text-amber-600 font-medium mt-1.5"><span className="font-bold">Kata kunci:</span> {q.keyword}</p>
                              )}
                              {q.answer_text?.trim() && (
                                <div className="flex items-center gap-2 mt-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#4B5063] block mb-1">Nilai (0–{q.points})</label>
                                    <input type="number" min={0} max={q.points}
                                      value={grades[q.id] ?? ''}
                                      onChange={e => setGrades(g => ({ ...g, [q.id]: e.target.value }))}
                                      className="w-24 text-xs border border-[#E5E7EF] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10"
                                      placeholder="-" />
                                  </div>
                                  <button type="button" disabled={savingGrade !== null || !grades[q.id]?.trim()}
                                    onClick={() => saveGrade(q.id)}
                                    className="self-end text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-2 rounded-lg disabled:opacity-40 hover:bg-[#004d7a]">
                                    {savingGrade === q.id ? 'Menyimpan...' : 'Simpan Nilai'}
                                  </button>
                                  {q.earned_points !== null && q.earned_points !== undefined && (
                                    <span className={`self-end text-[11px] font-bold px-2 py-1 rounded-full ${q.is_correct === true ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {q.earned_points}/{q.points} poin
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (q.options.map((opt, oi) => {
                            const isCorrect = q.correct_index === oi
                            const isSelected = q.selected_index === oi
                            return (
                              <div key={oi}
                                className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg font-medium ${isCorrect ? 'bg-emerald-50 text-emerald-700 font-bold' : isSelected ? 'bg-red-50 text-red-500 font-bold' : 'bg-[#F4F5F8] text-[#4B5063]'}`}>
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-[#E5E7EF] text-[#8B90A0]'}`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                {optAbsUrl(opt) && <img src={optAbsUrl(opt)} className="h-5 w-5 rounded-md object-cover shrink-0" alt="" />}
                                <span className="flex-1">{optText(opt)}</span>
                                {isCorrect && <span className="text-[9px] font-bold shrink-0">KUNCI</span>}
                                {isSelected && <span className="text-[9px] font-bold shrink-0">JAWABAN</span>}
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