import { useState, useEffect, useRef, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, Plus, Edit3, Trash2, Search, X, Image as ImageIcon, FileText,
  ListChecks, Eye, EyeOff, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Camera, Clock, Repeat,
  Award, Users, UserCheck, UserRound, Pencil, Loader2, ArrowLeft, Video, UploadCloud, Upload, Mic, RotateCcw,
  Settings, LayoutGrid, ShieldCheck, Link2, Building2, Layers, Settings2, FileCheck2, Radio,
  ClipboardPaste, Tags, BarChart3, Copy,
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { lmsAdminApi, adminCabangApi, jadwalLevelApi, adminQuizApi, cabangApi, APP_URL, quizReferenceApi } from '../../services/api'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import { isQuestionAudioFile, QUESTION_AUDIO_ACCEPT } from '../../utils/questionMedia'
import CertificateCard, { type Sertifikat } from '../../components/quiz/CertificateCard'
import LessonMediaFields, { LessonSlideItem } from '../../components/LessonMediaFields'
import Swal from 'sweetalert2'
import type { Pagination } from '../../types'

const cleanQuillHtml = (html: string | null | undefined) =>
  (html ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

interface ImportOpt {
  text: string
  image_path: string | null
}

interface ImportQ {
  section: string
  question: string
  image_path: string | null
  audio_path: string | null
  audio_max_plays: number | null
  options: ImportOpt[]
  correct_index: number | null
  correct_indexes: number[]
  points: number
}

const stripPoin = (s: string) => {
  const m = s.match(/\[(\d+)\s*poin\]\s*$/i) || s.match(/\((\d+)\s*poin\)\s*$/i)
  if (m && m.index !== undefined) {
    return { text: s.slice(0, m.index).trimEnd(), points: parseInt(m[1], 10) }
  }
  return { text: s, points: 0 }
}

// Stem soal yang beberapa baris (dialog "A：..." / "B：...") harus disimpan
// sebagai HTML <br> supaya tidak menyatu jadi satu baris saat dirender.
const stemToHtml = (s: string) => s.replace(/\r?\n/g, '<br />')

const stripMedia = (s: string) => {
  let text = s
  let image_path: string | null = null
  let audio_path: string | null = null
  let audio_max_plays: number | null = null
  const img = text.match(/\[gambar:([^\]]+)\]/i)
  if (img) {
    image_path = img[1].trim()
    text = text.replace(img[0], '').trim()
  }
  const aud = text.match(/\[audio:([^\]]+)\]/i)
  if (aud) {
    audio_path = aud[1].trim()
    text = text.replace(aud[0], '').trim()
  }
  const plays = text.match(/\[maks:(\d+)\]/i)
  if (plays) {
    audio_max_plays = parseInt(plays[1], 10)
    text = text.replace(plays[0], '').trim()
  }
  return { text, image_path, audio_path, audio_max_plays }
}

const parseQuestionImport = (text: string, type: 'choice' | 'multi' | 'rating' | 'essay' = 'choice'): ImportQ[] => {
  const rows = text.split(/\r?\n/)
  const isTsv = text.includes('\t')
  const result: ImportQ[] = []

  const emptyQ = (section: string): ImportQ => ({
    section, question: '', image_path: null, audio_path: null, audio_max_plays: null,
    options: [], correct_index: null, correct_indexes: [], points: 1,
  })

  if (isTsv) {
    for (const row of rows) {
      const cells = row.split('\t').map(c => c.trim())
      if (cells.length < 5) continue
      const n = cells.length
      const soal = cells[0]
      if (!soal) continue
      const optTexts = cells.slice(1, n - 3).filter(Boolean)
      const kunci = cells[n - 3]
      const section = cells[n - 2]
      const bobot = parseInt(cells[n - 1], 10)
      let correct_index: number | null = null
      const correct_indexes: number[] = []
      const kunciClean = kunci.trim()
      for (const ch of kunciClean.toUpperCase()) {
        const letter = ch.charCodeAt(0) - 65
        if (letter >= 0 && letter < optTexts.length) correct_indexes.push(letter)
      }
      if (optTexts.length > 0 && correct_indexes.length > 0) {
        correct_index = correct_indexes[0]
      } else {
        const idx = optTexts.findIndex(o => o.toLowerCase() === kunciClean.toLowerCase())
        correct_index = idx >= 0 ? idx : null
        if (idx >= 0) correct_indexes.push(idx)
      }
      result.push({
        ...emptyQ(section),
        question: soal,
        options: optTexts.map(t => ({ text: t, image_path: null })),
        correct_index,
        correct_indexes: type === 'multi' ? [...new Set(correct_indexes)] : [],
        points: isNaN(bobot) ? 1 : bobot,
      })
    }
    return result
  }

  let current: ImportQ | null = null
  let section = ''
  // Penampung stem berformat "[isi soal]" yang belum tertutup.
  let bracket: { buf: string; sec: string } | null = null
  const push = () => {
    // Soal tetap valid walau stem teksnya kosong, asal ada gambar/audio.
    if (current && (current.question || current.image_path || current.audio_path)) result.push(current)
    current = null
  }
  const startQuestion = (raw: string, sec: string) => {
    const { text, points } = stripPoin(raw)
    const media = stripMedia(text)
    current = {
      ...emptyQ(sec),
      question: stemToHtml(media.text),
      image_path: media.image_path,
      audio_path: media.audio_path,
      audio_max_plays: media.audio_max_plays,
      points: points || 1,
    }
  }

  for (const raw of rows) {
    const line = raw.trim()
    if (!line) continue

    // Lanjutan stem "[isi soal]": kumpulkan baris sampai penutup ']'
    if (bracket) {
      if (line.endsWith(']')) {
        startQuestion(`${bracket.buf}\n${line}`.replace(/\]\s*$/, '').trim(), bracket.sec)
        bracket = null
      } else {
        bracket.buf += `\n${line}`
      }
      continue
    }

    if (line.startsWith('##')) {
      push()
      section = line.replace(/^#+\s*/, '').trim()
      continue
    }
    // FORMAT "[isi soal]": stem dibungkus kurung siku, boleh multi-baris.
    // Selalu membuka soal baru, dan tidak pernah tertukar dengan awalan opsi.
    // Tag media [gambar:...] / [audio:...] / [maks:N] bukan stem.
    const br = line.match(/^\[\s*(?!\s*(?:gambar|audio|maks)\s*:)([\s\S]*)$/)
    if (br) {
      push()
      const inner = br[1]
      if (inner.trimEnd().endsWith(']')) {
        startQuestion(inner.trim().replace(/\]\s*$/, '').trim(), section)
      } else {
        bracket = { buf: inner, sec: section }
      }
      continue
    }
    const opt = line.match(/^([!*]?)\s*([A-Ha-h])[.)\-:]\s*(.+)$/)
    if (opt) {
      if (!current) current = emptyQ(section)
      const p = stripPoin(opt[3].trim())
      const media = stripMedia(p.text)
      current.options.push({ text: media.image_path ? '' : media.text, image_path: media.image_path })
      if (opt[1]) {
        current.correct_index = current.options.length - 1
        current.correct_indexes.push(current.options.length - 1)
      }
      if (p.points) current.points = p.points
      continue
    }
    // BARIS LANJUTAN: stem soal boleh beberapa baris, mis. dialog
    // "A：..." / "B：..." pada soal bahasa. Selama soal saat ini belum punya
    // opsi, baris ini digabung ke stem, bukan jadi soal baru. Jika tidak,
    // baris "A：" akan menjadi soal tanpa opsi dan baris "B：" yang justru
    // soal terpisah.
    if (current && type === 'choice' && !current.options.length && current.question) {
      const cont = stripPoin(line)
      const media = stripMedia(cont.text)
      if (media.text) current.question = `${current.question}<br />${media.text}`.trim()
      if (cont.points) current.points = cont.points
      if (media.image_path && !current.image_path) current.image_path = media.image_path
      if (media.audio_path && !current.audio_path) current.audio_path = media.audio_path
      if (media.audio_max_plays) current.audio_max_plays = media.audio_max_plays
      continue
    }
    push()
    startQuestion(line, section)
  }
  // Stem "[isi soal]" yang tidak ditutup tetap dipakai sebagai soal.
  if (bracket) {
    startQuestion(bracket.buf.trim(), bracket.sec)
    bracket = null
  }
  push()
  return result
}

interface RekapPaketCol {
  id: number
  title: string
  category: string
  batch_name: string | null
  level: string | null
  passing_score: number
  questions_count: number
}

interface RekapKandidat {
  siswa_id: number
  nama: string
  nik: string | null
  no_registrasi: string | null
  kelas: string | null
  batch_id: number | null
  level: string | null
  scores: Record<string, number>
  paket_kerjakan: number
  total_paket: number
  rata_rata: number
  terbaik: number
  terendah: number
  peringkat: number
}

interface RekapNilai {
  filters: {
    kategori: string[]
    batch: { id: number; nama: string; warna: string | null }[]
    level: string[]
  }
  ringkasan: {
    total_paket: number
    total_kandidat: number
    total_kandidat_ter_filter: number
    rata_rata: number
    tertinggi: number
    terendah: number
    lulus: number
  }
  paket: RekapPaketCol[]
  kandidat: RekapKandidat[]
  pagination: Pagination
}

interface Course {
  id: number
  title: string
  description: string | null
  level: string | null
  batch_id: number | null
  image: string | null
  category_id: number | null
  category: { id: number; name: string; sort: number } | null
  sort: number
  status: string
  kelas_sensei_id: number | null
  sensei_nama?: string | null
  sensei_id?: number | null
  nama_kelas?: string | null
  lessons_count: number
  files_count: number
  alert?: string | null
  alert_active?: boolean
  password_course?: string | null
}

interface LmsCategory {
  id: number
  name: string
  sort: number
  courses_count: number
}

const importSample = `## Vocabulary
[Arti kata "watashi" adalah...]
*a. saya
b. kamu
c. dia
d. kami   [2 poin]

[Bentuk lampau dari "taberu" adalah...]
a. taberu
*b. tabeta
c. tabemasu
d. tabete

## Grammar
[Partikel penanda subjek adalah...]
*a. wa
b. wo
c. ni
d. de

[Urutan kalimat bahasa Jepang yang benar adalah...]
a. S-O-V
*b. S-P-O
c. O-S-P
d. P-S-O

## Soal Dialog
[A：すみません。たなかさんは、どの人ですか？
B：たなかさん？あそこに います（_____）。]
*a. ね
b. よ
c. か
d. し   [5 poin]

## Listening
[Pilih gambar yang benar [gambar:https://contoh.com/soal-audio.jpg]]
*a. [gambar:https://contoh.com/opsi-a.png]
b. [gambar:https://contoh.com/opsi-b.png]
c. [gambar:https://contoh.com/opsi-c.png]

[Dengarkan audio berikut lalu jawab [audio:https://contoh.com/audio.mp3] [maks:2]]
a. jawaban 1
*b. jawaban 2
c. jawaban 3

## Tanpa Kurung Siku
[Tetap boleh ditulis tanpa kurung siku, selama opsi belum dimulai:]
a. benar
*b. salah   [1 poin]`

interface Batch { id: number; nama_batch: string; warna?: string | null; cabang_id?: number | null }
interface CourseOption { id: number; title: string }
interface Category { id: number; name: string; paket_count?: number }

const mediaUrl = (u?: string | null): string => {
  if (!u) return ''
  if (/^(https?:)?\/\//i.test(u) || u.startsWith('data:')) return u
  return `${APP_URL}/storage/${u.replace(/^\/+/, '')}`
}

const COURSE_PER_PAGE = 10
const BANK_PER_PAGE = 10
const REKAP_PER_PAGE = 15

interface MateriItem {
  id: number
  course_id: number | null
  title: string
  content: string | null
  video_url: string | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  sort: number
  status: string
  course: { id: number; title: string } | null
  lessons_count: number
  slides?: { id: number; file_path: string; file_name: string; file_type?: string | null; url?: string }[]
}

interface QuizPaket {
  id: number
  title: string
  description: string | null
  course_id: number | null
  batch_id: number | null
  level: string | null
  category: string | null
  time_limit_minutes: number
  max_attempts: number
  max_warnings: number
  passing_score: number
  shuffle_questions: boolean
  quiz_template: string
  status: string
  questions_count: number
  attempts_count: number
  participants: number
  best_score: number
  guru_name: string
  user_id: number | null
  cover_image: string | null
  cover_url: string | null
  camera_enabled: boolean
  block_exit: boolean
  penilaian_ulangan?: boolean
  sertifikasi_aktif?: boolean
  sertifikat_wajib_foto?: boolean
  sertifikat_judul?: string | null
  sertifikat_penerbit?: string | null
  sertifikat_berlaku_hari?: number | null
  batch?: { id: number; nama_batch: string } | null
  course?: { id: number; title: string } | null
}

interface Question {
  id: number
  question: string
  section_id: number | null
  section: { id: number; name: string } | null
  question_type: string
  rating_max: number | null
  options: (string | { text?: string; image_path?: string | null; image_url?: string | null })[]
  correct_index: number | null
  correct_indexes: number[] | null
  keyword: string | null
  points: number
  sort: number
  image_path: string | null
  image_url: string | null
  audio_path: string | null
  audio_url: string | null
  audio_max_plays: number | null
}

interface SectionItem {
  id: number
  name: string
  sort: number
  questions_count: number
}

interface Participant {
  siswa_id: number
  nama: string
  cabang: string | null
  batch: string | null
  level: number | string | null
  attempts_count: number
  best_score: number
  attempts: AttemptRow[]
}

interface AttemptSection {
  id: number
  name: string
  total: number
  correct: number
  percent: number
}

interface AttemptRow {
  attempt_id: number
  attempt_number: number
  status: string
  score: number | null
  correct_count: number | null
  total_count: number | null
  warnings: number
  auto_submitted: boolean
  sections?: AttemptSection[]
  started_at: string | null
  submitted_at: string | null
  webcam_photo: string | null
}

interface DetailRow {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: (string | { text?: string; image_path?: string | null; image_url?: string | null })[]
  correct_index: number | null
  correct_indexes?: number[] | null
  keyword: string | null
  points: number
  sort: number
  selected_index: number | null
  selected_indexes?: number[] | null
  answer_text: string | null
  earned_points: number | null
  is_correct: boolean | null
}

interface QuizOpt {
  text: string
  image_path: string | null
  image_url: string | null
}

interface LessonItem {
  id: number
  course_id: number | null
  paket_id: number | null
  title: string
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_size?: number | null
  slides?: LessonSlideData[]
  sort: number
  status: string
}

interface LessonSlideData {
  id: number
  file_path: string
  file_name: string
  file_type: string | null
  file_size?: number | null
  sort?: number
}

type View = 'list' | 'quiz' | 'bank' | 'materi-bank' | 'quiz-questions' | 'quiz-results' | 'quiz-materi' | 'rekap-nilai'

const inputCls = 'w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none focus:border-[#1a73e8] focus:border-[#1a73e8] bg-white'
const labelCls = 'block text-sm font-medium text-[#3c4043] mb-1'
const primaryBtn = 'inline-flex items-center gap-2 bg-[#0E6187] hover:bgbg-[#e8f0fe] text-white px-4 py-2.5 text-sm font-semibold transition-colors  disabled:opacity-50'

const emptyPaketForm = {
  title: '', description: '', course_id: '', batch_id: '', level: '', category: '',
  time_limit_minutes: '30', max_attempts: '3', max_warnings: '3',
  passing_score: '0', shuffle_questions: true, quiz_template: 'basic', status: 'nonaktif', user_id: '',
  camera_enabled: true, block_exit: true, penilaian_ulangan: false,
  cover_image: '',
  sertifikasi_aktif: false,
  sertifikat_judul: '',
  sertifikat_penerbit: '',
  sertifikat_berlaku_hari: '',
  sertifikat_wajib_foto: true,
}
const emptyQuestionForm = { question: '', section_id: '', question_type: 'choice', rating_max: '9', correct_index: '', correct_indexes: [] as number[], points: '1', keyword: '', image_path: '', image_url: '', audio_path: '', audio_url: '', audio_max_plays: '2' }

const DEFAULT_SECTIONS = ['Script and Vocabulary', 'Grammar', 'Reading', 'Listening', 'Conversation', 'Kanji', 'Vocabulary']

/** Badge nama sensei pengajar. "Manual" = kursus dibuat admin, bukan lewat Tambah Kelas. */
const SenseiBadge = ({ nama, namaKelas }: { nama?: string | null; namaKelas?: string | null }) => {
  if (!nama) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-[#80868b]">
        <UserRound size={10} /> Manual
      </span>
    )
  }
  return (
    <span
      title={namaKelas ? `Pengajar: ${nama} · Kelas ${namaKelas}` : `Pengajar: ${nama}`}
      className="inline-flex max-w-[150px] shrink-0 items-center gap-1 bgbg-[#f1f3f4] px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-[#1a73e8]"
    >
      <UserRound size={10} className="shrink-0" />
      <span className="truncate">{nama}</span>
    </span>
  )
}

