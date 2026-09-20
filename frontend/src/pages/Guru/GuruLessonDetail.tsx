import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, FileText, ListChecks, Plus, ChevronRight, ChevronDown, HelpCircle,
  Download, Clock, ClipboardList, Check, Edit3, X, Trash2, Loader2, Layers, Camera, Upload, ImageIcon,
  BarChart3, Users, Video, Eye, EyeOff, Activity, Search, Volume2, UploadCloud, Mic, Repeat, RotateCcw, Calendar, Minus, Trophy,
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { guruLmsApi, assignmentApi, guruQuizApi, guruMateriApi, guruKelasApi, absensiSiswaApi, penilaianApi, APP_URL } from '../../services/api'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'
import LessonSlidesViewer from '../../components/LessonSlidesViewer'
import LessonMediaFields, { LessonSlideItem } from '../../components/LessonMediaFields'
import GuruPaketSoal from './GuruPaketSoal'

interface LessonPaketItem {
  id: number
  title: string
  status: string
  questions_count?: number
  attempts_count?: number
  pivot?: { status?: string; penilaian_ulangan?: boolean }
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
  link_pakets?: { id: number; title: string; status: string; questions_count?: number; attempts_count?: number; pivot?: { status?: string; penilaian_ulangan?: boolean } }[]
  link_materis?: LmsMateriItem[]
  slides?: { id: number; file_path: string; file_name?: string; url?: string }[]
  sort: number
  status: string
  course?: {
    id: number
    title: string
    level: string | null
    batch_id: number | null
    kelas_sensei_id?: number | null
    can_manage?: boolean
    pakets?: {
      id: number
      title: string
      status: string
      questions_count?: number
      attempts_count?: number
    }[]
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
  lesson?: { id: number; title: string; sort: number } | null
  pakets?: {
    id: number
    title: string
    questions_count?: number
    time_limit_minutes?: number
    max_attempts?: number
    passing_score?: number
  }[]
}

interface BankPaket {
  id: number
  title: string
  status: string
  course_id: number | null
  questions_count?: number
  category?: string | null
  level?: string | null
  batch?: { id: number; nama_batch: string } | null
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
  lessons_count?: number
  course?: { id: number; title: string } | null
  slides?: { id: number; file_path: string; file_name: string; file_type?: string | null; url?: string }[]
}

interface PaketQuestion {
  id: number
  question: string
  question_type: 'choice' | 'rating' | 'essay' | string
  rating_max: number | null
  options: AttemptOption[]
  correct_index: number | null
  points: number | null
  section_id?: number | null
  section?: { id: number; name: string } | null
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
  keyword?: string | null
  image_path?: string | null
  audio_path?: string | null
  sort?: number | null
}

interface QuizOptItem {
  text: string
  image_path: string | null
  image_url: string | null
}

const emptyQuestionForm = { question: '', section_id: '', question_type: 'choice', rating_max: '9', correct_index: '', points: '1', keyword: '', image_path: '', image_url: '', audio_path: '', audio_url: '', audio_max_plays: '2' }

interface RecapData {
  id: number
  file_path: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  kind: 'image' | 'pdf'
  description: string | null
  url: string | null
  created_at?: string | null
}

interface RekapNilaiPaket {
  id: number
  title: string
  questions_count: number
  max_score: number
}

interface RekapNilaiSiswaScore {
  paket_id: number
  attempts_count: number
  best_score: number | null
  attempts: { id: number; attempt_number: number; score: number | null }[]
}

interface RekapNilaiSiswa {
  siswa_id: number
  nama: string
  level: string | null
  batch_id: number | null
  scores: RekapNilaiSiswaScore[]
}

interface RekapNilaiData {
  lesson_id: number
  course_title: string | null
  batch_id: number | null
  pakets: RekapNilaiPaket[]
  siswa: RekapNilaiSiswa[]
}

interface ResultAttempt {
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
  webcam_photo: string | null
}

interface ResultParticipant {
  siswa_id: number
  nama: string
  batch: string | null
  level: string | null
  attempts_count: number
  best_score: number | null
  attempts: ResultAttempt[]
}

type AttemptOption = string | { text?: string; image_url?: string | null; image_path?: string | null }

interface AttemptDetailQuestion {
  id: number
  question: string
  question_type: 'choice' | 'rating' | 'essay' | string
  rating_max?: number | null
  options: AttemptOption[]
  correct_index?: number | null
  keyword?: string | null
  points?: number | null
  section_id?: number | null
  section?: { id: number; name: string } | null
  image_url?: string | null
  audio_url?: string | null
  audio_max_plays?: number | null
  selected_index?: number | null
  answer_text?: string | null
  earned_points?: number | null
  is_correct?: boolean | null
}

interface AttemptDetailData {
  attempt: {
    id: number
    attempt_number: number
    status: string
    score: number | null
    correct_count?: number | null
    total_count?: number | null
    warnings?: number
    started_at?: string | null
    submitted_at?: string | null
    webcam_photo?: string | null
  }
  questions: AttemptDetailQuestion[]
  sections?: { id: number | null; name: string; count: number }[]
  siswa?: { id: number; nama: string } | null
}

interface DataSiswaItem {
  id: number
  nama: string
  level: string
  absensi: Record<string, string>
}

interface DataSiswaKelas {
  kelas?: {
    id: number
    nama_kelas: string
    level: string
    batch_id: number | null
    batch_relasi?: { id: number; nama_batch: string } | null
    tanggal_mulai: string
    tanggal_selesai: string
  } | null
  siswa: DataSiswaItem[]
  dates: string[]
}

interface PenilaianHarianSiswa {
  id: number
  nama: string
  level: string
  daily_status: Record<string, { is_terisi: boolean; catatan: string | null }>
}

interface PenilaianHarianData {
  kelas?: unknown
  siswa: PenilaianHarianSiswa[]
  dates: string[]
}

interface PenilaianDayComp {
  id: number
  nama: string
}

interface PenilaianDayPertemuan {
  tanggal: string
  hari: string
  pertemuan_ke?: number
  scores: (number | null)[]
  sources?: (string | null)[]
}

interface PenilaianDayCat {
  nama_kategori: string
  components: PenilaianDayComp[]
  pertemuan: PenilaianDayPertemuan[]
  summary?: {
    averages?: Record<number, number | null>
    improvements?: Record<number, number | null>
    nilai_akhir?: number | null
    resiko?: string | null
    resiko_class?: string | null
  }
}

interface PenilaianDayData {
  level: string
  siswa: string
  total_pertemuan: number
  categories: PenilaianDayCat[]
}

interface RankItem {
  siswa_id: number
  nama: string
  level: string
  rata_rata: number | null
  total_nilai: number
  rank: number | null
  levels?: { level: string; avg: number | null; total: number }[]
}

const fmtFileSize = (bytes?: number | null) => {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

const optText = (o?: AttemptOption | undefined | null): string =>
  typeof o === 'string' ? o : (o?.text ?? '')

const mediaUrl = (u?: string | null): string => {
  if (!u) return ''
  return /^https?:\/\//.test(u) ? u : `${APP_URL}/storage/${u}`
}

const optImgUrl = (o?: AttemptOption | undefined | null): string => {
  if (!o || typeof o === 'string') return ''
  return mediaUrl(o.image_url || o.image_path || null)
}

const fmtDuration = (startedAt?: string | null, submittedAt?: string | null) => {
  if (!startedAt) return '—'
  const start = new Date(startedAt).getTime()
  const end = submittedAt ? new Date(submittedAt).getTime() : Date.now()
  const sec = Math.max(0, Math.floor((end - start) / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

const fmtDateTime = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const KEHADIRAN_ABBR: Record<string, string> = {
  HADIR: 'H',
  TERLAMBAT: 'T',
  IZIN: 'I',
  SAKIT: 'S',
  ALPA: 'A',
  LIBUR: 'L',
  'TIDAK ABSEN PULANG': 'TP',
}

const KEHADIRAN_BG: Record<string, string> = {
  HADIR: 'bg-emerald-100 text-emerald-700',
  TERLAMBAT: 'bg-amber-100 text-amber-700',
  IZIN: 'bg-blue-100 text-blue-700',
  SAKIT: 'bg-sky-100 text-sky-700',
  ALPA: 'bg-rose-100 text-rose-700',
  LIBUR: 'bg-slate-100 text-slate-700',
  'TIDAK ABSEN PULANG': 'bg-red-100 text-red-700',
}

const KEHADIRAN_OPTIONS: { key: string; label: string; sub: string }[] = [
  { key: 'HADIR', label: 'H', sub: 'Hadir' },
  { key: 'TERLAMBAT', label: 'T', sub: 'Terlambat' },
  { key: 'IZIN', label: 'I', sub: 'Izin' },
  { key: 'SAKIT', label: 'S', sub: 'Sakit' },
  { key: 'ALPA', label: 'A', sub: 'Alpa' },
  { key: 'LIBUR', label: 'L', sub: 'Libur' },
  { key: 'TIDAK ABSEN PULANG', label: 'TP', sub: 'Tidak Absen Pulang' },
]

const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

const toDate = (dateStr: string) => new Date(dateStr.slice(0, 10) + 'T00:00:00')

const formatDayDate = (dateStr: string) => {
  const d = toDate(dateStr)
  return `${dayAbbr[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

const formatTanggalShort = (dateStr: string) => {
  const d = toDate(dateStr)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

const formatDateLongIndo = (dateStr: string) => {
  const d = toDate(dateStr)
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const RESIKO_STYLE: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
}

const SCORE_BADGE = (s: number | null): string => {
  if (s === null) return 'bg-gray-100 text-gray-400'
  if (s >= 90) return 'bg-emerald-100 text-emerald-700'
  if (s >= 75) return 'bg-blue-100 text-blue-700'
  if (s >= 60) return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}

const isWeekend = (dateStr: string) => {
  const day = toDate(dateStr).getDay()
  return day === 0 || day === 6
}

const hasRealContent = (html?: string | null) => {
  if (!html) return false
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent || '').trim().length > 0 || !!el.querySelector('img, iframe, video, audio')
}

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
  ],
}
const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image']

export default function GuruLessonDetail() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [lessonTab, setLessonTab] = useState<'materi' | 'quiz' | 'tugas' | 'rekap' | 'kehadiran' | 'nilai' | 'peringkat'>('materi')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)

  const [showEditModal, setShowEditModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', paket_id: '', sort: '0', status: 'aktif' })
  const [lessonPdf, setLessonPdf] = useState<File | null>(null)
  const [lessonPdfName, setLessonPdfName] = useState<string | null>(null)
  const [lessonPdfSize, setLessonPdfSize] = useState<number | null>(null)
  const [removeLessonPdf, setRemoveLessonPdf] = useState(false)
  const [lessonSlides, setLessonSlides] = useState<LessonSlideItem[]>([])
  const lessonQuillRef = useRef<any>(null)

  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', maxScore: '100', description: '' })
  const [savingTask, setSavingTask] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskFile, setTaskFile] = useState<File | null>(null)
  const [taskPakets, setTaskPakets] = useState<BankPaket[]>([])
  const [showTaskPaketPicker, setShowTaskPaketPicker] = useState(false)
  const [taskBankPakets, setTaskBankPakets] = useState<BankPaket[]>([])
  const [taskBankLoading, setTaskBankLoading] = useState(false)
  const [showQuizManager, setShowQuizManager] = useState(false)
  const [showBankPicker, setShowBankPicker] = useState(false)
  const [bankPakets, setBankPakets] = useState<BankPaket[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankPickedIds, setBankPickedIds] = useState<number[]>([])
  const [assigningBank, setAssigningBank] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const [showMateriPicker, setShowMateriPicker] = useState(false)
  const [bankMateris, setBankMateris] = useState<LmsMateriItem[]>([])
  const [materiBankLoading, setMateriBankLoading] = useState(false)
  const [pickedMateriIds, setPickedMateriIds] = useState<number[]>([])
  const [assigningMateri, setAssigningMateri] = useState(false)
  const [previewPaketId, setPreviewPaketId] = useState<number | null>(null)
  const [togglingPaketId, setTogglingPaketId] = useState<number | null>(null)
  const [togglingPenilaianId, setTogglingPenilaianId] = useState<number | null>(null)
  const [paketQuestionsMap, setPaketQuestionsMap] = useState<Record<number, PaketQuestion[]>>({})
  const [questionsLoading, setQuestionsLoading] = useState(false)

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<PaketQuestion | null>(null)
  const [qForm, setQForm] = useState({ ...emptyQuestionForm })
  const [qOptions, setQOptions] = useState<QuizOptItem[]>([{ text: '', image_path: null, image_url: null }, { text: '', image_path: null, image_url: null }])
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [uploadingOptImg, setUploadingOptImg] = useState<number | null>(null)
  const [uploadingQMedia, setUploadingQMedia] = useState<'image' | 'audio' | null>(null)
  const [qSections, setQSections] = useState<{ id: number; name: string; questions_count?: number }[]>([])
  const [qPaketTitle, setQPaketTitle] = useState('')
  const [editPaketId, setEditPaketId] = useState<number | null>(null)
  const [showSectionInput, setShowSectionInput] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [savingSection, setSavingSection] = useState(false)

  const [recap, setRecap] = useState<RecapData | null>(null)
  const [recapFile, setRecapFile] = useState<File | null>(null)
  const [recapDescription, setRecapDescription] = useState('')
  const [savingRecap, setSavingRecap] = useState(false)
  const [recapInputReset, setRecapInputReset] = useState(0)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rekapNilai, setRekapNilai] = useState<RekapNilaiData | null>(null)
  const [rekapNilaiLoading, setRekapNilaiLoading] = useState(false)

  const [dataSiswaKelas, setDataSiswaKelas] = useState<DataSiswaKelas | null>(null)
  const [kehadiranLoading, setKehadiranLoading] = useState(false)
  const [showAbsenModal, setShowAbsenModal] = useState(false)
  const [editStatusSiswa, setEditStatusSiswa] = useState<DataSiswaItem | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const [penilaianHarian, setPenilaianHarian] = useState<PenilaianHarianData | null>(null)
  const [penilaianLoading, setPenilaianLoading] = useState(false)
  const [showPenilaianModal, setShowPenilaianModal] = useState(false)
  const [penilaianSiswa, setPenilaianSiswa] = useState<PenilaianHarianSiswa | null>(null)
  const [penilaianData, setPenilaianData] = useState<PenilaianDayData | null>(null)
  const [penilaianDataLoading, setPenilaianDataLoading] = useState(false)
  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({})
  const [quizSource, setQuizSource] = useState<Record<number, boolean>>({})
  const [savingPenilaian, setSavingPenilaian] = useState(false)

  const [rankings, setRankings] = useState<RankItem[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)

  const [hasilPaket, setHasilPaket] = useState<{ id: number; title: string } | null>(null)
  const [participants, setParticipants] = useState<ResultParticipant[]>([])
  const [hasilLoading, setHasilLoading] = useState(false)
  const [showAttemptDetail, setShowAttemptDetail] = useState(false)
  const [detail, setDetail] = useState<AttemptDetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reviewSection, setReviewSection] = useState('__all__')

  const loadRekapNilai = (id: number) => {
    setRekapNilaiLoading(true)
    guruLmsApi.lessonRekapNilai(id)
      .then(res => setRekapNilai(res.data))
      .catch(() => setRekapNilai(null))
      .finally(() => setRekapNilaiLoading(false))
  }

  const openQuizResults = (paket: { id: number; title: string }) => {
    setHasilPaket({ id: paket.id, title: paket.title })
    setParticipants([])
    setHasilLoading(true)
    guruQuizApi.results(paket.id, lesson?.course?.kelas_sensei_id ?? undefined)
      .then(res => setParticipants(res.data.participants || []))
      .catch(() => setParticipants([]))
      .finally(() => setHasilLoading(false))
  }

  const openAttemptDetail = (attemptId: number) => {
    setDetail(null)
    setDetailLoading(true)
    setReviewSection('__all__')
    setShowAttemptDetail(true)
    guruQuizApi.attemptDetail(attemptId)
      .then(res => setDetail(res.data))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }

  const confirmResetParticipant = (par: ResultParticipant) => {
    if (!hasilPaket) return
    Swal.fire({
      title: `Reset percobaan ${par.nama}?`,
      text: 'Hapus semua percobaan kandidat ini agar bisa mengerjakan quiz lagi?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, Reset',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (!res.isConfirmed) return
      guruQuizApi.resetAttempts(hasilPaket.id, par.siswa_id)
        .then(r => {
          Swal.fire({ icon: 'success', title: r.data?.message || 'Percobaan direset', timer: 1500, showConfirmButton: false })
          openQuizResults(hasilPaket)
        })
        .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mereset percobaan' }))
    })
  }

  const switchLessonTab = (key: typeof lessonTab) => {
    setLessonTab(key)
    if (key === 'rekap' && lesson) loadRekapNilai(lesson.id)
    if (key === 'kehadiran' && lesson) loadKehadiran(lesson)
    if (key === 'nilai' && lesson) loadPenilaianHarian(lesson)
    if (key === 'peringkat' && lesson) loadRanking(lesson)
  }

  const loadKehadiran = (lesson: LessonDetail) => {
    const kelasId = lesson.course?.kelas_sensei_id
    if (!kelasId) {
      setDataSiswaKelas(null)
      return
    }
    setKehadiranLoading(true)
    guruKelasApi.dataSiswa(kelasId)
      .then(res => setDataSiswaKelas(res.data))
      .catch(() => setDataSiswaKelas(null))
      .finally(() => setKehadiranLoading(false))
  }

  const openStatusModal = (siswa: DataSiswaItem, date: string) => {
    setEditStatusSiswa(siswa)
    setEditStatus(siswa.absensi[date] || '')
    setShowAbsenModal(true)
  }

  const handleSaveStatus = async () => {
    if (!lesson || !editStatusSiswa || !lesson.pertemuan_date || !editStatus) return
    const kelasId = lesson.course?.kelas_sensei_id
    if (!kelasId) return
    setSavingStatus(true)
    try {
      await absensiSiswaApi.store({
        siswa_id: editStatusSiswa.id,
        tanggal: lesson.pertemuan_date.slice(0, 10),
        status: editStatus,
        kelas_sensei_id: kelasId,
      })
      setDataSiswaKelas(prev => {
        if (!prev) return prev
        return {
          ...prev,
          siswa: prev.siswa.map(s =>
            s.id === editStatusSiswa.id
              ? { ...s, absensi: { ...s.absensi, [lesson.pertemuan_date!.slice(0, 10)]: editStatus } }
              : s
          ),
        }
      })
      setShowAbsenModal(false)
      Swal.fire({ icon: 'success', title: 'Kehadiran diperbarui', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan kehadiran' })
    } finally {
      setSavingStatus(false)
    }
  }

  const loadRanking = (lesson: LessonDetail) => {
    const batchId = lesson.course?.batch_id
    if (!batchId) {
      setRankings([])
      return
    }
    setRankingLoading(true)
    guruKelasApi.ranking(batchId)
      .then(res => setRankings(res.data.rankings || []))
      .catch(() => setRankings([]))
      .finally(() => setRankingLoading(false))
  }

  const loadPenilaianHarian = (lesson: LessonDetail) => {
    const kelasId = lesson.course?.kelas_sensei_id
    if (!kelasId) {
      setPenilaianHarian(null)
      return
    }
    setPenilaianLoading(true)
    guruKelasApi.penilaianHarian(kelasId)
      .then(res => setPenilaianHarian(res.data))
      .catch(() => setPenilaianHarian(null))
      .finally(() => setPenilaianLoading(false))
  }

  const openPenilaianModal = async (siswa: PenilaianHarianSiswa) => {
    if (!lesson || !lesson.pertemuan_date || !lesson.course?.level) return
    if (!lesson.course?.kelas_sensei_id) return
    const tanggal = lesson.pertemuan_date.slice(0, 10)
    setPenilaianSiswa(siswa)
    setShowPenilaianModal(true)
    setPenilaianData(null)
    setPenilaianDataLoading(true)
    setScoreInputs({})
    setQuizSource({})
    try {
      const res = await penilaianApi.dayDetail({
        siswa_id: siswa.id,
        level: String(lesson.course.level),
        kelas_sensei_id: lesson.course.kelas_sensei_id,
        tanggal,
      })
      const data = res.data as PenilaianDayData | null
      setPenilaianData(data)
      const inputs: Record<number, string> = {}
      const qsrc: Record<number, boolean> = {}
      if (data?.categories) {
        for (const cat of data.categories) {
          const lastPt = cat.pertemuan.length > 0 ? cat.pertemuan[cat.pertemuan.length - 1] : null
          if (lastPt) {
            const sources = lastPt.sources ?? []
            cat.components.forEach((comp, idx) => {
              const val = idx < lastPt.scores.length ? lastPt.scores[idx] : null
              if (val !== null) inputs[comp.id] = String(val)
              if (idx < sources.length && sources[idx] === 'quiz') qsrc[comp.id] = true
            })
          }
        }
      }
      setScoreInputs(inputs)
      setQuizSource(qsrc)
    } catch {
      setPenilaianData(null)
    } finally {
      setPenilaianDataLoading(false)
    }
  }

  const handleSavePenilaian = async () => {
    if (!lesson || !penilaianSiswa || !penilaianData) return
    if (!lesson.pertemuan_date || !lesson.course?.kelas_sensei_id) return
    const kelasId = lesson.course.kelas_sensei_id
    const tanggal = lesson.pertemuan_date.slice(0, 10)
    setSavingPenilaian(true)
    try {
      const scores = Object.entries(scoreInputs)
        .filter(([, val]) => val !== '')
        .map(([compId, val]) => ({
          component_id: Number(compId),
          nilai: val ? Number(val) : null,
        }))
      await penilaianApi.storeStudentAssessment({
        siswa_id: penilaianSiswa.id,
        batch_id: lesson.course.batch_id ?? undefined,
        kelas_sensei_id: kelasId,
        tanggal,
        scores,
      })
      await guruKelasApi.simpanPenilaianHarian({
        siswa_id: penilaianSiswa.id,
        kelas_sensei_id: kelasId,
        tanggal,
        is_terisi: true,
      })
      setPenilaianHarian(prev => {
        if (!prev) return prev
        return {
          ...prev,
          siswa: prev.siswa.map(s =>
            s.id === penilaianSiswa.id
              ? { ...s, daily_status: { ...s.daily_status, [tanggal]: { is_terisi: true, catatan: null } } }
              : s
          ),
        }
      })
      setShowPenilaianModal(false)
      Swal.fire({ icon: 'success', title: 'Penilaian tersimpan', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan penilaian' })
    } finally {
      setSavingPenilaian(false)
    }
  }

  const loadLesson = (id: number) => guruLmsApi.lessonDetail(id).then(res => {
    setLesson(res.data.lesson)
    const r = res.data.lesson.recap || null
    setRecap(r)
    setRecapDescription(r?.description || '')
    setRecapFile(null)
  })
  const loadTasks = (courseId: number, lessonId?: number | null) => assignmentApi.list(courseId, lessonId).then((t: any) => setTasks(t.data.assignments || [])).catch(() => setTasks([]))

  const openBankPicker = () => {
    setBankPickedIds([])
    setBankSearch('')
    setShowBankPicker(true)
    setBankLoading(true)
    guruQuizApi.bankPakets()
      .then(res => {
        const all = res.data.pakets || []
        const lvl = lesson?.course?.level
        setBankPakets(lvl ? all.filter((p: BankPaket) => !p.level || String(p.level) === String(lvl)) : all)
      })
      .catch(() => setBankPakets([]))
      .finally(() => setBankLoading(false))
  }

  const pickBankPaket = (id: number) => {
    setBankPickedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const assignBankPaket = async () => {
    if (!lesson || bankPickedIds.length === 0) return
    setAssigningBank(true)
    try {
      for (const id of bankPickedIds) {
        await guruLmsApi.attachLessonPaket(lesson.id, id)
      }
      setShowBankPicker(false)
      setBankPickedIds([])
      await loadLesson(lesson.id)
      loadRekapNilai(lesson.id)
      Swal.fire({ icon: 'success', title: `${bankPickedIds.length} paket soal dipasang ke pertemuan ini`, timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal memasang paket soal' })
    } finally {
      setAssigningBank(false)
    }
  }

  const openMateriPicker = () => {
    setPickedMateriIds([])
    setShowMateriPicker(true)
    setMateriBankLoading(true)
    guruMateriApi.bank()
      .then(res => {
        setBankMateris(res.data.materials || [])
      })
      .catch(() => setBankMateris([]))
      .finally(() => setMateriBankLoading(false))
  }

  const pickMateri = (id: number) => {
    setPickedMateriIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const assignMateri = async () => {
    if (!lesson || pickedMateriIds.length === 0) return
    setAssigningMateri(true)
    try {
      await guruMateriApi.attachLesson(lesson.id, pickedMateriIds)
      setShowMateriPicker(false)
      setPickedMateriIds([])
      await loadLesson(lesson.id)
      Swal.fire({ icon: 'success', title: `${pickedMateriIds.length} materi dipasang ke pertemuan ini`, timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal memasang materi' })
    } finally {
      setAssigningMateri(false)
    }
  }

  const handleRemoveMateri = async (materiId: number) => {
    if (!lesson) return
    const conf = await Swal.fire({
      title: 'Lepas materi ini?',
      text: 'Materi tetap tersimpan di bank materi. Materi pertemuan ini akan menghilang untuk siswa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Lepas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    })
    if (!conf.isConfirmed) return
    try {
      await guruMateriApi.detachLesson(lesson.id, materiId)
      await loadLesson(lesson.id)
      Swal.fire({ icon: 'success', title: 'Materi dilepas dari pertemuan', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal melepas materi' })
    }
  }

  const lessonMateris = lesson?.link_materis || []

  const handleRemovePaket = async (paketId: number) => {
    if (!lesson) return
    const conf = await Swal.fire({
      title: 'Lepas paket ini?',
      text: 'Paket tetap tersimpan di bank soal. Quiz pertemuan ini akan menghilang untuk siswa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Lepas',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    })
    if (!conf.isConfirmed) return
    try {
      await guruLmsApi.detachLessonPaket(lesson.id, paketId)
      setPreviewPaketId(prev => prev === paketId ? null : prev)
      setPaketQuestionsMap(m => {
        const next = { ...m }
        delete next[paketId]
        return next
      })
      await loadLesson(lesson.id)
      loadRekapNilai(lesson.id)
      Swal.fire({ icon: 'success', title: 'Paket dilepas dari pertemuan', timer: 1400, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal melepas paket soal' })
    }
  }

  const handleTogglePaketStatus = async (paket: { id: number; pivot?: { status?: string } }) => {
    if (!lesson || !paket.pivot) return
    const next = paket.pivot.status === 'aktif' ? 'nonaktif' : 'aktif'
    setTogglingPaketId(paket.id)
    try {
      await guruLmsApi.setLessonPaketStatus(lesson.id, paket.id, next)
      await loadLesson(lesson.id)
      Swal.fire({
        icon: 'success',
        title: next === 'aktif' ? 'Quiz diaktifkan' : 'Quiz dinonaktifkan',
        text: next === 'aktif' ? 'Quiz kini tampil untuk siswa.' : 'Siswa tidak akan melihat/tidak bisa mengerjakan quiz ini.',
        timer: 1600,
        showConfirmButton: false,
      })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal mengubah status quiz' })
    } finally {
      setTogglingPaketId(null)
    }
  }

  const handleTogglePaketPenilaian = async (paket: { id: number; pivot?: { status?: string; penilaian_ulangan?: boolean } }) => {
    if (!lesson || !paket.pivot) return
    const next = !paket.pivot.penilaian_ulangan
    const tanggal = lesson.pertemuan_date_label
    const ok = await Swal.fire({
      title: next ? 'Masuk ke Penilaian Ulangan?' : 'Matikan masuk penilaian ulangan?',
      text: next
        ? `Skor terbaik siswa dari quiz ini otomatis terisi di Penilaian Ulangan pada ${tanggal ?? 'tanggal pertemuan'}. Siswa yang mengerjakan berikutnya juga ikut terisi secara otomatis.`
        : 'Skor quiz tidak lagi diperbarui ke Penilaian Ulangan, tapi nilai yang sudah terisi tetap tersimpan.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0E6187',
      confirmButtonText: next ? 'Aktifkan' : 'Matikan',
      cancelButtonText: 'Batal',
    })
    if (!ok.isConfirmed) return
    setTogglingPenilaianId(paket.id)
    try {
      const res = await guruLmsApi.setLessonPaketPenilaian(lesson.id, paket.id, next)
      await loadLesson(lesson.id)
      Swal.fire({ icon: 'success', title: next ? 'Aktif masuk penilaian' : 'Dinonaktifkan', text: res.data?.message, timer: 2200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan pengaturan penilaian' })
    } finally {
      setTogglingPenilaianId(null)
    }
  }

  const handleRecapFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setRecapFile(file)
  }

  const handleSaveRecap = async () => {
    if (!lesson) return
    if (!recapFile && !recapDescription.trim()) {
      Swal.fire({ icon: 'warning', title: 'Upload foto/PDF atau isi deskripsi dulu' })
      return
    }
    setSavingRecap(true)
    try {
      const fd = new FormData()
      if (recapFile) fd.append('file', recapFile)
      if (recapDescription.trim()) fd.append('description', recapDescription.trim())
      const res = await guruLmsApi.storeLessonRecap(lesson.id, fd)
      setRecap(res.data.recap || null)
      setRecapInputReset(n => n + 1)
      setRecapFile(null)
      Swal.fire({ icon: 'success', title: 'Rekap pertemuan disimpan', timer: 1400, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan rekap pertemuan' })
    } finally {
      setSavingRecap(false)
    }
  }

  const handleDeleteRecap = async () => {
    if (!lesson) return
    const conf = await Swal.fire({
      title: 'Hapus rekap pertemuan?',
      text: 'Foto/PDF dan deskripsi akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
    })
    if (!conf.isConfirmed) return
    try {
      await guruLmsApi.deleteLessonRecap(lesson.id)
      setRecap(null)
      setRecapDescription('')
      setRecapFile(null)
      setRecapInputReset(n => n + 1)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus rekap' })
    }
  }

  const toggleQuizPreview = async (paketId: number) => {
    if (previewPaketId === paketId) {
      setPreviewPaketId(null)
      return
    }
    setPreviewPaketId(paketId)
    if (paketQuestionsMap[paketId]) return
    if (!lesson) return
    setQuestionsLoading(true)
    try {
      const res = await guruLmsApi.lessonPaketQuestions(lesson.id, paketId)
      setPaketQuestionsMap(m => ({ ...m, [paketId]: res.data.questions || [] }))
    } catch {
      setPaketQuestionsMap(m => ({ ...m, [paketId]: [] }))
    } finally {
      setQuestionsLoading(false)
    }
  }

  const openEditPaketQuestion = (paketId: number, q: PaketQuestion, paketTitle: string) => {
    setEditingQuestion(q)
    setEditPaketId(paketId)
    setQPaketTitle(paketTitle)
    setQForm({
      question: q.question ?? '',
      section_id: q.section_id != null ? String(q.section_id) : '',
      question_type: q.question_type === 'rating' ? 'rating' : q.question_type === 'essay' ? 'essay' : 'choice',
      rating_max: q.rating_max ? q.rating_max.toString() : '9',
      correct_index: q.correct_index?.toString() ?? '',
      points: q.points != null ? q.points.toString() : '1',
      keyword: q.keyword || '',
      image_path: q.image_path || '', image_url: q.image_url || '',
      audio_path: q.audio_path || '', audio_url: q.audio_url || '',
      audio_max_plays: q.audio_max_plays != null ? q.audio_max_plays.toString() : '2',
    })
    const seed = q.question_type === 'rating'
      ? Array.from({ length: q.rating_max || 9 }, (_, i) => String(i + 1))
      : (q.options || [])
    setQOptions(seed.map(o => typeof o === 'string'
      ? { text: o, image_path: null, image_url: null }
      : { text: o?.text ?? '', image_path: o?.image_path || null, image_url: o?.image_url || null }))
    setQSections([])
    setShowSectionInput(false)
    setNewSectionName('')
    guruQuizApi.sections(paketId)
      .then(res => setQSections(res.data.sections || []))
      .catch(() => setQSections([]))
    setShowQuestionModal(true)
  }

  const uploadOptionImage = (file: File | undefined, oi: number) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa gambar' }); return
    }
    const fd = new FormData()
    fd.append('file', file)
    setUploadingOptImg(oi)
    guruQuizApi.uploadMedia(fd)
      .then(res => {
        setQOptions(prev => prev.map((o, i) => i === oi ? { ...o, image_path: res.data.path, image_url: res.data.url } : o))
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengunggah gambar opsi' }))
      .finally(() => setUploadingOptImg(null))
  }

  const uploadQuestionMedia = (file: File | undefined, type: 'image' | 'audio') => {
    if (!file) return
    if (type === 'image' && !file.type.startsWith('image/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa gambar' }); return
    }
    if (type === 'audio' && !file.type.startsWith('audio/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa audio' }); return
    }
    const fd = new FormData()
    fd.append('file', file)
    setUploadingQMedia(type)
    guruQuizApi.uploadMedia(fd)
      .then(res => {
        setQForm(prev => ({
          ...prev,
          [`${type}_path`]: res.data.path,
          [`${type}_url`]: res.data.url,
        }))
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengunggah media' }))
      .finally(() => setUploadingQMedia(null))
  }

  const saveEditedQuestion = async () => {
    if (!editingQuestion) return
    const isRating = qForm.question_type === 'rating'
    const isEssay = qForm.question_type === 'essay'
    let opts: unknown[]
    if (isEssay) {
      opts = []
    } else if (isRating) {
      const ratingMax = Math.min(10, Math.max(2, Number(qForm.rating_max) || 9))
      opts = Array.from({ length: ratingMax }, (_, i) => String(i + 1))
    } else {
      opts = qOptions
        .map(o => ({ text: o.text.trim(), image_path: o.image_path || null }))
        .filter(o => o.text || o.image_path)
      if (opts.length < 2) {
        Swal.fire({ icon: 'warning', title: 'Minimal 2 opsi jawaban (isi teks atau unggah gambar)' })
        return
      }
      if (qForm.correct_index === '' || Number(qForm.correct_index) >= opts.length) {
        Swal.fire({ icon: 'warning', title: 'Pilih jawaban benar yang valid' })
        return
      }
    }
    setSavingQuestion(true)
    try {
      await guruQuizApi.updateQuestion(editingQuestion.id, {
        question: qForm.question ?? '',
        section_id: qForm.section_id ? Number(qForm.section_id) : null,
        question_type: isEssay ? 'essay' : isRating ? 'rating' : 'choice',
        rating_max: isRating ? Number(qForm.rating_max) || 9 : null,
        options: opts,
        correct_index: isEssay ? null : isRating ? null : Number(qForm.correct_index),
        keyword: isEssay ? (qForm.keyword.trim() || null) : null,
        points: Number(qForm.points) || 1,
        image_path: qForm.image_path || null,
        audio_path: qForm.audio_path || null,
        audio_max_plays: qForm.audio_path ? (Number(qForm.audio_max_plays) || null) : null,
      })
      setShowQuestionModal(false)
      if (lesson) {
        const previewPid = previewPaketId
        const res = await guruLmsApi.lessonPaketQuestions(lesson.id, previewPid!)
        setPaketQuestionsMap(m => ({ ...m, [previewPid!]: res.data.questions || [] }))
      }
      Swal.fire({ icon: 'success', title: 'Soal diperbarui', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan soal' })
    } finally {
      setSavingQuestion(false)
    }
  }

  const createSection = async () => {
    const name = newSectionName.trim()
    if (!name) {
      Swal.fire({ icon: 'warning', title: 'Nama bagian wajib diisi' })
      return
    }
    if (editPaketId == null) return
    setSavingSection(true)
    try {
      const res = await guruQuizApi.storeSection(editPaketId, { name })
      setQSections(prev => [...prev, res.data.section])
      setQForm(f => ({ ...f, section_id: String(res.data.section.id) }))
      setNewSectionName('')
      setShowSectionInput(false)
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menambahkan bagian' })
    } finally {
      setSavingSection(false)
    }
  }

  const renderQuizPreview = (paketId: number) => {
    if (previewPaketId !== paketId) return null
    const qs = paketQuestionsMap[paketId]
    if (questionsLoading && qs === undefined) {
      return (
        <div className="mt-3 flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
          <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat soal...
        </div>
      )
    }
    if (!qs || qs.length === 0) {
      return (
        <div className="mt-3 px-4 py-6 bg-[#F4F5F8] rounded-md text-center text-[11px] text-[#8B90A0] font-medium">
          Paket ini belum punya soal. Tambahkan soal lewat halaman Paket Soal (bank) atau pilih paket lain dari bank.
        </div>
      )
    }
    return (
      <div className="mt-3 space-y-2.5">
        {qs.map((q, i) => (
          <div key={q.id} className="bg-white rounded-md border border-[#E5E7EF] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold text-[#14182B] leading-snug">{i + 1}. {q.question}</p>
              {canManage && (
                <button
                  onClick={() => openEditPaketQuestion(paketId, q, lessonPakets.find(p => p.id === paketId)?.title || '')}
                  className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-[#0069b0] bg-[#0069b0]/5 px-2 py-1 rounded-md hover:bg-[#0069b0]/10 transition-colors"
                  title="Edit soal ini">
                  <Edit3 size={11} /> Edit
                </button>
              )}
            </div>
            {q.section?.name && (
              <span className="mt-2 inline-block rounded-full bg-[#0069b0]/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0069b0]">{q.section.name}</span>
            )}
            {(q.image_url || q.audio_url) && (
              <div className="mt-2 space-y-2">
                {q.image_url && (
                  <div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0069b0] uppercase tracking-wide mb-1"><ImageIcon size={10} /> Soal Gambar</span>
                    <img src={mediaUrl(q.image_url)} alt="Gambar soal" className="w-full max-h-44 object-contain rounded-md border border-[#E5E7EF] bg-[#F4F5F8]" />
                  </div>
                )}
                {q.audio_url && (
                  <div>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0069b0] uppercase tracking-wide mb-1"><Volume2 size={10} /> Soal Suara{q.audio_max_plays != null ? ` · maks ${q.audio_max_plays}x` : ''}</span>
                    <audio src={mediaUrl(q.audio_url)} controls className="w-full h-9" />
                  </div>
                )}
              </div>
            )}
            <div className="mt-2 space-y-1.5">
              {q.question_type === 'rating' ? (
                <div className="flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-md bg-violet-50 text-violet-700 font-bold">
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold shrink-0">SKALA</span>
                  <span>Rating 1–{q.rating_max || q.options.length}</span>
                  <span className="ml-auto text-[9.5px] font-bold text-violet-400 shrink-0">TANPA KUNCI</span>
                </div>
              ) : (q.options.map((opt, oi) => {
                const optLabel = typeof opt === 'string' ? opt : (opt?.text ?? '')
                const optRaw = typeof opt === 'string' ? null : (opt?.image_url || opt?.image_path || null)
                const optUrl = optRaw && !optRaw.startsWith('http') ? `${APP_URL}/storage/${optRaw}` : optRaw
                return (
                  <div key={oi} className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-md ${oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-[#F4F5F8] text-[#4B5063] font-medium'}`}>
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${oi === q.correct_index ? 'bg-emerald-500 text-white' : 'bg-[#E5E7EF] text-[#8B90A0]'}`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {optUrl && <img src={optUrl} className="h-6 w-6 rounded object-cover shrink-0" alt="" />}
                    {optLabel && <span>{optLabel}</span>}
                    {oi === q.correct_index && <span className="ml-auto text-[9px] font-bold text-emerald-500 shrink-0">BENAR</span>}
                  </div>
                )
              }))}
            </div>
            <p className="text-[10px] text-[#8B90A0] font-semibold mt-2">Skor: {q.points} poin</p>
          </div>
        ))}
      </div>
    )
  }

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    guruLmsApi.lessonDetail(Number(lessonId)).then(res => {
      const l = res.data.lesson
      setLesson(l)
      loadRekapNilai(l.id)
      return loadTasks(l.course_id, l.id)
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal memuat pertemuan' })
      navigate('/guru-lms')
    }).finally(() => setLoading(false))
  }, [lessonId, navigate])

  const openEditLesson = () => {
    if (!lesson) return
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      paket_id: lesson.paket_id ? String(lesson.paket_id) : '',
      sort: lesson.sort.toString(),
      status: lesson.status,
    })
    setLessonPdf(null)
    setLessonPdfName(lesson.file_name || null)
    setLessonPdfSize(lesson.file_size || null)
    setRemoveLessonPdf(false)
    setLessonSlides((lesson.slides || []).map(s => ({
      key: `existing-${s.id}`,
      id: s.id,
      url: s.url || `${APP_URL}/storage/${s.file_path}`,
      name: s.file_name || 'slide',
    })))
    setShowEditModal(true)
  }

  const handleSaveLesson = async () => {
    if (!lesson || !lessonForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul materi wajib diisi' })
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', lessonForm.title)
      fd.append('content', lessonForm.content)
      fd.append('video_url', lessonForm.video_url)
      fd.append('paket_id', lessonForm.paket_id)
      fd.append('sort', lessonForm.sort || '0')
      fd.append('status', lessonForm.status)
      if (lessonPdf) fd.append('file', lessonPdf)
      if (removeLessonPdf) fd.append('remove_file', '1')
      lessonSlides.filter(s => s.file).forEach(s => { if (s.file) fd.append('slides[]', s.file) })
      const existing = new Set((lesson.slides || []).map(s => s.id))
      ;(lesson.slides || []).filter(s => !lessonSlides.some(n => n.id === s.id) && existing.has(s.id))
        .forEach(s => fd.append('remove_slides[]', String(s.id)))
      await guruLmsApi.updateLesson(lesson.id, fd)
      await loadLesson(lesson.id)
      setShowEditModal(false)
      Swal.fire({ icon: 'success', title: 'Materi diperbarui', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan materi' })
    } finally {
      setSaving(false)
    }
  }

  const toggleTaskPaketPicker = () => {
    setShowTaskPaketPicker(v => {
      const next = !v
      if (next && taskBankPakets.length === 0) {
        setTaskBankLoading(true)
        guruQuizApi.bankPakets()
          .then(res => {
            const all = res.data.pakets || []
            const lvl = lesson?.course?.level
            setTaskBankPakets(lvl ? all.filter((p: BankPaket) => !p.level || String(p.level) === String(lvl)) : all)
          })
          .catch(() => setTaskBankPakets([]))
          .finally(() => setTaskBankLoading(false))
      }
      return next
    })
  }

  const isTaskPaketSelected = (id: number) => taskPakets.some(p => p.id === id)

  const toggleTaskPaket = (p: BankPaket) => {
    setTaskPakets(prev =>
      prev.some(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p]
    )
  }

  const handleSaveTask = async () => {
    if (!lesson || !taskForm.title.trim()) return
    setSavingTask(true)
    try {
      const fd = new FormData()
      fd.append('course_id', String(lesson.course_id))
      fd.append('lesson_id', String(lesson.id))
      fd.append('title', taskForm.title)
      if (taskForm.description) fd.append('description', taskForm.description)
      if (taskForm.dueDate) fd.append('due_date', taskForm.dueDate)
      if (taskForm.maxScore) fd.append('max_score', taskForm.maxScore)
      if (taskFile) fd.append('file', taskFile)
      taskPakets.forEach(p => fd.append('pakets[]', String(p.id)))
      await assignmentApi.store(fd)
      setTaskForm({ title: '', dueDate: '', maxScore: '100', description: '' })
      setTaskFile(null)
      setTaskPakets([])
      setShowTaskPaketPicker(false)
      setShowTaskModal(false)
      await loadTasks(lesson.course_id, lesson.id)
      Swal.fire({ icon: 'success', title: 'Tugas ditambahkan', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menambah tugas' })
    } finally {
      setSavingTask(false)
    }
  }

  const handleDeleteTask = (t: TaskItem) => {
    Swal.fire({
      title: 'Hapus tugas?',
      text: `"${t.title}" akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    }).then(async r => {
      if (!r.isConfirmed || !lesson) return
      try {
        await assignmentApi.delete(t.id)
        await loadTasks(lesson.course_id, lesson.id)
      } catch {
        Swal.fire({ icon: 'error', title: 'Gagal menghapus tugas' })
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center pb-24">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0069b0]/10 border-t-[#0069b0] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!lesson) return null

  const canManage = !!lesson.course?.can_manage
  const slides = (lesson.slides || []).map(s => ({ id: s.id, name: s.file_name || 'slide', url: s.url || `${APP_URL}/storage/${s.file_path}` }))
  const lessonPakets: LessonPaketItem[] = [
    ...(lesson.paket ? [{ ...lesson.paket, pivot: undefined as LessonPaketItem['pivot'] }] : []),
    ...(lesson.link_pakets || []),
  ]
    .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
  const quizCount = lessonPakets.length > 0 ? lessonPakets.length : undefined

  const rekapNilaiStats = rekapNilai && rekapNilai.pakets.length > 0
    ? (() => {
        const done = rekapNilai.siswa.filter(s => s.scores.some(sc => sc?.best_score != null)).length
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
      })()
    : null

  const reviewSections: { id: number | null; name: string; count: number }[] = (() => {
    if (!detail) return []
    if (detail.sections && detail.sections.length) return detail.sections
    const map = new Map<string, number>()
    detail.questions.forEach(q => {
      const name = q.section?.name?.trim() || 'Umum'
      map.set(name, (map.get(name) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({ id: null, name, count }))
  })()
  const activeReviewSection = reviewSection === '__all__' ? null : reviewSection
  const reviewQuestions = detail
    ? (activeReviewSection == null
        ? detail.questions
        : detail.questions.filter(q => (q.section?.name?.trim() || 'Umum') === activeReviewSection))
    : []
  const reviewSectionOrder = new Map<string, number>()
  reviewSections.forEach((s, i) => reviewSectionOrder.set(s.name, i))
  const reviewNumbered = reviewQuestions
    .map(q => ({ q, no: 0, sec: q.section?.name?.trim() || 'Umum' }))
    .sort((a, b) => (reviewSectionOrder.get(a.sec) ?? 9999) - (reviewSectionOrder.get(b.sec) ?? 9999))
  reviewNumbered.forEach((item, i) => { item.no = i + 1 })
  const reviewGroups: { name: string; items: { q: AttemptDetailQuestion; no: number }[] }[] = []
  reviewNumbered.forEach(item => {
    const last = reviewGroups[reviewGroups.length - 1]
    if (last && last.name === item.sec) last.items.push(item)
    else reviewGroups.push({ name: item.sec, items: [item] })
  })
  const reviewTotal = detail?.questions.length || 0

  const renderReviewQuestion = ({ q, no }: { q: AttemptDetailQuestion; no: number }) => {
    const badge = q.question_type === 'rating'
      ? (q.selected_index != null ? 'TERISI' : 'TIDAK DIISI')
      : q.question_type === 'essay'
        ? (q.is_correct === null && q.answer_text?.trim() ? 'BELUM DINILAI' : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB')
        : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'
    const badgeCls = badge === 'BENAR' ? 'bg-emerald-50 text-emerald-600'
      : badge === 'SALAH' ? 'bg-red-50 text-red-500'
      : badge === 'BELUM DINILAI' ? 'bg-amber-50 text-amber-600'
      : badge === 'TERISI' ? 'bg-violet-50 text-violet-600'
      : 'bg-gray-100 text-[#8B90A0]'
    return (
      <div key={q.id} className="border border-[#E5E7EF] rounded-md p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-bold text-[#14182B] leading-snug">{no}. {q.question}</p>
          <span className={`text-[9px] font-bold shrink-0 px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
        </div>
        {(q.image_url || q.audio_url) && (
          <div className="mt-2 space-y-2">
            {q.image_url && (
              <div>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#0069b0] uppercase tracking-wide mb-1"><ImageIcon size={10} /> Soal Gambar</span>
                <img src={mediaUrl(q.image_url)} alt="Gambar soal" className="w-full max-h-44 object-contain rounded-md border border-[#E5E7EF] bg-[#F4F5F8]" />
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
                  const isPilih = q.selected_index === oi
                  return (
                    <span key={oi} className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold border-2 ${isPilih ? 'border-violet-500 bg-violet-500 text-white' : 'border-[#E5E7EF] bg-[#F4F5F8] text-[#8B90A0]'}`}>
                      {optText(opt)}
                    </span>
                  )
                })}
              </div>
              <p className="text-[10px] text-[#8B90A0] font-medium mt-1.5">
                Jawaban: <span className="font-bold text-violet-600">
                  {q.selected_index != null && q.options[q.selected_index]
                    ? optText(q.options[q.selected_index]) : 'Tidak diisi'}
                </span>
              </p>
            </div>
          ) : q.question_type === 'essay' ? (
            <div>
              <p className="text-[10px] font-bold text-[#4B5063] mb-1.5">Jawaban Kandidat</p>
              <p className="text-[11px] text-[#14182B] bg-[#F4F5F8] border border-[#E5E7EF] rounded-md px-3 py-2.5 whitespace-pre-wrap min-h-[44px]">
                {q.answer_text?.trim() ? q.answer_text : <span className="text-[#8B90A0]">Tidak diisi</span>}
              </p>
              {q.keyword && (
                <p className="text-[10px] text-amber-600 font-medium mt-1.5"><span className="font-bold">Kata kunci:</span> {q.keyword}</p>
              )}
              {q.points != null && (
                <p className={`inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-full ${
                  q.earned_points != null ? (q.is_correct === true ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600') : 'bg-[#F4F5F8] text-[#8B90A0]'
                }`}>
                  {q.earned_points != null ? `Nilai: ${q.earned_points}/${q.points} poin` : 'Belum dinilai'}
                </p>
              )}
            </div>
          ) : (q.options || []).map((opt, oi) => {
            const isKunci = q.correct_index === oi
            const isPilih = q.selected_index === oi
            return (
              <div key={oi}
                className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-md font-medium ${isKunci ? 'bg-emerald-50 text-emerald-700 font-bold' : isPilih ? 'bg-red-50 text-red-500 font-bold' : 'bg-[#F4F5F8] text-[#4B5063]'}`}>
                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${isKunci ? 'bg-emerald-500 text-white' : isPilih ? 'bg-red-500 text-white' : 'bg-[#E5E7EF] text-[#8B90A0]'}`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                {optImgUrl(opt) && <img src={optImgUrl(opt)} className="h-5 w-5 rounded-md object-cover shrink-0" alt="" />}
                {optText(opt) && <span className="flex-1">{optText(opt)}</span>}
                {isKunci && <span className="text-[9px] font-bold shrink-0">KUNCI</span>}
                {isPilih && <span className="text-[9px] font-bold shrink-0">JAWABAN</span>}
              </div>
            )
          })}
        </div>
        {q.points != null && q.question_type !== 'essay' && (
          <p className="text-[10px] text-[#8B90A0] font-semibold mt-2">Poin: {q.points}</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate('/guru-lms')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors">
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#0069b0]" />
            <h1 className="text-sm font-bold text-[#14182B]">Pertemuan</h1>
          </div>
          <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${lesson.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
            {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-3">
        {/* Lesson header */}
        <div className="bg-white rounded-md border border-[#E5E7EF] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#14182B]">{lesson.title}</h2>
              <p className="text-[11px] text-[#8B90A0] font-medium mt-1">
                {lesson.course?.title || 'Kursus tidak diketahui'}
                {lesson.course?.level ? ` · Level ${lesson.course.level}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Sub menu tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {([
            { key: 'materi' as 'materi', label: 'Materi', icon: BookOpen, count: undefined as number | undefined },
            { key: 'quiz' as 'quiz', label: 'Quiz', icon: HelpCircle, count: quizCount },
            { key: 'tugas' as 'tugas', label: 'Tugas', icon: ClipboardList, count: tasks.length },
            { key: 'rekap' as 'rekap', label: 'Rekap', icon: Camera, count: recap ? 1 : undefined },
            { key: 'kehadiran' as 'kehadiran', label: 'Kehadiran', icon: Calendar, count: undefined },
            { key: 'nilai' as 'nilai', label: 'Nilai', icon: BarChart3, count: undefined },
            { key: 'peringkat' as 'peringkat', label: 'Peringkat', icon: Trophy, count: undefined },
          ]).map(tab => (
            <button key={tab.key} onClick={() => switchLessonTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-3 rounded-md border text-[11px] font-bold transition-colors ${
                lessonTab === tab.key
                  ? 'border-[#0069b0] text-[#0069b0] bg-[#0069b0]/[0.04]'
                  : 'border-[#E5E7EF] bg-white text-[#4B5063] hover:border-[#D6D9E1] hover:text-[#14182B]'
              }`}>
              <tab.icon size={15} />
              <span className="truncate">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                  lessonTab === tab.key ? 'bg-[#0069b0]/10 text-[#0069b0]' : 'bg-gray-100 text-[#8B90A0]'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Materi */}
        {lessonTab === 'materi' && (
        <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-[#0069b0]" />
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Materi</h3>
            </div>
            {canManage && (
              <button onClick={openEditLesson}
                className="flex items-center gap-1 text-[10px] font-bold text-[#0069b0] hover:underline">
                <Edit3 size={10} /> Edit
              </button>
            )}
          </div>
          <div className="p-5 space-y-4">
            {lesson.video_url && (
              <div className="aspect-video bg-black rounded-md overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(lesson.video_url) || lesson.video_url}
                  className="w-full h-full" allowFullScreen title="Video Materi" />
              </div>
            )}
            {lesson.content ? (
              <div className="text-xs text-[#4B5063] leading-relaxed [&_img]:max-w-full [&_iframe]:w-full"
                dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              !lesson.video_url && (
                <p className="text-xs text-[#C5C8D4] text-center py-4">Belum ada materi konten untuk pertemuan ini</p>
              )
            )}
            {lesson.file_path && (
              <a href={`${APP_URL}/storage/${lesson.file_path}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 border border-[#E5E7EF] rounded-md p-3 bg-[#F4F5F8]">
                <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#4B5063] truncate">{lesson.file_name}</p>
                  <p className="text-[10px] text-[#8B90A0]">{fmtFileSize(lesson.file_size)} · PDF</p>
                </div>
                <span className="text-[11px] font-bold text-[#0069b0] flex items-center gap-1">
                  <Download size={12} /> Buka
                </span>
              </a>
            )}
            {slides.length > 0 && <LessonSlidesViewer slides={slides} />}

            <div className="border-t border-[#E5E7EF] pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#0069b0]" />
                  <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Materi dari Bank</h3>
                  <span className="text-[10px] font-bold text-[#8B90A0]">{lessonMateris.length} materi</span>
                </div>
                {canManage && (
                  <button onClick={openMateriPicker}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#0069b0] border border-[#0069b0]/30 bg-[#0069b0]/5 px-3 py-1.5 rounded-md hover:bg-[#0069b0]/10 transition-colors">
                    <Plus size={11} /> Pilih Materi dari Bank
                  </button>
                )}
              </div>

              {lessonMateris.length === 0 ? (
                <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                    <Layers size={18} className="text-[#0069b0]" />
                  </div>
                  <p className="text-xs font-bold text-[#14182B]">Belum ada materi dari bank</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                    Pilih materi/modul &amp; video pembelajaran dari bank materi untuk pertemuan ini
                  </p>
                  {canManage && (
                    <button onClick={openMateriPicker}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-2 rounded-md hover:bg-[#004d7a] transition-colors mx-auto">
                      <Plus size={12} /> Pilih Materi dari Bank
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {lessonMateris.map(m => {
                    const realContent = hasRealContent(m.content)
                    const hasIsi = !!m.video_url || realContent || !!m.file_path || (m.slides && m.slides.length > 0)
                    return (
                      <div key={m.id} className="border border-[#E5E7EF] rounded-md overflow-hidden bg-white">
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#F8F9FB] border-b border-[#E5E7EF]">
                          <div className="w-9 h-9 rounded-md bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                            {m.video_url ? <Video size={15} className="text-[#0069b0]" /> : realContent ? <BookOpen size={15} className="text-[#0069b0]" /> : m.file_path ? <FileText size={15} className="text-[#0069b0]" /> : <Layers size={15} className="text-[#0069b0]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#14182B] truncate">{m.title}</p>
                            <div className="flex items-center gap-2.5 mt-0.5">
                              {m.video_url && <span className="text-[10px] text-[#8B90A0] flex items-center gap-1"><Video size={9} /> Video</span>}
                              {realContent && <span className="text-[10px] text-[#8B90A0] flex items-center gap-1"><BookOpen size={9} /> Materi</span>}
                              {m.file_name && <span className="text-[10px] text-[#8B90A0] flex items-center gap-1"><FileText size={9} /> PDF</span>}
                              {m.slides && m.slides.length > 0 && <span className="text-[10px] text-[#8B90A0] flex items-center gap-1"><ImageIcon size={9} /> {m.slides.length} slide</span>}
                              {m.status !== 'aktif' && (
                                <span className="text-[9px] font-bold text-amber-600">Nonaktif</span>
                              )}
                            </div>
                          </div>
                          {canManage && (
                            <button onClick={() => handleRemoveMateri(m.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-red-50 hover:bg-red-100 transition-colors shrink-0"
                              title="Lepas materi dari pertemuan">
                              <Trash2 size={13} className="text-red-500" />
                            </button>
                          )}
                        </div>
                        <div className="p-4 space-y-3">
                          {m.video_url && (
                            <div className="aspect-video bg-black rounded-md overflow-hidden">
                              <iframe
                                src={getYouTubeEmbedUrl(m.video_url) || m.video_url}
                                className="w-full h-full" allowFullScreen title={m.title} />
                            </div>
                          )}
                          {realContent && (
                            <div className="text-sm text-[#4B5063] leading-relaxed
                              [&_img]:max-w-full [&_img]:rounded-md [&_img]:my-3 [&_img]:shadow-sm
                              [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-md
                              [&_a]:text-[#0069b0] [&_a]:underline [&_a]:break-words
                              [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-[#14182B] [&_h1]:mt-4 [&_h1]:mb-2
                              [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-[#14182B] [&_h2]:mt-3 [&_h2]:mb-1.5
                              [&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-[#14182B] [&_h3]:mt-3 [&_h3]:mb-1
                              [&_p]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2.5 [&_li]:mb-1 [&_li]:pl-1
                              [&_blockquote]:border-l-4 [&_blockquote]:border-[#0069b0]/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#8B90A0]"
                              dangerouslySetInnerHTML={{ __html: m.content }} />
                          )}
                          {m.file_path && (
                            <a href={m.file_url || `${APP_URL}/storage/${m.file_path}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 border border-[#E5E7EF] rounded-md p-3 bg-white hover:bg-[#F8F9FB] transition-colors">
                              <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
                                <FileText size={16} className="text-rose-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#4B5063] truncate">{m.file_name}</p>
                                <p className="text-[10px] text-[#8B90A0]">{fmtFileSize(m.file_size)} · PDF</p>
                              </div>
                              <span className="text-[11px] font-bold text-[#0069b0] flex items-center gap-1">
                                <Download size={12} /> Buka
                              </span>
                            </a>
                          )}
                          {m.slides && m.slides.length > 0 && (
                            <LessonSlidesViewer
                              slides={m.slides.map(s => ({
                                id: s.id,
                                name: s.file_name || 'slide',
                                url: s.url || `${APP_URL}/storage/${s.file_path}`,
                              }))}
                            />
                          )}
                          {!hasIsi && (
                            <div className="text-xs text-[#8B90A0] border border-dashed border-[#E5E7EF] rounded-md p-4 text-center">
                              Materi ini belum memiliki konten.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Quiz */}
        {lessonTab === 'quiz' && (
        <div className="space-y-3">
          <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center gap-2">
              <HelpCircle size={15} className="text-[#0069b0]" />
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Quiz</h3>
              <span className="text-[10px] font-bold text-[#8B90A0]">{lessonPakets.length} paket</span>
            </div>
            <div className="p-5">
              {lessonPakets.length > 0 ? (
                <div className="space-y-3">
                  {lessonPakets.map(paket => {
                      const linkStatus = paket.pivot?.status
                      return (
                  <div key={paket.id} className="border border-[#E5E7EF] rounded-md bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-[#0069b0]/[0.08] flex items-center justify-center shrink-0">
                          <ListChecks size={16} className="text-[#0069b0]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[#14182B] truncate">{paket.title}</p>
                            {linkStatus && (
                              <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                linkStatus === 'aktif' ? 'bg-[#0069b0]/[0.08] text-[#0069b0]' : 'bg-[#F1F2F6] text-[#8B90A0]'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${linkStatus === 'aktif' ? 'bg-[#0069b0]' : 'bg-[#C5C8D4]'}`} />
                                {linkStatus === 'aktif' ? 'Aktif' : 'Nonaktif'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8B90A0] mt-0.5">
                            {paket.questions_count != null ? `${paket.questions_count} soal` : 'Paket soal'}
                            {paket.attempts_count != null ? ` · ${paket.attempts_count} percobaan` : ''}
                          </p>
                        </div>
                      </div>
                      {canManage && linkStatus && (
                        <button onClick={() => handleTogglePaketStatus(paket)}
                          disabled={togglingPaketId === paket.id}
                          title={linkStatus === 'aktif' ? 'Nonaktifkan quiz untuk siswa' : 'Aktifkan quiz untuk siswa'}
                          className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors disabled:opacity-50 ${
                            linkStatus === 'aktif'
                              ? 'border-[#0069b0]/20 bg-[#0069b0]/5 text-[#0069b0] hover:bg-[#0069b0]/10'
                              : 'border-[#E5E7EF] bg-white text-[#8B90A0] hover:bg-[#F4F5F8]'
                          }`}>
                          {togglingPaketId === paket.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : linkStatus === 'aktif' ? <EyeOff size={11} /> : <Eye size={11} />}
                          {linkStatus === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <button onClick={() => toggleQuizPreview(paket.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4B5063] bg-[#F4F5F8] border border-[#E5E7EF] px-3 py-1.5 rounded-md hover:bg-[#EDEEF3] transition-colors">
                        Lihat Paket Soal <ChevronDown size={12} className={previewPaketId === paket.id ? 'rotate-180 transition-transform' : 'transition-transform'} />
                      </button>
                      <button onClick={() => navigate(`/guru-paket-soal/monitor/${paket.id}?kelas_sensei_id=${lesson?.course?.kelas_sensei_id ?? ''}`, { state: { title: paket.title } })}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4B5063] bg-[#F4F5F8] border border-[#E5E7EF] px-3 py-1.5 rounded-md hover:bg-[#EDEEF3] transition-colors"
                        title="Monitor langsung pengerjaan siswa (kamera + progres)">
                        <Activity size={12} /> Monitor
                      </button>
                      <button onClick={() => openQuizResults(paket)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3 py-1.5 rounded-md hover:bg-[#004d7a] transition-colors"
                        title="Lihat hasil pengerjaan kandidat + kunci jawaban + waktu pengerjaan">
                        <BarChart3 size={12} /> Hasil Quiz
                      </button>
                      {canManage && (
                        <button onClick={() => handleTogglePaketPenilaian(paket)}
                          disabled={togglingPenilaianId === paket.id}
                          title={paket.pivot?.penilaian_ulangan
                            ? 'Skor terbaik siswa otomatis masuk Penilaian Ulangan (tanggal pertemuan). Klik untuk mematikan.'
                            : 'Aktifkan: skor terbaik siswa otomatis masuk Penilaian Ulangan pada tanggal pertemuan ini.'}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50 ${
                            paket.pivot?.penilaian_ulangan
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-[#E5E7EF] bg-[#F4F5F8] text-[#4B5063] hover:bg-[#EDEEF3]'
                          }`}>
                          {togglingPenilaianId === paket.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <ClipboardList size={12} />}
                          {paket.pivot?.penilaian_ulangan ? 'Masuk Penilaian' : 'Nilai Ulangan'}
                        </button>
                      )}
                      {canManage && (
                        <button onClick={() => handleRemovePaket(paket.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-[#E5E7EF] bg-white text-[#8B90A0] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shrink-0 ml-auto"
                          title="Lepas paket dari pertemuan">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    {renderQuizPreview(paket.id)}
                  </div>
                      )
                    })}

                  {canManage && (
                    <button onClick={openBankPicker}
                      className="w-full flex items-center justify-center gap-1.5 border border-dashed border-[#0069b0]/40 bg-[#0069b0]/5 text-[#0069b0] px-3 py-2.5 rounded-md text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                      <Plus size={13} /> Tambah Paket dari Bank
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-[#E5E7EF] rounded-md p-6 text-center">
                  <div className="w-11 h-11 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                    <HelpCircle size={20} className="text-[#0069b0]" />
                  </div>
                  <p className="text-xs font-bold text-[#14182B]">Belum ada quiz</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Pilih paket soal dari bank soal untuk pertemuan ini</p>
                  {canManage ? (
                  <button onClick={openBankPicker}
                    className="mt-3 flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-2 rounded-md hover:bg-[#004d7a] transition-colors mx-auto">
                    <Plus size={12} /> Pilih Paket Soal dari Bank
                  </button>
                ) : (
                  <p className="mt-3 text-[10px] text-[#C5C8D4] font-medium text-center">Quiz belum tersedia untuk pertemuan ini</p>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Tugas */}
        {lessonTab === 'tugas' && (
        <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center gap-2">
            <ClipboardList size={15} className="text-[#0069b0]" />
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Tugas ({tasks.length})</h3>
          </div>
          <div className="p-5">
            {tasks.length === 0 ? (
              <p className="text-xs text-[#C5C8D4] text-center py-4">Belum ada tugas untuk pertemuan ini</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 border border-[#E5E7EF] rounded-md p-3 bg-[#F4F5F8]">
                    <div className="w-8 h-8 rounded-md bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                      <FileText size={14} className="text-[#0069b0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#4B5063] truncate">{t.title}</p>
                        <div className="flex items-center gap-2.5 mt-0.5">
                          {t.due_date && (
                            <span className="text-[10px] text-[#8B90A0] flex items-center gap-1">
                              <Clock size={9} /> {t.due_date}
                            </span>
                          )}
                          {t.submissions_count != null && (
                            <span className="text-[10px] text-[#8B90A0] flex items-center gap-1">
                              <ClipboardList size={9} /> {t.submissions_count} dikumpulkan
                            </span>
                          )}
                          {t.pakets && t.pakets.length > 0 && (
                            <span className="text-[10px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ListChecks size={9} /> Quiz: {t.pakets.map(p => p.title).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    {canManage && (
                      <button onClick={() => handleDeleteTask(t)}
                        className="p-1.5 rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canManage && (
              <button onClick={() => { setTaskForm({ title: '', dueDate: '', maxScore: '100', description: '' }); setTaskFile(null); setTaskPakets([]); setShowTaskPaketPicker(false); setShowTaskModal(true) }}
                className="mt-3 w-full flex items-center justify-center gap-1.5 border border-[#0069b0]/30 bg-[#0069b0]/5 text-[#0069b0] px-3 py-2.5 rounded-md text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                <Plus size={13} /> Tambah Tugas Baru
              </button>
            )}
          </div>
        </div>
        )}

        {/* Rekap Pertemuan */}
        {lessonTab === 'rekap' && (
        <div className="space-y-3">
          {/* Nilai Quiz Siswa */}
          <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} className="text-[#0069b0]" />
                <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Nilai Quiz Siswa</h3>
              </div>
              {rekapNilai?.batch_id && (
                <span className="text-[10px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-2.5 py-1 rounded-full">
                  {rekapNilai.course_title || `Batch ${rekapNilai.batch_id}`}
                </span>
              )}
            </div>
            <div className="p-5">

              {rekapNilaiLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
                  <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat daftar nilai...
                </div>
              ) : !rekapNilai || rekapNilai.pakets.length === 0 ? (
                <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                    <Users size={18} className="text-[#0069b0]" />
                  </div>
                  <p className="text-xs font-bold text-[#14182B]">Belum ada nilai quiz</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                    Belum ada paket soal di pertemuan ini. Pasang quiz dulu agar nilai siswa muncul di sini.
                  </p>
                </div>
              ) : rekapNilai.siswa.length === 0 ? (
                <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                    <Users size={18} className="text-[#0069b0]" />
                  </div>
                  <p className="text-xs font-bold text-[#14182B]">Belum ada siswa</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                    Tidak ada siswa aktif pada batch kursus ini.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-md bg-[#F4F5F8] border border-[#E5E7EF] p-3 text-center">
                      <p className="text-[9px] font-bold text-[#8B90A0] uppercase tracking-wide">Rata-Rata</p>
                      <p className={`text-lg font-bold mt-1 ${rekapNilaiStats?.overallAvg == null ? 'text-[#C5C8D4]' : 'text-[#0069b0]'}`}>
                        {rekapNilaiStats?.overallAvg ?? '–'}
                      </p>
                    </div>
                    <div className="rounded-md bg-emerald-50/50 border border-emerald-100 p-3 text-center">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Sudah Mengerjakan</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        {rekapNilaiStats?.done ?? 0}
                        <span className="text-[10px] font-bold text-emerald-400">/{rekapNilaiStats?.total ?? 0}</span>
                      </p>
                    </div>
                    <div className="rounded-md bg-[#F4F5F8] border border-[#E5E7EF] p-3 text-center">
                      <p className="text-[9px] font-bold text-[#8B90A0] uppercase tracking-wide">Belum Mengerjakan</p>
                      <p className={`text-lg font-bold mt-1 ${rekapNilaiStats?.notDone ? 'text-amber-600' : 'text-[#C5C8D4]'}`}>
                        {rekapNilaiStats?.notDone ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-5 px-5">
                    <div className="min-w-[440px] rounded-md border border-[#E5E7EF] overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#F7F9FC] border-b border-[#E5E7EF]">
                            <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide w-8 text-center">No</th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide">Nama Siswa</th>
                            {rekapNilai.pakets.map(p => (
                              <th key={p.id} className="py-2.5 px-2 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center">
                                <div className="max-w-[100px] mx-auto">
                                  <p className="truncate" title={p.title}>{p.title}</p>
                                  <p className="text-[9px] font-bold text-[#B9BDCB] mt-0.5">{p.questions_count} soal</p>
                                </div>
                              </th>
                            ))}
                            <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center">Rata-Rata</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rekapNilai.siswa.map((s, i) => {
                            const scores = rekapNilai.pakets.map(p => s.scores.find(sc => sc.paket_id === p.id))
                            const valid = scores.filter(sc => sc != null && sc.best_score != null)
                            const avg = valid.length > 0
                              ? Math.round(valid.reduce((acc, sc) => acc + (sc!.best_score as number), 0) / valid.length)
                              : null
                            return (
                              <tr key={s.siswa_id} className="border-b border-[#F0F1F5] last:border-0 hover:bg-[#F7F9FC]/60 transition-colors">
                                <td className="py-3 px-3 text-center">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F4F5F8] text-[10px] font-bold text-[#8B90A0]">{i + 1}</span>
                                </td>
                                <td className="py-3 px-3">
                                  <p className="text-xs font-bold text-[#14182B]">{s.nama}</p>
                                  {s.level != null && (
                                    <span className="text-[9px] font-bold text-[#8B90A0] bg-[#F4F5F8] px-1.5 py-0.5 rounded-md mt-1 inline-block">Level {s.level}</span>
                                  )}
                                </td>
                                {scores.map((sc, si) => {
                                  const score = sc?.best_score ?? null
                                  const color = score == null ? 'bg-[#F4F5F8] text-[#B9BDCB]'
                                    : score >= 75 ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
                                    : score >= 60 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                                    : 'bg-red-50 text-red-500 ring-1 ring-red-100'
                                  return (
                                    <td key={sc?.paket_id ?? `paket-${si}`} className="py-3 px-2 text-center">
                                      {score == null ? (
                                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#F4F5F8] text-[#B9BDCB]">Belum</span>
                                      ) : (
                                        <div className="inline-flex flex-col items-center">
                                          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${color}`}>{score}</span>
                                          {sc != null && sc.attempts_count > 1 && (
                                            <span className="text-[9px] font-semibold text-[#B9BDCB] mt-0.5">{sc.attempts_count} percobaan</span>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                                <td className="py-3 px-3 text-center">
                                  {avg == null ? (
                                    <span className="text-[11px] font-bold text-[#C5C8D4]">–</span>
                                  ) : (
                                    <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                      avg >= 75 ? 'bg-[#0069b0]/10 text-[#0069b0]'
                                      : avg >= 60 ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'
                                      : 'bg-red-50 text-red-500 ring-1 ring-red-100'
                                    }`}>{avg}</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-[#F7F9FC] border-t border-[#E5E7EF]">
                            <td className="py-3 px-3" />
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-bold text-[#4B5063] uppercase tracking-wide">Rata-Rata Kelas</span>
                            </td>
                            {rekapNilai.pakets.map(p => {
                              const vals = rekapNilai.siswa
                                .map(s => s.scores.find(sc => sc.paket_id === p.id)?.best_score ?? null)
                                .filter((v): v is number => v != null)
                              const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
                              return (
                                <td key={p.id} className="py-3 px-2 text-center">
                                  {avg == null ? (
                                    <span className="text-[11px] font-semibold text-[#B9BDCB]">–</span>
                                  ) : (
                                    <span className="text-xs font-bold text-[#0069b0]">{avg}</span>
                                  )}
                                </td>
                              )
                            })}
                            <td className="py-3 px-3" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Rekap Dokumen */}
        <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center gap-2">
            <Camera size={15} className="text-[#0069b0]" />
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Rekap Pertemuan</h3>
          </div>
          <div className="p-5 space-y-4">
            {recap?.url ? (
              <div className="space-y-3">
                {recap.kind === 'image' ? (
                  <a href={recap.url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-md overflow-hidden border border-[#E5E7EF] bg-[#F4F5F8]">
                    <img src={recap.url} alt="Rekap pertemuan" className="w-full max-h-[420px] object-contain" />
                  </a>
                ) : (
                  <a href={recap.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 border border-[#E5E7EF] rounded-md p-3 bg-[#F4F5F8]">
                    <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-rose-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#4B5063] truncate">{recap.file_name}</p>
                      <p className="text-[10px] text-[#8B90A0]">{fmtFileSize(recap.file_size)} · PDF</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#0069b0] flex items-center gap-1">
                      <Download size={12} /> Buka
                    </span>
                  </a>
                )}
                {recap.description && (
                  <p className="text-xs text-[#4B5063] leading-relaxed bg-[#F7F9FC] border border-[#E5E7EF] rounded-md p-4">
                    {recap.description}
                  </p>
                )}
                {canManage && (
                  <button onClick={handleDeleteRecap}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 px-3 py-2 rounded-md hover:bg-red-50 transition-colors">
                    <Trash2 size={13} /> Hapus Rekap
                  </button>
                )}
              </div>
            ) : (
              !canManage && (
                <p className="text-xs text-[#C5C8D4] text-center py-4">Belum ada rekap pertemuan</p>
              )
            )}

            {canManage && (
              <div className={`${recap?.url ? 'border-t border-[#E5E7EF] pt-4' : ''} space-y-3`}>
                <p className="text-[11px] font-bold text-[#4B5063]">
                  {recap?.url ? 'Perbarui Rekap' : 'Upload Rekap Pertemuan'}
                </p>

                <input key={`camera-${recapInputReset}`} ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                  className="hidden" onChange={handleRecapFile} />
                <input key={`file-${recapInputReset}`} ref={fileInputRef} type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="hidden" onChange={handleRecapFile} />

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 border border-[#0069b0]/30 bg-[#0069b0]/5 text-[#0069b0] px-3 py-3 rounded-md text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                    <Camera size={14} /> Ambil Foto Papan
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 border border-[#0069b0]/30 bg-[#0069b0]/5 text-[#0069b0] px-3 py-3 rounded-md text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                    <Upload size={14} /> Unggah Foto / PDF
                  </button>
                </div>

                {recapFile && (
                  <div className="flex items-center gap-3 rounded-md bg-[#F4F5F8] border border-[#E5E7EF] p-3">
                    <ImageIcon size={16} className="text-[#0069b0] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#14182B] truncate">{recapFile.name}</p>
                      <p className="text-[10px] text-[#8B90A0]">{fmtFileSize(recapFile.size)} · {(recapFile.type.startsWith('image/') ? 'Gambar' : 'PDF')}</p>
                    </div>
                    <button onClick={() => setRecapFile(null)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-[#4B5063] mb-1.5">Keterangan / Deskripsi</p>
                  <textarea value={recapDescription} onChange={e => setRecapDescription(e.target.value)}
                    rows={3}
                    placeholder="Tulis ringkasan atau keterangan materu yang dijelaskan di pertemuan ini (opsional)..."
                    className="w-full text-xs border border-[#E5E7EF] rounded-md px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all resize-none" />
                </div>

                <div className="flex items-center justify-end gap-2">
                  {(recap?.url || recapFile) && (
                    <button onClick={handleDeleteRecap}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 px-3.5 py-2.5 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 size={13} /> Hapus
                    </button>
                  )}
                  <button onClick={handleSaveRecap} disabled={savingRecap || (!recapFile && !recapDescription.trim())}
                    className="flex items-center justify-center gap-1.5 bg-[#0069b0] text-white px-4 py-2.5 rounded-md text-[11px] font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                    {savingRecap ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    {savingRecap ? 'Menyimpan...' : 'Simpan Rekap'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
        )}

        {/* Kehadiran Siswa */}
        {lessonTab === 'kehadiran' && (
        <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-[#0069b0]" />
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Kehadiran Siswa</h3>
            </div>
            {dataSiswaKelas?.kelas && (
              <span className="text-[10px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-2.5 py-1 rounded-full shrink-0">
                {dataSiswaKelas.kelas.batch_relasi?.nama_batch || dataSiswaKelas.kelas.nama_kelas}
                {dataSiswaKelas.kelas.level ? ` · Level ${dataSiswaKelas.kelas.level}` : ''}
              </span>
            )}
          </div>
          <div className="p-5">
            {kehadiranLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
                <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat kehadiran siswa...
              </div>
            ) : !lesson.course?.kelas_sensei_id ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Calendar size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Data kehadiran tidak tersedia</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Kursus ini tidak terhubung dengan kelas (batch) mana pun.
                </p>
              </div>
            ) : !dataSiswaKelas ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Users size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Gagal memuat kehadiran</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Tidak dapat mengambil data kehadiran kelas ini.
                </p>
              </div>
            ) : dataSiswaKelas.siswa.length === 0 ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Users size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Belum ada siswa</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Tidak ada siswa aktif pada batch kursus ini.
                </p>
              </div>
            ) : (
              <>
                {dataSiswaKelas.kelas && (
                  <p className="text-[10px] font-medium text-[#8B90A0] mb-3">
                    Periode batch: {formatTanggalShort(dataSiswaKelas.kelas.tanggal_mulai)} – {formatTanggalShort(dataSiswaKelas.kelas.tanggal_selesai)} · {dataSiswaKelas.siswa.length} siswa
                    {lesson.pertemuan_date && (
                      <span className="text-[#0069b0] font-bold"> · Kehadiran {formatDayDate(lesson.pertemuan_date)}</span>
                    )}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {Object.entries(KEHADIRAN_ABBR).map(([key, abbr]) => (
                    <span key={key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${KEHADIRAN_BG[key]}`}>
                      {abbr}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto -mx-5 px-5">
                  <div className="rounded-md border border-[#E5E7EF] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#F0F1F5] bg-[#F7F9FC]">
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider">Nama</th>
                          <th className="text-center px-2 py-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider w-10">Lv</th>
                          <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-wider min-w-[80px] bg-[#E3F0F9] text-[#0069b0]">
                            <div className="flex flex-col items-center leading-tight">
                              <span>{lesson.pertemuan_date ? formatDayDate(lesson.pertemuan_date) : 'Pertemuan'}</span>
                              <span className="text-[8px] font-bold uppercase tracking-wide mt-0.5">Pertemuan</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataSiswaKelas.siswa.map((s, idx) => {
                          const pertemuanDate = lesson.pertemuan_date ? lesson.pertemuan_date.slice(0, 10) : null
                          const status = pertemuanDate ? s.absensi[pertemuanDate] : undefined
                          const statusEl = status ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ring-2 ring-[#0069b0]/40 ${KEHADIRAN_BG[status] || 'bg-gray-100 text-gray-500'}`}>
                              {KEHADIRAN_ABBR[status] || status[0]}
                            </span>
                          ) : lesson.pertemuan_date && isWeekend(lesson.pertemuan_date) ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold bg-slate-100 text-slate-700" title="Libur (Sabtu/Minggu)">
                              L
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-gray-300">-</span>
                          )
                          return (
                            <tr key={s.id} className={`border-t border-[#F0F1F5] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                              <td className="px-4 py-2.5 text-xs font-bold text-[#14182B]">{s.nama}</td>
                              <td className="text-center px-2 py-2.5 text-[11px] font-semibold text-[#8B90A0]">{s.level || '-'}</td>
                              <td className="text-center px-3 py-2.5 bg-[#F2F8FC]">
                                {canManage && pertemuanDate ? (
                                  <button
                                    onClick={() => openStatusModal(s, pertemuanDate)}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0069b0] hover:bg-[#0069b0]/10 bg-transparent px-2 py-1 rounded-md transition-colors"
                                    title={`Ubah kehadiran ${s.nama}`}
                                  >
                                    {statusEl}
                                    <Edit3 size={11} className="text-[#0069b0]/60" />
                                  </button>
                                ) : (
                                  statusEl
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {lessonTab === 'nilai' && (
        <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-[#0069b0]" />
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Penilaian Siswa</h3>
            </div>
            {lesson.course?.level && (
              <span className="text-[10px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-2.5 py-1 rounded-full shrink-0">
                {lesson.course.batch_id ? `Batch ${lesson.course.batch_id}` : ''}
                {lesson.course.level ? ` · Level ${lesson.course.level}` : ''}
              </span>
            )}
          </div>
          <div className="p-5">
            {penilaianLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
                <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat data penilaian...
              </div>
            ) : !lesson.course?.kelas_sensei_id ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <BarChart3 size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Data penilaian tidak tersedia</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Kursus ini tidak terhubung dengan kelas (batch) mana pun.
                </p>
              </div>
            ) : !lesson.course.level ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <BarChart3 size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Level belum ditentukan</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Atur level kursus terlebih dahulu agar penilaian dapat diisi.
                </p>
              </div>
            ) : !penilaianHarian ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Users size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Gagal memuat penilaian</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Tidak dapat mengambil data penilaian kelas ini.
                </p>
              </div>
            ) : penilaianHarian.siswa.length === 0 ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Users size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Belum ada siswa</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Tidak ada siswa aktif pada batch kursus ini.
                </p>
              </div>
            ) : (
              <>
                {lesson.pertemuan_date && (
                  <p className="text-[10px] font-medium text-[#8B90A0] mb-3">
                    Penilaian pertemuan {formatDayDate(lesson.pertemuan_date)} · {penilaianHarian.siswa.length} siswa
                    <span className="text-[#0069b0] font-bold"> · Klik sel untuk isi atau ubah nilai</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 text-[10px] text-[#8B90A0]">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Terisi</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#8B90A0]">
                    <Minus className="w-3.5 h-3.5 text-slate-300" />
                    <span>Kosong</span>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 px-5">
                  <div className="rounded-md border border-[#E5E7EF] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#F0F1F5] bg-[#F7F9FC]">
                          <th className="text-left px-4 py-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider">Nama</th>
                          <th className="text-center px-2 py-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wider w-10">Lv</th>
                          <th className="text-center px-3 py-3 text-[9px] font-bold uppercase tracking-wider min-w-[80px] bg-[#E3F0F9] text-[#0069b0]">
                            <div className="flex flex-col items-center leading-tight">
                              <span>{lesson.pertemuan_date ? formatDayDate(lesson.pertemuan_date) : 'Pertemuan'}</span>
                              <span className="text-[8px] font-bold uppercase tracking-wide mt-0.5">Pertemuan</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {penilaianHarian.siswa.map((s, idx) => {
                          const pertemuanDate = lesson.pertemuan_date ? lesson.pertemuan_date.slice(0, 10) : null
                          const isTerisi = pertemuanDate ? (s.daily_status[pertemuanDate]?.is_terisi ?? false) : false
                          return (
                            <tr key={s.id} className={`border-t border-[#F0F1F5] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                              <td className="px-4 py-2.5 text-xs font-bold text-[#14182B]">{s.nama}</td>
                              <td className="text-center px-2 py-2.5 text-[11px] font-semibold text-[#8B90A0]">{s.level || '-'}</td>
                              <td className="text-center px-3 py-2.5 bg-[#F2F8FC]">
                                {canManage && pertemuanDate ? (
                                  <button
                                    onClick={() => openPenilaianModal(s)}
                                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0069b0] hover:bg-[#0069b0]/10 bg-transparent px-2 py-1 rounded-md transition-colors"
                                    title={isTerisi ? `Lihat/edit penilaian ${s.nama}` : `Isi penilaian ${s.nama}`}
                                  >
                                    {isTerisi ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                        <Check className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-slate-300">
                                        -
                                      </span>
                                    )}
                                    <Edit3 size={11} className="text-[#0069b0]/60" />
                                  </button>
                                ) : isTerisi ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {lessonTab === 'peringkat' && (
        <div className="bg-white rounded-md border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-[#0069b0]" />
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Peringkat Siswa</h3>
            </div>
            {lesson.course?.batch_id && (
              <span className="text-[10px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-2.5 py-1 rounded-full shrink-0">
                Batch {lesson.course.batch_id}
                {lesson.course.level ? ` · Level ${lesson.course.level}` : ''}
              </span>
            )}
          </div>
          <div className="p-5">
            {rankingLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
                <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat peringkat...
              </div>
            ) : !lesson.course?.batch_id ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Trophy size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Peringkat tidak tersedia</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Kursus ini tidak terhubung dengan batch mana pun.
                </p>
              </div>
            ) : rankings.length === 0 ? (
              <div className="border border-dashed border-[#E5E7EF] rounded-md p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <Trophy size={18} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Belum ada data penilaian</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                  Nilai siswa akan tampil di sini setelah penilaian diisi.
                </p>
              </div>
            ) : (
              <>
                {rankings.length >= 2 && (
                  <div className="mb-4">
                    <div className="flex items-end justify-center gap-3">
                      {rankings[1] && (
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 rounded-full border-2 border-[#D6D9E1] bg-white flex items-center justify-center mx-auto mb-1.5">
                            <span className="text-xs font-bold text-[#8B90A0]">2</span>
                          </div>
                          <div className="h-14 bg-[#F4F5F8] rounded-t-lg flex items-center justify-center border border-[#E5E7EF] border-b-0">
                            <Trophy size={14} className="text-[#B6BAC7]" />
                          </div>
                          <p className="text-[10px] font-bold text-[#4B5063] mt-1.5 truncate">{rankings[1].nama}</p>
                          <p className="text-[10px] font-semibold text-[#8B90A0]">{rankings[1].rata_rata}</p>
                        </div>
                      )}
                      {rankings[0] && (
                        <div className="flex-1 text-center">
                          <div className="w-12 h-12 rounded-full border-2 border-[#0069b0] bg-[#0069b0]/5 flex items-center justify-center mx-auto mb-1.5">
                            <Trophy size={16} className="text-[#0069b0]" />
                          </div>
                          <div className="h-20 bg-[#0069b0]/5 rounded-t-lg flex items-center justify-center border border-[#0069b0]/20 border-b-0">
                            <Trophy size={18} className="text-[#0069b0]" />
                          </div>
                          <p className="text-[10px] font-bold text-[#14182B] mt-1.5 truncate">{rankings[0].nama}</p>
                          <p className="text-[10px] font-semibold text-[#0069b0]">{rankings[0].rata_rata}</p>
                        </div>
                      )}
                      {rankings[2] && (
                        <div className="flex-1 text-center">
                          <div className="w-10 h-10 rounded-full border-2 border-amber-300 bg-white flex items-center justify-center mx-auto mb-1.5">
                            <span className="text-xs font-bold text-amber-500">3</span>
                          </div>
                          <div className="h-10 bg-amber-50 rounded-t-lg flex items-center justify-center border border-amber-200 border-b-0">
                            <Trophy size={12} className="text-amber-400" />
                          </div>
                          <p className="text-[10px] font-bold text-[#4B5063] mt-1.5 truncate">{rankings[2].nama}</p>
                          <p className="text-[10px] font-semibold text-[#8B90A0]">{rankings[2].rata_rata}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="divide-y divide-[#E5E7EF] border border-[#E5E7EF] rounded-md overflow-hidden">
                  {rankings.map((r, idx) => (
                    <div key={r.siswa_id} className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        idx === 0 ? 'bg-[#0069b0] text-white' :
                        idx === 1 ? 'bg-gray-200 text-gray-600' :
                        idx === 2 ? 'bg-amber-100 text-amber-600' :
                        'bg-[#F4F5F8] text-[#8B90A0] border border-[#E5E7EF]'
                      }`}>
                        <span className="text-[10px] font-bold">{r.rank ?? '-'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#14182B] truncate">{r.nama}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#8B90A0]">Lv {r.level}</span>
                          <span className="text-[10px] text-[#8B90A0]">·</span>
                          <span className="text-[10px] text-[#8B90A0]">{r.total_nilai} nilai</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-[#14182B]">{r.rata_rata ?? '-'}</span>
                        <p className="text-[9px] text-[#8B90A0]">rata-rata</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Hasil Quiz Modal */}
      {hasilPaket && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setHasilPaket(null)}>
          <div className="bg-white w-full sm:max-w-2xl rounded-t-xl sm:rounded-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#14182B] truncate">Hasil Quiz · {hasilPaket.title}</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">{participants.length} kandidat mengerjakan</p>
              </div>
              <button onClick={() => setHasilPaket(null)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF] shrink-0 ml-3">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5">
              {hasilLoading ? (
                <div className="flex items-center justify-center gap-2 py-14 text-[11px] text-[#8B90A0] font-medium">
                  <Loader2 size={16} className="animate-spin text-[#0069b0]" /> Memuat hasil...
                </div>
              ) : participants.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                    <Users size={22} className="text-[#0069b0]" />
                  </div>
                  <p className="text-xs font-bold text-[#14182B]">Belum ada yang mengerjakan</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-1">Hasil muncul setelah kandidat mengerjakan quiz ini</p>
                </div>
              ) : (
                <>
                <div className="hidden md:block overflow-x-auto">
                  <div className="min-w-[760px] rounded-md border border-[#E5E7EF] overflow-hidden">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#F7F9FC]">
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide border border-[#E5E7EF]">Kandidat</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center border border-[#E5E7EF]">Percobaan</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center border border-[#E5E7EF]">Skor</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center border border-[#E5E7EF]">Benar/Total</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center border border-[#E5E7EF]">Waktu Pengerjaan</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center border border-[#E5E7EF]">Status</th>
                          <th className="py-2.5 px-3 text-[10px] font-bold text-[#8B90A0] uppercase tracking-wide text-center border border-[#E5E7EF]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map(par =>
                          par.attempts.map((a, ai) => (
                            <tr key={a.attempt_id} className="hover:bg-[#F7F9FC]/60 transition-colors align-top bg-white">
                              {ai === 0 && (
                                <td rowSpan={par.attempts.length} className="py-3 px-3 border border-[#E5E7EF]">
                                  <p className="text-xs font-bold text-[#14182B]">{par.nama}</p>
                                  <p className="text-[9.5px] text-[#8B90A0] font-medium mt-0.5">
                                    {[par.batch && `Batch ${par.batch}`, par.level != null && `Level ${par.level}`].filter(Boolean).join(' · ') || '-'}
                                  </p>
                                  <p className="text-[9.5px] font-bold text-[#0069b0] mt-1">Skor terbaik: {Number(par.best_score) || 0}</p>
                                </td>
                              )}
                              <td className="py-3 px-3 text-center text-[11px] font-bold text-[#4B5063] border border-[#E5E7EF]">#{a.attempt_number}</td>
                              <td className="py-3 px-3 text-center border border-[#E5E7EF]">
                                <span className={`text-[11px] font-bold ${a.status === 'submitted' ? 'text-[#0069b0]' : 'text-[#B9BDCB]'}`}>
                                  {a.status === 'submitted' ? Number(a.score) || 0 : '–'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center text-[11px] font-semibold text-[#4B5063] border border-[#E5E7EF]">
                                {a.correct_count != null && a.total_count != null ? `${a.correct_count}/${a.total_count}` : '–'}
                              </td>
                              <td className="py-3 px-3 text-center border border-[#E5E7EF]">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4B5063]">
                                  <Clock size={11} className="text-[#8B90A0]" />
                                  {fmtDuration(a.started_at, a.submitted_at)}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center border border-[#E5E7EF]">
                                <span className={`inline-block text-[9px] font-bold px-2 py-1 rounded-full ${
                                  a.status === 'submitted'
                                    ? a.auto_submitted ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                    : 'bg-[#F4F5F8] text-[#8B90A0]'
                                }`}>
                                  {a.status === 'submitted' ? (a.auto_submitted ? 'Dikumpulkan otomatis' : 'Selesai') : 'Sedang dikerjakan'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center border border-[#E5E7EF]">
                                <div className="inline-flex items-center gap-1.5">
                                  <button onClick={() => openAttemptDetail(a.attempt_id)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0069b0] border border-[#0069b0]/30 bg-[#0069b0]/5 px-2.5 py-1.5 rounded-md hover:bg-[#0069b0]/10 transition-colors">
                                    Jawaban <ChevronRight size={11} />
                                  </button>
                                  {ai === 0 && (
                                    <button onClick={() => confirmResetParticipant(par)}
                                      title={`Reset semua percobaan ${par.nama}`}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-md hover:bg-red-100 transition-colors">
                                      <RotateCcw size={11} /> Reset
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="md:hidden space-y-3">
                  {participants.map(par => (
                    <div key={par.siswa_id} className="rounded-lg border border-[#E5E7EF] overflow-hidden">
                      <div className="flex items-center justify-between gap-2 px-3.5 py-3 bg-[#F7F9FC] border-b border-[#E5E7EF]">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#14182B] truncate">{par.nama}</p>
                          <p className="text-[9.5px] text-[#8B90A0] font-medium mt-0.5">
                            {[par.batch && `Batch ${par.batch}`, par.level != null && `Level ${par.level}`].filter(Boolean).join(' · ') || '-'}
                          </p>
                        </div>
                        <span className="shrink-0 text-[9px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-2 py-1 rounded-full">Terbaik {Number(par.best_score) || 0}</span>
                      </div>
                      <div className="divide-y divide-[#F0F1F5]">
                        {par.attempts.map((a, ai) => (
                          <div key={a.attempt_id} className="px-3.5 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-[#4B5063]">#{a.attempt_number}</span>
                              <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                                a.status === 'submitted'
                                  ? a.auto_submitted ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                                  : 'bg-[#F4F5F8] text-[#8B90A0]'
                              }`}>
                                {a.status === 'submitted' ? (a.auto_submitted ? 'Dikumpulkan otomatis' : 'Selesai') : 'Sedang dikerjakan'}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <div className="rounded-md bg-[#F7F9FC] border border-[#F0F1F5] py-2 text-center">
                                <p className="text-[8.5px] font-bold text-[#8B90A0] uppercase tracking-wide">Skor</p>
                                <p className={`text-xs font-bold mt-0.5 ${a.status === 'submitted' ? 'text-[#0069b0]' : 'text-[#B9BDCB]'}`}>
                                  {a.status === 'submitted' ? Number(a.score) || 0 : '–'}
                                </p>
                              </div>
                              <div className="rounded-md bg-[#F7F9FC] border border-[#F0F1F5] py-2 text-center">
                                <p className="text-[8.5px] font-bold text-[#8B90A0] uppercase tracking-wide">Benar</p>
                                <p className="text-xs font-bold text-[#14182B] mt-0.5">
                                  {a.correct_count != null && a.total_count != null ? `${a.correct_count}/${a.total_count}` : '–'}
                                </p>
                              </div>
                              <div className="rounded-md bg-[#F7F9FC] border border-[#F0F1F5] py-2 text-center">
                                <p className="text-[8.5px] font-bold text-[#8B90A0] uppercase tracking-wide">Waktu</p>
                                <p className="text-[10px] font-bold text-[#14182B] mt-0.5">
                                  {fmtDuration(a.started_at, a.submitted_at)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2.5 flex gap-1.5">
                              <button onClick={() => openAttemptDetail(a.attempt_id)}
                                className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-bold text-[#0069b0] border border-[#0069b0]/30 bg-[#0069b0]/5 px-2.5 py-2 rounded-md hover:bg-[#0069b0]/10 transition-colors">
                                Jawaban <ChevronRight size={11} />
                              </button>
                              {ai === 0 && (
                                <button onClick={() => confirmResetParticipant(par)}
                                  title={`Reset semua percobaan ${par.nama}`}
                                  className="flex-1 inline-flex items-center justify-center gap-1 text-[10px] font-bold text-red-500 border border-red-200 bg-red-50 px-2.5 py-2 rounded-md hover:bg-red-100 transition-colors">
                                  <RotateCcw size={11} /> Reset
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
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

      {/* Review Jawaban Modal */}
      {showAttemptDetail && (
        <div className="fixed inset-0 z-[98] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowAttemptDetail(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-xl sm:rounded-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white z-10">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#14182B]">Review Jawaban</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium truncate">
                  {detail?.siswa?.nama || 'Kandidat'} · Percobaan #{detail?.attempt?.attempt_number}
                </p>
              </div>
              <button onClick={() => setShowAttemptDetail(false)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF] shrink-0 ml-3">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {detailLoading || !detail ? (
                <div className="flex items-center justify-center gap-2 py-12 text-[11px] text-[#8B90A0] font-medium">
                  <Loader2 size={16} className="animate-spin text-[#0069b0]" /> Memuat jawaban...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#F4F5F8] rounded-md p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Skor</p>
                    </div>
                    <div className="bg-[#F4F5F8] rounded-md p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">
                        {detail.attempt.correct_count != null && detail.attempt.total_count != null
                          ? `${detail.attempt.correct_count}/${detail.attempt.total_count}` : '–'}
                      </p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Benar</p>
                    </div>
                    <div className="bg-[#F4F5F8] rounded-md p-3 text-center">
                      <p className="text-lg font-bold text-[#0069b0] flex items-center justify-center gap-1">
                        <Clock size={13} /> {fmtDuration(detail.attempt.started_at, detail.attempt.submitted_at)}
                      </p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Waktu</p>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-[#8B90A0] font-medium -mt-2">
                    Mulai {fmtDateTime(detail.attempt.started_at)} · Selesai {fmtDateTime(detail.attempt.submitted_at)}
                  </p>

                  {detail.attempt.webcam_photo && (
                    <div>
                      <p className="text-[11px] font-bold text-[#4B5063] mb-2 flex items-center gap-1.5"><Camera size={12} /> Foto Pengerjaan</p>
                      <img src={detail.attempt.webcam_photo} alt="Webcam" className="w-full rounded-md border border-[#E5E7EF] max-h-52 object-cover" />
                    </div>
                  )}

                  {reviewSections.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                      <button
                        onClick={() => setReviewSection('__all__')}
                        className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                          reviewSection === '__all__' ? 'bg-[#0069b0] border-[#0069b0] text-white' : 'bg-white border-[#E5E7EF] text-[#4B5063] hover:border-[#0069b0]'
                        }`}>
                        Semua <span className="opacity-70">{reviewTotal}</span>
                      </button>
                      {reviewSections.map(s => (
                        <button key={s.name}
                          onClick={() => setReviewSection(s.name)}
                          className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                            reviewSection === s.name ? 'bg-[#0069b0] border-[#0069b0] text-white' : 'bg-white border-[#E5E7EF] text-[#4B5063] hover:border-[#0069b0]'
                          }`}>
                          {s.name} <span className="opacity-70">{s.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {reviewQuestions.length === 0 ? (
                      <p className="text-center text-[11px] text-[#8B90A0] font-medium py-8">Tidak ada soal pada kategori ini.</p>
                    ) : activeReviewSection != null ? (
                      reviewNumbered.map(renderReviewQuestion)
                    ) : (
                      reviewGroups.map(g => (
                        <div key={g.name} className="space-y-3">
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#0069b0]">{g.name}</span>
                            <span className="text-[9px] font-bold text-[#8B90A0] bg-[#F4F5F8] rounded-full px-1.5 py-0.5">{g.items.length}</span>
                            <div className="flex-1 h-px bg-[#E5E7EF]" />
                          </div>
                          {g.items.map(renderReviewQuestion)}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Materi Modal */}
      {showEditModal && lesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Materi</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Materi <span className="text-red-500">*</span></label>
                <input type="text" value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  placeholder="Judul pelajaran" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Video (YouTube)</label>
                <input type="text" value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  placeholder="https://youtube.com/..." />
                {lessonForm.video_url && (
                  <div className="mt-2 aspect-video bg-black rounded-md overflow-hidden">
                    <iframe src={getYouTubeEmbedUrl(lessonForm.video_url) || lessonForm.video_url}
                      className="w-full h-full" allowFullScreen title="Preview" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Konten Materi</label>
                <ReactQuill
                  ref={lessonQuillRef}
                  value={lessonForm.content}
                  onChange={value => setLessonForm(f => ({ ...f, content: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                  placeholder="Tulis materi pembelajaran di sini..."
                  className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-gray-300"
                />
              </div>
              <LessonMediaFields
                pdfName={lessonPdf?.name || lessonPdfName}
                pdfSize={lessonPdf?.size || lessonPdfSize}
                slides={lessonSlides}
                onPdf={file => {
                  setLessonPdf(file)
                  setLessonPdfName(null)
                  setLessonPdfSize(null)
                  setRemoveLessonPdf(false)
                }}
                onRemovePdf={() => {
                  if (lessonPdf) setLessonPdf(null)
                  if (lessonPdfName) {
                    setLessonPdfName(null)
                    setLessonPdfSize(null)
                    setRemoveLessonPdf(true)
                  }
                }}
                onSlidesChange={setLessonSlides}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Urutan</label>
                  <input type="number" value={lessonForm.sort} onChange={e => setLessonForm(f => ({ ...f, sort: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                  <select value={lessonForm.status} onChange={e => setLessonForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <button onClick={() => setShowEditModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveLesson} disabled={saving || !lessonForm.title.trim()}
                className="flex items-center gap-1.5 rounded-md bg-[#0069b0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50">
                {saving ? 'Menyimpan...' : <><Check size={13} /> Simpan Materi</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Soal Modal */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowQuestionModal(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Edit Soal</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">{qPaketTitle}</p>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Pertanyaan <span className="text-[#8B90A0] font-medium">(opsional)</span></label>
                <textarea value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })}
                  rows={2} placeholder="Tulis pertanyaan..." className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 resize-none" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Bagian / Materi Soal <span className="text-[#8B90A0] font-medium">(opsional)</span></label>
                <div className="flex items-center gap-2">
                  <select value={qForm.section_id} onChange={e => setQForm({ ...qForm, section_id: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10">
                    <option value="">Tanpa bagian</option>
                    {qSections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.questions_count ? ` (${s.questions_count})` : ''}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowSectionInput(v => !v)}
                    className="shrink-0 px-3 py-3 text-[10px] font-bold text-[#0069b0] border border-[#0069b0]/30 rounded-xl hover:bg-[#0069b0]/5">
                    <Plus size={13} className="inline mr-0.5" /> Bagian
                  </button>
                </div>
                {showSectionInput && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') createSection() }}
                      placeholder="Nama bagian baru, mis. Grammar"
                      className="flex-1 text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10"
                    />
                    <button type="button" onClick={createSection} disabled={savingSection || !newSectionName.trim()}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-2.5 text-[10px] font-bold text-white bg-[#0069b0] rounded-xl hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                      {savingSection ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Simpan
                    </button>
                  </div>
                )}
                {qSections.length > 0 && (
                  <p className="text-[9.5px] font-bold text-[#8B90A0] uppercase tracking-wide mt-2">Bagian di paket ini: {qSections.length}</p>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Media Soal <span className="text-[#8B90A0] font-medium">(opsional)</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`border border-[#E5E7EF] rounded-xl p-3 ${qForm.image_path ? 'bg-[#F7F8FA]' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-[#8B90A0]" />
                      <span className="text-[11px] font-bold text-[#4B5063]">Gambar Soal</span>
                    </div>
                    {qForm.image_url ? (
                      <div className="relative">
                        <img src={qForm.image_url} alt="Pra-preview"
                          className="w-full h-28 object-contain bg-white border border-[#E5E7EF] rounded-lg" />
                        <button onClick={() => setQForm({ ...qForm, image_path: '', image_url: '' })}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600" title="Hapus gambar">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 h-28 border border-dashed border-[#D6D9E1] rounded-lg cursor-pointer hover:border-[#0069b0] hover:bg-[#F0F6FA] transition-colors ${uploadingQMedia === 'image' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingQMedia === 'image' ? <Loader2 size={18} className="animate-spin text-[#0069b0]" /> : <UploadCloud size={18} className="text-[#8B90A0]" />}
                        <span className="text-[10px] font-medium text-[#8B90A0]">{uploadingQMedia === 'image' ? 'Mengunggah...' : 'Pilih gambar'}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={!!uploadingQMedia}
                          onChange={e => { uploadQuestionMedia(e.target.files?.[0], 'image'); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                  <div className={`border border-[#E5E7EF] rounded-xl p-3 ${qForm.audio_path ? 'bg-[#F7F8FA]' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Mic size={14} className="text-[#8B90A0]" />
                      <span className="text-[11px] font-bold text-[#4B5063]">Suara Soal</span>
                    </div>
                    {qForm.audio_url ? (
                      <div className="space-y-2">
                        <audio src={qForm.audio_url} controls className="w-full h-9" />
                        <label className="text-[10px] font-bold text-[#4B5063] block mb-1 flex items-center gap-1">
                          <Repeat size={11} /> Maksimal putar <span className="text-[#8B90A0] font-medium">(kali mendengarkan)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={1} max={99} value={qForm.audio_max_plays}
                            onChange={e => setQForm({ ...qForm, audio_max_plays: e.target.value })}
                            className="w-24 text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                          <button onClick={() => { setQForm({ ...qForm, audio_path: '', audio_url: '', audio_max_plays: '2' }) }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-500 inline-flex items-center gap-1">
                            <Trash2 size={11} /> Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 h-28 border border-dashed border-[#D6D9E1] rounded-lg cursor-pointer hover:border-[#0069b0] hover:bg-[#F0F6FA] transition-colors ${uploadingQMedia === 'audio' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingQMedia === 'audio' ? <Loader2 size={18} className="animate-spin text-[#0069b0]" /> : <UploadCloud size={18} className="text-[#8B90A0]" />}
                        <span className="text-[10px] font-medium text-[#8B90A0]">{uploadingQMedia === 'audio' ? 'Mengunggah...' : 'Pilih audio (MP3/WAV)'}</span>
                        <input type="file" accept="audio/*" className="hidden" disabled={!!uploadingQMedia}
                          onChange={e => { uploadQuestionMedia(e.target.files?.[0], 'audio'); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Tipe Jawaban</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'choice' })}
                    className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 text-left transition-colors ${qForm.question_type === 'choice' ? 'border-[#0069b0] bg-[#0069b0]/[0.04] ring-1 ring-[#0069b0]/20' : 'border-[#E5E7EF] hover:border-[#D6D9E1]'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold shrink-0 ${qForm.question_type === 'choice' ? 'bg-[#0069b0] text-white' : 'bg-[#F4F5F8] text-[#8B90A0]'}`}>A/B/C</span>
                    <span>
                      <span className="block text-[11.5px] font-bold text-[#14182B]">Pilihan Ganda</span>
                      <span className="block text-[9.5px] text-[#8B90A0] font-medium">Opsi A, B, C + kunci jawaban</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'rating' })}
                    className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 text-left transition-colors ${qForm.question_type === 'rating' ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500/20' : 'border-[#E5E7EF] hover:border-[#D6D9E1]'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold shrink-0 ${qForm.question_type === 'rating' ? 'bg-violet-500 text-white' : 'bg-[#F4F5F8] text-[#8B90A0]'}`}>1-9</span>
                    <span>
                      <span className="block text-[11.5px] font-bold text-[#14182B]">Skala Rating</span>
                      <span className="block text-[9.5px] text-[#8B90A0] font-medium">Penilaian bebas 1–{qForm.rating_max}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'essay' })}
                    className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 text-left transition-colors ${qForm.question_type === 'essay' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/20' : 'border-[#E5E7EF] hover:border-[#D6D9E1]'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold shrink-0 ${qForm.question_type === 'essay' ? 'bg-amber-500 text-white' : 'bg-[#F4F5F8] text-[#8B90A0]'}`}>TEXT</span>
                    <span>
                      <span className="block text-[11.5px] font-bold text-[#14182B]">Esai / Uraian</span>
                      <span className="block text-[9.5px] text-[#8B90A0] font-medium">Jawaban teks, nilai via kunci</span>
                    </span>
                  </button>
                </div>
              </div>

              {qForm.question_type === 'rating' ? (
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Skala Penilaian <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <input type="number" min={2} max={10} value={qForm.rating_max}
                      onChange={e => setQForm({ ...qForm, rating_max: e.target.value })}
                      className="w-[90px] text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: Math.min(10, Math.max(2, Number(qForm.rating_max) || 9)) }, (_, i) => (
                        <span key={i} className="w-7 h-7 flex items-center justify-center rounded-full bg-violet-50 border border-violet-200 text-[11px] font-bold text-violet-600">
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-2">Kandidat memilih 1 sampai {Math.min(10, Math.max(2, Number(qForm.rating_max) || 9))}. Penilaian bebas, tanpa kunci jawaban — poin penuh diberikan jika diisi.</p>
                </div>
              ) : qForm.question_type === 'essay' ? (
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Kunci Jawaban <span className="font-medium text-[#8B90A0]">(opsional)</span></label>
                  <textarea value={qForm.keyword} onChange={e => setQForm({ ...qForm, keyword: e.target.value })}
                    placeholder="Contoh: karena, ４月, transportasi umum"
                    rows={2}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 resize-none" />
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-2">Jika diisi, jawaban siswa yang mengandung kata kunci otomatis diberi poin penuh saat submit. Jika dikosongkan, jawaban menunggu penilaian manual di <span className="font-bold">Hasil ▸ Detail Pengerjaan</span>.</p>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Opsi Jawaban <span className="text-red-400">* (min 2)</span></label>
                  <div className="space-y-2">
                    {qOptions.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button onClick={() => setQForm({ ...qForm, correct_index: String(oi) })}
                          title="Tandai sebagai jawaban benar"
                          className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full border-2 transition-colors ${qForm.correct_index === String(oi) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#E5E7EF] text-[#8B90A0] hover:border-[#0069b0]'}`}>
                          {String.fromCharCode(65 + oi)}
                        </button>
                        <input value={opt.text} onChange={e => { const arr = [...qOptions]; arr[oi] = { ...arr[oi], text: e.target.value }; setQOptions(arr) }}
                          placeholder={opt.image_path ? `Opsi ${String.fromCharCode(65 + oi)} (gambar)` : `Opsi ${String.fromCharCode(65 + oi)}`}
                          className="flex-1 text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                        <div className="relative shrink-0 h-9 w-9">
                          <label title="Unggah gambar jawaban"
                            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${opt.image_path ? 'border-transparent' : 'border-[#E5E7EF] bg-[#F4F5F8] hover:border-[#0069b0] hover:text-[#0069b0] text-[#8B90A0]'} ${uploadingOptImg === oi ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingOptImg === oi
                              ? <Loader2 size={14} className="animate-spin text-[#0069b0]" />
                              : opt.image_path
                                ? <img src={opt.image_url || ''} className="w-9 h-9 rounded-xl object-cover" alt={`Opsi ${String.fromCharCode(65 + oi)}`} />
                                : <ImageIcon size={14} />}
                            <input type="file" accept="image/*" className="hidden" disabled={uploadingOptImg !== null}
                              onChange={e => { uploadOptionImage(e.target.files?.[0], oi); e.target.value = '' }} />
                          </label>
                          {opt.image_path && (
                            <button onClick={() => setQOptions(prev => prev.map((o, i) => i === oi ? { ...o, image_path: null, image_url: null } : o))}
                              title="Hapus gambar opsi"
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white shadow">
                              <X size={11} />
                            </button>
                          )}
                        </div>
                        {qOptions.length > 2 && (
                          <button onClick={() => setQOptions(qOptions.filter((_, idx) => idx !== oi))} className="p-1 text-red-400 hover:text-red-500 shrink-0">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {qOptions.length < 6 && (
                    <button onClick={() => setQOptions([...qOptions, { text: '', image_path: null, image_url: null }])}
                      className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#0069b0]">
                      <Plus size={12} /> Tambah opsi
                    </button>
                  )}
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-2">Klik huruf <span className="font-bold text-emerald-500">A/B/C...</span> untuk menandai kunci jawaban. Klik ikon <span className="font-bold text-[#0069b0]">gambar</span> di kanan opsi untuk menjadikan opsi berupa gambar.</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Bobot Skor</label>
                  <input type="number" min={1} value={qForm.points} onChange={e => setQForm({ ...qForm, points: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                </div>
              </div>

              <button onClick={saveEditedQuestion} disabled={savingQuestion}
                className="w-full text-[12px] font-bold text-white bg-[#0069b0] py-3 rounded-xl hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                {savingQuestion ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuizManager && lesson.course && (
        <div className="fixed inset-0 z-[70] bg-[#F4F5F8] overflow-y-auto">
          <div className="px-4 py-4 max-w-lg mx-auto min-h-full">
            <GuruPaketSoal
              courseId={lesson.course_id}
              defaultBatchId={lesson.course.batch_id}
              defaultLevel={lesson.course.level}
              embedded
              onBack={() => {
                setShowQuizManager(false)
                loadLesson(lesson.id)
              }}
            />
          </div>
        </div>
      )}

      {/* Bank Paket Picker Modal */}
      {showBankPicker && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowBankPicker(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Pilih Paket Soal dari Bank</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">Centang satu atau lebih paket untuk dijadikan quiz pertemuan ini</p>
              </div>
              <button onClick={() => setShowBankPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5">
              {bankLoading ? (
                <div className="flex flex-col items-center justify-center py-14 text-[#8B90A0] text-xs gap-2">
                  <Loader2 size={24} className="animate-spin text-[#0069b0]" /> Memuat paket soal...
                </div>
              ) : bankPakets.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-3">
                    <Layers size={26} className="text-[#0069b0]" />
                  </div>
                  <p className="text-sm font-bold text-[#14182B]">Bank kosong</p>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Belum ada paket soal di bank. Buat paket baru dulu?</p>
                  <button onClick={() => { setShowBankPicker(false); setShowQuizManager(true) }}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#0069b0] px-4 py-2 rounded-md hover:bg-[#004d7a] transition-colors">
                    <Plus size={13} /> Buat Paket Soal Baru
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B90A0]" />
                    <input
                      value={bankSearch}
                      onChange={e => setBankSearch(e.target.value)}
                      placeholder="Cari paket soal berdasarkan judul..."
                      className="w-full text-xs border border-[#E5E7EF] rounded-md pl-9 pr-9 py-2.5 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all"
                    />
                    {bankSearch && (
                      <button onClick={() => setBankSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F4F5F8] hover:bg-[#E5E7EF] transition-colors">
                        <X size={11} className="text-[#8B90A0]" />
                      </button>
                    )}
                  </div>
                  {(() => {
                    const kw = bankSearch.trim().toLowerCase()
                    const filtered = kw ? bankPakets.filter(p => p.title.toLowerCase().includes(kw)) : bankPakets
                    return filtered.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-xs font-bold text-[#4B5063]">Tidak ada paket yang cocok</p>
                        <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Coba kata kunci lain</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                    {filtered.map(p => {
                      const checked = bankPickedIds.includes(p.id)
                      const attached = lessonPakets.some(x => x.id === p.id)
                      return (
                        <label key={p.id}
                          className={`flex items-center gap-3 border rounded-md px-4 py-3 transition-colors ${attached ? 'border-[#E5E7EF] bg-[#F8F9FB] opacity-70 cursor-not-allowed' : `cursor-pointer ${checked ? 'border-[#0069b0] bg-[#0069b0]/[0.04] ring-1 ring-[#0069b0]/20' : 'border-[#E5E7EF] hover:bg-[#F7F8FA]'}`}`}>
                          <input type="checkbox" checked={checked || attached} disabled={attached} onChange={() => pickBankPaket(p.id)}
                            className="w-4 h-4 rounded border-[#D6D9E1] text-[#0069b0] focus:ring-[#0069b0] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-[#14182B] truncate">{p.title}</p>
                              {p.course_id && (
                                <span className="text-[9px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-1.5 py-0.5 rounded-full shrink-0">Terhubung kursus</span>
                              )}
                              {p.status === 'nonaktif' && (
                                <span className="text-[9px] font-bold text-amber-600 shrink-0">Nonaktif</span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5 flex items-center gap-1.5">
                              {p.questions_count != null ? `${p.questions_count} soal` : 'Paket soal'}
                              {p.category && <><span>·</span><span>{p.category}</span></>}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${attached ? 'bg-[#0069b0]/10 text-[#0069b0]' : p.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-[#8B90A0]'}`}>
                            {attached ? 'Sudah terpasang' : p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                          </span>
                        </label>
                      )
                    })}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>

            {bankPakets.length > 0 && (
              <div className="px-5 py-4 border-t border-[#F0F1F5] flex items-center justify-end gap-2">
                <button onClick={() => setShowBankPicker(false)}
                  className="px-4 py-2.5 text-[11px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] rounded-md transition-colors">
                  Batal
                </button>
                <button onClick={assignBankPaket} disabled={assigningBank || bankPickedIds.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-[#0069b0] rounded-md hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                  {assigningBank ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {assigningBank ? 'Memasang...' : bankPickedIds.length > 1 ? `Pasang ${bankPickedIds.length} Paket` : 'Pasang Paket'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Materi Bank Picker Modal */}
      {showMateriPicker && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowMateriPicker(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Pilih Materi dari Bank</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">Centang satu atau lebih materi untuk ditambahkan ke pertemuan ini</p>
              </div>
              <button onClick={() => setShowMateriPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5">
              {materiBankLoading ? (
                <div className="flex flex-col items-center justify-center py-14 text-[#8B90A0] text-xs gap-2">
                  <Loader2 size={24} className="animate-spin text-[#0069b0]" /> Memuat bank materi...
                </div>
              ) : bankMateris.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 mx-auto rounded-md bg-[#0069b0]/[0.06] flex items-center justify-center mb-3">
                    <Layers size={26} className="text-[#0069b0]" />
                  </div>
                  <p className="text-sm font-bold text-[#14182B]">Bank kosong</p>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Belum ada materi di bank materi. Buat materi baru dulu?</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bankMateris.map(m => {
                    const checked = pickedMateriIds.includes(m.id)
                    const attached = lessonMateris.some(x => x.id === m.id)
                    return (
                      <label key={m.id}
                        className={`flex items-center gap-3 border rounded-md px-4 py-3 transition-colors ${attached ? 'border-[#E5E7EF] bg-[#F8F9FB] opacity-70 cursor-not-allowed' : `cursor-pointer ${checked ? 'border-[#0069b0] bg-[#0069b0]/[0.04] ring-1 ring-[#0069b0]/20' : 'border-[#E5E7EF] hover:bg-[#F7F8FA]'}`}`}>
                        <input type="checkbox" checked={checked || attached} disabled={attached} onChange={() => pickMateri(m.id)}
                          className="w-4 h-4 rounded border-[#D6D9E1] text-[#0069b0] focus:ring-[#0069b0] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#14182B] truncate">{m.title}</p>
                            {m.status === 'nonaktif' && (
                              <span className="text-[9px] font-bold text-amber-600 shrink-0">Nonaktif</span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5 flex items-center gap-1.5">
                            {m.video_url && <><Video size={9} /> Video</>}
                            {m.content && <><BookOpen size={9} /> Materi</>}
                            {m.file_name && <><FileText size={9} /> PDF</>}
                            {!m.video_url && !m.content && !m.file_name && <span>Tanpa konten</span>}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${attached ? 'bg-[#0069b0]/10 text-[#0069b0]' : m.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-[#8B90A0]'}`}>
                          {attached ? 'Sudah terpasang' : m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {bankMateris.length > 0 && (
              <div className="px-5 py-4 border-t border-[#F0F1F5] flex items-center justify-end gap-2">
                <button onClick={() => setShowMateriPicker(false)}
                  className="px-4 py-2.5 text-[11px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] rounded-md transition-colors">
                  Batal
                </button>
                <button onClick={assignMateri} disabled={assigningMateri || pickedMateriIds.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-[#0069b0] rounded-md hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                  {assigningMateri ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {assigningMateri ? 'Memasang...' : pickedMateriIds.length > 1 ? `Pasang ${pickedMateriIds.length} Materi` : 'Pasang Materi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buat Tugas Baru Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40" onClick={() => { if (!savingTask) setShowTaskModal(false) }}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-md sm:rounded-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Buat Tugas Baru</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Isi detail tugas untuk kandidat</p>
              </div>
              <button onClick={() => { if (!savingTask) setShowTaskModal(false) }} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#4B5063]">Judul Tugas <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Contoh: Tugas Setoran Hafalan" value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="mt-1.5 w-full text-xs border border-[#E5E7EF] rounded-md px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063]">Deskripsi</label>
                <textarea rows={3} placeholder="Deskripsi tugas untuk kandidat" value={taskForm.description}
                  onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1.5 w-full text-xs border border-[#E5E7EF] rounded-md px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063]">Batas Tanggal</label>
                  <input type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="mt-1.5 w-full text-xs border border-[#E5E7EF] rounded-md px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063]">Skor Maksimal</label>
                  <input type="number" min={1} max={999} placeholder="100" value={taskForm.maxScore}
                    onChange={e => setTaskForm(f => ({ ...f, maxScore: e.target.value }))}
                    className="mt-1.5 w-full text-xs border border-[#E5E7EF] rounded-md px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063]">Quiz Terkait (dari Bank Soal)</label>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Kandidat mendapat tugas sekaligus quiz dari bank soal</p>

                {taskPakets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {taskPakets.map(p => (
                      <span key={p.id} className="flex items-center gap-1.5 bg-[#0069b0]/[0.06] border border-[#0069b0]/20 text-[#0069b0] text-[11px] font-bold pl-2.5 pr-1.5 py-1 rounded-full">
                        <ListChecks size={12} />
                        <span className="max-w-[180px] truncate">{p.title}</span>
                        <button type="button" onClick={() => toggleTaskPaket(p)}
                          className="p-0.5 rounded-full hover:bg-[#0069b0]/10 transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <button type="button" onClick={toggleTaskPaketPicker} disabled={taskPakets.length > 0}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-[#0069b0]/40 bg-[#0069b0]/5 text-[#0069b0] px-3 py-2.5 rounded-md text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Plus size={13} /> Pilih Quiz dari Bank Soal
                </button>

                {showTaskPaketPicker && (
                  <div className="mt-2 border border-[#E5E7EF] rounded-md overflow-hidden">
                    <div className="px-3.5 py-2 bg-[#F8F9FB] border-b border-[#E5E7EF] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#4B5063] uppercase tracking-wide">Pilih Paket Soal</span>
                      <span className="text-[10px] font-semibold text-[#0069b0]">{taskPakets.length} dipilih</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-[#F0F1F5]">
                      {taskBankLoading ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
                          <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat bank soal...
                        </div>
                      ) : taskBankPakets.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-xs font-bold text-[#4B5063]">Bank soal kosong</p>
                          <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Belum ada paket soal di bank.</p>
                        </div>
                      ) : (
                        taskBankPakets.map(p => {
                          const sel = isTaskPaketSelected(p.id)
                          return (
                            <button key={p.id} type="button" onClick={() => toggleTaskPaket(p)}
                              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${sel ? 'bg-[#0069b0]/[0.05]' : 'hover:bg-[#F8F9FB]'}`}>
                              <span className={`w-[18px] h-[18px] rounded border flex items-center justify-center shrink-0 transition-colors ${sel ? 'border-[#0069b0] bg-[#0069b0]' : 'border-[#D6D9E1] bg-white'}`}>
                                {sel && <Check size={11} className="text-white" strokeWidth={3} />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${sel ? 'text-[#0069b0]' : 'text-[#14182B]'}`}>{p.title}</p>
                                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                                  {p.questions_count != null ? `${p.questions_count} soal` : 'Paket soal'}
                                  {p.category ? ` · ${p.category}` : ''}
                                  {p.status === 'nonaktif' && <span className="text-amber-600 font-bold"> · Nonaktif</span>}
                                </p>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                    <div className="px-3.5 py-2 border-t border-[#E5E7EF] bg-white flex justify-end">
                      <button type="button" onClick={() => setShowTaskPaketPicker(false)}
                        className="text-[11px] font-bold text-[#0069b0] hover:bg-[#0069b0]/10 px-3.5 py-1.5 rounded-md transition-colors">
                        Selesai
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063]">File Lampiran</label>
                <label
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f) setTaskFile(f)
                  }}
                  className="mt-1.5 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-[#E5E7EF] rounded-md px-4 py-6 text-center cursor-pointer hover:border-[#0069b0]/40 hover:bg-[#0069b0]/[0.02] transition-colors">
                  <input type="file" className="hidden"
                    onChange={e => setTaskFile(e.target.files?.[0] || null)} />
                  {taskFile ? (
                    <>
                      <FileText size={18} className="text-[#0069b0]" />
                      <p className="text-[11px] font-bold text-[#0069b0] max-w-full truncate px-2">{taskFile.name}</p>
                      <button type="button" onClick={e => { e.preventDefault(); setTaskFile(null) }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-600">Hapus file</button>
                    </>
                  ) : (
                    <>
                      <Upload size={18} className="text-[#8B90A0]" />
                      <p className="text-[11px] font-medium text-[#4B5063]">Seret file ke sini atau klik untuk memilih</p>
                      <p className="text-[9px] text-[#8B90A0]">PDF, Word, Excel, PPT, Teks, ZIP (maks 50MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#F0F1F5] flex items-center justify-end gap-2">
              <button onClick={() => { if (!savingTask) setShowTaskModal(false) }}
                className="px-4 py-2.5 text-[11px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] rounded-md transition-colors">
                Batal
              </button>
              <button onClick={handleSaveTask} disabled={savingTask || !taskForm.title.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-[#0069b0] rounded-md hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                {savingTask ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {savingTask ? 'Menyimpan...' : 'Buat Tugas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Penilaian Siswa Modal */}
      {showPenilaianModal && penilaianSiswa && lesson.pertemuan_date && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!savingPenilaian) setShowPenilaianModal(false) }}>
          <div className="bg-white w-full max-w-lg rounded-md overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#F0F1F5] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-[#14182B]">Penilaian Siswa</h3>
                <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                  {penilaianSiswa.nama} · Level {lesson.course?.level}
                  {penilaianData ? ` · ${penilaianData.total_pertemuan} pertemuan` : ''}
                  {lesson.pertemuan_date ? ` · ${formatDateLongIndo(lesson.pertemuan_date)}` : ''}
                </p>
              </div>
              <button onClick={() => { if (!savingPenilaian) setShowPenilaianModal(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF] shrink-0 ml-3">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-5">
              {penilaianDataLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-[11px] text-[#8B90A0] font-medium">
                  <Loader2 size={15} className="animate-spin text-[#0069b0]" /> Memuat data penilaian...
                </div>
              ) : !penilaianData ? (
                <div className="py-8 text-center text-sm text-rose-500">Gagal memuat data penilaian</div>
              ) : penilaianData.categories.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen size={24} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-[#4B5063]">Belum ada kategori penilaian</p>
                  <p className="text-xs text-[#8B90A0] mt-1">Tidak ada penilaian untuk level ini</p>
                </div>
              ) : (
                penilaianData.categories.map((cat, ci) => {
                  return (
                    <div key={ci}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-[#4B5063] uppercase tracking-wider">{cat.nama_kategori}</h4>
                        {cat.summary?.nilai_akhir !== null && cat.summary?.nilai_akhir !== undefined && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${RESIKO_STYLE[cat.summary.resiko_class || ''] || 'bg-gray-100 text-gray-500'}`}>
                            {cat.summary.resiko?.replace(/[^\w\s]/g, '') || '-'}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {cat.components.map(comp => (
                          <div key={comp.id} className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-[#4B5063] w-28 shrink-0">{comp.nama}</label>
                            <div className="relative w-full">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={scoreInputs[comp.id] ?? ''}
                                onChange={e => setScoreInputs(prev => ({ ...prev, [comp.id]: e.target.value }))}
                                placeholder="0-100"
                                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${quizSource[comp.id] ? 'border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-400' : 'border-[#E5E7EF] focus:border-[#0069b0] focus:ring-[#0069b0]'}`}
                              />
                              {quizSource[comp.id] && (
                                <span className="absolute -top-2 right-2 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                                  dari quiz
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {cat.summary?.nilai_akhir !== null && cat.summary?.nilai_akhir !== undefined && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#8B90A0]">
                          <span>Rata-rata: <strong className="text-[#14182B]">{cat.summary.nilai_akhir?.toFixed(1)}</strong></span>
                        </div>
                      )}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-[11px] border-collapse border border-slate-200 [&_th]:border [&_th]:border-slate-200 [&_td]:border [&_td]:border-slate-200">
                          <thead>
                            <tr className="bg-amber-700 text-white">
                              <th className="px-2 py-1 text-left">Tanggal</th>
                              {cat.components.map(comp => (
                                <th key={comp.id} className="px-2 py-1 text-center">{comp.nama}</th>
                              ))}
                              <th className="px-2 py-1 text-center">Rata-Rata</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.pertemuan.map((pt, pi) => {
                              const ptScores = pt.scores.filter(s => s !== null)
                              const ptAvg = ptScores.length > 0 ? ptScores.reduce((a, b) => a + b, 0) / ptScores.length : null
                              return (
                                <tr key={pi} className="border-b border-slate-100">
                                  <td className="px-2 py-1 text-slate-600">{pt.hari}, {pt.tanggal}</td>
                                  {pt.scores.map((s, j) => (
                                    <td key={j} className="px-2 py-1 text-center">
                                      {s !== null ? (
                                        <span className="inline-flex items-center gap-1">
                                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${SCORE_BADGE(s)}`}>
                                            {Math.round(s)}
                                          </span>
                                          {(pt.sources?.[j] === 'quiz') && (
                                            <span title="Otomatis dari quiz" className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                                          )}
                                        </span>
                                      ) : <span className="text-slate-300">-</span>}
                                    </td>
                                  ))}
                                  <td className="px-2 py-1 text-center font-semibold text-slate-700">
                                    {ptAvg !== null ? ptAvg.toFixed(1) : '-'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="px-5 py-4 border-t border-[#F0F1F5] flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setShowPenilaianModal(false)} disabled={savingPenilaian}
                className="px-4 py-2.5 text-[11px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] rounded-md transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSavePenilaian} disabled={savingPenilaian || penilaianDataLoading || !penilaianData}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-[#0069b0] rounded-md hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                {savingPenilaian ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {savingPenilaian ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ubah Status Kehadiran Modal */}
      {showAbsenModal && editStatusSiswa && lesson.pertemuan_date && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4" onClick={() => { if (!savingStatus) setShowAbsenModal(false) }}>
          <div className="bg-white w-full max-w-sm rounded-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#F0F1F5] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#14182B]">Ubah Kehadiran</h3>
                <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                  {editStatusSiswa.nama} · {formatDayDate(lesson.pertemuan_date)}
                </p>
              </div>
              <button onClick={() => { if (!savingStatus) setShowAbsenModal(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-[#F4F5F8] hover:bg-[#E5E7EF] shrink-0 ml-3">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              {KEHADIRAN_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setEditStatus(opt.key)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-md border transition-colors ${
                    editStatus === opt.key
                      ? 'border-[#0069b0] bg-[#0069b0]/[0.04]'
                      : 'border-[#E5E7EF] hover:border-[#D6D9E1]'
                  }`}>
                  <span className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold ${KEHADIRAN_BG[opt.key]}`}>
                    {opt.label}
                  </span>
                  <span className="text-sm font-semibold text-[#14182B]">{opt.sub}</span>
                  {editStatus === opt.key && <Check size={16} className="ml-auto text-[#0069b0]" />}
                </button>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-[#F0F1F5] flex items-center justify-end gap-2">
              <button onClick={() => setShowAbsenModal(false)} disabled={savingStatus}
                className="px-4 py-2.5 text-[11px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] rounded-md transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSaveStatus} disabled={savingStatus || !editStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-[#0069b0] rounded-md hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                {savingStatus ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {savingStatus ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
        homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard" profilHref="/guru-profil" />
    </div>
  )
}