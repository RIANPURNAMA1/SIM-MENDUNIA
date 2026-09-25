import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, ArrowLeft, BarChart3, BookOpen, Calendar, Camera, CheckCircle2, ChevronRight,
  ClipboardList, Download, Eye, FileText, HelpCircle, ImageIcon, Layers, ListChecks, Loader2, Trophy, Users, Video, X,
} from 'lucide-react'
import { APP_URL, assignmentApi, guruKelasApi, guruLmsApi, guruQuizApi } from '../../services/api'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import LessonSlidesViewer from '../../components/LessonSlidesViewer'
import Swal from 'sweetalert2'

interface LessonPaketItem {
  id: number
  title: string
  status: string
  questions_count?: number
  attempts_count?: number
  quiz_template?: string
  pivot?: { status?: string; penilaian_ulangan?: boolean; is_pembahasan?: boolean }
}

interface LmsMateriItem {
  id: number
  title: string
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  file_url: string | null
  status: string
  sort: number
  course?: { id: number; title: string } | null
  slides?: { id: number; file_path: string; file_name: string; file_type?: string | null; url?: string }[]
}

interface LessonDetail {
  id: number
  course_id: number
  title: string
  pertemuan_date?: string | null
  pertemuan_date_label?: string | null
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  paket_id: number | null
  paket?: { id: number; title: string; status: string; questions_count?: number; attempts_count?: number } | null
  link_pakets?: LessonPaketItem[]
  link_materis?: LmsMateriItem[]
  slides?: { id: number; file_path: string; file_name?: string; url?: string }[]
  sort: number
  status: string
  recap?: {
    id: number
    file_path: string | null
    file_name: string | null
    file_size: number | null
    file_type: string | null
    kind: 'image' | 'pdf'
    description: string | null
    url: string | null
    created_at?: string | null
  } | null
  course?: {
    id: number
    title: string
    level: string | null
    batch_id: number | null
    kelas_sensei_id?: number | null
  } | null
}

interface TaskItem {
  id: number
  title: string
  description: string | null
  due_date: string | null
  max_score: number | null
  submissions_count?: number
  lesson_id?: number | null
  pakets?: { id: number; title: string; questions_count?: number; time_limit_minutes?: number; max_attempts?: number; passing_score?: number }[]
}

interface RekapNilaiData {
  lesson_id: number
  course_title: string | null
  batch_id: number | null
  pakets: { id: number; title: string; questions_count: number; max_score: number }[]
  siswa: {
    siswa_id: number
    nama: string
    level: string | null
    batch_id: number | null
    scores: { paket_id: number; attempts_count: number; best_score: number | null; attempts: { id: number; attempt_number: number; score: number | null }[] }[]
  }[]
}

interface DataSiswaKelas {
  kelas?: { id: number; nama_kelas: string; level: string; batch_id: number | null } | null
  siswa: { id: number; nama: string; level: string; absensi: Record<string, string> }[]
  dates: string[]
}

interface PenilaianHarianData {
  kelas?: unknown
  siswa: { id: number; nama: string; level: string; daily_status: Record<string, { is_terisi: boolean; catatan: string | null }> }[]
  dates: string[]
}

interface RankItem {
  siswa_id: number
  nama: string
  level: string
  rata_rata: number | null
  total_nilai: number
  rank: number | null
}

interface ResultParticipant {
  siswa_id: number
  nama: string
  batch: string | null
  level: string | null
  attempts_count: number
  best_score: number | null
  attempts: { attempt_id: number; attempt_number: number; status: string; score: number | null; correct_count: number | null; total_count: number | null; webcam_photo: string | null; started_at: string | null; submitted_at: string | null }[]
}

const ATT_STATUS: { key: string; label: string; cls: string }[] = [
  { key: 'HADIR', label: 'Hadir', cls: 'bg-emerald-50 text-emerald-600' },
  { key: 'IZIN', label: 'Izin', cls: 'bg-amber-50 text-amber-600' },
  { key: 'SAKIT', label: 'Sakit', cls: 'bg-sky-50 text-sky-600' },
  { key: 'ALPA', label: 'Alpa', cls: 'bg-red-50 text-red-500' },
]

