import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen, Play, Check, CheckCircle, ChevronLeft, ChevronRight,
  FileText, Video, ArrowLeft, Clock, ListChecks, Lock, FileQuestion,
  ClipboardList, Upload, Download, Send, GraduationCap, Star, Award, AlertTriangle, X, XCircle, Trash2,
  CalendarCheck, LayoutDashboard, Wallet, User, Trophy, Search,
} from 'lucide-react'
import { lmsApi, quizApi, APP_URL } from '../../services/api'
import { DEFAULT_COURSE_COVER } from '../../utils/courseCover'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import LessonSlidesViewer from '../../components/LessonSlidesViewer'
import TrackedVideo from '../../components/TrackedVideo'
import { fmtFileSize } from '../../components/LessonMediaFields'
import Swal from 'sweetalert2'
import { useAuth } from '../../contexts/AuthContext'

interface Course {
  id: number
  title: string
  description: string
  image: string | null
  level: string | null
  category: { id: number; name: string } | null
  batch: { id: number; nama_batch: string } | null
  kelas_sensei_id: number | null
  lessons_count: number
  sort: number
  status: string
}

const isCourseOpen = (course: { status?: string }) => (course.status ?? 'aktif') === 'aktif'

interface Lesson {
  id: number
  course_id: number
  title: string
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  sort: number
}

interface AssignmentSubmission {
  id: number
  file_path: string | null
  file_name: string | null
  notes: string | null
  score: number | null
  feedback: string | null
  submitted_at: string | null
  graded_at: string | null
}

interface AssignmentItem {
  id: number
  course_id: number
  lesson_id?: number | null
  title: string
  description: string | null
  file_path: string | null
  file_name: string | null
  due_date: string | null
  max_score: number | null
  paket?: {
    id: number
    title: string
    questions_count?: number
    time_limit_minutes?: number
    max_attempts?: number
  } | null
  pakets?: {
    id: number
    title: string
    questions_count?: number
    time_limit_minutes?: number
    max_attempts?: number
  }[] | null
  submission: AssignmentSubmission | null
}

type ViewType = 'courses' | 'course-detail' | 'lesson' | 'quiz-detail'

