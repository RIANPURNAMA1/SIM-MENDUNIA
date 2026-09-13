import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, FileText, ListChecks, Plus, ChevronRight, ChevronDown, HelpCircle,
  Download, Clock, ClipboardList, Check, Edit3, X, Trash2, Loader2, Layers, Camera, Upload, ImageIcon,
  BarChart3, Users,
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { guruLmsApi, assignmentApi, guruQuizApi, APP_URL } from '../../services/api'
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
  link_pakets?: { id: number; title: string; status: string; questions_count?: number; attempts_count?: number }[]
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

interface PaketQuestion {
  id: number
  question: string
  question_type: 'choice' | 'rating'
  rating_max: number | null
  options: string[]
  correct_index: number | null
  points: number | null
}

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
  const [lessonTab, setLessonTab] = useState<'materi' | 'quiz' | 'tugas' | 'rekap'>('materi')
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
  const [showBankPicker, setShowBankPicker] = useState(false)
  const [bankPakets, setBankPakets] = useState<BankPaket[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankPickedIds, setBankPickedIds] = useState<number[]>([])
  const [assigningBank, setAssigningBank] = useState(false)
  const [previewPaketId, setPreviewPaketId] = useState<number | null>(null)
  const [paketQuestionsMap, setPaketQuestionsMap] = useState<Record<number, PaketQuestion[]>>({})
  const [questionsLoading, setQuestionsLoading] = useState(false)

  const [recap, setRecap] = useState<RecapData | null>(null)
  const [recapFile, setRecapFile] = useState<File | null>(null)
  const [recapDescription, setRecapDescription] = useState('')
  const [savingRecap, setSavingRecap] = useState(false)
  const [recapInputReset, setRecapInputReset] = useState(0)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [rekapNilai, setRekapNilai] = useState<RekapNilaiData | null>(null)
  const [rekapNilaiLoading, setRekapNilaiLoading] = useState(false)

  const loadRekapNilai = (id: number) => {
    setRekapNilaiLoading(true)
    guruLmsApi.lessonRekapNilai(id)
      .then(res => setRekapNilai(res.data))
      .catch(() => setRekapNilai(null))
      .finally(() => setRekapNilaiLoading(false))
  }

  const switchLessonTab = (key: typeof lessonTab) => {
    setLessonTab(key)
    if (key === 'rekap' && lesson) loadRekapNilai(lesson.id)
  }

  const loadLesson = (id: number) => guruLmsApi.lessonDetail(id).then(res => {
    setLesson(res.data.lesson)
    const r = res.data.lesson.recap || null
    setRecap(r)
    setRecapDescription(r?.description || '')
    setRecapFile(null)
  })
  const loadTasks = (courseId: number) => assignmentApi.list(courseId).then((t: any) => setTasks(t.data.assignments || [])).catch(() => setTasks([]))

  const openBankPicker = () => {
    setBankPickedIds([])
    setShowBankPicker(true)
    setBankLoading(true)
    guruQuizApi.bankPakets()
      .then(res => {
        setBankPakets(res.data.pakets || [])
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
        <div className="mt-3 px-4 py-6 bg-[#F4F5F8] rounded-xl text-center text-[11px] text-[#8B90A0] font-medium">
          Paket ini belum punya soal. Tambahkan soal lewat halaman Paket Soal (bank) atau pilih paket lain dari bank.
        </div>
      )
    }
    return (
      <div className="mt-3 space-y-2.5">
        {qs.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl border border-[#E5E7EF] p-4">
            <p className="text-xs font-bold text-[#14182B] leading-snug">{i + 1}. {q.question}</p>
            {q.section?.name && (
              <span className="mt-2 inline-block rounded-full bg-[#0069b0]/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0069b0]">{q.section.name}</span>
            )}
            <div className="mt-2 space-y-1.5">
              {q.question_type === 'rating' ? (
                <div className="flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 font-bold">
                  <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold shrink-0">SKALA</span>
                  <span>Rating 1–{q.rating_max || q.options.length}</span>
                  <span className="ml-auto text-[9.5px] font-bold text-violet-400 shrink-0">TANPA KUNCI</span>
                </div>
              ) : (q.options.map((opt, oi) => {
                const optLabel = typeof opt === 'string' ? opt : (opt?.text ?? '')
                const optRaw = typeof opt === 'string' ? null : (opt?.image_url || opt?.image_path || null)
                const optUrl = optRaw && !optRaw.startsWith('http') ? `${APP_URL}/storage/${optRaw}` : optRaw
                return (
                  <div key={oi} className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg ${oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-[#F4F5F8] text-[#4B5063] font-medium'}`}>
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
  const lessonPakets = [...(lesson.paket ? [lesson.paket] : []), ...(lesson.link_pakets || [])]
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
            { key: 'rekap' as 'rekap', label: 'Rekap Pertemuan', icon: Camera, count: recap ? 1 : undefined },
          ]).map(tab => (
            <button key={tab.key} onClick={() => switchLessonTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-3 text-[11px] font-bold border-b-2 transition-colors ${
                lessonTab === tab.key ? 'border-[#0069b0] text-[#0069b0] bg-[#0069b0]/[0.03]' : 'border-transparent text-[#8B90A0] hover:text-[#14182B]'
              }`}>
              <tab.icon size={13} />
              <span className="truncate">{tab.label}</span>
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
            {lessonPakets.length > 0 ? (
              <div className="space-y-3">
                {lessonPakets.map(paket => (
                  <div key={paket.id} className="border border-[#E5E7EF] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                        <ListChecks size={16} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#14182B] truncate">{paket.title}</p>
                        <p className="text-[10px] text-[#8B90A0]">
                          {paket.questions_count != null ? `${paket.questions_count} soal` : 'Paket soal'}
                          {paket.attempts_count != null ? ` · ${paket.attempts_count} percobaan` : ''}
                        </p>
                      </div>
                      {canManage && (
                        <button onClick={() => handleRemovePaket(paket.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors shrink-0"
                          title="Lepas paket dari pertemuan">
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      )}
                    </div>
                    <button onClick={() => toggleQuizPreview(paket.id)}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#0069b0] border border-[#0069b0]/30 bg-[#0069b0]/5 px-3 py-1.5 rounded-lg hover:bg-[#0069b0]/10 transition-colors">
                      Lihat Paket Soal <ChevronDown size={12} className={previewPaketId === paket.id ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                    {renderQuizPreview(paket.id)}
                  </div>
                ))}

                {canManage && (
                  <button onClick={openBankPicker}
                    className="w-full flex items-center justify-center gap-1.5 border border-dashed border-[#0069b0]/40 bg-[#0069b0]/5 text-[#0069b0] px-3 py-2.5 rounded-xl text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                    <Plus size={13} /> Tambah Paket dari Bank
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-[#E5E7EF] rounded-xl p-6 text-center">
                <div className="w-11 h-11 mx-auto rounded-xl bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                  <HelpCircle size={20} className="text-[#0069b0]" />
                </div>
                <p className="text-xs font-bold text-[#14182B]">Belum ada quiz</p>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">Pilih paket soal dari bank soal untuk pertemuan ini</p>
                {canManage ? (
                <button onClick={openBankPicker}
                  className="mt-3 flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-2 rounded-lg hover:bg-[#004d7a] transition-colors mx-auto">
                  <Plus size={12} /> Pilih Paket Soal dari Bank
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

        {/* Rekap Pertemuan */}
        {lessonTab === 'rekap' && (
        <div className="space-y-3">
          {/* Nilai Quiz Siswa */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] overflow-hidden">
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
                <div className="border border-dashed border-[#E5E7EF] rounded-xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
                    <Users size={18} className="text-[#0069b0]" />
                  </div>
                  <p className="text-xs font-bold text-[#14182B]">Belum ada nilai quiz</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium mt-0.5">
                    Belum ada paket soal di pertemuan ini. Pasang quiz dulu agar nilai siswa muncul di sini.
                  </p>
                </div>
              ) : rekapNilai.siswa.length === 0 ? (
                <div className="border border-dashed border-[#E5E7EF] rounded-xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-[#0069b0]/[0.06] flex items-center justify-center mb-2">
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
                    <div className="rounded-xl bg-[#F4F5F8] border border-[#E5E7EF] p-3 text-center">
                      <p className="text-[9px] font-bold text-[#8B90A0] uppercase tracking-wide">Rata-Rata</p>
                      <p className={`text-lg font-bold mt-1 ${rekapNilaiStats?.overallAvg == null ? 'text-[#C5C8D4]' : 'text-[#0069b0]'}`}>
                        {rekapNilaiStats?.overallAvg ?? '–'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 text-center">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Sudah Mengerjakan</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        {rekapNilaiStats?.done ?? 0}
                        <span className="text-[10px] font-bold text-emerald-400">/{rekapNilaiStats?.total ?? 0}</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F4F5F8] border border-[#E5E7EF] p-3 text-center">
                      <p className="text-[9px] font-bold text-[#8B90A0] uppercase tracking-wide">Belum Mengerjakan</p>
                      <p className={`text-lg font-bold mt-1 ${rekapNilaiStats?.notDone ? 'text-amber-600' : 'text-[#C5C8D4]'}`}>
                        {rekapNilaiStats?.notDone ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-5 px-5">
                    <div className="min-w-[440px] rounded-2xl border border-[#E5E7EF] overflow-hidden">
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
                                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F4F5F8] text-[#B9BDCB]">Belum</span>
                                      ) : (
                                        <div className="inline-flex flex-col items-center">
                                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${color}`}>{score}</span>
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
                                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
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
        <div className="bg-white rounded-2xl border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EF] flex items-center gap-2">
            <Camera size={15} className="text-[#0069b0]" />
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Rekap Pertemuan</h3>
          </div>
          <div className="p-5 space-y-4">
            {recap?.url ? (
              <div className="space-y-3">
                {recap.kind === 'image' ? (
                  <a href={recap.url} target="_blank" rel="noopener noreferrer"
                    className="block rounded-xl overflow-hidden border border-[#E5E7EF] bg-[#F4F5F8]">
                    <img src={recap.url} alt="Rekap pertemuan" className="w-full max-h-[420px] object-contain" />
                  </a>
                ) : (
                  <a href={recap.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 border border-[#E5E7EF] rounded-xl p-3 bg-[#F4F5F8]">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
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
                  <p className="text-xs text-[#4B5063] leading-relaxed bg-[#F7F9FC] border border-[#E5E7EF] rounded-xl p-4">
                    {recap.description}
                  </p>
                )}
                {canManage && (
                  <button onClick={handleDeleteRecap}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
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
                    className="flex items-center justify-center gap-1.5 border border-[#0069b0]/30 bg-[#0069b0]/5 text-[#0069b0] px-3 py-3 rounded-xl text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                    <Camera size={14} /> Ambil Foto Papan
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 border border-[#0069b0]/30 bg-[#0069b0]/5 text-[#0069b0] px-3 py-3 rounded-xl text-[11px] font-bold hover:bg-[#0069b0]/10 transition-colors">
                    <Upload size={14} /> Unggah Foto / PDF
                  </button>
                </div>

                {recapFile && (
                  <div className="flex items-center gap-3 rounded-xl bg-[#F4F5F8] border border-[#E5E7EF] p-3">
                    <ImageIcon size={16} className="text-[#0069b0] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#14182B] truncate">{recapFile.name}</p>
                      <p className="text-[10px] text-[#8B90A0]">{fmtFileSize(recapFile.size)} · {(recapFile.type.startsWith('image/') ? 'Gambar' : 'PDF')}</p>
                    </div>
                    <button onClick={() => setRecapFile(null)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold text-[#4B5063] mb-1.5">Keterangan / Deskripsi</p>
                  <textarea value={recapDescription} onChange={e => setRecapDescription(e.target.value)}
                    rows={3}
                    placeholder="Tulis ringkasan atau keterangan materu yang dijelaskan di pertemuan ini (opsional)..."
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all resize-none" />
                </div>

                <div className="flex items-center justify-end gap-2">
                  {(recap?.url || recapFile) && (
                    <button onClick={handleDeleteRecap}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 px-3.5 py-2.5 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 size={13} /> Hapus
                    </button>
                  )}
                  <button onClick={handleSaveRecap} disabled={savingRecap || (!recapFile && !recapDescription.trim())}
                    className="flex items-center justify-center gap-1.5 bg-[#0069b0] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-50">
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

      {/* Bank Paket Picker Modal */}
      {showBankPicker && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowBankPicker(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Pilih Paket Soal dari Bank</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">Centang satu atau lebih paket untuk dijadikan quiz pertemuan ini</p>
              </div>
              <button onClick={() => setShowBankPicker(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
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
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0069b0]/[0.06] flex items-center justify-center mb-3">
                    <Layers size={26} className="text-[#0069b0]" />
                  </div>
                  <p className="text-sm font-bold text-[#14182B]">Bank kosong</p>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Belum ada paket soal di bank. Buat paket baru dulu?</p>
                  <button onClick={() => { setShowBankPicker(false); setShowQuizManager(true) }}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#0069b0] px-4 py-2 rounded-lg hover:bg-[#004d7a] transition-colors">
                    <Plus size={13} /> Buat Paket Soal Baru
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {bankPakets.map(p => {
                      const checked = bankPickedIds.includes(p.id)
                      const attached = lessonPakets.some(x => x.id === p.id)
                      return (
                        <label key={p.id}
                          className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-colors ${attached ? 'border-[#E5E7EF] bg-[#F8F9FB] opacity-70 cursor-not-allowed' : `cursor-pointer ${checked ? 'border-[#0069b0] bg-[#0069b0]/[0.04] ring-1 ring-[#0069b0]/20' : 'border-[#E5E7EF] hover:bg-[#F7F8FA]'}`}`}>
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
                </>
              )}
            </div>

            {bankPakets.length > 0 && (
              <div className="px-5 py-4 border-t border-[#F0F1F5] flex items-center justify-end gap-2">
                <button onClick={() => setShowBankPicker(false)}
                  className="px-4 py-2.5 text-[11px] font-bold text-[#4B5063] hover:bg-[#F4F5F8] rounded-lg transition-colors">
                  Batal
                </button>
                <button onClick={assignBankPaket} disabled={assigningBank || bankPickedIds.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-[#0069b0] rounded-lg hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                  {assigningBank ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {assigningBank ? 'Memasang...' : bankPickedIds.length > 1 ? `Pasang ${bankPickedIds.length} Paket` : 'Pasang Paket'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
        homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard" profilHref="/guru-profil" />
    </div>
  )
}