import { useState, useEffect, useRef } from 'react'
import {
  Plus, X, Trash2, ArrowLeft, ListChecks, Eye,
  ChevronUp, ChevronDown, Camera, Clock, Repeat, Award, Users,
  UserCheck, BookOpen, Search, Pencil, Loader2, ImageIcon,
  LayoutGrid, ShieldCheck,
} from 'lucide-react'
import { adminQuizApi } from '../../services/api'
import Swal from 'sweetalert2'

interface Paket {
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
  batch?: { id: number; nama_batch: string } | null
  course?: { id: number; title: string } | null
}

interface Section {
  id: number
  name: string
  sort: number
  questions_count: number
}

interface Question {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: string[]
  correct_index: number | null
  keyword: string | null
  points: number
  sort: number
  section_id: number | null
  section?: Section | null
}

interface Batch { id: number; nama_batch: string }
interface Course { id: number; title: string }
interface Guru { id: number; name: string }
interface Category { id: number; name: string }

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

interface Participant {
  siswa_id: number
  nama: string
  batch: string | null
  level: string | number | null
  attempts_count: number
  best_score: number
  attempts: AttemptRow[]
}

interface DetailRow {
  id: number
  question: string
  question_type: string
  rating_max: number | null
  options: string[]
  correct_index: number | null
  keyword: string | null
  points: number
  sort: number
  selected_index: number | null
  answer_text: string | null
  earned_points: number | null
  is_correct: boolean | null
}

type View = 'list' | 'questions' | 'results'

const emptyPaketForm = {
  title: '', description: '', course_id: '', batch_id: '', level: '', category: '',
  time_limit_minutes: '30', max_attempts: '3', max_warnings: '3',
  passing_score: '0', shuffle_questions: true, quiz_template: 'basic', status: 'nonaktif', user_id: '',
  cover_image: '',
}

const emptyQuestionForm = { question: '', question_type: 'choice', rating_max: '9', correct_index: '', points: '1', keyword: '', section_id: '' }

const DEFAULT_SECTIONS = ['Vocabulary', 'Grammar', 'Reading', 'Listening', 'Conversation']

const inputCls =
  'w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1'
const primaryBtn =
  'inline-flex items-center gap-2 bg-[#0E6187] hover:bg-[#0E6187]/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50'