export default function DataCourse() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAdminCabang = location.pathname.startsWith('/admin-cabang')
  const base = isAdminCabang ? '/admin-cabang/lms' : '/lms'

  function parseRoute(path: string) {
    const rest = path.startsWith('/admin-cabang/lms') ? path.slice('/admin-cabang/lms'.length) : path.slice('/lms'.length)
    const parts = rest.split('/').filter(Boolean)
    const r: { view: View; source: 'course' | 'bank'; courseId?: number; paketId?: number } = { view: 'list', source: 'course' }
    if (parts[0] === 'bank-paket-soal') r.view = 'bank'
    else if (parts[0] === 'rekap-nilai') r.view = 'rekap-nilai'
    else if (parts[0] === 'bank-materi') r.view = 'materi-bank'
    else if (parts[0] === 'course' && parts[1]) {
      r.courseId = Number(parts[1])
      if (parts[2] === 'soal' && parts[3]) { r.view = 'quiz-questions'; r.paketId = Number(parts[3]) }
      else if (parts[2] === 'materi' && parts[3]) { r.view = 'quiz-materi'; r.paketId = Number(parts[3]) }
      else if (parts[2] === 'hasil' && parts[3]) { r.view = 'quiz-results'; r.paketId = Number(parts[3]) }
      else r.view = 'quiz'
    } else if (parts[0] === 'paket' && parts[1]) {
      r.paketId = Number(parts[1])
      if (parts[2] === 'materi') { r.view = 'quiz-materi'; r.source = 'bank' }
      else if (parts[2] === 'hasil') { r.view = 'quiz-results'; r.source = 'bank' }
      else { r.view = 'quiz-questions'; r.source = 'bank' }
    }
    return r
  }

  function routeTo(viewName: View, source: 'course' | 'bank', courseId?: number, paketId?: number): string {
    if (viewName === 'bank') return `${base}/bank-paket-soal`
    if (viewName === 'rekap-nilai') return `${base}/rekap-nilai`
    if (viewName === 'materi-bank') return `${base}/bank-materi`
    if (viewName === 'quiz' && courseId) return `${base}/course/${courseId}`
    if (viewName === 'quiz-questions') return source === 'bank' && paketId ? `${base}/paket/${paketId}/soal` : `${base}/course/${courseId}/soal/${paketId}`
    if (viewName === 'quiz-materi') return source === 'bank' && paketId ? `${base}/paket/${paketId}/materi` : `${base}/course/${courseId}/materi/${paketId}`
    if (viewName === 'quiz-results') return source === 'bank' && paketId ? `${base}/paket/${paketId}/hasil` : `${base}/course/${courseId}/hasil/${paketId}`
    return base
  }

  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchLevels, setBatchLevels] = useState<Record<number, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  // Filter cabang + batch (level tidak dipakai sebagai filter di list ini).
  const [filterCabang, setFilterCabang] = useState('')
  const [cabangOptions, setCabangOptions] = useState<{ id: number; nama_cabang: string }[]>([])
  // Pemisahan asal kursus: '' = semua, 'manual' = dibuat admin, 'sensei' =
  // dibuat dari menu Tambah Kelas dan punya pengajar.
  const [filterSource, setFilterSource] = useState<'' | 'manual' | 'sensei'>('')
  const [refPendingCount, setRefPendingCount] = useState(0)
  
  const [coursePage, setCoursePage] = useState(1)
  const [coursePagination, setCoursePagination] = useState<Pagination>({ current_page: 1, last_page: 1, total: 0, per_page: COURSE_PER_PAGE })

  const [view, setView] = useState<View>(() => parseRoute(location.pathname).view)
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)

  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: '', batch_id: '', category_id: '', sort: '0', status: 'aktif', alert: '', alert_active: true, password_course: '' })
  const [categories, setCategories] = useState<LmsCategory[]>([])
  const [showCourseCatModal, setShowCourseCatModal] = useState(false)
  const [courseCatForm, setCourseCatForm] = useState({ name: '', sort: '0' })
  const [editingCourseCat, setEditingCourseCat] = useState<LmsCategory | null>(null)
  const [savingCourseCat, setSavingCourseCat] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [showPasswordCourse, setShowPasswordCourse] = useState(false)
  const quillRef = useRef<any>(null)
  const questionQuillRef = useRef<any>(null)
  const seededSectionsRef = useRef<Set<number>>(new Set())
  const activePaketIdRef = useRef<number | null>(null)

  const [quizPakets, setQuizPakets] = useState<QuizPaket[]>([])
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizCategories, setQuizCategories] = useState<Category[]>([])
  const [bankTotalPakets, setBankTotalPakets] = useState(0)
  const [quizSearch, setQuizSearch] = useState('')

  const [bankPakets, setBankPakets] = useState<QuizPaket[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const [bankPage, setBankPage] = useState(1)
  const [bankCategory, setBankCategory] = useState('')
  const [bankPagination, setBankPagination] = useState<Pagination>({ current_page: 1, last_page: 1, total: 0, per_page: BANK_PER_PAGE })
  const [quizSource, setQuizSource] = useState<'course' | 'bank'>('course')

  // Rekap nilai kandidat (kategori paket + batch + level)
  const [rekap, setRekap] = useState<RekapNilai | null>(null)
  const [rekapLoading, setRekapLoading] = useState(false)
  const [rekapPage, setRekapPage] = useState(1)
  const [rekapCategory, setRekapCategory] = useState('')
  const [rekapBatch, setRekapBatch] = useState('')
  const [rekapLevel, setRekapLevel] = useState('')
  const [rekapSearch, setRekapSearch] = useState('')

  const [showPaketModal, setShowPaketModal] = useState(false)
  const [editingPaket, setEditingPaket] = useState<QuizPaket | null>(null)
  const [paketForm, setPaketForm] = useState({ ...emptyPaketForm })
  const [savingPaket, setSavingPaket] = useState(false)
  const [coverPreview, setCoverPreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [showBankPickerModal, setShowBankPickerModal] = useState(false)
  const [bankPickerPakets, setBankPickerPakets] = useState<QuizPaket[]>([])
  const [bankPickerLoading, setBankPickerLoading] = useState(false)
  const [bankPickedIds, setBankPickedIds] = useState<number[]>([])
  const [assigningPakets, setAssigningPakets] = useState(false)

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const [savingCategory, setSavingCategory] = useState(false)

  const [activeQuizPaket, setActiveQuizPaket] = useState<QuizPaket | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizSections, setQuizSections] = useState<SectionItem[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qPage, setQPage] = useState(1)
  const qPerPage = 10
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ ...emptyQuestionForm })
  const [qOptions, setQOptions] = useState<QuizOpt[]>([{ text: '', image_path: null, image_url: null }, { text: '', image_path: null, image_url: null }])
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importType, setImportType] = useState<'choice' | 'multi' | 'rating' | 'essay'>('choice')
  const [importParse, setImportParse] = useState<ImportQ[]>([])
  const [savingImport, setSavingImport] = useState(false)
  const [importError, setImportError] = useState('')
  const [importingMedia, setImportingMedia] = useState<'gambar' | 'audio' | null>(null)
  const [importMedia, setImportMedia] = useState<{ type: 'gambar' | 'audio'; url: string; name: string }[]>([])
  const importTextRef = useRef<HTMLTextAreaElement>(null)
  const importImgInputRef = useRef<HTMLInputElement>(null)
  const importAudioInputRef = useRef<HTMLInputElement>(null)
  const [uploadingOptImg, setUploadingOptImg] = useState<number | null>(null)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showSectionListModal, setShowSectionListModal] = useState(false)
  const [editingQSection, setEditingQSection] = useState<SectionItem | null>(null)
  const [qSectionName, setQSectionName] = useState('')
  const [qSectionFilter, setQSectionFilter] = useState<'all' | 'none' | number>('all')
  const [savingSection, setSavingSection] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)

  const [participants, setParticipants] = useState<Participant[]>([])
  const [rLoading, setRLoading] = useState(false)
  const [rGroupBy, setRGroupBy] = useState<'all' | 'cabang' | 'batch' | 'level' | 'none'>('all')
  const [rFCabang, setRFCabang] = useState('')
  const [rFBatch, setRFBatch] = useState('')
  const [rFLevel, setRFLevel] = useState('')
  const [rFSearch, setRFSearch] = useState('')
  const [rPage, setRPage] = useState(1)
  const [rCollapsed, setRCollapsed] = useState<Record<string, boolean>>({})
  const R_PER_PAGE = 10
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detail, setDetail] = useState<{ attempt: any; questions: DetailRow[]; siswa: any; sertifikat?: Sertifikat | null } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [savingGrade, setSavingGrade] = useState<number | null>(null)

  const [materiLessons, setMateriLessons] = useState<LessonItem[]>([])
  const [materiLoading, setMateriLoading] = useState(false)
  const [materiPaket, setMateriPaket] = useState<QuizPaket | null>(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', sort: '0', status: 'aktif' })
  const [lessonPdf, setLessonPdf] = useState<File | null>(null)
  const [lessonPdfName, setLessonPdfName] = useState<string | null>(null)
  const [lessonPdfSize, setLessonPdfSize] = useState<number | null>(null)
  const [lessonSlides, setLessonSlides] = useState<LessonSlideItem[]>([])
  const [removedSlideIds, setRemovedSlideIds] = useState<number[]>([])
  const materiQuillRef = useRef<any>(null)

  const [bankMateris, setBankMateris] = useState<MateriItem[]>([])
  const [bankMateriLoading, setBankMateriLoading] = useState(false)
  const [bankMateriSearch, setBankMateriSearch] = useState('')
  const [showMateriModal, setShowMateriModal] = useState(false)
  const [editingMateri, setEditingMateri] = useState<MateriItem | null>(null)
  const [savingMateri, setSavingMateri] = useState(false)
  const [materiForm, setMateriForm] = useState({ course_id: '', title: '', content: '', video_url: '', sort: '0', status: 'aktif' })
  const [materiPdf, setMateriPdf] = useState<File | null>(null)
  const [materiPdfName, setMateriPdfName] = useState<string | null>(null)
  const [materiPdfSize, setMateriPdfSize] = useState<number | null>(null)
  const [materiSlides, setMateriSlides] = useState<LessonSlideItem[]>([])
  const [removedMateriSlideIds, setRemovedMateriSlideIds] = useState<number[]>([])
  const bankMateriQuillRef = useRef<any>(null)

  const [courseTab, setCourseTab] = useState<'lessons' | 'quiz'>('lessons')
  const [courseLessons, setCourseLessons] = useState<LessonItem[]>([])
  const [courseLessonsLoading, setCourseLessonsLoading] = useState(false)
  const [lessonSource, setLessonSource] = useState<'paket' | 'course'>('paket')

  // ==================== Welcome Video Setting ====================
  const [showWelcomeSettings, setShowWelcomeSettings] = useState(false)
  const [welcomeVideo, setWelcomeVideo] = useState<string | null>(null)
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState<string | null>(null)
  const [welcomeFile, setWelcomeFile] = useState<File | null>(null)
  const [welcomeUrlInput, setWelcomeUrlInput] = useState('')
  const [welcomeSaving, setWelcomeSaving] = useState(false)
  const [welcomeLoading, setWelcomeLoading] = useState(false)

  const openWelcomeSettings = async () => {
    setShowWelcomeSettings(true)
    setWelcomeLoading(true)
    setWelcomeFile(null)
    setWelcomeUrlInput('')
    try {
      const res = await lmsAdminApi.welcomeInfo()
      setWelcomeVideo(res.data.welcome_video || null)
      setWelcomeVideoUrl(res.data.welcome_video_url || null)
    } catch {
      setWelcomeVideo(null)
      setWelcomeVideoUrl(null)
    } finally {
      setWelcomeLoading(false)
    }
  }

  const handleSaveWelcomeVideo = async () => {
    if (!welcomeFile) return
    setWelcomeSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', welcomeFile)
      const res = await lmsAdminApi.uploadWelcomeVideo(fd)
      setWelcomeVideo(res.data.welcome_video || null)
      setWelcomeVideoUrl(res.data.welcome_video_url || null)
      setWelcomeFile(null)
      Swal.fire({
        icon: 'success',
        title: 'Tersimpan',
        text: 'Video selamat datang berhasil disimpan',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal menyimpan video selamat datang'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setWelcomeSaving(false)
    }
  }

  const handleSaveWelcomeUrl = async () => {
    const url = welcomeUrlInput.trim()
    if (!url) return
    if (!getYouTubeEmbedUrl(url) && !url.startsWith('http')) {
      Swal.fire({ icon: 'warning', title: 'URL tidak valid', text: 'Masukkan URL YouTube yang valid (youtube.com/watch, youtu.be, shorts, dll.)' })
      return
    }
    setWelcomeSaving(true)
    try {
      const res = await lmsAdminApi.saveWelcomeVideoUrl(url)
      setWelcomeVideoUrl(res.data.welcome_video_url || null)
      setWelcomeVideo(res.data.welcome_video || null)
      setWelcomeUrlInput('')
      setWelcomeFile(null)
      Swal.fire({
        icon: 'success',
        title: 'Tersimpan',
        text: 'URL video selamat datang berhasil disimpan',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal menyimpan URL video selamat datang'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setWelcomeSaving(false)
    }
  }

  const handleDeleteWelcomeVideo = async () => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Hapus video selamat datang?',
      text: 'Video ini akan dihapus dari halaman LMS siswa',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d93025',
    })
    if (!confirm.isConfirmed) return
    try {
      await lmsAdminApi.deleteWelcomeVideo()
      setWelcomeVideo(null)
      setWelcomeVideoUrl(null)
      setWelcomeFile(null)
      setWelcomeUrlInput('')
      Swal.fire({
        icon: 'success',
        title: 'Dihapus',
        text: 'Video selamat datang dihapus',
        timer: 1800,
        showConfirmButton: false,
      })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal hapus video selamat datang' })
    }
  }

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video', 'file'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            setUploadingImg(true)
            try {
              const fd = new FormData()
              fd.append('file', file)
              const res = await lmsAdminApi.upload(fd)
              const quill = quillRef.current?.getEditor()
              const range = quill?.getSelection()
              quill?.insertEmbed(range?.index || 0, 'image', res.data.url)
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal upload gambar' })
            } finally {
              setUploadingImg(false)
            }
          }
          input.click()
        },
        file: () => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            setUploadingImg(true)
            try {
              const fd = new FormData()
              fd.append('file', file)
              const res = await lmsAdminApi.upload(fd)
              const quill = quillRef.current?.getEditor()
              const range = quill?.getSelection(true)
              quill?.insertText(range?.index || 0, ` ${file.name} `, 'link', res.data.url)
              quill?.setSelection((range?.index || 0) + file.name.length + 2)
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal upload file' })
            } finally {
              setUploadingImg(false)
            }
          }
          input.click()
        },
      },
    },
  }
  const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image', 'video']

  const questionQuillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'file'],
        ['clean'],
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            setUploadingImg(true)
            try {
              const fd = new FormData()
              fd.append('file', file)
              const res = await lmsAdminApi.upload(fd)
              const quill = questionQuillRef.current?.getEditor()
              const range = quill?.getSelection()
              quill?.insertEmbed(range?.index || 0, 'image', res.data.url)
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal upload gambar' })
            } finally {
              setUploadingImg(false)
            }
          }
          input.click()
        },
        file: () => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            setUploadingImg(true)
            try {
              const fd = new FormData()
              fd.append('file', file)
              const res = await lmsAdminApi.upload(fd)
              const quill = questionQuillRef.current?.getEditor()
              const range = quill?.getSelection(true)
              quill?.insertText(range?.index || 0, ` ${file.name} `, 'link', res.data.url)
              quill?.setSelection((range?.index || 0) + file.name.length + 2)
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal upload file' })
            } finally {
              setUploadingImg(false)
            }
          }
          input.click()
        },
      },
    },
  }

  useEffect(() => { fetchCourses(); fetchQuizMeta(); fetchCategories() }, [])
  useEffect(() => {
    if (isAdminCabang) return
    cabangApi.list()
      .then(res => setCabangOptions(res.data?.data || res.data || []))
      .catch(() => {})
  }, [isAdminCabang])
  useEffect(() => {
    quizReferenceApi.adminPendingCount().then(res => setRefPendingCount(res.data.pending || 0)).catch(() => {})
  }, [])
  const courseFilterFirstRef = useRef(true)
  useEffect(() => {
    if (courseFilterFirstRef.current) { courseFilterFirstRef.current = false; return }
    if (view !== 'list') return
    const t = setTimeout(() => { setCoursePage(1); fetchCourses(1) }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterLevel, filterBatch, filterSource, filterCabang])
  const bankSearchFirstRef = useRef(true)
  useEffect(() => {
    if (bankSearchFirstRef.current) { bankSearchFirstRef.current = false; return }
    if (view !== 'bank') return
    const t = setTimeout(() => { setBankPage(1); fetchBankPakets(1) }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankSearch])
  useEffect(() => {
    const r = parseRoute(location.pathname)
    setView(r.view)
    setQuizSource(r.source)

    if (r.view === 'bank') fetchBankPakets()
    if (r.view === 'materi-bank') fetchBankMateris()
    if (r.view === 'rekap-nilai') fetchRekap(1)

    if (r.view === 'quiz' && r.courseId && (!activeCourse || activeCourse.id !== r.courseId)) {
      lmsAdminApi.courses().then(res => {
        const list: Course[] = res.data.courses || res.data || []
        const c = list.find((x: Course) => x.id === r.courseId)
        if (c) {
          setActiveCourse(c)
          setCourseTab(c.kelas_sensei_id ? 'lessons' : 'quiz')
          fetchCourseLessons(c.id)
          fetchQuizPakets(c.id)
        }
      }).catch(() => {})
    }

    if ((r.view === 'quiz-questions' || r.view === 'quiz-results' || r.view === 'quiz-materi') && r.paketId) {
      if (r.courseId && (!activeCourse || activeCourse.id !== r.courseId)) {
        lmsAdminApi.courses().then(res => {
          const list: Course[] = res.data.courses || res.data || []
          const c = list.find((x: Course) => x.id === r.courseId)
          if (c) setActiveCourse(c)
        }).catch(() => {})
      }
      const currentId = r.view === 'quiz-materi' ? materiPaket?.id : activeQuizPaket?.id
      if (!currentId || currentId !== r.paketId) {
        adminQuizApi.pakets().then(res => {
          const p = (res.data.pakets || []).find((x: QuizPaket) => x.id === r.paketId)
          if (!p) return
          if (r.view === 'quiz-questions') {
            setActiveQuizPaket(p)
            setQPage(1)
            loadQuestionEditor(p)
          } else if (r.view === 'quiz-results') {
            setActiveQuizPaket(p)
            setRLoading(true)
            setRPage(1)
            setRCollapsed({})
            adminQuizApi.results(p.id).then(q => setParticipants(q.data.participants || [])).catch(() => setParticipants([])).finally(() => setRLoading(false))
          } else {
            setMateriPaket(p)
            fetchMateriLessons(p.id)
          }
        }).catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const fetchCategories = () => {
    if (isAdminCabang) { setCategories([]); return }
    lmsAdminApi.categories().then(res => {
      setCategories(res.data.categories || [])
    }).catch(() => setCategories([]))
  }

  const openCreateCourseCat = () => {
    setEditingCourseCat(null)
    setCourseCatForm({ name: '', sort: '0' })
    setShowCourseCatModal(true)
  }

  const openEditCourseCat = (cat: LmsCategory) => {
    setEditingCourseCat(cat)
    setCourseCatForm({ name: cat.name, sort: cat.sort.toString() })
    setShowCourseCatModal(true)
  }

  const saveCourseCat = async () => {
    const name = courseCatForm.name.trim()
    if (!name) {
      Swal.fire({ icon: 'warning', title: 'Nama kategori wajib diisi' }); return
    }
    setSavingCourseCat(true)
    try {
      const data = { name, sort: Number(courseCatForm.sort) || 0 }
      if (editingCourseCat) await lmsAdminApi.updateCategory(editingCourseCat.id, data)
      else await lmsAdminApi.storeCategory(data)
      setShowCourseCatModal(false)
      fetchCategories()
      fetchCourses()
      Swal.fire({ icon: 'success', title: editingCourseCat ? 'Kategori diperbarui' : 'Kategori dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan kategori' })
    } finally {
      setSavingCourseCat(false)
    }
  }

  const deleteCourseCat = (cat: LmsCategory) => {
    Swal.fire({
      title: 'Hapus kategori?', text: `"${cat.name}" beserta kursus didalamnya akan dilepas dari kategori ini`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d93025', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        lmsAdminApi.deleteCategory(cat.id).then(() => {
          fetchCategories()
          fetchCourses()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const fetchCourses = (page?: number) => {
    setLoading(true)
    const targetPage = page ?? coursePage
    if (isAdminCabang) {
      adminCabangApi.lms({
        page: targetPage,
        per_page: COURSE_PER_PAGE,
        search: search.trim() || undefined,
        level: filterLevel || undefined,
        batch_id: filterBatch || undefined,
        source: filterSource || undefined,
        // Cabang untuk admin cabang sudah dibatasi server, jadi tak perlu dikirim.
      }).then(res => {
        const list = res.data.courses || []
        setCourses(list)
        setBatches(res.data.batches || [])
        setCoursePagination(res.data.pagination || { current_page: 1, last_page: 1, total: list.length, per_page: COURSE_PER_PAGE })
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      lmsAdminApi.courses({
        page: targetPage,
        per_page: COURSE_PER_PAGE,
        search: search.trim() || undefined,
        level: filterLevel || undefined,
        batch_id: filterBatch || undefined,
        source: filterSource || undefined,
        cabang_id: filterCabang || undefined,
      }).then(res => {
        setCourses(res.data.courses || [])
        setBatches(res.data.batches || [])
        setCoursePagination(res.data.pagination || { current_page: 1, last_page: 1, total: 0, per_page: COURSE_PER_PAGE })
      }).catch(() => {}).finally(() => setLoading(false))
    }
    const levelPromise = isAdminCabang ? adminCabangApi.jadwalLevel() : jadwalLevelApi.list()
    levelPromise.then(res => {
      const map: Record<number, string[]> = {}
      const jadwal = res.data.jadwal || {}
      Object.values(jadwal).forEach((item: any) => {
        const bid = Number(item?.batch_id)
        if (!bid) return
        if (!map[bid]) map[bid] = []
        const lvl = String(item.level)
        if (!map[bid].includes(lvl)) map[bid].push(lvl)
      })
      Object.keys(map).forEach(k => map[Number(k)].sort((a, b) => Number(a) - Number(b)))
      setBatchLevels(map)
    }).catch(() => {})
  }

  const fetchQuizMeta = () => {
    adminQuizApi.meta().then(res => {
      setQuizCategories(res.data.categories || [])
      setBankTotalPakets(Number(res.data.total_pakets) || 0)
    }).catch(() => {})
  }

  const fetchQuizPakets = (courseId: number) => {
    setQuizLoading(true)
    adminQuizApi.pakets().then(res => {
      const all = res.data.pakets || []
      setQuizPakets(all.filter((p: QuizPaket) => p.course_id === courseId))
    }).catch(() => setQuizPakets([])).finally(() => setQuizLoading(false))
  }

  const fetchBankPakets = (page?: number, category?: string) => {
    setBankLoading(true)
    const filterCat = (category !== undefined ? category : bankCategory).trim()
    adminQuizApi.pakets({ page: page ?? bankPage, per_page: BANK_PER_PAGE, search: bankSearch.trim() || undefined, category: filterCat || undefined }).then(res => {
      const all = res.data.pakets || []
      setBankPakets(all)
      setBankPagination(res.data.pagination || { current_page: 1, last_page: 1, total: all.length, per_page: BANK_PER_PAGE })
    }).catch(() => setBankPakets([])).finally(() => setBankLoading(false))
  }

  const fetchRekap = (page?: number) => {
    setRekapLoading(true)
    lmsAdminApi.rekapNilai({
      page: page ?? rekapPage,
      per_page: REKAP_PER_PAGE,
      category: rekapCategory || undefined,
      batch_id: rekapBatch || undefined,
      level: rekapLevel || undefined,
      search: rekapSearch.trim() || undefined,
    }).then(res => {
      setRekap(res.data)
    }).catch(() => setRekap(null)).finally(() => setRekapLoading(false))
  }

  const openRekap = () => {
    setRekapPage(1)
    setRekapSearch('')
    setView('rekap-nilai')
    fetchRekap(1)
    navigate(`${base}/rekap-nilai`)
  }

  const backToBankFromRekap = () => {
    setRekapPage(1)
    setView('bank')
    fetchBankPakets(1)
    navigate(`${base}/bank-paket-soal`)
  }

  const selectBankCategory = (category: string) => {
    if (category === bankCategory) return
    setBankCategory(category)
    setBankPage(1)
    fetchBankPakets(1, category)
  }

  const openBank = () => {
    setQuizSource('course')
    setBankSearch('')
    setBankPage(1)
    setBankCategory('')
    setActiveQuizPaket(null)
    setActiveCourse(null)
    setView('bank')
    fetchBankPakets(1)
    navigate(`${base}/bank-paket-soal`)
  }

  const openCreateBankPaket = () => {
    setEditingPaket(null)
    setPaketForm({ ...emptyPaketForm, course_id: '', category: bankCategory })
    setCoverPreview('')
    setQuizSource('bank')
    setShowPaketModal(true)
  }

  const openBankPicker = () => {
    if (!activeCourse) return
    setBankPickedIds([])
    setBankPickerLoading(true)
    setShowBankPickerModal(true)
    adminQuizApi.pakets().then(res => {
      const all = res.data.pakets || []
      setBankPickerPakets(all.filter((p: QuizPaket) => !p.course_id))
    }).catch(() => setBankPickerPakets([])).finally(() => setBankPickerLoading(false))
  }

  const toggleBankPick = (id: number) => {
    setBankPickedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const assignSelectedPakets = async () => {
    if (!activeCourse) return
    if (bankPickedIds.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih paket dulu', text: 'Centang paket soal dari bank yang ingin ditambahkan' })
      return
    }
    setAssigningPakets(true)
    try {
      await adminQuizApi.assignBank({ course_id: activeCourse.id, paket_ids: bankPickedIds })
      setShowBankPickerModal(false)
      fetchQuizPakets(activeCourse.id)
      Swal.fire({ icon: 'success', title: `${bankPickedIds.length} paket ditambahkan`, text: `Berhasil ditambahkan ke kursus "${activeCourse.title}"`, timer: 2000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menambahkan paket' })
    } finally {
      setAssigningPakets(false)
    }
  }

  const refreshPaketList = () => {
    if (quizSource === 'bank' || view === 'bank') fetchBankPakets()
    else if (activeCourse) fetchQuizPakets(activeCourse.id)
  }

  const openCourseDetail = (course: Course) => {
    setActiveCourse(course)
    setView('quiz')
    setCourseTab(course.kelas_sensei_id ? 'lessons' : 'quiz')
    setQuizSource('course')
    setQuizSearch('')
    fetchCourseLessons(course.id)
    fetchQuizPakets(course.id)
    navigate(routeTo('quiz', 'course', course.id))
  }

  const fetchCourseLessons = (courseId: number) => {
    setCourseLessonsLoading(true)
    lmsAdminApi.lessons(courseId).then(res => {
      setCourseLessons(res.data.lessons || [])
    }).catch(() => setCourseLessons([])).finally(() => setCourseLessonsLoading(false))
  }

  const openCreateCourseLesson = () => {
    setEditingLesson(null)
    setLessonForm({ title: '', content: '', video_url: '', sort: String(courseLessons.length + 1), status: 'aktif' })
    setLessonPdf(null)
    setLessonPdfName(null)
    setLessonPdfSize(null)
    setLessonSlides([])
    setRemovedSlideIds([])
    setLessonSource('course')
    setShowLessonModal(true)
  }

  const openEditCourseLesson = (lesson: LessonItem) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      sort: lesson.sort.toString(),
      status: lesson.status,
    })
    setLessonPdf(null)
    setLessonPdfName(lesson.file_name || (lesson.file_path ? 'File materi' : null))
    setLessonPdfSize(lesson.file_size || null)
    setLessonSlides((lesson.slides || []).map(s => ({
      key: `slide-${s.id}`,
      id: s.id,
      name: s.file_name,
      size: s.file_size || undefined,
      url: `${APP_URL}/storage/${s.file_path}`,
    })))
    setRemovedSlideIds([])
    setLessonSource('course')
    setShowLessonModal(true)
  }

  const deleteCourseLesson = (lesson: LessonItem) => {
    Swal.fire({
      title: 'Hapus pertemuan?',
      text: `"${lesson.title}" akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d93025',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        lmsAdminApi.deleteLesson(lesson.id).then(() => {
          if (activeCourse) fetchCourseLessons(activeCourse.id)
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const moveCourseLesson = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...courseLessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return
    const temp = newLessons[index].sort
    newLessons[index].sort = newLessons[swapIndex].sort
    newLessons[swapIndex].sort = temp
    const tempLesson = newLessons[index]
    newLessons[index] = newLessons[swapIndex]
    newLessons[swapIndex] = tempLesson
    setCourseLessons(newLessons)
    const makeFd = (sort: number) => {
      const fd = new FormData()
      fd.append('sort', String(sort))
      return fd
    }
    Promise.all([
      lmsAdminApi.updateLesson(newLessons[index].id, makeFd(newLessons[index].sort)),
      lmsAdminApi.updateLesson(newLessons[swapIndex].id, makeFd(newLessons[swapIndex].sort)),
    ]).catch(() => activeCourse && fetchCourseLessons(activeCourse.id))
  }

  const seedQuizSections = (paket: QuizPaket) => {
    adminQuizApi.sections(paket.id).then(async res => {
      const existing = res.data.sections || []
      if (activePaketIdRef.current !== paket.id) return
      setQuizSections(existing)
      if (!seededSectionsRef.current.has(paket.id)) {
        seededSectionsRef.current.add(paket.id)
        const existingNames = existing.map((s: SectionItem) => s.name.toLowerCase())
        for (const name of DEFAULT_SECTIONS) {
          if (!existingNames.includes(name.toLowerCase())) {
            try {
              const sRes = await adminQuizApi.storeSection(paket.id, { name })
              if (activePaketIdRef.current === paket.id) setQuizSections(prev => [...prev, sRes.data.section])
            } catch {}
          }
        }
      }
    }).catch(() => {
      if (activePaketIdRef.current === paket.id) setQuizSections([])
    })
  }

  const loadQuestionEditor = (paket: QuizPaket) => {
    activePaketIdRef.current = paket.id
    setQLoading(true)
    adminQuizApi.questions(paket.id).then(res => {
      if (activePaketIdRef.current === paket.id) setQuestions(res.data.questions || [])
    }).catch(() => {
      if (activePaketIdRef.current === paket.id) setQuestions([])
    }).finally(() => {
      if (activePaketIdRef.current === paket.id) setQLoading(false)
    })
    seedQuizSections(paket)
  }

  const openQuizQuestions = (paket: QuizPaket, source: 'course' | 'bank' = 'course', quiet = false) => {
    setActiveQuizPaket(paket)
    activePaketIdRef.current = paket.id
    // Selalu muat ulang daftar soal + hitungan bagian, termasuk saat "quiet"
    // (setelah simpan/import/hapus) supaya layar langsung berubah tanpa refresh.
    loadQuestionEditor(paket)
    if (quiet) return
    setQuizSource(source)
    setQPage(1)
    setQSectionFilter('all')
    setView('quiz-questions')
    const cid = source === 'bank' ? undefined : (activeCourse?.id ?? paket.course_id ?? undefined)
    navigate(routeTo('quiz-questions', source, cid, paket.id))
  }

  const openQuizResults = (paket: QuizPaket, source: 'course' | 'bank' = 'course') => {
    setQuizSource(source)
    setActiveQuizPaket(paket)
    setView('quiz-results')
    setRLoading(true)
    setRPage(1)
    setRCollapsed({})
    adminQuizApi.results(paket.id).then(res => {
      setParticipants(res.data.participants || [])
    }).catch(() => setParticipants([])).finally(() => setRLoading(false))
    const cid = source === 'bank' ? undefined : (activeCourse?.id ?? paket.course_id ?? undefined)
    navigate(routeTo('quiz-results', source, cid, paket.id))
  }

  const openQuizMonitor = (paket: QuizPaket) => {
    const cid = activeCourse?.id ?? paket.course_id ?? undefined
    navigate(`${base}/course/${cid}/monitor/live?paket=${paket.id}`, { state: { title: paket.title } })
  }

  const openQuizMonitorById = (cid: number) => {
    navigate(`${base}/course/${cid}/monitor`, { state: { title: activeCourse?.title } })
  }

  // Monitoring live khusus satu pertemuan: daftar kandidat + status per soal.
  const openLessonMonitor = (lesson: LessonItem) => {
    const cid = activeCourse?.id ?? lesson.course_id ?? undefined
    navigate(`${base}/course/${cid}/monitor/live/${lesson.id}`, { state: { title: lesson.title } })
  }

  const backToList = () => {
    setActiveCourse(null)
    setActiveQuizPaket(null)
    setMateriPaket(null)
    navigate(base)
  }

  const backToQuiz = () => {
    const returnBank = quizSource === 'bank'
    setActiveQuizPaket(null)
    setQuizSource('course')
    if (returnBank) {
      fetchBankPakets()
      navigate(`${base}/bank-paket-soal`)
    } else {
      navigate(activeCourse ? `${base}/course/${activeCourse.id}` : base)
    }
  }

  const orderedQuestions = (() => {
    const secMap = new Map<number, SectionItem>()
    quizSections.forEach(s => secMap.set(s.id, s))
    return [...questions].sort((a, b) => {
      const aSec = a.section_id != null ? secMap.get(a.section_id) : undefined
      const bSec = b.section_id != null ? secMap.get(b.section_id) : undefined
      if ((aSec ? 0 : 1) !== (bSec ? 0 : 1)) return (aSec ? 0 : 1) - (bSec ? 0 : 1)
      if (aSec && bSec) {
        if (aSec.sort !== bSec.sort) return aSec.sort - bSec.sort
        if (aSec.id !== bSec.id) return aSec.id - bSec.id
      }
      if (Number(a.sort || 0) !== Number(b.sort || 0)) return Number(a.sort || 0) - Number(b.sort || 0)
      return Number(a.id) - Number(b.id)
    })
  })()

  const setSectionFilter = (value: 'all' | 'none' | number) => {
    setQSectionFilter(value)
    setQPage(1)
  }

  const filteredQuestions = qSectionFilter === 'all'
    ? orderedQuestions
    : orderedQuestions.filter(q => {
        const qSec = q.section_id ?? null
        if (qSectionFilter === 'none') return qSec === null
        return qSec === qSectionFilter
      })

  const sectionFilterOptions = [...quizSections].sort((a, b) => (a.sort - b.sort) || (a.id - b.id))

  const qTotalPages = Math.max(1, Math.ceil(filteredQuestions.length / qPerPage))
  const safeQPage = Math.min(qPage, qTotalPages)
  const qPageItems = filteredQuestions.slice((safeQPage - 1) * qPerPage, safeQPage * qPerPage)
  const questionGroups = qPageItems.reduce<{ section: string; items: Question[] }[]>((acc, q) => {
    const sec = q.section?.name?.trim() || ''
    const last = acc[acc.length - 1]
    if (last && last.section === sec) { last.items.push(q); return acc }
    acc.push({ section: sec, items: [q] })
    return acc
  }, [])

  // ==================== MATERI (per-paket) ====================
  const fetchMateriLessons = (paketId: number) => {
    setMateriLoading(true)
    adminQuizApi.materi(paketId).then(res => {
      setMateriLessons(res.data.lessons || [])
    }).catch(() => setMateriLessons([])).finally(() => setMateriLoading(false))
  }

  const openMateri = (paket: QuizPaket, source: 'course' | 'bank' = 'course') => {
    setQuizSource(source)
    setMateriPaket(paket)
    setActiveQuizPaket(null)
    setView('quiz-materi')
    fetchMateriLessons(paket.id)
    const cid = source === 'bank' ? undefined : (activeCourse?.id ?? paket.course_id ?? undefined)
    navigate(routeTo('quiz-materi', source, cid, paket.id))
  }

  const backFromMateri = () => {
    const returnBank = quizSource === 'bank'
    const cid = activeCourse?.id
    setMateriPaket(null)
    setQuizSource('course')
    if (returnBank) {
      fetchBankPakets()
      navigate(`${base}/bank-paket-soal`)
    } else {
      navigate(cid ? `${base}/course/${cid}` : base)
    }
  }

  const openCreateLesson = () => {
    setEditingLesson(null)
    setLessonForm({ title: '', content: '', video_url: '', sort: String(materiLessons.length + 1), status: 'aktif' })
    setLessonPdf(null)
    setLessonPdfName(null)
    setLessonPdfSize(null)
    setLessonSlides([])
    setRemovedSlideIds([])
    setLessonSource('paket')
    setShowLessonModal(true)
  }

  const openEditLesson = (lesson: LessonItem) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      sort: lesson.sort.toString(),
      status: lesson.status,
    })
    setLessonPdf(null)
    setLessonPdfName(lesson.file_name || (lesson.file_path ? 'File materi' : null))
    setLessonPdfSize(lesson.file_size || null)
    setLessonSlides((lesson.slides || []).map(s => ({
      key: `slide-${s.id}`,
      id: s.id,
      name: s.file_name,
      size: s.file_size || undefined,
      url: `${APP_URL}/storage/${s.file_path}`,
    })))
    setRemovedSlideIds([])
    setLessonSource('paket')
    setShowLessonModal(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul pelajaran wajib diisi' })
      return
    }
    if (lessonSource === 'course' && !activeCourse) return
    if (lessonSource === 'paket' && !materiPaket) return
    setSavingLesson(true)
    try {
      const fd = new FormData()
      fd.append('title', lessonForm.title)
      fd.append('content', lessonForm.content || '')
      fd.append('video_url', lessonForm.video_url || '')
      fd.append('sort', lessonForm.sort || '0')
      fd.append('status', lessonForm.status)
      if (lessonPdf) {
        fd.append('file', lessonPdf)
      } else if (editingLesson && lessonPdfName === null) {
        fd.append('remove_file', '1')
      }
      const removedIds = removedSlideIds
      lessonSlides.filter(s => s.file).forEach(s => {
        fd.append('slides[]', s.file as File)
      })
      removedIds.forEach(id => fd.append('remove_slides[]', String(id)))
      if (lessonSource === 'course') {
        fd.append('course_id', String(activeCourse!.id))
        if (editingLesson) {
          await lmsAdminApi.updateLesson(editingLesson.id, fd)
        } else {
          await lmsAdminApi.storeLesson(fd)
        }
      } else {
        if (editingLesson) {
          await adminQuizApi.updateMateri(editingLesson.id, fd)
        } else {
          await adminQuizApi.storeMateri(materiPaket!.id, fd)
        }
      }
      setShowLessonModal(false)
      if (lessonSource === 'course' && activeCourse) fetchCourseLessons(activeCourse.id)
      else if (materiPaket) fetchMateriLessons(materiPaket.id)
      Swal.fire({ icon: 'success', title: editingLesson ? 'Pelajaran diperbarui' : (lessonSource === 'course' ? 'Pertemuan dibuat' : 'Materi dibuat'), timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan' })
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteLesson = (lesson: LessonItem) => {
    Swal.fire({
      title: 'Hapus materi?',
      text: `"${lesson.title}" akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d93025',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        adminQuizApi.deleteMateri(lesson.id).then(() => {
          if (materiPaket) fetchMateriLessons(materiPaket.id)
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...materiLessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return
    const temp = newLessons[index].sort
    newLessons[index].sort = newLessons[swapIndex].sort
    newLessons[swapIndex].sort = temp
    const tempLesson = newLessons[index]
    newLessons[index] = newLessons[swapIndex]
    newLessons[swapIndex] = tempLesson
    setMateriLessons(newLessons)
    const makeFd = (id: number, sort: number) => {
      const fd = new FormData()
      fd.append('sort', String(sort))
      return fd
    }
    Promise.all([
      adminQuizApi.updateMateri(newLessons[index].id, makeFd(newLessons[index].id, newLessons[index].sort)),
      adminQuizApi.updateMateri(newLessons[swapIndex].id, makeFd(newLessons[swapIndex].id, newLessons[swapIndex].sort)),
    ]).catch(() => materiPaket && fetchMateriLessons(materiPaket.id))
  }

  // ==================== BANK MATERI ====================
  const fetchBankMateris = () => {
    setBankMateriLoading(true)
    lmsAdminApi.materiBank().then(res => {
      setBankMateris(res.data.materials || [])
    }).catch(() => setBankMateris([])).finally(() => setBankMateriLoading(false))
  }

  const openMateriBank = () => {
    setView('materi-bank')
    setQuizSource('course')
    setActiveQuizPaket(null)
    setBankMateriSearch('')
    setEditingMateri(null)
    setShowMateriModal(false)
    fetchBankMateris()
    navigate(`${base}/bank-materi`)
  }

  const openCreateMateri = () => {
    setEditingMateri(null)
    setMateriForm({ course_id: '', title: '', content: '', video_url: '', sort: String(bankMateris.length + 1), status: 'aktif' })
    setMateriPdf(null)
    setMateriPdfName(null)
    setMateriPdfSize(null)
    setMateriSlides([])
    setRemovedMateriSlideIds([])
    setShowMateriModal(true)
  }

  const openEditMateri = (m: MateriItem) => {
    setEditingMateri(m)
    setMateriForm({
      course_id: m.course_id ? String(m.course_id) : '',
      title: m.title,
      content: m.content || '',
      video_url: m.video_url || '',
      sort: m.sort.toString(),
      status: m.status,
    })
    setMateriPdf(null)
    setMateriPdfName(m.file_name ? m.file_name : null)
    setMateriPdfSize(m.file_size || null)
    setMateriSlides((m.slides || []).map(s => ({
      key: `existing-${s.id}`,
      id: s.id,
      url: s.url || `${APP_URL}/storage/${s.file_path}`,
      name: s.file_name || 'slide',
    })))
    setRemovedMateriSlideIds([])
    setShowMateriModal(true)
  }

  const handleSaveMateri = async () => {
    if (!materiForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul materi wajib diisi' })
      return
    }
    setSavingMateri(true)
    try {
      const fd = new FormData()
      fd.append('course_id', materiForm.course_id || '')
      fd.append('title', materiForm.title)
      fd.append('content', materiForm.content || '')
      fd.append('video_url', materiForm.video_url || '')
      fd.append('sort', materiForm.sort || '0')
      fd.append('status', materiForm.status)
      if (materiPdf) {
        fd.append('file', materiPdf)
      } else if (editingMateri && materiPdfName === null) {
        fd.append('remove_file', '1')
      }
      materiSlides.filter(s => s.file).forEach(s => {
        if (s.file) fd.append('slides[]', s.file as File)
      })
      removedMateriSlideIds.forEach(id => fd.append('remove_slides[]', String(id)))
      if (editingMateri) {
        await lmsAdminApi.updateMateri(editingMateri.id, fd)
      } else {
        await lmsAdminApi.storeMateri(fd)
      }
      setShowMateriModal(false)
      fetchBankMateris()
      Swal.fire({ icon: 'success', title: editingMateri ? 'Materi diperbarui' : 'Materi dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan' })
    } finally {
      setSavingMateri(false)
    }
  }

  const handleDeleteMateri = (m: MateriItem) => {
    Swal.fire({
      title: 'Hapus materi?',
      text: `"${m.title}" akan dihapus dari bank`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d93025',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        lmsAdminApi.deleteMateri(m.id).then(() => {
          setBankMateris(prev => prev.filter(x => x.id !== m.id))
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const filteredBankMateris = bankMateris.filter(m =>
    !bankMateriSearch || m.title.toLowerCase().includes(bankMateriSearch.toLowerCase())
  )

  const uploadMateriMedia = (type: 'image' | 'file') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploadingImg(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await lmsAdminApi.upload(fd)
        const quill = materiQuillRef.current?.getEditor()
        if (!quill) return
        if (type === 'image') {
          const range = quill.getSelection()
          quill.insertEmbed(range?.index || 0, 'image', res.data.url)
        } else {
          const range = quill.getSelection(true)
          quill.insertText(range?.index || 0, ` ${file.name} `, 'link', res.data.url)
          quill.setSelection((range?.index || 0) + file.name.length + 2)
        }
      } catch {
        Swal.fire({ icon: 'error', title: 'Gagal upload' })
      } finally {
        setUploadingImg(false)
      }
    }
    input.click()
  }

  // ==================== COURSE CRUD ====================
  const openCreateCourse = () => {
    setEditingCourse(null)
    setCourseForm({ title: '', description: '', level: '', batch_id: '', category_id: '', sort: '0', status: 'aktif', alert: '', alert_active: true, password_course: '' })
    setImageFile(null)
    setImagePreview(null)
    setShowPasswordCourse(false)
    setShowCourseModal(true)
  }

  const openEditCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      description: course.description || '',
      level: course.level || '',
      batch_id: course.batch_id?.toString() || '',
      category_id: course.category_id?.toString() || '',
      sort: course.sort.toString(),
      status: course.status,
      alert: course.alert || '',
      alert_active: course.alert_active !== false && course.alert_active !== 0,
      password_course: course.password_course || '',
    })
    setImageFile(null)
    setImagePreview(course.image ? `${APP_URL}/storage/${course.image}` : null)
    setShowPasswordCourse(false)
    setShowCourseModal(true)
  }

  const saveCourse = async () => {
    if (!courseForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul kursus wajib diisi' }); return
    }
    setSavingCourse(true)
    try {
      const fd = new FormData()
      fd.append('title', courseForm.title)
      fd.append('description', courseForm.description)
      fd.append('level', courseForm.level)
      fd.append('batch_id', courseForm.batch_id)
      fd.append('category_id', courseForm.category_id)
      fd.append('sort', courseForm.sort || '0')
      fd.append('status', courseForm.status)
      fd.append('alert', courseForm.alert)
      fd.append('alert_active', courseForm.alert_active ? '1' : '0')
      fd.append('password_course', courseForm.password_course)
      if (imageFile) fd.append('image', imageFile)
      if (editingCourse) {
        await lmsAdminApi.updateCourse(editingCourse.id, fd)
      } else {
        await lmsAdminApi.storeCourse(fd)
      }
      setShowCourseModal(false)
      setCoursePage(1)
      fetchCourses(1)
      Swal.fire({ icon: 'success', title: editingCourse ? 'Kursus diperbarui' : 'Kursus dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan kursus' })
    } finally {
      setSavingCourse(false)
    }
  }

  const deleteCourse = (course: Course) => {
    Swal.fire({
      title: 'Hapus kursus?', text: `"${course.title}" akan dihapus termasuk semua pelajaran di dalamnya`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d93025', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        lmsAdminApi.deleteCourse(course.id).then(() => {
          fetchCourses()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  // ==================== QUIZ PAKET CRUD ====================
  const openCreatePaket = () => {
    setQuizSource('course')
    setEditingPaket(null)
    setPaketForm({ ...emptyPaketForm, course_id: activeCourse?.id?.toString() || '' })
    setCoverPreview('')
    setShowPaketModal(true)
  }

  const openEditPaket = (p: QuizPaket) => {
    setEditingPaket(p)
    setPaketForm({
      title: p.title, description: p.description || '',
      course_id: p.course_id?.toString() || activeCourse?.id?.toString() || '',
      batch_id: p.batch_id?.toString() || '', level: p.level || '', category: p.category || '',
      time_limit_minutes: p.time_limit_minutes.toString(), max_attempts: p.max_attempts.toString(),
      max_warnings: p.max_warnings.toString(), passing_score: p.passing_score.toString(),
      shuffle_questions: p.shuffle_questions, quiz_template: p.quiz_template || 'basic',
      status: p.status, user_id: p.user_id?.toString() || '',
      camera_enabled: p.camera_enabled ?? true, block_exit: p.block_exit ?? true,
      penilaian_ulangan: p.penilaian_ulangan ?? false,
      cover_image: p.cover_image || '',
      sertifikasi_aktif: p.sertifikasi_aktif ?? false,
      sertifikat_judul: p.sertifikat_judul || '',
      sertifikat_penerbit: p.sertifikat_penerbit || '',
      sertifikat_berlaku_hari: p.sertifikat_berlaku_hari?.toString() || '',
      sertifikat_wajib_foto: p.sertifikat_wajib_foto ?? true,
    })
    setCoverPreview(p.cover_url || '')
    setShowPaketModal(true)
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa gambar' }); return
    }
    const fd = new FormData()
    fd.append('cover', file)
    setUploadingCover(true)
    adminQuizApi.uploadCover(fd)
      .then(res => { setPaketForm(prev => ({ ...prev, cover_image: res.data.cover_image })); setCoverPreview(res.data.url) })
      .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengunggah cover' }))
      .finally(() => setUploadingCover(false))
    e.target.value = ''
  }

  const savePaket = async () => {
    if (!paketForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul paket wajib diisi' }); return
    }
    setSavingPaket(true)
    try {
      const data: Record<string, unknown> = {
        title: paketForm.title, description: paketForm.description, cover_image: paketForm.cover_image || null,
        course_id: paketForm.course_id ? Number(paketForm.course_id) : (view === 'quiz' && activeCourse ? activeCourse.id : undefined),
        batch_id: paketForm.batch_id ? Number(paketForm.batch_id) : null,
        level: paketForm.level || null, category: paketForm.category || null,
        time_limit_minutes: Number(paketForm.time_limit_minutes) || 30,
        max_attempts: Number(paketForm.max_attempts || 3),
        max_warnings: Number(paketForm.max_warnings) || 3,
        passing_score: Number(paketForm.passing_score) || 0,
        shuffle_questions: paketForm.shuffle_questions, quiz_template: paketForm.quiz_template,
        camera_enabled: paketForm.camera_enabled, block_exit: paketForm.block_exit,
        penilaian_ulangan: paketForm.penilaian_ulangan,
        status: paketForm.status,
        user_id: paketForm.user_id ? Number(paketForm.user_id) : undefined,
        sertifikasi_aktif: paketForm.sertifikasi_aktif,
        sertifikat_wajib_foto: paketForm.sertifikasi_aktif,
        sertifikat_judul: paketForm.sertifikasi_aktif ? (paketForm.sertifikat_judul || null) : null,
        sertifikat_penerbit: paketForm.sertifikasi_aktif ? (paketForm.sertifikat_penerbit || null) : null,
        sertifikat_berlaku_hari: paketForm.sertifikasi_aktif && paketForm.sertifikat_berlaku_hari
          ? Number(paketForm.sertifikat_berlaku_hari)
          : null,
      }
      if (editingPaket) {
        await adminQuizApi.updatePaket(editingPaket.id, data)
      } else {
        await adminQuizApi.storePaket(data)
      }
      setShowPaketModal(false)
      refreshPaketList()
      Swal.fire({ icon: 'success', title: editingPaket ? 'Paket diperbarui' : 'Paket dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan paket' })
    } finally {
      setSavingPaket(false)
    }
  }

  const deletePaket = (p: QuizPaket) => {
    Swal.fire({
      title: 'Hapus paket soal?', text: `"${p.title}" beserta semua soal & riwayat pengerjaan akan dihapus`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d93025', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        adminQuizApi.deletePaket(p.id).then(() => {
          refreshPaketList()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const togglePaket = (p: QuizPaket) => {
    adminQuizApi.togglePaket(p.id).then(() => {
      refreshPaketList()
    }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengubah status' }))
  }

  // ==================== CATEGORY CRUD ====================
  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nama kategori wajib diisi' }); return
    }
    setSavingCategory(true)
    try {
      await adminQuizApi.storeCategory({ name: categoryForm.name.trim() })
      setCategoryForm({ name: '' })
      fetchQuizMeta()
      Swal.fire({ icon: 'success', title: 'Kategori ditambahkan', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menambah kategori' })
    } finally {
      setSavingCategory(false)
    }
  }

  const deleteCategory = (c: Category) => {
    Swal.fire({
      title: 'Hapus kategori?', text: `Kategori "${c.name}" akan dihapus dari daftar`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d93025', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        adminQuizApi.deleteCategory(c.id).then(() => {
          fetchQuizMeta()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1200, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  // ==================== QUESTION CRUD ====================
  const openCreateQuestion = () => {
    setEditingQuestion(null)
    setQForm({ ...emptyQuestionForm })
    setQOptions([{ text: '', image_path: null, image_url: null }, { text: '', image_path: null, image_url: null }])
    setShowQuestionModal(true)
  }

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q)
    const keys = Array.isArray(q.correct_indexes) && q.correct_indexes.length
      ? q.correct_indexes.map(Number)
      : (q.correct_index !== null && q.correct_index !== undefined ? [Number(q.correct_index)] : [])
    setQForm({
      question: q.question ?? '',
      section_id: q.section_id ? String(q.section_id) : '',
      question_type: q.question_type === 'multi' ? 'multi' : q.question_type === 'rating' ? 'rating' : q.question_type === 'essay' ? 'essay' : 'choice',
      rating_max: q.rating_max ? q.rating_max.toString() : '9',
      correct_index: q.correct_index?.toString() ?? '',
      correct_indexes: keys,
      points: q.points.toString(),
      keyword: q.keyword || '',
      image_path: q.image_path || '', image_url: q.image_url || '',
      audio_path: q.audio_path || '', audio_url: q.audio_url || '',
      audio_max_plays: q.audio_max_plays != null ? q.audio_max_plays.toString() : '',
    })
    const seed = q.question_type === 'rating'
      ? Array.from({ length: q.rating_max || 9 }, (_, i) => String(i + 1))
      : (q.options || [])
    setQOptions(seed.map(o => typeof o === 'string'
      ? { text: o, image_path: null, image_url: null }
      : { text: o?.text ?? '', image_path: o?.image_path || null, image_url: o?.image_url || null }))
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
    adminQuizApi.uploadMedia(fd)
      .then(res => {
        setQOptions(prev => prev.map((o, i) => i === oi ? { ...o, image_path: res.data.path, image_url: res.data.url } : o))
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengunggah gambar opsi' }))
      .finally(() => setUploadingOptImg(null))
  }

  const saveQuestion = async () => {
    if (!activeQuizPaket) return
    const isRating = qForm.question_type === 'rating'
    const isEssay = qForm.question_type === 'essay'
    const isMulti = qForm.question_type === 'multi'
    let opts: string[]
    let correctIndexes: number[] = []
    if (isEssay) {
      opts = []
    } else if (isRating) {
      const ratingMax = Math.min(10, Math.max(2, Number(qForm.rating_max) || 9))
      opts = Array.from({ length: ratingMax }, (_, i) => String(i + 1))
    } else {
      opts = qOptions
        .map(o => ({ text: o.text.trim(), image_path: o.image_path || null }))
        .filter(o => o.text || o.image_path) as unknown as string[]
      if (opts.length < 2) { Swal.fire({ icon: 'warning', title: 'Minimal 2 opsi jawaban (isi teks atau unggah gambar)' }); return }
      const searchable = opts.map(o => `${o?.text ?? ''}|${o?.image_path ?? ''}`)
      if (new Set(searchable).size !== searchable.length) { Swal.fire({ icon: 'warning', title: 'Opsi jawaban tidak boleh ada yang sama' }); return }
      if (isMulti) {
        correctIndexes = [...new Set((qForm.correct_indexes || []).map(Number))]
          .filter(Number.isFinite)
          .filter(i => i >= 0 && i < opts.length)
          .sort((a, b) => a - b)
        if (correctIndexes.length === 0) {
          Swal.fire({ icon: 'warning', title: 'Pilih minimal 1 jawaban benar (boleh lebih dari satu)' }); return
        }
      } else if (qForm.correct_index === '' || Number(qForm.correct_index) >= opts.length) {
        Swal.fire({ icon: 'warning', title: 'Pilih jawaban benar yang valid' }); return
      }
    }
    setSavingQuestion(true)
    try {
      const data = {
        question: qForm.question ?? '',
        section_id: qForm.section_id ? Number(qForm.section_id) : null,
        question_type: isEssay ? 'essay' : isRating ? 'rating' : isMulti ? 'multi' : 'choice',
        rating_max: isRating ? Number(qForm.rating_max) || 9 : null,
        options: opts,
        correct_index: (isEssay || isRating || isMulti) ? null : Number(qForm.correct_index),
        correct_indexes: isMulti ? correctIndexes : null,
        keyword: isEssay ? (qForm.keyword.trim() || null) : null,
        points: Number(qForm.points) || 1,
        image_path: qForm.image_path || null,
        audio_path: qForm.audio_path || null,
        audio_max_plays: qForm.audio_path ? (Number(qForm.audio_max_plays) || null) : null,
      }
      const newSectionId: number | null = qForm.section_id ? Number(qForm.section_id) : null
      const sectObj = quizSections.find(s => s.id === newSectionId) || null

      if (editingQuestion) {
        const res = await adminQuizApi.updateQuestion(editingQuestion.id, data)
        const saved = res.data.question || {}
        const patched: Question = {
          ...saved,
          section_id: newSectionId,
          section: sectObj ? { id: sectObj.id, name: sectObj.name } : null,
          question: qForm.question ?? '',
          question_type: isEssay ? 'essay' : isRating ? 'rating' : isMulti ? 'multi' : 'choice',
          rating_max: isRating ? (Number(qForm.rating_max) || 9) : null,
          options: opts,
          correct_index: (isEssay || isRating || isMulti) ? null : Number(qForm.correct_index),
          correct_indexes: isMulti ? correctIndexes : null,
          keyword: isEssay ? (qForm.keyword.trim() || null) : null,
          points: Number(qForm.points) || 1,
          image_path: qForm.image_path || null,
          image_url: qForm.image_url || null,
          audio_path: qForm.audio_path || null,
          audio_url: qForm.audio_url || null,
          audio_max_plays: qForm.audio_path ? (Number(qForm.audio_max_plays) || null) : null,
        }
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? patched : q))
        setQuizSections(prev => prev.map(s => {
          const oldId = editingQuestion.section_id
          if (oldId === newSectionId) return s
          if (s.id === oldId) return { ...s, questions_count: Math.max(0, s.questions_count - 1) }
          if (s.id === newSectionId) return { ...s, questions_count: s.questions_count + 1 }
          return s
        }))
      } else {
        const res = await adminQuizApi.storeQuestion(activeQuizPaket.id, data)
        const saved = res.data.question || {}
        const created: Question = {
          ...saved,
          id: saved.id,
          section_id: newSectionId,
          section: sectObj ? { id: sectObj.id, name: sectObj.name } : null,
          question: qForm.question ?? '',
          question_type: isEssay ? 'essay' : isRating ? 'rating' : isMulti ? 'multi' : 'choice',
          rating_max: isRating ? (Number(qForm.rating_max) || 9) : null,
          options: opts,
          correct_index: (isEssay || isRating || isMulti) ? null : Number(qForm.correct_index),
          correct_indexes: isMulti ? correctIndexes : null,
          keyword: isEssay ? (qForm.keyword.trim() || null) : null,
          points: Number(qForm.points) || 1,
          sort: saved.sort ?? questions.length,
          image_path: qForm.image_path || null,
          image_url: qForm.image_url || null,
          audio_path: qForm.audio_path || null,
          audio_url: qForm.audio_url || null,
          audio_max_plays: qForm.audio_path ? (Number(qForm.audio_max_plays) || null) : null,
        }
        setQuestions(prev => [...prev, created])
        if (newSectionId) setQuizSections(prev => prev.map(s => s.id === newSectionId ? { ...s, questions_count: s.questions_count + 1 } : s))
      }
      setShowQuestionModal(false)
      openQuizQuestions(activeQuizPaket, undefined, true)
      refreshPaketList()
      Swal.fire({ icon: 'success', title: editingQuestion ? 'Soal diperbarui' : 'Soal ditambahkan', timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message
        || (e?.response?.data?.errors ? Object.values(e.response.data.errors)[0]?.[0] : null)
        || 'Gagal menyimpan soal'
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan soal', text: msg })
    } finally {
      setSavingQuestion(false)
    }
  }

  const openImportModal = () => {
    setImportText('')
    setImportParse([])
    setImportType('choice')
    setImportError('')
    setImportMedia([])
    setShowImportModal(true)
  }

  const onImportTextChange = (val: string) => {
    setImportText(val)
    setImportParse(parseQuestionImport(val, importType))
    setImportError('')
  }

  const removeImportQ = (i: number) => {
    setImportParse(p => p.filter((_, x) => x !== i))
  }

  const tagOf = (m: { type: 'gambar' | 'audio'; url: string }) =>
    m.type === 'gambar' ? `[gambar:${m.url}]` : `[audio:${m.url}]`

  // Media hasil upload TIDAK dimasukkan ke textarea. Link-nya disimpan terpisah
  // dan baru disisipkan ke teks soal saat user menekan tombol "Sisip".
  const addImportMedia = (url: string, type: 'gambar' | 'audio', name = '') => {
    setImportMedia(prev => (prev.some(m => m.url === url) ? prev : [...prev, { type, url, name: name || url.split('/').pop() || '' }]))
  }

  const insertImportTag = (m: { type: 'gambar' | 'audio'; url: string }) => {
    const ta = importTextRef.current
    const start = ta?.selectionStart ?? importText.length
    const end = ta?.selectionEnd ?? importText.length
    const tag = tagOf(m)
    const prefix = start > 0 && !/[\n[]$/.test(importText.slice(0, start)) ? '\n' : ''
    const next = importText.slice(0, start) + prefix + tag + importText.slice(end)
    const pos = start + prefix.length + tag.length
    onImportTextChange(next)
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus()
        ta.setSelectionRange(pos, pos)
      }
    })
  }

  const insertAllImportTags = () => {
    if (!importMedia.length) return
    onImportTextChange([importText.trimEnd(), ...importMedia.map(tagOf)].filter(Boolean).join('\n'))
  }

  const copyImportMedia = async (m: { type: 'gambar' | 'audio'; url: string }) => {
    const link = mediaUrl(m.url)
    try {
      await navigator.clipboard.writeText(link)
      Swal.fire({ icon: 'success', title: 'Link disalin', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'warning', title: 'Gagal menyalin', text: link })
    }
  }

  const removeImportMedia = (idx: number) => {
    const m = importMedia[idx]
    if (!m) return
    setImportMedia(prev => prev.filter((_, x) => x !== idx))
    onImportTextChange(importText.split(tagOf(m)).join(''))
  }

  const onImportFile = (file: File | undefined, type: 'gambar' | 'audio') => {
    if (!file) return
    const ok = type === 'gambar' ? file.type.startsWith('image/') : isQuestionAudioFile(file)
    if (!ok) {
      Swal.fire({ icon: 'warning', title: `File harus berupa ${type === 'gambar' ? 'gambar' : 'audio'}` })
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    setImportingMedia(type)
    adminQuizApi.uploadMedia(fd)
      .then(res => addImportMedia(res.data.url, type, file.name))
      .catch(() => Swal.fire({ icon: 'error', title: `Gagal mengunggah ${type === 'gambar' ? 'gambar' : 'audio'}` }))
      .finally(() => setImportingMedia(null))
  }

  const saveImport = async () => {
    if (!activeQuizPaket) return
    if (importParse.length === 0) {
      setImportError('Belum ada soal untuk disimpan')
      return
    }
    setSavingImport(true)
    setImportError('')
    const isChoice = importType === 'choice' || importType === 'multi'
    const isMulti = importType === 'multi'
    try {
      const questions = importParse.map(q => ({
        question: q.question,
        section: q.section || null,
        question_type: importType,
        rating_max: importType === 'rating' ? 9 : null,
        options: isChoice ? q.options.map(o => o.image_path ? { text: o.text || '', image_path: o.image_path } : o.text) : [],
        correct_index: importType === 'choice' ? q.correct_index : null,
        correct_indexes: isMulti ? q.correct_indexes : null,
        keyword: null,
        points: q.points,
        image_path: q.image_path,
        audio_path: q.audio_path,
        audio_max_plays: q.audio_max_plays,
      }))
      const res = await adminQuizApi.storeQuestionsBulk(activeQuizPaket.id, { questions })
      setShowImportModal(false)
      openQuizQuestions(activeQuizPaket, undefined, true)
      refreshPaketList()
      const errCount = (res.data?.errors as never[] | undefined)?.length || 0
      const title = `${res.data?.created ?? 0} soal ditambahkan${errCount ? ` (${errCount} dilewati)` : ''}`
      Swal.fire({ icon: errCount ? 'warning' : 'success', title, timer: 1800, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message
        || (e?.response?.data?.errors ? String(Object.values(e.response.data.errors as Record<string, unknown>[])[0]) : null)
        || 'Pastikan format paste benar'
      setImportError(typeof msg === 'string' ? msg : 'Gagal menyimpan soal. Periksa kembali format paste.')
    } finally {
      setSavingImport(false)
    }
  }

  const openSectionManager = () => {
    if (!activeQuizPaket) return
    setEditingQSection(null)
    setQSectionName('')
    setShowSectionListModal(true)
  }

  const openAddSection = () => {
    setEditingQSection(null)
    setQSectionName('')
    setShowSectionModal(true)
  }

  const openEditSection = (s: SectionItem) => {
    setEditingQSection(s)
    setQSectionName(s.name)
    setShowSectionModal(true)
  }

  const saveSection = async () => {
    const name = qSectionName.trim()
    if (!name) {
      Swal.fire({ icon: 'warning', title: 'Nama bagian wajib diisi' })
      return
    }
    if (!activeQuizPaket) return
    setSavingSection(true)
    try {
      if (editingQSection) {
        const res = await adminQuizApi.updateSection(editingQSection.id, { name })
        setQuizSections(prev => prev.map(s => s.id === editingQSection.id ? res.data.section : s))
      } else {
        const res = await adminQuizApi.storeSection(activeQuizPaket.id, { name })
        setQuizSections(prev => [...prev, res.data.section])
      }
      setShowSectionModal(false)
      Swal.fire({ icon: 'success', title: editingQSection ? 'Bagian diperbarui' : 'Bagian ditambahkan', timer: 1200, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal menyimpan bagian'
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan bagian', text: msg })
    } finally {
      setSavingSection(false)
    }
  }

  const deleteSection = (s: SectionItem) => {
    Swal.fire({
      icon: 'warning',
      title: 'Hapus bagian ini?',
      text: `Bagian "${s.name}" akan dihapus.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#d93025',
    }).then(async result => {
      if (!result.isConfirmed || !activeQuizPaket) return
      try {
        await adminQuizApi.deleteSection(s.id)
        setQuizSections(prev => prev.filter(x => x.id !== s.id))
        setQForm(prev => String(s.id) === prev.section_id ? { ...prev, section_id: '' } : prev)
        setQSectionFilter(prev => prev === s.id ? 'all' : prev)
        setQuestions(prev => prev.map(q => q.section_id === s.id ? { ...q, section_id: null, section: null } : q))
        Swal.fire({ icon: 'success', title: 'Bagian dihapus', timer: 1200, showConfirmButton: false })
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Gagal menghapus bagian'
        Swal.fire({ icon: 'error', title: 'Gagal menghapus bagian', text: msg })
      }
    })
  }

  const [uploadingQMedia, setUploadingQMedia] = useState<'image' | 'audio' | null>(null)

  const uploadQuestionMedia = (file: File | undefined, type: 'image' | 'audio') => {
    if (!file) return
    if (type === 'image' && !file.type.startsWith('image/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa gambar' }); return
    }
    if (type === 'audio' && !isQuestionAudioFile(file)) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa audio atau video MP4' }); return
    }
    const fd = new FormData()
    fd.append('file', file)
    setUploadingQMedia(type)
    adminQuizApi.uploadMedia(fd)
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

  const deleteQuestion = (q: Question) => {
    Swal.fire({
      title: 'Hapus soal?', text: 'Soal ini akan dihapus dari paket', icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d93025', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed && activeQuizPaket) {
        adminQuizApi.deleteQuestion(q.id).then(() => {
          setQuestions(prev => prev.filter(x => x.id !== q.id))
          setQuizSections(prev => prev.map(s => s.id === q.section_id ? { ...s, questions_count: Math.max(0, s.questions_count - 1) } : s))
          openQuizQuestions(activeQuizPaket, undefined, true)
          refreshPaketList()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1200, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const moveQuestion = (q: Question, dir: 'up' | 'down') => {
    const index = orderedQuestions.findIndex(x => x.id === q.id)
    const other = dir === 'up' ? orderedQuestions[index - 1] : orderedQuestions[index + 1]
    if (!other) return
    if ((q.section_id ?? null) !== (other.section_id ?? null)) return
    const newQ = { ...q, sort: other.sort }
    const newOther = { ...other, sort: q.sort }
    setQuestions(prev => prev.map(x => x.id === q.id ? newQ : x.id === other.id ? newOther : x))
    Promise.all([
      adminQuizApi.updateQuestion(q.id, { sort: newQ.sort }),
      adminQuizApi.updateQuestion(other.id, { sort: newOther.sort }),
    ]).catch(() => {})
  }

  const openAttemptDetail = (attemptId: number) => {
    setShowDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    setGrades({})
    adminQuizApi.attemptDetail(attemptId).then(res => {
      setDetail({ attempt: res.data.attempt, questions: res.data.questions || [], siswa: res.data.siswa })
    }).catch(() => { setDetail(null); Swal.fire({ icon: 'error', title: 'Gagal memuat detail' }) })
      .finally(() => setDetailLoading(false))
  }

  const saveGrade = async (qid: number) => {
    if (!detail) return
    const q = detail.questions.find(x => x.id === qid)
    if (!q) return
    const earned = Math.max(0, Math.min(Number(grades[qid] ?? 0) || 0, Number(q.points) || 0))
    setSavingGrade(qid)
    try {
      await adminQuizApi.gradeAttempt(detail.attempt.id, { grades: [{ question_id: qid, earned_points: earned }] })
      setGrades(g => { const n = { ...g }; delete n[qid]; return n })
      setDetailLoading(true)
      const res = await adminQuizApi.attemptDetail(detail.attempt.id)
      setDetail({ attempt: res.data.attempt, questions: res.data.questions || [], siswa: res.data.siswa })
      Swal.fire({ icon: 'success', title: 'Nilai esai tersimpan', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan nilai' })
    } finally {
      setSavingGrade(null)
      setDetailLoading(false)
    }
  }

  const resetAttempts = (siswaId?: number, nama?: string) => {
    if (!activeQuizPaket) return
    Swal.fire({
      title: siswaId ? 'Reset percobaan kandidat?' : 'Reset semua percobaan?',
      text: siswaId
        ? `Hapus semua percobaan "${nama || 'kandidat'}" agar bisa mengerjakan quiz lagi?`
        : 'Hapus semua percobaan paket ini agar kandidat bisa mengerjakan quiz dari awal?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d93025',
      confirmButtonText: 'Ya, Reset',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (!res.isConfirmed) return
      adminQuizApi.resetAttempts(activeQuizPaket.id, siswaId)
        .then(r => {
          Swal.fire({ icon: 'success', title: r.data?.message || 'Percobaan direset', timer: 1500, showConfirmButton: false })
          openQuizResults(activeQuizPaket)
        })
        .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mereset percobaan' }))
    })
  }

  // ==================== FILTERS ====================
  const filteredCourses = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || (c.level && c.level.toLowerCase().includes(search.toLowerCase()))
    const matchLevel = !filterLevel || c.level === filterLevel
    const matchBatch = !filterBatch || c.batch_id?.toString() === filterBatch
    // Cabang diturunkan dari batch kursus; batch null tidak punya cabang.
    const matchCabang = !filterCabang || batches.find(b => b.id === c.batch_id)?.cabang_id?.toString() === filterCabang
    // Penjaga kedua di sisi klien, karena backend sudah memfilter lewat
    // ?source=. Tanpa ini, halaman terakhir bisa menampilkan jenis yang salah
    // kalau paginasi server berubah.
    const matchSource = !filterSource
      || (filterSource === 'manual' ? !c.kelas_sensei_id : !!c.kelas_sensei_id)
    return matchSearch && matchLevel && matchBatch && matchSource && matchCabang
  })

  // Batch dropdown ikut dipersempit sesuai cabang terpilih, supaya user tidak
// memilih batch dari cabang lain lalu melihat hasil kosong.
const visibleBatches = filterCabang
    ? batches.filter(b => b.cabang_id?.toString() === filterCabang)
    : batches

  const filteredQuizPakets = quizPakets.filter(p => !quizSearch || p.title.toLowerCase().includes(quizSearch.toLowerCase()))

  const allBatchLevels: string[] = []
  Object.values(batchLevels).forEach(arr => arr.forEach(l => { if (!allBatchLevels.includes(l)) allBatchLevels.push(l) }))
  const levelOptions = courseForm.batch_id ? [...(batchLevels[Number(courseForm.batch_id)] || [])] : [...allBatchLevels]
  if (editingCourse && courseForm.level && !levelOptions.includes(courseForm.level)) levelOptions.push(courseForm.level)
  levelOptions.sort((a, b) => Number(a) - Number(b))

  const fmtDate = (iso: string | null) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const renderPaketTable = (pakets: QuizPaket[], source: 'course' | 'bank') => {
    const noOffset = source === 'bank' ? (bankPagination.current_page - 1) * bankPagination.per_page : 0
    return (
    <div className="bg-white border-2 border-[#dadce0] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-xs font-medium text-[#5f6368] w-10 px-4 py-3 text-left">No</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Paket Soal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Soal</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Dikerjakan</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Peserta</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Nilai Terbaik</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {pakets.map((p, idx) => (
              <tr key={p.id} className="hover:bgbg-[#f8f9fa] transition-colors">
                <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">{noOffset + idx + 1}</td>
                <td className="border-b border-[#e8eaed] px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[#202124] font-semibold truncate max-w-xs">{p.title}</p>
                      {p.category && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bgbg-[#f1f3f4] text-[#1a73e8] shrink-0">{p.category}</span>
                      )}
                      {p.penilaian_ulangan && (
                        <span
                          title="Skor terbaik kandidat otomatis masuk ke Nilai Ulangan saat paket dipakai di pertemuan"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 bg-[#e6f4ea] text-[#137333] shrink-0"
                        >
                          <Award size={10} /> Ulangan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#80868b] mt-0.5">
                      {[p.batch?.nama_batch, p.level && `Level ${p.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                    </p>
                    {source === 'bank' && p.course_id && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 bg-[#fef7e0] text-[#b06000] shrink-0">
                        <Link2 size={10} /> Terhubung ke kursus
                      </span>
                    )}
                  </div>
                </td>
                <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-semibold text-[#202124]">{p.questions_count}</td>
                <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-semibold text-[#202124]">{p.attempts_count}</td>
                <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-semibold text-[#202124]">{p.participants}</td>
                <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-semibold text-[#1a73e8]">{Number(p.best_score) || '-'}</td>
                <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {!isAdminCabang && (
                      <button onClick={() => togglePaket(p)}
                        className={`relative w-10 h-[22px] border border-[#dadce0] transition-colors shrink-0 ${p.status === 'aktif' ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}
                        title={p.status === 'aktif' ? 'Tutup paket' : 'Buka paket'}>
                        <span className={`absolute top-[2px] w-[16px] h-[16px] bg-white shadow transition-all ${p.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                      </button>
                    )}
                    <span className={`text-[11px] font-semibold ${p.status === 'aktif' ? 'text-[#137333]' : 'text-[#5f6368]'}`}>
                      {p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                    </span>
                  </div>
                </td>
                <td className="border-b border-[#e8eaed] px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openMateri(p, source)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a73e8] bgbg-[#f1f3f4] px-2 py-1.5 hover:bgbg-[#f1f3f4] transition-colors">
                      <BookOpen size={13} /> Materi
                    </button>
                    <button onClick={() => openQuizQuestions(p, source)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0E6187] px-2 py-1.5 hover:bgbg-[#e8f0fe] transition-colors">
                      <ListChecks size={13} /> Soal
                    </button>
                    <button onClick={() => openQuizResults(p, source)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a73e8] bgbg-[#f1f3f4] px-2 py-1.5 hover:bgbg-[#f1f3f4] transition-colors">
                      <Eye size={13} /> Hasil
                    </button>
                    {source === 'course' && (
                      <button onClick={() => openQuizMonitor(p)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c5221f] bg-[#fce8e6] px-2 py-1.5 hover:bg-[#f6d7d5] transition-colors">
                        <Radio size={13} /> Monitoring
                      </button>
                    )}
                    {!isAdminCabang && (
                      <>
                        <div className="w-px h-4 bg-[#e8eaed] mx-1"></div>
                        <button onClick={() => openEditPaket(p)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors" title="Edit">
                          <Pencil size={13} className="text-[#5f6368]" />
                        </button>
                        <button onClick={() => deletePaket(p)} className="p-1.5 bg-[#fce8e6] hover:bg-[#f6d7d5] transition-colors" title="Hapus">
                          <Trash2 size={13} className="text-[#d93025]" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    )
  }

  const renderPagination = (pg: Pagination, onPage: (p: number) => void, label = 'data') => {
    if (pg.last_page <= 1) return null
    const start = pg.total === 0 ? 0 : (pg.current_page - 1) * pg.per_page + 1
    const end = Math.min(pg.current_page * pg.per_page, pg.total)
    return (
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-[#dadce0] px-4 py-2 text-xs text-[#5f6368]">
        <span>Menampilkan <b className="text-[#3c4043]">{start}-{end}</b> dari <b className="text-[#3c4043]">{pg.total}</b> {label}</span>
        <div className="flex items-center gap-1">
          <button
            disabled={pg.current_page <= 1}
            onClick={() => onPage(Math.max(1, pg.current_page - 1))}
            className="border border-[#dadce0] p-1 text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: pg.last_page }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - pg.current_page) <= 2 || p === 1 || p === pg.last_page)
            .map((p, i, arr) => (
              <span key={p} className="inline-flex items-center">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-[#9aa0a6]">...</span>}
                <button
                  onClick={() => onPage(p)}
                  className={`min-w-[24px] px-1.5 py-0.5 text-center text-xs font-medium transition ${ p === pg.current_page ? "bg-[#202124] text-white" : "text-[#5f6368] hover:bg-[#f1f3f4]" }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            disabled={pg.current_page >= pg.last_page}
            onClick={() => onPage(Math.min(pg.last_page, pg.current_page + 1))}
            className="border border-[#dadce0] p-1 text-[#5f6368] transition hover:bg-[#f1f3f4] disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  const rCabangOf = (par: Participant) => (par.cabang || '').trim() || 'Tanpa Cabang'
  const rBatchOf = (par: Participant) => (par.batch || '').trim() || 'Tanpa Batch'
  const rLevelOf = (par: Participant) => {
    const lv = par.level
    return (lv !== null && lv !== undefined && lv !== '') ? String(lv) : null
  }

  const rCabangOpts = [...new Set(participants.map(rCabangOf))].sort((a, b) => a.localeCompare(b))
  const rBatchOpts = [...new Set(participants.map(rBatchOf))].sort((a, b) => a.localeCompare(b))
  const rLevelOpts = [...new Set(participants.map(p => rLevelOf(p) ?? 'Tanpa Level'))].sort((a, b) => {
    const an = Number(a); const bn = Number(b)
    if (!isNaN(an) && !isNaN(bn)) return an - bn
    return a.localeCompare(b)
  })

  const rFiltered = participants.filter(p => {
    if (rFSearch.trim() && !p.nama.toLowerCase().includes(rFSearch.trim().toLowerCase())) return false
    if (rFCabang && rCabangOf(p) !== rFCabang) return false
    if (rFBatch && rBatchOf(p) !== rFBatch) return false
    if (rFLevel && (rLevelOf(p) ?? 'Tanpa Level') !== rFLevel) return false
    return true
  })
  const rHasFilter = !!(rFCabang || rFBatch || rFLevel || rFSearch.trim())

  // ==================== GRAFIK PERSENTASE PER BAGIAN ====================
  // Warna bar mengikuti performa: >=80 hijau, >=50 kuning, else merah.
  const pctColor = (pct: number) => (pct >= 80 ? '#188038' : pct >= 50 ? '#e37400' : '#d93025')
  const pctTextColor = (pct: number) => (pct >= 80 ? 'text-[#137333]' : pct >= 50 ? 'text-[#b06000]' : 'text-[#d93025]')

  // Percobaan terbaik = submitted dengan skor tertinggi (fallback: attempt terakhir).
  const rBestAttempt = (par: Participant): AttemptRow | null => {
    if (!par.attempts?.length) return null
    const submitted = par.attempts.filter(a => a.status === 'submitted')
    const pool = submitted.length ? submitted : par.attempts
    return [...pool].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))[0]
  }

  // Bar per bagian untuk 1 kandidat (dari percobaan terbaiknya).
  const rCandidateSections = (par: Participant) => {
    const best = rBestAttempt(par)
    if (!best?.sections?.length) return null
    const rows = best.sections.filter(s => s.total > 0)
    if (!rows.length) return null
    return { attempt: best, rows }
  }

  // Rata-rata persentase per bagian dari peserta yang sedang difilter.
  const rSectionStats = (() => {
    const map = new Map<string, { id: number; name: string; total: number; correct: number; n: number }>()
    rFiltered.forEach(par => {
      const c = rCandidateSections(par)
      if (!c) return
      c.rows.forEach(s => {
        const key = String(s.id)
        const cur = map.get(key) ?? { id: s.id, name: s.name, total: s.total, correct: 0, n: 0 }
        cur.correct += s.correct
        cur.n += 1
        map.set(key, cur)
      })
    })
    return [...map.values()].map(s => ({
      ...s,
      percent: s.n > 0 ? Math.round((s.correct / (s.n * s.total)) * 1000) / 10 : 0,
    }))
  })()

  const resetResultFilters = () => {
    setRFCabang(''); setRFBatch(''); setRFLevel(''); setRFSearch('')
    setRPage(1)
  }

  const rGroupKey = (par: Participant) => {
    const cab = rCabangOf(par)
    const bat = rBatchOf(par)
    const lvl = rLevelOf(par) ? `Level ${rLevelOf(par)}` : 'Tanpa Level'
    if (rGroupBy === 'cabang') return cab
    if (rGroupBy === 'batch') return bat
    if (rGroupBy === 'level') return lvl
    return `${cab} · ${bat} · ${lvl}`
  }

  const rGrouped = (() => {
    const map = new Map<string, Participant[]>()
    rFiltered.forEach(p => {
      const k = rGroupKey(p)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(p)
    })
    return [...map.entries()].map(([name, items]) => {
      const scores = items.map(i => Number(i.best_score) || 0)
      const total = items.length
      const best = Math.max(0, ...scores)
      const avg = total > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / total) : 0
      return {
        name,
        items: [...items].sort((a, b) => (Number(b.best_score) || 0) - (Number(a.best_score) || 0)),
        total,
        best,
        avg,
      }
    })
  })()

  const rGroupedMode = rGroupBy !== 'none'
  const rTotalItems = rGroupedMode ? rGrouped.length : rFiltered.length
  const rTotalPages = Math.max(1, Math.ceil(rTotalItems / R_PER_PAGE))
  const rSafePage = Math.min(rPage, rTotalPages)
  const rPageGroups = rGroupedMode ? rGrouped.slice((rSafePage - 1) * R_PER_PAGE, rSafePage * R_PER_PAGE) : []
  const rPageParticipants = rGroupedMode ? [] : rFiltered.slice((rSafePage - 1) * R_PER_PAGE, rSafePage * R_PER_PAGE)
  const rPagination: Pagination = { current_page: rSafePage, last_page: rTotalPages, total: rTotalItems, per_page: R_PER_PAGE }

  const renderParticipantRow = (par: Participant, idx: number) => {
    const secChart = rCandidateSections(par)
    return (
    <tr key={par.siswa_id} className="bg-white hover:bgbg-[#f8f9fa] transition-colors">
      <td className="border-b border-[#e8eaed] px-4 py-3 text-xs font-bold text-[#80868b]">{idx + 1}</td>
      <td className="border-b border-[#e8eaed] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#1a73e8] bgbg-[#f1f3f4] flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-[#1a73e8]">{par.nama.trim().charAt(0).toUpperCase() || '?'}</span>
          </div>
          <p className="font-semibold text-[#202124] truncate">{par.nama}</p>
        </div>
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
          <Building2 size={13} className="text-[#80868b] shrink-0" /> {par.cabang || '-'}
        </span>
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
          <Users size={13} className="text-[#1a73e8] shrink-0" /> {par.batch || '-'}
        </span>
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3">
        {par.level !== null && par.level !== '' ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5f6368]">
            <Layers size={13} className="text-[#188038] shrink-0" /> Level {par.level}
          </span>
        ) : '-'}
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {par.attempts.map(a => (
            <button key={a.attempt_id} onClick={() => openAttemptDetail(a.attempt_id)}
              title={`${fmtDate(a.started_at)} · ${a.warnings} peringatan`}
              className="inline-flex items-center gap-1.5 bg-[#f8f9fa] border border-[#dadce0] px-2.5 py-1.5 hover:bgbg-[#f8f9fa] hover:border-[#1a73e8] transition-colors group">
              <span className="text-[11px] font-bold text-[#5f6368]">#{a.attempt_number}</span>
              <span className={`text-xs font-semibold ${a.status === 'submitted' ? 'text-[#3c4043]' : 'text-[#80868b]'}`}>
                {a.status === 'submitted' ? (Number(a.score) || 0) + ' poin' : 'Belum selesai'}
                {a.auto_submitted && <span className="ml-1 text-[9px] font-bold text-[#e37400]">AUTO</span>}
              </span>
              {a.webcam_photo && <Camera size={12} className="text-[#80868b] shrink-0" />}
            </button>
          ))}
        </div>
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3 text-right">
        <p className="text-lg font-black text-[#1a73e8]">{Number(par.best_score) || 0}</p>
        <p className="text-[10px] text-[#5f6368] font-medium">poin</p>
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3">
        {secChart ? (
          <div className="min-w-[170px]">
            <p className="text-[9px] font-bold text-[#80868b] mb-1">Percobaan #{secChart.attempt.attempt_number}</p>
            <div className="space-y-1">
              {secChart.rows.map(s => (
                <div key={s.id} className="flex items-center gap-1.5"
                  title={`${s.name}: ${s.correct} benar dari ${s.total} soal (${s.percent}%)`}>
                  <span className="w-14 text-[10px] text-[#5f6368] truncate shrink-0">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-[#f1f3f4] overflow-hidden">
                    <div className="h-full transition-all duration-500"
                      style={{ width: `${Math.max(s.percent, s.percent > 0 ? 5 : 0)}%`, backgroundColor: pctColor(s.percent) }} />
                  </div>
                  <span className={`w-9 text-right text-[10px] font-bold shrink-0 ${pctTextColor(s.percent)}`}>{s.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-[#9aa0a6]">-</span>
        )}
      </td>
      <td className="border-b border-[#e8eaed] px-4 py-3 text-right whitespace-nowrap">
        {!isAdminCabang && (
          <button onClick={() => resetAttempts(par.siswa_id, par.nama)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#d93025] hover:text-white hover:bg-[#d93025] border-2 border-[#f28b82] px-2.5 py-1.5 transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </td>
    </tr>
    )
  }

  // ==================== RENDER ====================
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] shrink-0">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#202124]">Data Kursus LMS</h1>
              <p className="text-sm text-[#5f6368]">Kelola kursus, materi pembelajaran, dan quiz kandidat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'quiz' && activeCourse && !isAdminCabang && (
              !activeCourse.kelas_sensei_id || courseTab === 'quiz' ? (
                <>
                  <button onClick={openCreatePaket} className={primaryBtn}>
                    <Plus size={16} /> Buat Paket
                  </button>
                  <button onClick={openBankPicker} className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-3 py-2 text-sm font-semibold text-[#5f6368] hover:border-[#dadce0] text-[12px]">
                    <ListChecks size={15} /> Paket Soal dari Bank
                  </button>
                </>
              ) : (
                <button onClick={openCreateCourseLesson} className={primaryBtn}>
                  <Plus size={16} /> Tambah Pertemuan
                </button>
              )
            )}
            {view === 'quiz-materi' && !isAdminCabang && (
              <button onClick={openCreateLesson} className={primaryBtn}>
                <Plus size={16} /> Tambah Materi
              </button>
            )}
            {view === 'materi-bank' && !isAdminCabang && (
              <button onClick={openCreateMateri} className={primaryBtn}>
                <Plus size={16} /> Buat Materi
              </button>
            )}
          </div>
        </div>

        {/* ==================== LIST VIEW ==================== */}
        {view === 'list' && (
          <>
            {/* Menu akses cepat */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {!isAdminCabang && (
                <>
                  <button onClick={openBank}
                    className="group bg-white border border-[#dadce0] p-4 flex flex-col items-start gap-3 text-left hover:border-[#1a73e8] transition-all">
                    <div className="w-11 h-11 bg-[#0E6187] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ListChecks size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#202124]">Bank Paket Soal</p>
                      <p className="text-[11px] text-[#80868b] mt-0.5 leading-snug">Kelola paket soal &amp; pembahasan</p>
                    </div>
                  </button>
                  <button onClick={openMateriBank}
                    className="group bg-white border border-[#dadce0] p-4 flex flex-col items-start gap-3 text-left hover:border-[#1a73e8] transition-all">
                    <div className="w-11 h-11 bg-[#e37400] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#202124]">Bank Materi</p>
                      <p className="text-[11px] text-[#80868b] mt-0.5 leading-snug">Materi, modul &amp; video pembelajaran</p>
                    </div>
                  </button>
                  <button onClick={openWelcomeSettings}
                    className="group bg-white border border-[#dadce0] p-4 flex flex-col items-start gap-3 text-left hover:border-[#1a73e8] transition-all">
                    <div className="w-11 h-11 bg-[#8430ce] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Settings size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#202124]">Pengaturan</p>
                      <p className="text-[11px] text-[#80868b] mt-0.5 leading-snug">Tampilan, sambutan &amp; quiz kursus</p>
                    </div>
                  </button>
                  <button onClick={openCreateCourseCat}
                    className="group bg-white border border-[#dadce0] p-4 flex flex-col items-start gap-3 text-left hover:border-[#1a73e8] transition-all">
                    <div className="w-11 h-11 bg-[#0E6187] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Tags size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#202124]">Kelola Kategori</p>
                      <p className="text-[11px] text-[#80868b] mt-0.5 leading-snug">Atur kategori &amp; urutan kursus</p>
                    </div>
                  </button>
                </>
              )}
              <button onClick={() => navigate(`${base}/quiz-referensi`)}
                className="group bg-white border border-[#dadce0] p-4 flex flex-col items-start gap-3 text-left hover:border-[#1a73e8] transition-all">
                <div className="relative w-11 h-11 bg-[#0E6187] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCheck2 size={22} />
                  {refPendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center bg-[#d93025] px-1 text-[10px] font-bold text-white">{refPendingCount}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#202124]">Referensi Quiz</p>
                  <p className="text-[11px] text-[#80868b] mt-0.5 leading-snug">Quiz kunci jawaban dari sensei</p>
                </div>
              </button>
              {!isAdminCabang && (
                <button onClick={openCreateCourse}
                  className="group bg-white border border-[#1a73e8] p-4 flex flex-col items-start gap-3 text-left hover:bg-[#f8f9fa] transition-all">
                  <div className="w-11 h-11 bg-[#0E6187] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Plus size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a73e8]">Buat Kursus</p>
                    <p className="text-[11px] text-[#5f6368] mt-0.5 leading-snug">Tambah kursus baru</p>
                  </div>
                </button>
              )}
            </div>

            {/* Pemisahan asal kursus: tombol kecil di pojok kiri atas tabel */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#80868b] mr-0.5">Asal Kursus:</span>
              {([
                { key: '', label: 'Semua' },
                { key: 'manual', label: 'Manual' },
                { key: 'sensei', label: 'Pengajar' },
              ] as const).map(opt => (
                <button
                  key={opt.key || 'all'}
                  onClick={() => setFilterSource(opt.key)}
                  title={
                    opt.key === 'manual'
                      ? 'Kursus dibuat admin, tanpa pengajar'
                      : opt.key === 'sensei'
                        ? 'Kursus dibuat dari menu Tambah Kelas, ada pengajarnya'
                        : 'Tampilkan semua kursus'
                  }
                  className={`inline-flex items-center gap-1 border px-2 py-1 text-[10px] font-bold transition-colors ${ filterSource === opt.key ? 'border-[#1a73e8] bg-[#0E6187] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa]' }`}
                >
                  {opt.key === 'sensei' ? <UserCheck size={10} /> : opt.key === 'manual' ? <UserRound size={10} /> : <Layers size={10} />}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Heading + filter */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex items-center gap-2 lg:shrink-0">
                <div className="flex h-9 w-9 items-center justify-center bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0]">
                  <LayoutGrid size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#202124] leading-tight">Daftar Kursus Saat Ini</h2>
                  <p className="text-xs text-[#80868b]">{coursePagination.total} kursus</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kursus..." className={`${inputCls} pl-9`} />
                </div>
                {!isAdminCabang && (
                  <select
                    value={filterCabang}
                    onChange={e => { setFilterCabang(e.target.value); setFilterBatch('') }}
                    className={`${inputCls} sm:w-44`}
                  >
                    <option value="">Semua Cabang</option>
                    {cabangOptions.map(c => <option key={c.id} value={c.id}>{c.nama_cabang}</option>)}
                  </select>
                )}
                <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className={`${inputCls} sm:w-44`}>
                  <option value="">Semua Batch</option>
                  {visibleBatches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat kursus...
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-white border border-[#dadce0] p-14 text-center">
                <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                  <BookOpen size={28} className="text-[#1a73e8]" />
                </div>
                <p className="text-[#202124] font-semibold">Belum ada kursus</p>
                <p className="text-[#5f6368] text-sm mt-1">Buat kursus untuk materi pembelajaran kandidat</p>
                {!isAdminCabang && (
                  <button onClick={openCreateCourse} className={`${primaryBtn} mt-5`}>
                    <Plus size={16} /> Buat Kursus
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#dadce0] overflow-hidden">
                {/* ===== LIST MOBILE (card) ===== */}
                <div className="md:hidden divide-y divide-[#e8eaed]">
                  {filteredCourses.map(c => (
                    <div key={c.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-[#202124] leading-snug">{c.title}</p>
                        <span className={`shrink-0 inline-block text-[10px] font-semibold px-2 py-0.5 ${c.status === 'aktif' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                          {c.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {c.category && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-[#e8f0fe] text-[#1a73e8]">
                            {c.category.name}
                          </span>
                        )}
                        <p className="text-xs text-[#80868b]">
                          {[c.batch_id && batches.find(b => b.id === c.batch_id)?.nama_batch, c.level && `Level ${c.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                        </p>
                        <SenseiBadge nama={c.sensei_nama} namaKelas={c.nama_kelas} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-1 text-[11px] font-semibold text-[#5f6368]">
                          <BookOpen size={12} /> {c.lessons_count} Pertemuan
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-1 text-[11px] font-semibold text-[#5f6368]">
                          <FileText size={12} /> {c.files_count || 0} File
                        </span>
                        <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-1 text-[11px] font-semibold text-[#5f6368]">
                          <ListChecks size={12} /> Urutan {c.sort}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => openCourseDetail(c)}
                          className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-[#0E6187] px-3 py-2 hover:bgbg-[#e8f0fe] transition-colors">
                          <ListChecks size={13} /> Buka
                        </button>
                        {!isAdminCabang && (
                          <>
                            <button onClick={() => openEditCourse(c)} className="px-3 py-2 border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f8f9fa] transition-colors" title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteCourse(c)} className="px-3 py-2 bg-[#fce8e6] text-[#d93025] hover:bg-[#f6d7d5] transition-colors" title="Hapus">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* ===== LIST DESKTOP (table) ===== */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
                    <thead>
                      <tr>
                        <th scope="col" className="text-xs font-medium text-[#5f6368] w-12 px-4 py-3">No</th>
                        <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Kursus</th>
                        <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3">Pengajar</th>
                        <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Pertemuan</th>
                        <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
                        <th scope="col" className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((c, idx) => (
                        <tr key={c.id} className="bg-white transition hover:bg-[#f8f9fa]">
                          <td className="border-b border-[#e8eaed] px-4 py-3 text-sm font-semibold text-[#80868b]">{(coursePagination.current_page - 1) * coursePagination.per_page + idx + 1}</td>
                          <td className="border-b border-[#e8eaed] px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-[#202124] font-semibold truncate max-w-xs">{c.title}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {c.category && (
                                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-[#e8f0fe] text-[#1a73e8]">
                                    {c.category.name}
                                  </span>
                                )}
                                <p className="text-xs text-[#80868b]">
                                  {[c.batch_id && batches.find(b => b.id === c.batch_id)?.nama_batch, c.level && `Level ${c.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-[#e8eaed] px-4 py-3">
                            <SenseiBadge nama={c.sensei_nama} namaKelas={c.nama_kelas} />
                          </td>
                          <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                            <span className="inline-block min-w-[32px] bg-[#f8f9fa] px-2.5 py-1.5 text-xs font-bold text-[#5f6368]">{c.lessons_count}</span>
                          </td>
                          <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                            <span className={`inline-block whitespace-nowrap text-[11px] font-bold px-2.5 py-1 ${c.status === 'aktif' ? 'bg-[#0E6187] text-white' : 'bg-[#bdc1c6] text-white'}`}>
                              {c.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="border-b border-[#e8eaed] px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => openCourseDetail(c)}
                                className="inline-flex items-center gap-1.5 bg-[#0E6187] px-3 py-1.5 text-[11px] font-bold text-white hover:bgbg-[#e8f0fe] transition-colors">
                                <BookOpen size={13} /> Buka
                              </button>
                              {!isAdminCabang && (
                                <>
                                  <button onClick={() => openEditCourse(c)} className="p-1.5 text-[#80868b] hover:bg-[#fef7e0] hover:text-[#b06000] transition-colors" title="Edit">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => deleteCourse(c)} className="p-1.5 text-[#80868b] hover:bg-[#fce8e6] hover:text-[#d93025] transition-colors" title="Hapus">
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                              {isAdminCabang && <span className="text-xs text-[#9aa0a6]">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {renderPagination(coursePagination, p => { setCoursePage(p); fetchCourses(p) })}
          </>
        )}

        {/* ==================== COURSE DETAIL (PERTEMUAN + QUIZ) ==================== */}
        {view === 'quiz' && activeCourse && (
          <>
            <div className="bg-white border border-[#dadce0]">
              <div className="p-5">
                <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                  <ChevronUp size={15} className="-rotate-90" /> Kembali
                </button>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-11 h-11 bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] flex items-center justify-center shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#202124] truncate">{activeCourse.title}</h2>
                    <p className="text-sm text-[#5f6368]">
                      {[activeCourse.batch_id && batches.find(b => b.id === activeCourse.batch_id)?.nama_batch, activeCourse.level && `Level ${activeCourse.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                      {' · '}{activeCourse.kelas_sensei_id ? `${courseLessons.length} pertemuan · ` : ''}{quizPakets.length} paket soal
                    </p>
                  </div>
                  <button onClick={() => openQuizMonitorById(activeCourse.id)}
                    className="ml-auto inline-flex items-center gap-1.5 bg-[#d93025] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#c5221f] transition-colors shrink-0">
                    <Radio size={14} /> Monitoring
                  </button>
                </div>
                {activeCourse.kelas_sensei_id ? (
                  <div className="mt-4 border-b border-[#dadce0] flex gap-1">
                    <button onClick={() => setCourseTab('lessons')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${courseTab === 'lessons' ? 'border-[#1a73e8] text-[#1a73e8]' : 'border-transparent text-[#5f6368] hover:text-[#3c4043]'}`}>
                      <BookOpen size={15} /> Daftar Pertemuan
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f1f3f4] text-[#5f6368]">{courseLessons.length}</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pb-1">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[#3c4043]">
                      <ListChecks size={15} className="text-[#1a73e8]" /> Daftar Paket Soal
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#f1f3f4] text-[#5f6368]">{quizPakets.length}</span>
                    </h3>
                  </div>
                )}
              </div>
            </div>

            {/* ======= Daftar Pertemuan tab ======= */}
            {courseTab === 'lessons' && (
              <div className="bg-white border border-[#dadce0] overflow-hidden">
                {courseLessonsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                    <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat pertemuan...
                  </div>
                ) : courseLessons.length === 0 ? (
                  <div className="p-14 text-center">
                    <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                      <BookOpen size={28} className="text-[#1a73e8]" />
                    </div>
                    <p className="text-[#202124] font-semibold">Belum ada pertemuan</p>
                    <p className="text-[#5f6368] text-sm mt-1">Tambahkan pertemuan & materi pembelajaran untuk kursus "{activeCourse.title}"</p>
                    {!isAdminCabang && (
                      <button onClick={openCreateCourseLesson} className={`${primaryBtn} mt-5`}>
                        <Plus size={16} /> Tambah Pertemuan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8eaed]">
                    {courseLessons.map((lesson, idx) => (
                      <div key={lesson.id} onClick={() => navigate(`${base}/course/${activeCourse.id}/pertemuan/${lesson.id}`)}
                        className="flex items-center gap-3 px-5 py-4 hover:#f8f9fa-\[#f8f9fa\] transition-colors group cursor-pointer">
                        {!isAdminCabang && (
                          <div className="flex flex-col items-center gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); moveCourseLesson(idx, 'up') }} disabled={idx === 0}
                              className="p-0.5 text-[#80868b] hover:text-[#1a73e8] disabled:opacity-20">
                              <ChevronUp size={14} />
                            </button>
                            <span className="text-[10px] font-bold text-[#80868b] w-5 text-center">{idx + 1}</span>
                            <button onClick={(e) => { e.stopPropagation(); moveCourseLesson(idx, 'down') }} disabled={idx === courseLessons.length - 1}
                              className="p-0.5 text-[#80868b] hover:text-[#1a73e8] disabled:opacity-20">
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        )}
                        <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${lesson.status === 'aktif' ? 'bgbg-[#f1f3f4] text-[#1a73e8]' : 'bg-[#f1f3f4] text-[#9aa0a6]'}`}>
                          {lesson.video_url ? <Video size={16} /> : lesson.slides?.length ? <ImageIcon size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${lesson.status === 'aktif' ? 'text-[#202124]' : 'text-[#80868b]'}`}>{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {lesson.video_url && <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]"><Video size={10} /> Video</span>}
                            {lesson.content && <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]"><FileText size={10} /> Materi</span>}
                            {lesson.file_name && <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]"><FileText size={10} /> PDF</span>}
                            {!!lesson.slides?.length && <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]"><ImageIcon size={10} /> {lesson.slides.length} Slide</span>}
                            <span className={`text-[10px] font-semibold ${lesson.status === 'aktif' ? 'text-[#137333]' : 'text-[#80868b]'}`}>
                              {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); openLessonMonitor(lesson) }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c5221f] bg-[#fce8e6] px-2 py-1.5 hover:bg-[#f6d7d5] transition-colors" title="Monitoring kandidat">
                            <Radio size={13} /> Monitoring
                          </button>
                        </div>
                        {!isAdminCabang && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); openEditCourseLesson(lesson) }} className="p-2 text-[#80868b] hover:bg-[#fef7e0] hover:text-[#b06000] transition-colors" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteCourseLesson(lesson) }} className="p-2 text-[#80868b] hover:bg-[#fce8e6] hover:text-[#d93025] transition-colors" title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ======= Quiz (paket soal) tab ======= */}
            {courseTab === 'quiz' && (
              <>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
                  <input value={quizSearch} onChange={e => setQuizSearch(e.target.value)} placeholder="Cari paket soal..." className={`${inputCls} pl-9`} />
                </div>

                {quizLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                    <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat paket soal...
                  </div>
                ) : filteredQuizPakets.length === 0 ? (
                  <div className="bg-white border border-[#dadce0] p-14 text-center">
                    <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                      <ListChecks size={28} className="text-[#1a73e8]" />
                    </div>
                    <p className="text-[#202124] font-semibold">Belum ada paket soal</p>
                    <p className="text-[#5f6368] text-sm mt-1">Buat paket soal MCQ untuk kursus "{activeCourse.title}"</p>
                    {!isAdminCabang && (
                      <button onClick={openCreatePaket} className={`${primaryBtn} mt-5`}>
                        <Plus size={16} /> Buat Paket Soal
                      </button>
                    )}
                  </div>
                ) : renderPaketTable(filteredQuizPakets, 'course')}
              </>
            )}
          </>
        )}

        {/* ==================== BANK PAKET SOAL VIEW ==================== */}
        {view === 'bank' && (
          <div className="space-y-4">
            <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
              <ArrowLeft size={15} /> Kembali
            </button>

            <div className="bg-white border border-[#dadce0] overflow-hidden">
              <div className="p-5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] flex items-center justify-center shrink-0">
                    <ListChecks size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[#202124] truncate">Bank Paket Soal</h2>
                    <p className="text-sm text-[#5f6368]">Semua paket soal tersimpan di sini, termasuk yang sudah terhubung ke kursus</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={openRekap}
                    className="inline-flex items-center gap-2 border border-[#1a73e8] bg-[#f1f3f4] px-4 py-2.5 text-sm font-semibold text-[#1a73e8] transition-colors hover:bgbg-[#f1f3f4]">
                    <BarChart3 size={16} /> Rekap Nilai
                  </button>
                  {bankCategory !== '' ? (
                    <button onClick={openCreateBankPaket} className={primaryBtn}>
                      <Plus size={16} /> Buat Paket Soal
                    </button>
                  ) : (
                    <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-[#80868b]">
                      Pilih kategori paket di atas untuk membuat paket baru
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-[#e8eaed] px-5 py-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#202124] flex items-center gap-2">
                      <LayoutGrid size={15} className="text-[#1a73e8]" /> Kategori Paket
                    </h3>
                    <p className="text-[11px] text-[#80868b]">Pilih kategori untuk menampilkan paket soal sesuai kategorinya</p>
                  </div>
                  <button onClick={() => setShowCategoryModal(true)}
                    className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-[#1a73e8] px-3 py-1.5 border border-[#1a73e8] hover:bg-[#f1f3f4] transition-colors">
                    <LayoutGrid size={13} /> + Kelola
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <button onClick={() => selectBankCategory('')}
                    className={`flex items-center gap-2.5 border px-3.5 py-3 text-left transition-all ${ bankCategory === '' ? 'bg-[#0E6187] border-[#1a73e8] text-white shadow-[#1a73e8]/25' : 'bg-white border-[#dadce0] hover:border-[#1a73e8] hover:' }`}>
                    <span className={`w-9 h-9 shrink-0 flex items-center justify-center ${bankCategory === '' ? 'bg-white/15 text-white' : 'bgbg-[#f1f3f4] text-[#1a73e8]'}`}>
                      <LayoutGrid size={15} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold truncate">Semua Paket</span>
                      <span className={`block text-[10px] font-medium ${bankCategory === '' ? 'text-white/75' : 'text-[#80868b]'}`}>{bankTotalPakets} paket</span>
                    </span>
                  </button>
                  {quizCategories.map(c => {
                    const catCount = typeof c.paket_count === 'number' ? c.paket_count : 0
                    const active = bankCategory === c.name
                    return (
                      <button key={c.id} onClick={() => selectBankCategory(c.name)}
                        className={`flex items-center gap-2.5 border px-3.5 py-3 text-left transition-all ${ active ? 'bg-[#0E6187] border-[#1a73e8] text-white shadow-[#1a73e8]/25' : 'bg-white border-[#dadce0] hover:border-[#1a73e8] hover:' }`}>
                        <span className={`w-9 h-9 shrink-0 flex items-center justify-center ${active ? 'bg-white/15 text-white' : 'bgbg-[#f1f3f4] text-[#1a73e8]'}`}>
                          <LayoutGrid size={15} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-bold truncate">{c.name}</span>
                          <span className={`block text-[10px] font-medium ${active ? 'text-white/75' : 'text-[#80868b]'}`}>{catCount} paket</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
              <input value={bankSearch} onChange={e => setBankSearch(e.target.value)}
                placeholder={bankCategory ? `Cari paket soal pada ${bankCategory}...` : 'Cari paket soal...'}
                className={`${inputCls} pl-9`} />
            </div>

            {bankLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat paket soal...
              </div>
            ) : bankPakets.length === 0 ? (
              <div className="bg-white border border-[#dadce0] px-8 py-14 text-center">
                <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                  <ListChecks size={28} className="text-[#1a73e8]" />
                </div>
                <p className="text-[#202124] font-semibold">
                  {bankSearch.trim() ? 'Tidak ada paket yang cocok dengan pencarian' : bankCategory ? `Belum ada paket soal pada kategori "${bankCategory}"` : 'Belum ada paket soal di bank'}
                </p>
                <p className="text-[#5f6368] text-sm mt-1">
                  {bankSearch.trim() ? 'Coba ubah kata kunci pencarian atau ganti kategori.' : bankCategory ? 'Buat paket soal baru untuk mengisi kategori ini, lalu hubungkan ke kursus nanti.' : 'Buat paket soal untuk disimpan di bank dan hubungkan ke kursus nanti'}
                </p>
                {!bankSearch.trim() && (
                  bankCategory ? (
                    <button onClick={openCreateBankPaket} className={`${primaryBtn} mt-5`}>
                      <Plus size={16} /> Buat Paket Soal
                    </button>
                  ) : (
                    <p className="mt-5 inline-flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-[#5f6368]">Buat paket butuh kategori</span>
                      <span className="text-[11px] text-[#80868b]">Pilih salah satu kategori paket di atas terlebih dahulu</span>
                    </p>
                  )
                )}
              </div>
            ) : renderPaketTable(bankPakets, 'bank')}

            {renderPagination(bankPagination, p => { setBankPage(p); fetchBankPakets(p) })}
          </div>
        )}

        {/* ==================== REKAP NILAI KANDIDAT VIEW ==================== */}
        {view === 'rekap-nilai' && (
          <div className="space-y-4">
            <button onClick={backToBankFromRekap} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
              <ArrowLeft size={15} /> Kembali
            </button>

            <div className="bg-white border border-[#dadce0] overflow-hidden">
              <div className="p-5 flex items-center gap-3">
                <div className="w-11 h-11 bgbg-[#f1f3f4] text-[#1a73e8] border border-[#1a73e8] flex items-center justify-center shrink-0">
                  <BarChart3 size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#202124] truncate">Rekap Nilai Kandidat</h2>
                  <p className="text-sm text-[#5f6368]">Rekap nilai kandidat per kategori paket, dikelompokkan berdasarkan batch dan level</p>
                </div>
              </div>

              <div className="border-t border-[#e8eaed] px-5 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Kategori Paket</label>
                    <select value={rekapCategory} onChange={e => { setRekapCategory(e.target.value); setRekapPage(1); fetchRekap(1) }}
                      className={`${inputCls} py-2`}>
                      <option value="">Semua Kategori</option>
                      {(rekap?.filters.kategori ?? []).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Batch</label>
                    <select value={rekapBatch} onChange={e => { setRekapBatch(e.target.value); setRekapPage(1); fetchRekap(1) }}
                      className={`${inputCls} py-2`}>
                      <option value="">Semua Batch</option>
                      {(rekap?.filters.batch ?? []).map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Level</label>
                    <select value={rekapLevel} onChange={e => { setRekapLevel(e.target.value); setRekapPage(1); fetchRekap(1) }}
                      className={`${inputCls} py-2`}>
                      <option value="">Semua Level</option>
                      {(rekap?.filters.level ?? []).map(l => <option key={l} value={l}>Level {l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Cari Kandidat</label>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
                      <input value={rekapSearch}
                        onChange={e => setRekapSearch(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { setRekapPage(1); fetchRekap(1) } }}
                        placeholder="Nama / NIK / No. Registrasi"
                        className={`${inputCls} py-2 pl-9`} />
                    </div>
                  </div>
                </div>
                {(rekapCategory || rekapBatch || rekapLevel || rekapSearch) && (
                  <button onClick={() => { setRekapCategory(''); setRekapBatch(''); setRekapLevel(''); setRekapSearch(''); setRekapPage(1); fetchRekap(1) }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                    <X size={13} /> Reset filter
                  </button>
                )}
              </div>
            </div>

            {rekapLoading && !rekap ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat rekap nilai...
              </div>
            ) : !rekap ? (
              <div className="bg-white border border-[#dadce0] px-8 py-14 text-center">
                <p className="text-[#202124] font-semibold">Gagal memuat rekap nilai</p>
                <p className="text-[#5f6368] text-sm mt-1">Coba muat ulang halaman atau periksa koneksi ke server.</p>
                <button onClick={() => fetchRekap(rekapPage)} className={`${primaryBtn} mt-5`}>
                  <RotateCcw size={16} /> Coba Lagi
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
                  {[
                    { label: 'Paket Soal', value: rekap.ringkasan.total_paket, color: 'text-[#1a73e8]' },
                    { label: 'Kandidat', value: rekap.ringkasan.total_kandidat, color: 'text-[#202124]' },
                    { label: 'Rata-rata', value: rekap.ringkasan.rata_rata, color: 'text-[#202124]' },
                    { label: 'Tertinggi', value: rekap.ringkasan.tertinggi, color: 'text-[#137333]' },
                    { label: 'Terendah', value: rekap.ringkasan.terendah, color: 'text-[#b06000]' },
                    { label: 'Rata-rata 70+', value: rekap.ringkasan.lulus, color: 'text-[#1a73e8]' },
                  ].map(k => (
                    <div key={k.label} className="border border-[#dadce0] bg-white px-3.5 py-3">
                      <p className="text-[10px] font-semibold text-[#80868b]">{k.label}</p>
                      <p className={`mt-1 text-xl font-bold ${k.color}`}>{k.value}</p>
                    </div>
                  ))}
                </div>

                {rekap.paket.length > 0 && (
                  <div className="bg-white border border-[#dadce0] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-[#e8eaed]">
                      <h3 className="text-sm font-bold text-[#202124] flex items-center gap-2">
                        <ListChecks size={15} className="text-[#1a73e8]" /> Paket Soal dalam Filter
                        <span className="text-[11px] font-medium text-[#80868b]">({rekap.paket.length})</span>
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4">
                      {rekap.paket.map(pk => (
                        <div key={pk.id} className="border border-[#dadce0] #f8f9fa-\[#f8f9fa\] px-3 py-2 min-w-[180px]">
                          <p className="text-xs font-bold text-[#3c4043] truncate" title={pk.title}>{pk.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#80868b]">
                            <span className="bg-white px-1.5 py-0.5 font-semibold text-[#5f6368] border border-[#dadce0]">{pk.category}</span>
                            {pk.level && <span className="bg-white px-1.5 py-0.5 font-semibold text-[#5f6368] border border-[#dadce0]">Level {pk.level}</span>}
                            {pk.batch_name && <span className="bg-white px-1.5 py-0.5 font-semibold text-[#5f6368] border border-[#dadce0]">{pk.batch_name}</span>}
                            <span>{pk.questions_count} soal</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#dadce0] overflow-hidden">
                  {rekap.kandidat.length === 0 ? (
                    <div className="px-8 py-14 text-center">
                      <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                        <BarChart3 size={28} className="text-[#1a73e8]" />
                      </div>
                      <p className="text-[#202124] font-semibold">Belum ada nilai kandidat</p>
                      <p className="text-[#5f6368] text-sm mt-1">
                        {rekap.paket.length === 0
                          ? 'Belum ada paket soal pada filter ini.'
                          : 'Belum ada kandidat yang mengerjakan paket soal pada filter ini.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="text-[#5f6368]">
                            <tr>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-3 w-12 text-center">#</th>
                              <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Kandidat</th>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-3 text-center">Batch</th>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-3 text-center">Level</th>
                              {rekap.paket.map(pk => (
                                <th key={pk.id} title={pk.title}
                                  className="border border-[#dadce0] px-3 py-3 text-center font-semibold max-w-[110px]">
                                  <span className="block truncate">{pk.title}</span>
                                </th>
                              ))}
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-3 text-center">Rata-rata</th>
                              <th className="text-xs font-medium text-[#5f6368] px-3 py-3 text-center">Terbaik</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rekap.kandidat.map(k => {
                              const avgColor = k.rata_rata >= 70 ? 'text-[#137333]' : k.rata_rata >= 50 ? 'text-[#b06000]' : 'text-[#d93025]'
                              const batchNama = rekap.filters.batch.find(b => b.id === k.batch_id)?.nama
                              return (
                                <tr key={k.siswa_id} className="hover:#f8f9fa-\[#f8f9fa\] transition-colors">
                                  <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                                    <span className={`inline-flex h-6 w-6 items-center justify-center text-xs font-bold ${ k.peringkat === 1 ? 'bg-[#fef7e0] text-[#b06000]' : k.peringkat === 2 ? 'bg-[#e8eaed] text-[#5f6368]' : k.peringkat === 3 ? 'bg-[#fef7e0] text-[#b06000]' : 'bg-[#f8f9fa] text-[#80868b]'}`}>
                                      {k.peringkat}
                                    </span>
                                  </td>
                                  <td className="border-b border-[#e8eaed] px-4 py-3">
                                    <p className="font-semibold text-[#202124] truncate">{k.nama}</p>
                                    <p className="text-[11px] text-[#80868b] truncate">
                                      {[k.no_registrasi, k.nik && `NIK ${k.nik}`].filter(Boolean).join(' · ') || '—'}
                                    </p>
                                  </td>
                                  <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                                    {batchNama ? (
                                      <span className="px-2 py-0.5 text-[11px] font-semibold text-[#5f6368] bg-[#f1f3f4]">{batchNama}</span>
                                    ) : <span className="text-[#9aa0a6]">—</span>}
                                  </td>
                                  <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                                    {k.level ? (
                                      <span className="bgbg-[#f1f3f4] px-2 py-0.5 text-[11px] font-semibold text-[#1a73e8]">L{k.level}</span>
                                    ) : <span className="text-[#9aa0a6]">—</span>}
                                  </td>
                                  {rekap.paket.map(pk => {
                                    const val = k.scores[String(pk.id)]
                                    if (val === undefined) return (
                                      <td key={pk.id} className="border border-[#dadce0] px-3 py-3 text-center text-[#9aa0a6]">—</td>
                                    )
                                    return (
                                      <td key={pk.id} className="border border-[#dadce0] px-3 py-3 text-center">
                                        <span className={`text-xs font-bold ${val >= 70 ? 'text-[#137333]' : val >= 50 ? 'text-[#b06000]' : 'text-[#d93025]'}`}>{val}</span>
                                      </td>
                                    )
                                  })}
                                  <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                                    <span className={`inline-block min-w-[42px] bg-[#f8f9fa] px-2.5 py-1.5 text-xs font-bold ${avgColor}`}>{k.rata_rata}</span>
                                  </td>
                                  <td className="border-b border-[#e8eaed] px-3 py-3 text-center">
                                    <span className="inline-block min-w-[38px] bg-[#f8f9fa] px-2.5 py-1.5 text-xs font-bold text-[#3c4043]">{k.terbaik}</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="border-t border-[#e8eaed] px-4 py-2.5 text-[11px] text-[#80868b]">
                        Nilai = attempt terbaik per paket (0-100). Rata-rata dihitung dari paket yang dikerjakan kandidat tersebut.
                      </div>
                    </>
                  )}
                </div>

                {renderPagination(rekap.pagination, p => { setRekapPage(p); fetchRekap(p) }, 'kandidat')}
              </>
            )}
          </div>
        )}

        {/* ==================== BANK MATERI VIEW ==================== */}
        {view === 'materi-bank' && (
          <div className="space-y-4">
            <div className="bg-white border border-[#dadce0] p-5">
              <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-11 h-11 bg-[#f1f3f4] text-[#5f6368] border border-[#dadce0] flex items-center justify-center shrink-0">
                  <BookOpen size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#202124] truncate">Bank Materi</h2>
                  <p className="text-sm text-[#5f6368]">Semua materi pembelajaran tersimpan di sini, termasuk yang sudah terhubung ke pertemuan</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
              <input value={bankMateriSearch} onChange={e => setBankMateriSearch(e.target.value)} placeholder="Cari materi..." className={`${inputCls} pl-9`} />
            </div>

            {bankMateriLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat materi...
              </div>
            ) : filteredBankMateris.length === 0 ? (
              <div className="bg-white border border-[#dadce0] p-14 text-center">
                <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                  <BookOpen size={28} className="text-[#1a73e8]" />
                </div>
                <p className="text-[#202124] font-semibold">Belum ada materi di bank</p>
                <p className="text-[#5f6368] text-sm mt-1">Buat materi untuk disimpan di bank dan hubungkan ke pertemuan nanti</p>
                <button onClick={openCreateMateri} className={`${primaryBtn} mt-5`}>
                  <Plus size={16} /> Buat Materi
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#dadce0] overflow-hidden">
                <div className="divide-y divide-[#e8eaed]">
                  {filteredBankMateris.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0 bgbg-[#f1f3f4] text-[#1a73e8]">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#202124] truncate">{m.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {m.course && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <BookOpen size={10} /> {m.course.title}
                            </span>
                          )}
                          {m.video_url && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <Video size={10} /> Video
                            </span>
                          )}
                          {m.content && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <FileText size={10} /> Materi
                            </span>
                          )}
                          {m.file_name && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <FileText size={10} /> PDF
                            </span>
                          )}
                          {m.slides && m.slides.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <ImageIcon size={10} /> {m.slides.length} slide
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                            <Link2 size={10} /> Terhubung ke {m.lessons_count} pertemuan
                          </span>
                          <span className={`text-[10px] font-semibold ${m.status === 'aktif' ? 'text-[#188038]' : 'text-[#80868b]'}`}>
                            {m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditMateri(m)} className="p-2 text-[#80868b] hover:text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors" title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteMateri(m)} className="p-2 text-[#80868b] hover:text-[#d93025] hover:bg-[#fce8e6] transition-colors" title="Hapus">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== QUIZ MATERI VIEW ==================== */}
        {view === 'quiz-materi' && materiPaket && (
          <div className="space-y-4">
            <div className="bg-white border border-[#dadce0] p-5">
              <button onClick={backFromMateri} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center justify-between mt-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#202124] truncate">{materiPaket.title}</h2>
                  <p className="text-sm text-[#5f6368] mt-0.5">{materiLessons.length} materi pelajaran</p>
                </div>
              </div>
            </div>

            {materiLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat materi...
              </div>
            ) : materiLessons.length === 0 ? (
              <div className="bg-white border border-[#dadce0] p-14 text-center">
                <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                  <BookOpen size={28} className="text-[#1a73e8]" />
                </div>
                <p className="text-[#202124] font-semibold">Belum ada materi</p>
                <p className="text-[#5f6368] text-sm mt-1">Tambahkan materi/modul & video pembelajaran untuk kursus ini</p>
                {!isAdminCabang && (
                  <button onClick={openCreateLesson} className={`${primaryBtn} mt-5`}>
                    <Plus size={16} /> Tambah Materi
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#dadce0] overflow-hidden">
                <div className="divide-y divide-[#e8eaed]">
                  {materiLessons.map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                      {!isAdminCabang && (
                        <div className="flex flex-col">
                          <button onClick={() => moveLesson(idx, 'up')} disabled={idx === 0}
                            className="p-0.5 text-[#80868b] hover:text-[#1a73e8] disabled:opacity-20">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveLesson(idx, 'down')} disabled={idx === materiLessons.length - 1}
                            className="p-0.5 text-[#80868b] hover:text-[#1a73e8] disabled:opacity-20">
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                      <div className={`w-9 h-9 flex items-center justify-center shrink-0 text-xs font-bold text-white ${ lesson.status === 'aktif' ? 'bg-[#0E6187]' : 'bg-[#e8eaed]' }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#202124] truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {lesson.video_url && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <Video size={10} /> Video
                            </span>
                          )}
                          {lesson.content && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <FileText size={10} /> Materi
                            </span>
                          )}
                          {lesson.file_name && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <FileText size={10} /> PDF
                            </span>
                          )}
                          {!!lesson.slides?.length && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-[#80868b]">
                              <ImageIcon size={10} /> {lesson.slides.length} Slide
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold ${lesson.status === 'aktif' ? 'text-[#188038]' : 'text-[#80868b]'}`}>
                            {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                      {!isAdminCabang && (
                        <>
                          <button onClick={() => openEditLesson(lesson)}
                            className="w-9 h-9 flex items-center justify-center bg-[#f1f3f4] hover:bg-[#e8eaed] transition-colors" title="Edit">
                            <Edit3 size={15} className="text-[#5f6368]" />
                          </button>
                          <button onClick={() => handleDeleteLesson(lesson)}
                            className="w-9 h-9 flex items-center justify-center bg-[#fce8e6] hover:bg-[#f6d7d5] transition-colors" title="Hapus">
                            <Trash2 size={15} className="text-[#d93025]" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== QUIZ QUESTIONS VIEW ==================== */}
        {view === 'quiz-questions' && activeQuizPaket && (
          <div className="space-y-4">
            <div className="bg-white border border-[#dadce0] p-5">
              <button onClick={backToQuiz} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center justify-between mt-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#202124] truncate">{activeQuizPaket.title}</h2>
                  <p className="text-sm text-[#5f6368] mt-0.5">{questions.length} soal</p>
                </div>
                {!isAdminCabang && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={openSectionManager}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5f6368] hover:text-[#1a73e8] border border-[#dadce0] hover:border-[#1a73e8] bg-white px-3.5 py-2.5 transition-colors">
                      <Settings2 size={16} /> Kelola Bagian
                    </button>
                    <button onClick={openImportModal}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a73e8] hover:bgbg-[#f8f9fa] border border-[#1a73e8] px-3.5 py-2.5 transition-colors">
                      <ClipboardPaste size={16} /> Import Banyak
                    </button>
                    <button onClick={openCreateQuestion} className={primaryBtn}>
                      <Plus size={16} /> Tambah Soal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!qLoading && questions.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5 bg-white border border-[#dadce0]">
                <ListChecks size={15} className="text-[#80868b] shrink-0" />
                <button onClick={() => setSectionFilter('all')}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${qSectionFilter === 'all' ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'}`}>
                  Semua
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold ${qSectionFilter === 'all' ? 'bg-white/25' : 'bg-white'}`}>{questions.length}</span>
                </button>
                {sectionFilterOptions.map(s => (
                  <button key={s.id} onClick={() => setSectionFilter(s.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${qSectionFilter === s.id ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'}`}>
                    {s.name}
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold ${qSectionFilter === s.id ? 'bg-white/25' : 'bg-white'}`}>{s.questions_count ?? 0}</span>
                  </button>
                ))}
                {questions.some(q => q.section_id == null) && (
                  <button onClick={() => setSectionFilter('none')}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${qSectionFilter === 'none' ? 'bg-[#3c4043] text-white' : 'bg-[#f1f3f4] text-[#5f6368] hover:bg-[#e8eaed]'}`}>
                    Tanpa Bagian
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold ${qSectionFilter === 'none' ? 'bg-white/25' : 'bg-white'}`}>{questions.filter(q => q.section_id == null).length}</span>
                  </button>
                )}
              </div>
            )}

            {qLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat soal...
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dadce0] p-14 text-center">
                <BookOpen size={28} className="text-[#9aa0a6] mx-auto mb-2" />
                <p className="text-[#3c4043] font-semibold">Belum ada soal</p>
                <p className="text-[#5f6368] text-sm mt-1">Tambahkan minimal 1 soal untuk paket ini</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dadce0] p-14 text-center">
                <ListChecks size={28} className="text-[#9aa0a6] mx-auto mb-2" />
                <p className="text-[#3c4043] font-semibold">Tidak ada soal pada bagian ini</p>
                <p className="text-[#5f6368] text-sm mt-1">Pilih bagian lain atau klik "Semua" untuk menampilkan seluruh soal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questionGroups.map(g => (
                  <div key={g.section || '__none'}>
                    <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                      <span className="w-1 h-5 bg-[#0E6187]" />
                      <span className="text-sm font-bold text-[#3c4043]">{g.section || 'Umum'}</span>
                      <span className="text-xs text-[#80868b] font-medium">{g.items.length} soal</span>
                    </div>
                    <div className="space-y-3">
                      {g.items.map((q, qi) => {
                        const gi = orderedQuestions.findIndex(x => x.id === q.id)
                        return (
                          <div key={q.id} className="bg-white border border-[#dadce0] p-5">
                            <div className="flex items-start gap-3">
                              {!isAdminCabang && (
                                <div className="flex flex-col items-center gap-1 mt-1">
                                  <button onClick={() => moveQuestion(q, 'up')} className="p-0.5 text-[#80868b] hover:text-[#1a73e8] disabled:opacity-20" disabled={qi === 0}>
                                    <ChevronUp size={16} />
                                  </button>
                                  <button onClick={() => moveQuestion(q, 'down')} className="p-0.5 text-[#80868b] hover:text-[#1a73e8] disabled:opacity-20" disabled={qi === g.items.length - 1}>
                                    <ChevronDown size={16} />
                                  </button>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-bold text-[#80868b] shrink-0 mt-0.5">#{gi + 1}</span>
                                  <div className="text-[15px] font-semibold text-[#202124] leading-snug flex-1 min-w-0 [&_p]:my-0.5 [&_h1]:text-base [&_h2]:text-base [&_h3]:text-base [&_h4]:text-base [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h4]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_img]:max-h-40 [&_img]: [&_img]:my-1.5 [&_img]:border [&_img]:border-[#dadce0]" dangerouslySetInnerHTML={{ __html: cleanQuillHtml(q.question) }} />
                                  {!isAdminCabang && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button onClick={() => openEditQuestion(q)} className="w-9 h-9 flex items-center justify-center bg-[#f1f3f4] hover:bg-[#e8eaed] transition-colors" title="Edit">
                                        <Pencil size={14} className="text-[#5f6368]" />
                                      </button>
                                      <button onClick={() => deleteQuestion(q)} className="w-9 h-9 flex items-center justify-center bg-[#fce8e6] hover:bg-[#f6d7d5] transition-colors" title="Hapus">
                                        <Trash2 size={14} className="text-[#d93025]" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {(() => {
                                  const qMediaRaw = q.image_url || q.image_path
                                  const qMediaUrl = qMediaRaw && !qMediaRaw.startsWith('http') ? `${APP_URL}/storage/${qMediaRaw}` : qMediaRaw
                                  const qAudioRaw = q.audio_url || q.audio_path
                                  const qAudioUrl = qAudioRaw && !qAudioRaw.startsWith('http') ? `${APP_URL}/storage/${qAudioRaw}` : qAudioRaw
                                  return (qMediaUrl || qAudioUrl) ? (
                                    <div className="mt-3 space-y-2">
                                      {qMediaUrl && (
                                        <img src={qMediaUrl} alt="Gambar soal"
                                          className="max-h-44 border border-[#dadce0] object-contain" />
                                      )}
                                      {qAudioUrl && (
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-0.5 bg-[#fef7e0] text-[#b06000] text-[10px] font-bold shrink-0">
                                            AUDIO{q.audio_max_plays ? ` · ${q.audio_max_plays}x` : ''}
                                          </span>
                                          <audio src={qAudioUrl} controls className="h-8" />
                                        </div>
                                      )}
                                    </div>
                                  ) : null
                                })()}
                                <div className="mt-3 space-y-2">
                                  {q.question_type === 'rating' ? (
                                    <div className="flex items-center gap-2.5 text-sm px-3.5 py-2 bg-[#f3e8fd] text-[#7627bb] font-semibold">
                                      <span className="px-2 py-0.5 bg-[#8430ce] text-white text-[10px] font-bold shrink-0">SKALA</span>
                                      <span>Rating 1–{q.rating_max || q.options.length}</span>
                                      <span className="ml-auto text-[10px] font-bold text-[#8430ce] shrink-0">TANPA KUNCI</span>
                                    </div>
                                  ) : ((() => {
                                    const isMultiQ = q.question_type === 'multi'
                                    const keyList = isMultiQ
                                      ? (Array.isArray(q.correct_indexes) ? q.correct_indexes.map(Number) : [])
                                      : (q.correct_index !== null && q.correct_index !== undefined ? [Number(q.correct_index)] : [])
                                    const keySet = new Set(keyList)
                                    return q.options.map((opt, oi) => {
                                      const optLabel = typeof opt === 'string' ? opt : ((opt as { text?: string }).text ?? '')
                                      const optRaw = typeof opt === 'string' ? null : ((opt as { image_url?: string | null; image_path?: string | null }).image_url || (opt as { image_path?: string | null }).image_path || null)
                                      const optUrl = optRaw && !optRaw.startsWith('http') ? `${APP_URL}/storage/${optRaw}` : optRaw
                                      const isKey = keySet.has(oi)
                                      return (
                                        <div key={oi} className={`flex items-center gap-2.5 text-sm px-3.5 py-2 ${isKey ? 'bg-[#e6f4ea] text-[#137333] font-semibold' : 'bg-[#f8f9fa] text-[#5f6368]'}`}>
                                          <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 ${isMultiQ ? '' : ''} ${isKey ? 'bg-[#0E6187] text-white' : 'bg-white border border-[#dadce0] text-[#80868b]'}`}>
                                            {String.fromCharCode(65 + oi)}
                                          </span>
                                          {optUrl && <img src={optUrl} className="h-6 w-6 object-cover shrink-0" alt=""/>}
                                          {optLabel && <span>{optLabel}</span>}
                                          {isKey && <span className="ml-auto text-[10px] font-bold text-[#188038] shrink-0">BENAR</span>}
                                        </div>
                                      )
                                    })
                                  })())}
                                </div>
                                <p className="text-xs text-[#80868b] font-medium mt-3">Skor: {q.points} poin</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {qTotalPages > 1 && (
                  <div className="flex items-center justify-between bg-white border border-[#dadce0] px-4 py-3">
                    <button
                      onClick={() => setQPage(safeQPage - 1)}
                      disabled={safeQPage <= 1}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5f6368] hover:text-[#1a73e8] disabled:opacity-40 disabled:hover:text-[#5f6368] transition-colors">
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: (number | '…')[] = []
                        const total = qTotalPages
                        let start = Math.max(1, safeQPage - 2)
                        let end = Math.min(total, start + 4)
                        start = Math.max(1, end - 4)
                        if (start > 1) pages.push(1, '…')
                        for (let p = start; p <= end; p++) pages.push(p)
                        if (end < total) pages.push('…', total)
                        return pages.map((p, idx) => p === '…'
                          ? <span key={`e${idx}`} className="px-1 text-xs text-[#80868b]">…</span>
                          : <button key={p} onClick={() => setQPage(p as number)}
                              className={`w-8 h-8 text-xs font-bold transition-colors ${p === safeQPage ? 'bg-[#0E6187] text-white' : 'text-[#5f6368] hover:bg-[#f1f3f4]'}`}>
                              {p}
                            </button>)
                      })()}
                    </div>
                    <button
                      onClick={() => setQPage(safeQPage + 1)}
                      disabled={safeQPage >= qTotalPages}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5f6368] hover:text-[#1a73e8] disabled:opacity-40 disabled:hover:text-[#5f6368] transition-colors">
                      Berikutnya <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== QUIZ RESULTS VIEW ==================== */}
        {view === 'quiz-results' && activeQuizPaket && (
          <div className="space-y-4">
            <div className="bg-white border border-[#dadce0] p-5">
              <button onClick={backToQuiz} className="flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
                  <Award size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-[#202124] truncate">Hasil · {activeQuizPaket.title}</h2>
                  <p className="text-sm text-[#5f6368] mt-0.5">{participants.length} peserta mengerjakan{rGroupedMode && rGrouped.length > 1 ? ` · ${rGrouped.length} grup` : ''}{rHasFilter ? ` · filter: ${rFiltered.length}` : ''}</p>
                </div>
                {participants.length > 0 && !isAdminCabang && (
                  <button onClick={() => resetAttempts()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#d93025] hover:text-[#c5221f] border border-[#f28b82] px-3 py-2 hover:bg-[#fce8e6] transition-colors shrink-0">
                    <RotateCcw size={12} /> Reset Semua
                  </button>
                )}
              </div>
              {participants.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
                    <input value={rFSearch} onChange={e => { setRFSearch(e.target.value); setRPage(1) }}
                      placeholder="Sik nama kandidat..."
                      className={`${inputCls} pl-9`} />
                  </div>
                  <select value={rFCabang} onChange={e => { setRFCabang(e.target.value); setRPage(1) }} className={`${inputCls} sm:w-44`}>
                    <option value="">Cabang: Semua</option>
                    {rCabangOpts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={rFBatch} onChange={e => { setRFBatch(e.target.value); setRPage(1) }} className={`${inputCls} sm:w-40`}>
                    <option value="">Batch: Semua</option>
                    {rBatchOpts.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <select value={rFLevel} onChange={e => { setRFLevel(e.target.value); setRPage(1) }} className={`${inputCls} sm:w-36`}>
                    <option value="">Level: Semua</option>
                    {rLevelOpts.map(l => <option key={l} value={l}>{l === 'Tanpa Level' ? l : `Level ${l}`}</option>)}
                  </select>
                  {rHasFilter && (
                    <button onClick={resetResultFilters}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1a73e8] hover:text-[#1967d2] border border-[#1a73e8] px-3 py-2 hover:bgbg-[#f8f9fa] transition-colors shrink-0">
                      <X size={12} /> Batal Filter
                    </button>
                  )}
                </div>
              )}
              {participants.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="text-[11px] font-bold text-[#5f6368]">Grup berdasarkan</label>
                  <select value={rGroupBy}
                    onChange={e => { setRGroupBy(e.target.value as typeof rGroupBy); setRPage(1); setRCollapsed({}) }}
                    className={`${inputCls} sm:w-64`}>
                    <option value="all">Cabang · Batch · Level</option>
                    <option value="cabang">Cabang</option>
                    <option value="batch">Batch</option>
                    <option value="level">Level</option>
                    <option value="none">Tanpa Grup</option>
                  </select>
                  {rGroupedMode && rGrouped.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRCollapsed(() => Object.fromEntries(rGrouped.map(g => [g.name, false])))}
                        className="inline-flex items-center gap-1 border border-[#dadce0] px-3 py-2 text-[11px] font-bold text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                        <ChevronDown size={12} /> Buka Semua
                      </button>
                      <button onClick={() => setRCollapsed(() => Object.fromEntries(rGrouped.map(g => [g.name, true])))}
                        className="inline-flex items-center gap-1 border border-[#dadce0] px-3 py-2 text-[11px] font-bold text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                        <ChevronUp size={12} /> Tutup Semua
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!rLoading && participants.length > 0 && rFiltered.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-[#dadce0] px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center bgbg-[#f1f3f4] text-[#1a73e8] shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-[#202124] leading-none">{rFiltered.length}</p>
                    <p className="text-[10px] font-bold text-[#80868b] mt-1">Peserta</p>
                  </div>
                </div>
                <div className="bg-white border border-[#dadce0] px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368] shrink-0">
                    <Award size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-[#202124] leading-none">{rFiltered.length > 0 ? Math.round(rFiltered.reduce((a, b) => a + (Number(b.best_score) || 0), 0) / rFiltered.length) : 0}</p>
                    <p className="text-[10px] font-bold text-[#80868b] mt-1">Rata-rata</p>
                  </div>
                </div>
                <div className="bg-white border border-[#dadce0] px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center #e37400-\[#e37400\] text-[#b06000] shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-[#202124] leading-none">{rGroupedMode ? rGrouped.length : new Set(rFiltered.map(rCabangOf)).size}</p>
                    <p className="text-[10px] font-bold text-[#80868b] mt-1">{rGroupedMode ? 'Grup' : 'Cabang'}</p>
                  </div>
                </div>
                <div className="bg-white border border-[#dadce0] px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center #8430ce-\[#8430ce\] text-[#7627bb] shrink-0">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-[#202124] leading-none">{rFiltered.reduce((a, b) => a + ((Number(b.best_score) || 0) >= 60 ? 1 : 0), 0)}</p>
                    <p className="text-[10px] font-bold text-[#80868b] mt-1">Lulus (≥60)</p>
                  </div>
                </div>
              </div>
            )}

            {!rLoading && rFiltered.length > 0 && rSectionStats.length > 0 && (
              <div className="bg-white border border-[#dadce0] p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center bgbg-[#f1f3f4] text-[#1a73e8] shrink-0">
                      <BarChart3 size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#202124]">Persentase Benar per Bagian</h3>
                      <p className="text-[11px] text-[#5f6368]">
                        Rata-rata dari {rFiltered.length} kandidat{rHasFilter ? ' (sesuai filter)' : ''} · dari percobaan terbaik masing-masing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-semibold text-[#5f6368]">
                    {[['≥80 Bagus', '#188038'], ['50-79 Cukup', '#e37400'], ['<50 Lemah', '#d93025']].map(([label, color]) => (
                      <span key={label} className="inline-flex items-center gap-1">
                        <span className="w-2.5 h-2.5" style={{ backgroundColor: color }} /> {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {rSectionStats.map(s => (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="w-28 sm:w-40 text-[11px] font-semibold text-[#5f6368] truncate shrink-0" title={s.name}>{s.name}</span>
                      <div className="flex-1 h-5 bg-[#f1f3f4] overflow-hidden relative">
                        <div
                          className="h-full transition-all duration-500 flex items-center justify-end pr-1.5"
                          style={{ width: `${Math.max(s.percent, s.percent > 0 ? 6 : 0)}%`, backgroundColor: pctColor(s.percent) }}
                        >
                          {s.percent >= 12 && <span className="text-[9px] font-black text-white">{s.percent}%</span>}
                        </div>
                      </div>
                      <span className={`w-24 text-right text-[11px] font-bold shrink-0 ${pctTextColor(s.percent)}`}>
                        {s.correct}/{s.total * s.n} benar
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#80868b] text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat hasil...
              </div>
            ) : participants.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dadce0] p-14 text-center">
                <Users size={28} className="text-[#9aa0a6] mx-auto mb-2" />
                <p className="text-[#3c4043] font-semibold">Belum ada peserta</p>
                <p className="text-[#5f6368] text-sm mt-1">Hasil akan muncul setelah kandidat mengerjakan quiz</p>
              </div>
            ) : rFiltered.length === 0 ? (
              <div className="bg-white border border-dashed border-[#dadce0] p-14 text-center">
                <Search size={28} className="text-[#9aa0a6] mx-auto mb-2" />
                <p className="text-[#3c4043] font-semibold">Belum ada hasil dengan filter ini</p>
                <p className="text-[#5f6368] text-sm mt-1">Perubah filter atau klik "Batal Filter" untuk melihat semua peserta</p>
              </div>
            ) : (
              <>
                <div className="bg-white border-2 border-[#dadce0] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#0E6187] text-white">
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 w-10 text-left">#</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Nama Kandidat</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Cabang</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Batch</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Level</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Riwayat Percobaan</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Nilai Terbaik</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-left">Persentase per Bagian</th>
                          <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rGroupedMode ? (
                          rPageGroups.map(group => {
                            const isCollapsed = !!rCollapsed[group.name]
                            return (
                            <Fragment key={group.name}>
                              <tr className="bg-[#e8f0fe]">
                                <td colSpan={9} className="px-6 py-12 text-center">
                                  <button onClick={() => setRCollapsed(c => ({ ...c, [group.name]: !c[group.name] }))}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bgbg-[#f1f3f4] transition-colors">
                                    <span className="flex items-center gap-2.5 min-w-0">
                                      <span className={`flex h-8 w-8 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368] shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-0'}`}>
                                        <Building2 size={15} />
                                      </span>
                                      <span className="min-w-0">
                                        <span className="text-sm font-bold text-[#202124] block truncate">{group.name}</span>
                                        <span className="text-[11px] text-[#5f6368]">{group.total} peserta</span>
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-4 shrink-0">
                                      <span className="hidden sm:flex items-center gap-3 text-[11px]">
                                        <span className="text-[#5f6368]">Rata-rata: <b className="text-[#3c4043]">{group.avg}</b></span>
                                        <span className="text-[#9aa0a6]">|</span>
                                        <span className="text-[#5f6368]">Terbaik: <b className="text-[#1a73e8]">{group.best}</b></span>
                                      </span>
                                      <span className="sm:hidden text-[11px] text-[#5f6368]">
                                        <b className="text-[#1a73e8]">{group.best}</b> poin
                                      </span>
                                      <ChevronDown size={16} className={`text-[#80868b] transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                                    </span>
                                  </button>
                                </td>
                              </tr>
                              {!isCollapsed && group.items.map((par, i) => renderParticipantRow(par, (rSafePage - 1) * R_PER_PAGE + i))}
                            </Fragment>
                            )
                          })
                        ) : (
                          rPageParticipants.map((par, idx) => renderParticipantRow(par, (rSafePage - 1) * R_PER_PAGE + idx))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {renderPagination(rPagination, p => setRPage(p), rGroupedMode ? 'grup' : 'peserta')}
              </>
            )}
          </div>
        )}
      </div>

      {/* ==================== COURSE CATEGORY MODAL ==================== */}
      {showCourseCatModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[10vh] pb-8 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <h3 className="font-semibold text-[#202124]">{editingCourseCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setShowCourseCatModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nama Kategori <span className="text-[#d93025]">*</span></label>
                <input type="text" value={courseCatForm.name} onChange={e => setCourseCatForm({ ...courseCatForm, name: e.target.value })}
                  className={inputCls} placeholder="Contoh: Bimbingan, Psikotes, Bahasa Jepang..." />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowCourseCatModal(false)} className="border border-[#dadce0] px-4 py-2 text-sm font-semibold text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                  Batal
                </button>
                <button onClick={saveCourseCat} disabled={savingCourseCat} className="px-4 py-2 text-sm font-semibold text-white bg-[#0E6187] hover:bgbg-[#e8f0fe] disabled:opacity-60 transition-colors">
                  {savingCourseCat ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
              <div className="border-t border-[#e8eaed] pt-4">
                <p className="text-[11px] font-semibold text-[#80868b] mb-2">Daftar Kategori</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {categories.length === 0 && (
                    <p className="text-sm text-[#80868b] text-center py-4">Belum ada kategori. Buat via form di atas.</p>
                  )}
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 border border-[#e8eaed] px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#3c4043] truncate">{cat.name}</p>
                        <p className="text-[10px] text-[#80868b]">{cat.courses_count} kursus</p>
                      </div>
                      <button onClick={() => openEditCourseCat(cat)} className="p-1.5 bg-[#f1f3f4] hover:bg-[#e8eaed] transition-colors" title="Edit">
                        <Pencil size={13} className="text-[#5f6368]" />
                      </button>
                      <button onClick={() => deleteCourseCat(cat)} className="p-1.5 bg-[#fce8e6] hover:bg-[#f6d7d5] transition-colors" title="Hapus">
                        <Trash2 size={13} className="text-[#d93025]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== COURSE MODAL ==================== */}
      {showCourseModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <h3 className="font-semibold text-[#202124]">{editingCourse ? 'Edit Kursus' : 'Tambah Kursus'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Kursus <span className="text-[#d93025]">*</span></label>
                <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  className={inputCls} placeholder="Masukkan judul kursus" />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <div className="relative">
                  {uploadingImg && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-[#5f6368]">
                        <div className="w-4 h-4 rounded-full border-2 border-[#dadce0] border-t-[#1a73e8] animate-spin" /> Mengupload...
                      </div>
                    </div>
                  )}
                  <ReactQuill ref={quillRef} value={courseForm.description}
                    onChange={value => setCourseForm({ ...courseForm, description: value })}
                    modules={quillModules} formats={quillFormats} theme="snow" placeholder="Deskripsi kursus"
                    className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-[#dadce0] [&_.ql-container]:border-[#dadce0]" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Kategori</label>
                <select value={courseForm.category_id} onChange={e => setCourseForm({ ...courseForm, category_id: e.target.value })}
                  className={inputCls}>
                  <option value="">Tanpa kategori</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Level</label>
                  <select value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}
                    disabled={levelOptions.length === 0}
                    className={`${inputCls} disabled:bg-[#f8f9fa] disabled:text-[#80868b]`}>
                    <option value="">{levelOptions.length === 0 ? 'Belum ada jadwal level' : courseForm.batch_id ? 'Pilih Level' : 'Semua Batch - Pilih Level'}</option>
                    {levelOptions.map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Batch</label>
                  <div className="relative">
                    <button type="button" onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                      className="flex w-full items-center gap-2 border border-[#dadce0] bg-white px-3 py-2.5 text-sm text-left focus:outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]">
                      {courseForm.batch_id ? (
                        <span className="flex items-center gap-2 truncate">
                          <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: batches.find(b => String(b.id) === courseForm.batch_id)?.warna || '#0E6187' }} />
                          <span className="truncate text-[#3c4043]">{batches.find(b => String(b.id) === courseForm.batch_id)?.nama_batch || 'Semua Batch'}</span>
                        </span>
                      ) : <span className="text-[#80868b]">Pilih Batch...</span>}
                      <svg className={`ml-auto h-4 w-4 shrink-0 text-[#80868b] transition-transform ${showBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showBatchDropdown && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] border border-[#dadce0] bg-white py-1 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-60 overflow-y-auto">
                        <button type="button" onClick={() => { setCourseForm(prev => ({ ...prev, batch_id: '', level: '' })); setShowBatchDropdown(false) }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${!courseForm.batch_id ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                          <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: '#80868b' }} />
                          <span className="truncate">Semua Batch</span>
                        </button>
                        {batches.map(b => (
                          <button key={b.id} type="button"
                            onClick={() => { setCourseForm(prev => { const levels = batchLevels[b.id] || []; const keepLevel = prev.level && levels.includes(prev.level) ? prev.level : ''; return { ...prev, batch_id: String(b.id), level: String(b.id) === prev.batch_id ? prev.level : keepLevel } }); setShowBatchDropdown(false) }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === courseForm.batch_id ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#3c4043] hover:bg-[#f8f9fa]'}`}>
                            <span className="inline-block h-3 w-3 shrink-0 ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#0E6187' }} />
                            <span className="truncate">{b.nama_batch}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Urutan</label>
                  <input type="number" value={courseForm.sort} onChange={e => setCourseForm({ ...courseForm, sort: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={courseForm.status} onChange={e => setCourseForm({ ...courseForm, status: e.target.value })} className={inputCls}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Gambar</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-[#dadce0] text-sm text-[#5f6368] hover:bg-[#f8f9fa] cursor-pointer transition-colors">
                    <ImageIcon size={16} /> Pilih Gambar
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
                    }} />
                  </label>
                  {imagePreview && (
                    <div className="relative w-14 h-14 overflow-hidden border border-[#dadce0]">
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute top-0.5 right-0.5 #202124-\[#202124\] p-0.5">
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Password Kursus (opsional)</label>
                <div className="relative">
                  <input
                    type={showPasswordCourse ? 'text' : 'password'}
                    value={courseForm.password_course}
                    onChange={e => setCourseForm({ ...courseForm, password_course: e.target.value })}
                    className={`${inputCls} pr-10`}
                    placeholder="Masukkan password untuk akses kursus"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordCourse(!showPasswordCourse)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#80868b] hover:text-[#5f6368] transition-colors"
                    title={showPasswordCourse ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPasswordCourse ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-[#80868b]">Kosongkan jika kursus terbuka tanpa password. Siswa akan diminta memasukkan password ini saat membuka kursus.</p>
              </div>
              <div>
                <label className={labelCls}>Alert Kursus (opsional)</label>
                <textarea value={courseForm.alert} onChange={e => setCourseForm({ ...courseForm, alert: e.target.value })}
                  rows={2} placeholder="Contoh: Akses kelas ini untuk menonton video pembelajaran"
                  className={`${inputCls} resize-none`} />
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => setCourseForm({ ...courseForm, alert_active: true })}
                    className={`flex-1 border px-3 py-2 text-sm font-semibold transition-colors ${courseForm.alert_active ? 'border-[#1a73e8] bg-[#0E6187] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:border-[#dadce0]'}`}>
                    Aktif
                  </button>
                  <button type="button" onClick={() => setCourseForm({ ...courseForm, alert_active: false })}
                    className={`flex-1 border px-3 py-2 text-sm font-semibold transition-colors ${!courseForm.alert_active ? 'border-[#1a73e8] bg-[#0E6187] text-white' : 'border-[#dadce0] bg-white text-[#5f6368] hover:border-[#dadce0]'}`}>
                    Nonaktif
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-[#80868b]">Alert yang aktif akan tampil di dashboard siswa kursus terkait.</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#dadce0] flex justify-end gap-3">
              <button onClick={() => setShowCourseModal(false)} className="px-4 py-2.5 text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">Batal</button>
              <button onClick={saveCourse} disabled={savingCourse} className="px-4 py-2.5 bg-[#0E6187] text-white text-sm font-semibold hover:bgbg-[#e8f0fe] disabled:opacity-50 transition-colors">
                {savingCourse ? 'Menyimpan...' : editingCourse ? 'Simpan' : 'Buat Kursus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== QUIZ PAKET MODAL ==================== */}
      {showPaketModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[6vh] pb-6 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-[#0E6187] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white/15 flex items-center justify-center shrink-0">
                  <FileCheck2 size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white leading-tight">{editingPaket ? 'Edit Paket Soal' : 'Buat Paket Soal'}</h3>
                  <p className="text-xs text-white/75 truncate">
                    {editingPaket ? 'Perbarui pengaturan paket soal' : 'Kumpulkan soal dan atur aturan pengerjaannya'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPaketModal(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* STEP 1 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Informasi Paket</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Judul, keterangan, dan gambar sampul paket soal</p>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Judul Paket <span className="text-[#d93025]">*</span></label>
                <input type="text" value={paketForm.title} onChange={e => setPaketForm({ ...paketForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white"
                  placeholder="Contoh: Quiz Evaluasi Mingguan" />
                <label className="block text-xs font-semibold text-[#5f6368] mt-3 mb-1.5">Deskripsi <span className="text-[#80868b] font-normal">(opsional)</span></label>
                <textarea value={paketForm.description} onChange={e => setPaketForm({ ...paketForm, description: e.target.value })}
                  rows={2} placeholder="Petunjuk atau materi singkat..."
                  className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm resize-none focus:outline-none  focus:border-[#1a73e8] bg-white" />
                <label className="block text-xs font-semibold text-[#5f6368] mt-3 mb-1.5">Cover Paket <span className="text-[#80868b] font-normal">(opsional)</span></label>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-20 overflow-hidden border border-[#dadce0] bg-[#f8f9fa] flex items-center justify-center shrink-0">
                    {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /> : <BookOpen size={20} className="text-[#9aa0a6]" />}
                  </div>
                  <div className="space-y-2">
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] hover:bgbg-[#f1f3f4] border border-[#1a73e8] bgbg-[#f8f9fa] px-2.5 py-1.5 transition-colors disabled:opacity-50">
                      {uploadingCover ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <><ImageIcon size={14} /> {coverPreview ? 'Ganti Cover' : 'Pilih Gambar'}</>}
                    </button>
                    {coverPreview && (
                      <button type="button" onClick={() => { setPaketForm({ ...paketForm, cover_image: '' }); setCoverPreview('') }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d93025] hover:bg-[#fce8e6] px-2 py-1.5 transition-colors">
                        <Trash2 size={11} /> Hapus cover
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* STEP 2 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Klasifikasi Paket</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Tentukan level kandidat dan kategori paket soal</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Level</label>
                    <select value={paketForm.level} onChange={e => setPaketForm({ ...paketForm, level: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white">
                      <option value="">Semua level</option>
                      {[1,2,3,4].map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Kategori Paket</label>
                    <div className="flex items-center gap-2">
                      <select value={paketForm.category} onChange={e => setPaketForm({ ...paketForm, category: e.target.value })}
                        className="flex-1 min-w-0 px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white">
                        <option value="">Pilih kategori</option>
                        {quizCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowCategoryModal(true)}
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#1a73e8] hover:bgbg-[#f1f3f4] border border-[#1a73e8] bgbg-[#f8f9fa] px-2.5 py-2.5 transition-colors">
                        <Settings2 size={13} /> Kelola
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Aturan Pengerjaan</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Batas waktu, percobaan, peringatan, dan nilai kelulusan</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Durasi (menit)</label>
                    <input type="number" min={1} max={180} value={paketForm.time_limit_minutes}
                      onChange={e => setPaketForm({ ...paketForm, time_limit_minutes: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-semibold text-[#5f6368]">Maks Percobaan</label>
                      <button type="button"
                        onClick={() => setPaketForm({ ...paketForm, max_attempts: Number(paketForm.max_attempts) === 0 ? '3' : '0' })}
                        title="Tanpa batas (unlimited)"
                        className={`relative w-10 h-[22px] transition-colors ${Number(paketForm.max_attempts) === 0 ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}>
                        <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${Number(paketForm.max_attempts) === 0 ? 'left-[20px]' : 'left-[2px]'}`} />
                      </button>
                    </div>
                    {Number(paketForm.max_attempts) === 0 ? (
                      <div className="px-3.5 py-2.5 bgbg-[#f8f9fa] border border-[#1a73e8] text-xs font-semibold text-[#1a73e8]">
                        Tanpa batas (unlimited)
                      </div>
                    ) : (
                      <input type="number" min={1} max={10} value={paketForm.max_attempts}
                        onChange={e => setPaketForm({ ...paketForm, max_attempts: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Maks Peringatan</label>
                    <input type="number" min={1} max={10} value={paketForm.max_warnings}
                      onChange={e => setPaketForm({ ...paketForm, max_warnings: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Nilai Lulus (0-200)</label>
                    <input type="number" min={0} max={200} value={paketForm.passing_score}
                      onChange={e => setPaketForm({ ...paketForm, passing_score: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3 mt-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#3c4043]">Acak urutan soal</p>
                    <p className="text-[11px] text-[#5f6368] mt-0.5">Soal tampil beda urutan tiap percobaan</p>
                  </div>
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, shuffle_questions: !paketForm.shuffle_questions })}
                    className={`relative w-10 h-[22px] shrink-0 transition-colors ${paketForm.shuffle_questions ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}>
                    <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${paketForm.shuffle_questions ? 'left-[20px]' : 'left-[2px]'}`} />
                  </button>
                </div>
              </div>
              {/* STEP 4 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Template & Keamanan</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Pilih tampilan quiz, nyalakan pengawasan, dan tentukan status paket</p>
                  </div>
                </div>

                <label className="block text-xs font-semibold text-[#5f6368] mb-2">Template UI Quiz</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, quiz_template: 'basic' })}
                    className={`flex items-center gap-3 border-2 px-3.5 py-3 text-left transition-all ${ paketForm.quiz_template !== 'jft' ? 'border-[#1a73e8] bgbg-[#f8f9fa] ring-1 ring-[#1a73e8]' : 'border-[#dadce0] hover:border-[#dadce0]' }`}>
                    <span className={`w-10 h-10 shrink-0 flex items-center justify-center ${ paketForm.quiz_template !== 'jft' ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#80868b]' }`}>
                      <LayoutGrid size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#202124]">Basic</span>
                      <span className="block text-[11px] text-[#80868b] mt-0.5">Sederhana & fokus</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, quiz_template: 'jft' })}
                    className={`flex items-center gap-3 border-2 px-3.5 py-3 text-left transition-all ${ paketForm.quiz_template === 'jft' ? 'border-[#1f2022] bg-[#1f2022] ring-1 ring-[#1f2022]' : 'border-[#dadce0] hover:border-[#dadce0]' }`}>
                    <span className={`w-10 h-10 shrink-0 flex items-center justify-center ${ paketForm.quiz_template === 'jft' ? 'bg-[#188038] text-white' : 'bg-[#f1f3f4] text-[#80868b]' }`}>
                      <ShieldCheck size={18} />
                    </span>
                    <span>
                      <span className={`block text-sm font-semibold ${paketForm.quiz_template === 'jft' ? 'text-white' : 'text-[#202124]'}`}>JFT UI</span>
                      <span className={`block text-[11px] mt-0.5 ${paketForm.quiz_template === 'jft' ? 'text-white/60' : 'text-[#80868b]'}`}>Kamera & pengawasan</span>
                    </span>
                  </button>
                </div>
                <p className="text-[11px] text-[#5f6368] mt-2 leading-relaxed bg-[#f8f9fa] border border-[#dadce0] px-3 py-2">
                  {paketForm.quiz_template === 'jft'
                    ? 'JFT UI: tampilan quiz lengkap dengan pengawasan kamera. Sistem mengambil foto berkala & memberi peringatan.'
                    : 'Basic: tampilan quiz sederhana dengan kamera pengawas & keamanan aktif — foto berkala & peringatan otomatis.'}
                </p>

                <div className="mt-3 border border-[#dadce0] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 flex-none items-center justify-center ${paketForm.penilaian_ulangan ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                        <Award size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#3c4043]">Nilai Ulangan</p>
                        <p className="text-[11px] text-[#5f6368] mt-0.5">Skor terbaik kandidat otomatis masuk ke Nilai Ulangan saat paket dipakai di pertemuan</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setPaketForm({ ...paketForm, penilaian_ulangan: !paketForm.penilaian_ulangan })}
                      title={paketForm.penilaian_ulangan ? 'Matikan masuk penilaian ulangan' : 'Aktifkan masuk penilaian ulangan'}
                      className={`relative w-10 h-[22px] shrink-0 transition-colors ${paketForm.penilaian_ulangan ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${paketForm.penilaian_ulangan ? 'left-[20px]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                  <p className={`mt-2 text-[11px] leading-relaxed border px-3 py-2 ${paketForm.penilaian_ulangan ? 'border-[#a8dab5] bg-[#e6f4ea] text-[#137333]' : 'border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]'}`}>
                    {paketForm.penilaian_ulangan
                      ? 'Aktif secara default: saat paket ditambahkan ke pertemuan, tombol "Nilai Ulangan" langsung berstatus Masuk Penilaian. Guru tetap bisa mengubahnya per pertemuan.'
                      : 'Nonaktif secara default: guru perlu menekan tombol "Nilai Ulangan" di halaman pertemuan agar skor kandidat masuk ke penilaian.'}
                  </p>
                </div>

                <div className="mt-3 border border-[#dadce0] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 flex-none items-center justify-center ${paketForm.sertifikasi_aktif ? 'bg-[#e37400] text-white' : 'bg-[#f1f3f4] text-[#80868b]'}`}>
                        <Award size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#3c4043]">Sertifikasi Ujian</p>
                        <p className="text-[11px] text-[#5f6368] mt-0.5">Kandidat wajib foto identitas sebelum mulai, lalu mendapat sertifikat nilai otomatis</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setPaketForm({ ...paketForm, sertifikasi_aktif: !paketForm.sertifikasi_aktif })}
                      title={paketForm.sertifikasi_aktif ? 'Matikan sertifikasi' : 'Aktifkan sertifikasi'}
                      className={`relative w-10 h-[22px] shrink-0 transition-colors ${paketForm.sertifikasi_aktif ? 'bg-[#e37400]' : 'bg-[#e8eaed]'}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${paketForm.sertifikasi_aktif ? 'left-[20px]' : 'left-[2px]'}`} />
                    </button>
                  </div>

                  {paketForm.sertifikasi_aktif && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Judul sertifikat</label>
                        <input
                          type="text"
                          value={paketForm.sertifikat_judul}
                          onChange={e => setPaketForm({ ...paketForm, sertifikat_judul: e.target.value })}
                          placeholder="Kosongkan untuk memakai judul paket"
                          className="w-full border border-[#dadce0] px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Penerbit</label>
                          <input
                            type="text"
                            value={paketForm.sertifikat_penerbit}
                            onChange={e => setPaketForm({ ...paketForm, sertifikat_penerbit: e.target.value })}
                            placeholder="Kosongkan untuk nama aplikasi"
                            className="w-full border border-[#dadce0] px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Masa berlaku (hari)</label>
                          <input
                            type="number"
                            min={0}
                            value={paketForm.sertifikat_berlaku_hari}
                            onChange={e => setPaketForm({ ...paketForm, sertifikat_berlaku_hari: e.target.value })}
                            placeholder="0 = tidak ada masa berlaku"
                            className="w-full border border-[#dadce0] px-3 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3">
                        <Camera size={16} className="mt-0.5 shrink-0 text-[#80868b]" />
                        <div>
                          <p className="text-sm font-semibold text-[#3c4043]">Foto identitas selalu wajib</p>
                          <p className="text-[11px] text-[#5f6368] mt-0.5">
                            Saat sertifikasi aktif, kandidat harus memotret wajah sebelum ujian bisa dimulai. Foto ini
                            dipakai sebagai foto pada sertifikat.
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] leading-relaxed border border-[#fdd663] bg-[#fef7e0] px-3 py-2 text-[#b06000]">
                        Sertifikat terbit untuk setiap percobaan, lulus maupun tidak, dan memuat nilai, rincian per
                        bagian, foto identitas, serta kode verifikasi publik. Kandidat boleh memiliki lebih dari satu
                        sertifikat dari paket ini.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between gap-3 border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#3c4043]">Keamanan kamera</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">Sistem mengambil foto berkala & mendeteksi wajah selama pengerjaan</p>
                    </div>
                    <button type="button" onClick={() => setPaketForm({ ...paketForm, camera_enabled: !paketForm.camera_enabled })}
                      className={`relative w-10 h-[22px] shrink-0 transition-colors ${paketForm.camera_enabled ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${paketForm.camera_enabled ? 'left-[20px]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#3c4043]">Kunci saat keluar / tutup aplikasi</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">Keluar atau menutup aplikasi saat quiz berjalan memicu peringatan</p>
                    </div>
                    <button type="button" onClick={() => setPaketForm({ ...paketForm, block_exit: !paketForm.block_exit })}
                      className={`relative w-10 h-[22px] shrink-0 transition-colors ${paketForm.block_exit ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${paketForm.block_exit ? 'left-[20px]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 border border-[#dadce0] bg-[#f8f9fa] px-3.5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#3c4043]">Buka paket sekarang</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">Kandidat bisa langsung melihat & mulai quiz</p>
                    </div>
                    <button type="button" onClick={() => setPaketForm({ ...paketForm, status: paketForm.status === 'aktif' ? 'nonaktif' : 'aktif' })}
                      className={`relative w-10 h-[22px] shrink-0 transition-colors ${paketForm.status === 'aktif' ? 'bg-[#0E6187]' : 'bg-[#e8eaed]'}`}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] bg-white shadow transition-all ${paketForm.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-[#dadce0] bg-[#f8f9fa] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5f6368]">
                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 font-bold ${paketForm.status === 'aktif' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#e8eaed] text-[#5f6368]'}`}>
                  <span className="w-1.5 h-1.5 bg-current" />
                  {paketForm.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </span>
                <span className="shrink-0 inline-flex items-center gap-1.5 bgbg-[#f1f3f4] text-[#1a73e8] px-2 py-1 font-bold">
                  <Clock size={12} /> {paketForm.time_limit_minutes || 0} menit
                </span>
                <span className="shrink-0 inline-flex items-center gap-1.5 bg-[#e8eaed] text-[#5f6368] px-2 py-1 font-bold">
                  <Repeat size={12} /> {Number(paketForm.max_attempts) === 0 ? 'Tanpa batas' : `${paketForm.max_attempts}x percobaan`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPaketModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-[#5f6368] bg-white border border-[#dadce0] hover:bg-[#f1f3f4] transition-colors">
                  Batal
                </button>
                <button onClick={savePaket} disabled={savingPaket}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0E6187] hover:bgbg-[#e8f0fe] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingPaket ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : editingPaket ? 'Simpan Perubahan' : 'Buat Paket Soal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BANK PICKER MODAL ==================== */}
      {showBankPickerModal && activeCourse && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[10vh] pb-8 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <h3 className="font-semibold text-[#202124]">Paket Soal dari Bank</h3>
              <button onClick={() => setShowBankPickerModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-[#5f6368] mb-4">
                Centang paket soal dari bank untuk ditambahkan ke kursus <span className="font-semibold text-[#3c4043]">"{activeCourse.title}"</span>
              </p>
              {bankPickerLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#80868b] text-sm gap-2">
                  <Loader2 size={24} className="animate-spin text-[#1a73e8]" /> Memuat paket soal...
                </div>
              ) : bankPickerPakets.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 mx-auto bgbg-[#f1f3f4] flex items-center justify-center mb-3">
                    <ListChecks size={28} className="text-[#1a73e8]" />
                  </div>
                  <p className="text-[#202124] font-semibold">Bank kosong</p>
                  <p className="text-[#5f6368] text-sm mt-1">Belum ada paket soal di bank paket</p>
                </div>
              ) : (
                <div className="divide-y divide-[#e8eaed] border border-[#dadce0] overflow-hidden max-h-[50vh] overflow-y-auto">
                  {bankPickerPakets.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8f9fa] cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={bankPickedIds.includes(p.id)}
                        onChange={() => toggleBankPick(p.id)}
                        className="w-4 h-4 border-[#dadce0] text-[#1a73e8]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#202124] truncate">{p.title}</p>
                          {p.category && (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bgbg-[#f1f3f4] text-[#1a73e8] shrink-0">{p.category}</span>
                          )}
                        </div>
                        <p className="text-xs text-[#80868b] mt-0.5">
                          {[p.batch?.nama_batch, p.level && `Level ${p.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5f6368] shrink-0">
                        <span>{p.questions_count} soal</span>
                        <span className={`font-semibold ${p.status === 'aktif' ? 'text-[#137333]' : 'text-[#5f6368]'}`}>
                          {p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-[#dadce0] flex justify-end gap-3">
              <button onClick={() => setShowBankPickerModal(false)} className="px-4 py-2.5 text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">Batal</button>
              <button onClick={assignSelectedPakets} disabled={assigningPakets || bankPickedIds.length === 0}
                className="px-4 py-2.5 bg-[#0E6187] text-white text-sm font-semibold hover:bgbg-[#e8f0fe] disabled:opacity-50 transition-colors">
                {assigningPakets ? 'Menambahkan...' : `Tambahkan ${bankPickedIds.length > 0 ? `(${bankPickedIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LESSON (MATERI) MODAL ==================== */}
      {showLessonModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[6vh] pb-8 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#202124]">{editingLesson ? 'Edit Materi' : (lessonSource === 'course' ? 'Tambah Pertemuan' : 'Tambah Materi')}</h3>
                <p className="text-xs text-[#80868b]">{activeCourse?.title}</p>
              </div>
              <button onClick={() => setShowLessonModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Materi <span className="text-[#d93025]">*</span></label>
                <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Judul pelajaran" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>URL Video (YouTube)</label>
                <div className="flex gap-2">
                  <input value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="https://youtube.com/..." className={inputCls} />
                  {lessonForm.video_url && (
                    <button onClick={() => setLessonForm({ ...lessonForm, video_url: '' })} className="shrink-0 px-3 flex items-center text-[#80868b] hover:text-[#d93025] transition-colors" title="Hapus video">
                      <X size={18} />
                    </button>
                  )}
                </div>
                {lessonForm.video_url && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-[#5f6368] mb-1.5 flex items-center gap-1"><Video size={12} /> Pratinjau video</p>
                    <div className="overflow-hidden border border-[#dadce0] bg-black aspect-video">
                      <iframe
                        src={getYouTubeEmbedUrl(lessonForm.video_url) || lessonForm.video_url}
                        className="w-full h-full"
                        allowFullScreen
                        title="Preview Video"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Konten Materi</label>
                <ReactQuill ref={materiQuillRef} value={lessonForm.content}
                  onChange={value => setLessonForm({ ...lessonForm, content: value })}
                  modules={quillModules} formats={quillFormats} theme="snow" placeholder="Tulis materi pembelajaran di sini..."
                  className="[&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-[#dadce0] [&_.ql-container]:border-[#dadce0]" />
              </div>
              <div className="border-t border-[#e8eaed] pt-4">
                <LessonMediaFields
                  pdfName={lessonPdfName}
                  pdfSize={lessonPdfSize}
                  slides={lessonSlides}
                  uploading={savingLesson}
                  onPdf={file => {
                    setLessonPdf(file)
                    setLessonPdfName(file ? file.name : null)
                    setLessonPdfSize(file ? file.size : null)
                  }}
                  onRemovePdf={() => {
                    setLessonPdf(null)
                    setLessonPdfName(null)
                    setLessonPdfSize(null)
                  }}
                  onSlidesChange={slides => {
                    const removed = lessonSlides.filter(s => !slides.some(n => n.key === s.key))
                    removed.forEach(s => { if (!s.id) URL.revokeObjectURL(s.url || '') })
                    setRemovedSlideIds(prev => [...prev, ...removed.filter(s => s.id).map(s => s.id!)])
                    setLessonSlides(slides)
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Urutan</label>
                  <input type="number" min={1} value={lessonForm.sort} onChange={e => setLessonForm({ ...lessonForm, sort: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={lessonForm.status} onChange={e => setLessonForm({ ...lessonForm, status: e.target.value })} className={inputCls}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#dadce0] flex justify-end gap-3">
              <button onClick={() => setShowLessonModal(false)} className="px-4 py-2.5 text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">Batal</button>
              <button onClick={handleSaveLesson} disabled={savingLesson} className="px-4 py-2.5 bg-[#0E6187] text-white text-sm font-semibold hover:bgbg-[#e8f0fe] disabled:opacity-50 transition-colors">
                {savingLesson ? 'Menyimpan...' : editingLesson ? 'Simpan Perubahan' : (lessonSource === 'course' ? 'Tambah Pertemuan' : 'Tambah Materi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BANK MATERI MODAL ==================== */}
      {showMateriModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[6vh] pb-8 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#202124]">{editingMateri ? 'Edit Materi Bank' : 'Buat Materi'}</h3>
                <p className="text-xs text-[#80868b]">Disimpan di Bank Materi</p>
              </div>
              <button onClick={() => setShowMateriModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Materi <span className="text-[#d93025]">*</span></label>
                <input value={materiForm.title} onChange={e => setMateriForm({ ...materiForm, title: e.target.value })}
                  placeholder="Judul materi" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tautan ke Kursus <span className="text-[#80868b] font-normal">(opsional)</span></label>
                <select value={materiForm.course_id} onChange={e => setMateriForm({ ...materiForm, course_id: e.target.value })} className={inputCls}>
                  <option value="">Tanpa kursus</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>URL Video (YouTube)</label>
                <div className="flex gap-2">
                  <input value={materiForm.video_url} onChange={e => setMateriForm({ ...materiForm, video_url: e.target.value })}
                    placeholder="https://youtube.com/..." className={inputCls} />
                  {materiForm.video_url && (
                    <button onClick={() => setMateriForm({ ...materiForm, video_url: '' })} className="shrink-0 px-3 flex items-center text-[#80868b] hover:text-[#d93025] transition-colors">
                      <X size={18} />
                    </button>
                  )}
                </div>
                {materiForm.video_url && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-[#5f6368] mb-1.5 flex items-center gap-1"><Video size={12} /> Pratinjau video</p>
                    <div className="overflow-hidden border border-[#dadce0] bg-black aspect-video">
                      <iframe src={getYouTubeEmbedUrl(materiForm.video_url) || materiForm.video_url} className="w-full h-full" allowFullScreen title="Preview Video" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Konten Materi</label>
                <ReactQuill ref={bankMateriQuillRef} value={materiForm.content}
                  onChange={value => setMateriForm({ ...materiForm, content: value })}
                  modules={quillModules} formats={quillFormats} theme="snow" placeholder="Tulis materi pembelajaran di sini..."
                  className="[&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-[#dadce0] [&_.ql-container]:border-[#dadce0]" />
              </div>
              <div className="border-t border-[#e8eaed] pt-4">
                <LessonMediaFields
                  pdfName={materiPdfName}
                  pdfSize={materiPdfSize}
                  slides={materiSlides}
                  uploading={savingMateri}
                  onPdf={file => {
                    setMateriPdf(file)
                    setMateriPdfName(file ? file.name : null)
                    setMateriPdfSize(file ? file.size : null)
                  }}
                  onRemovePdf={() => {
                    setMateriPdf(null)
                    setMateriPdfName(null)
                    setMateriPdfSize(null)
                  }}
                  onSlidesChange={slides => {
                    const removed = materiSlides.filter(s => !slides.some(n => n.key === s.key))
                    removed.forEach(s => { if (!s.id) URL.revokeObjectURL(s.url || '') })
                    setRemovedMateriSlideIds(prev => [...prev, ...removed.filter(s => s.id).map(s => s.id!)])
                    setMateriSlides(slides)
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Urutan</label>
                  <input type="number" min={1} value={materiForm.sort} onChange={e => setMateriForm({ ...materiForm, sort: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={materiForm.status} onChange={e => setMateriForm({ ...materiForm, status: e.target.value })} className={inputCls}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#dadce0] flex justify-end gap-3">
              <button onClick={() => setShowMateriModal(false)} className="px-4 py-2.5 text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">Batal</button>
              <button onClick={handleSaveMateri} disabled={savingMateri} className="px-4 py-2.5 bg-[#0E6187] text-white text-sm font-semibold hover:bgbg-[#e8f0fe] disabled:opacity-50 transition-colors">
                {savingMateri ? 'Menyimpan...' : editingMateri ? 'Simpan Perubahan' : 'Buat Materi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BULK IMPORT MODAL ==================== */}
      {showImportModal && (() => {
        const typeLabel = importType === 'choice' ? 'Pilihan Ganda' : importType === 'multi' ? 'Pilihan Ganda (Multi)' : importType === 'rating' ? 'Skala 1-9' : 'Esai'
        const typeDesc = importType === 'choice'
          ? 'Format: a. opsi / b. opsi / *a. kunci'
          : importType === 'multi'
            ? 'Format: a. opsi / b. opsi / beberapa kunci dengan *a. *b. (atau tulis kunci AB)'
            : importType === 'rating'
              ? 'Skala penilaian 1 sampai 9 per soal'
              : 'Soal terbuka, peserta mengetik jawaban sendiri'
        return (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-stretch justify-center p-2 sm:p-4">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-6xl overflow-hidden flex flex-col h-full max-h-[96vh]">
            {/* HEADER */}
            <div className="bg-[#0E6187] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white/15 flex items-center justify-center shrink-0">
                  <ClipboardPaste size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white leading-tight">Import Banyak Soal</h3>
                  <p className="text-xs text-white/75 truncate">
                    {activeQuizPaket?.title ? `Paket: ${activeQuizPaket.title}` : 'Pilih paket soal terlebih dahulu'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowImportModal(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* STEP 1 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Pilih Jenis Soal</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">{typeDesc}</p>
                  </div>
                </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['choice', 'multi', 'rating', 'essay'] as const).map(t => (
                        <button key={t} type="button"
                          onClick={() => {
                            setImportType(t)
                            // Parse ulang karena cara pemenggalan baris berbeda per jenis soal.
                            setImportParse(parseQuestionImport(importText, t))
                          }}
                          className={`py-2.5 text-xs sm:text-sm font-semibold border transition-colors ${importType === t ? 'bg-[#0E6187] text-white border-[#1a73e8] ' : 'bg-white text-[#5f6368] border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8f9fa]'}`}>
                          {t === 'choice' ? 'Pilihan Ganda' : t === 'multi' ? 'Pilihan Ganda (Multi)' : t === 'rating' ? 'Skala 1-9' : 'Esai'}
                        </button>
                      ))}
                    </div>
              </div>

              {/* STEP 2 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <h4 className="text-sm font-semibold text-[#202124] leading-tight">Tempel Soal</h4>
                      <p className="text-xs text-[#5f6368] mt-0.5">1 soal per baris &middot; awalan a./b./c. = opsi &middot; <span className="font-mono font-semibold text-[#5f6368]">*</span> = kunci</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => importImgInputRef.current?.click()} disabled={!!importingMedia}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7627bb] hover:text-[#7627bb] border border-[#e8def8] hover:border-[#8430ce] bg-[#f3e8fd] hover:bg-[#f3e8fd] px-2.5 py-1.5 transition-colors disabled:opacity-50">
                      <ImageIcon size={13} />
                      {importingMedia === 'gambar' ? 'Mengunggah...' : 'Upload Gambar'}
                    </button>
                    <button type="button" onClick={() => importAudioInputRef.current?.click()} disabled={!!importingMedia}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b06000] hover:text-[#b06000] border border-[#fdd663] hover:border-[#f9ab00] bg-[#fef7e0] hover:bg-[#fef7e0] px-2.5 py-1.5 transition-colors disabled:opacity-50">
                      <Mic size={13} />
                      {importingMedia === 'audio' ? 'Mengunggah...' : 'Upload Audio'}
                    </button>
                    <button type="button" onClick={() => onImportTextChange(importSample)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a73e8] hover:bgbg-[#f1f3f4] border border-[#1a73e8] bgbg-[#f8f9fa] px-2.5 py-1.5 transition-colors">
                      <FileText size={13} />
                      Isi Contoh
                    </button>
                  </div>
                </div>
                <input ref={importImgInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { onImportFile(e.target.files?.[0], 'gambar'); e.target.value = '' }} />
                <input ref={importAudioInputRef} type="file" accept={QUESTION_AUDIO_ACCEPT} className="hidden"
                  onChange={e => { onImportFile(e.target.files?.[0], 'audio'); e.target.value = '' }} />
                <div className="mt-2.5 border border-[#dadce0] #f8f9fa-\[#f8f9fa\] p-2.5">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#5f6368]">
                      <ImageIcon size={12} /> Media Terunggah
                      <span className="bg-[#e8eaed] px-1.5 py-0.5 text-[10px] text-[#5f6368]">{importMedia.length}</span>
                    </p>
                    {importMedia.length > 0 && (
                      <button type="button" onClick={insertAllImportTags}
                        className="inline-flex items-center gap-1 border border-[#1a73e8] bgbg-[#f8f9fa] px-2 py-1 text-[11px] font-semibold text-[#1a73e8] transition-colors hover:bgbg-[#f1f3f4]">
                        <Plus size={12} /> Sisipkan semua ke teks soal
                      </button>
                    )}
                  </div>

                  {importMedia.length === 0 ? (
                    <p className="border border-dashed border-[#dadce0] bg-white px-3 py-2.5 text-center text-[11px] text-[#80868b]">
                      Belum ada media. Klik <span className="font-semibold text-[#7627bb]">Upload Gambar</span> atau{' '}
                      <span className="font-semibold text-[#b06000]">Upload Audio</span> &mdash; link akan muncul di sini,
                      lalu tekan <span className="font-semibold text-[#5f6368]">Sisip</span> untuk menempelkannya ke soal.
                    </p>
                  ) : (
                    <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                      {importMedia.map((m, i) => (
                        <div key={`${m.url}-${i}`} className="flex flex-wrap items-center gap-2 border border-[#dadce0] bg-white p-1.5 sm:flex-nowrap">
                          {m.type === 'gambar' ? (
                            <img src={mediaUrl(m.url)} alt={m.name}
                              className="h-10 w-10 shrink-0 border border-[#dadce0] object-cover" />
                          ) : (
                            <span className="grid h-10 w-10 shrink-0 place-items-center border border-[#dadce0] bg-[#fef7e0] text-[#b06000]">
                              <Mic size={16} />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <input readOnly value={mediaUrl(m.url)} onFocus={e => e.currentTarget.select()}
                              className="w-full truncate border border-[#dadce0] bg-[#f8f9fa] px-2 py-1 font-mono text-[11px] text-[#5f6368]  focus:outline-none" />
                            <p className="mt-0.5 truncate px-0.5 text-[10px] text-[#80868b]">{m.type === 'gambar' ? 'Gambar' : 'Audio'} &middot; {m.name}</p>
                          </div>
                          {m.type === 'audio' && <audio src={mediaUrl(m.url)} controls className="h-7 w-24 shrink-0" />}
                          <div className="flex shrink-0 items-center gap-1">
                            <button type="button" onClick={() => insertImportTag(m)} title="Sisipkan tag ke teks soal"
                              className="inline-flex items-center gap-1 bgbg-[#f1f3f4] px-2 py-1 text-[11px] font-bold text-[#1a73e8] transition-colors hover:bgbg-[#f1f3f4]">
                              <Plus size={12} /> Sisip
                            </button>
                            <button type="button" onClick={() => copyImportMedia(m)} title="Salin link"
                              className="bg-[#f1f3f4] p-1.5 text-[#5f6368] transition-colors hover:bg-[#e8eaed]">
                              <Copy size={12} />
                            </button>
                            <button type="button" onClick={() => removeImportMedia(i)} title="Hapus media ini"
                              className="bg-[#fce8e6] p-1.5 text-[#d93025] transition-colors hover:bg-[#f6d7d5]">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <textarea ref={importTextRef} value={importText} onChange={e => onImportTextChange(e.target.value)}
                  rows={20} placeholder={'## Vocabulary\n[Arti kata "watashi" adalah...]\n*a. saya\nb. kamu\nc. dia\nd. kami   [2 poin]\n\n[A：ぼくは (student) です。\nB： benar!]\na. teacher\nb. student\n*c. sensei\nd. gakusei   [5 poin]'}
                  className="mt-2.5 w-full min-h-[300px] lg:min-h-[40vh] max-h-[62vh] px-3.5 py-3 border border-[#dadce0] text-[13px] leading-relaxed font-mono resize-y focus:outline-none  focus:border-[#1a73e8] #f8f9fa-\[#f8f9fa\]" />

                {/* PANDUAN */}
                <details className="mt-3 border border-[#fdd663] #fef7e0-\[#fef7e0\] p-3 group">
                  <summary className="flex items-center gap-1.5 text-xs font-bold text-[#b06000] cursor-pointer select-none list-none">
                    <FileText size={13} /> Panduan Penulisan
                    <ChevronDown size={13} className="ml-auto transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[#b06000]">
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span><span className="font-mono font-semibold">## Nama bagian</span> untuk mengelompokkan soal (opsional)</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Opsi diawali <span className="font-mono font-semibold">a.</span> / <span className="font-mono font-semibold">b.</span> / <span className="font-mono font-semibold">c.</span> dst, beri <span className="font-mono font-semibold">*</span> di depan opsi yang benar</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Di akhir soal/opsi boleh gunakan <span className="font-mono font-semibold">[2 poin]</span> untuk bobot skor</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Media soal: <span className="font-mono font-semibold">[gambar:URL]</span>, <span className="font-mono font-semibold">[audio:URL]</span>, dan <span className="font-mono font-semibold">[maks:2]</span> untuk batas putar audio</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Upload Gambar/Audio hanya menyimpan file &mdash; link-nya muncul di kotak <span className="font-semibold">Media Terunggah</span>. Tekan <span className="font-semibold">Sisip</span> untuk menempel tag ke posisi kursor, atau <span className="font-semibold">Salin</span> untuk menyalin link</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span><span className="font-mono font-semibold">[isi soal]</span> &mdash; paling aman untuk soal panjang/dialog. Stem ditulis dalam kurung siku, boleh beberapa baris sampai penutup <span className="font-mono font-semibold">]</span>, selalu memulai soal baru</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Tanpa kurung siku pun aman: selama opsi belum dimulai, baris berikutnya digabung ke stem soal yang sama</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Opsi diawali a. / b. / c. dst, beri * di depan opsi yang benar</span>
                    </li>
                    <li className="flex gap-1.5">
                      <span className="text-[#e37400] font-bold">&bull;</span>
                      <span>Bisa juga tempel dari Excel/Google Sheets: <span className="font-mono font-semibold">soal [TAB] opsiA [TAB] opsiB [TAB] opsiC [TAB] kunci [TAB] bagian [TAB] bobot</span></span>
                    </li>
                  </ul>
                </details>
              </div>

              {/* STEP 3 */}
              {importParse.length > 0 && (
                <div className="border border-[#dadce0] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <h4 className="text-sm font-semibold text-[#202124] leading-tight">Pratinjau Soal</h4>
                        <p className="text-xs text-[#5f6368] mt-0.5">Periksa dulu sebelum disimpan &middot; jenis: {typeLabel}</p>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 bgbg-[#f1f3f4] text-[#1a73e8] px-2.5 py-1.5 text-xs font-bold">
                      <ListChecks size={13} /> {importParse.length} soal
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {importParse.map((q, i) => (
                      <div key={i} className="flex items-start gap-2.5 border border-[#dadce0] px-3 py-2.5 bg-white hover:border-[#dadce0] transition-colors">
                        <span className="w-6 h-6 flex items-center justify-center bg-[#0E6187] text-white text-[11px] font-bold shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-[#1a73e8] bgbg-[#f8f9fa] px-1.5 py-0.5">{q.section || 'Tanpa bagian'}</span>
                            {q.image_path && <span className="text-[11px] font-bold text-[#7627bb] bg-[#f3e8fd] px-1.5 py-0.5">Gambar</span>}
                            {q.audio_path && <span className="text-[11px] font-bold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5">Audio{q.audio_max_plays ? ` · ${q.audio_max_plays}x` : ''}</span>}
                            <span className="text-[11px] font-semibold text-[#80868b]">{q.points} poin</span>
                          </div>
                          <p className="text-sm font-semibold text-[#202124] mt-1 line-clamp-2">{q.question || '(tanpa teks)'}</p>
                          {q.image_path && (
                            <img src={mediaUrl(q.image_path)} alt="media soal"
                              className="mt-2 max-h-40 border border-[#dadce0] object-contain" />
                          )}
                          {q.audio_path && (
                            <div className="mt-2 flex items-center gap-2">
                              <audio src={mediaUrl(q.audio_path)} controls className="h-8" />
                              {q.audio_max_plays && (
                                <span className="text-[11px] font-semibold text-[#b06000] bg-[#fef7e0] px-1.5 py-0.5">maks {q.audio_max_plays}x</span>
                              )}
                            </div>
                          )}
                          {q.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {q.options.map((o, oi) => {
                                const isKey = importType === 'multi'
                                  ? q.correct_indexes.includes(oi)
                                  : q.correct_index === oi
                                return (
                                <span key={oi}
                                  className={`flex items-center gap-1.5 text-[11px] px-1.5 py-0.5 font-medium ${isKey ? 'bg-[#0E6187] text-white font-bold' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                                  {String.fromCharCode(65 + oi)}.
                                  {o.image_path ? (
                                    <img src={mediaUrl(o.image_path)} alt={o.text || `opsi ${oi + 1}`}
                                      className="h-7 w-7 object-cover border border-[#dadce0]" />
                                  ) : (
                                    <span>{o.text}</span>
                                  )}
                                </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                        <button type="button" onClick={() => removeImportQ(i)} title="Hapus soal ini"
                          className="p-1.5 bg-[#fce8e6] hover:bg-[#f6d7d5] text-[#d93025] shrink-0 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importError && (
                <p className="bg-[#fce8e6] border border-[#f28b82] px-3 py-2.5 text-sm font-semibold text-[#c5221f]">{importError}</p>
              )}
            </div>

            {/* FOOTER */}
            <div className="px-5 py-3.5 border-t border-[#dadce0] bg-[#f8f9fa] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-[#5f6368] text-center sm:text-left">
                {importParse.length > 0
                  ? <>Siap menyimpan <span className="font-bold text-[#3c4043]">{importParse.length} soal</span> ({typeLabel})</>
                  : 'Belum ada soal yang terdeteksi'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowImportModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-[#5f6368] bg-white border border-[#dadce0] hover:bg-[#f1f3f4] transition-colors">
                  Batal
                </button>
                <button onClick={saveImport} disabled={savingImport || importParse.length === 0}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0E6187] hover:bgbg-[#e8f0fe] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingImport ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : `Simpan ${importParse.length} Soal`}
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}

      {/* ==================== QUESTION MODAL ==================== */}
      {showQuestionModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[6vh] pb-6 px-4 overflow-y-auto">
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="bg-[#0E6187] px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-white/15 flex items-center justify-center shrink-0">
                  <ListChecks size={20} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white leading-tight">{editingQuestion ? 'Edit Soal' : 'Tambah Soal'}</h3>
                  <p className="text-xs text-white/75 truncate">
                    {activeQuizPaket?.title ? `Paket: ${activeQuizPaket.title}` : 'Pilih paket soal terlebih dahulu'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowQuestionModal(false)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/15 transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* STEP 1 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">1</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Isi Soal</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Tulis pertanyaan dan tentukan bagian / materi soalnya</p>
                  </div>
                </div>
                <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">
                  Pertanyaan <span className="text-[#80868b] font-normal">(opsional, boleh kosong jika soal berupa gambar)</span>
                </label>
                <div className="border border-[#dadce0] overflow-hidden bg-white [&_.ql-editor]:min-h-[110px]">
                  <ReactQuill ref={questionQuillRef} value={qForm.question}
                    onChange={v => setQForm({ ...qForm, question: v })}
                    modules={questionQuillModules} formats={quillFormats} theme="snow"
                    placeholder="Tulis pertanyaan..." />
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 mb-1.5">
                  <label className="block text-xs font-semibold text-[#5f6368]">
                    Bagian / Materi Soal <span className="text-[#80868b] font-normal">(opsional)</span>
                  </label>
                  <button onClick={openSectionManager} type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a73e8] hover:bgbg-[#f1f3f4] px-2 py-1 transition-colors">
                    <Settings2 size={12} /> Kelola bagian
                  </button>
                </div>
                <select value={qForm.section_id} onChange={e => setQForm({ ...qForm, section_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white">
                  <option value="">Tanpa bagian</option>
                  {quizSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-[11px] text-[#80868b] mt-1.5">Contoh: Vocabulary, Grammar, Reading, Listening, Conversation</p>
              </div>
              {/* STEP 2 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">2</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Media Soal <span className="text-xs text-[#80868b] font-normal">(opsional)</span></h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Lampirkan gambar atau rekaman suara pendukung soal</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`border border-[#dadce0] p-3 ${qForm.image_path ? 'bg-[#f8f9fa]' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-[#7627bb]" />
                      <span className="text-xs font-semibold text-[#5f6368]">Gambar Soal</span>
                    </div>
                    {qForm.image_url ? (
                      <div className="relative">
                        <img src={qForm.image_url} alt="Pra-preview"
                          className="w-full h-28 object-contain bg-white border border-[#dadce0]" />
                        <button onClick={() => setQForm({ ...qForm, image_path: '', image_url: '' })}
                          className="absolute top-1.5 right-1.5 p-1 bg-[#d93025] text-white hover:bg-[#c5221f] transition-colors" title="Hapus gambar">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 h-28 border border-dashed border-[#dadce0] cursor-pointer hover:bg-[#f3e8fd] hover:border-[#8430ce] transition-colors ${uploadingQMedia === 'image' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingQMedia === 'image' ? <Loader2 size={18} className="animate-spin text-[#1a73e8]" /> : <UploadCloud size={18} className="text-[#80868b]" />}
                        <span className="text-[11px] font-semibold text-[#5f6368]">{uploadingQMedia === 'image' ? 'Mengunggah...' : 'Pilih gambar'}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={!!uploadingQMedia}
                          onChange={e => { uploadQuestionMedia(e.target.files?.[0], 'image'); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                  <div className={`border border-[#dadce0] p-3 ${qForm.audio_path ? 'bg-[#f8f9fa]' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Mic size={14} className="text-[#b06000]" />
                      <span className="text-xs font-semibold text-[#5f6368]">Suara Soal</span>
                    </div>
                    {qForm.audio_url ? (
                      <div className="space-y-2">
                        <audio src={qForm.audio_url} controls className="w-full h-9" />
                        <label className="text-[11px] font-medium text-[#5f6368] block mb-1 flex items-center gap-1">
                          <Repeat size={11} /> Maksimal putar <span className="text-[#80868b] font-normal">(kali mendengarkan)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={1} max={99} value={qForm.audio_max_plays}
                            onChange={e => setQForm({ ...qForm, audio_max_plays: e.target.value })}
                            className="w-24 px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                          <button onClick={() => setQForm({ ...qForm, audio_path: '', audio_url: '', audio_max_plays: '2' })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d93025] hover:bg-[#fce8e6] px-2 py-1.5 transition-colors">
                            <Trash2 size={11} /> Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 h-28 border border-dashed border-[#dadce0] cursor-pointer hover:bg-[#fef7e0] hover:border-[#f9ab00] transition-colors ${uploadingQMedia === 'audio' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingQMedia === 'audio' ? <Loader2 size={18} className="animate-spin text-[#1a73e8]" /> : <UploadCloud size={18} className="text-[#80868b]" />}
                        <span className="text-[11px] font-semibold text-[#5f6368]">{uploadingQMedia === 'audio' ? 'Mengunggah...' : 'Pilih audio (MP3/WAV/MP4)'}</span>
                        <input type="file" accept={QUESTION_AUDIO_ACCEPT} className="hidden" disabled={!!uploadingQMedia}
                          onChange={e => { uploadQuestionMedia(e.target.files?.[0], 'audio'); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              {/* STEP 3 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">3</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Tipe Jawaban</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Tentukan format jawaban yang dicari dari kandidat</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'choice' })}
                    className={`relative flex items-center gap-2.5 border px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'choice' ? 'border-[#1a73e8] bgbg-[#f8f9fa] ring-1 ring-[#1a73e8]' : 'border-[#dadce0] text-[#5f6368] hover:border-[#dadce0]'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center text-xs font-bold shrink-0 ${qForm.question_type === 'choice' ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>A/B/C</span>
                    <span>
                      <span className="block text-sm font-semibold text-[#3c4043]">Pilihan Ganda</span>
                      <span className="block text-[11px] text-[#80868b] mt-0.5 leading-snug">Satu kunci jawaban</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'multi' })}
                    className={`relative flex items-center gap-2.5 border px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'multi' ? 'border-[#188038] bg-[#e6f4ea] ring-1 ring-[#188038]' : 'border-[#dadce0] text-[#5f6368] hover:border-[#dadce0]'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center text-[10px] font-bold shrink-0 ${qForm.question_type === 'multi' ? 'bg-[#0E6187] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>A/B/C+</span>
                    <span>
                      <span className="block text-sm font-semibold text-[#3c4043]">Pilihan Ganda (Multi)</span>
                      <span className="block text-[11px] text-[#80868b] mt-0.5 leading-snug">Kunci boleh lebih dari satu</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'rating' })}
                    className={`relative flex items-center gap-2.5 border px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'rating' ? 'border-[#8430ce] bg-[#f3e8fd] ring-1 ring-[#8430ce]' : 'border-[#dadce0] text-[#5f6368] hover:border-[#dadce0]'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center text-xs font-bold shrink-0 ${qForm.question_type === 'rating' ? 'bg-[#8430ce] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>1-9</span>
                    <span>
                      <span className="block text-sm font-semibold text-[#3c4043]">Skala Rating</span>
                      <span className="block text-[11px] text-[#80868b] mt-0.5 leading-snug">Nilai bebas 1-{qForm.rating_max} tanpa kunci</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'essay' })}
                    className={`relative flex items-center gap-2.5 border px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'essay' ? 'border-[#e37400] bg-[#fef7e0] ring-1 ring-[#e37400]' : 'border-[#dadce0] text-[#5f6368] hover:border-[#dadce0]'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center text-xs font-bold shrink-0 ${qForm.question_type === 'essay' ? 'bg-[#e37400] text-white' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>TEXT</span>
                    <span>
                      <span className="block text-sm font-semibold text-[#3c4043]">Esai / Uraian</span>
                      <span className="block text-[11px] text-[#80868b] mt-0.5 leading-snug">Jawaban teks, nilai via kunci</span>
                    </span>
                  </button>
                </div>

                <div className="mt-4">
                  {qForm.question_type === 'rating' ? (
                    <div className="border border-[#e8def8] #f3e8fd-\[#f3e8fd\] p-3">
                      <label className="block text-xs font-semibold text-[#3c4043] mb-2">Skala Penilaian <span className="text-[#d93025]">*</span></label>
                      <div className="flex items-center gap-4 flex-wrap">
                        <input type="number" min={2} max={10} value={qForm.rating_max}
                          onChange={e => setQForm({ ...qForm, rating_max: e.target.value })}
                          className="w-[110px] px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-[#8430ce] focus:border-[#8430ce] bg-white" />
                        <div className="flex gap-1.5 flex-wrap">
                          {Array.from({ length: Math.min(10, Math.max(2, Number(qForm.rating_max) || 9)) }, (_, i) => (
                            <span key={i} className="w-8 h-8 flex items-center justify-center bg-white border border-[#e8def8] text-sm font-bold text-[#7627bb]">
                              {i + 1}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#5f6368] mt-2 leading-relaxed">Kandidat memilih nilai 1 sampai {Math.min(10, Math.max(2, Number(qForm.rating_max) || 9))}. Jawaban bersifat penilaian bebas (tidak ada benar/salah), poin penuh diberikan jika diisi.</p>
                    </div>
                  ) : qForm.question_type === 'essay' ? (
                    <div className="border border-[#fdd663] #fef7e0-\[#fef7e0\] p-3">
                      <label className="block text-xs font-semibold text-[#3c4043] mb-2">Kunci Jawaban <span className="text-[#80868b] font-normal">(opsional)</span></label>
                      <textarea value={qForm.keyword} onChange={e => setQForm({ ...qForm, keyword: e.target.value })}
                        placeholder="Contoh: karena, transportasi umum, 1847"
                        rows={2}
                        className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm resize-none focus:outline-none focus:border-[#1a73e8] focus:ring-[#e37400] focus:border-[#e37400] bg-white" />
                      <p className="text-[11px] text-[#5f6368] mt-2 leading-relaxed">Jika diisi, jawaban siswa yang mengandung kata kunci otomatis diberi poin penuh saat submit. Jika dikosongkan, jawaban menunggu penilaian manual.</p>
                    </div>
                  ) : (
                    <div className="border border-[#dadce0] p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="block text-xs font-semibold text-[#3c4043]">Opsi Jawaban <span className="text-[#d93025]">* (min 2)</span></label>
                        {(() => {
                          const isMultiType = qForm.question_type === 'multi'
                          const validKeys = isMultiType
                            ? (qForm.correct_indexes || []).filter(i => qOptions[i] && (qOptions[i].text.trim() || qOptions[i].image_path)).sort((a, b) => a - b)
                            : (qOptions.some((o, i) => qForm.correct_index === String(i) && (o.text.trim() || o.image_path)) ? [Number(qForm.correct_index)] : [])
                          const hasKey = validKeys.length > 0
                          return (
                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold ${hasKey ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fef7e0] text-[#b06000]'}`}>
                              <span className="w-1.5 h-1.5 bg-current" />
                              {isMultiType ? 'Kunci' : 'Kunci'}: {hasKey ? validKeys.map(i => String.fromCharCode(65 + i)).join(', ') : 'belum dipilih'}
                            </span>
                          )
                        })()}
                      </div>
                      <div className="space-y-2">
                        {qOptions.map((opt, oi) => {
                          const isMultiType = qForm.question_type === 'multi'
                          const isKey = isMultiType
                            ? (qForm.correct_indexes || []).includes(oi)
                            : qForm.correct_index === String(oi)
                          const toggleKey = () => {
                            if (isMultiType) {
                              const cur = qForm.correct_indexes || []
                              const next = cur.includes(oi) ? cur.filter(i => i !== oi) : [...cur, oi].sort((a, b) => a - b)
                              setQForm({ ...qForm, correct_indexes: next })
                            } else {
                              setQForm({ ...qForm, correct_index: String(oi), correct_indexes: [] })
                            }
                          }
                          return (
                          <div key={oi}
                            className={`flex items-center gap-2 border px-2 py-1.5 transition-colors ${isKey ? 'border-[#a8dab5] #e6f4ea-\[#e6f4ea\]' : 'border-[#dadce0] bg-white'}`}>
                            <button onClick={toggleKey}
                              title={isMultiType ? 'Tandai/lepas jawaban benar' : 'Tandai sebagai jawaban benar'}
                              className={`w-7 h-7 shrink-0 flex items-center justify-center border-2 text-xs font-bold transition-colors ${isMultiType ? '' : ''} ${isKey ? 'border-[#188038] bg-[#0E6187] text-white' : 'border-[#dadce0] text-[#80868b] hover:border-[#1a73e8] hover:text-[#1a73e8]'}`}>
                              {String.fromCharCode(65 + oi)}
                            </button>
                            <input value={opt.text} onChange={e => { const arr = [...qOptions]; arr[oi] = { ...arr[oi], text: e.target.value }; setQOptions(arr) }}
                              placeholder={opt.image_path ? `Opsi ${String.fromCharCode(65 + oi)} (gambar)` : `Opsi ${String.fromCharCode(65 + oi)}`}
                              className="flex-1 min-w-0 px-3 py-2 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                            <div className="relative shrink-0 h-9 w-9">
                              <label title="Unggah gambar jawaban"
                                className={`w-9 h-9 flex items-center justify-center border transition-colors cursor-pointer ${opt.image_path ? 'border-transparent' : 'border-[#dadce0] bg-[#f8f9fa] hover:border-[#1a73e8] hover:text-[#1a73e8] text-[#80868b]'} ${uploadingOptImg === oi ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploadingOptImg === oi
                                  ? <Loader2 size={14} className="animate-spin text-[#1a73e8]" />
                                  : opt.image_path
                                    ? <img src={opt.image_url || ''} className="w-9 h-9 object-cover" alt={`Opsi ${String.fromCharCode(65 + oi)}`} />
                                    : <ImageIcon size={14} />}
                                <input type="file" accept="image/*" className="hidden" disabled={uploadingOptImg !== null}
                                  onChange={e => { uploadOptionImage(e.target.files?.[0], oi); e.target.value = '' }} />
                              </label>
                              {opt.image_path && (
                                <button onClick={() => setQOptions(prev => prev.map((o, i) => i === oi ? { ...o, image_path: null, image_url: null } : o))}
                                  title="Hapus gambar opsi"
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-[#d93025] text-white">
                                  <X size={11} />
                                </button>
                              )}
                            </div>
                            {qOptions.length > 2 && (
                              <button onClick={() => {
                                setQOptions(qOptions.filter((_, idx) => idx !== oi))
                                const cur = qForm.correct_indexes || []
                                setQForm({ ...qForm, correct_indexes: cur.filter(i => i !== oi).map(i => i > oi ? i - 1 : i) })
                              }} title="Hapus opsi"
                                className="p-1.5 text-[#d93025] hover:bg-[#fce8e6] hover:text-[#d93025] shrink-0 transition-colors">
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          )
                        })}
                      </div>
                      {qOptions.length < 6 && (
                        <button onClick={() => setQOptions([...qOptions, { text: '', image_path: null, image_url: null }])}
                          className="mt-2 w-full py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#1a73e8] bgbg-[#f8f9fa] hover:bgbg-[#f1f3f4] border border-dashed border-[#1a73e8] transition-colors">
                          <Plus size={13} /> Tambah opsi
                        </button>
                      )}
                      <p className="text-[11px] text-[#5f6368] mt-2 leading-relaxed">
                        {qForm.question_type === 'multi'
                          ? <>Klik huruf <span className="font-bold text-[#137333]">A/B/C...</span> untuk menandai <span className="font-bold">satu atau lebih</span> kunci jawaban. Jawaban dinilai benar hanya bila pilihan kandidat sama persis dengan kunci. Klik ikon <span className="font-bold text-[#1a73e8]">gambar</span> untuk menjadikan opsi berupa gambar.</>
                          : <>Klik huruf <span className="font-bold text-[#137333]">A/B/C...</span> untuk menandai kunci jawaban. Klik ikon <span className="font-bold text-[#1a73e8]">gambar</span> di kanan opsi untuk menjadikan opsi berupa gambar.</>}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 4 */}
              <div className="border border-[#dadce0] p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 shrink-0 bg-[#0E6187] text-white flex items-center justify-center text-xs font-bold">4</span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#202124] leading-tight">Bobot Skor</h4>
                    <p className="text-xs text-[#5f6368] mt-0.5">Poin yang didapat kandidat bila menjawab benar</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" min={1} value={qForm.points} onChange={e => setQForm({ ...qForm, points: e.target.value })}
                    className="w-32 px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none  focus:border-[#1a73e8] bg-white" />
                  <span className="inline-flex items-center gap-1.5 bgbg-[#f1f3f4] text-[#1a73e8] px-2.5 py-1.5 text-xs font-bold">
                    <Award size={13} /> {qForm.points || 0} poin
                  </span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-[#dadce0] bg-[#f8f9fa] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <p className="text-xs text-[#5f6368] text-center sm:text-left">
                {qForm.question_type === 'choice'
                  ? 'Pastikan kunci jawaban sudah ditandai pada salah satu opsi.'
                  : qForm.question_type === 'multi'
                    ? 'Tandai satu atau lebih kunci jawaban. Kandidat harus memilih tepat sama dengan kunci.'
                    : qForm.question_type === 'rating'
                      ? 'Soal rating tidak memakai kunci jawaban.'
                      : 'Esai dinilai dari kunci kata kunci atau penilaian manual.'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowQuestionModal(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-semibold text-[#5f6368] bg-white border border-[#dadce0] hover:bg-[#f1f3f4] transition-colors">
                  Batal
                </button>
                <button onClick={saveQuestion} disabled={savingQuestion}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0E6187] hover:bgbg-[#e8f0fe] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingQuestion ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : editingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION LIST MODAL ==================== */}
      {showSectionListModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center #202124-\[#202124\] p-4" onClick={() => setShowSectionListModal(false)}>
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#202124]">Kelola Bagian / Materi Soal</h3>
                <p className="text-xs text-[#80868b] mt-0.5">{activeQuizPaket?.title}</p>
              </div>
              <button onClick={() => setShowSectionListModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#5f6368]">{quizSections.length} bagian</p>
                <button onClick={openAddSection}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E6187] text-white text-xs font-semibold hover:bgbg-[#e8f0fe] transition-colors">
                  <Plus size={13} /> Tambah Bagian
                </button>
              </div>
              {quizSections.length === 0 ? (
                <p className="text-center text-xs text-[#80868b] py-8">Belum ada bagian. Klik "Tambah Bagian" untuk membuatnya.</p>
              ) : (
                <div className="space-y-2">
                  {quizSections.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 border border-[#dadce0] px-3.5 py-2.5 hover:bg-[#f8f9fa] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#3c4043] truncate">{s.name}</p>
                        <p className="text-[11px] text-[#80868b]">{s.questions_count ?? 0} soal</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditSection(s)} className="p-1.5 text-[#80868b] hover:text-[#1a73e8] hover:bgbg-[#f1f3f4] transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteSection(s)} className="p-1.5 text-[#d93025] hover:text-[#d93025] hover:bg-[#fce8e6] transition-colors" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION ADD/EDIT MODAL ==================== */}
      {showSectionModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center #202124-\[#202124\] p-4" onClick={() => setShowSectionModal(false)}>
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <h3 className="font-semibold text-[#202124]">{editingQSection ? 'Edit Bagian' : 'Tambah Bagian'}</h3>
              <button onClick={() => setShowSectionModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-[#5f6368] mb-1.5">Nama Bagian</label>
              <input
                value={qSectionName}
                onChange={e => setQSectionName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveSection() }}
                placeholder="Contoh: Vocabulary, Grammar, Listening..."
                className="w-full px-3.5 py-2.5 border border-[#dadce0] text-sm focus:outline-none focus:border-[#1a73e8] focus:border-[#1a73e8]"
                autoFocus />
            </div>
            <div className="px-5 py-4 border-t border-[#dadce0] flex items-center justify-end gap-2">
              <button onClick={() => setShowSectionModal(false)} className="px-4 py-2 text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] transition-colors">Batal</button>
              <button onClick={saveSection} disabled={savingSection} className="px-4 py-2 bg-[#0E6187] text-white text-sm font-semibold hover:bgbg-[#e8f0fe] disabled:opacity-50 transition-colors">
                {savingSection ? 'Menyimpan...' : editingQSection ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CATEGORY MODAL ==================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center #202124-\[#202124\] p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="border border-[#dadce0] bg-white w-full max-w-md shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#dadce0] sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-[#202124]">Kelola Kategori Paket</h2>
                <p className="text-sm text-[#80868b]">Tambahkan atau hapus kategori quiz</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveCategory() }}
                  placeholder="Nama kategori baru..." className={`${inputCls} flex-1`} />
                <button onClick={saveCategory} disabled={savingCategory} className={primaryBtn}>
                  {savingCategory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Tambah
                </button>
              </div>
              <div className="space-y-2">
                {quizCategories.length === 0 ? (
                  <p className="text-sm text-[#80868b] text-center py-6">Belum ada kategori</p>
                ) : quizCategories.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-[#f8f9fa] px-4 py-2.5">
                    <span className="text-sm font-medium text-[#3c4043]">{c.name}</span>
                    <button onClick={() => deleteCategory(c)} className="p-1.5 text-[#d93025] hover:text-[#d93025] hover:bg-[#fce8e6] transition-colors" title="Hapus">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ATTEMPT DETAIL MODAL ==================== */}
      {showDetailModal && (
        <div className="fixed inset-0 #202124-\[#202124\] z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto" onClick={() => setShowDetailModal(false)}>
          <div className="border border-[#dadce0] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[#dadce0] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#202124]">Detail Pengerjaan</h3>
                <p className="text-xs text-[#80868b]">{detail?.siswa?.nama || 'Kandidat'} · Percobaan #{detail?.attempt?.attempt_number}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-[#f1f3f4] transition-colors">
                <X size={20} className="text-[#80868b]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoading || !detail ? (
                <div className="text-center text-sm text-[#80868b] py-12">Memuat detail...</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#f8f9fa] p-3 text-center">
                      <p className="text-lg font-bold text-[#202124]">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-[10px] text-[#5f6368] font-medium">Skor</p>
                    </div>
                    <div className="bg-[#f8f9fa] p-3 text-center">
                      <p className="text-lg font-bold text-[#202124]">{detail.attempt.correct_count}/{detail.attempt.total_count}</p>
                      <p className="text-[10px] text-[#5f6368] font-medium">Benar</p>
                    </div>
                    <div className="bg-[#f8f9fa] p-3 text-center">
                      <p className="text-lg font-bold text-[#202124]">{detail.attempt.warnings}</p>
                      <p className="text-[10px] text-[#5f6368] font-medium">Peringatan</p>
                    </div>
                  </div>
                  {detail.sertifikat && (
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[#3c4043] flex items-center gap-1.5"><Award size={12} /> Sertifikat</p>
                        <a
                          href={`/verifikasi-sertifikat/${detail.sertifikat.kode_verifikasi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-[#1a73e8] hover:underline"
                        >
                          Cek keaslian
                        </a>
                      </div>
                      <CertificateCard sertifikat={detail.sertifikat} />
                    </div>
                  )}
                  {detail.attempt.webcam_photo && (
                    <div>
                      <p className="text-sm font-medium text-[#3c4043] mb-2 flex items-center gap-1.5"><Camera size={12} /> Foto Pengerjaan</p>
                      <img src={detail.attempt.webcam_photo} alt="Webcam" className="w-full border border-[#dadce0] max-h-52 object-cover" />
                    </div>
                  )}
                  <div className="space-y-3">
                    {detail.questions.map((q, i) => (
                      <div key={q.id} className="border border-[#dadce0] p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-[#202124] leading-snug shrink-0">{i + 1}.</p>
                          <div className="text-sm font-bold text-[#202124] leading-snug min-w-0 flex-1 [&_img]:max-h-40 [&_img]: [&_img]:my-1" dangerouslySetInnerHTML={{ __html: cleanQuillHtml(q.question) }} />
                          <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 ${q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'bg-[#fef7e0] text-[#b06000]' : q.is_correct === true ? 'bg-[#e6f4ea] text-[#137333]' : q.is_correct === false ? 'bg-[#fce8e6] text-[#d93025]' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
                            {q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'BELUM DINILAI' : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'}
                          </span>
                        </div>
                        {(q as any).image_url && (
                          <div className="mt-2 border border-[#dadce0] bg-[#f8f9fa] p-2">
                            <img src={(q as any).image_url} alt="Soal" className="max-h-40 mx-auto object-contain" />
                          </div>
                        )}
                        {(q as any).audio_url && (
                          <div className="mt-2 border border-[#dadce0] bg-[#f8f9fa] p-2">
                            <audio src={(q as any).audio_url} controls className="w-full h-9" />
                          </div>
                        )}
                        <div className="mt-2 space-y-1.5">
                          {q.question_type === 'rating' ? (
                            <div>
                              <div className="flex gap-1 flex-wrap">
                                {q.options.map((opt, oi) => {
                                  const isSelected = q.selected_index === oi
                                  const optLabel = typeof opt === 'string' ? opt : ((opt as { text?: string }).text ?? '')
                                  return (
                                    <span key={oi} className={`w-8 h-8 flex items-center justify-center text-[11px] font-bold border-2 ${isSelected ? 'border-[#8430ce] bg-[#8430ce] text-white' : 'border-[#dadce0] bg-[#f8f9fa] text-[#80868b]'}`}>
                                      {optLabel}
                                    </span>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-[#5f6368] mt-1.5">
                                Jawaban: <span className="font-bold text-[#7627bb]">{q.selected_index !== null && q.selected_index !== undefined ? (typeof q.options[q.selected_index] === 'string' ? q.options[q.selected_index] : ((q.options[q.selected_index] as { text?: string }).text ?? '')) : 'Tidak diisi'}</span>
                                {q.is_correct === true && <span className="ml-2 text-[9.5px] font-bold text-[#8430ce]">TERISI · POIN DIBERIKAN</span>}
                              </p>
                            </div>
                          ) : q.question_type === 'essay' ? (
                            <div>
                              <p className="text-[11px] font-bold text-[#5f6368] mb-1.5">Jawaban Siswa</p>
                              <p className="text-xs text-[#3c4043] bg-[#f8f9fa] border border-[#dadce0] px-3 py-2.5 whitespace-pre-wrap min-h-[44px]">
                                {q.answer_text?.trim() ? q.answer_text : <span className="text-[#80868b]">Tidak diisi</span>}
                              </p>
                              {q.keyword && (
                                <p className="text-[10px] text-[#b06000] font-semibold mt-1.5"><span className="font-bold">Kata kunci:</span> {q.keyword}</p>
                              )}
                              {q.answer_text?.trim() && (
                                <div className="flex items-center gap-2 mt-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#5f6368] block mb-1">Nilai (0-{q.points})</label>
                                    <input type="number" min={0} max={q.points}
                                      value={grades[q.id] ?? ''}
                                      onChange={e => setGrades(g => ({ ...g, [q.id]: e.target.value }))}
                                      className="w-24 text-xs border border-[#dadce0] px-3 py-2 focus:outline-none  focus:border-[#1a73e8]"
                                      placeholder="-" />
                                  </div>
                                  <button type="button" disabled={savingGrade !== null || !grades[q.id]?.trim()}
                                    onClick={() => saveGrade(q.id)}
                                    className="self-end text-[11px] font-bold text-white bg-[#0E6187] px-3.5 py-2 disabled:opacity-40 hover:bgbg-[#e8f0fe]">
                                    {savingGrade === q.id ? 'Menyimpan...' : 'Simpan Nilai'}
                                  </button>
                                  {q.earned_points !== null && q.earned_points !== undefined && (
                                    <span className={`self-end text-[11px] font-bold px-2 py-1 ${q.is_correct === true ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fef7e0] text-[#b06000]'}`}>
                                      {q.earned_points}/{q.points} poin
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : ((() => {
                            const isMultiQ = q.question_type === 'multi'
                            const keySet = new Set(isMultiQ
                              ? (Array.isArray(q.correct_indexes) ? q.correct_indexes.map(Number) : [])
                              : (q.correct_index !== null && q.correct_index !== undefined ? [Number(q.correct_index)] : []))
                            const selSet = new Set(isMultiQ
                              ? (Array.isArray(q.selected_indexes) ? q.selected_indexes.map(Number) : [])
                              : (q.selected_index !== null && q.selected_index !== undefined ? [Number(q.selected_index)] : []))
                            return q.options.map((opt, oi) => {
                              const isCorrect = keySet.has(oi)
                              const isSelected = selSet.has(oi)
                              const optLabel = typeof opt === 'string' ? opt : ((opt as { text?: string }).text ?? '')
                              const optRaw = typeof opt === 'string' ? null : ((opt as { image_url?: string | null; image_path?: string | null }).image_url || (opt as { image_path?: string | null }).image_path || null)
                              const optUrl = optRaw && !optRaw.startsWith('http') ? `${APP_URL}/storage/${optRaw}` : optRaw
                              return (
                                <div key={oi}
                                  className={`flex items-center gap-2 text-xs px-3 py-1.5 font-medium ${isCorrect ? 'bg-[#e6f4ea] text-[#137333] font-bold' : isSelected ? 'bg-[#fce8e6] text-[#d93025] font-bold' : 'bg-[#f8f9fa] text-[#5f6368]'}`}>
                                  <span className={`w-4 h-4 flex items-center justify-center text-[9px] font-bold shrink-0 ${isMultiQ ? '' : ''} ${isCorrect ? 'bg-[#0E6187] text-white' : isSelected ? 'bg-[#d93025] text-white' : 'bg-[#e8eaed] text-[#80868b]'}`}>
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {optUrl && <img src={optUrl} className="h-5 w-5 object-cover shrink-0" alt=""/>}
                                  <span className="flex-1">{optLabel}</span>
                                  {isCorrect && <span className="text-[9px] font-bold shrink-0">KUNCI</span>}
                                  {isSelected && <span className="text-[9px] font-bold shrink-0">JAWABAN</span>}
                                </div>
                              )
                            })
                          })())}
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

      {/* ==================== WELCOME VIDEO SETTINGS MODAL ==================== */}
      {showWelcomeSettings && (
        <div className="fixed inset-0 z-[70] #202124-\[#202124\] flex items-center justify-center p-4" onClick={() => setShowWelcomeSettings(false)}>
          <div className="border border-[#dadce0] bg-white max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed] sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bgbg-[#f1f3f4] flex items-center justify-center">
                  <Settings size={18} className="text-[#1a73e8]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#202124]">Pengaturan LMS</h2>
                  <p className="text-[10px] text-[#80868b] font-medium">Video Selamat Datang untuk halaman siswa</p>
                </div>
              </div>
              <button onClick={() => setShowWelcomeSettings(false)}
                className="w-8 h-8 hover:bg-[#f1f3f4] flex items-center justify-center text-[#80868b] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {welcomeLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-[#5f6368] leading-relaxed">
                    Video ini akan pertunjukan di atas daftar kursus pada halaman <b className="text-[#3c4043]">Kelas Mendunia</b> siswa.
                    Mengunggah file video <b className="text-[#3c4043]">mp4 / webm</b> ucapan untuk siswa atau memakai <b className="text-[#3c4043]">URL YouTube</b>.
                  </p>

                  {welcomeVideoUrl && (
                    <div className="overflow-hidden border border-[#dadce0]">
                      <iframe
                        src={getYouTubeEmbedUrl(welcomeVideoUrl) || welcomeVideoUrl}
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        className="w-full aspect-video bg-black"
                        title="Video Selamat Datang"
                      />
                    </div>
                  )}

                  {welcomeVideo && (
                    <div className="overflow-hidden border border-[#dadce0]">
                      <video src={`${APP_URL}/storage/${welcomeVideo}`} controls
                        className="w-full aspect-video bg-black" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#3c4043] mb-1.5">File Video Selamat Datang</label>
                    {welcomeFile ? (
                      <div className="flex items-center gap-3 p-3 bgbg-[#f8f9fa] border-2 border-[#1a73e8]">
                        <Video size={18} className="text-[#1a73e8] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#202124] truncate">{welcomeFile.name}</p>
                          <p className="text-[10px] text-[#80868b] mt-0.5">{(welcomeFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                        <button onClick={() => setWelcomeFile(null)}
                          className="p-2 text-[#80868b] hover:text-[#d93025] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-[#dadce0] text-xs text-[#80868b] hover:border-[#1a73e8] hover:bg-[#f8f9fa] cursor-pointer transition-all">
                        <div className="w-10 h-10 bg-[#f1f3f4] flex items-center justify-center">
                          <Upload size={18} className="text-[#9aa0a6]" />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-bold text-[#5f6368]">Klik untuk diseleksi video</p>
                          <p className="text-[9px] text-[#80868b] mt-0.5">mp4, webm, mov · max 200 MB</p>
                        </div>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setWelcomeFile(f)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#dadce0]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-[10px] font-semibold text-[#80868b] uppercase">atau</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#3c4043] mb-1.5">URL Video YouTube</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={welcomeUrlInput}
                        onChange={e => setWelcomeUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 min-w-0 border border-[#dadce0] bg-white px-3.5 py-2.5 text-xs outline-none transition "
                      />
                      <button onClick={handleSaveWelcomeUrl} disabled={!welcomeUrlInput.trim() || welcomeSaving}
                        className="shrink-0 bg-[#0E6187] px-4 py-2.5 text-xs font-semibold text-white hover:bgbg-[#e8f0fe] transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {welcomeSaving ? 'Menyimpan...' : 'Simpan URL'}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#80868b] mt-1.5">
                      Dukung tautan <b>youtube.com/watch</b>, <b>youtu.be</b>, <b>youtube.com/shorts</b>, dan <b>playlist</b>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {!welcomeLoading && (
              <div className="px-5 py-4 border-t border-[#e8eaed] flex justify-end gap-3">
                {(welcomeVideo || welcomeVideoUrl) && (
                  <button
                    onClick={handleDeleteWelcomeVideo}
                    className="border border-[#f28b82] text-[#c5221f] px-4 py-2.5 text-xs font-semibold hover:bg-[#fce8e6] transition-colors">
                    Hapus
                  </button>
                )}
                <button onClick={() => setShowWelcomeSettings(false)}
                  className="border border-[#dadce0] px-4 py-2.5 text-xs font-semibold text-[#5f6368] hover:bg-[#f8f9fa] transition-colors">
                  Tutup
                </button>
                <button onClick={handleSaveWelcomeVideo} disabled={!welcomeFile || welcomeSaving}
                  className="bg-[#0E6187] px-4 py-2.5 text-xs font-semibold text-white hover:bgbg-[#e8f0fe] transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {welcomeSaving ? 'Menyimpan...' : 'Simpan Video'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
