import { useState, useEffect, useRef, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, Plus, Edit3, Trash2, Search, X, Image as ImageIcon, FileText,
  ListChecks, Eye, EyeOff, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Camera, Clock, Repeat,
  Award, Users, UserCheck, Pencil, Loader2, ArrowLeft, Video, UploadCloud, Upload, Mic, RotateCcw,
  Settings, LayoutGrid, ShieldCheck, Link2, Building2, Layers, Settings2, FileCheck2, Radio,
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { lmsAdminApi, adminCabangApi, jadwalLevelApi, adminQuizApi, APP_URL, quizReferenceApi } from '../../services/api'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import LessonMediaFields, { LessonSlideItem } from '../../components/LessonMediaFields'
import Swal from 'sweetalert2'
import type { Pagination } from '../../types'

const cleanQuillHtml = (html: string) =>
  html
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

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

interface Batch { id: number; nama_batch: string; warna?: string | null }
interface CourseOption { id: number; title: string }
interface Category { id: number; name: string }

const COURSE_PER_PAGE = 10
const BANK_PER_PAGE = 10

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

interface AttemptRow {
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

interface DetailRow {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: (string | { text?: string; image_path?: string | null; image_url?: string | null })[]
  correct_index: number | null
  keyword: string | null
  points: number
  sort: number
  selected_index: number | null
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

type View = 'list' | 'quiz' | 'bank' | 'materi-bank' | 'quiz-questions' | 'quiz-results' | 'quiz-materi'

const inputCls = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
const primaryBtn = 'inline-flex items-center gap-2 bg-[#0E6187] hover:bg-[#0E6187]/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50'

const emptyPaketForm = {
  title: '', description: '', course_id: '', batch_id: '', level: '', category: '',
  time_limit_minutes: '30', max_attempts: '3', max_warnings: '3',
  passing_score: '0', shuffle_questions: true, quiz_template: 'basic', status: 'nonaktif', user_id: '',
  camera_enabled: true, block_exit: true,
  cover_image: '',
}
const emptyQuestionForm = { question: '', section_id: '', question_type: 'choice', rating_max: '9', correct_index: '', points: '1', keyword: '', image_path: '', image_url: '', audio_path: '', audio_url: '', audio_max_plays: '2' }

const DEFAULT_SECTIONS = ['Script and Vocabulary', 'Grammar', 'Reading', 'Listening', 'Conversation', 'Kanji', 'Vocabulary']

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
  const [refPendingCount, setRefPendingCount] = useState(0)
  const [courseLevels, setCourseLevels] = useState<string[]>([])
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
  const [quizSearch, setQuizSearch] = useState('')

  const [bankPakets, setBankPakets] = useState<QuizPaket[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const [bankPage, setBankPage] = useState(1)
  const [bankPagination, setBankPagination] = useState<Pagination>({ current_page: 1, last_page: 1, total: 0, per_page: BANK_PER_PAGE })
  const [quizSource, setQuizSource] = useState<'course' | 'bank'>('course')

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
  const [detail, setDetail] = useState<{ attempt: any; questions: DetailRow[]; siswa: any } | null>(null)
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
      confirmButtonColor: '#d33',
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
    quizReferenceApi.adminPendingCount().then(res => setRefPendingCount(res.data.pending || 0)).catch(() => {})
  }, [])
  const courseFilterFirstRef = useRef(true)
  useEffect(() => {
    if (courseFilterFirstRef.current) { courseFilterFirstRef.current = false; return }
    if (view !== 'list') return
    const t = setTimeout(() => { setCoursePage(1); fetchCourses(1) }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterLevel, filterBatch])
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
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
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
      }).then(res => {
        const list = res.data.courses || []
        setCourses(list)
        setBatches(res.data.batches || [])
        setCoursePagination(res.data.pagination || { current_page: 1, last_page: 1, total: list.length, per_page: COURSE_PER_PAGE })
        setCourseLevels(res.data.levels || [])
      }).catch(() => {}).finally(() => setLoading(false))
    } else {
      lmsAdminApi.courses({
        page: targetPage,
        per_page: COURSE_PER_PAGE,
        search: search.trim() || undefined,
        level: filterLevel || undefined,
        batch_id: filterBatch || undefined,
      }).then(res => {
        setCourses(res.data.courses || [])
        setBatches(res.data.batches || [])
        setCoursePagination(res.data.pagination || { current_page: 1, last_page: 1, total: 0, per_page: COURSE_PER_PAGE })
        if (Array.isArray(res.data.levels)) setCourseLevels(res.data.levels)
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
    }).catch(() => {})
  }

  const fetchQuizPakets = (courseId: number) => {
    setQuizLoading(true)
    adminQuizApi.pakets().then(res => {
      const all = res.data.pakets || []
      setQuizPakets(all.filter((p: QuizPaket) => p.course_id === courseId))
    }).catch(() => setQuizPakets([])).finally(() => setQuizLoading(false))
  }

  const fetchBankPakets = (page?: number) => {
    setBankLoading(true)
    adminQuizApi.pakets({ page: page ?? bankPage, per_page: BANK_PER_PAGE, search: bankSearch.trim() || undefined }).then(res => {
      const all = res.data.pakets || []
      setBankPakets(all)
      setBankPagination(res.data.pagination || { current_page: 1, last_page: 1, total: all.length, per_page: BANK_PER_PAGE })
    }).catch(() => setBankPakets([])).finally(() => setBankLoading(false))
  }

  const openBank = () => {
    setQuizSource('course')
    setBankSearch('')
    setBankPage(1)
    setActiveQuizPaket(null)
    setActiveCourse(null)
    setView('bank')
    fetchBankPakets(1)
    navigate(`${base}/bank-paket-soal`)
  }

  const openCreateBankPaket = () => {
    setEditingPaket(null)
    setPaketForm({ ...emptyPaketForm, course_id: '' })
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
      confirmButtonColor: '#dc2626',
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
    if (quiet) return
    setQuizSource(source)
    setQPage(1)
    setQSectionFilter('all')
    setView('quiz-questions')
    loadQuestionEditor(paket)
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
    navigate(`${base}/course/${cid}/monitor?paket=${paket.id}`, { state: { title: activeCourse?.title } })
  }

  const openQuizMonitorById = (cid: number) => {
    navigate(`${base}/course/${cid}/monitor`, { state: { title: activeCourse?.title } })
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
      confirmButtonColor: '#dc2626',
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
      confirmButtonColor: '#dc2626',
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
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
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
      cover_image: p.cover_image || '',
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
        max_attempts: Number(paketForm.max_attempts) || 3,
        max_warnings: Number(paketForm.max_warnings) || 3,
        passing_score: Number(paketForm.passing_score) || 0,
        shuffle_questions: paketForm.shuffle_questions, quiz_template: paketForm.quiz_template,
        camera_enabled: paketForm.camera_enabled, block_exit: paketForm.block_exit,
        status: paketForm.status,
        user_id: paketForm.user_id ? Number(paketForm.user_id) : undefined,
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
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
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
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
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
    setQForm({
      question: q.question ?? '',
      section_id: q.section_id ? String(q.section_id) : '',
      question_type: q.question_type === 'rating' ? 'rating' : q.question_type === 'essay' ? 'essay' : 'choice',
      rating_max: q.rating_max ? q.rating_max.toString() : '9',
      correct_index: q.correct_index?.toString() ?? '',
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
    let opts: string[]
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
      if (qForm.correct_index === '' || Number(qForm.correct_index) >= opts.length) {
        Swal.fire({ icon: 'warning', title: 'Pilih jawaban benar yang valid' }); return
      }
    }
    setSavingQuestion(true)
    try {
      const data = {
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
          question_type: isEssay ? 'essay' : isRating ? 'rating' : 'choice',
          rating_max: isRating ? (Number(qForm.rating_max) || 9) : null,
          options: opts,
          correct_index: isEssay ? null : isRating ? null : Number(qForm.correct_index),
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
          question_type: isEssay ? 'essay' : isRating ? 'rating' : 'choice',
          rating_max: isRating ? (Number(qForm.rating_max) || 9) : null,
          options: opts,
          correct_index: isEssay ? null : isRating ? null : Number(qForm.correct_index),
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
      if (activeCourse) fetchQuizPakets(activeCourse.id)
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
      confirmButtonColor: '#dc2626',
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
    if (type === 'audio' && !file.type.startsWith('audio/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa audio' }); return
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
      showCancelButton: true, confirmButtonColor: '#dc2626', confirmButtonText: 'Hapus', cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed && activeQuizPaket) {
        adminQuizApi.deleteQuestion(q.id).then(() => {
          setQuestions(prev => prev.filter(x => x.id !== q.id))
          setQuizSections(prev => prev.map(s => s.id === q.section_id ? { ...s, questions_count: Math.max(0, s.questions_count - 1) } : s))
          openQuizQuestions(activeQuizPaket, undefined, true)
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
      confirmButtonColor: '#dc2626',
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
    return matchSearch && matchLevel && matchBatch
  })

  const filteredQuizPakets = quizPakets.filter(p => !quizSearch || p.title.toLowerCase().includes(quizSearch.toLowerCase()))

  const uniqueLevels = courseLevels.length > 0
    ? courseLevels
    : [...new Set(courses.map(c => c.level).filter(Boolean))] as string[]
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
    <div className="bg-white border-2 border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#0E6187] text-white">
            <tr>
              <th className="w-10 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">No</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Paket Soal</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Soal</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Dikerjakan</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Peserta</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Nilai Terbaik</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Status</th>
              <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {pakets.map((p, idx) => (
              <tr key={p.id} className="hover:bg-[#0E6187]/5 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-500 border border-slate-200">{noOffset + idx + 1}</td>
                <td className="px-4 py-3 border border-slate-200">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 font-semibold truncate max-w-xs">{p.title}</p>
                      {p.category && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-[#0E6187]/[0.08] text-[#0E6187] shrink-0">{p.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[p.batch?.nama_batch, p.level && `Level ${p.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                    </p>
                    {source === 'bank' && p.course_id && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-1.5 py-0.5 bg-amber-50 text-amber-600 shrink-0">
                        <Link2 size={10} /> Terhubung ke kursus
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 border border-slate-200">{p.questions_count}</td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 border border-slate-200">{p.attempts_count}</td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 border border-slate-200">{p.participants}</td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-[#0E6187] border border-slate-200">{Number(p.best_score) || '-'}</td>
                <td className="px-4 py-3 text-center border border-slate-200">
                  <div className="flex items-center justify-center gap-1.5">
                    {!isAdminCabang && (
                      <button onClick={() => togglePaket(p)}
                        className={`relative w-10 h-[22px] border border-slate-300 transition-colors shrink-0 ${p.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        title={p.status === 'aktif' ? 'Tutup paket' : 'Buka paket'}>
                        <span className={`absolute top-[2px] w-[16px] h-[16px] bg-white shadow transition-all ${p.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                      </button>
                    )}
                    <span className={`text-[11px] font-semibold ${p.status === 'aktif' ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 border border-slate-200">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openMateri(p, source)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6187] bg-[#0E6187]/[0.08] px-2 py-1.5 hover:bg-[#0E6187]/15 transition-colors">
                      <BookOpen size={13} /> Materi
                    </button>
                    <button onClick={() => openQuizQuestions(p, source)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0E6187] px-2 py-1.5 hover:bg-[#0E6187]/90 transition-colors">
                      <ListChecks size={13} /> Soal
                    </button>
                    <button onClick={() => openQuizResults(p, source)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6187] bg-[#0E6187]/[0.08] px-2 py-1.5 hover:bg-[#0E6187]/15 transition-colors">
                      <Eye size={13} /> Hasil
                    </button>
                    {source === 'course' && (
                      <button onClick={() => openQuizMonitor(p)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1.5 hover:bg-red-100 transition-colors">
                        <Radio size={13} /> Monitoring
                      </button>
                    )}
                    {!isAdminCabang && (
                      <>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button onClick={() => openEditPaket(p)} className="p-1.5 hover:bg-slate-100 transition-colors" title="Edit">
                          <Pencil size={13} className="text-slate-600" />
                        </button>
                        <button onClick={() => deletePaket(p)} className="p-1.5 bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                          <Trash2 size={13} className="text-red-500" />
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
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500">
        <span>Menampilkan <b className="text-slate-700">{start}-{end}</b> dari <b className="text-slate-700">{pg.total}</b> {label}</span>
        <div className="flex items-center gap-1">
          <button
            disabled={pg.current_page <= 1}
            onClick={() => onPage(Math.max(1, pg.current_page - 1))}
            className="rounded border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: pg.last_page }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - pg.current_page) <= 2 || p === 1 || p === pg.last_page)
            .map((p, i, arr) => (
              <span key={p} className="inline-flex items-center">
                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-slate-300">...</span>}
                <button
                  onClick={() => onPage(p)}
                  className={`min-w-[24px] rounded px-1.5 py-0.5 text-center text-xs font-medium transition ${
                    p === pg.current_page ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            disabled={pg.current_page >= pg.last_page}
            onClick={() => onPage(Math.min(pg.last_page, pg.current_page + 1))}
            className="rounded border border-slate-300 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
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

  const renderParticipantRow = (par: Participant, idx: number) => (
    <tr key={par.siswa_id} className="bg-white hover:bg-[#0E6187]/5 transition-colors">
      <td className="px-4 py-3 text-xs font-bold text-slate-400 border border-slate-200">{idx + 1}</td>
      <td className="px-4 py-3 border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#0E6187] bg-[#0E6187]/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-[#0E6187]">{par.nama.trim().charAt(0).toUpperCase() || '?'}</span>
          </div>
          <p className="font-semibold text-slate-800 truncate">{par.nama}</p>
        </div>
      </td>
      <td className="px-4 py-3 border border-slate-200">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Building2 size={13} className="text-slate-400 shrink-0" /> {par.cabang || '-'}
        </span>
      </td>
      <td className="px-4 py-3 border border-slate-200">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Users size={13} className="text-[#0E6187] shrink-0" /> {par.batch || '-'}
        </span>
      </td>
      <td className="px-4 py-3 border border-slate-200">
        {par.level !== null && par.level !== '' ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Layers size={13} className="text-emerald-500 shrink-0" /> Level {par.level}
          </span>
        ) : '-'}
      </td>
      <td className="px-4 py-3 border border-slate-200">
        <div className="flex flex-wrap gap-1.5">
          {par.attempts.map(a => (
            <button key={a.attempt_id} onClick={() => openAttemptDetail(a.attempt_id)}
              title={`${fmtDate(a.started_at)} · ${a.warnings} peringatan`}
              className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2.5 py-1.5 hover:bg-[#0E6187]/5 hover:border-[#0E6187] transition-colors group">
              <span className="text-[11px] font-bold text-slate-500">#{a.attempt_number}</span>
              <span className={`text-xs font-semibold ${a.status === 'submitted' ? 'text-slate-700' : 'text-slate-400'}`}>
                {a.status === 'submitted' ? (Number(a.score) || 0) + ' poin' : 'Belum selesai'}
                {a.auto_submitted && <span className="ml-1 text-[9px] font-bold text-orange-500">AUTO</span>}
              </span>
              {a.webcam_photo && <Camera size={12} className="text-slate-400 shrink-0" />}
            </button>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right border border-slate-200">
        <p className="text-lg font-black text-[#0E6187]">{Number(par.best_score) || 0}</p>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">poin</p>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap border border-slate-200">
        {!isAdminCabang && (
          <button onClick={() => resetAttempts(par.siswa_id, par.nama)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-white hover:bg-red-500 border-2 border-red-200 px-2.5 py-1.5 transition-colors">
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </td>
    </tr>
  )

  // ==================== RENDER ====================
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187] text-white shadow-sm shrink-0">
              <BookOpen size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-800">Data Kursus LMS</h1>
              <p className="text-sm text-slate-500">Kelola kursus, materi pembelajaran, dan quiz kandidat</p>
            </div>
          </div>
          {view === 'list' && !isAdminCabang && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={openBank} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
                <ListChecks size={15} /> Bank Paket Soal
              </button>
              <button onClick={openMateriBank} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
                <BookOpen size={15} /> Bank Materi
              </button>
              <button onClick={openWelcomeSettings} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
                <Settings size={15} /> Pengaturan
              </button>
              <button onClick={openCreateCourseCat} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
                Kelola Kategori
              </button>
              <button onClick={() => navigate(`${base}/quiz-referensi`)} className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
                <FileCheck2 size={15} /> Referensi Quiz
                {refPendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">{refPendingCount}</span>
                )}
              </button>
              <button onClick={openCreateCourse} className={primaryBtn}>
                <Plus size={16} /> Buat Kursus
              </button>
            </div>
          )}
          {view === 'list' && isAdminCabang && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => navigate(`${base}/quiz-referensi`)} className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
                <FileCheck2 size={15} /> Referensi Quiz
                {refPendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">{refPendingCount}</span>
                )}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {view === 'quiz' && activeCourse && !isAdminCabang && (
              !activeCourse.kelas_sensei_id || courseTab === 'quiz' ? (
                <>
                  <button onClick={openCreatePaket} className={primaryBtn}>
                    <Plus size={16} /> Buat Paket
                  </button>
                  <button onClick={openBankPicker} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 text-[12px]">
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
            {view === 'bank' && !isAdminCabang && (
              <button onClick={openCreateBankPaket} className={primaryBtn}>
                <Plus size={16} /> Buat Paket Soal
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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kursus..." className={`${inputCls} pl-9`} />
              </div>
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={`${inputCls} sm:w-44`}>
                <option value="">Semua Level</option>
                {uniqueLevels.map(l => <option key={l} value={l}>Level {l}</option>)}
              </select>
              <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className={`${inputCls} sm:w-44`}>
                <option value="">Semua Batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat kursus...
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-14 text-center">
                <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                  <BookOpen size={28} className="text-[#0E6187]" />
                </div>
                <p className="text-slate-800 font-semibold">Belum ada kursus</p>
                <p className="text-slate-500 text-sm mt-1">Buat kursus untuk materi pembelajaran kandidat</p>
                {!isAdminCabang && (
                  <button onClick={openCreateCourse} className={`${primaryBtn} mt-5`}>
                    <Plus size={16} /> Buat Kursus
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-200 overflow-hidden">
                {/* ===== LIST MOBILE (card) ===== */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredCourses.map(c => (
                    <div key={c.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{c.title}</p>
                        <span className={`shrink-0 inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${c.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {c.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {c.category && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 rounded">
                            {c.category.name}
                          </span>
                        )}
                        <p className="text-xs text-slate-400">
                          {[c.batch_id && batches.find(b => b.id === c.batch_id)?.nama_batch, c.level && `Level ${c.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          <FileText size={12} /> {c.lessons_count} File
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          <UploadCloud size={12} /> {(c as any).files_count || 0} Materi
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          <ListChecks size={12} /> Urutan {c.sort}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => openCourseDetail(c)}
                          className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-white bg-[#0E6187] px-3 py-2 rounded-lg hover:bg-[#0E6187]/90 transition-colors">
                          <ListChecks size={13} /> Buka
                        </button>
                        {!isAdminCabang && (
                          <>
                            <button onClick={() => openEditCourse(c)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors" title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteCourse(c)} className="px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Hapus">
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
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-[#0E6187] text-white">
                      <tr>
                        <th className="w-10 px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">No</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Kursus</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">File</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Urutan</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Status</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Quiz</th>
                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredCourses.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-[#0E6187]/5 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-500 border border-slate-200">{(coursePagination.current_page - 1) * coursePagination.per_page + idx + 1}</td>
                          <td className="px-4 py-3 border border-slate-200">
                            <div className="min-w-0">
                              <p className="text-slate-800 font-semibold truncate max-w-xs">{c.title}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {c.category && (
                                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600">
                                    {c.category.name}
                                  </span>
                                )}
                                <p className="text-xs text-slate-400">
                                  {[c.batch_id && batches.find(b => b.id === c.batch_id)?.nama_batch, c.level && `Level ${c.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 border border-slate-200">{c.lessons_count}</td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-800 border border-slate-200">{(c as any).files_count || 0}</td>
                          <td className="px-4 py-3 text-center text-sm font-semibold text-[#0E6187] border border-slate-200">{c.sort}</td>
                          <td className="px-4 py-3 text-center border border-slate-200">
                            <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 ${c.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              {c.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center border border-slate-200">
                            <button onClick={() => openCourseDetail(c)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0E6187] px-2.5 py-1.5 hover:bg-[#0E6187]/90 transition-colors">
                              <ListChecks size={13} /> Buka
                            </button>
                          </td>
                          <td className="px-4 py-3 border border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              {!isAdminCabang && (
                                <>
                                  <button onClick={() => openEditCourse(c)} className="p-1.5 hover:bg-slate-100 transition-colors" title="Edit">
                                    <Pencil size={13} className="text-slate-600" />
                                  </button>
                                  <button onClick={() => deleteCourse(c)} className="p-1.5 bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                                    <Trash2 size={13} className="text-red-500" />
                                  </button>
                                </>
                              )}
                              {isAdminCabang && <span className="text-xs text-slate-300">—</span>}
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-5">
                <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                  <ChevronUp size={15} className="-rotate-90" /> Kembali
                </button>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0E6187] text-white flex items-center justify-center shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-800 truncate">{activeCourse.title}</h2>
                    <p className="text-sm text-slate-500">
                      {[activeCourse.batch_id && batches.find(b => b.id === activeCourse.batch_id)?.nama_batch, activeCourse.level && `Level ${activeCourse.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                      {' · '}{activeCourse.kelas_sensei_id ? `${courseLessons.length} pertemuan · ` : ''}{quizPakets.length} paket soal
                    </p>
                  </div>
                  <button onClick={() => openQuizMonitorById(activeCourse.id)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-[12px] font-bold text-white hover:bg-red-600 transition-colors shrink-0">
                    <Radio size={14} /> Monitoring
                  </button>
                </div>
                {activeCourse.kelas_sensei_id ? (
                  <div className="mt-4 border-b border-slate-200 flex gap-1">
                    <button onClick={() => setCourseTab('lessons')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${courseTab === 'lessons' ? 'border-[#0E6187] text-[#0E6187]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                      <BookOpen size={15} /> Daftar Pertemuan
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{courseLessons.length}</span>
                    </button>
                    <button onClick={() => setCourseTab('quiz')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${courseTab === 'quiz' ? 'border-[#0E6187] text-[#0E6187]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                      <ListChecks size={15} /> Quiz
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{quizPakets.length}</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pb-1">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <ListChecks size={15} className="text-[#0E6187]" /> Daftar Paket Soal
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{quizPakets.length}</span>
                    </h3>
                  </div>
                )}
              </div>
            </div>

            {/* ======= Daftar Pertemuan tab ======= */}
            {courseTab === 'lessons' && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {courseLessonsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                    <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat pertemuan...
                  </div>
                ) : courseLessons.length === 0 ? (
                  <div className="p-14 text-center">
                    <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                      <BookOpen size={28} className="text-[#0E6187]" />
                    </div>
                    <p className="text-slate-800 font-semibold">Belum ada pertemuan</p>
                    <p className="text-slate-500 text-sm mt-1">Tambahkan pertemuan & materi pembelajaran untuk kursus "{activeCourse.title}"</p>
                    {!isAdminCabang && (
                      <button onClick={openCreateCourseLesson} className={`${primaryBtn} mt-5`}>
                        <Plus size={16} /> Tambah Pertemuan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {courseLessons.map((lesson, idx) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors group">
                        {!isAdminCabang && (
                          <div className="flex flex-col items-center gap-0.5">
                            <button onClick={() => moveCourseLesson(idx, 'up')} disabled={idx === 0}
                              className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20">
                              <ChevronUp size={14} />
                            </button>
                            <span className="text-[10px] font-bold text-slate-400 w-5 text-center">{idx + 1}</span>
                            <button onClick={() => moveCourseLesson(idx, 'down')} disabled={idx === courseLessons.length - 1}
                              className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20">
                              <ChevronDown size={14} />
                            </button>
                          </div>
                        )}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${lesson.status === 'aktif' ? 'bg-[#0E6187]/10 text-[#0E6187]' : 'bg-slate-100 text-slate-300'}`}>
                          {lesson.video_url ? <Video size={16} /> : lesson.slides?.length ? <ImageIcon size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${lesson.status === 'aktif' ? 'text-slate-800' : 'text-slate-400'}`}>{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {lesson.video_url && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><Video size={10} /> Video</span>}
                            {lesson.content && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><FileText size={10} /> Materi</span>}
                            {lesson.file_name && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><FileText size={10} /> PDF</span>}
                            {!!lesson.slides?.length && <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400"><ImageIcon size={10} /> {lesson.slides.length} Slide</span>}
                            <span className={`text-[10px] font-semibold ${lesson.status === 'aktif' ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                        </div>
                        {!isAdminCabang && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditCourseLesson(lesson)} className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => deleteCourseLesson(lesson)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Hapus">
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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={quizSearch} onChange={e => setQuizSearch(e.target.value)} placeholder="Cari paket soal..." className={`${inputCls} pl-9`} />
                </div>

                {quizLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                    <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat paket soal...
                  </div>
                ) : filteredQuizPakets.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-14 text-center">
                    <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                      <ListChecks size={28} className="text-[#0E6187]" />
                    </div>
                    <p className="text-slate-800 font-semibold">Belum ada paket soal</p>
                    <p className="text-slate-500 text-sm mt-1">Buat paket soal MCQ untuk kursus "{activeCourse.title}"</p>
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-11 h-11 rounded-xl bg-[#0E6187] text-white flex items-center justify-center shrink-0">
                  <ListChecks size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">Bank Paket Soal</h2>
                  <p className="text-sm text-slate-500">Semua paket soal tersimpan di sini, termasuk yang sudah terhubung ke kursus</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Cari paket soal..." className={`${inputCls} pl-9`} />
            </div>

            {bankLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat paket soal...
              </div>
            ) : bankPakets.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-14 text-center">
                <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                  <ListChecks size={28} className="text-[#0E6187]" />
                </div>
                <p className="text-slate-800 font-semibold">Belum ada paket soal di bank</p>
                <p className="text-slate-500 text-sm mt-1">Buat paket soal untuk disimpan di bank dan hubungkan ke kursus nanti</p>
                <button onClick={openCreateBankPaket} className={`${primaryBtn} mt-5`}>
                  <Plus size={16} /> Buat Paket Soal
                </button>
              </div>
            ) : renderPaketTable(bankPakets, 'bank')}

            {renderPagination(bankPagination, p => { setBankPage(p); fetchBankPakets(p) })}
          </div>
        )}

        {/* ==================== BANK MATERI VIEW ==================== */}
        {view === 'materi-bank' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-11 h-11 rounded-xl bg-[#0E6187] text-white flex items-center justify-center shrink-0">
                  <BookOpen size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">Bank Materi</h2>
                  <p className="text-sm text-slate-500">Semua materi pembelajaran tersimpan di sini, termasuk yang sudah terhubung ke pertemuan</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={bankMateriSearch} onChange={e => setBankMateriSearch(e.target.value)} placeholder="Cari materi..." className={`${inputCls} pl-9`} />
            </div>

            {bankMateriLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat materi...
              </div>
            ) : filteredBankMateris.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-14 text-center">
                <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                  <BookOpen size={28} className="text-[#0E6187]" />
                </div>
                <p className="text-slate-800 font-semibold">Belum ada materi di bank</p>
                <p className="text-slate-500 text-sm mt-1">Buat materi untuk disimpan di bank dan hubungkan ke pertemuan nanti</p>
                <button onClick={openCreateMateri} className={`${primaryBtn} mt-5`}>
                  <Plus size={16} /> Buat Materi
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredBankMateris.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#0E6187]/10 text-[#0E6187]">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{m.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {m.course && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <BookOpen size={10} /> {m.course.title}
                            </span>
                          )}
                          {m.video_url && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <Video size={10} /> Video
                            </span>
                          )}
                          {m.content && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <FileText size={10} /> Materi
                            </span>
                          )}
                          {m.file_name && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <FileText size={10} /> PDF
                            </span>
                          )}
                          {m.slides && m.slides.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <ImageIcon size={10} /> {m.slides.length} slide
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                            <Link2 size={10} /> Terhubung ke {m.lessons_count} pertemuan
                          </span>
                          <span className={`text-[10px] font-semibold ${m.status === 'aktif' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditMateri(m)} className="p-2 text-slate-400 hover:text-[#0E6187] hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteMateri(m)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backFromMateri} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center justify-between mt-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">{materiPaket.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{materiLessons.length} materi pelajaran</p>
                </div>
              </div>
            </div>

            {materiLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat materi...
              </div>
            ) : materiLessons.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-14 text-center">
                <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                  <BookOpen size={28} className="text-[#0E6187]" />
                </div>
                <p className="text-slate-800 font-semibold">Belum ada materi</p>
                <p className="text-slate-500 text-sm mt-1">Tambahkan materi/modul & video pembelajaran untuk kursus ini</p>
                {!isAdminCabang && (
                  <button onClick={openCreateLesson} className={`${primaryBtn} mt-5`}>
                    <Plus size={16} /> Tambah Materi
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {materiLessons.map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-4">
                      {!isAdminCabang && (
                        <div className="flex flex-col">
                          <button onClick={() => moveLesson(idx, 'up')} disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveLesson(idx, 'down')} disabled={idx === materiLessons.length - 1}
                            className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20">
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white ${
                        lesson.status === 'aktif' ? 'bg-[#0E6187]' : 'bg-slate-300'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {lesson.video_url && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <Video size={10} /> Video
                            </span>
                          )}
                          {lesson.content && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <FileText size={10} /> Materi
                            </span>
                          )}
                          {lesson.file_name && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <FileText size={10} /> PDF
                            </span>
                          )}
                          {!!lesson.slides?.length && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                              <ImageIcon size={10} /> {lesson.slides.length} Slide
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold ${lesson.status === 'aktif' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>
                      {!isAdminCabang && (
                        <>
                          <button onClick={() => openEditLesson(lesson)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" title="Edit">
                            <Edit3 size={15} className="text-slate-600" />
                          </button>
                          <button onClick={() => handleDeleteLesson(lesson)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                            <Trash2 size={15} className="text-red-500" />
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backToQuiz} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center justify-between mt-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">{activeQuizPaket.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{questions.length} soal</p>
                </div>
                {!isAdminCabang && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={openSectionManager}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-[#0E6187] border border-slate-200 hover:border-[#0E6187]/40 bg-white px-3.5 py-2.5 rounded-lg transition-colors">
                      <Settings2 size={16} /> Kelola Bagian
                    </button>
                    <button onClick={openCreateQuestion} className={primaryBtn}>
                      <Plus size={16} /> Tambah Soal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {!qLoading && questions.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto px-3 py-2.5 bg-white rounded-lg shadow-sm border border-slate-200">
                <ListChecks size={15} className="text-slate-400 shrink-0" />
                <button onClick={() => setSectionFilter('all')}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${qSectionFilter === 'all' ? 'bg-[#0E6187] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  Semua
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${qSectionFilter === 'all' ? 'bg-white/25' : 'bg-white'}`}>{questions.length}</span>
                </button>
                {sectionFilterOptions.map(s => (
                  <button key={s.id} onClick={() => setSectionFilter(s.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${qSectionFilter === s.id ? 'bg-[#0E6187] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {s.name}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${qSectionFilter === s.id ? 'bg-white/25' : 'bg-white'}`}>{s.questions_count ?? 0}</span>
                  </button>
                ))}
                {questions.some(q => q.section_id == null) && (
                  <button onClick={() => setSectionFilter('none')}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${qSectionFilter === 'none' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Tanpa Bagian
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${qSectionFilter === 'none' ? 'bg-white/25' : 'bg-white'}`}>{questions.filter(q => q.section_id == null).length}</span>
                  </button>
                )}
              </div>
            )}

            {qLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat soal...
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed border-slate-300 p-14 text-center">
                <BookOpen size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-700 font-semibold">Belum ada soal</p>
                <p className="text-slate-500 text-sm mt-1">Tambahkan minimal 1 soal untuk paket ini</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed border-slate-300 p-14 text-center">
                <ListChecks size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-700 font-semibold">Tidak ada soal pada bagian ini</p>
                <p className="text-slate-500 text-sm mt-1">Pilih bagian lain atau klik "Semua" untuk menampilkan seluruh soal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questionGroups.map(g => (
                  <div key={g.section || '__none'}>
                    <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                      <span className="w-1 h-5 rounded-full bg-[#0E6187]" />
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{g.section || 'Umum'}</span>
                      <span className="text-xs text-slate-400 font-medium">{g.items.length} soal</span>
                    </div>
                    <div className="space-y-3">
                      {g.items.map((q, qi) => {
                        const gi = orderedQuestions.findIndex(x => x.id === q.id)
                        return (
                          <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                            <div className="flex items-start gap-3">
                              {!isAdminCabang && (
                                <div className="flex flex-col items-center gap-1 mt-1">
                                  <button onClick={() => moveQuestion(q, 'up')} className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20" disabled={qi === 0}>
                                    <ChevronUp size={16} />
                                  </button>
                                  <button onClick={() => moveQuestion(q, 'down')} className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20" disabled={qi === g.items.length - 1}>
                                    <ChevronDown size={16} />
                                  </button>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-bold text-slate-400 shrink-0 mt-0.5">#{gi + 1}</span>
                                  <div className="text-[15px] font-semibold text-slate-800 leading-snug flex-1 min-w-0 line-clamp-2 [&_*]:inline [&_img]:h-6 [&_img]:w-auto [&_img]:align-middle" dangerouslySetInnerHTML={{ __html: cleanQuillHtml(q.question) }} />
                                  {!isAdminCabang && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button onClick={() => openEditQuestion(q)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" title="Edit">
                                        <Pencil size={14} className="text-slate-600" />
                                      </button>
                                      <button onClick={() => deleteQuestion(q)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                                        <Trash2 size={14} className="text-red-500" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {(() => {
                                  const qMediaRaw = q.image_url || q.image_path
                                  const qMediaUrl = qMediaRaw && !qMediaRaw.startsWith('http') ? `${APP_URL}/storage/${qMediaRaw}` : qMediaRaw
                                  return qMediaUrl ? (
                                    <img src={qMediaUrl} alt="Gambar soal"
                                      className="mt-3 max-h-44 rounded-lg border border-slate-200 object-contain" />
                                  ) : null
                                })()}
                                <div className="mt-3 space-y-2">
                                  {q.question_type === 'rating' ? (
                                    <div className="flex items-center gap-2.5 text-sm px-3.5 py-2 rounded-lg bg-violet-50 text-violet-700 font-semibold">
                                      <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold shrink-0">SKALA</span>
                                      <span>Rating 1–{q.rating_max || q.options.length}</span>
                                      <span className="ml-auto text-[10px] font-bold text-violet-400 shrink-0">TANPA KUNCI</span>
                                    </div>
                                  ) : (q.options.map((opt, oi) => {
                                      const optLabel = typeof opt === 'string' ? opt : ((opt as { text?: string }).text ?? '')
                                      const optRaw = typeof opt === 'string' ? null : ((opt as { image_url?: string | null; image_path?: string | null }).image_url || (opt as { image_path?: string | null }).image_path || null)
                                      const optUrl = optRaw && !optRaw.startsWith('http') ? `${APP_URL}/storage/${optRaw}` : optRaw
                                      return (
                                        <div key={oi} className={`flex items-center gap-2.5 text-sm px-3.5 py-2 rounded-lg ${oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-slate-50 text-slate-600'}`}>
                                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${oi === q.correct_index ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                            {String.fromCharCode(65 + oi)}
                                          </span>
                                          {optUrl && <img src={optUrl} className="h-6 w-6 rounded object-cover shrink-0" alt="" />}
                                          {optLabel && <span>{optLabel}</span>}
                                          {oi === q.correct_index && <span className="ml-auto text-[10px] font-bold text-emerald-500 shrink-0">BENAR</span>}
                                        </div>
                                      )
                                    }))}
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-3">Skor: {q.points} poin</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {qTotalPages > 1 && (
                  <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-slate-200 px-4 py-3">
                    <button
                      onClick={() => setQPage(safeQPage - 1)}
                      disabled={safeQPage <= 1}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0E6187] disabled:opacity-40 disabled:hover:text-slate-600 transition-colors">
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
                          ? <span key={`e${idx}`} className="px-1 text-xs text-slate-400">…</span>
                          : <button key={p} onClick={() => setQPage(p as number)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${p === safeQPage ? 'bg-[#0E6187] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                              {p}
                            </button>)
                      })()}
                    </div>
                    <button
                      onClick={() => setQPage(safeQPage + 1)}
                      disabled={safeQPage >= qTotalPages}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0E6187] disabled:opacity-40 disabled:hover:text-slate-600 transition-colors">
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
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backToQuiz} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
                  <Award size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-800 truncate">Hasil · {activeQuizPaket.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{participants.length} peserta mengerjakan{rGroupedMode && rGrouped.length > 1 ? ` · ${rGrouped.length} grup` : ''}{rHasFilter ? ` · filter: ${rFiltered.length}` : ''}</p>
                </div>
                {participants.length > 0 && !isAdminCabang && (
                  <button onClick={() => resetAttempts()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors shrink-0">
                    <RotateCcw size={12} /> Reset Semua
                  </button>
                )}
              </div>
              {participants.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0E6187] hover:text-[#0E6187]/80 border border-[#0E6187]/30 rounded-lg px-3 py-2 hover:bg-[#0E6187]/5 transition-colors shrink-0">
                      <X size={12} /> Batal Filter
                    </button>
                  )}
                </div>
              )}
              {participants.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Grup berdasarkan</label>
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
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                        <ChevronDown size={12} /> Buka Semua
                      </button>
                      <button onClick={() => setRCollapsed(() => Object.fromEntries(rGrouped.map(g => [g.name, true])))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                        <ChevronUp size={12} /> Tutup Semua
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!rLoading && participants.length > 0 && rFiltered.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0E6187]/10 text-[#0E6187] shrink-0">
                    <Users size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-800 leading-none">{rFiltered.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Peserta</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                    <Award size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-800 leading-none">{rFiltered.length > 0 ? Math.round(rFiltered.reduce((a, b) => a + (Number(b.best_score) || 0), 0) / rFiltered.length) : 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Rata-rata</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-800 leading-none">{rGroupedMode ? rGrouped.length : new Set(rFiltered.map(rCabangOf)).size}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">{rGroupedMode ? 'Grup' : 'Cabang'}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 shrink-0">
                    <Layers size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-slate-800 leading-none">{rFiltered.reduce((a, b) => a + ((Number(b.best_score) || 0) >= 60 ? 1 : 0), 0)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mt-1">Lulus (≥60)</p>
                  </div>
                </div>
              </div>
            )}

            {rLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat hasil...
              </div>
            ) : participants.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed border-slate-300 p-14 text-center">
                <Users size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-700 font-semibold">Belum ada peserta</p>
                <p className="text-slate-500 text-sm mt-1">Hasil akan muncul setelah kandidat mengerjakan quiz</p>
              </div>
            ) : rFiltered.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-dashed border-slate-300 p-14 text-center">
                <Search size={28} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-700 font-semibold">Belum ada hasil dengan filter ini</p>
                <p className="text-slate-500 text-sm mt-1">Perubah filter atau klik "Batal Filter" untuk melihat semua peserta</p>
              </div>
            ) : (
              <>
                <div className="bg-white border-2 border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-[#0E6187] text-white">
                          <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide w-10 border border-[#0E6187]">#</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Nama Kandidat</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Cabang</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Batch</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Level</th>
                          <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Riwayat Percobaan</th>
                          <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Nilai Terbaik</th>
                          <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-wide border border-[#0E6187]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rGroupedMode ? (
                          rPageGroups.map(group => {
                            const isCollapsed = !!rCollapsed[group.name]
                            return (
                            <Fragment key={group.name}>
                              <tr className="bg-gradient-to-r from-[#0E6187]/8 to-[#0E6187]/3">
                                <td colSpan={8} className="p-0 border border-slate-200">
                                  <button onClick={() => setRCollapsed(c => ({ ...c, [group.name]: !c[group.name] }))}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#0E6187]/10 transition-colors">
                                    <span className="flex items-center gap-2.5 min-w-0">
                                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E6187] text-white shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-0'}`}>
                                        <Building2 size={15} />
                                      </span>
                                      <span className="min-w-0">
                                        <span className="text-sm font-bold text-slate-800 block truncate">{group.name}</span>
                                        <span className="text-[11px] text-slate-500">{group.total} peserta</span>
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-4 shrink-0">
                                      <span className="hidden sm:flex items-center gap-3 text-[11px]">
                                        <span className="text-slate-500">Rata-rata: <b className="text-slate-700">{group.avg}</b></span>
                                        <span className="text-slate-300">|</span>
                                        <span className="text-slate-500">Terbaik: <b className="text-[#0E6187]">{group.best}</b></span>
                                      </span>
                                      <span className="sm:hidden text-[11px] text-slate-500">
                                        <b className="text-[#0E6187]">{group.best}</b> poin
                                      </span>
                                      <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editingCourseCat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
              <button onClick={() => setShowCourseCatModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nama Kategori <span className="text-red-500">*</span></label>
                <input type="text" value={courseCatForm.name} onChange={e => setCourseCatForm({ ...courseCatForm, name: e.target.value })}
                  className={inputCls} placeholder="Contoh: Bimbingan, Psikotes, Bahasa Jepang..." />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowCourseCatModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button onClick={saveCourseCat} disabled={savingCourseCat} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0E6187] hover:bg-[#0E6187]/90 disabled:opacity-60 transition-colors">
                  {savingCourseCat ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Daftar Kategori</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {categories.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">Belum ada kategori. Buat via form di atas.</p>
                  )}
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{cat.name}</p>
                        <p className="text-[10px] text-slate-400">{cat.courses_count} kursus</p>
                      </div>
                      <button onClick={() => openEditCourseCat(cat)} className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors" title="Edit">
                        <Pencil size={13} className="text-slate-600" />
                      </button>
                      <button onClick={() => deleteCourseCat(cat)} className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                        <Trash2 size={13} className="text-red-500" />
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editingCourse ? 'Edit Kursus' : 'Tambah Kursus'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Kursus <span className="text-red-500">*</span></label>
                <input type="text" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                  className={inputCls} placeholder="Masukkan judul kursus" />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <div className="relative">
                  {uploadingImg && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0E6187] rounded-full animate-spin" /> Mengupload...
                      </div>
                    </div>
                  )}
                  <ReactQuill ref={quillRef} value={courseForm.description}
                    onChange={value => setCourseForm({ ...courseForm, description: value })}
                    modules={quillModules} formats={quillFormats} theme="snow" placeholder="Deskripsi kursus"
                    className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-slate-200" />
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
                    className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`}>
                    <option value="">{levelOptions.length === 0 ? 'Belum ada jadwal level' : courseForm.batch_id ? 'Pilih Level' : 'Semua Batch - Pilih Level'}</option>
                    {levelOptions.map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Batch</label>
                  <div className="relative">
                    <button type="button" onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      {courseForm.batch_id ? (
                        <span className="flex items-center gap-2 truncate">
                          <span className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: batches.find(b => String(b.id) === courseForm.batch_id)?.warna || '#3b82f6' }} />
                          <span className="truncate text-slate-700">{batches.find(b => String(b.id) === courseForm.batch_id)?.nama_batch || 'Semua Batch'}</span>
                        </span>
                      ) : <span className="text-slate-400">Pilih Batch...</span>}
                      <svg className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${showBatchDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showBatchDropdown && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl max-h-60 overflow-y-auto">
                        <button type="button" onClick={() => { setCourseForm(prev => ({ ...prev, batch_id: '', level: '' })); setShowBatchDropdown(false) }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${!courseForm.batch_id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                          <span className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: '#94a3b8' }} />
                          <span className="truncate">Semua Batch</span>
                        </button>
                        {batches.map(b => (
                          <button key={b.id} type="button"
                            onClick={() => { setCourseForm(prev => { const levels = batchLevels[b.id] || []; const keepLevel = prev.level && levels.includes(prev.level) ? prev.level : ''; return { ...prev, batch_id: String(b.id), level: String(b.id) === prev.batch_id ? prev.level : keepLevel } }); setShowBatchDropdown(false) }}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${String(b.id) === courseForm.batch_id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}>
                            <span className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: b.warna || '#3b82f6' }} />
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
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    <ImageIcon size={16} /> Pilih Gambar
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
                    }} />
                  </label>
                  {imagePreview && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPasswordCourse ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPasswordCourse ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">Kosongkan jika kursus terbuka tanpa password. Siswa akan diminta memasukkan password ini saat membuka kursus.</p>
              </div>
              <div>
                <label className={labelCls}>Alert Kursus (opsional)</label>
                <textarea value={courseForm.alert} onChange={e => setCourseForm({ ...courseForm, alert: e.target.value })}
                  rows={2} placeholder="Contoh: Akses kelas ini untuk menonton video pembelajaran"
                  className={`${inputCls} resize-none`} />
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => setCourseForm({ ...courseForm, alert_active: true })}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${courseForm.alert_active ? 'border-[#0E6187] bg-[#0E6187] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                    Aktif
                  </button>
                  <button type="button" onClick={() => setCourseForm({ ...courseForm, alert_active: false })}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${!courseForm.alert_active ? 'border-[#0E6187] bg-[#0E6187] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                    Nonaktif
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">Alert yang aktif akan tampil di dashboard siswa kursus terkait.</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowCourseModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={saveCourse} disabled={savingCourse} className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {savingCourse ? 'Menyimpan...' : editingCourse ? 'Simpan' : 'Buat Kursus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== QUIZ PAKET MODAL ==================== */}
      {showPaketModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editingPaket ? 'Edit Paket Soal' : 'Buat Paket Soal'}</h3>
              <button onClick={() => setShowPaketModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Paket <span className="text-red-500">*</span></label>
                <input type="text" value={paketForm.title} onChange={e => setPaketForm({ ...paketForm, title: e.target.value })}
                  className={inputCls} placeholder="Contoh: Quiz Evaluasi Mingguan" />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea value={paketForm.description} onChange={e => setPaketForm({ ...paketForm, description: e.target.value })}
                  rows={2} placeholder="Petunjuk atau materi singkat..."
                  className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Cover Paket (opsional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    {coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /> : <BookOpen size={20} className="text-slate-300" />}
                  </div>
                  <div className="space-y-2">
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0E6187] hover:bg-[#0E6187]/[0.06] px-3 py-2 rounded-lg border border-[#0E6187]/20 transition-colors disabled:opacity-50">
                      {uploadingCover ? <><Loader2 size={14} className="animate-spin" /> Mengunggah...</> : <>{coverPreview ? 'Ganti Cover' : 'Pilih Gambar'}</>}
                    </button>
                    {coverPreview && (
                      <button type="button" onClick={() => { setPaketForm({ ...paketForm, cover_image: '' }); setCoverPreview('') }}
                        className="block text-xs text-red-400 hover:text-red-500">Hapus cover</button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Level</label>
                <select value={paketForm.level} onChange={e => setPaketForm({ ...paketForm, level: e.target.value })} className={inputCls}>
                  <option value="">Semua level</option>
                  {[1,2,3,4].map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Kategori Paket</label>
                <div className="flex items-center gap-2">
                  <select value={paketForm.category} onChange={e => setPaketForm({ ...paketForm, category: e.target.value })} className={inputCls}>
                    <option value="">Pilih kategori</option>
                    {quizCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowCategoryModal(true)}
                    className="shrink-0 text-sm font-medium text-[#0E6187] px-3 py-2.5 rounded-lg border border-[#0E6187]/20 hover:bg-[#0E6187]/[0.06] transition-colors">
                    + Kelola
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Durasi (menit)</label>
                  <input type="number" min={1} max={180} value={paketForm.time_limit_minutes}
                    onChange={e => setPaketForm({ ...paketForm, time_limit_minutes: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Maks Percobaan</label>
                  <input type="number" min={1} max={10} value={paketForm.max_attempts}
                    onChange={e => setPaketForm({ ...paketForm, max_attempts: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Maks Peringatan</label>
                  <input type="number" min={1} max={10} value={paketForm.max_warnings}
                    onChange={e => setPaketForm({ ...paketForm, max_warnings: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nilai Lulus (0-100)</label>
                  <input type="number" min={0} max={100} value={paketForm.passing_score}
                    onChange={e => setPaketForm({ ...paketForm, passing_score: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Acak urutan soal</p>
                  <p className="text-xs text-slate-400">Soal tampil beda urutan tiap percobaan</p>
                </div>
                <button onClick={() => setPaketForm({ ...paketForm, shuffle_questions: !paketForm.shuffle_questions })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${paketForm.shuffle_questions ? 'bg-[#0E6187]' : 'bg-slate-300'}`}>
                  <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${paketForm.shuffle_questions ? 'left-[20px]' : 'left-[2px]'}`} />
                </button>
              </div>
              <div>
                <label className={labelCls}>Template UI Quiz</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, quiz_template: 'basic' })}
                    className={`flex flex-col items-center gap-2 border-2 rounded-xl px-3 py-4 text-center transition-all ${
                      paketForm.quiz_template !== 'jft'
                        ? 'border-[#0E6187] bg-[#0E6187]/[0.04] ring-1 ring-[#0E6187]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                      paketForm.quiz_template !== 'jft' ? 'bg-[#0E6187] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <LayoutGrid size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">Basic</span>
                      <span className="block text-xs text-slate-400 mt-0.5">Sederhana & fokus</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, quiz_template: 'jft' })}
                    className={`flex flex-col items-center gap-2 border-2 rounded-xl px-3 py-4 text-center transition-all ${
                      paketForm.quiz_template === 'jft'
                        ? 'border-[#1f2022] bg-[#1f2022] ring-1 ring-[#1f2022]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                      paketForm.quiz_template === 'jft' ? 'bg-[#5e8b5d] text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <ShieldCheck size={18} />
                    </span>
                    <span>
                      <span className={`block text-sm font-semibold ${paketForm.quiz_template === 'jft' ? 'text-white' : 'text-slate-800'}`}>JFT UI</span>
                      <span className={`block text-xs mt-0.5 ${paketForm.quiz_template === 'jft' ? 'text-white/60' : 'text-slate-400'}`}>Kamera & pengawasan</span>
                    </span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {paketForm.quiz_template === 'jft'
                    ? 'JFT UI: tampilan quiz lengkap dengan pengawasan kamera. Sistem mengambil foto berkala & memberi peringatan.'
                    : 'Basic: tampilan quiz sederhana dengan kamera pengawas & keamanan aktif — foto berkala & peringatan otomatis.'}
                </p>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Keamanan kamera</p>
                  <p className="text-xs text-slate-400">Sistem mengambil foto berkala & mendeteksi wajah selama pengerjaan</p>
                </div>
                <button onClick={() => setPaketForm({ ...paketForm, camera_enabled: !paketForm.camera_enabled })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${paketForm.camera_enabled ? 'bg-[#0E6187]' : 'bg-slate-300'}`}>
                  <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${paketForm.camera_enabled ? 'left-[20px]' : 'left-[2px]'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Kunci saat keluar / tutup aplikasi</p>
                  <p className="text-xs text-slate-400">Keluar atau menutup aplikasi saat quiz berjalan memicu peringatan</p>
                </div>
                <button onClick={() => setPaketForm({ ...paketForm, block_exit: !paketForm.block_exit })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${paketForm.block_exit ? 'bg-[#0E6187]' : 'bg-slate-300'}`}>
                  <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${paketForm.block_exit ? 'left-[20px]' : 'left-[2px]'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Buka paket sekarang</p>
                  <p className="text-xs text-slate-400">Kandidat bisa langsung melihat & mulai quiz</p>
                </div>
                <button onClick={() => setPaketForm({ ...paketForm, status: paketForm.status === 'aktif' ? 'nonaktif' : 'aktif' })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${paketForm.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${paketForm.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowPaketModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={savePaket} disabled={savingPaket} className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {savingPaket ? 'Menyimpan...' : editingPaket ? 'Simpan Perubahan' : 'Buat Paket Soal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BANK PICKER MODAL ==================== */}
      {showBankPickerModal && activeCourse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Paket Soal dari Bank</h3>
              <button onClick={() => setShowBankPickerModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">
                Centang paket soal dari bank untuk ditambahkan ke kursus <span className="font-semibold text-slate-700">"{activeCourse.title}"</span>
              </p>
              {bankPickerLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-sm gap-2">
                  <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat paket soal...
                </div>
              ) : bankPickerPakets.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                    <ListChecks size={28} className="text-[#0E6187]" />
                  </div>
                  <p className="text-slate-800 font-semibold">Bank kosong</p>
                  <p className="text-slate-500 text-sm mt-1">Belum ada paket soal di bank paket</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                  {bankPickerPakets.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={bankPickedIds.includes(p.id)}
                        onChange={() => toggleBankPick(p.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#0E6187] focus:ring-[#0E6187]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                          {p.category && (
                            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E6187]/[0.08] text-[#0E6187] shrink-0">{p.category}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[p.batch?.nama_batch, p.level && `Level ${p.level}`].filter(Boolean).join(' · ') || 'Semua kandidat'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                        <span>{p.questions_count} soal</span>
                        <span className={`font-semibold ${p.status === 'aktif' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowBankPickerModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={assignSelectedPakets} disabled={assigningPakets || bankPickedIds.length === 0}
                className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {assigningPakets ? 'Menambahkan...' : `Tambahkan ${bankPickedIds.length > 0 ? `(${bankPickedIds.length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== LESSON (MATERI) MODAL ==================== */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[6vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{editingLesson ? 'Edit Materi' : (lessonSource === 'course' ? 'Tambah Pertemuan' : 'Tambah Materi')}</h3>
                <p className="text-xs text-slate-400">{activeCourse?.title}</p>
              </div>
              <button onClick={() => setShowLessonModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Materi <span className="text-red-500">*</span></label>
                <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Judul pelajaran" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>URL Video (YouTube)</label>
                <div className="flex gap-2">
                  <input value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                    placeholder="https://youtube.com/..." className={inputCls} />
                  {lessonForm.video_url && (
                    <button onClick={() => setLessonForm({ ...lessonForm, video_url: '' })} className="shrink-0 px-3 flex items-center text-slate-400 hover:text-red-500 transition-colors" title="Hapus video">
                      <X size={18} />
                    </button>
                  )}
                </div>
                {lessonForm.video_url && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1"><Video size={12} /> Pratinjau video</p>
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-black aspect-video">
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
                  className="[&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-slate-200" />
              </div>
              <div className="border-t border-slate-100 pt-4">
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
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowLessonModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={handleSaveLesson} disabled={savingLesson} className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {savingLesson ? 'Menyimpan...' : editingLesson ? 'Simpan Perubahan' : (lessonSource === 'course' ? 'Tambah Pertemuan' : 'Tambah Materi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== BANK MATERI MODAL ==================== */}
      {showMateriModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[6vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{editingMateri ? 'Edit Materi Bank' : 'Buat Materi'}</h3>
                <p className="text-xs text-slate-400">Disimpan di Bank Materi</p>
              </div>
              <button onClick={() => setShowMateriModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Judul Materi <span className="text-red-500">*</span></label>
                <input value={materiForm.title} onChange={e => setMateriForm({ ...materiForm, title: e.target.value })}
                  placeholder="Judul materi" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tautan ke Kursus <span className="text-slate-400 font-normal">(opsional)</span></label>
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
                    <button onClick={() => setMateriForm({ ...materiForm, video_url: '' })} className="shrink-0 px-3 flex items-center text-slate-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  )}
                </div>
                {materiForm.video_url && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1"><Video size={12} /> Pratinjau video</p>
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-black aspect-video">
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
                  className="[&_.ql-editor]:min-h-[160px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-slate-200" />
              </div>
              <div className="border-t border-slate-100 pt-4">
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
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowMateriModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={handleSaveMateri} disabled={savingMateri} className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {savingMateri ? 'Menyimpan...' : editingMateri ? 'Simpan Perubahan' : 'Buat Materi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== QUESTION MODAL ==================== */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{editingQuestion ? 'Edit Soal' : 'Tambah Soal'}</h3>
                <p className="text-xs text-slate-400">{activeQuizPaket?.title}</p>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Pertanyaan <span className="text-slate-400 font-normal">(opsional)</span></label>
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <ReactQuill ref={questionQuillRef} value={qForm.question}
                    onChange={v => setQForm({ ...qForm, question: v })}
                    modules={questionQuillModules} formats={quillFormats} theme="snow"
                    placeholder="Tulis pertanyaan..." />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">Bagian / Materi Soal <span className="text-slate-400 font-normal">(opsional)</span></label>
                  <button onClick={openSectionManager}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E6187] hover:text-[#0A4A66] transition-colors">
                    <Settings2 size={12} /> Kelola bagian
                  </button>
                </div>
                <select value={qForm.section_id} onChange={e => setQForm({ ...qForm, section_id: e.target.value })}
                  className={inputCls}>
                  <option value="">Tanpa bagian</option>
                  {quizSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Contoh: Vocabulary, Grammar, Reading, Listening, Conversation</p>
              </div>
              <div>
                <label className={labelCls}>Media Soal <span className="text-slate-400 font-normal">(opsional)</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`border border-slate-200 rounded-lg p-3 ${qForm.image_path ? 'bg-slate-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Gambar Soal</span>
                    </div>
                    {qForm.image_url ? (
                      <div className="relative">
                        <img src={qForm.image_url} alt="Pra-preview"
                          className="w-full h-28 object-contain bg-white border border-slate-200 rounded-md" />
                        <button onClick={() => setQForm({ ...qForm, image_path: '', image_url: '' })}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600" title="Hapus gambar">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 h-28 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-blue-50 hover:border-[#0E6187] transition-colors ${uploadingQMedia === 'image' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingQMedia === 'image' ? <Loader2 size={18} className="animate-spin text-[#0E6187]" /> : <UploadCloud size={18} className="text-slate-400" />}
                        <span className="text-[11px] font-medium text-slate-500">{uploadingQMedia === 'image' ? 'Mengunggah...' : 'Pilih gambar'}</span>
                        <input type="file" accept="image/*" className="hidden" disabled={!!uploadingQMedia}
                          onChange={e => { uploadQuestionMedia(e.target.files?.[0], 'image'); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                  <div className={`border border-slate-200 rounded-lg p-3 ${qForm.audio_path ? 'bg-slate-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Mic size={14} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Suara Soal</span>
                    </div>
                    {qForm.audio_url ? (
                      <div className="space-y-2">
                        <audio src={qForm.audio_url} controls className="w-full h-9" />
                        <label className="text-[11px] font-medium text-slate-600 block mb-1 flex items-center gap-1">
                          <Repeat size={11} /> Maksimal putar <span className="text-slate-400 font-normal">(kali mendengarkan)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input type="number" min={1} max={99} value={qForm.audio_max_plays}
                            onChange={e => setQForm({ ...qForm, audio_max_plays: e.target.value })}
                            className={`${inputCls} w-24`} />
                          <button onClick={() => { setQForm({ ...qForm, audio_path: '', audio_url: '', audio_max_plays: '2' }) }}
                            className="text-[11px] font-semibold text-red-500 hover:text-red-600 inline-flex items-center gap-1">
                            <Trash2 size={11} /> Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center gap-1 h-28 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-blue-50 hover:border-[#0E6187] transition-colors ${uploadingQMedia === 'audio' ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploadingQMedia === 'audio' ? <Loader2 size={18} className="animate-spin text-[#0E6187]" /> : <UploadCloud size={18} className="text-slate-400" />}
                        <span className="text-[11px] font-medium text-slate-500">{uploadingQMedia === 'audio' ? 'Mengunggah...' : 'Pilih audio (MP3/WAV)'}</span>
                        <input type="file" accept="audio/*" className="hidden" disabled={!!uploadingQMedia}
                          onChange={e => { uploadQuestionMedia(e.target.files?.[0], 'audio'); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Tipe Jawaban</label>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'choice' })}
                    className={`flex items-center gap-2.5 border rounded-lg px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'choice' ? 'border-[#0E6187] bg-[#0E6187]/5 ring-1 ring-[#0E6187]/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${qForm.question_type === 'choice' ? 'bg-[#0E6187] text-white' : 'bg-slate-100 text-slate-500'}`}>A/B/C</span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">Pilihan Ganda</span>
                      <span className="block text-xs text-slate-400 mt-0.5">Opsi A, B, C dengan kunci jawaban</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'rating' })}
                    className={`flex items-center gap-2.5 border rounded-lg px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'rating' ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${qForm.question_type === 'rating' ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'}`}>1-9</span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">Skala Rating</span>
                      <span className="block text-xs text-slate-400 mt-0.5">Penilaian bebas 1-{qForm.rating_max} (tanpa kunci)</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setQForm({ ...qForm, question_type: 'essay' })}
                    className={`flex items-center gap-2.5 border rounded-lg px-3.5 py-3 text-left transition-colors ${qForm.question_type === 'essay' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/20' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <span className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold shrink-0 ${qForm.question_type === 'essay' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>TEXT</span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-700">Esai / Uraian</span>
                      <span className="block text-xs text-slate-400 mt-0.5">Jawaban teks, nilai via kunci</span>
                    </span>
                  </button>
                </div>
              </div>
              {qForm.question_type === 'rating' ? (
                <div>
                  <label className={labelCls}>Skala Penilaian <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <input type="number" min={2} max={10} value={qForm.rating_max}
                      onChange={e => setQForm({ ...qForm, rating_max: e.target.value })}
                      className={`${inputCls} max-w-[110px]`} />
                    <div className="flex gap-1.5 flex-wrap">
                      {Array.from({ length: Math.min(10, Math.max(2, Number(qForm.rating_max) || 9)) }, (_, i) => (
                        <span key={i} className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-50 border border-violet-200 text-sm font-bold text-violet-600">
                          {i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Kandidat memilih nilai 1 sampai {Math.min(10, Math.max(2, Number(qForm.rating_max) || 9))}. Jawaban bersifat penilaian bebas (tidak ada benar/salah), poin penuh diberikan jika diisi.</p>
                </div>
              ) : qForm.question_type === 'essay' ? (
                <div>
                  <label className={labelCls}>Kunci Jawaban <span className="text-slate-400 font-normal">(opsional)</span></label>
                  <textarea value={qForm.keyword} onChange={e => setQForm({ ...qForm, keyword: e.target.value })}
                    placeholder="Contoh: karena, transportasi umum, 1847"
                    rows={2}
                    className={`${inputCls} resize-none`} />
                  <p className="text-xs text-slate-400 mt-1">Jika diisi, jawaban siswa yang mengandung kata kunci otomatis diberi poin penuh saat submit. Jika dikosongkan, jawaban menunggu penilaian manual.</p>
                </div>
              ) : (
                <div>
                  <label className={labelCls}>Opsi Jawaban <span className="text-red-500">* (min 2)</span></label>
                  <div className="space-y-2">
                    {qOptions.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button onClick={() => setQForm({ ...qForm, correct_index: String(oi) })}
                          title="Tandai sebagai jawaban benar"
                          className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-full border-2 transition-colors ${qForm.correct_index === String(oi) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 hover:border-[#0E6187]'}`}>
                          {String.fromCharCode(65 + oi)}
                        </button>
                        <input value={opt.text} onChange={e => { const arr = [...qOptions]; arr[oi] = { ...arr[oi], text: e.target.value }; setQOptions(arr) }}
                          placeholder={opt.image_path ? `Opsi ${String.fromCharCode(65 + oi)} (gambar)` : `Opsi ${String.fromCharCode(65 + oi)}`} className={`${inputCls} flex-1`} />
                        <div className="relative shrink-0 h-9 w-9">
                          <label title="Unggah gambar jawaban"
                            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${opt.image_path ? 'border-transparent' : 'border-slate-200 bg-slate-50 hover:border-[#0E6187] hover:text-[#0E6187] text-slate-400'} ${uploadingOptImg === oi ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingOptImg === oi
                              ? <Loader2 size={14} className="animate-spin text-[#0E6187]" />
                              : opt.image_path
                                ? <img src={opt.image_url || ''} className="w-9 h-9 rounded-lg object-cover" alt={`Opsi ${String.fromCharCode(65 + oi)}`} />
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
                    <button onClick={() => setQOptions([...qOptions, { text: '', image_path: null, image_url: null }])} className="mt-2 flex items-center gap-1 text-sm font-medium text-[#0E6187]">
                      <Plus size={12} /> Tambah opsi
                    </button>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Klik huruf <span className="font-bold text-emerald-500">A/B/C...</span> untuk menandai kunci jawaban. Klik ikon <span className="font-bold text-[#0E6187]">gambar</span> di kanan opsi untuk menjadikan opsi berupa gambar.</p>
                </div>
              )}
              <div>
                <label className={labelCls}>Bobot Skor</label>
                <input type="number" min={1} value={qForm.points} onChange={e => setQForm({ ...qForm, points: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowQuestionModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={saveQuestion} disabled={savingQuestion} className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {savingQuestion ? 'Menyimpan...' : editingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION LIST MODAL ==================== */}
      {showSectionListModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSectionListModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Kelola Bagian / Materi Soal</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeQuizPaket?.title}</p>
              </div>
              <button onClick={() => setShowSectionListModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500">{quizSections.length} bagian</p>
                <button onClick={openAddSection}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0E6187] text-white rounded-lg text-xs font-semibold hover:bg-[#0E6187]/90 transition-colors">
                  <Plus size={13} /> Tambah Bagian
                </button>
              </div>
              {quizSections.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">Belum ada bagian. Klik "Tambah Bagian" untuk membuatnya.</p>
              ) : (
                <div className="space-y-2">
                  {quizSections.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 border border-slate-200 rounded-lg px-3.5 py-2.5 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                        <p className="text-[11px] text-slate-400">{s.questions_count ?? 0} soal</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEditSection(s)} className="p-1.5 text-slate-400 hover:text-[#0E6187] hover:bg-[#0E6187]/10 rounded-lg transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteSection(s)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
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
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSectionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editingQSection ? 'Edit Bagian' : 'Tambah Bagian'}</h3>
              <button onClick={() => setShowSectionModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Bagian</label>
              <input
                value={qSectionName}
                onChange={e => setQSectionName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveSection() }}
                placeholder="Contoh: Vocabulary, Grammar, Listening..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus />
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button onClick={() => setShowSectionModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button onClick={saveSection} disabled={savingSection} className="px-4 py-2 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {savingSection ? 'Menyimpan...' : editingQSection ? 'Simpan Perubahan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CATEGORY MODAL ==================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Kelola Kategori Paket</h2>
                <p className="text-sm text-slate-400">Tambahkan atau hapus kategori quiz</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
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
                  <p className="text-sm text-slate-400 text-center py-6">Belum ada kategori</p>
                ) : quizCategories.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                    <span className="text-sm font-medium text-slate-700">{c.name}</span>
                    <button onClick={() => deleteCategory(c)} className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Detail Pengerjaan</h3>
                <p className="text-xs text-slate-400">{detail?.siswa?.nama || 'Kandidat'} · Percobaan #{detail?.attempt?.attempt_number}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {detailLoading || !detail ? (
                <div className="text-center text-sm text-slate-400 py-12">Memuat detail...</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Skor</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{detail.attempt.correct_count}/{detail.attempt.total_count}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Benar</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{detail.attempt.warnings}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Peringatan</p>
                    </div>
                  </div>
                  {detail.attempt.webcam_photo && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5"><Camera size={12} /> Foto Pengerjaan</p>
                      <img src={detail.attempt.webcam_photo} alt="Webcam" className="w-full rounded-lg border border-slate-200 max-h-52 object-cover" />
                    </div>
                  )}
                  <div className="space-y-3">
                    {detail.questions.map((q, i) => (
                      <div key={q.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-slate-800 leading-snug shrink-0">{i + 1}.</p>
                          <div className="text-sm font-bold text-slate-800 leading-snug min-w-0 flex-1 [&_img]:max-h-40 [&_img]:rounded [&_img]:my-1" dangerouslySetInnerHTML={{ __html: cleanQuillHtml(q.question) }} />
                          <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'bg-amber-50 text-amber-600' : q.is_correct === true ? 'bg-emerald-50 text-emerald-600' : q.is_correct === false ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-500'}`}>
                            {q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'BELUM DINILAI' : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'}
                          </span>
                        </div>
                        {(q as any).image_url && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                            <img src={(q as any).image_url} alt="Soal" className="max-h-40 mx-auto object-contain rounded" />
                          </div>
                        )}
                        {(q as any).audio_url && (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
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
                                    <span key={oi} className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold border-2 ${isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                      {optLabel}
                                    </span>
                                  )
                                })}
                              </div>
                              <p className="text-xs text-slate-500 mt-1.5">
                                Jawaban: <span className="font-bold text-violet-600">{q.selected_index !== null && q.selected_index !== undefined ? (typeof q.options[q.selected_index] === 'string' ? q.options[q.selected_index] : ((q.options[q.selected_index] as { text?: string }).text ?? '')) : 'Tidak diisi'}</span>
                                {q.is_correct === true && <span className="ml-2 text-[9.5px] font-bold text-violet-500">TERISI · POIN DIBERIKAN</span>}
                              </p>
                            </div>
                          ) : q.question_type === 'essay' ? (
                            <div>
                              <p className="text-[11px] font-bold text-slate-600 mb-1.5">Jawaban Siswa</p>
                              <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 whitespace-pre-wrap min-h-[44px]">
                                {q.answer_text?.trim() ? q.answer_text : <span className="text-slate-400">Tidak diisi</span>}
                              </p>
                              {q.keyword && (
                                <p className="text-[10px] text-amber-600 font-semibold mt-1.5"><span className="font-bold">Kata kunci:</span> {q.keyword}</p>
                              )}
                              {q.answer_text?.trim() && (
                                <div className="flex items-center gap-2 mt-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">Nilai (0-{q.points})</label>
                                    <input type="number" min={0} max={q.points}
                                      value={grades[q.id] ?? ''}
                                      onChange={e => setGrades(g => ({ ...g, [q.id]: e.target.value }))}
                                      className="w-24 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187]"
                                      placeholder="-" />
                                  </div>
                                  <button type="button" disabled={savingGrade !== null || !grades[q.id]?.trim()}
                                    onClick={() => saveGrade(q.id)}
                                    className="self-end text-[11px] font-bold text-white bg-[#0E6187] px-3.5 py-2 rounded-lg disabled:opacity-40 hover:bg-[#0E6187]/90">
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
                            const optLabel = typeof opt === 'string' ? opt : ((opt as { text?: string }).text ?? '')
                            const optRaw = typeof opt === 'string' ? null : ((opt as { image_url?: string | null; image_path?: string | null }).image_url || (opt as { image_path?: string | null }).image_path || null)
                            const optUrl = optRaw && !optRaw.startsWith('http') ? `${APP_URL}/storage/${optRaw}` : optRaw
                            return (
                              <div key={oi}
                                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium ${isCorrect ? 'bg-emerald-50 text-emerald-700 font-bold' : isSelected ? 'bg-red-50 text-red-500 font-bold' : 'bg-slate-50 text-slate-600'}`}>
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                {optUrl && <img src={optUrl} className="h-5 w-5 rounded object-cover shrink-0" alt="" />}
                                <span className="flex-1">{optLabel}</span>
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

      {/* ==================== WELCOME VIDEO SETTINGS MODAL ==================== */}
      {showWelcomeSettings && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowWelcomeSettings(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0E6187]/10 flex items-center justify-center">
                  <Settings size={18} className="text-[#0E6187]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Pengaturan LMS</h2>
                  <p className="text-[10px] text-gray-400 font-medium">Video Selamat Datang untuk halaman siswa</p>
                </div>
              </div>
              <button onClick={() => setShowWelcomeSettings(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {welcomeLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#0E6187] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Video ini akan pertunjukan di atas daftar kursus pada halaman <b className="text-gray-700">Kelas Mendunia</b> siswa.
                    Mengunggah file video <b className="text-gray-700">mp4 / webm</b> ucapan untuk siswa atau memakai <b className="text-gray-700">URL YouTube</b>.
                  </p>

                  {welcomeVideoUrl && (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
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
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <video src={`${APP_URL}/storage/${welcomeVideo}`} controls
                        className="w-full aspect-video bg-black" />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">File Video Selamat Datang</label>
                    {welcomeFile ? (
                      <div className="flex items-center gap-3 p-3 bg-[#0E6187]/5 border-2 border-[#0E6187]/20 rounded-xl">
                        <Video size={18} className="text-[#0E6187] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{welcomeFile.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{(welcomeFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                        <button onClick={() => setWelcomeFile(null)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-[#0E6187]/30 hover:bg-gray-50 cursor-pointer transition-all">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Upload size={18} className="text-gray-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-bold text-gray-500">Klik untuk diseleksi video</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">mp4, webm, mov · max 200 MB</p>
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
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-[10px] font-semibold text-gray-400 uppercase">atau</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Video YouTube</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={welcomeUrlInput}
                        onChange={e => setWelcomeUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 min-w-0 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs outline-none transition focus:border-[#0E6187] focus:ring-1 focus:ring-[#0E6187]/30"
                      />
                      <button onClick={handleSaveWelcomeUrl} disabled={!welcomeUrlInput.trim() || welcomeSaving}
                        className="shrink-0 rounded-xl bg-[#0E6187] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0E6187]/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {welcomeSaving ? 'Menyimpan...' : 'Simpan URL'}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Dukung tautan <b>youtube.com/watch</b>, <b>youtu.be</b>, <b>youtube.com/shorts</b>, dan <b>playlist</b>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {!welcomeLoading && (
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
                {(welcomeVideo || welcomeVideoUrl) && (
                  <button
                    onClick={handleDeleteWelcomeVideo}
                    className="rounded-lg border border-red-200 text-red-600 px-4 py-2.5 text-xs font-semibold hover:bg-red-50 transition-colors">
                    Hapus
                  </button>
                )}
                <button onClick={() => setShowWelcomeSettings(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Tutup
                </button>
                <button onClick={handleSaveWelcomeVideo} disabled={!welcomeFile || welcomeSaving}
                  className="rounded-lg bg-[#0E6187] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0E6187]/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
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
