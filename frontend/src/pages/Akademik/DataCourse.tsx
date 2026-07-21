import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Plus, Edit3, Trash2, Search, Layers, X, Image as ImageIcon, FileText, Download } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { lmsAdminApi, adminCabangApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

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

interface Batch {
  id: number
  nama_batch: string
}

export default function DataCourse() {
  const location = useLocation();
  const isAdminCabang = location.pathname.startsWith('/admin-cabang');
  const [courses, setCourses] = useState<Course[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterLevel, setFilterLevel] = useState('')
  const [filterBatch, setFilterBatch] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    level: '',
    batch_id: '',
    sort: '0',
    status: 'aktif',
  })
  const quillRef = useRef<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [courseFiles, setCourseFiles] = useState<CourseFile[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
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

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'link', 'image', 'video',
  ]

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = () => {
    setLoading(true)
    const promise = isAdminCabang ? adminCabangApi.lms() : lmsAdminApi.courses()
    promise.then(res => {
      setCourses(res.data.courses || [])
      setBatches(res.data.batches || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', level: '', batch_id: '', sort: '0', status: 'aktif' })
    setImageFile(null)
    setImagePreview(null)
    setCourseFiles([])
    setPendingFiles([])
    setShowModal(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setForm({
      title: course.title,
      description: course.description || '',
      level: course.level || '',
      batch_id: course.batch_id?.toString() || '',
      sort: course.sort.toString(),
      status: course.status,
    })
    setImageFile(null)
    setImagePreview(course.image ? `${APP_URL}/storage/${course.image}` : null)
    setCourseFiles([])
    setShowModal(true)
    lmsAdminApi.courseFiles(course.id).then(res => {
      setCourseFiles(res.data.files || [])
    }).catch(() => {})
  }

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    setFileUploading(true)
    try {
      const fd = new FormData()
      fd.append('course_id', String(editing.id))
      fd.append('file', file)
      const res = await lmsAdminApi.storeCourseFile(fd)
      setCourseFiles(prev => [...prev, res.data.file])
      Swal.fire({ icon: 'success', title: 'File berhasil diupload', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal upload file' })
    } finally {
      setFileUploading(false)
      e.target.value = ''
    }
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
        lmsAdminApi.deleteCourseFile(file.id).then(() => {
          setCourseFiles(prev => prev.filter(f => f.id !== file.id))
          Swal.fire({ icon: 'success', title: 'File dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus file' }))
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul kursus wajib diisi' })
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('level', form.level)
      fd.append('batch_id', form.batch_id)
      fd.append('sort', form.sort || '0')
      fd.append('status', form.status)
      if (imageFile) fd.append('image', imageFile)

      if (editing) {
        await lmsAdminApi.updateCourse(editing.id, fd)
      } else {
        const res = await lmsAdminApi.storeCourse(fd)
        const newCourseId = res.data?.course?.id
        if (newCourseId && pendingFiles.length > 0) {
          for (const pf of pendingFiles) {
            const pfd = new FormData()
            pfd.append('course_id', String(newCourseId))
            pfd.append('file', pf)
            await lmsAdminApi.storeCourseFile(pfd)
          }
        }
      }
      setShowModal(false)
      fetchCourses()
      Swal.fire({ icon: 'success', title: editing ? 'Kursus diperbarui' : 'Kursus dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan kursus' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (course: Course) => {
    Swal.fire({
      title: 'Hapus kursus?',
      text: `"${course.title}" akan dihapus termasuk semua pelajaran di dalamnya`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        lmsAdminApi.deleteCourse(course.id).then(() => {
          fetchCourses()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.level && c.level.toLowerCase().includes(search.toLowerCase()))
    const matchLevel = !filterLevel || c.level === filterLevel
    const matchBatch = !filterBatch || c.batch_id?.toString() === filterBatch
    return matchSearch && matchLevel && matchBatch
  })

  const uniqueLevels = [...new Set(courses.map(c => c.level).filter(Boolean))] as string[]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0E6187] flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Data Kursus LMS</h1>
            <p className="text-xs text-slate-400">Kelola kursus dan materi pembelajaran</p>
          </div>
        </div>
        {!isAdminCabang && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0E6187] hover:bg-[#0E6187]/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Kursus
        </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kursus..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Semua Level</option>
            {uniqueLevels.map(l => (
              <option key={l} value={l}>Level {l}</option>
            ))}
          </select>
          <select
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Semua Batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.nama_batch}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0E6187] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{search || filterLevel || filterBatch ? 'Kursus tidak ditemukan' : 'Belum ada kursus'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Judul</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Level</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-500">Batch</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-500">Pelajaran</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-500">File</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-center px-5 py-3 font-medium text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(course => (
                  <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {course.image ? (
                            <img src={`${APP_URL}/storage/${course.image}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen size={16} className="text-slate-500" />
                          )}
                        </div>
                        <span className="font-medium text-slate-700">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{course.level || '-'}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {course.batch_id ? batches.find(b => b.id === course.batch_id)?.nama_batch || '-' : '-'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        <BookOpen size={12} />
                        {course.lessons_count}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {(course as any).files_count > 0 && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                          <FileText size={12} />
                          {(course as any).files_count}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        course.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          course.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                        {course.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {!isAdminCabang && (
                        <Link
                          to={`/lms/${course.id}/lessons`}
                          className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Kelola Pelajaran"
                        >
                          <Layers size={16} />
                        </Link>
                        )}
                        {!isAdminCabang && (
                        <>
                        <button
                          onClick={() => openEdit(course)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(course)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                        </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[8vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit Kursus' : 'Tambah Kursus'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Kursus <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Masukkan judul kursus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                <div className="relative">
                  {uploading && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0E6187] rounded-full animate-spin" />
                        Mengupload...
                      </div>
                    </div>
                  )}
                  <ReactQuill
                    ref={quillRef}
                    value={form.description}
                    onChange={value => setForm({ ...form, description: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    theme="snow"
                    placeholder="Deskripsi kursus"
                    className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                  <input
                    type="text"
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Contoh: 1, 2, 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                  <select
                    value={form.batch_id}
                    onChange={e => setForm({ ...form, batch_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Semua Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.nama_batch}</option>
                    ))}
                  </select>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gambar</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    <ImageIcon size={16} />
                    Pilih Gambar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setImageFile(file)
                          setImagePreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null) }}
                        className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File Materi <span className="text-[10px] text-slate-400 font-normal">(PDF, Word, Excel, PPT, Gambar)</span></label>
                <div className="space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors">
                    {fileUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-[#0E6187] rounded-full animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Tambah File
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                      className="hidden"
                      multiple
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        if (editing) {
                          files.forEach(file => {
                            setFileUploading(true)
                            const fd = new FormData()
                            fd.append('course_id', String(editing.id))
                            fd.append('file', file)
                            lmsAdminApi.storeCourseFile(fd).then(res => {
                              setCourseFiles(prev => [...prev, res.data.file])
                              Swal.fire({ icon: 'success', title: 'File berhasil diupload', timer: 1500, showConfirmButton: false })
                            }).catch(() => {
                              Swal.fire({ icon: 'error', title: 'Gagal upload file' })
                            }).finally(() => setFileUploading(false))
                          })
                        } else {
                          setPendingFiles(prev => [...prev, ...files])
                        }
                        e.target.value = ''
                      }}
                      disabled={fileUploading}
                    />
                  </label>
                  {editing ? (
                    courseFiles.length > 0 && (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {courseFiles.map(f => (
                          <div key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                            <FileText size={16} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 truncate">{f.file_name}</p>
                              {f.file_size && <p className="text-xs text-slate-400">{formatFileSize(f.file_size)}</p>}
                            </div>
                            <a
                              href={`${APP_URL}/storage/${f.file_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Download"
                            >
                              <Download size={15} />
                            </a>
                            <button
                              onClick={() => handleDeleteFile(f)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    pendingFiles.length > 0 && (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {pendingFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                            <FileText size={16} className="text-slate-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 truncate">{f.name}</p>
                              <p className="text-xs text-slate-400">{formatFileSize(f.size)}</p>
                            </div>
                            <button
                              onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#0E6187]/90 disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : editing ? 'Simpan' : 'Buat Kursus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
