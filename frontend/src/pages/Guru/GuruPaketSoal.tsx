import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, X, Trash2, ArrowLeft, HelpCircle, ListChecks, Eye,
  ChevronUp, ChevronDown, Camera, Clock, Repeat, Award, Users,
  BookOpen, Loader2, ImageIcon, UploadCloud, Mic, RotateCcw,
  LayoutGrid, ShieldCheck, Pencil, Activity,
} from 'lucide-react'
import { guruQuizApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

interface GuruPaketSoalProps {
  courseId?: number | null
  embedded?: boolean
  onBack?: () => void
  hiddenHeader?: boolean
  defaultBatchId?: number | string | null
  defaultLevel?: string | null
  initialPaketId?: number | null
}

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
  cover_image: string | null
  cover_url: string | null
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
  options: OptionEntry[]
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

interface Batch { id: number; nama_batch: string }
interface Course { id: number; title: string }
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

interface QuizOpt {
  text: string
  image_path: string | null
  image_url: string | null
}

type OptionEntry = string | { text?: string; image_path?: string | null; image_url?: string | null }

const optText = (o: OptionEntry) => (typeof o === 'string' ? o : (o?.text ?? ''))
const optAbsUrl = (o: OptionEntry) => {
  const p = typeof o === 'string' ? null : (o?.image_url || o?.image_path || null)
  if (!p) return null
  return p.startsWith('http') ? p : `${APP_URL}/storage/${p}`
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
  options: OptionEntry[]
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
  passing_score: '0', shuffle_questions: true, quiz_template: 'basic', status: 'nonaktif',
  cover_image: '',
}

const emptyQuestionForm = { question: '', section_id: '', question_type: 'choice', rating_max: '9', correct_index: '', points: '1', keyword: '', image_path: '', image_url: '', audio_path: '', audio_url: '', audio_max_plays: '2' }

export default function GuruPaketSoal({ courseId, embedded, onBack, hiddenHeader, defaultBatchId, defaultLevel, initialPaketId }: GuruPaketSoalProps) {
  const navigate = useNavigate()
  const [pakets, setPakets] = useState<Paket[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchLevels, setBatchLevels] = useState<Record<number, string[]>>({})
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<View>('list')
  const [activePaket, setActivePaket] = useState<Paket | null>(null)
  const autoOpenedRef = useRef(false)

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
  const [sections, setSections] = useState<SectionItem[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [qForm, setQForm] = useState({ ...emptyQuestionForm })
  const [qOptions, setQOptions] = useState<QuizOpt[]>([{ text: '', image_path: null, image_url: null }, { text: '', image_path: null, image_url: null }])
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [uploadingOptImg, setUploadingOptImg] = useState<number | null>(null)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showSectionListModal, setShowSectionListModal] = useState(false)
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null)
  const [sectionName, setSectionName] = useState('')
  const [savingSection, setSavingSection] = useState(false)

  const [participants, setParticipants] = useState<Participant[]>([])
  const [rLoading, setRLoading] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detail, setDetail] = useState<{ attempt: any; questions: DetailRow[]; siswa: any } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [savingGrade, setSavingGrade] = useState<number | null>(null)

  const fetchMeta = () => {
    guruQuizApi.meta().then(res => {
      setBatches(res.data.batches || [])
      setBatchLevels(res.data.batch_levels || {})
      setCourses(res.data.courses || [])
      setCategories(res.data.categories || [])
    }).catch(() => {})
  }

  const fetchPakets = () => {
    setLoading(true)
    guruQuizApi.pakets().then(res => {
      const all = res.data.pakets || []
      setPakets(courseId ? all.filter((p: Paket) => p.course_id === courseId) : all)
      if (initialPaketId && !autoOpenedRef.current) {
        const target = all.find((p: Paket) => p.id === initialPaketId)
        if (target) {
          autoOpenedRef.current = true
          openQuestions(target)
        }
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMeta()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchPakets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const openCreatePaket = () => {
    setEditingPaket(null)
    setPaketForm({
      ...emptyPaketForm,
      course_id: courseId ? String(courseId) : '',
      batch_id: defaultBatchId != null && String(defaultBatchId) !== '0' ? String(defaultBatchId) : '',
      level: defaultLevel || '',
    })
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
    guruQuizApi.uploadCover(fd)
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
      const data = {
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
      }
      if (editingPaket) {
        await guruQuizApi.updatePaket(editingPaket.id, data)
      } else {
        await guruQuizApi.storePaket(data)
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
      await guruQuizApi.storeCategory({ name: categoryForm.name.trim() })
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
        guruQuizApi.deleteCategory(c.id).then(() => {
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
        guruQuizApi.deletePaket(p.id).then(() => {
          fetchPakets()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const togglePaket = (p: Paket) => {
    guruQuizApi.togglePaket(p.id).then(() => {
      fetchPakets()
    }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal mengubah status' }))
  }

  const openQuestions = (p: Paket) => {
    setActivePaket(p)
    setView('questions')
    setQLoading(true)
    guruQuizApi.questions(p.id).then(res => {
      setQuestions(res.data.questions || [])
    }).catch(() => setQuestions([])).finally(() => setQLoading(false))
    guruQuizApi.sections(p.id).then(res => {
      setSections(res.data.sections || [])
    }).catch(() => setSections([]))
  }

  const openResults = (p: Paket) => {
    setActivePaket(p)
    setView('results')
    setRLoading(true)
    guruQuizApi.results(p.id).then(res => {
      setParticipants(res.data.participants || [])
    }).catch(() => setParticipants([])).finally(() => setRLoading(false))
  }

  const resetAttempts = (siswaId?: number, nama?: string) => {
    if (!activePaket) return
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
      guruQuizApi.resetAttempts(activePaket.id, siswaId)
        .then(r => {
          Swal.fire({ icon: 'success', title: r.data?.message || 'Percobaan direset', timer: 1500, showConfirmButton: false })
          openResults(activePaket)
        })
        .catch(() => Swal.fire({ icon: 'error', title: 'Gagal mereset percobaan' }))
    })
  }

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

  const openSectionModal = (sec: SectionItem | null) => {
    setEditingSection(sec)
    setSectionName(sec?.name || '')
    setShowSectionModal(true)
  }

  const saveSection = async () => {
    if (!activePaket) return
    const name = sectionName.trim()
    if (!name) {
      Swal.fire({ icon: 'warning', title: 'Nama bagian wajib diisi' })
      return
    }
    setSavingSection(true)
    try {
      if (editingSection) {
        await guruQuizApi.updateSection(editingSection.id, { name, sort: editingSection.sort })
      } else {
        await guruQuizApi.storeSection(activePaket.id, { name })
      }
      setShowSectionModal(false)
      const res = await guruQuizApi.sections(activePaket.id)
      setSections(res.data.sections || [])
      Swal.fire({ icon: 'success', title: editingSection ? 'Bagian diperbarui' : 'Bagian ditambahkan', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: editingSection ? 'Gagal memperbarui bagian' : 'Gagal menambahkan bagian' })
    } finally {
      setSavingSection(false)
    }
  }

  const deleteSection = (sec: SectionItem) => {
    Swal.fire({
      title: 'Hapus bagian?',
      text: `Bagian "${sec.name}" dan pengelompokan soal akan dilepas (soal tetap ada)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed && activePaket) {
        guruQuizApi.deleteSection(sec.id).then(async () => {
          const r = await guruQuizApi.sections(activePaket.id)
          setSections(r.data.sections || [])
          openQuestions(activePaket)
          Swal.fire({ icon: 'success', title: 'Bagian dihapus', timer: 1200, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus bagian' }))
      }
    })
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
      opts = qOptions
        .map(o => ({ text: o.text.trim(), image_path: o.image_path || null }))
        .filter(o => o.text || o.image_path) as unknown as string[]
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
      if (editingQuestion) {
        await guruQuizApi.updateQuestion(editingQuestion.id, data)
      } else {
        await guruQuizApi.storeQuestion(activePaket.id, data)
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
        guruQuizApi.deleteQuestion(q.id).then(() => {
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
      guruQuizApi.updateQuestion(arr[index].id, { sort: arr[index].sort }),
      guruQuizApi.updateQuestion(arr[swapIndex].id, { sort: arr[swapIndex].sort }),
    ]).catch(() => {})
  }

  const questionGroups = questions.reduce<{ section: string; items: Question[] }[]>((acc, q) => {
    const sec = q.section?.name?.trim() || ''
    const last = acc[acc.length - 1]
    if (last && last.section === sec) { last.items.push(q); return acc }
    acc.push({ section: sec, items: [q] })
    return acc
  }, [])

  const openAttemptDetail = (attemptId: number) => {
    setShowDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    setGrades({})
    guruQuizApi.attemptDetail(attemptId).then(res => {
      setDetail({ attempt: res.data.attempt, questions: res.data.questions || [], siswa: res.data.siswa })
    }).catch(() => {
      setDetail(null)
      Swal.fire({ icon: 'error', title: 'Gagal memuat detail' })
    }).finally(() => setDetailLoading(false))
  }

  const saveGrade = async (qid: number) => {
    if (!detail) return
    const q = detail.questions.find(x => x.id === qid)
    if (!q) return
    const earned = Math.max(0, Math.min(Number(grades[qid] ?? 0) || 0, Number(q.points) || 0))
    setSavingGrade(qid)
    try {
      await guruQuizApi.gradeAttempt(detail.attempt.id, { grades: [{ question_id: qid, earned_points: earned }] })
      setGrades(g => { const n = { ...g }; delete n[qid]; return n })
      setDetailLoading(true)
      const res = await guruQuizApi.attemptDetail(detail.attempt.id)
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
    <div className={`${embedded ? '' : 'min-h-screen bg-[#F4F5F8] pb-24'}`}>
      {!embedded && <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />}

      {/* Top Bar */}
      {!hiddenHeader && (
        <div className={embedded ? 'bg-white rounded-xl border border-[#E5E7EF] shadow-sm px-4 py-3 mb-3' : 'bg-white px-5 py-3.5 border-b border-[#E5E7EF]'}>
          <div className={embedded ? 'flex items-center justify-between gap-3' : 'flex items-center justify-between max-w-lg mx-auto'}>
            {embedded && view === 'list' && onBack ? (
              <button onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors">
                <ArrowLeft size={15} /> Kembali
              </button>
            ) : (
              <button onClick={backToList} disabled={view === 'list'}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors disabled:opacity-40">
                <ArrowLeft size={15} /> Kembali
              </button>
            )}
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-[#0069b0]" />
              <h1 className="text-sm font-bold text-[#14182B]">Paket Soal / Quiz</h1>
            </div>
            {view === 'list' && !hiddenHeader && (
              <button onClick={openCreatePaket}
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3 py-1.5 rounded-lg hover:bg-[#004d7a] transition-colors">
                <Plus size={13} /> Buat
              </button>
            )}
          </div>
        </div>
      )}

      <div className={embedded ? 'space-y-3' : 'px-4 pt-4 max-w-lg mx-auto space-y-3'}>
        {hiddenHeader && view === 'list' && pakets.length > 0 && (
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#14182B]">Paket Soal ({pakets.length})</h2>
            <button onClick={openCreatePaket}
              className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3 py-1.5 rounded-lg hover:bg-[#004d7a] transition-colors">
              <Plus size={13} /> Buat
            </button>
          </div>
        )}
        {hiddenHeader && view !== 'list' && (
          <button onClick={backToList}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors">
            <ArrowLeft size={15} /> Kembali
          </button>
        )}
        {view === 'list' && (
          loading ? (
            <div className="text-center text-xs text-[#8B90A0] py-16">Memuat paket soal...</div>
          ) : pakets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EF] p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0069b0]/[0.06] flex items-center justify-center mb-3">
                <ListChecks size={26} className="text-[#0069b0]" />
              </div>
              <p className="text-sm font-bold text-[#14182B]">Belum ada paket soal</p>
              <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Buat paket soal MCQ untuk kandidat Anda</p>
              <button onClick={openCreatePaket}
                className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#0069b0] px-4 py-2 rounded-lg hover:bg-[#004d7a] transition-colors">
                <Plus size={13} /> Buat Paket Soal
              </button>
            </div>
          ) : (
            pakets.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
                {p.cover_url && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-[#E5E7EF] mb-4 -mt-1">
                    <img src={p.cover_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#14182B] truncate">{p.title}</h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-[#8B90A0]'}`}>
                        {p.status === 'aktif' ? 'Dibuka' : 'Ditutup'}
                      </span>
                    </div>
                      {p.category && (
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0069b0]/[0.08] text-[#0069b0] mt-1">
                          {p.category}
                        </span>
                      )}
                    <p className="text-[11px] text-[#8B90A0] font-medium mt-1">{scopeLabel(p)}</p>
                  </div>
                  <button
                    onClick={() => togglePaket(p)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${p.status === 'aktif' ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    title={p.status === 'aktif' ? 'Tutup paket' : 'Buka paket'}>
                    <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${p.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                  </button>
                </div>

                {p.description && <p className="text-[11px] text-[#4B5063] mt-2 line-clamp-2">{p.description}</p>}

                {/* stats */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-[#F4F5F8] rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-[#14182B]">{p.questions_count}</p>
                    <p className="text-[10px] text-[#8B90A0] font-semibold">Soal</p>
                  </div>
                  <div className="bg-[#F4F5F8] rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-[#14182B]">{p.attempts_count}</p>
                    <p className="text-[10px] text-[#8B90A0] font-semibold">Pengerjaan</p>
                  </div>
                  <div className="bg-[#F4F5F8] rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-[#14182B]">{p.participants}</p>
                    <p className="text-[10px] text-[#8B90A0] font-semibold">Peserta</p>
                  </div>
                  <div className="bg-[#F4F5F8] rounded-xl p-2.5 text-center">
                    <p className="text-sm font-bold text-[#14182B]">{Number(p.best_score) || '-'}</p>
                    <p className="text-[10px] text-[#8B90A0] font-semibold">Nilai Terbaik</p>
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button onClick={() => openQuestions(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-[#0069b0] py-2 rounded-lg hover:bg-[#004d7a] transition-colors">
                    <ListChecks size={13} /> Soal ({p.questions_count})
                  </button>
                  <button onClick={() => openResults(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] py-2 rounded-lg hover:bg-[#0069b0]/10 transition-colors">
                    <Eye size={13} /> Hasil
                  </button>
                  <button onClick={() => navigate(`/guru-paket-soal/monitor/${p.id}`, { state: { title: p.title } })}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-[#D93025] py-2 rounded-lg hover:bg-[#b5261b] transition-colors"
                    title="Monitor langsung (kamera pengawas + progres pengerjaan)">
                    <Activity size={13} /> Monitor
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditPaket(p)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF] transition-colors" title="Edit">
                      <Repeat size={14} className="text-[#4B5063]" />
                    </button>
                    <button onClick={() => deletePaket(p)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors" title="Hapus">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {view === 'questions' && activePaket && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#E5E7EF] p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#14182B] truncate">{activePaket.title}</h2>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">{questions.length} soal · {scopeLabel(activePaket)}</p>
                </div>
                <button onClick={openCreateQuestion}
                  className="flex items-center gap-1 text-[11px] font-bold text-white bg-[#0069b0] px-3 py-2 rounded-lg hover:bg-[#004d7a] transition-colors shrink-0">
                  <Plus size={13} /> Tambah Soal
                </button>
              </div>
            </div>

            {qLoading ? (
              <div className="text-center text-xs text-[#8B90A0] py-12">Memuat soal...</div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EF] p-10 text-center">
                <p className="text-sm font-bold text-[#14182B]">Belum ada soal</p>
                <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Tambahkan minimal 1 soal untuk paket ini</p>
              </div>
            ) : (
              questionGroups.map(g => (
                <div key={g.section || '__none'}>
                  <div className="flex items-center gap-2 px-1 pt-2 pb-1">
                    <span className="w-1 h-5 rounded-full bg-[#0069b0]" />
                    <span className="text-[11px] font-bold text-[#14182B] uppercase tracking-wide">{g.section || 'Umum'}</span>
                    <span className="text-[9.5px] text-[#8B90A0] font-semibold">{g.items.length} soal</span>
                  </div>
                  <div className="space-y-3">
                    {g.items.map(q => {
                      const i = questions.indexOf(q)
                      return (
                        <div key={q.id} className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1 mt-0.5">
                              <button onClick={() => moveQuestion(i, 'up')} className="p-0.5 text-[#8B90A0] hover:text-[#0069b0]" disabled={i === 0}>
                                <ChevronUp size={16} />
                              </button>
                              <button onClick={() => moveQuestion(i, 'down')} className="p-0.5 text-[#8B90A0] hover:text-[#0069b0]" disabled={i === questions.length - 1}>
                                <ChevronDown size={16} />
                              </button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-[12.5px] font-bold text-[#14182B] leading-snug">{q.question}</p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={() => openEditQuestion(q)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF] transition-colors">
                                    <Repeat size={13} className="text-[#4B5063]" />
                                  </button>
                                  <button onClick={() => deleteQuestion(q)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                                    <Trash2 size={13} className="text-red-500" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 space-y-1.5">
                                {q.question_type === 'rating' ? (
                                  <div className="flex items-center gap-2 text-[11.5px] px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 font-bold">
                                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500 text-white text-[9px] font-bold shrink-0">SKALA</span>
                                    <span>Rating 1–{q.rating_max || q.options.length}</span>
                                    <span className="ml-auto text-[9.5px] font-bold text-violet-400 shrink-0">TANPA KUNCI</span>
                                  </div>
                                ) : (q.options.map((opt, oi) => (
                                  <div key={oi} className={`flex items-center gap-2 text-[11.5px] px-3 py-1.5 rounded-lg ${oi === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-[#F4F5F8] text-[#4B5063] font-medium'}`}>
                                    <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${oi === q.correct_index ? 'bg-emerald-500 text-white' : 'bg-[#E5E7EF] text-[#8B90A0]'}`}>
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    {optAbsUrl(opt) && <img src={optAbsUrl(opt)} className="h-5 w-5 rounded-md object-cover shrink-0" alt="" />}
                                    {optText(opt) && <span>{optText(opt)}</span>}
                                    {oi === q.correct_index && <span className="ml-auto text-[9.5px] font-bold text-emerald-500 shrink-0">BENAR</span>}
                                  </div>
                                )))}
                              </div>
                              <p className="text-[10px] text-[#8B90A0] font-semibold mt-2">Skor: {q.points} poin</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'results' && activePaket && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-[#E5E7EF] p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0069b0]/[0.06] flex items-center justify-center">
                  <Award size={17} className="text-[#0069b0]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-[#14182B] truncate">Hasil · {activePaket.title}</h2>
                  <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">{participants.length} peserta mengerjakan</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => navigate(`/guru-paket-soal/monitor/${activePaket.id}`, { state: { title: activePaket.title } })}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0069b0] hover:text-[#004d7a] border border-[#0069b0]/30 rounded-lg px-2.5 py-1.5 hover:bg-[#0069b0]/5 transition-colors shrink-0"
                    title="Pantau kandidat secara langsung (foto kamera + progres)">
                    <Activity size={11} /> Monitor Langsung
                  </button>
                  {participants.length > 0 && (
                  <button onClick={() => resetAttempts()}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition-colors shrink-0"
                    title="Reset semua percobaan paket ini">
                    <RotateCcw size={11} /> Reset Semua
                  </button>
                  )}
                </div>
              </div>
            </div>

            {rLoading ? (
              <div className="text-center text-xs text-[#8B90A0] py-12">Memuat hasil...</div>
            ) : participants.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#E5E7EF] p-10 text-center">
                <Users size={26} className="text-[#8B90A0] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#14182B]">Belum ada peserta</p>
                <p className="text-[11px] text-[#8B90A0] font-medium mt-1">Hasil akan muncul setelah kandidat mengerjakan quiz</p>
              </div>
            ) : (
              participants.map(par => (
                <div key={par.siswa_id} className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center shrink-0">
                      <Users size={15} className="text-[#0069b0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#14182B]">{par.nama}</p>
                      <p className="text-[10.5px] text-[#8B90A0] font-medium">
                        {[par.batch && `Batch ${par.batch}`, par.level !== null && `Level ${par.level}`].filter(Boolean).join(' · ') || '-'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-[#0069b0]">{Number(par.best_score) || 0}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Nilai Terbaik</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {par.attempts.map(a => (
                      <button key={a.attempt_id} onClick={() => openAttemptDetail(a.attempt_id)}
                        className="w-full flex items-center gap-3 bg-[#F4F5F8] rounded-xl px-3 py-2.5 text-left hover:bg-[#E5E7EF] transition-colors">
                        <span className="text-[11px] font-bold text-[#8B90A0] bg-white border border-[#E5E7EF] px-2 py-0.5 rounded-lg">#{a.attempt_number}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-[#4B5063]">
                            {a.status === 'submitted' ? (Number(a.score) || 0) + ' poin' : '• Belum selesai'}
                            {a.auto_submitted && <span className="ml-1 text-[9px] font-bold text-orange-500">AUTO</span>}
                          </p>
                          <p className="text-[9.5px] text-[#8B90A0] font-medium">{fmtDate(a.started_at)} · {a.warnings} peringatan</p>
                        </div>
                        {a.webcam_photo && <Camera size={14} className="text-[#8B90A0] shrink-0" />}
                        <ChevronDown size={13} className="text-[#8B90A0] -rotate-90 shrink-0" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#F0F1F5] flex justify-end">
                    <button onClick={() => resetAttempts(par.siswa_id, par.nama)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors">
                      <RotateCcw size={11} /> Reset Percobaan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Category modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Kelola Kategori Paket</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">Tambahkan atau hapus kategori quiz</p>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveCategory() }}
                  placeholder="Nama kategori baru..." className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                <button onClick={saveCategory} disabled={savingCategory}
                  className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-3 rounded-xl hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                  {savingCategory ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Tambah
                </button>
              </div>

              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-xs text-[#8B90A0] text-center py-6">Belum ada kategori</p>
                ) : categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-[#F4F5F8] rounded-xl px-4 py-2.5">
                    <span className="text-xs font-bold text-[#4B5063]">{c.name}</span>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowPaketModal(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">{editingPaket ? 'Edit Paket Soal' : 'Buat Paket Soal'}</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">Atur detail paket quiz untuk kandidat</p>
              </div>
              <button onClick={() => setShowPaketModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Judul Paket <span className="text-red-400">*</span></label>
                <input value={paketForm.title} onChange={e => setPaketForm({ ...paketForm, title: e.target.value })}
                  placeholder="Contoh: Quiz Evaluasi Mingguan" className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Deskripsi</label>
                <textarea value={paketForm.description} onChange={e => setPaketForm({ ...paketForm, description: e.target.value })}
                  rows={2} placeholder="Petunjuk atau materi singkat..." className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 resize-none" />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Cover Paket (opsional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-28 h-20 rounded-xl overflow-hidden border border-[#E5E7EF] bg-[#F4F5F8] flex items-center justify-center shrink-0">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen size={20} className="text-[#c4c9d6]" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
                    <button type="button" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0069b0] hover:bg-[#0069b0]/[0.06] px-3 py-2 rounded-lg border border-[#0069b0]/20 transition-colors disabled:opacity-50">
                      {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                      {uploadingCover ? 'Mengunggah...' : coverPreview ? 'Ganti Cover' : 'Pilih Gambar'}
                    </button>
                    {coverPreview && (
                      <button type="button" onClick={() => { setPaketForm({ ...paketForm, cover_image: '' }); setCoverPreview('') }}
                        className="block text-[10px] text-red-400 hover:text-red-500">
                        Hapus cover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Batch</label>
                  <select value={paketForm.batch_id} onChange={e => { setPaketForm({ ...paketForm, batch_id: e.target.value, level: '' }) }}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3 py-3 focus:outline-none focus:border-[#0069b0] bg-white">
                    <option value="">Semua batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Level</label>
                  <select value={paketForm.level} onChange={e => setPaketForm({ ...paketForm, level: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3 py-3 focus:outline-none focus:border-[#0069b0] bg-white">
                    <option value="">Semua level</option>
                    {(() => {
                      const bid = paketForm.batch_id
                      const lvls = bid ? (batchLevels[Number(bid)] || []) : []
                      const isDefaultBatch = defaultBatchId != null && String(defaultBatchId) === String(bid)
                      const all = isDefaultBatch && defaultLevel && !lvls.includes(defaultLevel) ? [defaultLevel, ...lvls] : lvls
                      return all.map(lv => <option key={lv} value={lv}>Level {lv}</option>)
                    })()}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Kategori Paket</label>
                <div className="flex items-center gap-2">
                  <select value={paketForm.category} onChange={e => setPaketForm({ ...paketForm, category: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3 py-3 focus:outline-none focus:border-[#0069b0] bg-white">
                    <option value="">Pilih kategori</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowCategoryModal(true)}
                    className="shrink-0 text-[11px] font-bold text-[#0069b0] px-3 py-2.5 rounded-xl border border-[#0069b0]/20 hover:bg-[#0069b0]/[0.06] transition-colors">
                    + Kelola
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Kaitkan ke Kursus (opsional)</label>
                <select value={paketForm.course_id} onChange={e => setPaketForm({ ...paketForm, course_id: e.target.value })}
                  className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3 py-3 focus:outline-none focus:border-[#0069b0] bg-white">
                  <option value="">Tidak dikaitkan</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block flex items-center gap-1"><Clock size={11} /> Durasi (menit)</label>
                  <input type="number" min={1} max={180} value={paketForm.time_limit_minutes}
                    onChange={e => setPaketForm({ ...paketForm, time_limit_minutes: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block flex items-center gap-1"><Repeat size={11} /> Maks Percobaan</label>
                  <input type="number" min={1} max={10} value={paketForm.max_attempts}
                    onChange={e => setPaketForm({ ...paketForm, max_attempts: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Maks Peringatan</label>
                  <input type="number" min={1} max={10} value={paketForm.max_warnings}
                    onChange={e => setPaketForm({ ...paketForm, max_warnings: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4B5063] mb-1.5 block">Nilai Lulus (0-100)</label>
                  <input type="number" min={0} max={100} value={paketForm.passing_score}
                    onChange={e => setPaketForm({ ...paketForm, passing_score: e.target.value })}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#F4F5F8] rounded-xl px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold text-[#4B5063]">Acak urutan soal</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium">Soal tampil beda urutan tiap percobaan</p>
                </div>
                <button onClick={() => setPaketForm({ ...paketForm, shuffle_questions: !paketForm.shuffle_questions })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${paketForm.shuffle_questions ? 'bg-[#0069b0]' : 'bg-gray-300'}`}>
                  <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${paketForm.shuffle_questions ? 'left-[20px]' : 'left-[2px]'}`} />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5063] mb-2 block">Template UI Quiz</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, quiz_template: 'basic' })}
                    className={`flex flex-col items-center gap-2 border-2 rounded-xl px-3 py-4 text-center transition-all ${
                      paketForm.quiz_template !== 'jft'
                        ? 'border-[#0069b0] bg-[#0069b0]/[0.04] ring-1 ring-[#0069b0]/20'
                        : 'border-[#E5E7EF] hover:border-[#D6D9E1]'
                    }`}>
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                      paketForm.quiz_template !== 'jft' ? 'bg-[#0069b0] text-white' : 'bg-[#F4F5F8] text-[#8B90A0]'
                    }`}>
                      <LayoutGrid size={18} />
                    </span>
                    <span>
                      <span className="block text-[11.5px] font-bold text-[#14182B]">Basic</span>
                      <span className="block text-[9.5px] text-[#8B90A0] font-medium mt-0.5">Sederhana & fokus</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setPaketForm({ ...paketForm, quiz_template: 'jft' })}
                    className={`flex flex-col items-center gap-2 border-2 rounded-xl px-3 py-4 text-center transition-all ${
                      paketForm.quiz_template === 'jft'
                        ? 'border-[#1f2022] bg-[#1f2022] ring-1 ring-[#1f2022]/20'
                        : 'border-[#E5E7EF] hover:border-[#D6D9E1]'
                    }`}>
                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                      paketForm.quiz_template === 'jft' ? 'bg-[#5e8b5d] text-white' : 'bg-[#F4F5F8] text-[#8B90A0]'
                    }`}>
                      <ShieldCheck size={18} />
                    </span>
                    <span>
                      <span className={`block text-[11.5px] font-bold ${paketForm.quiz_template === 'jft' ? 'text-white' : 'text-[#14182B]'}`}>JFT UI</span>
                      <span className={`block text-[9.5px] font-medium mt-0.5 ${paketForm.quiz_template === 'jft' ? 'text-white/60' : 'text-[#8B90A0]'}`}>Kamera & pengawasan</span>
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-[#8B90A0] font-medium mt-2">
                  {paketForm.quiz_template === 'jft'
                    ? 'JFT UI: tampilan quiz lengkap dengan pengawasan kamera. Sistem mengambil foto berkala & memberi peringatan.'
                    : 'Basic: tampilan quiz sederhana dengan kamera pengawas & keamanan aktif — foto berkala & peringatan otomatis.'}
                </p>
              </div>

              <div className="flex items-center justify-between bg-[#F4F5F8] rounded-xl px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold text-[#4B5063]">Buka paket sekarang</p>
                  <p className="text-[10px] text-[#8B90A0] font-medium">Kandidat bisa langsung melihat & mulai quiz</p>
                </div>
                <button onClick={() => setPaketForm({ ...paketForm, status: paketForm.status === 'aktif' ? 'nonaktif' : 'aktif' })}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${paketForm.status === 'aktif' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${paketForm.status === 'aktif' ? 'left-[20px]' : 'left-[2px]'}`} />
                </button>
              </div>

              <button onClick={savePaket} disabled={savingPaket}
                className="w-full text-[12px] font-bold text-white bg-[#0069b0] py-3 rounded-xl hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                {savingPaket ? 'Menyimpan...' : editingPaket ? 'Simpan Perubahan' : 'Buat Paket Soal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowQuestionModal(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">{editingQuestion ? 'Edit Soal' : 'Tambah Soal'}</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">{activePaket?.title}</p>
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
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.questions_count ? ` (${s.questions_count})` : ''}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => openSectionModal(null)}
                    className="shrink-0 px-3 py-3 text-[10px] font-bold text-[#0069b0] border border-[#0069b0]/30 rounded-xl hover:bg-[#0069b0]/5">
                    + Bagian
                  </button>
                </div>
                {sections.length > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9.5px] font-bold text-[#8B90A0] uppercase tracking-wide">Bagian di paket ini:</span>
                    <button type="button" onClick={() => setShowSectionListModal(true)}
                      className="text-[10px] font-bold text-[#0069b0] hover:underline">
                      Kelola bagian
                    </button>
                  </div>
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

              <button onClick={saveQuestion} disabled={savingQuestion}
                className="w-full text-[12px] font-bold text-white bg-[#0069b0] py-3 rounded-xl hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                {savingQuestion ? 'Menyimpan...' : editingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attempt detail modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Detail Pengerjaan</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">{detail?.siswa?.nama || 'Kandidat'} · Percobaan #{detail?.attempt?.attempt_number}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {detailLoading || !detail ? (
                <div className="text-center text-xs text-[#8B90A0] py-12">Memuat detail...</div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#F4F5F8] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{Number(detail.attempt.score) || 0}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Skor</p>
                    </div>
                    <div className="bg-[#F4F5F8] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{detail.attempt.correct_count}/{detail.attempt.total_count}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Jawaban Benar</p>
                    </div>
                    <div className="bg-[#F4F5F8] rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-[#14182B]">{detail.attempt.warnings}</p>
                      <p className="text-[10px] text-[#8B90A0] font-semibold">Peringatan</p>
                    </div>
                  </div>

                  {detail.attempt.webcam_photo && (
                    <div>
                      <p className="text-[11px] font-bold text-[#4B5063] mb-2 flex items-center gap-1.5"><Camera size={12} /> Foto Pengerjaan</p>
                      <img src={detail.attempt.webcam_photo} alt="Webcam" className="w-full rounded-xl border border-[#E5E7EF] max-h-52 object-cover" />
                    </div>
                  )}

                  <div className="space-y-3">
                    {detail.questions.map((q, i) => (
                      <div key={q.id} className="border border-[#E5E7EF] rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] font-bold text-[#14182B] leading-snug">{i + 1}. {q.question}</p>
                          <span className={`text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-full ${q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'bg-amber-50 text-amber-600' : q.is_correct === true ? 'bg-emerald-50 text-emerald-600' : q.is_correct === false ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-[#8B90A0]'}`}>
                            {q.question_type === 'essay' && q.is_correct === null && q.answer_text?.trim() ? 'BELUM DINILAI' : q.is_correct === true ? 'BENAR' : q.is_correct === false ? 'SALAH' : 'TIDAK DIJAWAB'}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {q.question_type === 'rating' ? (
                            <div>
                              <div className="flex gap-1 flex-wrap">
                                {q.options.map((opt, oi) => {
                                  const isSelected = q.selected_index === oi
                                  return (
                                    <span key={oi} className={`w-8 h-8 flex items-center justify-center rounded-full text-[11px] font-bold border-2 ${isSelected ? 'border-violet-500 bg-violet-500 text-white' : 'border-[#E5E7EF] bg-[#F4F5F8] text-[#8B90A0]'}`}>
                                      {optText(opt)}
                                    </span>
                                  )
                                })}
                              </div>
                              <p className="text-[10px] text-[#8B90A0] font-medium mt-1.5">
                                Jawaban: <span className="font-bold text-violet-600">{q.selected_index !== null && q.selected_index !== undefined ? optText(q.options[q.selected_index]) : 'Tidak diisi'}</span>
                                {q.is_correct === true && <span className="ml-2 text-[9px] font-bold text-violet-500">TERISI · POIN DIBERIKAN</span>}
                              </p>
                            </div>
                          ) : q.question_type === 'essay' ? (
                            <div>
                              <div className="text-[10px] font-bold text-[#4B5063] mb-1.5">Jawaban Siswa</div>
                              <p className="text-[11px] text-[#14182B] bg-[#F4F5F8] border border-[#E5E7EF] rounded-lg px-3 py-2.5 whitespace-pre-wrap min-h-[44px]">
                                {q.answer_text?.trim() ? q.answer_text : <span className="text-[#8B90A0]">Tidak diisi</span>}
                              </p>
                              {q.keyword && (
                                <p className="text-[10px] text-amber-600 font-medium mt-1.5"><span className="font-bold">Kata kunci:</span> {q.keyword}</p>
                              )}
                              {q.answer_text?.trim() && (
                                <div className="flex items-center gap-2 mt-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-[#4B5063] block mb-1">Nilai (0–{q.points})</label>
                                    <input type="number" min={0} max={q.points}
                                      value={grades[q.id] ?? ''}
                                      onChange={e => setGrades(g => ({ ...g, [q.id]: e.target.value }))}
                                      className="w-24 text-xs border border-[#E5E7EF] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10"
                                      placeholder="-" />
                                  </div>
                                  <button type="button" disabled={savingGrade !== null || !grades[q.id]?.trim()}
                                    onClick={() => saveGrade(q.id)}
                                    className="self-end text-[11px] font-bold text-white bg-[#0069b0] px-3.5 py-2 rounded-lg disabled:opacity-40 hover:bg-[#004d7a]">
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
                            return (
                              <div key={oi}
                                className={`flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg font-medium ${isCorrect ? 'bg-emerald-50 text-emerald-700 font-bold' : isSelected ? 'bg-red-50 text-red-500 font-bold' : 'bg-[#F4F5F8] text-[#4B5063]'}`}>
                                <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-red-500 text-white' : 'bg-[#E5E7EF] text-[#8B90A0]'}`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                {optAbsUrl(opt) && <img src={optAbsUrl(opt)} className="h-5 w-5 rounded-md object-cover shrink-0" alt="" />}
                                <span className="flex-1">{optText(opt)}</span>
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

      {/* Section add/edit modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowSectionModal(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-bold text-[#14182B] mb-1">{editingSection ? 'Ubah Bagian' : 'Tambah Bagian'}</h2>
            <p className="text-[10px] text-[#8B90A0] font-medium mb-4">Bagian dipakai untuk mengelompokkan soal (contoh: Vocabulary, Grammar, Listening)</p>
            <input autoFocus value={sectionName} onChange={e => setSectionName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveSection() }}
              placeholder="Nama bagian..." className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 mb-4 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10" />
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSectionModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#4B5063] bg-[#F4F5F8] hover:bg-[#E5E7EF]">Batal</button>
              <button onClick={saveSection} disabled={savingSection}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0069b0] hover:bg-[#E3A62B] disabled:opacity-50">
                {savingSection ? 'Menyimpan...' : editingSection ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section list/manage modal */}
      {showSectionListModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={() => setShowSectionListModal(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#F0F1F5] sticky top-0 bg-white">
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">Kelola Bagian</h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">{activePaket?.title}</p>
              </div>
              <button onClick={() => setShowSectionListModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF]">
                <X size={15} className="text-[#4B5063]" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {sections.map(s => (
                <div key={s.id} className="flex items-center gap-2 border border-[#E5E7EF] rounded-xl px-3 py-2.5">
                  <span className="flex-1 text-xs font-bold text-[#14182B]">{s.name}</span>
                  <span className="text-[10px] font-medium text-[#8B90A0]">{s.questions_count} soal</span>
                  <button onClick={() => { setShowSectionListModal(false); openSectionModal(s) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F4F5F8] hover:bg-[#E5E7EF] text-[#4B5063]">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteSection(s)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {sections.length === 0 && (
                <p className="text-[11px] text-[#8B90A0] font-medium text-center py-6">Belum ada bagian. Tambah bagian untuk mengelompokkan soal.</p>
              )}
              <button onClick={() => { setShowSectionListModal(false); openSectionModal(null) }}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold text-[#0069b0] border border-dashed border-[#0069b0]/40 hover:bg-[#0069b0]/5">
                + Tambah Bagian
              </button>
            </div>
          </div>
        </div>
      )}

      {!embedded && (
        <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
          homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
          laporanHref="/guru-dashboard" profilHref="/guru-profil" />
      )}
    </div>
  )
}