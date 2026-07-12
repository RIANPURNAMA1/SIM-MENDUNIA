import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BookOpen, Plus, Edit3, Trash2, ArrowLeft, Video, FileText, X, ChevronUp, ChevronDown
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { lmsAdminApi } from '../../services/api'
import Swal from 'sweetalert2'

interface Course {
  id: number
  title: string
  level: string | null
}

interface Lesson {
  id: number
  course_id: number
  title: string
  content: string | null
  video_url: string | null
  sort: number
  status: string
}

export default function DataLesson() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [saving, setSaving] = useState(false)

  const quillRef = useRef<any>(null)
  const [uploading, setUploading] = useState(false)

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

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'image', 'video',
  ]

  const [form, setForm] = useState({
    title: '',
    content: '',
    video_url: '',
    sort: '0',
    status: 'aktif',
  })

  useEffect(() => {
    if (courseId) fetchLessons()
  }, [courseId])

  const fetchLessons = () => {
    setLoading(true)
    lmsAdminApi.lessons(Number(courseId)).then(res => {
      setCourse(res.data.course)
      setLessons(res.data.lessons || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', content: '', video_url: '', sort: String(lessons.length + 1), status: 'aktif' })
    setShowModal(true)
  }

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson)
    setForm({
      title: lesson.title,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      sort: lesson.sort.toString(),
      status: lesson.status,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul pelajaran wajib diisi' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, course_id: Number(courseId) }
      if (editing) {
        await lmsAdminApi.updateLesson(editing.id, payload)
      } else {
        await lmsAdminApi.storeLesson(payload)
      }
      setShowModal(false)
      fetchLessons()
      Swal.fire({ icon: 'success', title: editing ? 'Pelajaran diperbarui' : 'Pelajaran dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (lesson: Lesson) => {
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
        lmsAdminApi.deleteLesson(lesson.id).then(() => {
          fetchLessons()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLessons.length) return

    const temp = newLessons[index].sort
    newLessons[index].sort = newLessons[swapIndex].sort
    newLessons[swapIndex].sort = temp

    const tempLesson = newLessons[index]
    newLessons[index] = newLessons[swapIndex]
    newLessons[swapIndex] = tempLesson

    setLessons(newLessons)

    Promise.all([
      lmsAdminApi.updateLesson(newLessons[index].id, { sort: newLessons[index].sort }),
      lmsAdminApi.updateLesson(newLessons[swapIndex].id, { sort: newLessons[swapIndex].sort }),
    ]).catch(() => fetchLessons())
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/lms')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0D1F3C] transition-colors"
            >
              <ArrowLeft size={14} />
              Kembali
            </button>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs text-slate-500">{course?.title || 'Kursus'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D1F3C] flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{course?.title || 'Kursus'}</h1>
              <p className="text-xs text-slate-400">Daftar pelajaran dalam kursus ini</p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Pelajaran
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {lessons.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Belum ada pelajaran dalam kursus ini</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {lessons.map((lesson, idx) => (
              <div key={lesson.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => moveLesson(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-20 disabled:cursor-not-allowed text-slate-400"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span className="text-xs font-medium text-slate-400 w-5 text-center">{idx + 1}</span>
                  <button
                    onClick={() => moveLesson(idx, 'down')}
                    disabled={idx === lessons.length - 1}
                    className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-20 disabled:cursor-not-allowed text-slate-400"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                  lesson.status === 'aktif' ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-300'
                }`}>
                  {lesson.video_url ? <Video size={16} /> : <FileText size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${lesson.status === 'aktif' ? 'text-slate-700' : 'text-slate-400'}`}>
                    {lesson.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lesson.video_url && <span className="text-xs text-slate-400 flex items-center gap-1"><Video size={11} /> Video</span>}
                    {lesson.content && <span className="text-xs text-slate-400 flex items-center gap-1"><FileText size={11} /> Materi</span>}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      lesson.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${lesson.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {lesson.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(lesson)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit Pelajaran' : 'Tambah Pelajaran'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Pelajaran <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Masukkan judul pelajaran"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Video (YouTube)</label>
                <input
                  type="text"
                  value={form.video_url}
                  onChange={e => setForm({ ...form, video_url: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {form.video_url && (
                  <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={
                        form.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                          ? `https://www.youtube.com/embed/${form.video_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}`
                          : form.video_url
                      }
                      className="w-full h-full"
                      allowFullScreen
                      title="Preview"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konten Materi</label>
                <div className="relative">
                  {uploading && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0D1F3C] rounded-full animate-spin" />
                        Mengupload...
                      </div>
                    </div>
                  )}
                  <ReactQuill
                    ref={quillRef}
                    value={form.content}
                    onChange={value => setForm({ ...form, content: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    theme="snow"
                    placeholder="Tulis materi pembelajaran di sini..."
                    className="[&_.ql-editor]:min-h-[250px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Urutan</label>
                  <input
                    type="number"
                    value={form.sort}
                    onChange={e => setForm({ ...form, sort: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-[#0D1F3C] text-white rounded-lg text-sm font-semibold hover:bg-[#0D1F3C]/90 disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : editing ? 'Simpan' : 'Buat Pelajaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
