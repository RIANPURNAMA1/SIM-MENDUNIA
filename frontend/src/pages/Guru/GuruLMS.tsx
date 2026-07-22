import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BookOpen, Plus, FileText, X, Image as ImageIcon, Download, Trash2,
  ChevronRight, ArrowLeft, Layers, Search, Video, GripVertical, Edit3,
  ChevronUp, ChevronDown, Upload, FolderOpen, ListChecks, Eye, EyeOff
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { guruLmsApi, lmsAdminApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

interface Course {
  id: number
  title: string
  description: string | null
  level: string | null
  batch_id: number | null
  image: string | null
  sort: number
  status: string
  lessons_count: number
  files_count: number
}

interface CourseFile {
  id: number
  course_id: number
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
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
  status: string
}

interface Batch {
  id: number
  nama_batch: string
}

type TabType = 'lessons' | 'files' | 'tugas'

export default function GuruLMS() {
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([])
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('lessons')
  const [detailLoading, setDetailLoading] = useState(false)

  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [savingCourse, setSavingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: '', batch_id: '', sort: '0', status: 'aktif' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const quillRef = useRef<any>(null)
  const [batchLevels, setBatchLevels] = useState<Record<number, string[]>>({})

  const [showLessonModal, setShowLessonModal] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_url: '', sort: '0', status: 'aktif' })
  const [lessonFile, setLessonFile] = useState<File | null>(null)
  const [lessonFilePreview, setLessonFilePreview] = useState<{ name: string; size: string } | null>(null)
  const lessonQuillRef = useRef<any>(null)
  const [lessonUploading, setLessonUploading] = useState(false)

  const [fileUploading, setFileUploading] = useState(false)

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
            setUploading(true)
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
              setUploading(false)
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
            setUploading(true)
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
              setUploading(false)
            }
          }
          input.click()
        },
      },
    },
  }

  const lessonQuillModules = {
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
            setLessonUploading(true)
            try {
              const fd = new FormData()
              fd.append('file', file)
              const res = await lmsAdminApi.upload(fd)
              const quill = lessonQuillRef.current?.getEditor()
              const range = quill?.getSelection()
              quill?.insertEmbed(range?.index || 0, 'image', res.data.url)
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal upload gambar' })
            } finally {
              setLessonUploading(false)
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
            setLessonUploading(true)
            try {
              const fd = new FormData()
              fd.append('file', file)
              const res = await lmsAdminApi.upload(fd)
              const quill = lessonQuillRef.current?.getEditor()
              const range = quill?.getSelection(true)
              quill?.insertText(range?.index || 0, ` ${file.name} `, 'link', res.data.url)
              quill?.setSelection((range?.index || 0) + file.name.length + 2)
            } catch {
              Swal.fire({ icon: 'error', title: 'Gagal upload file' })
            } finally {
              setLessonUploading(false)
            }
          }
          input.click()
        },
      },
    },
  }

  const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image', 'video']

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = () => {
    setLoading(true)
    guruLmsApi.courses().then(res => {
      setCourses(res.data.courses || [])
      setBatches(res.data.batches || [])
      setBatchLevels(res.data.batch_levels || {})
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const fetchCourseDetail = useCallback((courseId: number) => {
    setDetailLoading(true)
    guruLmsApi.lessons(courseId).then(res => {
      setCourseLessons(res.data.lessons || [])
    }).catch(() => setCourseLessons([]))
    guruLmsApi.courseFiles(courseId).then(res => {
      setCourseFiles(res.data.files || [])
    }).catch(() => setCourseFiles([])).finally(() => setDetailLoading(false))
  }, [])

  const openCourse = (course: Course) => {
    setSelectedCourse(course)
    setActiveTab('lessons')
    fetchCourseDetail(course.id)
  }

  const openCreateCourse = () => {
    setEditingCourse(null)
    setCourseForm({ title: '', description: '', level: '', batch_id: '', sort: '0', status: 'aktif' })
    setImageFile(null)
    setImagePreview(null)
    setPendingFiles([])
    setShowCourseModal(true)
  }

  const openEditCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      description: course.description || '',
      level: course.level || '',
      batch_id: course.batch_id?.toString() || '',
      sort: course.sort.toString(),
      status: course.status,
    })
    setImageFile(null)
    setImagePreview(course.image ? `${APP_URL}/storage/${course.image}` : null)
    setPendingFiles([])
    setShowCourseModal(true)
  }

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul kursus wajib diisi' })
      return
    }
    setSavingCourse(true)
    try {
      const fd = new FormData()
      fd.append('title', courseForm.title)
      fd.append('description', courseForm.description)
      fd.append('level', courseForm.level)
      fd.append('batch_id', courseForm.batch_id)
      fd.append('sort', courseForm.sort || '0')
      fd.append('status', courseForm.status)
      if (imageFile) fd.append('image', imageFile)

      if (editingCourse) {
        await guruLmsApi.updateCourse(editingCourse.id, fd)
      } else {
        const res = await guruLmsApi.storeCourse(fd)
        const newCourseId = res.data?.course?.id
        if (newCourseId && pendingFiles.length > 0) {
          for (const pf of pendingFiles) {
            const pfd = new FormData()
            pfd.append('course_id', String(newCourseId))
            pfd.append('file', pf)
            await guruLmsApi.storeCourseFile(pfd)
          }
        }
      }
      setShowCourseModal(false)
      fetchCourses()
      Swal.fire({ icon: 'success', title: editingCourse ? 'Kursus diperbarui' : 'Kursus dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan kursus' })
    } finally {
      setSavingCourse(false)
    }
  }

  const handleDeleteCourse = (course: Course) => {
    Swal.fire({
      title: 'Hapus kursus?',
      text: `"${course.title}" dan semua pelajaran di dalamnya akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        guruLmsApi.deleteCourse(course.id).then(() => {
          fetchCourses()
          if (selectedCourse?.id === course.id) setSelectedCourse(null)
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  // Lesson CRUD
  const openCreateLesson = () => {
    setEditingLesson(null)
    setLessonForm({ title: '', content: '', video_url: '', sort: String(courseLessons.length + 1), status: 'aktif' })
    setLessonFile(null)
    setLessonFilePreview(null)
    setShowLessonModal(true)
  }

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      sort: lesson.sort.toString(),
      status: lesson.status,
    })
    setLessonFile(null)
    setLessonFilePreview(lesson.file_name ? { name: lesson.file_name, size: lesson.file_size ? formatFileSize(lesson.file_size) : '' } : null)
    setShowLessonModal(true)
  }

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul pelajaran wajib diisi' })
      return
    }
    if (!selectedCourse) return
    setSavingLesson(true)
    try {
      const fd = new FormData()
      fd.append('course_id', String(selectedCourse.id))
      fd.append('title', lessonForm.title)
      fd.append('content', lessonForm.content)
      fd.append('video_url', lessonForm.video_url)
      fd.append('sort', lessonForm.sort || '0')
      fd.append('status', lessonForm.status)
      if (lessonFile) fd.append('file', lessonFile)

      if (editingLesson) {
        await guruLmsApi.updateLesson(editingLesson.id, fd)
      } else {
        await guruLmsApi.storeLesson(fd)
      }
      setShowLessonModal(false)
      fetchCourseDetail(selectedCourse.id)
      fetchCourses()
      Swal.fire({ icon: 'success', title: editingLesson ? 'Pelajaran diperbarui' : 'Pelajaran dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan pelajaran' })
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteLesson = (lesson: Lesson) => {
    Swal.fire({
      title: 'Hapus pelajaran?',
      text: `"${lesson.title}" akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        guruLmsApi.deleteLesson(lesson.id).then(() => {
          if (selectedCourse) fetchCourseDetail(selectedCourse.id)
          fetchCourses()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...courseLessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return

    const tempSort = newLessons[index].sort
    newLessons[index].sort = newLessons[swapIndex].sort
    newLessons[swapIndex].sort = tempSort

    const tempLesson = newLessons[index]
    newLessons[index] = newLessons[swapIndex]
    newLessons[swapIndex] = tempLesson

    setCourseLessons(newLessons)

    Promise.all([
      (() => { const fd = new FormData(); fd.append('sort', String(newLessons[index].sort)); return guruLmsApi.updateLesson(newLessons[index].id, fd) })(),
      (() => { const fd = new FormData(); fd.append('sort', String(newLessons[swapIndex].sort)); return guruLmsApi.updateLesson(newLessons[swapIndex].id, fd) })(),
    ]).catch(() => { if (selectedCourse) fetchCourseDetail(selectedCourse.id) })
  }

  const toggleLessonStatus = (lesson: Lesson) => {
    const newStatus = lesson.status === 'aktif' ? 'nonaktif' : 'aktif'
    const fd = new FormData()
    fd.append('status', newStatus)
    guruLmsApi.updateLesson(lesson.id, fd).then(() => {
      if (selectedCourse) fetchCourseDetail(selectedCourse.id)
    }).catch(() => {})
  }

  // File management
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCourse) return

    setFileUploading(true)
    const fd = new FormData()
    fd.append('course_id', String(selectedCourse.id))
    fd.append('file', file)
    guruLmsApi.storeCourseFile(fd).then(res => {
      setCourseFiles(prev => [res.data.file, ...prev])
      fetchCourses()
      Swal.fire({ icon: 'success', title: 'File berhasil diupload', timer: 1500, showConfirmButton: false })
    }).catch(() => {
      Swal.fire({ icon: 'error', title: 'Gagal upload file' })
    }).finally(() => {
      setFileUploading(false)
      e.target.value = ''
    })
  }

  const handleDeleteFile = (file: CourseFile) => {
    Swal.fire({
      title: 'Hapus file?',
      text: `"${file.file_name}" akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        guruLmsApi.deleteCourseFile(file.id).then(() => {
          setCourseFiles(prev => prev.filter(f => f.id !== file.id))
          fetchCourses()
          Swal.fire({ icon: 'success', title: 'File dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getBatchName = (batchId: number | null) => {
    if (!batchId) return 'Semua Batch'
    return batches.find(b => b.id === batchId)?.nama_batch || `Batch #${batchId}`
  }

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))

  const getFileIcon = (type: string | null) => {
    if (!type) return <FileText size={15} className="text-gray-400" />
    if (type.includes('pdf')) return <FileText size={15} className="text-red-400" />
    if (type.includes('word') || type.includes('doc')) return <FileText size={15} className="text-blue-400" />
    if (type.includes('sheet') || type.includes('xls')) return <FileText size={15} className="text-green-400" />
    if (type.includes('presentation') || type.includes('ppt')) return <FileText size={15} className="text-orange-400" />
    if (type.includes('image')) return <ImageIcon size={15} className="text-purple-400" />
    return <FileText size={15} className="text-gray-400" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center pb-24">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  // ==================== COURSE DETAIL VIEW ====================
  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] pb-24">
        <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <button onClick={() => { setSelectedCourse(null); setCourseLessons([]); setCourseFiles([]) }}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-2">
              <ArrowLeft size={14} /> Kembali ke Daftar Kursus
            </button>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0E6187] to-[#1a3355] flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedCourse.image ? (
                    <img src={`${APP_URL}/storage/${selectedCourse.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={20} className="text-white/50" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{selectedCourse.title}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{getBatchName(selectedCourse.batch_id)}</span>
                    {selectedCourse.level && (
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Level {selectedCourse.level}</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedCourse.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                      {selectedCourse.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEditCourse(selectedCourse)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#0069b0] border border-[#0069b0]/30 px-3 py-1.5 rounded-lg hover:bg-[#0069b0]/5 transition-colors">
                  <Edit3 size={12} /> Edit
                </button>
                <button onClick={() => handleDeleteCourse(selectedCourse)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {selectedCourse.description && (
              <div className="mt-2 text-xs text-gray-500 leading-relaxed [&_*]:inline line-clamp-2" dangerouslySetInnerHTML={{ __html: selectedCourse.description }} />
            )}
          </div>

          {/* Tabs */}
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-0 border-b border-gray-200">
              {([
                { key: 'lessons' as TabType, label: 'Pelajaran', icon: ListChecks, count: courseLessons.length },
                { key: 'files' as TabType, label: 'File Materi', icon: FolderOpen, count: courseFiles.length },
                { key: 'tugas' as TabType, label: 'Tugas', icon: FileText, count: 0 },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#0069b0] text-[#0069b0]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}>
                  <tab.icon size={14} />
                  {tab.label}
                  <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-[#0069b0]/10 text-[#0069b0]' : 'bg-gray-100 text-gray-400'
                  }`}>{tab.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 pt-4">
          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">Daftar Pelajaran</h3>
                <button onClick={openCreateLesson}
                  className="flex items-center gap-1.5 bg-[#0069b0] text-white px-3.5 py-2 rounded-lg text-[11px] font-bold hover:bg-[#004d7a] transition-colors shadow-sm">
                  <Plus size={14} /> Tambah Pelajaran
                </button>
              </div>

              {detailLoading ? (
                <div className="p-12 text-center">
                  <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#0069b0]/10 border-t-[#0069b0] animate-spin" />
                  </div>
                  <p className="text-xs text-gray-400 mt-3">Memuat pelajaran...</p>
                </div>
              ) : courseLessons.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <BookOpen size={28} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada pelajaran</p>
                  <p className="text-xs text-gray-400 mt-1">Klik "Tambah Pelajaran" untuk menambahkan materi pembelajaran</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {courseLessons.map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                      <div className="flex flex-col items-center gap-0.5">
                        <button onClick={() => moveLesson(idx, 'up')} disabled={idx === 0}
                          className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed text-gray-300 hover:text-gray-500 transition-colors">
                          <ChevronUp size={12} />
                        </button>
                        <span className="text-[10px] font-bold text-gray-300 w-5 text-center">{idx + 1}</span>
                        <button onClick={() => moveLesson(idx, 'down')} disabled={idx === courseLessons.length - 1}
                          className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-20 disabled:cursor-not-allowed text-gray-300 hover:text-gray-500 transition-colors">
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                        lesson.status === 'aktif' ? 'bg-[#0069b0]/10 text-[#0069b0]' : 'bg-gray-100 text-gray-300'
                      }`}>
                        {lesson.video_url ? <Video size={16} /> : <FileText size={16} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${lesson.status === 'aktif' ? 'text-gray-800' : 'text-gray-400'}`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {lesson.video_url && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Video size={10} /> Video</span>}
                          {lesson.content && <span className="text-[10px] text-gray-400 flex items-center gap-1"><FileText size={10} /> Materi</span>}
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            lesson.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${lesson.status === 'aktif' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => toggleLessonStatus(lesson)} title={lesson.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                          {lesson.status === 'aktif' ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => openEditLesson(lesson)} title="Edit"
                          className="p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDeleteLesson(lesson)} title="Hapus"
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">File Materi</h3>
                <label className="flex items-center gap-1.5 bg-[#0069b0] text-white px-3.5 py-2 rounded-lg text-[11px] font-bold hover:bg-[#004d7a] cursor-pointer transition-colors shadow-sm">
                  {fileUploading ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Upload...</>
                  ) : (
                    <><Upload size={13} /> Upload File</>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" className="hidden"
                    onChange={handleUploadFile} disabled={fileUploading} />
                </label>
              </div>

              {courseFiles.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <FolderOpen size={28} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">Belum ada file</p>
                  <p className="text-xs text-gray-400 mt-1">Upload file materi seperti PDF, Word, Excel, atau gambar</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {courseFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                      <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        {getFileIcon(f.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{f.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {f.file_size && <span className="text-[10px] text-gray-400">{formatFileSize(f.file_size)}</span>}
                          {f.file_type && <span className="text-[10px] text-gray-300 uppercase">{f.file_type.split('/').pop()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`${APP_URL}/storage/${f.file_path}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Download">
                          <Download size={14} />
                        </a>
                        <button onClick={() => handleDeleteFile(f)}
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tugas Tab - Link to assignments page */}
          {activeTab === 'tugas' && (
            <a href={`/guru-lms/assignments/${selectedCourse.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                  <ListChecks size={20} className="text-[#0069b0]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-800">Kelola Tugas</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Buat, edit, dan nilai tugas untuk kursus ini</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </a>
          )}
        </div>

        {/* Lesson Modal */}
        {showLessonModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{editingLesson ? 'Edit Pelajaran' : 'Tambah Pelajaran'}</h3>
                <button onClick={() => setShowLessonModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Pelajaran <span className="text-red-500">*</span></label>
                  <input type="text" value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                    placeholder="Contoh: Pengenalan Bahasa Arab" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Video (YouTube)</label>
                  <input type="text" value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                    placeholder="https://www.youtube.com/watch?v=..." />
                  {lessonForm.video_url && (
                    <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={
                          lessonForm.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                            ? `https://www.youtube.com/embed/${lessonForm.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}`
                            : lessonForm.video_url
                        }
                        className="w-full h-full" allowFullScreen title="Preview" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Konten Materi</label>
                  <div className="relative">
                    {lessonUploading && (
                      <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0069b0] rounded-full animate-spin" />
                          Mengupload...
                        </div>
                      </div>
                    )}
                    <ReactQuill
                      ref={lessonQuillRef}
                      value={lessonForm.content}
                      onChange={value => setLessonForm(f => ({ ...f, content: value }))}
                      modules={lessonQuillModules}
                      formats={quillFormats}
                      theme="snow"
                      placeholder="Tulis materi pembelajaran di sini..."
                      className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">File Lampiran <span className="text-[10px] text-gray-400 font-normal">(PDF, Word, Excel, PPT, Teks)</span></label>
                  {lessonFilePreview ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <FileText size={18} className="text-[#0069b0] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{lessonFilePreview.name}</p>
                        {lessonFilePreview.size && <p className="text-[10px] text-gray-400">{lessonFilePreview.size}</p>}
                      </div>
                      <button onClick={() => { setLessonFile(null); setLessonFilePreview(null) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-white hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:border-[#0069b0]/30 cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>Pilih file untuk dilampirkan</span>
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setLessonFile(file)
                            setLessonFilePreview({ name: file.name, size: formatFileSize(file.size) })
                          }
                        }} />
                    </label>
                  )}
                </div>
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
              <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setShowLessonModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button onClick={handleSaveLesson} disabled={savingLesson}
                  className="rounded-lg bg-[#0069b0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                  {savingLesson ? 'Menyimpan...' : editingLesson ? 'Simpan' : 'Buat Pelajaran'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course Modal */}
        {showCourseModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{editingCourse ? 'Edit Kursus' : 'Tambah Kursus'}</h3>
                <button onClick={() => setShowCourseModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Kursus <span className="text-red-500">*</span></label>
                  <input type="text" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                    placeholder="Masukkan judul kursus" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Deskripsi</label>
                  <div className="relative">
                    {uploading && (
                      <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0069b0] rounded-full animate-spin" />
                          Mengupload...
                        </div>
                      </div>
                    )}
                    <ReactQuill ref={quillRef} value={courseForm.description}
                      onChange={value => setCourseForm(f => ({ ...f, description: value }))}
                      modules={quillModules} formats={quillFormats} theme="snow"
                      placeholder="Deskripsi kursus"
                      className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-gray-300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Level</label>
                    <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                      <option value="">Pilih Level</option>
                      {(batchLevels[Number(courseForm.batch_id)] || []).map(lvl => (
                        <option key={lvl} value={lvl}>Level {lvl}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Batch <span className="text-red-500">*</span></label>
                    <select value={courseForm.batch_id} onChange={e => setCourseForm(f => ({ ...f, batch_id: e.target.value, level: '' }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                      <option value="">Pilih Batch</option>
                      {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Urutan</label>
                    <input type="number" value={courseForm.sort} onChange={e => setCourseForm(f => ({ ...f, sort: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                    <select value={courseForm.status} onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Gambar Cover</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                      <ImageIcon size={15} /> Pilih Gambar
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
                        }} />
                    </label>
                    {imagePreview && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                        <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                          className="absolute top-0 right-0 bg-black/50 rounded-full p-0.5">
                          <X size={8} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">File Materi <span className="text-[10px] text-gray-400 font-normal">(PDF, Word, Excel, PPT, Gambar)</span></label>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Plus size={14} /> Tambah File
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" className="hidden" multiple
                      onChange={e => {
                        if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)])
                      }} />
                  </label>
                  {pendingFiles.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                      {pendingFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2">
                          <FileText size={14} className="text-gray-400 shrink-0" />
                          <p className="text-xs text-gray-700 truncate flex-1">{f.name}</p>
                          <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="p-1 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setShowCourseModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Batal
                </button>
                <button onClick={handleSaveCourse} disabled={savingCourse}
                  className="rounded-lg bg-[#0069b0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                  {savingCourse ? 'Menyimpan...' : editingCourse ? 'Simpan' : 'Buat Kursus'}
                </button>
              </div>
            </div>
          </div>
        )}

        <KaryawanBottomNav
          activeTab="home"
          absenStatus="belum"
          hasJadwal={false}
          homeHref="/guru-dashboard"
          jadwalHref="/guru-dashboard"
          laporanHref="/guru-dashboard"
          profilHref="/guru-profil"
        />
      </div>
    )
  }

  // ==================== COURSE LIST VIEW ====================
  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0069b0]/10 flex items-center justify-center">
                <BookOpen size={20} className="text-[#0069b0]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">LMS</h1>
                <p className="text-[11px] text-gray-400 font-medium">Learning Management System</p>
              </div>
            </div>
            <button onClick={openCreateCourse}
              className="flex items-center gap-1.5 bg-[#0069b0] text-white px-4 py-2.5 rounded-lg text-[11px] font-bold hover:bg-[#004d7a] transition-colors shadow-sm">
              <Plus size={14} /> Tambah Kursus
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{courses.length}</p>
              <p className="text-[10px] text-gray-400 font-medium">Total Kursus</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{courses.reduce((a, c) => a + c.lessons_count, 0)}</p>
              <p className="text-[10px] text-gray-400 font-medium">Total Pelajaran</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{courses.reduce((a, c) => a + c.files_count, 0)}</p>
              <p className="text-[10px] text-gray-400 font-medium">Total File</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Cari kursus..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0] transition-colors" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600">
              {search ? 'Kursus tidak ditemukan' : 'Belum ada Kursus'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Coba kata kunci lain' : 'Ketuk "Tambah Kursus" untuk membuat kursus baru'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(course => (
              <button key={course.id} onClick={() => openCourse(course)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all text-left group">
                <div className="h-32 bg-gradient-to-br from-[#0E6187] to-[#1a3355] flex items-center justify-center relative overflow-hidden">
                  {course.image ? (
                    <img src={`${APP_URL}/storage/${course.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={36} className="text-white/20" />
                  )}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-white backdrop-blur-sm">
                      {course.level ? `Level ${course.level}` : 'Umum'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      course.status === 'aktif' ? 'bg-emerald-500/80 text-white' : 'bg-gray-500/80 text-white'
                    }`}>
                      {course.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0069b0] transition-colors truncate">{course.title}</h3>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5 inline-block">{getBatchName(course.batch_id)}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-0.5 group-hover:text-[#0069b0] transition-colors" />
                  </div>
                  <div className="flex items-center gap-4 mt-2.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <ListChecks size={11} /> {course.lessons_count} pelajaran
                    </span>
                    <span className="flex items-center gap-1">
                      <FolderOpen size={11} /> {course.files_count} file
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[5vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{editingCourse ? 'Edit Kursus' : 'Tambah Kursus'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Kursus <span className="text-red-500">*</span></label>
                <input type="text" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  placeholder="Masukkan judul kursus" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Deskripsi</label>
                <div className="relative">
                  {uploading && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-[#0069b0] rounded-full animate-spin" />
                        Mengupload...
                      </div>
                    </div>
                  )}
                  <ReactQuill ref={quillRef} value={courseForm.description}
                    onChange={value => setCourseForm(f => ({ ...f, description: value }))}
                    modules={quillModules} formats={quillFormats} theme="snow"
                    placeholder="Deskripsi kursus"
                    className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-gray-300" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Level</label>
                  <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="">Pilih Level</option>
                    {(batchLevels[Number(courseForm.batch_id)] || []).map(lvl => (
                      <option key={lvl} value={lvl}>Level {lvl}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Batch <span className="text-red-500">*</span></label>
                  <select value={courseForm.batch_id} onChange={e => setCourseForm(f => ({ ...f, batch_id: e.target.value, level: '' }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="">Pilih Batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Urutan</label>
                  <input type="number" value={courseForm.sort} onChange={e => setCourseForm(f => ({ ...f, sort: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                  <select value={courseForm.status} onChange={e => setCourseForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Gambar Cover</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                    <ImageIcon size={15} /> Pilih Gambar
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)) }
                      }} />
                  </label>
                  {imagePreview && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                        className="absolute top-0 right-0 bg-black/50 rounded-full p-0.5">
                        <X size={8} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">File Materi <span className="text-[10px] text-gray-400 font-normal">(PDF, Word, Excel, PPT, Gambar)</span></label>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                  <Plus size={14} /> Tambah File
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png" className="hidden" multiple
                    onChange={e => {
                      if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)])
                    }} />
                </label>
                {pendingFiles.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2">
                        <FileText size={14} className="text-gray-400 shrink-0" />
                        <p className="text-xs text-gray-700 truncate flex-1">{f.name}</p>
                        <button onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="p-1 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowCourseModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveCourse} disabled={savingCourse}
                className="rounded-lg bg-[#0069b0] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                {savingCourse ? 'Menyimpan...' : editingCourse ? 'Simpan' : 'Buat Kursus'}
              </button>
            </div>
          </div>
        </div>
      )}

      <KaryawanBottomNav
        activeTab="home"
        absenStatus="belum"
        hasJadwal={false}
        homeHref="/guru-dashboard"
        jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard"
        profilHref="/guru-profil"
      />
    </div>
  )
}
