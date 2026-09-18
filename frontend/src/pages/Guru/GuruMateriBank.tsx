import { useEffect, useRef, useState } from 'react'
import {
  Plus, X, Trash2, ArrowLeft, BookOpen, FileText, Video, Pencil, Eye, EyeOff,
  Loader2, Link2, Image as ImageIcon,
} from 'lucide-react'
import { guruMateriApi, lmsAdminApi, APP_URL } from '../../services/api'
import ReactQuill from 'react-quill-new'
import { getYouTubeEmbedUrl } from '../../utils/youtube'
import LessonMediaFields, { LessonSlideItem } from '../../components/LessonMediaFields'
import Swal from 'sweetalert2'

interface GuruMateriBankProps {
  courseId?: number | null
  courseTitle?: string | null
  embedded?: boolean
  onBack?: () => void
  hiddenHeader?: boolean
  canManage?: boolean
}

interface MateriItem {
  id: number
  title: string
  content: string | null
  video_url: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  file_url: string | null
  status: string
  sort: number
  lessons_count: number
  course?: { id: number; title: string } | null
  created_at?: string | null
  slides?: { id: number; file_path: string; file_name: string; file_type?: string | null; url?: string }[]
}

const emptyForm = {
  title: '',
  content: '',
  video_url: '',
  sort: '0',
  status: 'aktif',
}

