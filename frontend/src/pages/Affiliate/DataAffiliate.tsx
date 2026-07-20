import { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, Copy, CheckCircle, X, ExternalLink, Users, User, UserCheck, UserPlus, RotateCcw, Search, Eye, ChevronDown, ChevronRight, MapPin, Landmark } from 'lucide-react'
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

interface AffiliateDetailLink {
  id: number
  kode: string
  nama_link: string | null
  views: number
  pendaftar_count: number
  status: boolean
  created_at: string
  product: { id: number; nama: string; harga: number; komisi: number | null } | null
  komisi_dibayar: number
  komisi_pending: number
  total_komisi: number
  pendaftar: {
    id: number
    nama: string
    email: string
    telepon: string | null
    status_pendaftaran: string
    status_pembayaran: string
    created_at: string
    product?: { nama: string; harga: number; komisi: number | null }
    komisi_diperoleh: number
    komisi_pending: number
  }[]
}

interface AffiliateDetailUser {
  id: number
  name: string
  email: string
  no_hp: string | null
  alamat: string | null
  provinsi: string | null
  kabupaten: string | null
  kecamatan: string | null
  desa: string | null
  nama_rekening: string | null
  no_rekening: string | null
  bank: string | null
  status: string
  created_at: string
}

interface AffiliateDetail {
  affiliate: AffiliateDetailUser
  links: AffiliateDetailLink[]
  stats: { total_links: number; total_views: number; total_pendaftar: number; komisi_paid: number; komisi_pending: number }
}

interface AffiliateStat {
  id: number
  name: string
  email: string
  status: string
  created_at: string
  affiliate_links_count: number
  affiliate_links_sum_pendaftar_count: number | null
  total_komisi_pending: number
  total_komisi_paid: number
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
  const [copiedDaftar, setCopiedDaftar] = useState(false)
  const [search, setSearch] = useState('')
  const [detailAffiliate, setDetailAffiliate] = useState<AffiliateDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [expandedLinks, setExpandedLinks] = useState<Record<number, boolean>>({})

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

  function openDetail(affiliateId: number) {
    setLoadingDetail(true)
    setExpandedLinks({})
    affiliateLinkApi.detail(affiliateId).then(res => {
      setDetailAffiliate(res.data)
    }).finally(() => setLoadingDetail(false))
  }

  function toggleLink(linkId: number) {
    setExpandedLinks(prev => ({ ...prev, [linkId]: !prev[linkId] }))
  }