interface LessonMateri {
  id: number
  title: string
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  file_url?: string | null
  status: string
  slides?: { id: number; file_name: string; file_path: string; url: string }[]
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

interface CourseQuiz {
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
  attempts_used: number
  best_score: number | null
  can_start: boolean
  is_unlocked: boolean
  is_link_locked?: boolean
  locked?: boolean
}

interface ReviewOption {
  text: string
  image_path?: string | null
  image_url?: string | null
}

interface ReviewQuestion {
  id: number
  question: string
  section?: string | null
  question_type: string
  rating_max: number | null
  options: ReviewOption[]
  correct_index: number | null
  keyword?: string | null
  points: number
  image_url?: string | null
  selected_index?: number | null
  answer_text?: string | null
  earned_points?: number | null
  is_correct?: boolean | null
}

interface ReviewAttemptInfo {
  score: number | null
  attempt_number: number
  passing_score: number
}

interface ReviewData {
  attempt: ReviewAttemptInfo
  paket: { id: number; title: string }
  questions: ReviewQuestion[]
}

interface LeaderboardEntry {
  rank: number
  siswa_id: number
  nama: string
  batch: string | null
  cabang: string | null
  level: number | null
  best_score: number
}

interface QuizLeaderboard {
  paket_id: number
  title: string
  course: string | null
  level: string | null
  max_score: number | null
  entries: LeaderboardEntry[]
  my_score: number | null
  my_rank: number | null
}

function rankStylesLms(rank: number) {
  if (rank === 1) return 'bg-amber-400 text-white'
  if (rank === 2) return 'bg-slate-300 text-slate-700'
  if (rank === 3) return 'bg-orange-300 text-white'
  return 'bg-slate-100 text-slate-500'
}

const cleanQuillHtml = (html: string) =>
  html
    .replace(/&nbsp;/g, ' ')
    .replace(/<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

// ==================== QUIZ REVIEW (Pembahasan Hasil) ====================
function SummaryTile({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className={`rounded-md px-2 py-2.5 text-center ${accent ? 'bg-[#0E6187]/10' : 'bg-slate-50'}`}>
      <p className={`text-base font-black tabular-nums ${accent ? 'text-[#0E6187]' : 'text-slate-700'}`}>{value}</p>
      <p className="text-[9.5px] font-bold text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function ReviewLine({ label, value, tone }: { label: string; value: string; tone: 'good' | 'bad' | 'muted' }) {
  const cls = tone === 'good'
    ? 'border-emerald-100 bg-emerald-50/50 text-emerald-700'
    : tone === 'bad'
      ? 'border-red-100 bg-red-50/50 text-red-600'
      : 'border-slate-100 bg-slate-50 text-slate-500'
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${cls}`}>
      <p className="text-[9.5px] font-black uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-[12px] font-medium mt-1 break-words whitespace-pre-wrap">{value}</p>
    </div>
  )
}

function ReviewQuestionCard({ q, index }: { q: ReviewQuestion; index: number }) {
  const isRating = q.question_type === 'rating'
  const isEssay = q.question_type === 'essay'
  const answered = isEssay
    ? Boolean(q.answer_text && String(q.answer_text).trim() !== '')
    : q.selected_index !== undefined && q.selected_index !== null
  const correct = q.is_correct === true
  const wrong = q.is_correct === false
  const status = !answered ? 'empty' : correct ? 'correct' : wrong ? 'wrong' : 'empty'

  const statusCfg = {
    correct: { label: 'Benar', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    wrong: { label: 'Salah', cls: 'bg-red-50 text-red-500 border-red-100' },
    empty: { label: 'Kosong', cls: 'bg-slate-100 text-slate-400 border-slate-100' },
  }[status]

  const headerCls = status === 'correct'
    ? 'border-emerald-50 bg-emerald-50/50'
    : status === 'wrong'
      ? 'border-red-50 bg-red-50/50'
      : 'bg-slate-50/60'

  const letter = (i: number) => String.fromCharCode(65 + i)

  return (
    <div className={`rounded-lg border ${status === 'correct' ? 'border-emerald-100' : status === 'wrong' ? 'border-red-100' : 'border-slate-100'} bg-white overflow-hidden`}>
      <div className={`px-3.5 py-2.5 flex items-center gap-2.5 border-b ${headerCls}`}>
        <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-[11px] font-black text-slate-700 flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusCfg.cls}`}>
          {status === 'correct' ? <Check size={12} /> : status === 'wrong' ? <XCircle size={12} /> : <AlertTriangle size={12} />} {statusCfg.label}
        </span>
        <span className="ml-auto text-[10px] font-bold text-slate-300">{q.points} poin</span>
      </div>

      <div className="p-3.5">
        <div
          className="text-[13px] font-medium text-slate-800 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1"
          dangerouslySetInnerHTML={{ __html: q.question }} />

        {isEssay ? (
          <div className="mt-3 space-y-2">
            <ReviewLine label="Jawaban Anda" value={q.answer_text || 'Tidak dijawab'} tone={answered ? (correct ? 'good' : 'bad') : 'muted'} />
            {q.keyword && <ReviewLine label="Kunci Jawaban" value={q.keyword} tone="good" />}
            <p className="text-[11px] font-bold text-slate-500">
              Poin: <span className="text-slate-800">{q.earned_points ?? 0} / {q.points}</span>
            </p>
          </div>
        ) : isRating ? (
          <div className="mt-3 space-y-2">
            <ReviewLine
              label="Jawaban Anda"
              value={q.selected_index != null ? `Rating ${q.selected_index}${q.rating_max ? ' / ' + q.rating_max : ''}` : 'Tidak dijawab'}
              tone={answered ? 'good' : 'muted'} />
            <p className="text-[11px] font-semibold text-slate-500">Soal penilaian skala — nilai ditentukan instruktur.</p>
          </div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {q.options.map((opt, oi) => {
              const isCorrectOpt = q.correct_index != null && oi === q.correct_index
              const isSelected = oi === q.selected_index
              const isWrongPick = isSelected && !isCorrectOpt
              const cls = isCorrectOpt
                ? 'border-emerald-300 bg-emerald-50'
                : isWrongPick
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-200 bg-white'
              return (
                <div key={oi} className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium text-slate-700 ${cls}`}>
                  <span className="w-5 h-5 rounded bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">
                    {letter(oi)}
                  </span>
                  <span className="flex-1 min-w-0 flex items-center gap-2">
                    {opt.text && <span>{opt.text}</span>}
                    {opt.image_url && <img src={opt.image_url} alt="" className="h-12 rounded object-contain bg-white" />}
                  </span>
                  {isCorrectOpt && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 px-1.5 py-0.5 rounded bg-emerald-100/70 shrink-0">
                      <Check size={10} /> Kunci Jawaban
                    </span>
                  )}
                  {isWrongPick && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 px-1.5 py-0.5 rounded bg-red-100/70 shrink-0">
                      <XCircle size={10} /> Jawaban Anda
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewModal({ open, loading, error, data, attempts, selectedAttempt, onSelectAttempt, onClose }: {
  open: boolean
  loading: boolean
  error: string | null
  data: ReviewData | null
  attempts: { attempt_id: number; attempt_number: number; score: number | null }[]
  selectedAttempt: number | null
  onSelectAttempt: (id: number) => void
  onClose: () => void
}) {
  if (!open) return null

  const correctCount = data ? data.questions.filter(q => q.is_correct === true).length : 0
  const wrongCount = data ? data.questions.filter(q => q.is_correct === false).length : 0
  const skipCount = data ? data.questions.length - correctCount - wrongCount : 0
  const attemptLabel = data?.attempt?.attempt_number ? `Percobaan #${data.attempt.attempt_number}` : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-[#0E6187]/10 flex items-center justify-center shrink-0">
              <FileQuestion size={17} className="text-[#0E6187]" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-800">Pembahasan Quiz</h2>
              <p className="text-[11px] text-slate-400 font-medium">{data?.paket.title || 'Quiz'}{attemptLabel ? ` · ${attemptLabel}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#0E6187]/20 border-t-[#0E6187] rounded-full animate-spin" />
              <p className="text-[11px] font-semibold text-slate-400">Memuat pembahasan...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
            <AlertTriangle size={28} className="text-amber-500" />
            <p className="mt-3 text-sm font-bold text-slate-700">Tidak dapat membuka pembahasan</p>
            <p className="mt-1 text-[11px] text-slate-400">{error}</p>
            <button onClick={onClose}
              className="mt-5 px-5 py-2 rounded-lg bg-[#0E6187] text-white text-xs font-bold hover:bg-[#0a4d6b] transition-colors">
              Tutup
            </button>
          </div>
        ) : data ? (
          <>
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
              <div className="flex flex-wrap gap-2 mb-2">
                {attempts.map(a => (
                  <button key={a.attempt_id} type="button"
                    onClick={() => onSelectAttempt(a.attempt_id)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                      selectedAttempt === a.attempt_id
                        ? 'bg-[#0E6187] text-white border-[#0E6187]'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}>
                    Percobaan #{a.attempt_number} · {a.score ?? 0}%
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <SummaryTile value={`${data.attempt.score ?? 0}`} label="Nilai" accent />
                <SummaryTile value={`${correctCount}`} label="Benar" />
                <SummaryTile value={`${wrongCount}`} label="Salah" />
                <SummaryTile value={`${skipCount}`} label="Kosong" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {data.questions.map((q, i) => <ReviewQuestionCard key={q.id} q={q} index={i} />)}
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-slate-100">
              <button onClick={onClose}
                className="w-full py-2.5 rounded-lg bg-[#0E6187] text-white text-xs font-bold hover:bg-[#0a4d6b] transition-colors">
                Tutup Pembahasan
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function LMS() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { courseId, lessonId } = useParams()
  const [loadedCourseId, setLoadedCourseId] = useState<number | null>(null)
  const [showRankModal, setShowRankModal] = useState(false)
  const [rankData, setRankData] = useState<QuizLeaderboard[]>([])
  const [rankLoading, setRankLoading] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [welcomeVideo, setWelcomeVideo] = useState<string | null>(null)
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8
  const courseCategories = useMemo(() =>
    Array.from(new Set(courses.map(c => c.category?.name).filter((c): c is string => !!c))),
    [courses]
  )
  const filteredCourses = (searchQuery.trim()
    ? courses.filter(c => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : courses).filter(c => activeCategory === 'all' || c.category?.name === activeCategory)
  const sortedCourses = useMemo(() =>
    [...filteredCourses].sort((a, b) => b.id - a.id),
    [filteredCourses]
  )
  const totalPages = Math.ceil(sortedCourses.length / ITEMS_PER_PAGE)
  const visibleCourses = sortedCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const [view, setView] = useState<ViewType>('courses')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonDetail, setLessonDetail] = useState<{ completed: boolean; completed_at: string | null; progress: LessonProgress | null; slides?: { id: number; file_name: string; url: string }[]; quizzes?: CourseQuiz[]; recap?: { id: number; file_name: string | null; file_size: number | null; kind: string | null; description: string | null; url: string | null } | null; materis?: LessonMateri[] } | null>(null)
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgress>>({})
  const [lessonAtt, setLessonAtt] = useState<Record<number, { is_unlocked: boolean; attended: boolean; is_current: boolean; attended_count: number }>>({})
  const [, setDetailLoading] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const autoCompletedRef = useRef<number | null>(null)
  const [lessonTab, setLessonTab] = useState<'materi' | 'quiz' | 'tugas' | 'rekap'>('materi')
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState<number | null>(null)
  const [submitNote, setSubmitNote] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [courseQuizzes, setCourseQuizzes] = useState<CourseQuiz[]>([])
  const [quizLoading, setQuizLoading] = useState(false)

  // ---- Quiz review (pembahasan hasil jawaban) ----
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewErr, setReviewErr] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [reviewAttempts, setReviewAttempts] = useState<{ attempt_id: number; attempt_number: number; score: number | null }[]>([])
  const [reviewSelectedAttempt, setReviewSelectedAttempt] = useState<number | null>(null)
  const [reviewPaketTitle, setReviewPaketTitle] = useState('')

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeCategory])

  useEffect(() => {
    lmsApi.courses().then(res => {
      setCourses(res.data.courses || [])
    }).catch(() => {}).finally(() => setLoading(false))
    lmsApi.welcomeVideo().then(res => {
      setWelcomeVideo(res.data.welcome_video || null)
      setWelcomeVideoUrl(res.data.welcome_video_url || null)
    }).catch(() => { setWelcomeVideo(null); setWelcomeVideoUrl(null) })
  }, [])

  useEffect(() => {
    if (!courseId) {
      setSelectedCourse(null)
      setLessons([])
      setCompletedLessonIds([])
      setLoadedCourseId(null)
      setView('courses')
      return
    }
    const id = Number(courseId)
    if (!id) return
    const course = courses.find(c => c.id === id)
    if (loadedCourseId !== id || !selectedCourse || selectedCourse.id !== id) {
      if (!course) return
      openCourse(course)
    }
    if (location.pathname.endsWith('/quiz')) {
      setView('quiz-detail')
    } else if (lessonId) {
      setView('lesson')
    }
  }, [courseId, courses, loadedCourseId, selectedCourse, location.pathname, lessonId])

  const loadAssignmentsForCourse = (courseId: number) => {
    setAssignLoading(true)
    lmsApi.courseAssignments(courseId).then(res => {
      setAssignments(res.data.assignments || [])
    }).catch(() => setAssignments([])).finally(() => setAssignLoading(false))
  }

  const loadCourseQuizzes = (courseId: number) => {
    setQuizLoading(true)
    quizApi.pakets().then(res => {
      const all = (res.data.pakets || []) as CourseQuiz[]
      // Jangan tampilkan paket yang belum punya soal (questions_count 0) ke kandidat.
      setCourseQuizzes(all.filter(p => p.course_id === courseId && (Number(p.questions_count) || 0) > 0))
    }).catch(() => setCourseQuizzes([])).finally(() => setQuizLoading(false))
  }

  const loadReviewAttempt = (attemptId: number) => {
    setReviewSelectedAttempt(attemptId)
    setReviewLoading(true)
    setReviewErr(null)
    setReviewData(null)
    quizApi.review(attemptId).then(res => setReviewData(res.data))
      .catch(() => { setReviewErr('Gagal memuat pembahasan.') })
      .finally(() => setReviewLoading(false))
  }

  const openReviewForPaket = (paket: CourseQuiz) => {
    setReviewOpen(true)
    setReviewLoading(true)
    setReviewErr(null)
    setReviewData(null)
    setReviewAttempts([])
    setReviewSelectedAttempt(null)
    setReviewPaketTitle(paket.title)
    quizApi.paket(paket.id).then(res => {
      const attempts = ((res.data.attempts || []) as any[])
        .filter((a: any) => a.status === 'submitted')
        .sort((a: any, b: any) => (Number(b.score ?? 0) - Number(a.score ?? 0)) || (Number(a.attempt_number) - Number(b.attempt_number)))
        .map((a: any) => ({ attempt_id: a.attempt_id, attempt_number: a.attempt_number, score: a.score }))
      setReviewAttempts(attempts)
      if (attempts.length > 0) {
        loadReviewAttempt(attempts[0].attempt_id)
      } else {
        setReviewLoading(false)
        setReviewErr('Belum ada percobaan yang dikumpulkan untuk paket ini.')
      }
    }).catch(() => {
      setReviewLoading(false)
      setReviewErr('Gagal memuat riwayat pengerjaan.')
    })
  }

  const renderReviewModal = () => (
    <ReviewModal
      open={reviewOpen}
      loading={reviewLoading}
      error={reviewErr}
      data={reviewData}
      attempts={reviewAttempts}
      selectedAttempt={reviewSelectedAttempt}
      onSelectAttempt={loadReviewAttempt}
      onClose={() => setReviewOpen(false)}
    />
  )

  const openCourse = (course: Course) => {
    if (!isCourseOpen(course)) {
      Swal.fire({
        icon: 'warning',
        title: 'Kursus Terkunci',
        text: 'Kursus "' + course.title + '" sedang ditutup. Silakan hubungi pengajar atau admin.',
        confirmButtonColor: '#0E6187',
        confirmButtonText: 'OK'
      })
      return
    }
    setSelectedCourse(course)
    setSelectedLesson(null)
    setLessonDetail(null)
    setView('course-detail')
    setLoadedCourseId(course.id)
    loadAssignmentsForCourse(course.id)
    loadCourseQuizzes(course.id)
    lmsApi.courseDetail(course.id).then(res => {
      setLessons(res.data.course?.lessons || [])
      setCompletedLessonIds(res.data.completed_lesson_ids || [])
      setLessonProgressMap(res.data.lesson_progress || {})
      setLessonAtt(res.data.lesson_attendance || {})
    }).catch(() => {})
  }

  const handleCourseClick = (course: Course) => {
    if (!isCourseOpen(course)) {
      Swal.fire({
        icon: 'warning',
        title: 'Kursus Terkunci',
        text: 'Kursus "' + course.title + '" sedang ditutup. Silakan hubungi pengajar atau admin.',
        confirmButtonColor: '#0E6187',
        confirmButtonText: 'OK'
      })
      return
    }
    openCourse(course)
    navigate(`/siswa-dashboard/lms/${course.id}`)
  }

  const applyProgress = (lessonId: number, p: LessonProgress) => {
    setLessonProgressMap(prev => ({ ...prev, [lessonId]: p }))
    setLessonDetail(prev => prev ? { ...prev, progress: p } : prev)
  }

  const sendVideoHeartbeat = useCallback((lessonId: number, currentTime: number, duration: number) => {
    if (duration <= 0 && currentTime <= 0) return
    lmsApi.videoProgress(lessonId, { current_time: currentTime, duration }).then(res => {
      if (res.data?.progress) applyProgress(lessonId, res.data.progress)
    }).catch(() => {})
  }, [])

  const sendReadTick = useCallback((lessonId: number) => {
    lmsApi.readProgress(lessonId, { seconds: 10 }).then(res => {
      if (res.data?.progress) applyProgress(lessonId, res.data.progress)
    }).catch(() => {})
  }, [])

  const isLessonLocked = (lesson: Lesson) => {
    const att = lessonAtt[lesson.id]
    return !!att && !att.is_unlocked
  }

  const openLesson = (lesson: Lesson) => {
    if (isLessonLocked(lesson)) return
    setSelectedLesson(lesson)
    setLessonTab('materi')
    setDetailLoading(true)
    setLessonDetail(null)
    setView('lesson')
    if (selectedCourse?.id && lesson.id !== Number(lessonId)) {
      navigate(`/siswa-dashboard/lms/${selectedCourse.id}/materi/${lesson.id}`)
    }
    loadLessonDetail(lesson.id)
  }

  const loadLessonDetail = (id: number) => {
    lmsApi.lessonDetail(id).then(res => {
      setLessonDetail({
        completed: res.data.completed,
        completed_at: res.data.completed_at,
        progress: res.data.progress || null,
        slides: (res.data.slides || []).map((s: any) => ({ id: s.id, file_name: s.file_name, url: s.url })),
        quizzes: (res.data.quizzes || []).filter((q: any) => (Number(q?.questions_count) || 0) > 0),
        recap: res.data.recap || null,
        materis: res.data.materis || [],
      })
      if (res.data?.progress) {
        setLessonProgressMap(prev => ({ ...prev, [id]: res.data.progress }))
      }
    }).catch(() => {}).finally(() => setDetailLoading(false))
  }

  useEffect(() => {
    if (!lessonId || !selectedCourse) return
    const id = Number(lessonId)
    const lesson = lessons.find(l => l.id === id)
    if (lesson) {
      if (lessonAtt[id] && !lessonAtt[id].is_unlocked) {
        setSelectedLesson(null)
        setLessonDetail(null)
        setView('course-detail')
        navigate(`/siswa-dashboard/lms/${selectedCourse.id}`)
      } else if (selectedLesson?.id !== id) {
        setSelectedLesson(lesson)
        setLessonTab('materi')
        setLessonDetail(null)
        setDetailLoading(true)
        setView('lesson')
        loadLessonDetail(id)
      }
    }
  }, [lessonId, lessons, selectedCourse, selectedLesson, lessonAtt, navigate])

  useEffect(() => {
    if (view !== 'lesson' || !selectedLesson) return
    if (!selectedLesson.content) return

    lastActivityRef.current = Date.now()
    const markActivity = () => { lastActivityRef.current = Date.now() }

    window.addEventListener('keydown', markActivity)
    window.addEventListener('scroll', markActivity, true)
    const contentEl = document.getElementById('lesson-content')
    contentEl?.addEventListener('scroll', markActivity)

    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastActivityRef.current > 20000) return
      sendReadTick(selectedLesson.id)
    }, 10000)

    return () => {
      clearInterval(tick)
      window.removeEventListener('keydown', markActivity)
      window.removeEventListener('scroll', markActivity, true)
      contentEl?.removeEventListener('scroll', markActivity)
    }
  }, [view, selectedLesson, sendReadTick])

  useEffect(() => {
    if (view !== 'lesson' || !selectedLesson) return
    const lessonId = selectedLesson.id
    if (!lessonDetail?.completed && autoCompletedRef.current !== lessonId) {
      autoCompletedRef.current = lessonId
      lmsApi.completeLesson(lessonId).then(() => {
        setCompletedLessonIds(prev => prev.includes(lessonId) ? prev : [...prev, lessonId])
        setLessonDetail(prev => prev ? { ...prev, completed: true, completed_at: new Date().toISOString() } : prev)
      }).catch(() => {})
    }
  }, [view, selectedLesson, lessonDetail])

  const handleSubmitAssignment = async (assignmentId: number) => {
    if (!submitFile) {
      Swal.fire('Peringatan', 'Pilih file terlebih dahulu', 'warning')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('file', submitFile)
      if (submitNote) fd.append('notes', submitNote)
      await lmsApi.submitAssignment(assignmentId, fd)
      setShowSubmitForm(null)
      setSubmitNote('')
      setSubmitFile(null)
      if (selectedCourse) loadAssignmentsForCourse(selectedCourse.id)
      Swal.fire('Berhasil', 'Tugas berhasil dikumpulkan', 'success')
    } catch (e: any) {
      Swal.fire('Error', e?.response?.data?.message || 'Gagal mengumpulkan tugas', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => {
    if (view === 'lesson') {
      setSelectedLesson(null)
      setLessonDetail(null)
      if (selectedCourse?.id) {
        loadCourseQuizzes(selectedCourse.id)
        setView('course-detail')
        navigate(`/siswa-dashboard/lms/${selectedCourse.id}`)
      }
    } else if (view === 'quiz-detail') {
      setView('course-detail')
      if (selectedCourse?.id) navigate(`/siswa-dashboard/lms/${selectedCourse.id}`)
    } else if (view === 'course-detail') {
      setSelectedCourse(null)
      setLessons([])
      setCompletedLessonIds([])
      setLoadedCourseId(null)
      setView('courses')
      navigate('/siswa-dashboard/lms')
    }
  }

  const getProgressPercent = () => Math.round((completedLessonIds.length / Math.max(lessons.length, 1)) * 100)

  const openFirstLesson = () => {
    if (lessons.length > 0) openLesson(lessons[0])
  }

  const renderRichDescription = (text: string) => {
    const hasHtml = /<[a-z][\s\S]*>/i.test(text)
    if (!hasHtml) {
      return (
        <p className="text-[11px] leading-relaxed text-gray-500 whitespace-pre-line">{text}</p>
      )
    }
    return (
      <div className="text-[11px] leading-relaxed text-gray-500
        [&_p]:my-1.5 [&_strong]:font-bold [&_strong]:text-gray-700
        [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-1
        [&_br]:block [&_h1]:font-bold [&_h1]:text-gray-800 [&_h2]:font-bold [&_h2]:text-gray-800"
        dangerouslySetInnerHTML={{ __html: text }} />
    )
  }

  const renderQuizCard = (q: CourseQuiz) => {
    const unlocked = q.is_unlocked
    const best = q.best_score
    const attemptsMaxed = q.attempts_used >= q.max_attempts
    if (q.locked) {
      return (
        <div key={q.id} className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-500 truncate">{q.title}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                <FileQuestion size={11} /> {q.questions_count} Soal
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                <Clock size={11} /> {q.time_limit_minutes}m
              </span>
            </div>

            <div className="mt-4 flex items-start gap-2 bg-amber-50 rounded-xl p-3">
              <Lock size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[11px] font-semibold text-amber-700 leading-snug">
                Paket quiz ini terkunci. Hanya tersedia untuk batch & level yang diajar sensei terkait.
              </p>
            </div>

            <button disabled
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
              <Lock size={13} /> Paket Terkunci
            </button>
          </div>
        </div>
      )
    }
    return (
      <div key={q.id} onClick={() => navigate(`/siswa-dashboard/quiz/${q.id}`)}
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:border-[#0E6187]/40 transition-all">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  unlocked ? 'bg-[#0E6187]/10' : 'bg-gray-50'
                }`}>
                  {unlocked ? <ListChecks size={18} className="text-[#0E6187]" /> : <Lock size={16} className="text-gray-300" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{q.title}</p>
                </div>
              </div>
            </div>
            {unlocked && best !== null ? (
              <span className={`shrink-0 text-xs font-black ${
                q.passing_score > 0 && best >= q.passing_score ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {best}%
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
              <FileQuestion size={11} /> {q.questions_count} Soal
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
              <Clock size={11} /> {q.time_limit_minutes}m
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
              <Award size={11} /> Lulus {q.passing_score}%
            </span>
            <span className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
              <Play size={11} /> {q.max_attempts - q.attempts_used} percobaan
            </span>
          </div>

          {q.description && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              {renderRichDescription(q.description)}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/siswa-dashboard/quiz/${q.id}`) }}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              unlocked && !attemptsMaxed
                ? 'bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/20'
                : 'bg-gray-100 text-gray-400'
            }`}>
            {!unlocked ? (
              <>
                <BookOpen size={13} /> Pelajari Materi untuk membuka quiz
              </>
            ) : attemptsMaxed ? (
              <>
                <AlertTriangle size={13} /> Percobaan habis
              </>
            ) : (
              <>
                <Play size={13} /> Kerjakan Quiz
              </>
            )}
          </button>

          {unlocked && q.attempts_used > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); openReviewForPaket(q) }}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#0E6187]/10 text-[#0E6187] hover:bg-[#0E6187]/15 transition-all">
              <FileQuestion size={13} /> Review Hasil Quiz
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderAssignmentCard = (a: AssignmentItem) => {
    const isPastDue = a.due_date && new Date(a.due_date + 'T23:59:59') < new Date()
    const dueDateObj = a.due_date ? new Date(a.due_date + 'T23:59:59') : null
    const now = new Date()
    const hoursLeft = dueDateObj ? Math.floor((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60)) : null
    const daysLeft = hoursLeft !== null ? Math.floor(hoursLeft / 24) : null
    const hasSubmitted = !!a.submission
    const isGraded = a.submission?.score !== null
    const sub = a.submission
    const pakets = a.pakets || (a.paket ? [a.paket] : []) || []

    return (
      <div key={a.id} className={`bg-white rounded-md border overflow-hidden transition-all ${
        isPastDue && !hasSubmitted ? 'border-red-200' : isGraded ? 'border-emerald-200' : 'border-gray-200'
      }`}>
        {/* Top accent bar */}
        <div className={`h-1 ${
          isGraded ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
            : hasSubmitted ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : isPastDue ? 'bg-gradient-to-r from-red-400 to-red-500'
                : 'bg-gradient-to-r from-[#0E6187] to-[#0E6187]'
        }`} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${
              isGraded ? 'bg-emerald-50 text-emerald-500'
                : hasSubmitted ? 'bg-amber-50 text-amber-500'
                  : 'bg-[#0E6187]/10 text-[#0E6187]'
            }`}>
              {isGraded ? <Award size={20} /> : hasSubmitted ? <CheckCircle size={20} /> : <ClipboardList size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900">{a.title}</h3>
              {a.description && (
                <div className="text-xs text-gray-400 mt-1 line-clamp-2 [&_*]:inline" dangerouslySetInnerHTML={{ __html: a.description }} />
              )}
            </div>
            {isGraded && sub && (
              <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md shrink-0">
                {sub.score}/{a.max_score || '?'}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {a.max_score && (
              <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-[11px] font-bold">
                <Star size={12} /> Skor Maks {a.max_score}
              </span>
            )}
            {a.due_date && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold ${
                isPastDue
                  ? 'bg-red-50 text-red-600'
                  : daysLeft !== null && daysLeft <= 2
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-[#0E6187]/10 text-[#0E6187]'
              }`}>
                <Clock size={12} />
                {isPastDue
                  ? 'Tenggat berakhir'
                  : daysLeft !== null && daysLeft > 0
                    ? `${daysLeft} hari lagi`
                    : hoursLeft !== null && hoursLeft > 0
                      ? `${hoursLeft} jam lagi`
                      : 'Hari ini'}
              </span>
            )}
            {isPastDue && !hasSubmitted && (
              <span className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1.5 rounded-md text-[11px] font-bold">
                <AlertTriangle size={12} /> Telah berakhir
              </span>
            )}
          </div>

          {/* Quiz terkait dari bank soal */}
          {pakets.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              {pakets.map(p => (
                <button key={p.id} type="button"
                  onClick={() => navigate(`/siswa-dashboard/quiz/${p.id}?source=tugas&source_id=${a.id}`)}
                  className="flex items-center gap-3 w-full text-left bg-[#0E6187]/[0.06] text-[#0E6187] border border-[#0E6187]/15 px-3 py-2.5 rounded-md text-[11px] font-bold hover:bg-[#0E6187]/10 hover:border-[#0E6187]/30 transition-all group">
                  <span className="w-8 h-8 rounded-md bg-white flex items-center justify-center shrink-0">
                    <ListChecks size={14} className="text-[#0E6187]" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">Quiz: {p.title}</span>
                    <span className="block text-[10px] font-semibold opacity-70 mt-0.5">
                      {p.questions_count != null && `${p.questions_count} soal · `}Kerjakan quiz untuk menyelesaikan tugas ini
                    </span>
                  </span>
                  <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-black bg-white border border-[#0E6187]/15 text-[#0E6187] px-3 py-1.5 rounded-md group-hover:bg-[#0E6187] group-hover:text-white transition-colors">
                    <Play size={11} /> Kerjakan
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* File Lampiran Guru */}
          {a.file_name && (
            <a href={`${APP_URL}/storage/${a.file_path}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 mt-4 p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#0E6187]/30 hover:bg-[#0E6187]/5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[#0E6187]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 group-hover:text-[#0E6187] transition-colors truncate">{a.file_name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">File Lampiran dari Guru</p>
              </div>
              <Download size={16} className="text-gray-300 group-hover:text-[#0E6187] shrink-0 transition-colors" />
            </a>
          )}

          {/* Submission status / Submit button */}
          {hasSubmitted ? (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-gray-700">Terkumpul</span>
                </div>
                {sub ? sub.score !== null ? (
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    Nilai: {sub.score}/{a.max_score || '?'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Menunggu Penilaian</span>
                ) : null}
              </div>
              {sub?.file_name && (
                <a href={`${APP_URL}/storage/${sub.file_path}`} target="_blank"
                  className="flex items-center gap-2 mt-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#0E6187]/30 transition-all group">
                  <FileText size={14} className="text-[#0E6187] shrink-0" />
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-[#0E6187] truncate transition-colors">{sub.file_name}</span>
                  <Download size={12} className="text-gray-300 group-hover:text-[#0E6187] shrink-0 ml-auto transition-colors" />
                </a>
              )}
              {sub?.feedback && (
                <p className="text-xs text-gray-500 mt-2 pl-0.5">
                  <span className="font-bold text-gray-600">Feedback:</span> {sub.feedback}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4">
              {isPastDue ? (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  <span className="text-xs font-bold text-red-600">Tenggat waktu telah berakhir, tugas tidak dapat dikumpulkan</span>
                </div>
              ) : (
                <button onClick={() => setShowSubmitForm(a.id)}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-[#0E6187] to-[#0E6187] px-4 py-3 rounded-xl hover:from-[#0a4f66] hover:to-[#0E6187] transition-all shadow-sm shadow-[#0E6187]/20">
                  <Upload size={14} /> Kumpulkan Tugas
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSubmitModal = () => {
    if (!showSubmitForm) return null
    const assignment = assignments.find(a => a.id === showSubmitForm)
    if (!assignment) return null
    const dueDateObj = assignment.due_date ? new Date(assignment.due_date + 'T23:59:59') : null
    const now = new Date()
    const hoursLeft = dueDateObj ? Math.floor((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60)) : null
    const daysLeft = hoursLeft !== null ? Math.floor(hoursLeft / 24) : null

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0E6187]/10 flex items-center justify-center">
                <Upload size={16} className="text-[#0E6187]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Kumpulkan Tugas</h3>
                <p className="text-[10px] text-gray-400 font-medium">{assignment.title}</p>
              </div>
            </div>
            <button onClick={() => { setShowSubmitForm(null); setSubmitNote(''); setSubmitFile(null) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Info tugas */}
            <div className="flex items-center gap-2 flex-wrap">
              {assignment.max_score && (
                <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                  <Star size={10} /> Maks {assignment.max_score}
                </span>
              )}
              {dueDateObj && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  hoursLeft !== null && hoursLeft <= 48
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-[#0E6187]/10 text-[#0E6187]'
                }`}>
                  <Clock size={10} />
                  {daysLeft !== null && daysLeft > 0 ? `${daysLeft} hari lagi` : hoursLeft !== null && hoursLeft > 0 ? `${hoursLeft} jam lagi` : 'Hari ini'}
                </span>
              )}
            </div>

            {/* File guru jika ada */}
            {assignment.file_name && (
              <a href={`${APP_URL}/storage/${assignment.file_path}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#0E6187]/30 transition-all group">
                <div className="w-9 h-9 rounded-lg bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-[#0E6187]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-700 truncate group-hover:text-[#0E6187] transition-colors">{assignment.file_name}</p>
                  <p className="text-[9px] text-gray-400">File dari guru</p>
                </div>
                <Download size={14} className="text-gray-300 group-hover:text-[#0E6187] shrink-0" />
              </a>
            )}

            {/* Catatan */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1.5">Catatan <span className="text-gray-400 font-normal">(opsional)</span></label>
              <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)}
                placeholder="Tulis catatan untuk pengumpulan ini..." rows={3}
                className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0E6187] focus:ring-2 focus:ring-[#0E6187]/10 resize-none transition-all placeholder:text-gray-300" />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1.5">File Tugas <span className="text-red-400">*</span></label>
              {submitFile ? (
                <div className="flex items-center gap-3 p-3 bg-[#0E6187]/5 border-2 border-[#0E6187]/20 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#0E6187]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{submitFile.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{(submitFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setSubmitFile(null)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-[#0E6187]/30 hover:bg-gray-50 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Upload size={18} className="text-gray-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-gray-500">Klik atau seret file ke sini</p>
                    <p className="text-[9px] text-gray-300 mt-0.5">PDF, Word, Excel, PPT, ZIP (maks 50MB)</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setSubmitFile(f) }} />
                </label>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 rounded-b-2xl">
            <div className="flex gap-3">
              <button onClick={() => { setShowSubmitForm(null); setSubmitNote(''); setSubmitFile(null) }}
                className="flex-1 text-xs font-bold text-gray-500 bg-gray-100 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors">
                Batal
              </button>
              <button onClick={() => handleSubmitAssignment(assignment.id)} disabled={submitting || !submitFile}
                className="flex-[2] text-xs font-bold text-white bg-gradient-to-r from-[#0E6187] to-[#0E6187] px-4 py-3 rounded-xl hover:from-[#0a4f66] hover:to-[#0E6187] disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-sm shadow-[#0E6187]/20 flex items-center justify-center gap-1.5">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Kirim Tugas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const bottomNav = [
    { label: 'Dashboard', to: '/siswa-dashboard', icon: LayoutDashboard },
    { label: 'Kelas Mendunia', to: '/siswa-dashboard/lms', icon: BookOpen },
    { label: 'Absensi', to: '/siswa-dashboard/absensi', icon: CalendarCheck },
    { label: 'Pembayaran', to: '/siswa-dashboard/pembayaran', icon: Wallet },
    { label: 'Profil', to: '/siswa-dashboard/profil', icon: User },
  ]

  const openRankModal = () => {
    setShowRankModal(true)
    setRankLoading(true)
    setRankData([])
    lmsApi.quizLeaderboard().then(res => {
      setRankData(res.data.leaderboard || [])
    }).catch(() => setRankData([])).finally(() => setRankLoading(false))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  // ==================== LESSON VIEW ====================
  if (view === 'lesson' && selectedLesson && selectedCourse) {
    const progress = completedLessonIds.length
    const total = lessons.length
    const currentIdx = lessons.findIndex(l => l.id === selectedLesson.id)
    const nextLocked = lessons[currentIdx + 1] ? isLessonLocked(lessons[currentIdx + 1]) : false
    const lessonQuizzes = (lessonDetail?.quizzes && lessonDetail.quizzes.length > 0
      ? lessonDetail.quizzes
      : currentIdx === 0 ? courseQuizzes : [])
    const materiCount = (lessonDetail?.slides?.length || 0) + (lessonDetail?.materis?.length || 0) + (selectedLesson.content || selectedLesson.video_url || selectedLesson.file_path ? 1 : 0)
    const courseInfo = [selectedCourse.batch?.nama_batch && `Batch ${selectedCourse.batch.nama_batch}`, selectedCourse.level && `Level ${selectedCourse.level}`].filter(Boolean).join(' · ')
    const lessonTasks = assignments.filter(a => a.lesson_id === selectedLesson.id)
    const tabItems = [
      { key: 'materi' as const, label: 'Materi', icon: BookOpen, count: undefined as number | undefined },
      { key: 'quiz' as const, label: 'Quiz', icon: ListChecks, count: lessonQuizzes.length || undefined },
      { key: 'tugas' as const, label: 'Tugas', icon: ClipboardList, count: lessonTasks.length || undefined },
      { key: 'rekap' as const, label: 'Rekap', icon: FileText, count: lessonDetail?.recap ? 1 : undefined },
    ]

    return (
      <div className="min-h-screen bg-[#f2f4f8] pb-32 md:pb-8">
        {/* Sticky Header */}
        <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100">
          <div className="max-w-lg md:max-w-6xl mx-auto px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button onClick={goBack}
                className="flex items-center justify-center w-9 h-9 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all shrink-0">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{selectedCourse.title}</p>
                <h1 className="text-sm font-bold text-slate-900 truncate">{selectedLesson.title}</h1>
              </div>
              <span className="flex items-center justify-center min-w-[3.2rem] px-2.5 py-1 rounded-md bg-[#0E6187]/10 text-[#0E6187] text-[10px] font-black shrink-0">
                {currentIdx + 1}/{total}
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-lg md:max-w-6xl mx-auto px-4 pt-4 pb-4 md:py-6">
          <div className="flex items-start gap-3 md:gap-6">
            {/* ============ Sidebar Rail (Mobile) ============ */}
            <aside className="md:hidden w-[4.5rem] shrink-0 sticky top-16 z-20">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm shadow-slate-200/60 p-2 flex flex-col gap-1.5">
                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-slate-300 text-center py-1.5 mb-0.5 border-b border-slate-100">Menu</p>
                {tabItems.map(tab => {
                  const active = lessonTab === tab.key
                  return (
                    <button key={tab.key} type="button" onClick={() => setLessonTab(tab.key)}
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-lg py-2.5 transition-all ${
                        active
                          ? 'bg-gradient-to-b from-[#0E6187] to-[#0a516d] text-white shadow-md shadow-[#0E6187]/30'
                          : 'text-slate-400 hover:bg-slate-50 hover:text-[#0E6187]'
                      }`}>
                      {active && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-9 rounded-full bg-white/90" />
                      )}
                      <span className="relative">
                        <tab.icon size={17} />
                        {tab.count !== undefined && (
                          <span className={`absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[8px] font-black flex items-center justify-center ring-2 ${
                            active ? 'bg-white text-[#0E6187] ring-[#0a516d]' : 'bg-[#0E6187] text-white ring-white'
                          }`}>{tab.count}</span>
                        )}
                      </span>
                      <span className="text-[8.5px] font-bold leading-none whitespace-nowrap">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* ============ Sidebar (Desktop) ============ */}
            <aside className="hidden md:block md:w-[290px] md:shrink-0">
              <div className="sticky top-20 space-y-4">
                {/* Sidebar Info Card */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0E6187] to-[#0a516d] px-4 py-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-100">Pertemuan {currentIdx + 1}</p>
                        <h2 className="text-sm font-bold leading-tight mt-1 truncate">{selectedLesson.title}</h2>
                        {courseInfo && (
                          <p className="text-[10px] text-teal-100/90 font-medium mt-1 truncate">{courseInfo}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-lg font-black text-white/90">{getProgressPercent()}%</span>
                    </div>
                    <div className="mt-3.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div className="h-full rounded-full bg-white transition-all duration-700"
                        style={{ width: `${getProgressPercent()}%` }} />
                    </div>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/60">
                    <span className="text-[10px] font-medium text-slate-400">Progres kursus</span>
                    <span className="text-[10px] font-bold text-slate-500">{progress} dari {total} selesai</span>
                  </div>
                </div>

                {/* Sidebar Menu */}
                <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Menu Pertemuan</p>
                  </div>
                  <nav className="p-2 space-y-1">
                    {tabItems.map(tab => {
                      const active = lessonTab === tab.key
                      return (
                        <button key={tab.key} onClick={() => setLessonTab(tab.key)} type="button"
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-xs font-bold transition-all group ${
                            active
                              ? 'bg-[#0E6187] text-white shadow-md shadow-[#0E6187]/25'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-[#0E6187]'
                          }`}>
                          <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                            active
                              ? 'bg-white/15 text-white'
                              : 'bg-slate-100 text-slate-400 group-hover:bg-[#0E6187]/10 group-hover:text-[#0E6187]'
                          }`}>
                            <tab.icon size={15} />
                          </span>
                          <span className="flex-1 text-left">{tab.label}</span>
                          {tab.count !== undefined && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>{tab.count}</span>
                          )}
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </div>
            </aside>

            {/* ============ Main Content ============ */}
            <div className="flex-1 min-w-0">
              {/* Mobile Info Card */}
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 mb-4 md:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-[#0E6187]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.16em]">Pertemuan {currentIdx + 1}</p>
                      <h2 className="text-sm font-bold text-slate-900 truncate">{selectedLesson.title}</h2>
                      <p className="text-[10px] text-[#0E6187] font-medium mt-0.5 truncate">{courseInfo || selectedCourse.title}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-base font-black text-[#0E6187]">{getProgressPercent()}%</span>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-slate-400">Progres kursus</span>
                    <span className="text-[10px] font-bold text-slate-400">{progress} dari {total} selesai</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0E6187] transition-all duration-700"
                      style={{ width: `${getProgressPercent()}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
              {lessonTab === 'materi' && (
            <>
              {/* Materi Card */}
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-[#0E6187]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.16em]">Materi</p>
                      <h2 className="text-sm font-bold text-slate-900 truncate">{selectedLesson.title}</h2>
                    </div>
                  </div>
                </div>

                {selectedLesson.video_url && (
                  <div className="bg-black">
                    <TrackedVideo
                      url={selectedLesson.video_url}
                      title={selectedLesson.title}
                      progress={lessonDetail?.progress || null}
                      onHeartbeat={(currentTime, duration) => sendVideoHeartbeat(selectedLesson.id, currentTime, duration)} />
                  </div>
                )}

                {selectedLesson.content ? (
                  <div className="p-5">
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed
                      [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-sm
                      [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl
                      [&_a]:text-[#0E6187] [&_a]:underline [&_a]:break-words
                      [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                      [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2
                      [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                      [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1.5 [&_li]:pl-1
                      [&_li_ul]:mt-1.5 [&_li_ol]:mt-1.5
                      [&_blockquote]:border-l-4 [&_blockquote]:border-[#0E6187]/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500"
                      dangerouslySetInnerHTML={{ __html: cleanQuillHtml(selectedLesson.content) }} />
                  </div>
                ) : !selectedLesson.video_url ? (
                  <div className="p-10 text-center">
                    <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Belum ada materi untuk pelajaran ini.</p>
                  </div>
                ) : null}

                {lessonDetail?.slides && lessonDetail.slides.length > 0 && (
                  <div className="px-5 pb-5">
                    <LessonSlidesViewer slides={lessonDetail.slides} />
                  </div>
                )}

                {selectedLesson.file_path && (
                  <a href={`${APP_URL}/storage/${selectedLesson.file_path}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 mx-5 mb-5 bg-[#0E6187]/5 border border-[#0E6187]/10 rounded-md p-3 hover:bg-[#0E6187]/10 transition-colors group">
                    <div className="w-9 h-9 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[#0E6187]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#0E6187] transition-colors">
                        {selectedLesson.file_name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        File Lampiran{selectedLesson.file_size ? ` - ${selectedLesson.file_size < 1024 * 1024 ? (selectedLesson.file_size / 1024).toFixed(1) + ' KB' : (selectedLesson.file_size / (1024 * 1024)).toFixed(1) + ' MB'}` : ''}
                      </p>
                    </div>
                    <Download size={15} className="text-[#0E6187] shrink-0" />
                  </a>
                )}

                {(lessonDetail?.materis || []).length > 0 && (
                  <div className="mx-5 mb-5">
                    {lessonDetail!.materis!.map(m => (
                      <div key={m.id} className="mb-4 last:mb-0">
                        {m.video_url && (
                          <div className="bg-black rounded-md overflow-hidden">
                            <TrackedVideo
                              url={m.video_url}
                              title={m.title}
                              progress={lessonDetail?.progress || null}
                              onHeartbeat={(currentTime, duration) => sendVideoHeartbeat(selectedLesson.id, currentTime, duration)} />
                          </div>
                        )}
                        {m.content ? (
                          <div className="p-5">
                            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed
                              [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-sm
                              [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl
                              [&_a]:text-[#0E6187] [&_a]:underline [&_a]:break-words
                              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2
                              [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                              [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1.5 [&_li]:pl-1
                              [&_li_ul]:mt-1.5 [&_li_ol]:mt-1.5
                              [&_blockquote]:border-l-4 [&_blockquote]:border-[#0E6187]/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500"
                              dangerouslySetInnerHTML={{ __html: cleanQuillHtml(m.content) }} />
                          </div>
                        ) : null}
                        {m.file_path && (
                          <a href={m.file_url || `${APP_URL}/storage/${m.file_path}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-[#0E6187]/5 border border-[#0E6187]/10 rounded-md p-3 hover:bg-[#0E6187]/10 transition-colors group">
                            <div className="w-9 h-9 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-[#0E6187]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#0E6187] transition-colors">
                                {m.title}{m.file_name && m.file_name !== m.title ? ` · ${m.file_name}` : ''}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {m.file_name}{m.file_size ? ` - ${m.file_size < 1024 * 1024 ? (m.file_size / 1024).toFixed(1) + ' KB' : (m.file_size / (1024 * 1024)).toFixed(1) + ' MB'}` : ''}
                              </p>
                            </div>
                            <Download size={15} className="text-[#0E6187] shrink-0" />
                          </a>
                        )}
                        {m.slides && m.slides.length > 0 && (
                          <div className="mt-3">
                            <LessonSlidesViewer slides={m.slides.map(s => ({ id: s.id, name: s.file_name || 'slide', url: s.url }))} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

              {lessonTab === 'quiz' && (
            <>
              {/* Quiz Pertemuan Ini */}
              {lessonQuizzes.length > 0 ? (
                <div className="bg-white rounded-md shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-800 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                        <ListChecks size={13} className="text-[#0E6187]" />
                      </span>
                      Quiz Pertemuan Ini
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400">{lessonQuizzes.length} paket</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {lessonQuizzes.map(q => {
                        const unlocked = q.is_unlocked
                        const attemptsMaxed = q.max_attempts > 0 && q.attempts_used >= q.max_attempts
                        const locked = !unlocked
                        const canDo = unlocked && !attemptsMaxed
                        const remaining = q.max_attempts > 0 ? Math.max(0, q.max_attempts - (q.attempts_used || 0)) : null

                        const IconComp = canDo ? ListChecks : attemptsMaxed ? CheckCircle : Lock
                        const cardCls = canDo
                          ? 'border-slate-200 bg-white hover:border-[#0E6187]/40 hover:shadow-md hover:shadow-[#0E6187]/5'
                          : 'border-slate-100 bg-slate-50/60'
                        const iconCls = canDo
                          ? 'bg-[#0E6187]/10 text-[#0E6187]'
                          : attemptsMaxed
                            ? 'bg-amber-50 text-amber-400'
                            : 'bg-slate-100 text-slate-400'
                        const statusLabel = canDo ? 'Tersedia' : locked ? (q.is_link_locked ? 'Terkunci' : 'Ditutup') : 'Habis'
                        const statusCls = canDo
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : locked
                            ? 'bg-slate-100 text-slate-400 border border-slate-100'
                            : 'bg-amber-50 text-amber-500 border border-amber-100'

                        return (
                          <div key={q.id} className={`flex flex-col rounded-lg border transition-all ${cardCls}`}>
                            <div className="flex items-start gap-2.5 p-3.5 pb-3">
                              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${iconCls}`}>
                                <IconComp size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{q.title}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{q.questions_count} soal</p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusCls}`}>{statusLabel}</span>
                            </div>
                            <div className="mt-auto px-3.5 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                <Clock size={11} />
                                {attemptsMaxed ? 'Percobaan habis' : remaining != null ? `Sisa ${remaining} kali` : `${q.max_attempts ?? 0} percobaan`}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {q.attempts_used > 0 && (
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); openReviewForPaket(q) }}
                                    className="rounded-md bg-[#0E6187]/10 px-3 py-1.5 text-[10px] font-bold text-[#0E6187] hover:bg-[#0E6187]/15 active:scale-95 transition-all shrink-0">
                                    Review Hasil
                                  </button>
                                )}
                                {canDo ? (
                                  <button type="button"
                                    onClick={() => navigate(`/siswa-dashboard/quiz/${q.id}`)}
                                    className="rounded-md bg-[#0E6187] px-3 py-1.5 text-[10px] font-bold text-white shadow-sm shadow-[#0E6187]/20 hover:bg-[#0B4C6B] active:scale-95 transition-all shrink-0">
                                    Kerjakan
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300">{q.attempts_used ?? 0}/{q.max_attempts ?? 0} kali</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-md shadow-sm p-10 text-center">
                  <div className="w-14 h-14 rounded-md bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <ListChecks size={26} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada quiz</p>
                  <p className="text-xs text-gray-400 mt-1">Quiz untuk pertemuan ini belum tersedia</p>
                </div>
              )}
            </>
          )}

              {lessonTab === 'tugas' && (
            <>
              {/* Tugas */}
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-800 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                      <ClipboardList size={13} className="text-[#0E6187]" />
                    </span>
                    Tugas
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400">{lessonTasks.length} tugas</span>
                </div>
                <div className="p-4 space-y-2.5">
                  {lessonTasks.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-14 h-14 rounded-md bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <ClipboardList size={26} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Belum ada tugas</p>
                      <p className="text-xs text-gray-400 mt-1">Tugas untuk pertemuan ini belum tersedia</p>
                    </div>
                  ) : (
                    lessonTasks.map(a => renderAssignmentCard(a))
                  )}
                </div>
              </div>
            </>
          )}

              {lessonTab === 'rekap' && (
            <>
              {/* Rekap Pertemuan */}
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-800 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                      <ClipboardList size={13} className="text-[#0E6187]" />
                    </span>
                    Rekap Pertemuan
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{currentIdx + 1}/{total}</span>
                </div>
                <div className="p-5">
                  <h2 className="text-base font-black text-slate-900 leading-snug">{selectedLesson.title}</h2>
                  {courseInfo && (
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <GraduationCap size={11} /> {courseInfo}
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { key: 'materi' as const, label: 'Materi', icon: BookOpen, count: materiCount },
                      { key: 'quiz' as const, label: 'Quiz', icon: ListChecks, count: lessonQuizzes.length },
                      { key: 'tugas' as const, label: 'Tugas', icon: ClipboardList, count: lessonTasks.length },
                    ].map(stat => (
                      <div key={stat.key} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          <stat.icon size={11} className="text-[#0E6187]" /> {stat.label}
                        </div>
                        <p className="text-lg font-black text-slate-800 mt-1">{stat.count}</p>
                      </div>
                    ))}
                  </div>

                  {lessonDetail?.recap ? (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      {lessonDetail.recap.url && lessonDetail.recap.kind === 'image' && (
                        <a href={lessonDetail.recap.url} target="_blank" rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={lessonDetail.recap.url} alt="Rekap pertemuan" className="w-full max-h-[420px] object-contain" />
                        </a>
                      )}
                      {lessonDetail.recap.url && lessonDetail.recap.kind !== 'image' && (
                        <a href={lessonDetail.recap.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{lessonDetail.recap.file_name}</p>
                            <p className="text-[10px] text-gray-400">{fmtFileSize(lessonDetail.recap.file_size ?? undefined)} · PDF</p>
                          </div>
                          <span className="shrink-0 text-[11px] font-bold text-[#0E6187] flex items-center gap-1">
                            <Download size={12} /> Buka
                          </span>
                        </a>
                      )}
                      {lessonDetail.recap.description && (
                        <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-4">
                          {lessonDetail.recap.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-slate-100 py-10 text-center">
                      <div className="w-14 h-14 rounded-md bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <ClipboardList size={26} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Belum ada rekap pertemuan</p>
                      <p className="text-xs text-gray-400 mt-1">Rekap dari pengajar akan muncul di sini</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

            </div>
            </div>
          </div>
        </div>

        {/* ============ Mobile Bottom Action Bar ============ */}
        <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden bg-white/95 backdrop-blur border-t border-slate-100 px-4 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center gap-2">
            {currentIdx > 0 ? (
              <button
                onClick={() => openLesson(lessons[currentIdx - 1])}
                className="flex items-center justify-center gap-1 px-3 py-3 rounded-md bg-slate-50 text-slate-600 text-[11px] font-bold hover:bg-slate-100 active:scale-95 transition-all shrink-0">
                <ChevronLeft size={14} /> Sebelumnya
              </button>
            ) : (
              <span className="flex items-center justify-center px-3 py-3 rounded-md bg-slate-50 text-slate-300 text-[11px] font-bold cursor-not-allowed shrink-0">
                <ChevronLeft size={14} className="inline" /> Awal
              </span>
            )}
            <span className="shrink-0 text-[10px] font-black text-slate-400 px-0.5">{currentIdx + 1}/{total}</span>
            {currentIdx === lessons.length - 1 && courseQuizzes.length > 0 ? (
              <button
                onClick={() => selectedCourse?.id && navigate(`/siswa-dashboard/lms/${selectedCourse.id}/quiz`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md text-[11px] font-black bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/25 active:scale-[0.98] transition-all">
                Mulai Quiz <ListChecks size={14} />
              </button>
            ) : (
              <button
                onClick={() => { if (!nextLocked && currentIdx < lessons.length - 1) openLesson(lessons[currentIdx + 1]) }}
                disabled={nextLocked || currentIdx === lessons.length - 1}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md text-[11px] font-black bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/25 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-[0.98] transition-all">
                {nextLocked ? <><Lock size={14} /> Terkunci</> : <>Selanjutnya <ChevronRight size={14} /></>}
              </button>
            )}
          </div>
        </nav>

        {/* Submit Assignment Modal */}
        {renderSubmitModal()}

        {/* Quiz Review Modal (Pembahasan Hasil) */}
        {renderReviewModal()}
      </div>
    )
  }

  // ==================== QUIZ DETAIL VIEW ====================
  if (view === 'quiz-detail' && selectedCourse) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8 animate-fade-up">
        {/* Sticky Header */}
        <div className="bg-[#0E6187] text-white sticky top-0 z-30 shadow-sm">
          <div className="max-w-lg mx-auto px-4 py-3">
            <button onClick={goBack}
              className="flex items-center gap-1 text-[11px] font-bold text-white/60 hover:text-white transition-colors mb-1">
              <ArrowLeft size={12} /> Kembali
            </button>
            <h1 className="text-sm font-bold text-white truncate">{selectedCourse.title}</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {/* Akses Materi card */}
          {lessons.length > 0 && (
          <div onClick={openFirstLesson}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:border-[#0E6187]/40 transition-all">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-[#0E6187]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Akses Materi untuk Membuka Quiz</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {completedLessonIds.length}/{lessons.length} materi selesai {lessons.length > 0 ? `- ${lessons[0].title}` : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                {lessons.map((lesson, idx) => {
                  const done = completedLessonIds.includes(lesson.id)
                  return (
                    <span key={lesson.id} className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ${
                      done ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {done ? <Check size={10} /> : <span>{idx + 1}</span>}
                      <span className="truncate max-w-[100px]">{lesson.title}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
          )}

          {/* Quiz cards */}
          {courseQuizzes.map(q => renderQuizCard(q))}

          {lessons.length === 0 && courseQuizzes.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <ListChecks size={26} className="text-gray-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-800">Belum Ada Quiz</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Kursus ini belum memiliki quiz atau materi pembelajaran.
              </p>
              <button
                onClick={() => {
                  setView('course-detail')
                  if (selectedCourse?.id) navigate(`/siswa-dashboard/lms/${selectedCourse.id}`)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0E6187] text-white hover:bg-[#0E6187]/90 transition-colors">
                Lihat Detail Kursus
              </button>
            </div>
          )}
        </div>

        {/* ============ Bottom Nav Bar ============ */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {bottomNav.map(nav => {
              const Icon = nav.icon
              const isActive = nav.to === location.pathname
              return (
                <Link
                  key={nav.label}
                  to={nav.to}
                  className={`flex flex-col items-center gap-1 py-2.5 transition ${
                    isActive ? 'text-[#0E6187]' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{nav.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Quiz Review Modal (Pembahasan Hasil) */}
        {renderReviewModal()}
      </div>
    )
  }

  // ==================== COURSE DETAIL VIEW ====================
  if (view === 'course-detail' && selectedCourse) {
    // Sebuah kursus menampilkan daftar pertemuan ("Daftar Pertemuan") bila ia memiliki
    // materi/pelajaran (lessons), tanpa peduli apakah terhubung ke sensei atau tidak.
    // Kursus tanpa lessons diperlakukan sebagai kursus quiz (paket soal saja).
    const hasLessons = (selectedCourse.lessons_count ?? 0) > 0 || lessons.length > 0
    const isQuizCourse = !hasLessons
    const progress = isQuizCourse ? courseQuizzes.filter(q => q.best_score !== null).length : completedLessonIds.length
    const total = isQuizCourse ? courseQuizzes.length : lessons.length
    const percent = Math.round((progress / Math.max(total, 1)) * 100)
    const isComplete = percent === 100 && total > 0

    return (
      <>
      <div className="min-h-screen bg-[#f2f4f8] pb-24 animate-fade-up">
        {/* Header */}
        <header className="bg-white sticky top-0 z-30 border-b border-slate-100 shadow-sm shadow-slate-200/40">
          <div className="max-w-lg mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={goBack}
                className="flex items-center justify-center w-9 h-9 rounded-md bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shrink-0">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold text-slate-900 truncate">{selectedCourse.title}</h1>
                <p className="text-[10px] text-[#0E6187] font-medium truncate">
                  {[
                    selectedCourse.batch?.nama_batch && `Batch ${selectedCourse.batch.nama_batch}`,
                    selectedCourse.level && `Level ${selectedCourse.level}`,
                  ].filter(Boolean).join(' · ') || 'Kursus'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-black text-[#0E6187] leading-none">{percent}%</p>
                <p className="text-[9px] font-medium text-slate-400 mt-1">{isComplete ? 'Selesai' : `${progress} dari ${total} selesai`}</p>
              </div>
            </div>
            <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#0E6187] transition-all duration-700" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 mt-4">
          {/* Lessons Tab */}
            {isQuizCourse ? (
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ListChecks size={14} className="text-[#0E6187]" />
                    Daftar Paket Soal
                  </h3>
                  <span className="text-[10px] font-bold text-[#0E6187]">{courseQuizzes.length} paket soal</span>
                </div>
                <div className="p-4 space-y-3">
                  {quizLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-400">
                      <div className="w-4 h-4 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" /> Memuat paket soal...
                    </div>
                  ) : courseQuizzes.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <ListChecks size={26} className="text-gray-300" />
                      </div>
                      <p className="text-sm font-semibold text-gray-500">Belum ada paket soal</p>
                      <p className="text-xs text-gray-400 mt-1">Paket soal akan segera tersedia</p>
                    </div>
                  ) : (
                    courseQuizzes.map(q => renderQuizCard(q))
                  )}
                </div>
            </div>
            ) : (
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={14} className="text-[#0E6187]" />
                    Daftar Pertemuan
                  </h3>
                  <span className="text-[10px] font-bold text-[#0E6187]">{progress}/{total} selesai</span>
                </div>
                {lessons.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={24} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Belum ada pertemuan</p>
                    <p className="text-xs text-slate-400 mt-1">Pertemuan akan segera tersedia</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {lessons.map((lesson, idx) => {
                      const isCompleted = completedLessonIds.includes(lesson.id)
                      const att = lessonAtt[lesson.id]
                      const locked = !!att && !att.is_unlocked
                      return (
                        <button key={lesson.id}
                          onClick={() => !locked && openLesson(lesson)}
                          className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors group ${
                            locked ? 'cursor-not-allowed' : 'hover:bg-slate-50'
                          }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
                            locked
                              ? 'bg-slate-100 text-slate-300'
                              : isCompleted
                                ? 'bg-[#0E6187] text-white'
                                : att?.is_current
                                  ? 'bg-[#0E6187]/10 text-[#0E6187] ring-1 ring-[#0E6187]/30'
                                  : 'bg-slate-100 text-slate-500'
                          } transition-colors`}>
                            {locked ? <Lock size={14} /> : isCompleted ? <CheckCircle size={15} /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-semibold truncate ${locked ? 'text-slate-400' : 'text-slate-800'}`}>{lesson.title}</p>
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
                              {'file_name' in lesson && (lesson as any).file_name && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-[#0E6187]">
                                  <Download size={10} /> File
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {locked ? (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                <Lock size={10} /> Terkunci
                              </span>
                            ) : isCompleted ? (
                              <span className="text-[10px] font-medium text-[#0E6187]">Selesai</span>
                            ) : att?.is_current ? (
                              <span className="rounded-full bg-[#0E6187]/10 px-2 py-0.5 text-[10px] font-bold text-[#0E6187]">Buka</span>
                            ) : null}
                            <ChevronRight size={14} className="text-slate-300" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          {/* Assignments */}
          {assignments.length > 0 && (
            <div className="space-y-4">
              {assignLoading ? (
                <div className="bg-white rounded-md border border-gray-200 p-12 text-center">
                  <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Memuat tugas...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="bg-white rounded-md border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-md bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList size={28} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada tugas</p>
                  <p className="text-xs text-gray-400 mt-1">Tugas akan segera tersedia</p>
                </div>
              ) : (
                assignments.map(a => {
                  const isPastDue = a.due_date && new Date(a.due_date + 'T23:59:59') < new Date()
                  const dueDateObj = a.due_date ? new Date(a.due_date + 'T23:59:59') : null
                  const now = new Date()
                  const hoursLeft = dueDateObj ? Math.floor((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60)) : null
                  const daysLeft = hoursLeft !== null ? Math.floor(hoursLeft / 24) : null
                  const hasSubmitted = !!a.submission
                  const isGraded = a.submission?.score !== null
                  const sub = a.submission

                  return (
                    <div key={a.id} className={`bg-white rounded-md border overflow-hidden transition-all ${
                      isPastDue && !hasSubmitted ? 'border-red-200' : isGraded ? 'border-emerald-200' : 'border-gray-200'
                    }`}>
                      {/* Top accent bar */}
                      <div className={`h-1 ${
                        isGraded ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : hasSubmitted ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : isPastDue ? 'bg-gradient-to-r from-red-400 to-red-500'
                              : 'bg-gradient-to-r from-[#0E6187] to-[#0E6187]'
                      }`} />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${
                            isGraded ? 'bg-emerald-50 text-emerald-500'
                              : hasSubmitted ? 'bg-amber-50 text-amber-500'
                                : 'bg-[#0E6187]/10 text-[#0E6187]'
                          }`}>
                            {isGraded ? <Award size={20} /> : hasSubmitted ? <CheckCircle size={20} /> : <ClipboardList size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-gray-900">{a.title}</h3>
                            {a.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2 [&_*]:inline" dangerouslySetInnerHTML={{ __html: a.description }} />
                            )}
                          </div>
                          {isGraded && sub && (
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md shrink-0">
                              {sub.score}/{a.max_score || '?'}
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {a.max_score && (
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-md text-[11px] font-bold">
                              <Star size={12} /> Skor Maks {a.max_score}
                            </span>
                          )}
                          {a.due_date && (
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold ${
                              isPastDue
                                ? 'bg-red-50 text-red-600'
                                : daysLeft !== null && daysLeft <= 2
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-[#0E6187]/10 text-[#0E6187]'
                            }`}>
                              <Clock size={12} />
                              {isPastDue
                                ? 'Tenggat berakhir'
                                : daysLeft !== null && daysLeft > 0
                                  ? `${daysLeft} hari lagi`
                                  : hoursLeft !== null && hoursLeft > 0
                                    ? `${hoursLeft} jam lagi`
                                    : 'Hari ini'}
                            </span>
                          )}
                          {isPastDue && !hasSubmitted && (
                            <span className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1.5 rounded-md text-[11px] font-bold">
                              <AlertTriangle size={12} /> Telah berakhir
                            </span>
                          )}
                        </div>

                        {/* Quiz terkait dari bank soal */}
                        {a.pakets && a.pakets.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {a.pakets.map(p => (
                              <button key={p.id} type="button"
                                onClick={() => navigate(`/siswa-dashboard/quiz/${p.id}?source=tugas&source_id=${a.id}`)}
                                className="flex items-center gap-1.5 bg-[#0E6187]/[0.06] text-[#0E6187] border border-[#0E6187]/15 px-3 py-1.5 rounded-md text-[11px] font-bold hover:bg-[#0E6187]/10 hover:border-[#0E6187]/30 transition-colors">
                                <ListChecks size={12} />
                                Quiz: {p.title}
                                {p.questions_count != null && <span className="opacity-60 font-semibold">({p.questions_count} soal)</span>}
                                <Play size={10} />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* File Lampiran Guru */}
                        {a.file_name && (
                          <a href={`${APP_URL}/storage/${a.file_path}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 mt-4 p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#0E6187]/30 hover:bg-[#0E6187]/5 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                              <FileText size={18} className="text-[#0E6187]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 group-hover:text-[#0E6187] transition-colors truncate">{a.file_name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">File Lampiran dari Guru</p>
                            </div>
                            <Download size={16} className="text-gray-300 group-hover:text-[#0E6187] shrink-0 transition-colors" />
                          </a>
                        )}

                        {/* Submission status / Submit button */}
                        {hasSubmitted ? (
                          <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-500" />
                                <span className="text-xs font-bold text-gray-700">Terkumpul</span>
                              </div>
                              {sub ? sub.score !== null ? (
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                  Nilai: {sub.score}/{a.max_score || '?'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Menunggu Penilaian</span>
                              ) : null}
                            </div>
                            {sub?.file_name && (
                              <a href={`${APP_URL}/storage/${sub.file_path}`} target="_blank"
                                className="flex items-center gap-2 mt-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#0E6187]/30 transition-all group">
                                <FileText size={14} className="text-[#0E6187] shrink-0" />
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#0E6187] truncate transition-colors">{sub.file_name}</span>
                                <Download size={12} className="text-gray-300 group-hover:text-[#0E6187] shrink-0 ml-auto transition-colors" />
                              </a>
                            )}
                            {sub?.feedback && (
                              <p className="text-xs text-gray-500 mt-2 pl-0.5">
                                <span className="font-bold text-gray-600">Feedback:</span> {sub.feedback}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4">
                            {isPastDue ? (
                              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertTriangle size={16} className="text-red-500 shrink-0" />
                                <span className="text-xs font-bold text-red-600">Tenggat waktu telah berakhir, tugas tidak dapat dikumpulkan</span>
                              </div>
                            ) : (
                              <button onClick={() => setShowSubmitForm(a.id)}
                                className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-[#0E6187] to-[#0E6187] px-4 py-3 rounded-xl hover:from-[#0a4f66] hover:to-[#0E6187] transition-all shadow-sm shadow-[#0E6187]/20">
                                <Upload size={14} /> Kumpulkan Tugas
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>
      </div>

      {/* Submit Assignment Modal */}
      {renderSubmitModal()}

      {/* Quiz Review Modal (Pembahasan Hasil) */}
      {renderReviewModal()}

      {/* ============ Bottom Nav Bar ============ */}
      <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {bottomNav.map(nav => {
            const Icon = nav.icon
            const isActive = nav.to === location.pathname
            return (
              <Link
                key={nav.label}
                to={nav.to}
                className={`group flex flex-col items-center justify-center py-2 transition ${
                  isActive ? 'text-[#0E6187]' : 'text-slate-400'
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#0E6187] text-white'
                    : 'group-hover:bg-[#0E6187] group-hover:text-white'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className="mt-0.5 text-[9px] font-semibold">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
    )
  }

  // ==================== COURSE LIST VIEW ====================
  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24 lg:pb-8">
      {/* ============ Top App Bar ============ */}
      <header className="bg-[#0E6187] px-4 pb-16 pt-5 text-white">
        <div className="mx-auto max-w-lg">
          <button onClick={() => navigate('/siswa-dashboard')}
            className="flex items-center gap-1.5 text-[11px] font-bold text-white/60 hover:text-white transition-colors mb-3">
            <ArrowLeft size={12} /> Kembali
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-sm1.png" alt="Kelas Mendunia" className="h-8 w-auto" />
            </div>
            {courses.length > 0 && (
              <div className="flex items-center gap-3 text-white/80">
                <div className="text-center">
                  <p className="text-base font-black text-white">{courses.length}</p>
                  <p className="text-[9px] font-bold text-white/50">Kursus</p>
                </div>
                <div className="w-px h-6 bg-white/15" />
                <div className="text-center">
                  <p className="text-base font-black text-white">{courses.reduce((a, c) => a + c.lessons_count, 0)}</p>
                  <p className="text-[9px] font-bold text-white/50">Pelajaran</p>
                </div>
                <div className="w-px h-6 bg-white/15" />
                <button onClick={openRankModal}
                  className="flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-white/25 active:scale-95">
                  <Trophy size={14} className="text-amber-300" /> Rank
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
              <GraduationCap size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">KELAS MENDUNIA </h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Materi pembelajaran dan progress belajar</p>
            </div>
          </div>
          {courses.length > 0 && (
            <div className="relative mt-4">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari kursus kamu..."
                className="w-full rounded-xl border border-white/15 bg-white/15 py-2.5 pl-10 pr-9 text-xs font-medium text-white placeholder:text-white/50 outline-none transition-all focus:bg-white/20 focus:border-white/30"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                  <X size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Welcome Video */}
      {(welcomeVideo || welcomeVideoUrl) && (
        <div className="mx-auto mt-5 max-w-lg px-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-100">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0E6187] via-[#0b7ea8] to-[#0f2840] px-5 py-5">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-14 right-14 h-28 w-28 rounded-full bg-amber-300/20 blur-xl" />
              <div className="pointer-events-none absolute -left-6 top-8 h-16 w-16 rounded-full border border-white/10" />
              <div className="relative flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner ring-1 ring-white/30 backdrop-blur">
                  👋
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="mt-1 text-base font-black leading-tight text-white">
                    Selamat Datang, {user?.name?.split(' ')[0] || 'Siswa'}!
                  </h2>
                  <p className="mt-1 text-[10.5px] text-white/75 leading-snug">
                    Sapa hangat sebelum kamu mulai belajar di Kelas Mendunia 🎓
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-b from-slate-50 to-white p-2">
              {welcomeVideoUrl ? (
                <iframe
                  src={getYouTubeEmbedUrl(welcomeVideoUrl) || welcomeVideoUrl}
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  className="w-full aspect-video rounded-xl bg-black"
                  title="Video Selamat Datang"
                />
              ) : (
                <video
                  src={`${APP_URL}/storage/${welcomeVideo}`}
                  controls
                  playsInline
                  className="w-full aspect-video rounded-xl bg-black"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="mx-auto mt-6 max-w-lg space-y-4 px-4 pt-2 md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
        {courses.length === 0 ? (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-md bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-300" />
            </div>
            <h2 className="text-sm font-bold text-gray-800 mb-1.5">Belum Ada Kursus</h2>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Belum ada kursus yang tersedia untuk Anda. Silakan hubungi pengajar atau admin untuk informasi lebih lanjut.
            </p>
          </div>
        ) : (
          <>
            {courseCategories.length > 0 && (
              <div className="-mx-4 px-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveCategory('all')}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${activeCategory === 'all' ? 'bg-[#0E6187] text-white shadow-md shadow-[#0E6187]/20' : 'bg-white text-slate-500 border border-gray-200 hover:border-gray-300'}`}
                    type="button">Semua</button>
                  {courseCategories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all ${activeCategory === cat ? 'bg-[#0E6187] text-white shadow-md shadow-[#0E6187]/20' : 'bg-white text-slate-500 border border-gray-200 hover:border-gray-300'}`}
                      type="button">{cat}</button>
                  ))}
                </div>
              </div>
            )}

            {visibleCourses.length === 0 ? (
              <div className="bg-white rounded-md shadow-sm border border-gray-200 p-10 text-center">
                <div className="w-14 h-14 rounded-md bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Search size={26} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">{searchQuery.trim() ? 'Kursus Tidak Ditemukan' : 'Tidak Ada Kursus di Kategori Ini'}</h3>
                <p className="text-xs text-gray-400 mt-1">{searchQuery.trim() ? `Tidak ada kursus yang cocok dengan "${searchQuery.trim()}".` : 'Pilih kategori lain untuk melihat kursusnya.'}</p>
              </div>
            ) : (
<div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visibleCourses.map(course => (
<button key={course.id} onClick={() => handleCourseClick(course)}
                  className={`bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:shadow-gray-200/50 hover:border-[#0E6187]/40 transition-all text-left group flex flex-col ${!isCourseOpen(course) ? 'opacity-85' : ''}`}>
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#0E6187] to-[#1a3355] flex items-center justify-center relative overflow-hidden shrink-0">
                    {course.image ? (
                      <img src={`${APP_URL}/storage/${course.image}`} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isCourseOpen(course) ? 'grayscale' : ''}`} />
                    ) : (
                      <img src={DEFAULT_COURSE_COVER} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isCourseOpen(course) ? 'grayscale' : ''}`} />
                    )}
                    <div className="absolute inset-0 bg-[#0E6187]/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    {course.category && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-block rounded-full bg-white/90 px-2 py-0.5 text-[8px] font-bold text-[#0E6187] shadow-sm">
                          {course.category.name}
                        </span>
                      </div>
                    )}
                    {!isCourseOpen(course) && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur">
                          <Lock size={16} className="text-white" />
                        </span>
                        <span className="rounded-full bg-black/50 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-white ring-1 ring-white/20">Terkunci</span>
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[8px] sm:text-[9px] font-bold text-white ring-1 ring-white/20 backdrop-blur">
                      <Play size={9} /> {course.lessons_count} Pel
                    </span>
                  </div>
                  <div className="p-2.5 sm:p-3 flex flex-col flex-1">
                    <h3 className="text-[11px] sm:text-[13px] md:text-sm font-bold text-gray-900 leading-snug line-clamp-1 sm:line-clamp-2 group-hover:text-[#0E6187] transition-colors" title={course.title}>
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-[8px] sm:text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-relaxed [&_*]:inline"
                        title={course.description.replace(/<[^>]*>/g, ' ')}
                        dangerouslySetInnerHTML={{ __html: course.description }} />
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2 gap-2">
                      {course.level ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-bold bg-[#0E6187]/10 text-[#0E6187]">
                          Level {course.level}
                        </span>
                      ) : <span />}
                      {!isCourseOpen(course) ? (
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-slate-400 whitespace-nowrap">
                          <Lock size={10} /> Terkunci
                        </span>
                      ) : (
                      <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-slate-400 group-hover:text-[#0E6187] whitespace-nowrap transition-colors">
                        Buka <ChevronRight size={10} />
                      </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-3 pb-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-[11px] font-bold transition-all ${
                      page === currentPage
                        ? 'bg-[#0E6187] text-white shadow-md shadow-[#0E6187]/20'
                        : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============ Bottom Nav Bar ============ */}
      <nav className="fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/10 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {bottomNav.map(nav => {
            const Icon = nav.icon
            const isActive = nav.to === location.pathname
            return (
              <Link
                key={nav.label}
                to={nav.to}
                className={`group flex flex-col items-center justify-center py-2 transition ${
                  isActive ? 'text-[#0E6187]' : 'text-slate-400'
                }`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#0E6187] text-white'
                    : 'group-hover:bg-[#0E6187] group-hover:text-white'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className="mt-0.5 text-[9px] font-semibold">{nav.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ============ Rank Quiz Modal ============ */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRankModal(false)}>
          <div className="flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 shrink-0">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Trophy size={16} className="text-amber-500" /> Rank Quiz
                </h2>
                <p className="mt-0.5 text-[10px] text-slate-400">Peringkat nilai terbaik setiap paket soal</p>
              </div>
              <button onClick={() => setShowRankModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-4">
              {rankLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-[#0E6187] animate-spin" />
                  <p className="mt-3 text-xs font-medium">Memuat peringkat...</p>
                </div>
              ) : rankData.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <Trophy size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Belum ada peringkat</p>
                  <p className="mt-1 text-[10px] text-slate-400">Peringkat akan muncul setelah kandidat mengerjakan quiz</p>
                </div>
              ) : (
                rankData.map(lb => (
                  <div key={lb.paket_id} className="overflow-hidden rounded-md border border-slate-200">
                    <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                        <Trophy size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-slate-800">{lb.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {[lb.course, lb.level && `Level ${lb.level}`].filter(Boolean).join(' · ') || 'Quiz'}
                        </p>
                      </div>
                      {lb.max_score != null && (
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">Max {lb.max_score}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-[2.75rem_1fr_3.25rem] items-center gap-2 border-b border-slate-100 bg-slate-100/70 px-3 py-1.5">
                      <span className="text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">#</span>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Nama</span>
                      <span className="text-right text-[9px] font-bold uppercase tracking-wide text-slate-400">Skor</span>
                    </div>

                    {lb.entries.length > 0 && (
                      <div className="divide-y divide-slate-100">
                        {lb.entries.map(e => {
                          const isMe = e.nama === user?.name
                          return (
                            <div key={e.siswa_id} className={`grid grid-cols-[2.75rem_1fr_3.25rem] items-center gap-2 px-3 py-2 ${
                              isMe ? 'bg-[#0E6187]/10' : 'bg-white'
                            }`}>
                              <span className={`mx-auto flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${rankStylesLms(e.rank)}`}>
                                {e.rank}
                              </span>
                              <div className="min-w-0">
                                <p className={`truncate text-[11px] font-semibold ${isMe ? 'text-[#0E6187]' : 'text-slate-700'}`}>
                                  {e.nama}{isMe && <span className="ml-1 text-[9px] font-bold text-[#0E6187]">(Kamu)</span>}
                                </p>
                                <p className="truncate text-[9.5px] text-slate-400">
                                  {[e.cabang, e.batch, e.level != null && `Level ${e.level}`].filter(Boolean).join(' · ') || '-'}
                                </p>
                              </div>
                              <span className="justify-self-end rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">{e.best_score}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {lb.my_rank != null && lb.my_score != null && !lb.entries.some(e => e.nama === user?.name) && (
                      <div className="grid grid-cols-[2.75rem_1fr_3.25rem] items-center gap-2 bg-[#0E6187]/10 px-3 py-2">
                        <span className="mx-auto flex h-5 w-5 items-center justify-center rounded-md bg-slate-700 text-[10px] font-bold text-white">{lb.my_rank}</span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold text-[#0E6187]">
                            {user?.name || 'Kamu'} <span className="text-[9px] font-bold">(Kamu)</span>
                          </p>
                          <p className="text-[9.5px] text-slate-400">Peringkat #{lb.my_rank} dari keseluruhan peserta</p>
                        </div>
                        <span className="justify-self-end rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">{lb.my_score}</span>
                      </div>
                    )}
                    {lb.entries.length === 0 && lb.my_score == null && (
                      <p className="bg-white py-3 text-center text-[11px] text-slate-400">Belum ada peserta mengerjakan</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
