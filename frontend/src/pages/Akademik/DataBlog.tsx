import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper, Plus, Edit3, Trash2, Search, X, Image as ImageIcon, Eye } from 'lucide-react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import { blogApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  category: string | null
  image: string | null
  image_url: string | null
  read_time: number | null
  status: string
  date_formatted: string | null
  created_at: string
}

export default function DataBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    read_time: '',
    status: 'draft',
  })
  const quillRef = useRef<any>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const quillModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'video'],
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
              const res = await blogApi.uploadImage(fd)
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
      },
    },
  }

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'link', 'image', 'video',
  ]

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = () => {
    setLoading(true)
    blogApi.adminList({ search, status: filterStatus })
      .then(res => setPosts(res.data.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(fetchPosts, 400)
    return () => clearTimeout(t)
  }, [search, filterStatus])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', excerpt: '', content: '', category: '', read_time: '', status: 'draft' })
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
    setShowModal(true)
  }

  const openEdit = (post: BlogPost) => {
    setEditing(post)
    setForm({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      read_time: post.read_time?.toString() || '',
      status: post.status,
    })
    setImageFile(null)
    setImagePreview(post.image_url)
    setRemoveImage(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul artikel wajib diisi' })
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('excerpt', form.excerpt)
      fd.append('content', form.content)
      fd.append('category', form.category)
      fd.append('read_time', form.read_time || '5')
      fd.append('status', form.status)
      if (imageFile) fd.append('image', imageFile)
      if (removeImage) fd.append('hapus_image', '1')

      if (editing) {
        await blogApi.update(editing.id, fd)
      } else {
        await blogApi.create(fd)
      }
      setShowModal(false)
      fetchPosts()
      Swal.fire({ icon: 'success', title: editing ? 'Artikel diperbarui' : 'Artikel dibuat', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menyimpan artikel' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (post: BlogPost) => {
    Swal.fire({
      title: 'Hapus artikel?',
      text: `"${post.title}" akan dihapus`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(res => {
      if (res.isConfirmed) {
        blogApi.destroy(post.id).then(() => {
          fetchPosts()
          Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
        }).catch(() => Swal.fire({ icon: 'error', title: 'Gagal menghapus' }))
      }
    })
  }

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0E6187] flex items-center justify-center">
            <Newspaper size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Data Blog</h1>
            <p className="text-xs text-slate-400">Kelola artikel blog website</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0E6187] hover:bg-[#0E6187]/90 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Artikel
        </button>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="publish">Publish</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0E6187] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{search || filterStatus ? 'Artikel tidak ditemukan' : 'Belum ada artikel'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-slate-200">
            <table className="w-full border-collapse text-left text-sm text-black">
              <thead>
                <tr className="bg-[#0e6187]">
                  <th className="text-left border border-slate-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Judul</th>
                  <th className="text-left border border-slate-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Kategori</th>
                  <th className="text-left border border-slate-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Tanggal</th>
                  <th className="text-center border border-slate-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Dibaca</th>
                  <th className="text-center border border-slate-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Status</th>
                  <th className="text-center border border-slate-600 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => (
                  <tr key={post.id} className="bg-white transition hover:brightness-[0.97]">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {post.image_url ? (
                            <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Newspaper size={16} className="text-slate-500" />
                          )}
                        </div>
                        <span className="font-medium text-black line-clamp-1">{post.title}</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      {post.category ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#0069b0]/10 text-[#0069b0]">
                          {post.category}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-black">{post.date_formatted || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-black">{post.read_time || '-'} mnt</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        post.status === 'publish' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'publish' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {post.status === 'publish' ? 'Publish' : 'Draft'}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Lihat di website"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => openEdit(post)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[6vh] pb-8 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">{editing ? 'Edit Artikel' : 'Tambah Artikel'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Artikel <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Masukkan judul artikel"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="cth: Bahasa Jepang"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durasi Baca (menit)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.read_time}
                    onChange={e => setForm({ ...form, read_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="cth: 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="publish">Publish</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ringkasan (Excerpt)</label>
                <textarea
                  value={form.excerpt}
                  onChange={e => setForm({ ...form, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  placeholder="Ringkasan singkat yang tampil di kartu artikel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Artikel</label>
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
                    value={form.content}
                    onChange={value => setForm({ ...form, content: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    theme="snow"
                    placeholder="Tulis isi artikel di sini"
                    className="[&_.ql-editor]:min-h-[250px] [&_.ql-editor]:text-sm [&_.ql-container]:rounded-b-lg [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-slate-200 [&_.ql-container]:border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Sampul</label>
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
                          setRemoveImage(false)
                          setImagePreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </label>
                  {editing && imagePreview && !imageFile && (
                    <button
                      onClick={() => { setRemoveImage(true); setImagePreview(null) }}
                      className="px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Hapus Gambar
                    </button>
                  )}
                  {imagePreview && (
                    <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200">
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
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0E6187] hover:bg-[#0E6187]/90 transition-colors disabled:opacity-60"
              >
                {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {editing ? 'Simpan Perubahan' : 'Simpan Artikel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