  function copyLink(kode: string, id: number) {
    navigator.clipboard.writeText(`${window.location.origin}/daftar/${kode}`)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const linkBase = `${window.location.origin}/daftar/`

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Daftar Affiliate:</span>
            <code className="text-slate-700">{`${window.location.origin}/daftar-affiliate`}</code>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/daftar-affiliate`); setCopiedDaftar(true); setTimeout(() => setCopiedDaftar(false), 2000) }}
              className="ml-1 rounded-md border border-slate-200 bg-white p-1.5 text-slate-400 transition hover:border-blue-200 hover:text-blue-600">
              {copiedDaftar ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
            <Plus size={16} /> Generate Link
          </button>
        </div>
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
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Komisi</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Bergabung</th>
                <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
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
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 shadow-sm">
                          Rp {(Number(s.total_komisi_pending || 0) + Number(s.total_komisi_paid || 0)).toLocaleString('id-ID')}
                        </span>
                        {s.total_komisi_paid > 0 && (
                          <span className="text-[10px] text-emerald-600">Dibayar: Rp {Number(s.total_komisi_paid).toLocaleString('id-ID')}</span>
                        )}
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">{statusUserBadge(s.status)}</td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-500">
                      {new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <button
                        onClick={() => openDetail(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100"
                      >
                        <Eye size={12} /> Detail
                      </button>
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

      {/* Detail Modal */}
      {detailAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailAffiliate(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(detailAffiliate.affiliate.name)}&background=0D1F3C&color=fff&size=40`}
                  className="h-10 w-10 rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{detailAffiliate.affiliate.name}</h2>
                  <p className="text-xs text-slate-500">{detailAffiliate.affiliate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium shadow-sm ${
                  detailAffiliate.affiliate.status === 'AKTIF'
                    ? 'border-emerald-200 bg-white text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${detailAffiliate.affiliate.status === 'AKTIF' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {detailAffiliate.affiliate.status}
                </span>
                <button onClick={() => setDetailAffiliate(null)} className="rounded-lg p-1 hover:bg-slate-100"><X size={20} /></button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Link</p>
                  <p className="text-xl font-bold text-slate-800">{detailAffiliate.stats.total_links}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Views</p>
                  <p className="text-xl font-bold text-slate-800">{detailAffiliate.stats.total_views}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Total Kandidat</p>
                  <p className="text-xl font-bold text-slate-800">{detailAffiliate.stats.total_pendaftar}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                  <p className="text-xs text-amber-600">Total Komisi</p>
                  <p className="text-xl font-bold text-amber-700">Rp {Number(detailAffiliate.stats.komisi_paid + detailAffiliate.stats.komisi_pending).toLocaleString('id-ID')}</p>
                  {detailAffiliate.stats.komisi_pending > 0 && (
                    <p className="text-[10px] text-amber-500 mt-0.5">+ Rp {Number(detailAffiliate.stats.komisi_pending).toLocaleString('id-ID')} pending</p>
                  )}
                </div>
              </div>

              {/* Data Diri */}
              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <User size={16} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Data Diri</h3>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Nama Lengkap</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">No. WhatsApp</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.no_hp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Bergabung</p>
                    <p className="text-sm font-medium text-slate-800">
                      {new Date(detailAffiliate.affiliate.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Alamat</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.alamat || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Wilayah */}
              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <MapPin size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Wilayah</h3>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Provinsi</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.provinsi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Kabupaten / Kota</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.kabupaten || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Kecamatan</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.kecamatan || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Desa / Kelurahan</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.desa || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Rekening Bank */}
              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <Landmark size={16} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Rekening Bank</h3>
                </div>
                <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Nama Bank</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.bank || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">No. Rekening</p>
                    <p className="text-sm font-medium text-slate-800 font-mono">{detailAffiliate.affiliate.no_rekening || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide">Nama Pemilik Rekening</p>
                    <p className="text-sm font-medium text-slate-800">{detailAffiliate.affiliate.nama_rekening || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <Link2 size={16} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Link Affiliate</h3>
                  <span className="ml-auto rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{detailAffiliate.links.length} link</span>
                </div>
                <div className="px-4 py-3">
                  {detailAffiliate.links.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">Belum ada link affiliate</p>
                  ) : (
                    <div className="space-y-2">
                      {detailAffiliate.links.map(link => (
                        <div key={link.id} className="rounded-lg border border-slate-200">
                          <button
                            onClick={() => toggleLink(link.id)}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            {expandedLinks[link.id] ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                            <Link2 size={14} className="shrink-0 text-blue-500" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate">{link.nama_link || link.kode}</p>
                              <p className="text-[10px] text-slate-400 truncate">{linkBase}{link.kode}</p>
                            </div>
                            <span className="shrink-0 text-xs text-slate-500">{link.product?.nama}</span>
                            {link.product?.komisi && (
                              <span className="shrink-0 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">Rp {Number(link.product.komisi).toLocaleString('id-ID')}/org</span>
                            )}
                            <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{link.views} views</span>
                            <span className="shrink-0 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">{link.pendaftar_count} kandidat</span>
                            {link.total_komisi > 0 && (
                              <span className="shrink-0 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">Rp {Number(link.total_komisi).toLocaleString('id-ID')}</span>
                            )}
                          </button>
                          {expandedLinks[link.id] && (
                            <div className="border-t border-slate-100 px-4 py-3">
                              {link.pendaftar.length === 0 ? (
                                <p className="py-3 text-center text-xs text-slate-400">Belum ada kandidat</p>
                              ) : (
                                <div className="space-y-2">
                                  {link.pendaftar.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                      <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=24`}
                                        className="h-6 w-6 rounded-full"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-800 truncate">{p.nama}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{p.email}</p>
                                      </div>
                                      {p.product?.komisi && (
                                        <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Rp {Number(p.product.komisi).toLocaleString('id-ID')}/org</span>
                                      )}
                                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                        p.status_pendaftaran === 'disetujui' ? 'bg-emerald-50 text-emerald-700' :
                                        p.status_pendaftaran === 'pending' ? 'bg-amber-50 text-amber-700' :
                                        'bg-red-50 text-red-600'
                                      }`}>{p.status_pendaftaran}</span>
                                      {(p.komisi_diperoleh > 0 || p.komisi_pending > 0) && (
                                        <span className="shrink-0 text-[10px] font-medium text-amber-600">
                                          {p.komisi_diperoleh > 0 ? `Rp ${Number(p.komisi_diperoleh).toLocaleString('id-ID')}` : `Rp ${Number(p.komisi_pending).toLocaleString('id-ID')} (pending)`}
                                        </span>
                                      )}
                                      <span className="shrink-0 text-[10px] text-slate-400">
                                        {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
