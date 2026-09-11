import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, FileText, ListChecks, Plus, ChevronRight, HelpCircle,
  Download, Clock, ClipboardList, Check, Edit3, X, Trash2,
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { guruLmsApi, assignmentApi, APP_URL } from '../../services/api'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'
import LessonSlidesViewer from '../../components/LessonSlidesViewer'
import LessonMediaFields, { LessonSlideItem } from '../../components/LessonMediaFields'
import GuruPaketSoal from './GuruPaketSoal'

interface LessonDetail {
  id: number
  course_id: number
  title: string
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  paket_id: number | null
  paket?: { id: number; title: string; status: string; questions_count?: number; attempts_count?: number } | null
  slides?: { id: number; file_path: string; file_name?: string; url?: string }[]
  sort: number
  status: string
  course?: {
    id: number
    title: string
    level: string | null
    batch_id: number | null
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
}

const fmtFileSize = (bytes?: number | null) => {
  if (!bytes) return ''
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
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
  const [lessonTab, setLessonTab] = useState<'materi' | 'quiz' | 'tugas'>('materi')
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

  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', maxScore: '', description: '' })
  const [savingTask, setSavingTask] = useState(false)
  const [showQuizManager, setShowQuizManager] = useState(false)

  const loadLesson = (id: number) => guruLmsApi.lessonDetail(id).then(res => setLesson(res.data.lesson))
  const loadTasks = (courseId: number) => assignmentApi.list(courseId).then((t: any) => setTasks(t.data.assignments || [])).catch(() => setTasks([]))

  useEffect(() => {
    if (!lessonId) return
    setLoading(true)
    guruLmsApi.lessonDetail(Number(lessonId)).then(res => {
      const l = res.data.lesson
      setLesson(l)
      return loadTasks(l.course_id)
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

  const handleSaveTask = async () => {
    if (!lesson || !taskForm.title.trim()) return
    setSavingTask(true)
    try {
      const fd = new FormData()
      fd.append('course_id', String(lesson.course_id))
      fd.append('title', taskForm.title)
      if (taskForm.description) fd.append('description', taskForm.description)
      if (taskForm.dueDate) fd.append('due_date', taskForm.dueDate)
      if (taskForm.maxScore) fd.append('max_score', taskForm.maxScore)
      await assignmentApi.store(fd)
      setTaskForm({ title: '', dueDate: '', maxScore: '', description: '' })
      await loadTasks(lesson.course_id)
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
        await loadTasks(lesson.course_id)
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
  const attachedPaket = lesson.paket
  const coursePakets = lesson.course?.pakets || []
  const quizCount = attachedPaket ? 1 : (coursePakets.length > 0 ? coursePakets.length : undefined)

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
        <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
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
        <div className="flex gap-0 bg-white rounded-2xl border border-[#E5E7EF] overflow-hidden">
          {([
            { key: 'materi' as 'materi', label: 'Materi', icon: BookOpen, count: undefined as number | undefined },
            { key: 'quiz' as 'quiz', label: 'Quiz', icon: HelpCircle, count: quizCount },
            { key: 'tugas' as 'tugas', label: 'Tugas', icon: ClipboardList, count: tasks.length },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setLessonTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-[11px] font-bold border-b-2 transition-colors ${
                lessonTab === tab.key ? 'border-[#0069b0] text-[#0069b0] bg-[#0069b0]/[0.03]' : 'border-transparent text-[#8B90A0] hover:text-[#14182B]'
              }`}>
              <tab.icon size={13} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  lessonTab === tab.key ? 'bg-[#0069b0]/10 text-[#0069b0]' : 'bg-gray-100 text-[#8B90A0]'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Materi */}
        {lessonTab === 'materi' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EF] overflow-hidden">
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
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
                className="flex items-center gap-3 border border-[#E5E7EF] rounded-xl p-3 bg-[#F4F5F8]">
                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
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
          </div>
        </div>
        )}

        {/* Quiz */}
        {lessonTab === 'quiz' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center gap-2">
            <HelpCircle size={15} className="text-[#0069b0]" />
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Quiz</h3>
          </div>
          <div className="p-5">
            {attachedPaket ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <ListChecks size={16} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#14182B] truncate">{attachedPaket.title}</p>
                  <p className="text-[10px] text-[#8B90A0]">
                    {attachedPaket.questions_count != null ? `${attachedPaket.questions_count} soal` : 'Paket soal'}
                    {attachedPaket.attempts_count != null ? ` · ${attachedPaket.attempts_count} percobaan` : ''}
                  </p>
                </div>
                {canManage && (
                <button onClick={() => setShowQuizManager(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#0069b0] border border-[#0069b0]/30 bg-[#0069b0]/5 px-3 py-1.5 rounded-lg hover:bg-[#0069b0]/10 transition-colors shrink-0">
                  Kelola <ChevronRight size={12} />
                </button>
              )}
              </div>
            ) : coursePakets.length > 0 ? (
              <div className="space-y-2.5">
                {coursePakets.map(p => (
                  <div key={p.id} className="flex items-center gap-3 border border-[#E5E7EF] rounded-xl p-3 bg-[#F4F5F8]">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <ListChecks size={16} className="text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#14182B] truncate">{p.title}</p>
                      <p className="text-[10px] text-[#8B90A0]">
                        {p.questions_count != null ? `${p.questions_count} soal` : 'Paket soal'}
                        {p.attempts_count != null ? ` · ${p.attempts_count} percobaan` : ''}
                      </p>
                      {p.status === 'nonaktif' && (
                        <span className="text-[9px] font-bold text-amber-600 mt-0.5 inline-block">Nonaktif</span>
                      )}
                    </div>
                    {canManage && (
                    <button onClick={() => setShowQuizManager(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-[#0069b0] border border-[#0069b0]/30 bg-[#0069b0]/5 px-3 py-1.5 rounded-lg hover:bg-[#0069b0]/10 transition-colors shrink-0">
                      Kelola <ChevronRight size={12} />
                    </button>
                  )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#E5E7EF] rounded-xl p-6 text-center">
                <div className="w-11 h-11 mx-auto rounded-xl bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <HelpCircle size={20} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Belum ada quiz</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Buat paket soal untuk pertemuan ini</p>
                {canManage ? (
                <button onClick={() => setShowQuizManager(true)}
                  className="mt-3 flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-2 rounded-lg hover:bg-[#004d7a] transition-colors mx-auto">
                  <Plus size={12} /> Buat Paket Soal
                </button>
              ) : (
                <p className="mt-3 text-[10px] text-[#C5C8D4] font-medium text-center">Quiz belum tersedia untuk pertemuan ini</p>
              )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Tugas */}
        {lessonTab === 'tugas' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center gap-2">
            <ClipboardList size={15} className="text-[#0069b0]" />
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Tugas ({tasks.length})</h3>
          </div>
          <div className="p-5">
            {tasks.length === 0 ? (
              <p className="text-xs text-[#C5C8D4] text-center py-4">Belum ada tugas untuk kursus ini</p>
            ) : (
              <div className="space-y-2.5">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 border border-[#E5E7EF] rounded-xl p-3 bg-[#F4F5F8]">
                    <div className="w-8 h-8 rounded-lg bg-[#0069b0]/10 flex items-center justify-center shrink-0">
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

            <button onClick={() => navigate(`/guru-lms/assignments/${lesson.course_id}`)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 border border-[#0069b0]/30 bg-[#0069b0]/5 text-[#0069b0] px-3 py-2.5 rounded-xl text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
              <ListChecks size={13} /> Kelola Semua Tugas
            </button>

            {canManage && (
              <div className="mt-4 border-t border-[#E5E7EF] pt-4">
                <p className="text-[11px] font-bold text-[#4B5063] mb-2">Tambah Tugas Baru</p>
                <div className="space-y-2">
                  <input type="text" placeholder="Judul tugas" value={taskForm.title}
                    onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                  <input type="text" placeholder="Deskripsi (opsional)" value={taskForm.description}
                    onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={taskForm.dueDate}
                      onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                    <input type="number" placeholder="Skor maks (opsional)" value={taskForm.maxScore}
                      onChange={e => setTaskForm(f => ({ ...f, maxScore: e.target.value }))}
                      className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                  </div>
                  <button onClick={handleSaveTask} disabled={savingTask || !taskForm.title.trim()}
                    className="w-full flex items-center justify-center gap-1.5 bg-[#0069b0]/10 text-[#0069b0] px-3 py-2.5 rounded-xl text-[11px] font-bold hover:bg-[#0069b0]/20 transition-colors disabled:opacity-50">
                    <Plus size={13} /> {savingTask ? 'Menyimpan...' : 'Tambah Tugas'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Edit Materi Modal */}
      {showEditModal && lesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Materi</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Materi <span className="text-red-500">*</span></label>
                <input type="text" value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  placeholder="Judul pelajaran" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Video (YouTube)</label>
                <input type="text" value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  placeholder="https://youtube.com/..." />
                {lessonForm.video_url && (
                  <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                  <select value={lessonForm.status} onChange={e => setLessonForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <button onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveLesson} disabled={saving || !lessonForm.title.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[#0069b0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50">
                {saving ? 'Menyimpan...' : <><Check size={13} /> Simpan Materi</>}
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

      <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
        homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard" profilHref="/guru-profil" />
    </div>
  )
}