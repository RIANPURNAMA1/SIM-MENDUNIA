import { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, Copy, CheckCircle, X, ExternalLink, Users, UserCheck, UserPlus, RotateCcw, Search } from 'lucide-react'
import { affiliateLinkApi, productApi } from '../../services/api'
import api from '../../services/api'

interface AffiliateLink {
  id: number
  kode: string
  nama_link: string | null
  views: number
  pendaftar_count: number
  status: boolean
  affiliate: { id: number; name: string; email: string }
  product: { id: number; nama: string; harga: number }
}

interface Product {
  id: number
  nama: string
  harga: number
  status: string
}

interface AffiliateUser {
  id: number
  name: string
  email: string
}

interface AffiliateStat {
  id: number
  name: string
  email: string
  status: string
  created_at: string
  affiliate_links_count: number
  affiliate_links_sum_pendaftar_count: number | null
}

export default function DataAffiliate() {
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([])
  const [stats, setStats] = useState<AffiliateStat[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ affiliate_id: '', product_id: '', nama_link: '' })
  const [copied, setCopied] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData() {
    setLoading(true)
    Promise.all([
      affiliateLinkApi.list().then(res => setLinks(res.data)),
      productApi.list().then(res => setProducts(res.data.filter((p: Product) => p.status === 'aktif'))),
      affiliateLinkApi.listAffiliates().then(res => setAffiliates(res.data)),
      api.get('/affiliates/stats').then(res => setStats(res.data)),
    ]).finally(() => setLoading(false))
  }

  if (loading) return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#f0f2f5]">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
        <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
      </div>
    </div>
  )

  function openCreate() {
    setForm({ affiliate_id: '', product_id: '', nama_link: '' })
    setShowModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    affiliateLinkApi.store({
      affiliate_id: parseInt(form.affiliate_id),
      product_id: parseInt(form.product_id),
      nama_link: form.nama_link || null,
    }).then(() => {
      setShowModal(false)
      fetchData()
    })
  }

  function handleDelete(id: number) {
    if (confirm('Yakin ingin menghapus link ini?')) affiliateLinkApi.destroy(id).then(fetchData)
  }

  function copyLink(kode: string, id: number) {
    navigator.clipboard.writeText(`http://localhost:5173/daftar/${kode}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const linkBase = 'http://localhost:5173/daftar/'

  const filteredLinks = links.filter(l =>
    !search || l.affiliate?.name?.toLowerCase().includes(search.toLowerCase()) || l.product?.nama?.toLowerCase().includes(search.toLowerCase()) || l.nama_link?.toLowerCase().includes(search.toLowerCase())
  )

  const statusBadge = (status: boolean) => {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${status ? 'border-emerald-200 bg-white text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${status ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        {status ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  const statusUserBadge = (status: string) => {
    const dot = status === 'AKTIF' ? 'bg-emerald-500' : 'bg-slate-300'
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {status}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Affiliate</h1>
            <p className="text-sm text-slate-500">Kelola link affiliate dan pantau performa</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
          <Plus size={16} /> Generate Link
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Link</p>
          <p className="text-3xl font-bold text-slate-800">{links.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Views</p>
          <p className="text-3xl font-bold text-slate-800">{links.reduce((s, l) => s + l.views, 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Pendaftar</p>
          <p className="text-3xl font-bold text-slate-800">{links.reduce((s, l) => s + l.pendaftar_count, 0)}</p>
        </div>
      </div>

      {/* Affiliate Users Table */}
      <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <UserCheck size={18} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800">Data Affiliate</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Affiliate</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Email</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Total Link</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Kandidat Diundang</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Bergabung</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Users size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada affiliate</p>
                  </td>
                </tr>
              ) : (
                stats.map(s => (
                  <tr key={s.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{s.email}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-800">{s.affiliate_links_count}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-white px-2 py-1 text-[11px] font-medium text-purple-700 shadow-sm">
                        <UserPlus size={12} />
                        {s.affiliate_links_sum_pendaftar_count || 0}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{statusUserBadge(s.status)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">
                      {new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari affiliate, produk, atau nama link..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setSearch('')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Links Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Link</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Affiliate</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Produk</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Views</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Pendaftar</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Users size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada link affiliate</p>
                  </td>
                </tr>
              ) : (
                filteredLinks.map(link => (
                  <tr key={link.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link2 size={16} className="shrink-0 text-blue-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800 max-w-[180px]">{link.nama_link || link.kode}</p>
                          <p className="truncate text-xs text-slate-400 max-w-[180px]">{linkBase}{link.kode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{link.affiliate?.name || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{link.product?.nama || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-800">{link.views}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-800">{link.pendaftar_count}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(link.status)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => copyLink(link.kode, link.id)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Salin link">
                          {copied === link.id ? <CheckCircle size={15} className="text-emerald-500" /> : <Copy size={15} />}
                        </button>
                        <a href={`${linkBase}${link.kode}`} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Buka link">
                          <ExternalLink size={15} />
                        </a>
                        <button onClick={() => handleDelete(link.id)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Hapus">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Generate Link Affiliate</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate</label>
                <select required value={form.affiliate_id} onChange={e => setForm({ ...form, affiliate_id: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Pilih Affiliate</option>
                  {affiliates.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produk / Program</label>
                <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="">Pilih Produk</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} - Rp {Number(p.harga).toLocaleString('id-ID')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Link (opsional)</label>
                <input type="text" value={form.nama_link} onChange={e => setForm({ ...form, nama_link: e.target.value })}
                  placeholder="Misal: Promosi Instagram"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100">Batal</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
