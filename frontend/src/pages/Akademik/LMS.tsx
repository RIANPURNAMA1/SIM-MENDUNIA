import { useState, useEffect } from 'react'
import {
  BookOpen, Play, CheckCircle, Circle, ChevronLeft, ChevronRight,
  FileText, Video, ArrowLeft, Clock, BarChart3, ListChecks
} from 'lucide-react'
import { lmsApi } from '../../services/api'

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
  sort: number
}

interface LmsProgress {
  completed_at: string | null
}

export default function LMS() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonDetail, setLessonDetail] = useState<{ completed: boolean; completed_at: string | null } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    lmsApi.courses().then(res => {
      setCourses(res.data.courses || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const openCourse = (course: Course) => {
    setSelectedCourse(course)
    setSelectedLesson(null)
    setLessonDetail(null)
    lmsApi.courseDetail(course.id).then(res => {
      setLessons(res.data.course?.lessons || [])
      setCompletedLessonIds(res.data.completed_lesson_ids || [])
    }).catch(() => {})
  }

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setDetailLoading(true)
    setLessonDetail(null)
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

  const goBack = () => {
    if (selectedLesson) {
      setSelectedLesson(null)
      setLessonDetail(null)
    } else if (selectedCourse) {
      setSelectedCourse(null)
      setLessons([])
      setCompletedLessonIds([])
    }
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match?.[1] || null
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0D1F3C] rounded-full animate-spin" />
      </div>
    )
  }

  if (selectedLesson && selectedCourse) {
    const progress = completedLessonIds.length
    const total = lessons.length

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D1F3C] transition-colors">
            <ArrowLeft size={16} />
            Kembali
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">{selectedCourse.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {lessonDetail && lessonDetail.completed && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle size={16} />
                  Terselesaikan
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedLesson.title}</h2>

                {selectedLesson.video_url && (
                  <div className="mb-6 aspect-video bg-black rounded-xl overflow-hidden">
                    {getYouTubeId(selectedLesson.video_url) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(selectedLesson.video_url)}`}
                        className="w-full h-full"
                        allowFullScreen
                        title={selectedLesson.title}
                      />
                    ) : (
                      <video controls className="w-full h-full">
                        <source src={selectedLesson.video_url} />
                      </video>
                    )}
                  </div>
                )}

                {selectedLesson.content && (
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                )}

                {!selectedLesson.content && !selectedLesson.video_url && (
                  <p className="text-gray-400 italic">Belum ada materi untuk pelajaran ini.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {lessonDetail?.completed ? (
                    <CheckCircle size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-gray-300" />
                  )}
                  <span className="font-medium text-gray-700">
                    {lessonDetail?.completed ? 'Selesai' : 'Belum selesai'}
                  </span>
                </div>
                <button
                  onClick={() => toggleComplete(selectedLesson.id, !!lessonDetail?.completed)}
                  disabled={completing || !lessonDetail}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    lessonDetail?.completed
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-[#0D1F3C] text-white hover:bg-[#0D1F3C]/90'
                  } disabled:opacity-50`}
                >
                  {completing ? 'Memproses...' : lessonDetail?.completed ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700">Navigasi Pelajaran</span>
                <span className="text-sm text-gray-400">{progress} / {total} selesai</span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const idx = lessons.findIndex(l => l.id === selectedLesson.id)
                    if (idx > 0) openLesson(lessons[idx - 1])
                  }}
                  disabled={lessons.findIndex(l => l.id === selectedLesson.id) === 0}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D1F3C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                  Sebelumnya
                </button>
                <button
                  onClick={() => {
                    const idx = lessons.findIndex(l => l.id === selectedLesson.id)
                    if (idx < lessons.length - 1) openLesson(lessons[idx + 1])
                  }}
                  disabled={lessons.findIndex(l => l.id === selectedLesson.id) === lessons.length - 1}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D1F3C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                    <ListChecks size={15} />
                  </span>
                  Daftar Pelajaran
                </h3>
              </div>
              <div className="p-3 space-y-1 max-h-[500px] overflow-y-auto">
                {lessons.map((lesson, idx) => {
                  const isActive = lesson.id === selectedLesson.id
                  const isCompleted = completedLessonIds.includes(lesson.id)
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => openLesson(lesson)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive ? 'bg-[#0D1F3C]/10 text-[#0D1F3C] font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {idx + 1}
                        </span>
                      )}
                      <span className="line-clamp-1">{lesson.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                  <BarChart3 size={15} />
                </span>
                Progress
              </h3>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Kemajuan</span>
                <span className="font-semibold text-gray-700">{Math.round((progress / Math.max(total, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#0D1F3C] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((progress / Math.max(total, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{progress} dari {total} pelajaran selesai</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedCourse) {
    const progress = completedLessonIds.length
    const total = lessons.length

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D1F3C] transition-colors">
            <ArrowLeft size={16} />
            Semua Kursus
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">{selectedCourse.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedCourse.title}</h2>
                {selectedCourse.description && (
                  <div className="text-gray-600 text-sm leading-relaxed space-y-2 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_a]:text-blue-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: selectedCourse.description }} />
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                    <ListChecks size={15} />
                  </span>
                  Daftar Pelajaran ({lessons.length})
                </h3>
              </div>
              {lessons.length === 0 ? (
                <div className="p-10 text-center">
                  <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">Belum ada pelajaran dalam kursus ini.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {lessons.map((lesson, idx) => {
                    const isCompleted = completedLessonIds.includes(lesson.id)
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => openLesson(lesson)}
                        className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shrink-0 ${
                          isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isCompleted ? <CheckCircle size={18} /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{lesson.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {lesson.video_url && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Video size={12} />
                                Video
                              </span>
                            )}
                            {lesson.content && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <FileText size={12} />
                                Materi
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                  <BarChart3 size={15} />
                </span>
                Progress Kursus
              </h3>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Kemajuan</span>
                <span className="font-semibold text-gray-700">{Math.round((progress / Math.max(total, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#0D1F3C] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((progress / Math.max(total, 1)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{progress} dari {total} pelajaran selesai</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                  <Clock size={15} />
                </span>
                Info Kursus
              </h3>
              <div className="space-y-2 text-sm">
                {selectedCourse.level && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level</span>
                    <span className="font-medium text-gray-700">Level {selectedCourse.level}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Pelajaran</span>
                  <span className="font-medium text-gray-700">{total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Terselesaikan</span>
                  <span className="font-medium text-emerald-600">{progress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0D1F3C] text-white">
            <BookOpen size={18} />
          </span>
          Learning Management System
        </h1>
        <p className="text-sm text-gray-500 mt-1">Akses materi pembelajaran dan pantau progress belajar Anda</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Kursus</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Belum ada kursus yang tersedia untuk Anda. Silakan hubungi admin untuk informasi lebih lanjut.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => openCourse(course)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all text-left group"
            >
              <div className="h-36 bg-gradient-to-br from-[#0D1F3C] to-[#1a3355] flex items-center justify-center relative">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen size={40} className="text-white/40" />
                )}
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                    {course.level ? `Level ${course.level}` : 'Umum'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-800 group-hover:text-[#0D1F3C] transition-colors">{course.title}</h3>
                {course.description && (
                  <div className="text-sm text-gray-400 mt-1.5 line-clamp-2 [&_*]:inline" dangerouslySetInnerHTML={{ __html: course.description }} />
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Play size={12} />
                    {course.lessons_count} Pelajaran
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
