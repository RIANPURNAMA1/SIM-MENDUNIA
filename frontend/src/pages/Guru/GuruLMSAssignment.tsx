import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus, FileText, Download, Trash2, ArrowLeft, Clock, Users,
  CheckCircle2, XCircle, Send, ChevronRight, Upload, Calendar,
  FileUp, ClipboardList, Hash, Star
} from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { assignmentApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

interface Course {
  id: number
  title: string
  batch_id: number | null
}

interface Siswa {
  id: number
  nama: string
}

interface Assignment {
  id: number
  course_id: number
  title: string
  description: string | null
  file_path: string | null
  file_name: string | null
  due_date: string | null
  max_score: number | null
  status: string
  submissions_count: number
  created_at: string
}

interface Submission {
  id: number
  assignment_id: number
  siswa_id: number
  notes: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  score: number | null
  feedback: string | null
  submitted_at: string | null
  graded_at: string | null
  siswa: Siswa | null
}

export default function GuruLMSAssignment() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [siswaList, setSiswaList] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [subLoading, setSubLoading] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formMaxScore, setFormMaxScore] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Grade state
  const [gradeScore, setGradeScore] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [grading, setGrading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const loadAssignments = () => {
    if (!courseId) return
    setLoading(true)
    assignmentApi.list(Number(courseId)).then((res: any) => {
      setCourse(res.data.course)
      setAssignments(res.data.assignments)
      setSiswaList(res.data.siswa_list || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAssignments()
  }, [courseId])

  const openCreate = () => {
    setEditingAssignment(null)
    setFormTitle('')
    setFormDesc('')
    setFormDueDate('')
    setFormMaxScore('')
    setFormFile(null)
    setShowForm(true)
  }

  const openEdit = (a: Assignment) => {
    setEditingAssignment(a)
    setFormTitle(a.title)
    setFormDesc(a.description || '')
    setFormDueDate(a.due_date || '')
    setFormMaxScore(a.max_score ? String(a.max_score) : '')
    setFormFile(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('course_id', courseId!)
      fd.append('title', formTitle)
      if (formDesc) fd.append('description', formDesc)
      if (formDueDate) fd.append('due_date', formDueDate)
      if (formMaxScore) fd.append('max_score', formMaxScore)
      if (formFile) fd.append('file', formFile)

      if (editingAssignment) {
        await assignmentApi.update(editingAssignment.id, fd)
      } else {
        await assignmentApi.store(fd)
      }
      setShowForm(false)
      loadAssignments()
    } catch (e: any) {
      Swal.fire('Error', e?.response?.data?.message || 'Gagal menyimpan', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (a: Assignment) => {
    Swal.fire({
      title: 'Hapus tugas?',
      text: `"${a.title}" akan dihapus beserta semua submission siswa`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    }).then(async (r) => {
      if (r.isConfirmed) {
        try {
          await assignmentApi.delete(a.id)
          if (selectedAssignment?.id === a.id) setSelectedAssignment(null)
          loadAssignments()
        } catch {
          Swal.fire('Error', 'Gagal menghapus', 'error')
        }
      }
    })
  }

  const viewSubmissions = async (a: Assignment) => {
    setSelectedAssignment(a)
    setSubLoading(true)
    try {
      const res: any = await assignmentApi.submissions(a.id)
      setSubmissions(res.data.submissions || [])
    } catch {
      setSubmissions([])
    } finally {
      setSubLoading(false)
    }
  }

  const handleGrade = async (sub: Submission) => {
    if (!gradeScore) return
    setGrading(true)
    try {
      await assignmentApi.grade(sub.id, {
        score: Number(gradeScore),
        feedback: gradeFeedback || undefined
      })
      setGradeScore('')
      setGradeFeedback('')
      if (selectedAssignment) viewSubmissions(selectedAssignment)
    } catch {
      Swal.fire('Error', 'Gagal menyimpan nilai', 'error')
    } finally {
      setGrading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const mb = bytes / 1024 / 1024
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center pb-24">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  // Submissions view
  if (selectedAssignment) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] pb-24">
        <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />
        <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
          <button onClick={() => { setSelectedAssignment(null); setSubmissions([]) }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors">
            <ArrowLeft size={14} /> Kembali
          </button>
        </div>
        <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <h2 className="text-base font-bold text-[#14182B] mb-1">{selectedAssignment.title}</h2>
            {selectedAssignment.max_score && (
              <p className="text-[11px] text-[#8B90A0] font-medium">Skor maksimal: {selectedAssignment.max_score}</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-4">
              Submission Siswa ({submissions.length})
            </h3>
            {subLoading ? (
              <p className="text-xs text-[#C5C8D4] text-center py-4">Loading...</p>
            ) : submissions.length === 0 ? (
              <p className="text-xs text-[#C5C8D4] text-center py-4">Belum ada submission</p>
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => {
                  const sudahDinilai = sub.score !== null
                  return (
                    <div key={sub.id} className="rounded-lg border border-[#E5E7EF] overflow-hidden">
                      <div className="p-3 bg-[#F4F5F8] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-[#8B90A0]" />
                          <span className="text-xs font-semibold text-[#14182B]">{sub.siswa?.nama || 'Siswa #' + sub.siswa_id}</span>
                        </div>
                        {sudahDinilai ? (
                          <span className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={12} /> {sub.score}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 flex items-center gap-1">
                            <XCircle size={12} /> Belum dinilai
                          </span>
                        )}
                      </div>
                      {sub.notes && (
                        <div className="px-3 py-2 border-t border-[#E5E7EF]">
                          <p className="text-[11px] text-[#8B90A0] font-medium">Catatan:</p>
                          <p className="text-xs text-[#4B5063] mt-0.5">{sub.notes}</p>
                        </div>
                      )}
                      {sub.file_path && (
                        <div className="px-3 py-2 border-t border-[#E5E7EF] flex items-center gap-2">
                          <FileText size={12} className="text-[#8B90A0]" />
                          <a href={`${APP_URL}/storage/${sub.file_path}`} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-[#0069b0] hover:underline flex items-center gap-1">
                            {sub.file_name} {sub.file_size && <span className="text-[#8B90A0] font-normal">({formatFileSize(sub.file_size)})</span>}
                            <Download size={11} />
                          </a>
                        </div>
                      )}
                      {sub.submitted_at && (
                        <div className="px-3 py-1.5 border-t border-[#E5E7EF]">
                          <p className="text-[10px] text-[#8B90A0]">Dikumpulkan: {sub.submitted_at}</p>
                        </div>
                      )}
                      {!sudahDinilai && (
                        <div className="p-3 border-t border-[#E5E7EF] bg-white">
                          <div className="flex items-center gap-2 mb-2">
                            <input type="number" placeholder="Nilai" value={gradeScore}
                              onChange={e => setGradeScore(e.target.value)}
                              className="w-20 text-xs border border-[#E5E7EF] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0069b0]" />
                            <button onClick={() => handleGrade(sub)} disabled={grading || !gradeScore}
                              className="text-[11px] font-bold text-white bg-[#0069b0] px-3 py-1.5 rounded-lg hover:bg-[#004d7a] disabled:opacity-50 transition-colors flex items-center gap-1">
                              <Send size={11} /> {grading ? '...' : 'Nilai'}
                            </button>
                          </div>
                          <input type="text" placeholder="Feedback (opsional)" value={gradeFeedback}
                            onChange={e => setGradeFeedback(e.target.value)}
                            className="w-full text-xs border border-[#E5E7EF] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#0069b0]" />
                        </div>
                      )}
                      {sudahDinilai && sub.feedback && (
                        <div className="px-3 py-2 border-t border-[#E5E7EF]">
                          <p className="text-[10px] text-[#8B90A0]">Feedback: <span className="text-[#4B5063]">{sub.feedback}</span></p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
          homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
          laporanHref="/guru-dashboard" profilHref="/guru-profil" />
      </div>
    )
  }

  // Form modal
  if (showForm) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] pb-24">
        <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />
        <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
          <button onClick={() => setShowForm(false)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors">
            <ArrowLeft size={14} /> Kembali
          </button>
        </div>
        <div className="px-4 pt-4 pb-4 space-y-3 max-w-lg mx-auto">

          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-[#0069b0]/10 flex items-center justify-center">
                <ClipboardList size={18} className="text-[#0069b0]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#14182B]">
                  {editingAssignment ? 'Edit Tugas' : 'Buat Tugas Baru'}
                </h2>
                <p className="text-[10px] text-[#8B90A0] font-medium">
                  {editingAssignment ? 'Ubah detail tugas yang sudah ada' : 'Isi detail tugas untuk kandidat'}
                </p>
              </div>
            </div>
          </div>

          {/* Judul */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Hash size={14} className="text-[#0069b0]" />
              <label className="text-[11px] font-bold text-[#4B5063]">Judul Tugas <span className="text-red-400">*</span></label>
            </div>
            <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
              placeholder="Contoh: Tugas Setoran Hafalan"
              className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
          </div>

          {/* Deskripsi */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-[#0069b0]" />
              <label className="text-[11px] font-bold text-[#4B5063]">Deskripsi</label>
            </div>
            <ReactQuill value={formDesc} onChange={setFormDesc}
              modules={{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['link']] }}
              placeholder="Tulis deskripsi tugas..."
              className="[&_.ql-editor]:min-h-[100px] [&_.ql-editor]:text-xs [&_.ql-container]:rounded-b-xl [&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border-[#E5E7EF] [&_.ql-container]:border-[#E5E7EF]" />
          </div>

          {/* Batas Tanggal & Skor */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-[#0069b0]" />
                  <label className="text-[11px] font-bold text-[#4B5063]">Batas Tanggal</label>
                </div>
                <div className="relative">
                  <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)}
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                </div>
                {formDueDate && (
                  <p className="text-[10px] text-[#8B90A0] mt-1.5 font-medium">
                    {new Date(formDueDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-[#0069b0]" />
                  <label className="text-[11px] font-bold text-[#4B5063]">Skor Maksimal</label>
                </div>
                <div className="relative">
                  <input type="number" value={formMaxScore} onChange={e => setFormMaxScore(e.target.value)}
                    placeholder="100"
                    className="w-full text-xs border border-[#E5E7EF] rounded-xl px-3.5 py-3 focus:outline-none focus:border-[#0069b0] focus:ring-2 focus:ring-[#0069b0]/10 transition-all" />
                  {formMaxScore && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#C5C8D4]">poin</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileUp size={14} className="text-[#0069b0]" />
              <label className="text-[11px] font-bold text-[#4B5063]">File Lampiran</label>
            </div>
            {formFile ? (
              <div className="flex items-center gap-3 p-3.5 bg-[#0069b0]/5 border-2 border-[#0069b0]/20 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-[#0069b0]/10 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[#0069b0]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#14182B] truncate">{formFile.name}</p>
                  <p className="text-[10px] text-[#8B90A0] mt-0.5">{(formFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => setFormFile(null)}
                  className="p-2 rounded-lg text-[#8B90A0] hover:bg-white hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : editingAssignment?.file_name ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 border border-[#E5E7EF] rounded-xl">
                  <FileText size={16} className="text-[#8B90A0] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-[#4B5063]">File saat ini:</p>
                    <p className="text-xs text-[#14182B] truncate">{editingAssignment.file_name}</p>
                  </div>
                </div>
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#E5E7EF] rounded-xl text-xs text-[#8B90A0] hover:bg-[#0069b0]/5 hover:border-[#0069b0]/30 cursor-pointer transition-all">
                  <Upload size={14} />
                  <span className="font-semibold">Ganti file</span>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFormFile(f) }} />
                </label>
              </div>
            ) : (
              <label
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setFormFile(f) }}
                className={`flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  dragOver
                    ? 'border-[#0069b0] bg-[#0069b0]/5 scale-[1.01]'
                    : 'border-[#E5E7EF] hover:border-[#0069b0]/30 hover:bg-gray-50'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  dragOver ? 'bg-[#0069b0]/15' : 'bg-gray-100'
                }`}>
                  <Upload size={18} className={dragOver ? 'text-[#0069b0]' : 'text-[#C5C8D4]'} />
                </div>
                <div className="text-center">
                  <p className={`text-xs font-bold ${dragOver ? 'text-[#0069b0]' : 'text-[#4B5063]'}`}>
                    {dragOver ? 'Lepaskan file di sini' : 'Seret file ke sini atau klik untuk memilih'}
                  </p>
                  <p className="text-[10px] text-[#C5C8D4] mt-0.5">PDF, Word, Excel, PPT, Teks, ZIP (maks 50MB)</p>
                </div>
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setFormFile(f) }} />
              </label>
            )}
          </div>

          {/* Submit */}
          <div className="bg-white rounded-2xl border border-[#E5E7EF] p-5">
            <button onClick={handleSave} disabled={saving || !formTitle.trim()}
              className="w-full bg-gradient-to-r from-[#0069b0] to-[#005a95] text-white text-xs font-bold py-3 rounded-xl hover:from-[#004d7a] hover:to-[#003d60] disabled:opacity-50 disabled:from-gray-300 disabled:to-gray-300 transition-all shadow-sm shadow-[#0069b0]/20 flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Send size={14} />
                  {editingAssignment ? 'Simpan Perubahan' : 'Buat Tugas'}
                </>
              )}
            </button>
          </div>

        </div>
        <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
          homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
          laporanHref="/guru-dashboard" profilHref="/guru-profil" />
      </div>
    )
  }

  // Default: list assignments
  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/guru-lms')}
              className="text-xs font-semibold text-[#8B90A0] hover:text-[#14182B] transition-colors">
              <ArrowLeft size={14} />
            </button>
            <div>
              <p className="text-sm font-bold text-[#14182B]">Tugas</p>
              {course && <p className="text-[11px] text-[#8B90A0] font-medium">{course.title}</p>}
            </div>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1 bg-[#0069b0] text-white px-3 py-2 rounded-lg text-[11px] font-bold hover:bg-[#004d7a] transition-colors">
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-8 text-center">
            <FileText size={32} className="text-[#C5C8D4] mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#4B5063] mb-1">Belum ada tugas</p>
            <p className="text-[11px] text-[#8B90A0]">Buat tugas pertama untuk course ini</p>
          </div>
        ) : (
          assignments.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-[#E5E7EF] p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#14182B] truncate">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {a.max_score && <span className="text-[10px] font-semibold text-[#0069b0]">Skor: {a.max_score}</span>}
                    {a.submissions_count > 0 && (
                      <span className="text-[10px] font-semibold text-[#8B90A0]">{a.submissions_count} submission</span>
                    )}
                    {a.status === 'nonaktif' && (
                      <span className="text-[10px] font-semibold text-amber-600">Nonaktif</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#C5C8D4] shrink-0" />
              </div>
              {a.description && (
                <div className="text-xs text-[#4B5063] leading-relaxed mb-3 line-clamp-2 [&_*]:inline" dangerouslySetInnerHTML={{ __html: a.description }} />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {a.due_date && (
                    <span className="text-[10px] text-[#8B90A0] flex items-center gap-1">
                      <Clock size={10} /> {a.due_date}
                    </span>
                  )}
                  {a.file_name && (
                    <a href={`${APP_URL}/storage/${a.file_path}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-semibold text-[#0069b0] hover:underline flex items-center gap-1">
                      <FileText size={10} /> {a.file_name}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E5E7EF]">
                <button onClick={() => viewSubmissions(a)}
                  className="flex-1 text-[10px] font-bold text-[#0069b0] bg-[#eef1f6] py-2 rounded-lg hover:bg-[#e2e6ef] transition-colors flex items-center justify-center gap-1">
                  <Users size={12} /> Lihat Submission
                </button>
                <button onClick={() => openEdit(a)}
                  className="text-[10px] font-bold text-[#4B5063] bg-[#F4F5F8] px-3 py-2 rounded-lg hover:bg-[#eef1f6] transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(a)}
                  className="text-[10px] font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false}
        homeHref="/guru-dashboard" jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard" profilHref="/guru-profil" />
    </div>
  )
}
