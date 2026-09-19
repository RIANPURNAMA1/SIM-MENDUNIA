import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Camera, CameraOff, CheckCircle2, X, RefreshCw, Pause, Play, ShieldAlert, Activity,
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
  webcam_photo: string | null
  last_activity: string | null
  siswa: MonitorSiswa
}

interface MonitorData {
  paket: { id: number; title: string; template: string; time_limit_minutes: number; max_warnings: number; questions_count: number }
  server_time: string
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
  if (!p) return null
  return p.startsWith('http') ? p : `${APP_URL}/storage/${p}`
}

const fmtDur = (sec: number) => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const fmtClock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

// Foto kamera yang menunggu sampai frame baru benar-benar termuat sebelum
// ditampilkan, jadi tidak ada flash hitam / patah saat berganti snapshot.
function CamImage({ src }: { src: string | null }) {
  const shownRef = useRef<string | null>(null)
  const [shown, setShown] = useState<string | null>(null)

  useEffect(() => {
    if (!src) {
      shownRef.current = null
      setShown(null)
      return
    }
    if (shownRef.current === src) return
    const img = new Image()
    img.onload = () => {
      shownRef.current = src
      setShown(src)
    }
    img.src = src
  }, [src])

  const pending = !!src && shownRef.current !== src

  if (!shown) {
    return (
      <div className="flex h-full w-full items-center justify-center gap-1.5">
        <CameraOff size={20} className="text-slate-600" />
        <p className="text-[9px] font-medium text-slate-600">Belum ada foto</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <img src={shown} alt="Webcam" className="h-full w-full object-cover" />
      {pending && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0E6187] border-t-transparent" />
        </div>
      )}
    </div>
  )
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

  const [detail, setDetail] = useState<AttemptDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [savingGrade, setSavingGrade] = useState<number | null>(null)

  const fetchingRef = useRef(false)

  const fetchMonitor = useCallback(() => {
    if (!paketId || fetchingRef.current) return
    fetchingRef.current = true
    guruQuizApi.monitor(Number(paketId)).then(res => {
      setData(res.data)
      setLastSync(Date.now())
      setFailed(false)
    }).catch(() => {
      setFailed(true)
    }).finally(() => {
      fetchingRef.current = false
      setLoading(false)
    })
  }, [paketId])

  useEffect(() => {
    fetchMonitor()
    const poll = setInterval(() => {
      if (!paused) fetchMonitor()
    }, 3000)
    return () => clearInterval(poll)
  }, [fetchMonitor, paused])

  // Realtime push: saat ada snapshot kamera baru dari siswa, segarkan data
  // seketika tanpa menunggu polling berikutnya.
  useEffect(() => {
    if (!paketId) return
    const echo = getEcho()
    if (!echo) return
    const channel = echo.channel(`quiz-monitor.${paketId}`)
    channel.listen('.snapshot.updated', () => {
      if (!paused) fetchMonitor()
    })
    return () => leaveChannel(`quiz-monitor.${paketId}`)
  }, [paketId, paused, fetchMonitor])

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
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-bold text-red-400 shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${liveCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {liveCount > 0 ? `${liveCount} kandidat sedang mengerjakan` : 'Tidak ada kandidat aktif'}
                  {lastSync && ` · diperbarui ${ago(new Date(lastSync).toISOString())}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setPaused(p => !p)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors ${paused ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
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
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl bg-[#0E6187]/15 border border-[#0E6187]/30 px-3 py-2">
              <p className="text-lg font-bold text-[#7ec3e4] leading-none">{liveCount}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Sedang Mengerjakan</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-lg font-bold text-white leading-none">{finished.length}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Sudah Kumpul</p>
            </div>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-lg font-bold text-red-400 leading-none">{warningsTotal}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Total Peringatan</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <p className="text-lg font-bold text-white leading-none">{answeredTotal}/{live.reduce((s, a) => s + a.total_count, 0)}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Soal Terjawab</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        {attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
            <CameraOff size={28} className="text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-200">Belum ada kandidat mengerjakan</p>
            <p className="text-xs text-slate-500 font-medium mt-1">Kandidat yang mulai mengerjakan quiz ini akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {attempts.map(a => {
              const remaining = remOf(a)
              const lowTime = remaining !== null && remaining <= 60
              const pct = a.total_count > 0 ? Math.round((a.answered_count / a.total_count) * 100) : 0
              const stale = a.status === 'in_progress' && a.last_activity
                ? (now - Date.parse(a.last_activity)) > 90 * 1000
                : false
              return (
                <button key={a.attempt_id} onClick={() => openDetail(a.attempt_id)}
                  className="text-left rounded-2xl border border-white/10 bg-[#16181d] overflow-hidden hover:border-[#0E6187]/60 transition-colors">
                  {/* Webcam */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <CamImage src={a.webcam_photo || null} />
                    <span className={`absolute top-2 left-2 z-20 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${a.status === 'in_progress' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      <span className={`h-1 w-1 rounded-full ${a.status === 'in_progress' ? 'bg-white animate-pulse' : 'bg-white'}`} />
                      {a.status === 'in_progress' ? 'MENGAWASI' : 'SELESAI'}
                    </span>
                    {a.auto_submitted && (
                      <span className="absolute top-2 right-2 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">AUTO</span>
                    )}
                    {stale && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                        <Activity size={9} /> Tidak aktif
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold text-white truncate">{a.siswa.nama}</p>
                      <span className="shrink-0 text-[10px] font-bold text-slate-400 bg-white/5 rounded px-1.5 py-0.5">#{a.attempt_number}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {[a.siswa.batch && `Batch ${a.siswa.batch}`, a.siswa.level !== null && a.siswa.level !== undefined && `Level ${a.siswa.level}`].filter(Boolean).join(' · ') || '-'}
                    </p>

                    {a.status === 'in_progress' ? (
                      <>
                        <div className="mt-2.5 flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#7ec3e4]">{a.answered_count}/{a.total_count} soal</span>
                          <span className={lowTime ? 'text-red-400' : 'text-slate-300'}>{fmtClock(remaining ?? 0)} tersisa</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${lowTime ? 'bg-red-500' : 'bg-[#0E6187]'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[9.5px] font-semibold">
                          <span className={`inline-flex items-center gap-1 ${a.warnings >= a.max_warnings ? 'text-red-400' : a.warnings > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            <ShieldAlert size={10} /> {a.warnings}/{a.max_warnings} peringatan
                          </span>
                          <span className="text-slate-500">{fmtDate(a.last_activity)}</span>
                        </div>
                      </>
                    ) : (
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 size={12} /> {Number(a.score) || 0} poin
                        </span>
                        {a.submitted_at && <span className="text-[10px] text-slate-500 font-medium">selesai {fmtDate(a.submitted_at)}</span>}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
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
                      <img src={detail.attempt.webcam_photo} alt="Webcam" className="w-full rounded-xl border border-[#E5E7EF] max-h-52 object-cover" />
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