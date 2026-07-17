import { useState, useEffect } from 'react'
import {
  BookOpen, Play, CheckCircle, Circle, ChevronLeft, ChevronRight,
  FileText, Video, ArrowLeft, Clock, BarChart3, ListChecks,
  ClipboardList, Upload, Download, Send, GraduationCap, Star, Award, AlertTriangle, X, Trash2
} from 'lucide-react'
import { lmsApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

interface Course {
  id: number
  title: string
  description: string
  image: string | null
  level: string | null
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

type ViewType = 'courses' | 'course-detail' | 'lesson'

export default function LMS() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewType>('courses')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonDetail, setLessonDetail] = useState<{ completed: boolean; completed_at: string | null } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments'>('lessons')
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState<number | null>(null)
  const [submitNote, setSubmitNote] = useState('')
  const [submitFile, setSubmitFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    lmsApi.courses().then(res => {
      setCourses(res.data.courses || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadAssignmentsForCourse = (courseId: number) => {
    setAssignLoading(true)
    lmsApi.courseAssignments(courseId).then(res => {
      setAssignments(res.data.assignments || [])
    }).catch(() => setAssignments([])).finally(() => setAssignLoading(false))
  }

  const openCourse = (course: Course) => {
    setSelectedCourse(course)
    setSelectedLesson(null)
    setLessonDetail(null)
    setActiveTab('lessons')
    setView('course-detail')
    loadAssignmentsForCourse(course.id)
    lmsApi.courseDetail(course.id).then(res => {
      setLessons(res.data.course?.lessons || [])
      setCompletedLessonIds(res.data.completed_lesson_ids || [])
    }).catch(() => {})
  }

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setDetailLoading(true)
    setLessonDetail(null)
    setView('lesson')
    lmsApi.lessonDetail(lesson.id).then(res => {
      setLessonDetail({
        completed: res.data.completed,
        completed_at: res.data.completed_at,
      })
    }).catch(() => {}).finally(() => setDetailLoading(false))
  }

  const toggleComplete = (lessonId: number, isCompleted: boolean) => {
    setCompleting(true)
    const action = isCompleted
      ? lmsApi.uncompleteLesson(lessonId)
      : lmsApi.completeLesson(lessonId)

    action.then(() => {
      if (isCompleted) {
        setCompletedLessonIds(prev => prev.filter(id => id !== lessonId))
        setLessonDetail({ completed: false, completed_at: null })
      } else {
        setCompletedLessonIds(prev => [...prev, lessonId])
        setLessonDetail({ completed: true, completed_at: new Date().toISOString() })
      }
    }).catch(() => {}).finally(() => setCompleting(false))
  }

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
      setView('course-detail')
    } else if (view === 'course-detail') {
      setSelectedCourse(null)
      setLessons([])
      setCompletedLessonIds([])
      setView('courses')
    }
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match?.[1] || null
  }

  const getProgressPercent = () => Math.round((completedLessonIds.length / Math.max(lessons.length, 1)) * 100)

  const getCourseProgress = (courseId: number) => {
    if (selectedCourse?.id === courseId && lessons.length > 0) {
      return { done: completedLessonIds.length, total: lessons.length }
    }
    return { done: 0, total: 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center pb-24">
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

    return (
      <div className="min-h-screen bg-[#F7F8FC]">
        {/* Sticky Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={goBack}
                className="flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-gray-700 transition-colors">
                <ArrowLeft size={12} /> Kembali
              </button>
              <span className="text-gray-300 text-[10px]">/</span>
              <span className="text-[11px] font-medium text-gray-400 truncate">{selectedCourse.title}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0E6187]/10 text-[#0E6187] text-[10px] font-bold shrink-0">
                  {currentIdx + 1}
                </span>
                <h1 className="text-sm font-bold text-gray-900 truncate">{selectedLesson.title}</h1>
              </div>
              <span className="text-[10px] font-bold text-gray-400">{currentIdx + 1}/{total}</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              {/* Video */}
              {selectedLesson.video_url && (
                <div className="bg-black rounded-2xl overflow-hidden shadow-lg">
                  {getYouTubeId(selectedLesson.video_url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(selectedLesson.video_url)}`}
                      className="w-full aspect-video" allowFullScreen title={selectedLesson.title} />
                  ) : (
                    <video controls className="w-full aspect-video">
                      <source src={selectedLesson.video_url} />
                    </video>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedLesson.title}</h2>
                  {selectedLesson.content ? (
                    <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed
                      [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4 [&_img]:shadow-sm
                      [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-xl
                      [&_a]:text-[#0069b0] [&_a]:underline
                      [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-3
                      [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2
                      [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                      [&_p]:mb-3 [&_ul]:mb-3 [&_ol]:mb-3 [&_li]:mb-1
                      [&_blockquote]:border-l-4 [&_blockquote]:border-[#0069b0]/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500"
                      dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                  ) : !selectedLesson.video_url ? (
                    <div className="text-center py-12">
                      <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">Belum ada materi untuk pelajaran ini.</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* File Attachment */}
              {selectedLesson.file_path && (
                <a href={`${APP_URL}/storage/${selectedLesson.file_path}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-[#0069b0]/30 hover:bg-[#0069b0]/5 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#0069b0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#0069b0] transition-colors">
                      {selectedLesson.file_name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      File Lampiran{selectedLesson.file_size ? ` - ${selectedLesson.file_size < 1024 * 1024 ? (selectedLesson.file_size / 1024).toFixed(1) + ' KB' : (selectedLesson.file_size / (1024 * 1024)).toFixed(1) + ' MB'}` : ''}
                    </p>
                  </div>
                  <Download size={16} className="text-gray-300 group-hover:text-[#0069b0] shrink-0 transition-colors" />
                </a>
              )}

              {/* Completion Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      lessonDetail?.completed ? 'bg-emerald-50' : 'bg-gray-50'
                    }`}>
                      {lessonDetail?.completed ? (
                        <CheckCircle size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} className="text-gray-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {lessonDetail?.completed ? 'Selesai' : 'Tandai Selesai'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {lessonDetail?.completed
                          ? `Diselesaikan ${new Date(lessonDetail.completed_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : 'Tandai pelajaran ini selesai setelah memahami materi'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleComplete(selectedLesson.id, !!lessonDetail?.completed)}
                    disabled={completing || !lessonDetail}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      lessonDetail?.completed
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-[#0E6187] text-white hover:bg-[#0E6187]/90 shadow-lg shadow-[#0E6187]/20'
                    } disabled:opacity-50`}>
                    {completing ? 'Memproses...' : lessonDetail?.completed ? 'Batal Selesai' : 'Selesai'}
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { if (currentIdx > 0) openLesson(lessons[currentIdx - 1]) }}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={14} /> Sebelumnya
                  </button>
                  <span className="text-[10px] font-bold text-gray-300">{currentIdx + 1} / {total}</span>
                  <button
                    onClick={() => { if (currentIdx < lessons.length - 1) openLesson(lessons[currentIdx + 1]) }}
                    disabled={currentIdx === lessons.length - 1}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                    Selanjutnya <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Progress */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Progress</span>
                  <span className="text-xs font-black text-[#0069b0]">{getProgressPercent()}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#0069b0] to-[#0089d0] h-full rounded-full transition-all duration-700"
                    style={{ width: `${getProgressPercent()}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">{progress} dari {total} selesai</p>
              </div>

              {/* Lesson List */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Daftar Pelajaran</h3>
                </div>
                <div className="p-1.5 space-y-0.5 max-h-[50vh] overflow-y-auto">
                  {lessons.map((lesson, idx) => {
                    const isActive = lesson.id === selectedLesson.id
                    const isCompleted = completedLessonIds.includes(lesson.id)
                    return (
                      <button key={lesson.id} onClick={() => openLesson(lesson)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all ${
                          isActive
                            ? 'bg-[#0E6187]/10 text-[#0E6187] font-bold'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isActive
                              ? 'bg-[#0E6187] text-white'
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? <CheckCircle size={10} /> : idx + 1}
                        </div>
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
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
      <div className="min-h-screen bg-[#F7F8FC] pb-24">
        {/* Hero */}
        <div className="relative h-52 bg-gradient-to-br from-[#0E6187] to-[#1a3355] overflow-hidden">
          {selectedCourse.image && (
            <img src={`${APP_URL}/storage/${selectedCourse.image}`} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E6187] via-[#0E6187]/60 to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 h-full flex flex-col justify-end pb-6">
            <button onClick={goBack}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white transition-colors mb-4 self-start">
              <ArrowLeft size={12} /> Semua Kursus
            </button>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{selectedCourse.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                  {selectedCourse.level && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white/80">
                      Level {selectedCourse.level}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { key: 'lessons' as const, label: 'Pelajaran', icon: ListChecks, count: lessons.length },
              { key: 'assignments' as const, label: 'Tugas', icon: ClipboardList, count: assignments.length },
            ]).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}>
                <tab.icon size={14} />
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/50 text-gray-400'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 mt-3">
          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
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
                    return (
                      <button key={lesson.id} onClick={() => openLesson(lesson)}
                        className="w-full text-left flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#0069b0]/10 group-hover:text-[#0069b0]'
                        } transition-colors`}>
                          {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#0069b0] transition-colors">
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
                              <span className="flex items-center gap-1 text-[10px] font-medium text-[#0069b0]">
                                <Download size={10} /> File
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Selesai</span>
                          )}
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-[#0069b0] transition-colors" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {assignLoading ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#0069b0]/10 border-t-[#0069b0] animate-spin" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Memuat tugas...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
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
                    <div key={a.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                      isPastDue && !hasSubmitted ? 'border-red-200' : isGraded ? 'border-emerald-200' : 'border-gray-200'
                    }`}>
                      {/* Top accent bar */}
                      <div className={`h-1 ${
                        isGraded ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : hasSubmitted ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : isPastDue ? 'bg-gradient-to-r from-red-400 to-red-500'
                              : 'bg-gradient-to-r from-[#0069b0] to-[#0088d4]'
                      }`} />

                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isGraded ? 'bg-emerald-50 text-emerald-500'
                              : hasSubmitted ? 'bg-amber-50 text-amber-500'
                                : 'bg-[#0069b0]/10 text-[#0069b0]'
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
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl shrink-0">
                              {sub.score}/{a.max_score || '?'}
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {a.max_score && (
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-[11px] font-bold">
                              <Star size={12} /> Skor Maks {a.max_score}
                            </span>
                          )}
                          {a.due_date && (
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                              isPastDue
                                ? 'bg-red-50 text-red-600'
                                : daysLeft !== null && daysLeft <= 2
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-[#0069b0]/10 text-[#0069b0]'
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
                            <span className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-[11px] font-bold">
                              <AlertTriangle size={12} /> Telah berakhir
                            </span>
                          )}
                        </div>

                        {/* File Lampiran Guru */}
                        {a.file_name && (
                          <a href={`${APP_URL}/storage/${a.file_path}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 mt-4 p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#0069b0]/30 hover:bg-[#0069b0]/5 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                              <FileText size={18} className="text-[#0069b0]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-800 group-hover:text-[#0069b0] transition-colors truncate">{a.file_name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">File Lampiran dari Guru</p>
                            </div>
                            <Download size={16} className="text-gray-300 group-hover:text-[#0069b0] shrink-0 transition-colors" />
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
                                className="flex items-center gap-2 mt-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#0069b0]/30 transition-all group">
                                <FileText size={14} className="text-[#0069b0] shrink-0" />
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#0069b0] truncate transition-colors">{sub.file_name}</span>
                                <Download size={12} className="text-gray-300 group-hover:text-[#0069b0] shrink-0 ml-auto transition-colors" />
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
                                className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-[#0069b0] to-[#0088d4] px-4 py-3 rounded-xl hover:from-[#004d7a] hover:to-[#0069b0] transition-all shadow-sm shadow-[#0069b0]/20">
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
                  <div className="w-9 h-9 rounded-xl bg-[#0069b0]/10 flex items-center justify-center">
                    <Upload size={16} className="text-[#0069b0]" />
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
                        : 'bg-[#0069b0]/10 text-[#0069b0]'
                    }`}>
                      <Clock size={10} />
                      {daysLeft !== null && daysLeft > 0 ? `${daysLeft} hari lagi` : hoursLeft !== null && hoursLeft > 0 ? `${hoursLeft} jam lagi` : 'Hari ini'}
                    </span>
                  )}
                </div>

                {/* File guru jika ada */}
                {assignment.file_name && (
                  <a href={`${APP_URL}/storage/${assignment.file_path}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#0069b0]/30 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-[#0069b0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-gray-700 truncate group-hover:text-[#0069b0] transition-colors">{assignment.file_name}</p>
                      <p className="text-[9px] text-gray-400">File dari guru</p>
                    </div>
                    <Download size={14} className="text-gray-300 group-hover:text-[#0069b0] shrink-0" />
                  </a>
                )}

                {/* Catatan */}
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1.5">Catatan <span className="text-gray-400 font-normal">(opsional)</span></label>
                  <textarea value={submitNote} onChange={e => setSubmitNote(e.target.value)}
                    placeholder="Tulis catatan untuk pengumpulan ini..." rows={3}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 resize-none transition-all placeholder:text-gray-300" />
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1.5">File Tugas <span className="text-red-400">*</span></label>
                  {submitFile ? (
                    <div className="flex items-center gap-3 p-3 bg-[#0069b0]/5 border-2 border-[#0069b0]/20 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-[#0069b0]" />
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
                    <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-[#0069b0]/30 hover:bg-gray-50 cursor-pointer transition-all">
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
                    className="flex-[2] text-xs font-bold text-white bg-gradient-to-r from-[#0069b0] to-[#0088d4] px-4 py-3 rounded-xl hover:from-[#004d7a] hover:to-[#0069b0] disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-sm shadow-[#0069b0]/20 flex items-center justify-center gap-1.5">
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

    </>
    )
  }

  // ==================== COURSE LIST VIEW ====================
  return (
    <div className="min-h-screen bg-[#F7F8FC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0E6187] to-[#1a3355] flex items-center justify-center">
                <GraduationCap size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Learning Management System</h1>
                <p className="text-[10px] text-gray-400 font-medium">Materi pembelajaran dan progress belajar</p>
              </div>
            </div>
            {courses.length > 0 && (
              <div className="flex items-center gap-3 text-center">
                <div className="px-3">
                  <p className="text-base font-black text-gray-900">{courses.length}</p>
                  <p className="text-[9px] font-bold text-gray-400">Kursus</p>
                </div>
                <div className="w-px h-6 bg-gray-200" />
                <div className="px-3">
                  <p className="text-base font-black text-gray-900">{courses.reduce((a, c) => a + c.lessons_count, 0)}</p>
                  <p className="text-[9px] font-bold text-gray-400">Pelajaran</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-5xl mx-auto px-4 pt-4">
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
              <BookOpen size={36} className="text-gray-300" />
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-2">Belum Ada Kursus</h2>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Belum ada kursus yang tersedia untuk Anda. Silakan hubungi pengajar atau admin untuk informasi lebih lanjut.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Semua Kursus</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(course => (
                <button key={course.id} onClick={() => openCourse(course)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 hover:border-gray-300 transition-all text-left group">
                  <div className="h-36 bg-gradient-to-br from-[#0E6187] to-[#1a3355] flex items-center justify-center relative overflow-hidden">
                    {course.image ? (
                      <img src={`${APP_URL}/storage/${course.image}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <BookOpen size={40} className="text-white/15" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {course.level && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white backdrop-blur-sm">
                          Level {course.level}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0069b0] transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <div className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed [&_*]:inline"
                        dangerouslySetInnerHTML={{ __html: course.description }} />
                    )}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <Play size={10} /> {course.lessons_count} Pelajaran
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
