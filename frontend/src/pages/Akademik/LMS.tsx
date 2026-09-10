import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen, Play, PlayCircle, Check, CheckCircle, Circle, ChevronLeft, ChevronRight,
  FileText, Video, ArrowLeft, Clock, ListChecks, Lock, FileQuestion,
  ClipboardList, Upload, Download, Send, GraduationCap, Star, Award, AlertTriangle, X, Trash2,
  CalendarCheck, LayoutDashboard, Wallet, User, Trophy,
} from 'lucide-react'
import { lmsApi, quizApi, APP_URL } from '../../services/api'
import LessonSlidesViewer from '../../components/LessonSlidesViewer'
import TrackedVideo from '../../components/TrackedVideo'
import Swal from 'sweetalert2'
import { useAuth } from '../../contexts/AuthContext'

interface Course {
  id: number
  title: string
  description: string
  image: string | null
  level: string | null
  category: { id: number; name: string } | null
  lessons_count: number
  sort: number
}

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
  title: string
  description: string | null
  file_path: string | null
  file_name: string | null
  due_date: string | null
  max_score: number | null
  submission: AssignmentSubmission | null
}

type ViewType = 'courses' | 'course-detail' | 'lesson' | 'quiz-detail'

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
  const [activeCategory, setActiveCategory] = useState('all')
  const courseCategories = useMemo(() =>
    Array.from(new Set(courses.map(c => c.category?.name).filter((c): c is string => !!c))),
    [courses]
  )
  const visibleCourses = activeCategory === 'all'
    ? courses
    : courses.filter(c => c.category?.name === activeCategory)
  const [view, setView] = useState<ViewType>('courses')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonDetail, setLessonDetail] = useState<{ completed: boolean; completed_at: string | null; progress: LessonProgress | null; slides?: { id: number; file_name: string; url: string }[] } | null>(null)
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgress>>({})
  const [, setDetailLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const lastActivityRef = useRef(Date.now())
  const autoCompletedRef = useRef<number | null>(null)
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments'>('lessons')
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState<number | null>(null)
  const [submitNote, setSubmitNote] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [courseQuizzes, setCourseQuizzes] = useState<CourseQuiz[]>([])
  const [quizLoading, setQuizLoading] = useState(false)

  useEffect(() => {
    lmsApi.courses().then(res => {
      setCourses(res.data.courses || [])
    }).catch(() => {}).finally(() => setLoading(false))
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
      setCourseQuizzes(all.filter(p => p.course_id === courseId))
    }).catch(() => setCourseQuizzes([])).finally(() => setQuizLoading(false))
  }

  const openCourse = (course: Course) => {
    setSelectedCourse(course)
    setSelectedLesson(null)
    setLessonDetail(null)
    setActiveTab('lessons')
    setView('course-detail')
    setLoadedCourseId(course.id)
    loadAssignmentsForCourse(course.id)
    loadCourseQuizzes(course.id)
    lmsApi.courseDetail(course.id).then(res => {
      setLessons(res.data.course?.lessons || [])
      setCompletedLessonIds(res.data.completed_lesson_ids || [])
      setLessonProgressMap(res.data.lesson_progress || {})
    }).catch(() => {})
  }

  const handleCourseClick = (course: Course) => {
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

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
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
      if (selectedLesson?.id !== id) {
        setSelectedLesson(lesson)
        setLessonDetail(null)
        setDetailLoading(true)
        setView('lesson')
        loadLessonDetail(id)
      }
    }
  }, [lessonId, lessons, selectedCourse, selectedLesson])

  const toggleComplete = (lessonId: number, isCompleted: boolean) => {
    setCompleting(true)
    const action = isCompleted
      ? lmsApi.uncompleteLesson(lessonId)
      : lmsApi.completeLesson(lessonId)

    action.then(() => {
      if (isCompleted) {
        setCompletedLessonIds(prev => prev.filter(id => id !== lessonId))
        setLessonDetail(prev => prev ? { ...prev, completed: false, completed_at: null } : prev)
      } else {
        setCompletedLessonIds(prev => [...prev, lessonId])
        setLessonDetail(prev => prev ? { ...prev, completed: true, completed_at: new Date().toISOString() } : prev)
      }
    }).catch(err => {
      if (!isCompleted && err?.response?.status === 422 && err?.response?.data?.syarat) {
        Swal.fire('Syarat belum terpenuhi',
          'Tonton video hingga selesai dan baca modul terlebih dahulu agar activity berubah hijau.',
          'warning')
      }
    }).finally(() => setCompleting(false))
  }

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
    const lp = lessonDetail?.progress
    const vg = !selectedLesson.video_url || !!lp?.video_green
    const rg = !selectedLesson.content || !!lp?.read_green
    if (vg && rg && !lessonDetail?.completed && autoCompletedRef.current !== lessonId) {
      autoCompletedRef.current = lessonId
      lmsApi.completeLesson(lessonId).then(() => {
        setCompletedLessonIds(prev => prev.includes(lessonId) ? prev : [...prev, lessonId])
        setLessonDetail(prev => prev ? { ...prev, completed: true, completed_at: new Date().toISOString() } : prev)
      }).catch(err => {
        if (err?.response?.status === 422) autoCompletedRef.current = null
      })
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
        setView(courseQuizzes.length > 0 ? 'quiz-detail' : 'course-detail')
        navigate(courseQuizzes.length > 0
          ? `/siswa-dashboard/lms/${selectedCourse.id}/quiz`
          : `/siswa-dashboard/lms/${selectedCourse.id}`)
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
            disabled={!unlocked || attemptsMaxed}
            onClick={(e) => { e.stopPropagation(); navigate(`/siswa-dashboard/quiz/${q.id}`) }}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              unlocked && !attemptsMaxed
                ? 'bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
    const prog = lessonDetail?.progress
    const videoGreen = !selectedLesson.video_url || !!prog?.video_green
    const readGreen = !selectedLesson.content || !!prog?.read_green

    return (
      <div className="min-h-screen bg-[#f2f4f8] pb-32 lg:pb-8">
        {/* Sticky Header */}
        <header className="bg-white/85 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100">
          <div className="max-w-lg lg:max-w-5xl mx-auto px-4 py-2.5">
            <div className="flex items-center gap-3">
              <button onClick={goBack}
                className="flex items-center justify-center w-9 h-9 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all shrink-0">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Materi</p>
                <h1 className="text-sm font-bold text-slate-900 truncate">{selectedLesson.title}</h1>
              </div>
              <span className="flex items-center justify-center min-w-[3.2rem] px-2.5 py-1 rounded-md bg-[#0E6187]/10 text-[#0E6187] text-[10px] font-black shrink-0">
                {currentIdx + 1}/{total}
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-lg lg:max-w-5xl mx-auto px-4 pt-4 pb-4 lg:py-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-md bg-gradient-to-br from-[#0E6187] via-[#12729f] to-[#0f2840] shadow-lg shadow-[#0E6187]/20 mb-4">
            <div className="absolute -right-[3rem] -top-[3rem] w-44 h-44 rounded-full bg-white/5" />
            <div className="absolute -right-[5rem] -bottom-[4rem] w-56 h-56 rounded-full bg-white/5" />
            <div className="relative p-5">
              {selectedCourse.category && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 backdrop-blur text-white text-[10px] font-bold mb-2.5">
                  <BookOpen size={10} className="text-emerald-300" /> {selectedCourse.category.name}
                </span>
              )}
              <h2 className="text-lg font-black text-white leading-snug">{selectedLesson.title}</h2>
              <p className="text-[10px] text-white/60 mt-1 flex items-center gap-1.5">
                <GraduationCap size={11} /> {selectedCourse.title}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium text-white/70">Progress kursus</span>
                  <span className="text-[11px] font-black text-white">{getProgressPercent()}%</span>
                </div>
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-300 rounded-full transition-all duration-700"
                    style={{ width: `${getProgressPercent()}%` }} />
                </div>
                <p className="text-[9px] text-white/50 mt-1.5">{progress} dari {total} pelajaran selesai</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
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
                  {lessonDetail?.completed || (videoGreen && readGreen) ? (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                      <Check size={11} /> {lessonDetail?.completed ? 'Selesai' : 'Activity hijau'}
                    </span>
                  ) : null}
                </div>

                {selectedLesson.video_url && (
                  <div className="bg-black">
                    <TrackedVideo
                      url={selectedLesson.video_url}
                      title={selectedLesson.title}
                      progress={lessonDetail?.progress || null}
                      onHeartbeat={(currentTime, duration) => sendVideoHeartbeat(selectedLesson.id, currentTime, duration)} />
                    {lessonDetail?.progress && lessonDetail.progress.video_percent > 0 && (
                      <div className="px-3 py-2 flex items-center gap-2 bg-[#0E6187]/95">
                        <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-300 rounded-full transition-all"
                            style={{ width: `${lessonDetail.progress.video_percent}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${lessonDetail.progress.video_green ? 'text-emerald-300' : 'text-white/70'}`}>
                          {lessonDetail.progress.video_green ? 'Video selesai' : `${Math.round(lessonDetail.progress.video_percent)}%`}
                        </span>
                      </div>
                    )}
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
              </div>

              {/* Completion Card */}
              <div className="bg-white rounded-md shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-md flex items-center justify-center shrink-0 ${
                    lessonDetail?.completed ? 'bg-emerald-50' : 'bg-[#0E6187]/10'
                  }`}>
                    {lessonDetail?.completed ? (
                      <CheckCircle size={22} className="text-emerald-500" />
                    ) : (
                      <ClipboardList size={22} className="text-[#0E6187]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">
                      {lessonDetail?.completed ? 'Pelajaran selesai' : 'Tandai Selesai'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      {lessonDetail?.completed
                        ? `Diselesaikan ${new Date(lessonDetail.completed_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : 'Tonton video & baca modul sampai activity hijau, lalu tandai selesai untuk membuka quiz'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleComplete(selectedLesson.id, !!lessonDetail?.completed)}
                  disabled={completing || !lessonDetail || (!lessonDetail.completed && !(videoGreen && readGreen))}
                  className={`w-full flex items-center justify-center gap-2 rounded-md py-3.5 text-sm font-black transition-all active:scale-[0.98] ${
                    lessonDetail?.completed
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/25 disabled:opacity-50 disabled:shadow-none'
                  }`}>
                  {completing ? 'Memproses...' : lessonDetail?.completed ? (
                    <span className="flex items-center gap-2"><X size={15} /> Tandai Batal Selesai</span>
                  ) : (
                    <span className="flex items-center gap-2"><Check size={15} strokeWidth={3} /> Tandai Selesai</span>
                  )}
                </button>

                {!lessonDetail?.completed && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.14em]">Syarat activity hijau</span>
                      <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md ${
                        videoGreen && readGreen ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {videoGreen && readGreen ? <Check size={10} strokeWidth={3} /> : <AlertTriangle size={10} />}
                        {videoGreen && readGreen ? 'Terpenuhi' : 'Belum terpenuhi'}
                      </span>
                    </div>

                    <div className={`rounded-md px-4 py-3 ${videoGreen ? 'bg-emerald-50/70' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${videoGreen ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                          {videoGreen ? <Check size={14} strokeWidth={3} /> : <PlayCircle size={14} />}
                        </div>
                        <span className="flex-1 text-[11px] font-bold text-slate-700">Tonton video</span>
                        <span className={`text-[10px] font-bold ${videoGreen ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {videoGreen ? 'Selesai' : selectedLesson.video_url ? `${Math.round(prog?.video_percent || 0)}%` : 'Tidak ada video'}
                        </span>
                      </div>
                      {selectedLesson.video_url && !videoGreen && (
                        <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0E6187] to-sky-400 rounded-full transition-all"
                            style={{ width: `${Math.round(prog?.video_percent || 0)}%` }} />
                        </div>
                      )}
                    </div>

                    <div className={`rounded-md px-4 py-3 ${readGreen ? 'bg-emerald-50/70' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${readGreen ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                          {readGreen ? <Check size={14} strokeWidth={3} /> : <BookOpen size={14} />}
                        </div>
                        <span className="flex-1 text-[11px] font-bold text-slate-700">Baca modul</span>
                        <span className={`text-[10px] font-bold ${readGreen ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {readGreen ? 'Selesai' : selectedLesson.content ? `${Math.min(prog?.read_seconds || 0, 30)} / ${30} detik` : 'Tidak ada modul'}
                        </span>
                      </div>
                      {selectedLesson.content && !readGreen && (
                        <div className="h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#0E6187] to-sky-400 rounded-full transition-all"
                            style={{ width: `${Math.min((prog?.read_seconds || 0) / 30, 1) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-md shadow-sm p-3 flex items-center gap-2">
                <button
                  onClick={() => { if (currentIdx > 0) openLesson(lessons[currentIdx - 1]) }}
                  disabled={currentIdx === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                  <ChevronLeft size={15} /> Sebelumnya
                </button>
                <span className="shrink-0 text-[10px] font-black text-slate-300 px-1">{currentIdx + 1}/{total}</span>
                {currentIdx === lessons.length - 1 && courseQuizzes.length > 0 ? (
                  <button
                    onClick={() => selectedCourse?.id && navigate(`/siswa-dashboard/lms/${selectedCourse.id}/quiz`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md text-xs font-black bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/20 transition-colors">
                    Mulai Quiz <ListChecks size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => { if (currentIdx < lessons.length - 1) openLesson(lessons[currentIdx + 1]) }}
                    disabled={currentIdx === lessons.length - 1}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md text-xs font-black bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    Selanjutnya <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Daftar Pelajaran */}
              <div className="bg-white rounded-md shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-slate-800 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                      <ListChecks size={13} className="text-[#0E6187]" />
                    </span>
                    Daftar Pelajaran
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">{progress}/{total} selesai</span>
                </div>
                <div className="p-2 space-y-1 max-h-[55vh] overflow-y-auto">
                  {lessons.map((lesson, idx) => {
                    const isActive = lesson.id === selectedLesson.id
                    const isCompleted = completedLessonIds.includes(lesson.id)
                    const lp = lessonProgressMap[lesson.id]
                    const lessonGreen = (!lesson.video_url || lp?.video_green) && (!lesson.content || lp?.read_green)
                    return (
                      <button key={lesson.id} onClick={() => openLesson(lesson)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-all ${
                          isActive ? 'bg-[#0E6187]/10' : 'hover:bg-slate-50'
                        }`}>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[10px] font-black ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : lessonGreen
                              ? 'bg-emerald-500/85 text-white'
                              : isActive
                                ? 'bg-[#0E6187] text-white'
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                          {isCompleted ? <CheckCircle size={14} /> : lessonGreen ? <Check size={14} strokeWidth={3} /> : idx + 1}
                        </div>
                        <span className={`truncate flex-1 text-[11px] font-semibold ${isActive ? 'text-[#0E6187]' : 'text-slate-600'}`}>{lesson.title}</span>
                        {!lesson.video_url && !lesson.content ? null : (
                          <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${lessonGreen ? 'bg-emerald-500' : 'bg-slate-200'}`} title={lessonGreen ? 'Activity hijau' : 'Activity belum hijau'} />
                        )}
                      </button>
                    )
                  })}
                </div>
                {courseQuizzes.length > 0 && (
                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={() => selectedCourse?.id && navigate(`/siswa-dashboard/lms/${selectedCourse.id}/quiz`)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-xs font-black bg-[#0E6187]/10 text-[#0E6187] hover:bg-[#0E6187]/20 transition-colors">
                      <Play size={13} /> Lanjut mengerjakan Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ Mobile Bottom Action Bar ============ */}
        <nav className="fixed inset-x-0 bottom-0 z-30 lg:hidden bg-white/95 backdrop-blur border-t border-slate-100 px-4 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                onClick={() => { if (currentIdx < lessons.length - 1) openLesson(lessons[currentIdx + 1]) }}
                disabled={currentIdx === lessons.length - 1}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-md text-[11px] font-black bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/25 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-[0.98] transition-all">
                Selanjutnya <ChevronRight size={14} />
              </button>
            )}
          </div>
        </nav>
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
                  const lp = lessonProgressMap[lesson.id]
                  const green = (!lesson.video_url || lp?.video_green) && (!lesson.content || lp?.read_green)
                  const done = completedLessonIds.includes(lesson.id)
                  return (
                    <span key={lesson.id} className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ${
                      done ? 'bg-emerald-50 text-emerald-500' : green ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {done || green ? <Check size={10} /> : <span>{idx + 1}</span>}
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
      </div>
    )
  }

  // ==================== COURSE DETAIL VIEW ====================
  if (view === 'course-detail' && selectedCourse) {
    const progress = completedLessonIds.length
    const total = lessons.length
    const percent = getProgressPercent()
    const isComplete = percent === 100

    return (
      <>
      <div className="min-h-screen bg-[#f0f2f5] pb-24 animate-fade-up">
        {/* Hero */}
        <div className="relative h-52 bg-gradient-to-br from-[#0E6187] to-[#1a3355] overflow-hidden">
          {selectedCourse.image && (
            <img src={`${APP_URL}/storage/${selectedCourse.image}`} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E6187] via-[#0E6187]/60 to-transparent" />
          <div className="relative max-w-lg mx-auto px-4 h-full flex flex-col justify-end pb-6">
            <button onClick={goBack}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white transition-colors mb-4 self-start">
              <ArrowLeft size={12} /> Semua Kursus
            </button>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{selectedCourse.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {selectedCourse.level && (
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/15 text-white/80">
                      Level {selectedCourse.level}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isComplete ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
                  }`}>
                    {isComplete ? 'Selesai' : `${progress} dari ${total} selesai`}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-3xl font-black ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
                  {percent}%
                </div>
                <p className="text-[10px] font-bold text-white/50 mt-0.5">Progres</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 mt-4">
          <div className="flex gap-1 bg-gray-100 rounded-md p-1">
            {([
              { key: 'lessons' as const, label: 'Pelajaran', icon: ListChecks, count: lessons.length },
              { key: 'assignments' as const, label: 'Tugas', icon: ClipboardList, count: assignments.length },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                <tab.icon size={14} />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  activeTab === tab.key ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/50 text-gray-400'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 mt-3">
          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            courseQuizzes.length > 0 ? (
              <div className="space-y-3">
                {courseQuizzes.map(q => renderQuizCard(q))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {lessons.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Belum ada pelajaran</p>
                    <p className="text-xs text-gray-400 mt-1">Pelajaran akan segera tersedia</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {lessons.map((lesson, idx) => {
                      const isCompleted = completedLessonIds.includes(lesson.id)
                      const lp = lessonProgressMap[lesson.id]
                      const lessonGreen = (!lesson.video_url || lp?.video_green) && (!lesson.content || lp?.read_green)
                      return (
                        <button key={lesson.id} onClick={() => openLesson(lesson)}
                          className="w-full text-left flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                          <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : lessonGreen
                                ? 'bg-emerald-500/85 text-white'
                                : 'bg-gray-100 text-gray-400 group-hover:bg-[#0E6187]/10 group-hover:text-[#0E6187]'
                          } transition-colors`}>
                            {isCompleted ? <CheckCircle size={16} /> : lessonGreen ? <Check size={15} strokeWidth={3} /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#0E6187] transition-colors">
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {lesson.video_url && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
                                  <Video size={10} /> Video
                                </span>
                              )}
                              {lesson.content && (
                                <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400">
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
                          <div className="shrink-0 flex items-center gap-2">
                            {isCompleted && (
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">Selesai</span>
                            )}
                            {!isCompleted && lessonGreen && (
                              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">Activity hijau</span>
                            )}
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-[#0E6187] transition-colors" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
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
      {showSubmitForm && (() => {
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
      })()}

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
              <h1 className="text-xl font-bold">LMS</h1>
              <p className="mt-0.5 text-[13px] text-teal-100">Materi pembelajaran dan progress belajar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Course Grid */}
      <div className="mx-auto mt-6 max-w-lg space-y-4 px-4 pt-2">
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
                  <BookOpen size={26} className="text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-800">Tidak Ada Kursus di Kategori Ini</h3>
                <p className="text-xs text-gray-400 mt-1">Pilih kategori lain untuk melihat kursusnya.</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCourses.map(course => (
                <button key={course.id} onClick={() => handleCourseClick(course)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all text-left group">
                  <div className="h-24 sm:h-28 lg:h-32 bg-gradient-to-br from-[#0E6187] to-[#1a3355] flex items-center justify-center relative overflow-hidden">
                    {course.image ? (
                      <img src={`${APP_URL}/storage/${course.image}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <BookOpen size={28} className="text-white/15" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {course.category && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-block rounded-full bg-[#0E6187] px-2 py-0.5 text-[8px] font-bold text-white shadow-md ring-1 ring-white/40">
                          {course.category.name}
                        </span>
                      </div>
                    )}
                    {course.level && (
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-white/20 text-white backdrop-blur-sm">
                          Level {course.level}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-[11px] sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.6em] sm:min-h-0 group-hover:text-[#0E6187] transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <div className="text-[8px] sm:text-[11px] text-gray-400 mt-1 line-clamp-1 sm:line-clamp-2 leading-relaxed [&_*]:inline"
                        title={course.description.replace(/<[^>]*>/g, ' ')}
                        dangerouslySetInnerHTML={{ __html: course.description }} />
                    )}
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold text-slate-400 whitespace-nowrap">
                        <Play size={10} /> {course.lessons_count} Pel
                      </span>
                      <span className="flex items-center gap-0.5 text-[8px] sm:text-[10px] font-bold text-[#0E6187] whitespace-nowrap">
                        Buka <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
          </>
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

      {/* ============ Rank Quiz Modal ============ */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" onClick={() => setShowRankModal(false)}>
          <div className="flex h-full w-full flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Trophy size={16} className="text-amber-500" /> Rank Quiz
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">Peringkat nilai terbaik setiap paket soal</p>
              </div>
              <button onClick={() => setShowRankModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="mx-auto w-full max-w-2xl flex-1 space-y-3 overflow-y-auto p-5">
              {rankLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-[#0E6187] animate-spin" />
                  <p className="mt-3 text-xs font-medium">Memuat peringkat...</p>
                </div>
              ) : rankData.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <Trophy size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Belum ada peringkat</p>
                  <p className="mt-1 text-[11px] text-slate-400">Peringkat akan muncul setelah kandidat mengerjakan quiz</p>
                </div>
              ) : (
                rankData.map(lb => (
                  <div key={lb.paket_id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                        <Trophy size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">{lb.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {[lb.course, lb.level && `Level ${lb.level}`].filter(Boolean).join(' · ') || 'Quiz'}
                        </p>
                      </div>
                      {lb.max_score != null && (
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">Max {lb.max_score} poin</span>
                      )}
                    </div>
                    <div className="mt-2.5 space-y-1">
                      {lb.entries.map(e => {
                        const isMe = e.nama === user?.name
                        return (
                          <div key={e.siswa_id} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 ${
                            isMe ? 'bg-[#0E6187]/10 ring-1 ring-[#0E6187]/30' : 'bg-white'
                          }`}>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${rankStylesLms(e.rank)}`}>
                              {e.rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-[11px] font-semibold ${isMe ? 'text-[#0E6187]' : 'text-slate-700'}`}>
                                {e.nama}{isMe && <span className="ml-1 text-[9px] font-bold text-[#0E6187]">(Kamu)</span>}
                              </p>
                              <p className="text-[9.5px] text-slate-400">
                                {[e.cabang, e.batch, e.level != null && `Level ${e.level}`].filter(Boolean).join(' · ') || '-'}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">{e.best_score}</span>
                          </div>
                        )
                      })}
                      {lb.my_rank != null && lb.my_score != null && !lb.entries.some(e => e.nama === user?.name) && (
                        <div className="flex items-center gap-2.5 rounded-xl bg-[#0E6187]/10 ring-1 ring-[#0E6187]/30 px-2.5 py-1.5">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">#{lb.my_rank}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold text-[#0E6187]">
                              {user?.name || 'Kamu'} <span className="text-[9px] font-bold">(Kamu)</span>
                            </p>
                            <p className="text-[9.5px] text-slate-400">Peringkat #{lb.my_rank} dari keseluruhan peserta</p>
                          </div>
                          <span className="shrink-0 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">{lb.my_score}</span>
                        </div>
                      )}
                      {lb.entries.length === 0 && lb.my_score == null && (
                        <p className="py-3 text-center text-[11px] text-slate-400">Belum ada peserta mengerjakan</p>
                      )}
                    </div>
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