const fmtFileSize = (bytes?: number | null) => {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

const fmtDate = (d?: string | null) => {
  if (!d) return ''
  const s = d.length >= 10 ? d.slice(0, 10) : d
  const [y, m, day] = s.split('-')
  if (!y || !m || !day) return d
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${day} ${months[Number(m) - 1]} ${y}`
}

type TabKey = 'materi' | 'quiz' | 'tugas' | 'rekap' | 'kehadiran' | 'nilai' | 'peringkat'

const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: 'materi', label: 'Materi', icon: BookOpen },
  { key: 'quiz', label: 'Quiz', icon: HelpCircle },
  { key: 'tugas', label: 'Tugas', icon: ClipboardList },
  { key: 'rekap', label: 'Rekap', icon: Camera },
  { key: 'kehadiran', label: 'Kehadiran', icon: Calendar },
  { key: 'nilai', label: 'Nilai', icon: BarChart3 },
  { key: 'peringkat', label: 'Peringkat', icon: Trophy },
]

export default function AdminLessonDetail() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const base = location.pathname.startsWith('/admin-cabang') ? '/admin-cabang/lms' : '/lms'

  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('materi')

  const [rekapNilai, setRekapNilai] = useState<RekapNilaiData | null>(null)
  const [rekapLoading, setRekapLoading] = useState(false)
  const [kehadiran, setKehadiran] = useState<DataSiswaKelas | null>(null)
  const [kehadiranLoading, setKehadiranLoading] = useState(false)
  const [penilaian, setPenilaian] = useState<PenilaianHarianData | null>(null)
  const [penilaianLoading, setPenilaianLoading] = useState(false)
  const [rankings, setRankings] = useState<RankItem[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [openMateriId, setOpenMateriId] = useState<number | null>(null)

  const [hasilPaket, setHasilPaket] = useState<{ id: number; title: string } | null>(null)
  const [participants, setParticipants] = useState<ResultParticipant[]>([])
  const [hasilLoading, setHasilLoading] = useState(false)

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    guruLmsApi.lessonDetail(Number(lessonId))
      .then(res => setLesson(res.data.lesson))
      .catch(() => {
        Swal.fire({ icon: 'error', title: 'Gagal memuat pertemuan' })
        navigate(courseId ? `${base}/course/${courseId}` : base)
      })
      .finally(() => setLoading(false))
  }, [lessonId, courseId, base, navigate])

  useEffect(() => {
    if (!lesson) return
    if (tab === 'rekap') loadRekap(lesson.id)
    if (tab === 'kehadiran') loadKehadiran(lesson)
    if (tab === 'nilai') loadPenilaian(lesson)
    if (tab === 'peringkat') loadRanking(lesson)
    if (tab === 'tugas') loadTugas(lesson.course_id, lesson.id)
  }, [tab, lesson])

  const loadRekap = (id: number) => {
    setRekapLoading(true)
    guruLmsApi.lessonRekapNilai(id).then(res => setRekapNilai(res.data)).catch(() => setRekapNilai(null)).finally(() => setRekapLoading(false))
  }

  const loadKehadiran = (l: LessonDetail) => {
    const kelasId = l.course?.kelas_sensei_id
    if (!kelasId) { setKehadiran(null); return }
    setKehadiranLoading(true)
    guruKelasApi.dataSiswa(kelasId).then(res => setKehadiran(res.data)).catch(() => setKehadiran(null)).finally(() => setKehadiranLoading(false))
  }

  const loadPenilaian = (l: LessonDetail) => {
    const kelasId = l.course?.kelas_sensei_id
    if (!kelasId) { setPenilaian(null); return }
    setPenilaianLoading(true)
    guruKelasApi.penilaianHarian(kelasId).then(res => setPenilaian(res.data)).catch(() => setPenilaian(null)).finally(() => setPenilaianLoading(false))
  }

  const loadRanking = (l: LessonDetail) => {
    const batchId = l.course?.batch_id
    if (!batchId) { setRankings([]); return }
    setRankingLoading(true)
    guruKelasApi.ranking(batchId).then(res => setRankings(res.data.rankings || [])).catch(() => setRankings([])).finally(() => setRankingLoading(false))
  }

  const loadTugas = (courseIdNum: number, lessonIdNum: number) => {
    assignmentApi.list(courseIdNum, lessonIdNum).then(res => setTasks(res.data.assignments || [])).catch(() => setTasks([]))
  }

  const openHasil = (paket: { id: number; title: string }) => {
    setHasilPaket(paket)
    setParticipants([])
    setHasilLoading(true)
    guruQuizApi.results(paket.id, lesson?.course?.kelas_sensei_id ?? undefined)
      .then(res => setParticipants(res.data.participants || []))
      .catch(() => setParticipants([]))
      .finally(() => setHasilLoading(false))
  }

  const rekapStats = useMemo(() => {
    if (!rekapNilai || rekapNilai.pakets.length === 0) return null
    const done = rekapNilai.siswa.filter(s => s.scores.some(sc => sc != null && sc.best_score != null)).length
    const avgs = rekapNilai.siswa.map(s => {
      const vals = s.scores.filter(sc => sc != null && sc.best_score != null).map(sc => sc!.best_score as number)
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
    }).filter((v): v is number => v != null)
    return {
      total: rekapNilai.siswa.length,
      done,
      notDone: rekapNilai.siswa.length - done,
      overallAvg: avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length) : null,
    }
  }, [rekapNilai])

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 size={26} className="animate-spin text-[#0E6187]" />
          <p className="text-sm text-slate-500">Memuat data pertemuan...</p>
        </div>
      </div>
    )
  }

  if (!lesson) return null

  const slides = (lesson.slides || []).map(s => ({ id: s.id, name: s.file_name || 'slide', url: s.url || `${APP_URL}/storage/${s.file_path}`, slides: undefined }))
  const lessonPakets: LessonPaketItem[] = [
    ...(lesson.paket ? [{ ...lesson.paket, pivot: undefined as LessonPaketItem['pivot'] }] : []),
    ...(lesson.link_pakets || []).filter(p => !p.pivot?.is_pembahasan),
  ].filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
  const pembahasanPakets = (lesson.link_pakets || []).filter(p => !!p.pivot?.is_pembahasan)
  const materiBank = lesson.link_materis || []
  const attDate = lesson.pertemuan_date ? lesson.pertemuan_date.slice(0, 10) : ''
  const penilaianDates = penilaian?.dates || []

  const statBadge = (s?: string) => (s === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')

  const paketStatusLabel = (p: LessonPaketItem) => p.pivot?.status ?? p.status

  const pembahasanHref = (paketId: number) => `${base}/course/${lesson.course_id}/pertemuan/${lesson.id}/pembahasan/${paketId}`

  const renderMateriIsi = (m: LmsMateriItem) => {
    const hasIsi = !!m.video_url || (m.content && m.content.trim()) || !!m.file_path || !!(m.slides && m.slides.length > 0)
    return (
      <div className="space-y-3">
        {m.video_url && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe src={getYouTubeEmbedUrl(m.video_url) || m.video_url} className="w-full h-full" allowFullScreen title={m.title} />
          </div>
        )}
        {m.content && m.content.trim() && (
          <div className="text-sm text-slate-600 leading-relaxed [&_img]:max-w-full [&_iframe]:w-full" dangerouslySetInnerHTML={{ __html: m.content }} />
        )}
        {m.file_path && (
          <a href={m.file_url || `${APP_URL}/storage/${m.file_path}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{m.file_name || 'File materi'}</p>
              <p className="text-xs text-slate-400">{fmtFileSize(m.file_size)} · PDF</p>
            </div>
            <span className="text-xs font-bold text-[#0E6187] inline-flex items-center gap-1"><Download size={12} /> Buka</span>
          </a>
        )}
        {m.slides && m.slides.length > 0 && <LessonSlidesViewer slides={m.slides.map(s => ({ id: s.id, name: s.file_name || 'slide', url: s.url || `${APP_URL}/storage/${s.file_path}`, slides: undefined }))} />}
        {!hasIsi && <p className="text-sm text-slate-400 py-3 text-center">Tidak ada konten untuk materi ini</p>}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(courseId ? `${base}/course/${courseId}` : base)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="h-11 w-11 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span>{lesson.course?.title || 'Kursus'}</span>
                <ChevronRight size={12} />
                <span className="text-slate-500">{lesson.title}</span>
              </div>
              <h1 className="text-lg font-bold text-slate-800">Detail Pertemuan</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lesson.pertemuan_date_label && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                <Calendar size={14} /> {lesson.pertemuan_date_label}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${lesson.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <CheckCircle2 size={14} /> {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </div>

        {/* Stat summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Materi', value: materiBank.length + (lesson.content ? 1 : 0), icon: Layers, cls: 'text-[#0E6187] bg-[#0E6187]/10' },
            { label: 'Quiz', value: lessonPakets.length, icon: HelpCircle, cls: 'text-amber-600 bg-amber-50' },
            { label: 'Tugas', value: tasks.length, icon: ClipboardList, cls: 'text-violet-600 bg-violet-50' },
            { label: 'Pembahasan', value: pembahasanPakets.length, icon: Eye, cls: 'text-emerald-600 bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.cls}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 leading-none">{s.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                tab === t.key ? 'border-[#0E6187] text-[#0E6187] bg-[#0E6187]/5' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}>
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== MATERI ===== */}
        {tab === 'materi' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[#0E6187]" />
                  <h3 className="text-sm font-bold text-slate-800">Konten Pertemuan</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {lesson.video_url && (
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <iframe src={getYouTubeEmbedUrl(lesson.video_url) || lesson.video_url} className="w-full h-full" allowFullScreen title={lesson.title} />
                  </div>
                )}
                {lesson.content && lesson.content.trim() ? (
                  <div className="text-sm text-slate-600 leading-relaxed [&_img]:max-w-full [&_iframe]:w-full" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                ) : !lesson.video_url ? (
                  <p className="text-sm text-slate-400 text-center py-6">Belum ada materi konten untuk pertemuan ini</p>
                ) : null}
                {lesson.file_path && (
                  <a href={`${APP_URL}/storage/${lesson.file_path}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{lesson.file_name}</p>
                      <p className="text-xs text-slate-400">{fmtFileSize(lesson.file_size)} · PDF</p>
                    </div>
                    <span className="text-xs font-bold text-[#0E6187] inline-flex items-center gap-1"><Download size={12} /> Buka</span>
                  </a>
                )}
                {slides.length > 0 && <LessonSlidesViewer slides={slides} />}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-[#0E6187]" />
                  <h3 className="text-sm font-bold text-slate-800">Materi dari Bank</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{materiBank.length} materi</span>
                </div>
              </div>
              <div className="p-6">
                {materiBank.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center">
                    <Layers size={28} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">Belum ada materi dari bank</p>
                    <p className="text-xs text-slate-400 mt-1">Materi/modul yang ditambahkan sensei di batch akan tampil di sini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materiBank.map(m => {
                      const open = openMateriId === m.id
                      return (
                        <div key={m.id} className="border border-slate-200 rounded-xl overflow-hidden">
                          <button onClick={() => setOpenMateriId(open ? null : m.id)}
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left">
                            <div className="w-9 h-9 rounded-lg bg-[#0E6187]/10 text-[#0E6187] flex items-center justify-center shrink-0">
                              {m.video_url ? <Video size={16} /> : (m.slides?.length ? <ImageIcon size={16} /> : <FileText size={16} />)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {m.video_url && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><Video size={11} /> Video</span>}
                                {m.file_path && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><FileText size={11} /> PDF</span>}
                                {!!m.slides?.length && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><ImageIcon size={11} /> {m.slides.length} Slide</span>}
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statBadge(m.status)}`}>{m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-bold text-[#0E6187] ${open ? 'rotate-180' : ''}`}>▾</span>
                          </button>
                          {open && <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">{renderMateriIsi(m)}</div>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== QUIZ ===== */}
        {tab === 'quiz' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-[#0E6187]" />
                  <h3 className="text-sm font-bold text-slate-800">Quiz Pertemuan</h3>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{lessonPakets.length} paket</span>
                </div>
              </div>
              {lessonPakets.length === 0 ? (
                <div className="p-10 text-center">
                  <HelpCircle size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Belum ada quiz</p>
                  <p className="text-xs text-slate-400 mt-1">Paket soal yang ditautkan sensei akan tampil di sini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60">
                        <th className="px-6 py-3 font-bold">Paket Soal</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold text-center">Soal</th>
                        <th className="px-4 py-3 font-bold text-center">Percobaan</th>
                        <th className="px-6 py-3 font-bold text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lessonPakets.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{p.title}</p>
                            {p.quiz_template && <p className="text-[11px] text-slate-400 mt-0.5">Template: {p.quiz_template === 'jft' ? 'JFT UI' : 'Basic'}</p>}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${paketStatusLabel(p) === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              {paketStatusLabel(p) === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-slate-700">{p.questions_count ?? '-'}</td>
                          <td className="px-4 py-4 text-center font-semibold text-slate-700">{p.attempts_count ?? '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => navigate(`${base}/paket/${p.id}/soal`)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-slate-300 transition-colors">
                                <ListChecks size={12} /> Lihat Paket Soal
                              </button>
                              <button onClick={() => openHasil({ id: p.id, title: p.title })}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-slate-300 transition-colors">
                                <BarChart3 size={12} /> Hasil
                              </button>
                              <button onClick={() => navigate(`${base}/course/${lesson.course_id}/monitor?paket=${p.id}`)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:border-slate-300 transition-colors">
                                <Activity size={12} /> Monitor
                              </button>
                              {p.pivot?.is_pembahasan !== undefined
                                ? <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg">Pembahasan</span>
                                : <button onClick={() => navigate(pembahasanHref(p.id))}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0069b0] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#004d7a] transition-colors">
                                    <Eye size={12} /> Lihat Pembahasan
                                  </button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {pembahasanPakets.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-[#0E6187]" />
                    <h3 className="text-sm font-bold text-slate-800">Paket Pembahasan</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{pembahasanPakets.length} paket</span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {pembahasanPakets.map(p => (
                    <div key={p.id} className="flex items-center gap-3 border border-slate-200 rounded-xl px-5 py-4">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Eye size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{p.questions_count ?? 0} soal · Siswa melihat soal + kunci jawaban</p>
                      </div>
                      <button onClick={() => navigate(pembahasanHref(p.id))}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0069b0] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[#004d7a] transition-colors">
                        <Eye size={12} /> Lihat Pembahasan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TUGAS ===== */}
        {tab === 'tugas' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#0E6187]" />
                <h3 className="text-sm font-bold text-slate-800">Tugas Pertemuan</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{tasks.length} tugas</span>
              </div>
            </div>
            {tasks.length === 0 ? (
              <div className="p-10 text-center">
                <ClipboardList size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Belum ada tugas</p>
                <p className="text-xs text-slate-400 mt-1">Tugas yang dibuat sensei untuk pertemuan ini akan tampil di sini</p>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-4 border border-slate-200 rounded-xl px-5 py-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><ClipboardList size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        {t.due_date && <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400"><Calendar size={11} /> Tenggat {fmtDate(t.due_date)}</span>}
                        {t.max_score != null && <span className="text-[11px] font-medium text-slate-400">Nilai maks: {t.max_score}</span>}
                        <span className="text-[11px] font-medium text-slate-400">{t.submissions_count ?? 0} pengumpulan</span>
                      </div>
                    </div>
                    {!!t.pakets?.length && (
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg shrink-0">{t.pakets.length} paket soal</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== REKAP ===== */}
        {tab === 'rekap' && (
          <div className="space-y-5">
            {(lesson.recap?.url || lesson.recap?.file_path) && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Camera size={16} className="text-[#0E6187]" />
                  <h3 className="text-sm font-bold text-slate-800">Dokumentasi Rekap Pertemuan</h3>
                </div>
                <div className="p-6">
                  {lesson.recap.kind === 'image' ? (
                    <a href={lesson.recap.url || `${APP_URL}/storage/${lesson.recap.file_path}`} target="_blank" rel="noopener noreferrer">
                      <img src={lesson.recap.url || `${APP_URL}/storage/${lesson.recap.file_path}`} alt="Rekap pertemuan" className="max-h-[420px] rounded-xl border border-slate-200 object-contain mx-auto" />
                    </a>
                  ) : (
                    <a href={lesson.recap.url || `${APP_URL}/storage/${lesson.recap.file_path}`} target="_blank" rel="noopener noreferrer"
                      className="max-w-lg flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0"><FileText size={16} className="text-rose-500" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{lesson.recap.file_name}</p>
                        <p className="text-xs text-slate-400">{fmtFileSize(lesson.recap.file_size)} · PDF</p>
                      </div>
                      <span className="text-xs font-bold text-[#0E6187] inline-flex items-center gap-1"><Download size={12} /> Buka</span>
                    </a>
                  )}
                  {lesson.recap.description && <p className="text-sm text-slate-600 mt-4">{lesson.recap.description}</p>}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#0E6187]" />
                  <h3 className="text-sm font-bold text-slate-800">Rekap Nilai Quiz</h3>
                </div>
                {rekapLoading && <Loader2 size={15} className="animate-spin text-[#0E6187]" />}
              </div>
              {rekapLoading ? (
                <div className="p-12 text-center text-sm text-slate-400">Memuat rekap nilai...</div>
              ) : !rekapNilai || rekapNilai.pakets.length === 0 ? (
                <div className="p-10 text-center">
                  <BarChart3 size={28} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Belum ada data rekap nilai</p>
                  <p className="text-xs text-slate-400 mt-1">Setelah siswa mengerjakan quiz, nilai terbaik akan tampil di sini</p>
                </div>
              ) : (
                <>
                  {rekapStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">{rekapStats.total}</p>
                        <p className="text-xs text-slate-500 font-medium">Siswa</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">{rekapStats.done}</p>
                        <p className="text-xs text-slate-500 font-medium">Sudah mengerjakan</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-500">{rekapStats.notDone}</p>
                        <p className="text-xs text-slate-500 font-medium">Belum mengerjakan</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#0E6187]">{rekapStats.overallAvg ?? '-'}</p>
                        <p className="text-xs text-slate-500 font-medium">Rata-rata nilai</p>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60">
                          <th className="px-6 py-3 font-bold">Siswa</th>
                          {rekapNilai.pakets.map(p => <th key={p.id} className="px-4 py-3 font-bold text-center">{p.title}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rekapNilai.siswa.map(s => (
                          <tr key={s.siswa_id} className="hover:bg-slate-50/60">
                            <td className="px-6 py-3">
                              <p className="font-semibold text-slate-800">{s.nama}</p>
                              {s.level && <p className="text-[11px] text-slate-400">Level {s.level}</p>}
                            </td>
                            {rekapNilai.pakets.map(p => {
                              const sc = s.scores.find(x => x.paket_id === p.id)
                              return (
                                <td key={p.id} className="px-4 py-3 text-center">
                                  <span className={`inline-block min-w-[44px] rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                    sc && sc.best_score != null ? 'bg-[#0E6187]/10 text-[#0E6187]' : 'bg-slate-50 text-slate-400'
                                  }`}>{sc && sc.best_score != null ? sc.best_score : '-'}</span>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== KEHADIRAN ===== */}
        {tab === 'kehadiran' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#0E6187]" />
                <h3 className="text-sm font-bold text-slate-800">Kehadiran Siswa</h3>
                {attDate && <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{fmtDate(attDate)}</span>}
              </div>
              {kehadiranLoading && <Loader2 size={15} className="animate-spin text-[#0E6187]" />}
            </div>
            <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-slate-100 bg-slate-50/60">
              {ATT_STATUS.map(s => (
                <span key={s.key} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
              ))}
            </div>
            {kehadiranLoading ? (
              <div className="p-12 text-center text-sm text-slate-400">Memuat kehadiran...</div>
            ) : !kehadiran || kehadiran.siswa.length === 0 ? (
              <div className="p-10 text-center">
                <Users size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Belum ada data kehadiran</p>
                <p className="text-xs text-slate-400 mt-1">Kelas belum memiliki siswa atau tanggal pertemuan belum diisi</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60">
                      <th className="px-6 py-3 font-bold w-10">No</th>
                      <th className="px-4 py-3 font-bold">Siswa</th>
                      <th className="px-4 py-3 font-bold">Level</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kehadiran.siswa.map((s, i) => {
                      const st = attDate ? (s.absensi[attDate] || '') : ''
                      const meta = ATT_STATUS.find(x => x.key === st.toUpperCase())
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="px-6 py-3 text-slate-400 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{s.nama}</td>
                          <td className="px-4 py-3 text-slate-500">Level {s.level}</td>
                          <td className="px-4 py-3">
                            {meta ? (
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}><CheckCircle2 size={12} /> {meta.label}</span>
                            ) : (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">Belum diisi</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== NILAI ===== */}
        {tab === 'nilai' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-[#0E6187]" />
                <h3 className="text-sm font-bold text-slate-800">Penilaian Harian Siswa</h3>
              </div>
              {penilaianLoading && <Loader2 size={15} className="animate-spin text-[#0E6187]" />}
            </div>
            {penilaianLoading ? (
              <div className="p-12 text-center text-sm text-slate-400">Memuat penilaian...</div>
            ) : !penilaian || penilaian.siswa.length === 0 ? (
              <div className="p-10 text-center">
                <BarChart3 size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Belum ada data penilaian</p>
                <p className="text-xs text-slate-400 mt-1">Penilaian harian yang diinput sensei akan tampil di sini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60">
                      <th className="px-6 py-3 font-bold">Siswa</th>
                      {penilaianDates.map(d => <th key={d} className="px-4 py-3 font-bold text-center">{fmtDate(d)}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {penilaian.siswa.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3 font-semibold text-slate-800">{s.nama}</td>
                        {penilaianDates.map(d => {
                          const ds = s.daily_status[d]
                          return (
                            <td key={d} className="px-4 py-3 text-center">
                              {ds?.is_terisi ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={11} /> Terisi</span>
                              ) : (
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== PERINGKAT ===== */}
        {tab === 'peringkat' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-[#0E6187]" />
                <h3 className="text-sm font-bold text-slate-800">Peringkat Kelas</h3>
              </div>
              {rankingLoading && <Loader2 size={15} className="animate-spin text-[#0E6187]" />}
            </div>
            {rankingLoading ? (
              <div className="p-12 text-center text-sm text-slate-400">Memuat peringkat...</div>
            ) : rankings.length === 0 ? (
              <div className="p-10 text-center">
                <Trophy size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Belum ada data peringkat</p>
                <p className="text-xs text-slate-400 mt-1">Peringkat kandidat di batch ini akan tampil di sini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60">
                      <th className="px-6 py-3 font-bold w-12">Rank</th>
                      <th className="px-4 py-3 font-bold">Siswa</th>
                      <th className="px-4 py-3 font-bold">Level</th>
                      <th className="px-4 py-3 font-bold">Rata-rata</th>
                      <th className="px-6 py-3 font-bold text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rankings.map(r => (
                      <tr key={r.siswa_id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${r.rank === 1 ? 'bg-amber-100 text-amber-600' : r.rank === 2 ? 'bg-slate-200 text-slate-600' : r.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                            {r.rank ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{r.nama}</td>
                        <td className="px-4 py-3 text-slate-500">Level {r.level}</td>
                        <td className="px-4 py-3 font-semibold text-[#0E6187]">{r.rata_rata != null ? r.rata_rata : '-'}</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-700">{r.total_nilai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Modal Hasil Quiz ===== */}
      {hasilPaket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setHasilPaket(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800">Hasil Quiz</h3>
                <p className="text-xs text-slate-500 mt-0.5">{hasilPaket.title}</p>
              </div>
              <button onClick={() => setHasilPaket(null)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto">
              {hasilLoading ? (
                <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 size={20} className="animate-spin text-[#0E6187]" /> Memuat hasil quiz...
                </div>
              ) : participants.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Belum ada peserta</p>
                  <p className="text-xs text-slate-400 mt-1">Belum ada siswa yang mengerjakan quiz ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/60 sticky top-0">
                        <th className="px-6 py-3 font-bold">Siswa</th>
                        <th className="px-4 py-3 font-bold text-center">Percobaan</th>
                        <th className="px-4 py-3 font-bold text-center">Nilai Terbaik</th>
                        <th className="px-6 py-3 font-bold text-right">Detail Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {participants.map(par => (
                        <tr key={par.siswa_id} className="hover:bg-slate-50/60 align-top">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800">{par.nama}</p>
                            <p className="text-[11px] text-slate-400">{par.level ? `Level ${par.level}` : ''}{par.batch ? ` · ${par.batch}` : ''}</p>
                          </td>
                          <td className="px-4 py-4 text-center font-semibold text-slate-700">{par.attempts_count}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block min-w-[44px] rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                              par.best_score != null ? 'bg-[#0E6187]/10 text-[#0E6187]' : 'bg-slate-50 text-slate-400'
                            }`}>{par.best_score != null ? par.best_score : '-'}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {par.attempts.length > 0 ? (
                              <div className="flex flex-col gap-1 items-end">
                                {par.attempts.map(a => (
                                  <span key={a.attempt_id} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md bg-slate-50 text-slate-500">
                                    Percobaan {a.attempt_number}: <span className={a.score != null ? 'text-[#0E6187]' : 'text-slate-400'}>{a.score != null ? a.score : '-'}</span>
                                    {a.correct_count != null && <span className="text-slate-400 font-medium">({a.correct_count}/{a.total_count})</span>}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Belum mengerjakan</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}