export default function AdminQuizPaketSoal() {
  const [pakets, setPakets] = useState<Paket[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchLevels, setBatchLevels] = useState<Record<number, string[]>>({})
  const [courses, setCourses] = useState<Course[]>([])
  const [gurus, setGurus] = useState<Guru[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<View>('list')
  const [activePaket, setActivePaket] = useState<Paket | null>(null)
  const [search, setSearch] = useState('')
  const [filterBatch, setFilterBatch] = useState('')

  const [showPaketModal, setShowPaketModal] = useState(false)
  const [editingPaket, setEditingPaket] = useState<Paket | null>(null)
  const [paketForm, setPaketForm] = useState({ ...emptyPaketForm })
  const [savingPaket, setSavingPaket] = useState(false)
  const [coverPreview, setCoverPreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const [savingCategory, setSavingCategory] = useState(false)

  const [questions, setQuestions] = useState<Question[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ ...emptyQuestionForm })
  const [qOptions, setQOptions] = useState<string[]>(['', ''])
  const [savingQuestion, setSavingQuestion] = useState(false)

  const [participants, setParticipants] = useState<Participant[]>([])
  const [rLoading, setRLoading] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detail, setDetail] = useState<{ attempt: any; questions: DetailRow[]; siswa: any } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [savingGrade, setSavingGrade] = useState<number | null>(null)

  const fetchMeta = () => {
    adminQuizApi.meta().then(res => {
      setBatches(res.data.batches || [])
      setBatchLevels(res.data.batch_levels || {})
      setCourses(res.data.courses || [])
      setGurus(res.data.gurus || [])
      setCategories(res.data.categories || [])
    }).catch(() => {})
  }

  const fetchPakets = () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (filterBatch) params.batch_id = filterBatch
    adminQuizApi.pakets(params).then(res => {
      setPakets(res.data.pakets || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMeta()
    fetchPakets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchPakets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterBatch])

  const openCreatePaket = () => {
    setEditingPaket(null)
    setPaketForm({ ...emptyPaketForm })
    setCoverPreview('')
    setShowPaketModal(true)
  }

  const openEditPaket = (p: Paket) => {
    setEditingPaket(p)
    setPaketForm({
      title: p.title,
      description: p.description || '',
      course_id: p.course_id?.toString() || '',
      batch_id: p.batch_id?.toString() || '',
      level: p.level || '',
      category: p.category || '',
      time_limit_minutes: p.time_limit_minutes.toString(),
      max_attempts: p.max_attempts.toString(),
      max_warnings: p.max_warnings.toString(),
      passing_score: p.passing_score.toString(),
      shuffle_questions: p.shuffle_questions,
      quiz_template: p.quiz_template || 'basic',
      status: p.status,
      user_id: p.user_id?.toString() || '',
      cover_image: p.cover_image || '',
    })
    setCoverPreview(p.cover_url || '')
    setShowPaketModal(true)
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      Swal.fire({ icon: 'warning', title: 'File harus berupa gambar' })
      return
    }
    const fd = new FormData()
    fd.append('cover', file)
    setUploadingCover(true)
    adminQuizApi.uploadCover(fd)
      .then(res => {
        setPaketForm(prev => ({ ...prev, cover_image: res.data.cover_image }))
        setCoverPreview(res.data.url)
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengunggah cover' }))
      .finally(() => setUploadingCover(false))
    e.target.value = ''
  }

  const savePaket = async () => {
    if (!paketForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul paket wajib diisi' })
      return
    }
    setSavingPaket(true)
    try {
      const data: Record<string, unknown> = {
        title: paketForm.title,
        description: paketForm.description,
        cover_image: paketForm.cover_image || null,
        course_id: paketForm.course_id ? Number(paketForm.course_id) : undefined,
        batch_id: paketForm.batch_id ? Number(paketForm.batch_id) : null,
        level: paketForm.level || null,
        category: paketForm.category || null,
        time_limit_minutes: Number(paketForm.time_limit_minutes) || 30,
        max_attempts: Number(paketForm.max_attempts) || 3,
        max_warnings: Number(paketForm.max_warnings) || 3,
        passing_score: Number(paketForm.passing_score) || 0,
        shuffle_questions: paketForm.shuffle_questions,
        quiz_template: paketForm.quiz_template,
        status: paketForm.status,
        user_id: paketForm.user_id ? Number(paketForm.user_id) : undefined,
      }
      if (editingPaket) {
        await adminQuizApi.updatePaket(editingPaket.id, data)
      } else {
        await adminQuizApi.storePaket(data)
      }
      setShowPaketModal(false)
      fetchPakets()
      Swal.fire({ icon: 'success', title: editingPaket ? 'Paket diperbarui' : 'Paket dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan paket' })
    } finally {
      setSavingPaket(false)
    }
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nama kategori wajib diisi' })
      return
    }
    setSavingCategory(true)
    try {
      await adminQuizApi.storeCategory({ name: categoryForm.name.trim() })
      setCategoryForm({ name: '' })
      fetchMeta()
      Swal.fire({ icon: 'success', title: 'Kategori ditambahkan', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menambah kategori' })
    } finally {
      setSavingCategory(false)
    }
  }

  const deleteCategory = (c: Category) => {
    Swal.fire({
      title: 'Hapus kategori?',
      text: `Kategori "${c.name}" akan dihapus dari daftar`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        adminQuizApi.deleteCategory(c.id).then(() => {
          fetchMeta()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1200, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const deletePaket = (p: Paket) => {
    Swal.fire({
      title: 'Hapus paket soal?',
      text: `"${p.title}" beserta semua soal & riwayat pengerjaan akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        adminQuizApi.deletePaket(p.id).then(() => {
          fetchPakets()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const togglePaket = (p: Paket) => {
    adminQuizApi.togglePaket(p.id).then(() => {
      fetchPakets()
    }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengubah status' }))
  }

  const openQuestions = (p: Paket) => {
    setActivePaket(p)
    setView('questions')
    setQLoading(true)
    Promise.all([
      adminQuizApi.questions(p.id),
      adminQuizApi.sections(p.id),
    ]).then(async ([qRes, sRes]) => {
      setQuestions(qRes.data.questions || [])
      const existing = sRes.data.sections || []
      setSections(existing)
      const existingNames = existing.map((s: Section) => s.name.toLowerCase())
      for (const name of DEFAULT_SECTIONS) {
        if (!existingNames.includes(name.toLowerCase())) {
          try {
            const res = await adminQuizApi.storeSection(p.id, { name })
            setSections(prev => [...prev, res.data.section])
          } catch {}
        }
      }
    }).catch(() => { setQuestions([]); setSections([]) }).finally(() => setQLoading(false))
  }

  const openResults = (p: Paket) => {
    setActivePaket(p)
    setView('results')
    setRLoading(true)
    adminQuizApi.results(p.id).then(res => {
      setParticipants(res.data.participants || [])
    }).catch(() => setParticipants([])).finally(() => setRLoading(false))
  }

  const openCreateQuestion = () => {
    setEditingQuestion(null)
    setQForm({ ...emptyQuestionForm })
    setQOptions(['', ''])
    setShowQuestionModal(true)
  }

  const openEditQuestion = (q: Question) => {
    setEditingQuestion(q)
    setQForm({
      question: q.question,
      question_type: q.question_type === 'rating' ? 'rating' : q.question_type === 'essay' ? 'essay' : 'choice',
      rating_max: q.rating_max ? q.rating_max.toString() : '9',
      correct_index: q.correct_index?.toString() ?? '',
      points: q.points.toString(),
      keyword: q.keyword || '',
      section_id: q.section_id?.toString() ?? '',
    })
    setQOptions(q.question_type === 'rating' ? Array.from({ length: q.rating_max || 9 }, (_, i) => String(i + 1)) : q.question_type === 'essay' ? [] : [...q.options])
    setShowQuestionModal(true)
  }

  const saveQuestion = async () => {
    if (!activePaket) return
    const isRating = qForm.question_type === 'rating'
    const isEssay = qForm.question_type === 'essay'
    let opts: string[]
    if (isEssay) {
      opts = []
    } else if (isRating) {
      const ratingMax = Math.min(10, Math.max(2, Number(qForm.rating_max) || 9))
      opts = Array.from({ length: ratingMax }, (_, i) => String(i + 1))
    } else {
      opts = qOptions.map(o => o.trim()).filter(Boolean)
      if (opts.length < 2) {
        Swal.fire({ icon: 'warning', title: 'Minimal 2 opsi jawaban' })
        return
      }
      if (qForm.correct_index === '' || Number(qForm.correct_index) >= opts.length) {
        Swal.fire({ icon: 'warning', title: 'Pilih jawaban benar yang valid' })
        return
      }
    }
    setSavingQuestion(true)
    try {
      const data = {
        question: qForm.question,
        question_type: isEssay ? 'essay' : isRating ? 'rating' : 'choice',
        rating_max: isRating ? Number(qForm.rating_max) || 9 : null,
        options: opts,
        correct_index: isEssay ? null : isRating ? null : Number(qForm.correct_index),
        keyword: isEssay ? (qForm.keyword.trim() || null) : null,
        points: Number(qForm.points) || 1,
        section_id: qForm.section_id ? Number(qForm.section_id) : null,
      }
      if (editingQuestion) {
        await adminQuizApi.updateQuestion(editingQuestion.id, data)
      } else {
        await adminQuizApi.storeQuestion(activePaket.id, data)
      }
      setShowQuestionModal(false)
      openQuestions(activePaket)
      fetchPakets()
      Swal.fire({ icon: 'success', title: editingQuestion ? 'Soal diperbarui' : 'Soal ditambahkan', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan soal' })
    } finally {
      setSavingQuestion(false)
    }
  }

  const deleteQuestion = (q: Question) => {
    Swal.fire({
      title: 'Hapus soal?',
      text: 'Soal ini akan dihapus dari paket',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed && activePaket) {
        adminQuizApi.deleteQuestion(q.id).then(() => {
          openQuestions(activePaket)
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1200, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const moveQuestion = (index: number, dir: 'up' | 'down') => {
    const arr = [...questions]
    const swapIndex = dir === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= arr.length) return
    const temp = arr[index]
    arr[index] = { ...arr[swapIndex], sort: arr[index].sort }
    arr[swapIndex] = { ...temp, sort: arr[swapIndex].sort }
    setQuestions(arr)
    Promise.all([
      adminQuizApi.updateQuestion(arr[index].id, { sort: arr[index].sort }),
      adminQuizApi.updateQuestion(arr[swapIndex].id, { sort: arr[swapIndex].sort }),
    ]).catch(() => {})
  }

  const openAttemptDetail = (attemptId: number) => {
    setShowDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    setGrades({})
    adminQuizApi.attemptDetail(attemptId).then(res => {
      setDetail({ attempt: res.data.attempt, questions: res.data.questions || [], siswa: res.data.siswa })
    }).catch(() => {
      setDetail(null)
      Swal.fire({ icon: 'error', title: 'Gagal memuat detail' })
    }).finally(() => setDetailLoading(false))
  }

  const saveGrade = async (qid: number) => {
    if (!detail) return
    const dq = detail.questions.find(x => x.id === qid)
    if (!dq) return
    const earned = Math.max(0, Math.min(Number(grades[qid] ?? 0) || 0, Number(dq.points) || 0))
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

  const backToList = () => setView('list')

  const fmtDate = (iso: string | null) => {
    if (!iso) return '-'
    const d = new Date(iso)
    return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const scopeLabel = (p: Paket) => {
    const parts: string[] = []
    if (p.batch) parts.push(p.batch.nama_batch)
    if (p.level) parts.push(`Level ${p.level}`)
    if (p.course) parts.push(p.course.title)
    return parts.length ? parts.join(' · ') : 'Semua kandidat'
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0E6187] text-white shadow-sm">
              <ListChecks size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Paket Soal / Quiz</h1>
              <p className="text-sm text-slate-500">Kelola paket soal MCQ dan lihat hasil pengerjaan kandidat</p>
            </div>
          </div>
          {view === 'list' && (
            <button onClick={openCreatePaket} className={primaryBtn}>
              <Plus size={16} /> Buat Paket
            </button>
          )}
        </div>

        {/* Filters */}
        {view === 'list' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari judul paket..." className={`${inputCls} pl-9`} />
            </div>
            <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className={`${inputCls} sm:w-56`}>
              <option value="">Semua Batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
            </select>
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm gap-2">
              <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat paket soal...
            </div>
          ) : pakets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-14 text-center">
              <div className="w-14 h-14 mx-auto rounded-lg bg-[#0E6187]/10 flex items-center justify-center mb-3">
                <ListChecks size={28} className="text-[#0E6187]" />
              </div>
              <p className="text-slate-800 font-semibold">Belum ada paket soal</p>
              <p className="text-slate-500 text-sm mt-1">Buat paket soal MCQ untuk kandidat</p>
              <button onClick={openCreatePaket} className={`${primaryBtn} mt-5`}>
                <Plus size={16} /> Buat Paket Soal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pakets.map(p => (
                <div key={p.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col">
                  {p.cover_url && (
                    <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-200 mb-4 -mt-1">
                      <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-slate-800 font-semibold truncate">{p.title}</h2>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${p.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                        </span>
                      </div>
                      {p.category && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E6187]/[0.08] text-[#0E6187] mt-1">
                          {p.category}
                        </span>
                      )}
                      <p className="text-sm text-slate-500 mt-1">{scopeLabel(p)}</p>
                      {p.guru_name && p.guru_name !== '-' && (
                        <p className="text-xs text-[#0E6187] font-medium mt-0.5 flex items-center gap-1">
                          <UserCheck size={12} /> {p.guru_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => togglePaket(p)}
                      className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${p.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={p.status === 'aktif' ? 'Tutup paket' : 'Buka paket'}>
                      <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${p.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                    </button>
                  </div>

                  {p.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{p.description}</p>}

                  <div className="grid grid-cols-4 gap-2 mt-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{p.questions_count}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Soal</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{p.attempts_count}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Dikerjakan</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{p.participants}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Peserta</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-[#0E6187]">{Number(p.best_score) || '-'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Nilai Terbaik</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button onClick={() => openQuestions(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[#0E6187] py-2 rounded-lg hover:bg-[#0E6187]/90 transition-colors">
                      <ListChecks size={15} /> Soal ({p.questions_count})
                    </button>
                    <button onClick={() => openResults(p)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#0E6187] bg-[#0E6187]/[0.08] py-2 rounded-lg hover:bg-[#0E6187]/15 transition-colors">
                      <Eye size={15} /> Hasil
                    </button>
                    <button onClick={() => openEditPaket(p)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" title="Edit">
                      <Pencil size={15} className="text-slate-600" />
                    </button>
                    <button onClick={() => deletePaket(p)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                      <Trash2 size={15} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* QUESTIONS VIEW */}
        {view === 'questions' && activePaket && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center justify-between mt-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">{activePaket.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{questions.length} soal · {scopeLabel(activePaket)}</p>
                </div>
                <button onClick={openCreateQuestion} className={primaryBtn}>
                  <Plus size={16} /> Tambah Soal
                </button>
              </div>
            </div>

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
            ) : (
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <button onClick={() => moveQuestion(i, 'up')} className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20" disabled={i === 0}>
                          <ChevronUp size={16} />
                        </button>
                        <button onClick={() => moveQuestion(i, 'down')} className="p-0.5 text-slate-400 hover:text-[#0E6187] disabled:opacity-20" disabled={i === questions.length - 1}>
                          <ChevronDown size={16} />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-bold text-slate-400 shrink-0 mt-0.5">#{i + 1}</span>
                          <p className="text-[15px] font-semibold text-slate-800 leading-snug flex-1">{q.question}</p>
                          {q.section && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0E6187]/[0.08] text-[#0E6187] shrink-0">{q.section.name}</span>
                          )}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => openEditQuestion(q)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors" title="Edit">
                              <Pencil size={14} className="text-slate-600" />
                            </button>
                            <button onClick={() => deleteQuestion(q)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {q.question_type === 'rating' ? (
                            <div className="flex items-center gap-2.5 text-sm px-3.5 py-2 rounded-lg bg-violet-50 text-violet-700 font-semibold">
                              <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold shrink-0">SKALA</span>
                              <span>Rating 1–{q.rating_max || q.options.length}</span>
                              <span className="ml-auto text-[10px] font-bold text-violet-400 shrink-0">TANPA KUNCI</span>
                            </div>
                          ) : (q.options.map((opt, oi) => (
                            <div key={oi} className={`flex items-center gap-2.5 text-sm px-3.5 py-2 rounded-lg ${oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-slate-50 text-slate-600'}`}>
                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${oi === q.correct_index ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span>{opt}</span>
                              {oi === q.correct_index && <span className="ml-auto text-[10px] font-bold text-emerald-500 shrink-0">BENAR</span>}
                            </div>
                          )))}
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-3">Skor: {q.points} poin</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS VIEW */}
        {view === 'results' && activePaket && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
              <button onClick={backToList} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0E6187] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
                  <Award size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate">Hasil · {activePaket.title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{participants.length} peserta mengerjakan</p>
                </div>
              </div>
            </div>

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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {participants.map(par => (
                  <div key={par.siswa_id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                        <Users size={17} className="text-[#0E6187]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-semibold truncate">{par.nama}</p>
                        <p className="text-xs text-slate-500">
                          {[par.batch && `Batch ${par.batch}`, par.level !== null && `Level ${par.level}`].filter(Boolean).join(' · ') || '-'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[#0E6187]">{Number(par.best_score) || 0}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Nilai Terbaik</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {par.attempts.map(a => (
                        <button key={a.attempt_id} onClick={() => openAttemptDetail(a.attempt_id)}
                          className="w-full flex items-center gap-3 bg-slate-50 rounded-lg px-3.5 py-3 text-left hover:bg-slate-100 transition-colors">
                          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">#{a.attempt_number}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">
                              {a.status === 'submitted' ? (Number(a.score) || 0) + ' poin' : '• Belum selesai'}
                              {a.auto_submitted && <span className="ml-1.5 text-[10px] font-bold text-orange-500">AUTO</span>}
                            </p>
                            <p className="text-[11px] text-slate-400">{fmtDate(a.started_at)} · {a.warnings} peringatan</p>
                          </div>
                          {a.webcam_photo && <Camera size={15} className="text-slate-400 shrink-0" />}
                          <ChevronDown size={14} className="text-slate-400 -rotate-90 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category modal */}
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

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveCategory() }}
                  placeholder="Nama kategori baru..." className={inputCls} />
                <button onClick={saveCategory} disabled={savingCategory}
                  className="inline-flex items-center gap-1.5 shrink-0 bg-[#0E6187] hover:bg-[#0E6187]/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {savingCategory ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Tambah
                </button>
              </div>

              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">Belum ada kategori</p>
                ) : categories.map(c => (
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

      {/* Paket modal */}
      {showPaketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowPaketModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{editingPaket ? 'Edit Paket Soal' : 'Buat Paket Soal'}</h2>
                <p className="text-sm text-slate-400">Atur detail paket quiz untuk kandidat</p>
              </div>
              <button onClick={() => setShowPaketModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Judul Paket <span className="text-red-500">*</span></label>
                <input value={paketForm.title} onChange={e => setPaketForm({ ...paketForm, title: e.target.value })}
                  placeholder="Contoh: Quiz Evaluasi Mingguan" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea value={paketForm.description} onChange={e => setPaketForm({ ...paketForm, description: e.target.value })}
                  rows={2} placeholder="Petunjuk atau materi singkat..." className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Cover Paket (opsional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={22} className="text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#0E6187] hover:bg-[#0E6187]/10 px-3 py-2 rounded-lg border border-[#0E6187]/30 transition-colors disabled:opacity-50">
                      {uploadingCover ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      {uploadingCover ? 'Mengunggah...' : coverPreview ? 'Ganti Cover' : 'Pilih Gambar'}
                    </button>
                    {coverPreview && (
                      <button type="button" onClick={() => { setPaketForm({ ...paketForm, cover_image: '' }); setCoverPreview('') }}
                        className="block text-xs text-red-500 hover:text-red-600">
                        Hapus cover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`${labelCls} flex items-center gap-1`}><UserCheck size={14} /> Guru Instruktur (opsional)</label>
                <select value={paketForm.user_id} onChange={e => setPaketForm({ ...paketForm, user_id: e.target.value })} className={inputCls}>
                  <option value="">Tidak ditugaskan ke guru</option>
                  {gurus.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Batch</label>
                  <select value={paketForm.batch_id} onChange={e => { setPaketForm({ ...paketForm, batch_id: e.target.value, level: '' }) }} className={inputCls}>
                    <option value="">Semua batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Level</label>
                  <select value={paketForm.level} onChange={e => setPaketForm({ ...paketForm, level: e.target.value })} className={inputCls}>
                    <option value="">Semua level</option>
                    {(paketForm.batch_id ? (batchLevels[Number(paketForm.batch_id)] || []) : []).map(lv => <option key={lv} value={lv}>Level {lv}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Kategori Paket</label>
                <div className="flex items-center gap-2">
                  <select value={paketForm.category} onChange={e => setPaketForm({ ...paketForm, category: e.target.value })} className={inputCls}>
                    <option value="">Pilih kategori</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowCategoryModal(true)}
                    className="shrink-0 px-3 py-2.5 text-sm font-medium text-[#0E6187] hover:bg-[#0E6187]/10 rounded-lg border border-[#0E6187]/30 transition-colors">
                    + Kelola
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Kaitkan ke Kursus (opsional)</label>
                <select value={paketForm.course_id} onChange={e => setPaketForm({ ...paketForm, course_id: e.target.value })} className={inputCls}>
                  <option value="">Tidak dikaitkan</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`${labelCls} flex items-center gap-1`}><Clock size={14} /> Durasi (menit)</label>
                  <input type="number" min={1} max={180} value={paketForm.time_limit_minutes}
                    onChange={e => setPaketForm({ ...paketForm, time_limit_minutes: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={`${labelCls} flex items-center gap-1`}><Repeat size={14} /> Maks Percobaan</label>
                  <input type="number" min={1} max={10} value={paketForm.max_attempts}
                    onChange={e => setPaketForm({ ...paketForm, max_attempts: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <button type="button" onClick={() => setPaketForm({ ...paketForm, shuffle_questions: !paketForm.shuffle_questions })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${paketForm.shuffle_questions ? 'bg-[#0E6187]' : 'bg-slate-300'}`}>
                  <span className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-all ${paketForm.shuffle_questions ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Template UI Quiz</label>
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
                  <p className="text-sm font-medium text-slate-700">Buka paket sekarang</p>
                  <p className="text-xs text-slate-400">Kandidat bisa langsung melihat & mulai quiz</p>
                </div>
                <button type="button" onClick={() => setPaketForm({ ...paketForm, status: paketForm.status === 'aktif' ? 'nonaktif' : 'aktif' })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${paketForm.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-all ${paketForm.status === 'aktif' ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowPaketModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button onClick={savePaket} disabled={savingPaket} className={`${primaryBtn} px-6`}>
                  {savingPaket ? 'Menyimpan...' : editingPaket ? 'Simpan Perubahan' : 'Buat Paket Soal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowQuestionModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{editingQuestion ? 'Edit Soal' : 'Tambah Soal'}</h2>
                <p className="text-sm text-slate-400">{activePaket?.title}</p>
              </div>
              <button onClick={() => setShowQuestionModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Pertanyaan <span className="text-slate-400 font-normal">(opsional)</span></label>
                <textarea value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })}
                  rows={2} placeholder="Tulis pertanyaan..." className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Bagian / Materi Soal <span className="text-slate-400 font-normal">(opsional)</span></label>
                <select value={qForm.section_id} onChange={e => setQForm({ ...qForm, section_id: e.target.value })} className={inputCls}>
                  <option value="">Tanpa bagian</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Contoh: Vocabulary, Grammar, Reading, Listening, Conversation</p>
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
                  <div className="flex items-center gap-4">
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
                  <div className="space-y-2.5">
                    {qOptions.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button type="button" onClick={() => setQForm({ ...qForm, correct_index: String(oi) })}
                          title="Tandai sebagai jawaban benar"
                          className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full border-2 transition-colors ${qForm.correct_index === String(oi) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 text-slate-400 hover:border-[#0E6187]'}`}>
                          {String.fromCharCode(65 + oi)}
                        </button>
                        <input value={opt} onChange={e => { const arr = [...qOptions]; arr[oi] = e.target.value; setQOptions(arr) }}
                          placeholder={`Opsi ${String.fromCharCode(65 + oi)}`} className={inputCls} />
                        {qOptions.length > 2 && (
                          <button type="button" onClick={() => setQOptions(qOptions.filter((_, idx) => idx !== oi))} className="p-1.5 text-red-400 hover:text-red-500 shrink-0" title="Hapus opsi">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {qOptions.length < 6 && (
                    <button type="button" onClick={() => setQOptions([...qOptions, ''])}
                      className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#0E6187]">
                      <Plus size={14} /> Tambah opsi
                    </button>
                  )}
                  <p className="text-xs text-slate-400 mt-2">Klik huruf <span className="font-bold text-emerald-500">A/B/C...</span> untuk menandai kunci jawaban.</p>
                </div>
              )}

              <div>
                <label className={labelCls}>Bobot Skor</label>
                <input type="number" min={1} value={qForm.points} onChange={e => setQForm({ ...qForm, points: e.target.value })} className={`${inputCls} max-w-[200px]`} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowQuestionModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button onClick={saveQuestion} disabled={savingQuestion} className={`${primaryBtn} px-6`}>
                  {savingQuestion ? 'Menyimpan...' : editingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attempt detail modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Detail Pengerjaan</h2>
                {detail?.siswa && <p className="text-sm text-slate-500">{detail.siswa.nama}</p>}
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm gap-2">
                  <Loader2 size={24} className="animate-spin text-[#0E6187]" /> Memuat detail...
                </div>
              ) : !detail ? (
                <div className="text-center text-sm text-red-400 py-10">Gagal memuat detail</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-xl font-bold text-[#0E6187]">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Skor</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-xl font-bold text-slate-800">{detail.attempt.correct_count ?? '-'}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Benar</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <p className="text-xl font-bold text-slate-800">{detail.attempt.warnings}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Peringatan</p>
                    </div>
                  </div>

                  {detail.attempt.webcam_photo && (
                    <div className="rounded-lg overflow-hidden border border-slate-200">
                      <img src={detail.attempt.webcam_photo} alt="Webcam" className="w-full h-auto object-cover max-h-64" />
                    </div>
                  )}

                  {detail.questions.map((dq, i) => (
                    <div key={dq.id} className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          <span className="text-slate-400 mr-1">#{i + 1}</span> {dq.question}
                        </p>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${dq.question_type === 'essay' && dq.is_correct === null && dq.answer_text?.trim() ? 'bg-amber-50 text-amber-600' : dq.is_correct === true ? 'bg-emerald-50 text-emerald-600' : dq.is_correct === false ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                          {dq.question_type === 'essay' && dq.is_correct === null && dq.answer_text?.trim() ? 'BELUM DINILAI' : dq.is_correct === true ? 'BENAR' : dq.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'}
                        </span>
                      </div>
                      {dq.question_type === 'rating' ? (
                        <div className="mt-2.5">
                          <div className="flex gap-1.5 flex-wrap">
                            {dq.options.map((opt, oi) => {
                              const isSelected = oi === dq.selected_index
                              return (
                                <span key={oi} className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold border-2 ${isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                                  {opt}
                                </span>
                              )
                            })}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            Jawaban: <span className="font-bold text-violet-600">{dq.selected_index !== null && dq.selected_index !== undefined ? dq.options[dq.selected_index] : 'Tidak diisi'}</span>
                            {dq.is_correct === true && <span className="ml-2 text-[10px] font-bold text-violet-500">TERISI · POIN DIBERIKAN</span>}
                          </p>
                        </div>
                      ) : dq.question_type === 'essay' ? (
                        <div className="mt-2.5">
                          <p className="text-xs font-semibold text-slate-500 mb-1.5">Jawaban Siswa</p>
                          <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 whitespace-pre-wrap min-h-[44px]">
                            {dq.answer_text?.trim() ? dq.answer_text : <span className="text-slate-400">Tidak diisi</span>}
                          </p>
                          {dq.keyword && (
                            <p className="text-xs text-amber-600 font-medium mt-1.5"><span className="font-semibold">Kata kunci:</span> {dq.keyword}</p>
                          )}
                          {dq.answer_text?.trim() && (
                            <div className="flex items-center gap-2.5 mt-3">
                              <div>
                                <label className="block text-xs text-slate-500 font-medium mb-1">Nilai (0-{dq.points})</label>
                                <input type="number" min={0} max={dq.points}
                                  value={grades[dq.id] ?? ''}
                                  onChange={e => setGrades(g => ({ ...g, [dq.id]: e.target.value }))}
                                  className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E6187]/20 focus:border-[#0E6187]"
                                  placeholder="-" />
                              </div>
                              <button type="button" disabled={savingGrade !== null || !grades[dq.id]?.trim()}
                                onClick={() => saveGrade(dq.id)}
                                className="self-end text-xs font-semibold text-white bg-[#0E6187] px-3.5 py-2 rounded-lg disabled:opacity-40 hover:bg-[#0E6187]/90">
                                {savingGrade === dq.id ? 'Menyimpan...' : 'Simpan Nilai'}
                              </button>
                              {dq.earned_points !== null && dq.earned_points !== undefined && (
                                <span className={`self-end text-xs font-bold px-2.5 py-1 rounded-full ${dq.is_correct === true ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                  {dq.earned_points}/{dq.points} poin
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                      <div className="mt-2.5 space-y-2">
                        {dq.options.map((opt, oi) => {
                          const isCorrect = oi === dq.correct_index
                          const isSelected = oi === dq.selected_index
                          let cls = 'bg-slate-50 text-slate-600'
                          if (isCorrect) cls = 'bg-emerald-50 text-emerald-700 font-semibold'
                          if (isSelected && !isCorrect) cls = 'bg-red-50 text-red-600 font-semibold'
                          return (
                            <div key={oi} className={`flex items-center gap-2.5 text-sm px-3.5 py-2 rounded-lg ${cls}`}>
                              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-400'}`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span>{opt}</span>
                              {isCorrect && <span className="ml-auto text-[10px] font-bold text-emerald-500 shrink-0">BENAR</span>}
                              {isSelected && !isCorrect && <span className="ml-auto text-[10px] font-bold text-red-500 shrink-0">SALAH</span>}
                            </div>
                          )
                        })}
                      </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}