const fmtFileSize = (size?: number | null) => {
  if (size == null) return ''
  return size < 1024 * 1024 ? (size / 1024).toFixed(1) + ' KB' : (size / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function GuruMateriBank({ courseId, courseTitle, onBack, hiddenHeader, canManage = true }: GuruMateriBankProps) {
  const [materials, setMaterials] = useState<MateriItem[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MateriItem | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfName, setPdfName] = useState<string | null>(null)
  const [pdfSize, setPdfSize] = useState<number | null>(null)
  const [removePdf, setRemovePdf] = useState(false)
  const [slides, setSlides] = useState<LessonSlideItem[]>([])
  const [removedSlideIds, setRemovedSlideIds] = useState<number[]>([])
  const [uploadingQuill, setUploadingQuill] = useState(false)
  const quillRef = useRef<any>(null)

  const fetchMaterials = () => {
    setLoading(true)
    guruMateriApi.bank(courseId).then(res => {
      setMaterials(res.data.materials || [])
    }).catch(() => setMaterials([])).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchMaterials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

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
            setUploadingQuill(true)
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
              setUploadingQuill(false)
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
            setUploadingQuill(true)
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
              setUploadingQuill(false)
            }
          }
          input.click()
        },
      },
    },
  }

  const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'link', 'image', 'video']

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setPdfFile(null)
    setPdfName(null)
    setPdfSize(null)
    setRemovePdf(false)
    setSlides([])
    setRemovedSlideIds([])
    setShowModal(true)
  }

  const openEdit = (m: MateriItem) => {
    setEditing(m)
    setForm({
      title: m.title,
      content: m.content || '',
      video_url: m.video_url || '',
      sort: m.sort.toString(),
      status: m.status,
    })
    setPdfFile(null)
    setPdfName(m.file_name || null)
    setPdfSize(m.file_size || null)
    setRemovePdf(false)
    setSlides((m.slides || []).map(s => ({
      key: `existing-${s.id}`,
      id: s.id,
      url: s.url || `${APP_URL}/storage/${s.file_path}`,
      name: s.file_name || 'slide',
    })))
    setRemovedSlideIds([])
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul materi wajib diisi' })
      return
    }
    setSaving(true)
    const fd = new FormData()
    if (courseId) fd.append('course_id', String(courseId))
    fd.append('title', form.title.trim())
    fd.append('content', form.content)
    fd.append('video_url', form.video_url.trim())
    fd.append('sort', form.sort)
    fd.append('status', form.status)
    if (pdfFile) fd.append('file', pdfFile)
    if (editing && removePdf && !pdfFile) fd.append('remove_file', '1')
    slides.filter(s => s.file).forEach(s => {
      if (s.file) fd.append('slides[]', s.file as File)
    })
    removedSlideIds.forEach(id => fd.append('remove_slides[]', String(id)))

    try {
      if (editing) {
        await guruMateriApi.update(editing.id, fd)
      } else {
        await guruMateriApi.store(fd)
      }
      Swal.fire({ icon: 'success', title: editing ? 'Materi diperbarui' : 'Materi ditambahkan', timer: 1200, showConfirmButton: false })
      setShowModal(false)
      fetchMaterials()
    } catch {
      // handled by interceptor
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (m: MateriItem) => {
    const res = await Swal.fire({
      title: 'Hapus materi?',
      text: `"${m.title}" akan dihapus dari bank materi`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })
    if (!res.isConfirmed) return
    try {
      await guruMateriApi.destroy(m.id)
      Swal.fire({ icon: 'success', title: 'Materi dihapus', timer: 1200, showConfirmButton: false })
      fetchMaterials()
    } catch {
      // handled by interceptor
    }
  }

  const toggleStatus = async (m: MateriItem) => {
    const next = m.status === 'aktif' ? 'nonaktif' : 'aktif'
    try {
      const fd = new FormData()
      fd.append('title', m.title)
      fd.append('status', next)
      await guruMateriApi.update(m.id, fd)
      fetchMaterials()
    } catch {
      // handled by interceptor
    }
  }

  const showEmbeddedHeader = !hiddenHeader

  return (
    <div>
      {showEmbeddedHeader && (
        <div className="bg-white rounded-xl border border-[#E5E7EF] shadow-sm px-4 py-3 mb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {onBack && (
                <button onClick={onBack}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                  <ArrowLeft size={14} /> Kembali
                </button>
              )}
            </div>
            {canManage && (
              <button onClick={openCreate}
                className="flex items-center gap-1.5 bg-[#0069b0] text-white px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-[#004d7a] transition-colors shadow-sm shrink-0">
                <Plus size={14} /> Tambah Materi
              </button>
            )}
          </div>
          <div className="mt-3">
            {courseTitle && <h2 className="text-sm font-bold text-gray-900">{courseTitle}</h2>}
            <p className="text-[11px] text-gray-400 mt-0.5">
              {materials.length} materi pelajaran
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="relative w-10 h-10 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0069b0]/10 border-t-[#0069b0] animate-spin" />
          </div>
          <p className="text-xs text-gray-400 mt-3">Memuat materi...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Belum ada materi</p>
          <p className="text-xs text-gray-400 mt-1">Tambahkan materi/modul &amp; video pembelajaran untuk kursus ini</p>
          {canManage && (
            <button onClick={openCreate}
              className="mt-5 inline-flex items-center gap-1.5 bg-[#0069b0] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#004d7a] transition-colors shadow-sm">
              <Plus size={14} /> Tambah Materi
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Materi Pelajaran</h3>
            <span className="text-[10px] font-bold text-gray-400">{materials.length} materi</span>
          </div>
          <div className="divide-y divide-gray-100">
            {materials.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                  m.status === 'aktif' ? 'bg-[#0069b0]/10 text-[#0069b0]' : 'bg-gray-100 text-gray-300'
                }`}>
                  {m.video_url ? <Video size={16} /> : m.content ? <FileText size={16} /> : m.file_path ? <FileText size={16} /> : <BookOpen size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${m.status === 'aktif' ? 'text-gray-800' : 'text-gray-400'}`}>
                    {m.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {m.video_url && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Video size={10} /> Video</span>}
                    {m.content && <span className="text-[10px] text-gray-400 flex items-center gap-1"><FileText size={10} /> Materi</span>}
                    {m.file_name && <span className="text-[10px] text-gray-400 flex items-center gap-1"><FileText size={10} /> PDF · {fmtFileSize(m.file_size)}</span>}
                    {m.slides && m.slides.length > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-1"><ImageIcon size={10} /> {m.slides.length} slide</span>}
                    <span className="text-[10px] text-gray-400">{m.lessons_count} pertemuan</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      m.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {m.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleStatus(m)} title={m.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                      {m.status === 'aktif' ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => openEdit(m)} title="Edit"
                      className="p-2 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(m)} title="Hapus"
                      className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => { if (!saving) setShowModal(false) }}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Materi' : 'Tambah Materi'}</h2>
              <button onClick={() => { if (!saving) setShowModal(false) }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Judul Materi <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                  placeholder="Judul materi" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Video (YouTube)</label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]"
                    placeholder="https://youtube.com/..." />
                </div>
                {form.video_url && (
                  <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(form.video_url) || form.video_url}
                      className="w-full h-full" allowFullScreen title="Preview" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Konten Materi</label>
                <div className="relative">
                  {uploadingQuill && (
                    <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 size={15} className="animate-spin" /> Mengupload...
                      </div>
                    </div>
                  )}
                  <ReactQuill
                    ref={quillRef}
                    value={form.content}
                    onChange={value => setForm(f => ({ ...f, content: value }))}
                    modules={quillModules}
                    formats={quillFormats}
                    theme="snow"
                    placeholder="Tulis materi pembelajaran di sini..."
                    className="[&_.ql-editor]:min-h-[120px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-gray-300 [&_.ql-container]:border-gray-300"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <LessonMediaFields
                  pdfName={removePdf ? null : pdfName}
                  pdfSize={pdfSize}
                  slides={slides}
                  uploading={saving}
                  onPdf={file => {
                    setPdfFile(file)
                    setPdfName(file ? file.name : null)
                    setPdfSize(file ? file.size : null)
                    setRemovePdf(false)
                  }}
                  onRemovePdf={() => {
                    setPdfFile(null)
                    setPdfName(null)
                    setPdfSize(null)
                    setRemovePdf(true)
                  }}
                  onSlidesChange={nextSlides => {
                    const removed = slides.filter(s => !nextSlides.some(n => n.key === s.key))
                    removed.forEach(s => { if (!s.id) URL.revokeObjectURL(s.url || '') })
                    setRemovedSlideIds(prev => [...prev, ...removed.filter(s => s.id).map(s => s.id!)])
                    setSlides(nextSlides)
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Urutan</label>
                  <input type="number" value={form.sort} onChange={e => setForm(f => ({ ...f, sort: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-2">
              <button onClick={() => { if (!saving) setShowModal(false) }}
                className="px-4 py-2.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 bg-[#0069b0] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><Plus size={14} /> {editing ? 'Simpan Materi' : 'Tambah Materi'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}