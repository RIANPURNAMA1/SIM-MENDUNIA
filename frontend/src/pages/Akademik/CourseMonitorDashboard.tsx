import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Activity, RefreshCw, Pause, Play, ShieldAlert, Users,
  CheckCircle2, ListChecks, CalendarDays, Radio, Layers, ChevronRight, Clock,
} from 'lucide-react'
import { adminQuizApi } from '../../services/api'

interface OverviewPaket {
  id: number
  title: string
  template: string
  status: string
  time_limit_minutes: number
  questions_count: number
  max_attempts: number
  live_count: number
  submitted_count: number
  warning_total: number
}

interface OverviewLesson {
  id: number
  pertemuan_ke: number
  title: string
  status: string
  tanggal: string | null
  paket_count: number
  live_count: number
  submitted_count: number
  warning_total: number
  pakets: OverviewPaket[]
}

interface OverviewData {
  course: {
    id: number
    title: string
    level: string | number | null
    batch_name: string | null
    lesson_total: number
  }
  totals: {
    lesson_with_quiz: number
    paket_count: number
    live_total: number
    submitted_total: number
    warning_total: number
  }
  lessons: OverviewLesson[]
  orphan_pakets: OverviewPaket[]
  server_time: string
  date: string
}

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtTanggal(v: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const CARD_CLS = 'rounded-lg bg-[#16181d] border border-white/10'

export default function CourseMonitorDashboard() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => toDateInput(new Date()))
  const [lastSync, setLastSync] = useState<number | null>(null)

  const fetchingRef = useRef(false)

  const fetchOverview = useCallback(() => {
    if (!courseId || fetchingRef.current) return
    fetchingRef.current = true
    adminQuizApi.courseMonitorOverview(Number(courseId), { date: selectedDate })
      .then(res => {
        setData(res.data)
        setLastSync(Date.now())
        setFailed(false)
      })
      .catch(() => setFailed(true))
      .finally(() => {
        fetchingRef.current = false
        setLoading(false)
      })
  }, [courseId, selectedDate])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    if (paused) return
    const poll = setInterval(fetchOverview, 5000)
    return () => clearInterval(poll)
  }, [fetchOverview, paused])

  const todayStr = toDateInput(new Date())
  const isToday = selectedDate === todayStr

  const lessons = useMemo(() => data?.lessons || [], [data])
  const liveLessons = useMemo(
    () => lessons.filter(l => l.live_count > 0).sort((a, b) => b.live_count - a.live_count),
    [lessons],
  )
  const idleLessons = useMemo(
    () => lessons.filter(l => l.live_count === 0),
    [lessons],
  )

  const openMonitor = (paketId: number, title: string, pertemuanKe: number) => {
    navigate(`${location.pathname}/live?paket=${paketId}`, {
      state: { title, pertemuan_ke: pertemuanKe },
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#0f1115]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0E6187]/20 border-t-[#0E6187] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Memuat dashboard monitoring...</p>
        </div>
      </div>
    )
  }

  if (failed && !data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#0f1115] px-6">
        <div className="text-center">
          <ShieldAlert size={30} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">Gagal memuat dashboard monitoring</p>
          <p className="text-xs text-slate-400 font-medium mt-1">Periksa koneksi atau pastikan kursus memiliki paket soal</p>
          <button onClick={() => { setLoading(true); fetchOverview() }}
            className="mt-4 text-xs font-bold text-[#6fb3d8] hover:underline">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const totals = data?.totals
  const course = data?.course

  return (
    <div className="min-h-screen bg-[#0f1115] text-white pb-10">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#16181d]/95 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                <ArrowLeft size={15} className="text-slate-300" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-white truncate">Dashboard Monitoring</h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${isToday && (totals?.live_total ?? 0) > 0 ? 'bg-red-500/15 text-red-400' : 'bg-white/10 text-slate-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isToday && (totals?.live_total ?? 0) > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                    {isToday ? 'LIVE' : 'RIWAYAT'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                  {course?.title}
                  {course && [course.batch_name, course.level && `Level ${course.level}`].filter(Boolean).join(' · ')}
                  {lastSync && ` · diperbarui ${new Date(lastSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setPaused(p => !p)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${paused ? 'bg-[#0E6187]/20 text-[#7ec3e4]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {paused ? <Play size={13} /> : <Pause size={13} />}
                {paused ? 'Lanjut' : 'Jeda'}
              </button>
              <button onClick={fetchOverview} disabled={fetchingRef.current}
                className="flex items-center gap-1.5 rounded-lg bg-[#0E6187] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#0a4d6b] transition-colors disabled:opacity-60">
                <RefreshCw size={13} className={fetchingRef.current ? 'animate-spin' : ''} />
                Segarkan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4">
        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <div className={`${CARD_CLS} px-3 py-2.5`}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <Users size={12} className="text-slate-500 shrink-0" />
              <span className="truncate">Sedang Mengerjakan</span>
            </div>
            <p className={`text-lg font-bold leading-none mt-2 tabular-nums ${(totals?.live_total ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
              {totals?.live_total ?? 0}
            </p>
          </div>
          <div className={`${CARD_CLS} px-3 py-2.5`}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <CheckCircle2 size={12} className="text-slate-500 shrink-0" />
              <span className="truncate">Sudah Kumpul</span>
            </div>
            <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{totals?.submitted_total ?? 0}</p>
          </div>
          <div className={`${CARD_CLS} px-3 py-2.5`}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <ShieldAlert size={12} className="text-slate-500 shrink-0" />
              <span className="truncate">Total Peringatan</span>
            </div>
            <p className={`text-lg font-bold leading-none mt-2 tabular-nums ${(totals?.warning_total ?? 0) > 0 ? 'text-red-400' : 'text-white'}`}>
              {totals?.warning_total ?? 0}
            </p>
          </div>
          <div className={`${CARD_CLS} px-3 py-2.5`}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <CalendarDays size={12} className="text-slate-500 shrink-0" />
              <span className="truncate">Pertemuan Berquiz</span>
            </div>
            <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{totals?.lesson_with_quiz ?? 0}</p>
          </div>
          <div className={`${CARD_CLS} px-3 py-2.5`}>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <ListChecks size={12} className="text-slate-500 shrink-0" />
              <span className="truncate">Paket Soal</span>
            </div>
            <p className="text-lg font-bold text-white leading-none mt-2 tabular-nums">{totals?.paket_count ?? 0}</p>
          </div>
        </div>

        {/* Filter tanggal */}
        <div className="mt-3.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <CalendarDays size={12} /> Tanggal:
          </span>
          <button onClick={() => setSelectedDate(todayStr)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${selectedDate === todayStr ? 'bg-[#0E6187] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            Hari ini
          </button>
          <input type="date" value={selectedDate} max={todayStr}
            onChange={e => { if (e.target.value) setSelectedDate(e.target.value) }}
            className="bg-white/5 border border-white/10 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#0E6187]"
            style={{ colorScheme: 'dark' }} />
        </div>

        {lessons.length === 0 && (data?.orphan_pakets?.length ?? 0) === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <Layers size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">Belum ada paket soal di kursus ini</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Tambahkan paket soal dan hubungkan ke pertemuan untuk mulai monitoring</p>
          </div>
        ) : (
          <>
            {/* Pertemuan yang sedang ada yang mengerjakan */}
            {liveLessons.length > 0 && (
              <section className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Radio size={13} className="text-red-400" />
                  <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-300">
                    Sedang Mengerjakan ({liveLessons.length} pertemuan)
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {liveLessons.map(lesson => (
                    <LessonCard key={lesson.id} lesson={lesson} onOpen={openMonitor} />
                  ))}
                </div>
              </section>
            )}

            {/* Pertemuan tanpa aktivitas */}
            {idleLessons.length > 0 && (
              <section className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Layers size={13} className="text-slate-500" />
                  <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Pertemuan lainnya ({idleLessons.length})
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {idleLessons.map(lesson => (
                    <LessonCard key={lesson.id} lesson={lesson} onOpen={openMonitor} />
                  ))}
                </div>
              </section>
            )}

            {/* Paket yang belum tertaut ke pertemuan */}
            {(data?.orphan_pakets?.length ?? 0) > 0 && (
              <section className="mt-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Layers size={13} className="text-amber-400" />
                  <h2 className="text-[11px] font-bold uppercase tracking-wide text-amber-400">
                    Paket belum terhubung ke pertemuan ({data?.orphan_pakets.length})
                  </h2>
                </div>
                <div className="space-y-2.5">
                  {data!.orphan_pakets.map(p => (
                    <PaketRow key={p.id} paket={p} pertemuanKe={null} onOpen={openMonitor} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LessonCard({
  lesson,
  onOpen,
}: {
  lesson: OverviewLesson
  onOpen: (paketId: number, title: string, pertemuanKe: number) => void
}) {
  const live = lesson.live_count > 0

  return (
    <div className={`rounded-lg border ${live ? 'border-red-500/30 bg-[#1a1416]' : 'border-white/10 bg-[#16181d]'}`}>
      <div className="px-3.5 py-3 flex items-center gap-3 flex-wrap">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${live ? 'bg-red-500/15' : 'bg-white/5'}`}>
          <span className={`text-[11px] font-bold tabular-nums ${live ? 'text-red-400' : 'text-slate-400'}`}>
            {lesson.pertemuan_ke}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[12px] font-bold text-white truncate">Pertemuan {lesson.pertemuan_ke} · {lesson.title}</p>
            {live && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400">
                <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse" />
                {lesson.live_count} sedang mengerjakan
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {fmtTanggal(lesson.tanggal)}
            {' · '}{lesson.paket_count} paket soal
            {lesson.submitted_count > 0 && ` · ${lesson.submitted_count} sudah kumpul`}
            {lesson.warning_total > 0 && (
              <span className="text-red-400"> · {lesson.warning_total} peringatan</span>
            )}
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 px-3.5 py-2 space-y-1.5">
        {lesson.pakets.map(p => (
          <PaketRow key={p.id} paket={p} pertemuanKe={lesson.pertemuan_ke} onOpen={onOpen} />
        ))}
      </div>
    </div>
  )
}

function PaketRow({
  paket,
  pertemuanKe,
  onOpen,
}: {
  paket: OverviewPaket
  pertemuanKe: number | null
  onOpen: (paketId: number, title: string, pertemuanKe: number) => void
}) {
  const live = paket.live_count > 0
  const disabled = paket.status !== 'aktif'

  return (
    <button
      onClick={() => onOpen(paket.id, paket.title, pertemuanKe ?? 0)}
      disabled={disabled}
      title={disabled ? 'Paket soal nonaktif' : 'Buka ruang monitoring'}
      className={`w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
        live
          ? 'bg-red-500/10 hover:bg-red-500/20'
          : disabled
            ? 'bg-white/[0.02] cursor-not-allowed opacity-60'
            : 'bg-white/[0.03] hover:bg-white/[0.07]'
      }`}
    >
      <Activity size={13} className={`shrink-0 ${live ? 'text-red-400' : disabled ? 'text-slate-600' : 'text-slate-500'}`} />
      <span className="text-[11px] font-bold text-slate-200 truncate flex-1">{paket.title}</span>

      {paket.template && (
        <span className="hidden sm:inline text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
          {paket.template}
        </span>
      )}

      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
        <ListChecks size={11} className="text-slate-500" />{paket.questions_count}
      </span>

      {paket.time_limit_minutes > 0 && (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
          <Clock size={11} className="text-slate-500" />{paket.time_limit_minutes}m
        </span>
      )}

      {paket.warning_total > 0 && (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-400 shrink-0">
          <ShieldAlert size={11} />{paket.warning_total}
        </span>
      )}

      {live ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-300 shrink-0">
          <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse" />{paket.live_count}
        </span>
      ) : paket.submitted_count > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-400 shrink-0">
          <CheckCircle2 size={10} />{paket.submitted_count}
        </span>
      ) : (
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-slate-500 shrink-0">
          {disabled ? 'Nonaktif' : 'Kosong'}
        </span>
      )}

      <ChevronRight size={13} className={`shrink-0 ${live ? 'text-red-400' : 'text-slate-600'}`} />
    </button>
  )
}