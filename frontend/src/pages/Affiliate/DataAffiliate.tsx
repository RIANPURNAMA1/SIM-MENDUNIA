import { useState, useEffect } from 'react'
import { Link2, Plus, Trash2, Copy, CheckCircle, X, ExternalLink, Users, User, UserCheck, UserPlus, Eye, ChevronDown, ChevronRight, MapPin, Landmark, RefreshCw, Upload, FileSpreadsheet, Loader2, KeyRound } from 'lucide-react'
import * as XLSX from 'xlsx'
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
    status_kandidat?: string
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
  password_plain?: string | null
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
  const [copiedLogin, setCopiedLogin] = useState<'email' | 'pass' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [detailAffiliate, setDetailAffiliate] = useState<AffiliateDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [expandedLinks, setExpandedLinks] = useState<Record<number, boolean>>({})
  const [syncing, setSyncing] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importRows, setImportRows] = useState<{ nama: string; email: string }[]>([])
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; created: { nama: string; email: string; password: string }[]; errors: { row: number; message: string }[] } | null>(null)

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
        <div className="rounded-full absolute inset-0 border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
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
    setShowPassword(false)
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

  function handleSyncKomisi() {
    if (!confirm('Hitung ulang komisi affiliate untuk semua kandidat yang sudah lunas?')) return
    setSyncing(true)
    api.post('/recalculate-all-komisi')
      .then(res => {
        alert(res.data?.message || 'Sync berhasil')
        fetchData()
      })
      .catch(() => alert('Gagal sync komisi'))
      .finally(() => setSyncing(false))
  }

  function handleImportFile(file: File) {
    setImportFile(file)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
        const rows = json.map(r => {
          const norm: Record<string, unknown> = {}
          Object.entries(r).forEach(([k, v]) => { norm[k.toLowerCase().replace(/[^a-z]/g, '')] = v })
          const nama = String(norm['nama'] || norm['name'] || norm['namalengkap'] || '').trim()
          const email = String(norm['email'] || '').trim()
          return { nama, email }
        }).filter(r => r.nama || r.email)
        setImportRows(rows)
        if (rows.length === 0) alert('Tidak ada baris data yang terbaca. Pastikan kolom berisi Nama dan Email.')
      } catch {
        alert('Gagal membaca file Excel. Pastikan format file .xlsx/.xls.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function openImport() {
    setImportRows([])
    setImportFile(null)
    setImportResult(null)
    setShowImport(true)
  }

  function handleImportSubmit() {
    if (importRows.length === 0) return
    setImporting(true)
    affiliateLinkApi.importAffiliates(importRows)
      .then(res => {
        setImportResult(res.data)
        fetchData()
      })
      .catch(err => alert('Gagal import: ' + (err.response?.data?.message || err.message)))
      .finally(() => setImporting(false))
  }

  const statusBadge = (status: boolean) => {
    return (
      <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-medium ${status ? 'border-[#a8dab5] bg-white text-[#137333]' : 'border-[#dadce0] bg-white text-[#5f6368]'}`}>
        <span className={`h-1.5 w-1.5 ${status ? 'bg-[#188038]' : 'bg-[#9aa0a6]'}`} />
        {status ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  const statusUserBadge = (status: string) => {
    const dot = status === 'AKTIF' ? 'bg-[#188038]' : 'bg-[#9aa0a6]'
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-2 py-1 text-[11px] font-medium text-[#5f6368]">
        <span className={`h-1.5 w-1.5 ${dot}`} />
        {status}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-[#e8eaed] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Affiliate</h1>
            <p className="mt-0.5 text-sm text-[#5f6368]">Kelola link affiliate dan pantau performa</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 border border-[#dadce0] bg-[#f8f9fa] px-3 py-2 text-sm">
            <span className="hidden text-[#5f6368] sm:inline">Daftar Affiliate:</span>
            <code className="min-w-0 truncate text-[#3c4043] text-xs sm:text-sm">{`${window.location.origin}/daftar-affiliate`}</code>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/daftar-affiliate`); setCopiedDaftar(true); setTimeout(() => setCopiedDaftar(false), 2000) }}
              className="ml-1 shrink-0 border border-[#dadce0] bg-white p-1.5 text-[#80868b] transition hover:border-[#8ab4f8] hover:text-[#1a73e8]">
              {copiedDaftar ? <CheckCircle size={14} className="text-[#188038]" /> : <Copy size={14} />}
            </button>
          </div>
          <button onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] focus:outline-none">
            <Plus size={16} /> Generate Link
          </button>
          <button onClick={openImport}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#1a73e8] transition hover:bg-[#f8f9fa]">
            <Upload size={16} /> Import Excel
          </button>
          <button onClick={handleSyncKomisi} disabled={syncing}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#1a73e8] transition hover:bg-[#f8f9fa] disabled:opacity-50">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> Sync Komisi
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-[#dadce0] bg-white p-3 sm:p-4">
          <p className="text-xs font-medium text-[#5f6368]">Total Link</p>
          <p className="mt-1 text-2xl font-medium text-[#202124]">{links.length}</p>
        </div>
        <div className="border border-[#dadce0] bg-white p-3 sm:p-4">
          <p className="text-xs font-medium text-[#5f6368]">Total Views</p>
          <p className="mt-1 text-2xl font-medium text-[#202124]">{links.reduce((s, l) => s + l.views, 0)}</p>
        </div>
        <div className="border border-[#dadce0] bg-white p-3 sm:p-4">
          <p className="text-xs font-medium text-[#5f6368]">Total Pendaftar</p>
          <p className="mt-1 text-2xl font-medium text-[#202124]">{links.reduce((s, l) => s + l.pendaftar_count, 0)}</p>
        </div>
      </div>

      {/* Affiliate Users Section */}
      <div className="mb-6 overflow-hidden border border-[#dadce0] bg-white">
        <div className="flex items-center gap-2 border-b border-[#dadce0] px-4 py-3 sm:px-5 sm:py-4">
          <UserCheck size={18} className="text-[#1a73e8]" />
          <h2 className="font-semibold text-[#202124]">Data Affiliate</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Affiliate</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Email</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Total Link</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Kandidat Diundang</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Komisi</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Status</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368]">Bergabung</th>
                <th scope="col" className="px-4 py-3 text-xs font-medium text-[#5f6368] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                      <Users size={24} />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada affiliate</p>
                  </td>
                </tr>
              ) : (
                stats.map(s => (
                  <tr key={s.id} className="bg-white transition hover:bg-[#f8f9fa]">
                    <td className="border-b border-[#e8eaed] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <span className="text-sm font-semibold text-[#202124]">{s.name}</span>
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">{s.email}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center text-sm font-semibold text-[#202124]">{s.affiliate_links_count}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-2 py-1 text-[11px] font-medium text-[#5f6368]">
                        <UserPlus size={12} />
                        {s.affiliate_links_sum_pendaftar_count || 0}
                      </span>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center gap-1.5 border border-[#fdd663] bg-[#fef7e0] px-2 py-1 text-[11px] font-medium text-[#b06000]">
                          Rp {(Number(s.total_komisi_pending || 0) + Number(s.total_komisi_paid || 0)).toLocaleString('id-ID')}
                        </span>
                        {s.total_komisi_paid > 0 && (
                          <span className="text-[10px] text-[#137333]">Dibayar: Rp {Number(s.total_komisi_paid).toLocaleString('id-ID')}</span>
                        )}
                      </div>
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">{statusUserBadge(s.status)}</td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-sm text-[#5f6368]">
                      {new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                      <button
                        onClick={() => openDetail(s.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-[#1a73e8] transition hover:bg-[#e8f0fe]"
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

        {/* Mobile Cards */}
        <div className="sm:hidden">
          {stats.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]">
                <Users size={24} />
              </div>
              <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada affiliate</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e8eaed]">
              {stats.map(s => (
                <div key={s.id} className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=e5e7eb&color=6b7280&size=36`}
                      className="h-9 w-9 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#202124] truncate">{s.name}</p>
                      <p className="text-xs text-[#5f6368] truncate">{s.email}</p>
                    </div>
                    {statusUserBadge(s.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#f8f9fa] px-3 py-2">
                      <p className="text-[#80868b]">Link</p>
                      <p className="font-bold text-[#202124]">{s.affiliate_links_count}</p>
                    </div>
                    <div className="bg-[#f1f3f4] px-3 py-2">
                      <p className="text-[#80868b]">Kandidat</p>
                      <p className="font-bold text-[#5f6368]">{s.affiliate_links_sum_pendaftar_count || 0}</p>
                    </div>
                    <div className="col-span-2 bg-[#fef7e0] px-3 py-2">
                      <p className="text-[#b06000]">Komisi</p>
                      <p className="font-bold text-[#b06000]">Rp {(Number(s.total_komisi_pending || 0) + Number(s.total_komisi_paid || 0)).toLocaleString('id-ID')}</p>
                      {s.total_komisi_paid > 0 && (
                        <p className="text-[10px] text-[#137333]">Dibayar: Rp {Number(s.total_komisi_paid).toLocaleString('id-ID')}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-[#80868b]">
                      {new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => openDetail(s.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] transition hover:bg-[#e8f0fe]"
                    >
                      <Eye size={12} /> Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Generate Link Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#202124]/50 sm:items-center sm:p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg border border-[#dadce0] bg-white p-5 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#202124]">Generate Link Affiliate</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-[#5f6368] transition hover:bg-[#f1f3f4]"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#3c4043]">Affiliate</label>
                <select required value={form.affiliate_id} onChange={e => setForm({ ...form, affiliate_id: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2.5 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]">
                  <option value="">Pilih Affiliate</option>
                  {affiliates.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#3c4043]">Produk / Program</label>
                <select required value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                  className="w-full border border-[#dadce0] bg-white px-3 py-2.5 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]">
                  <option value="">Pilih Produk</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nama} - Rp {Number(p.harga).toLocaleString('id-ID')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#3c4043]">Nama Link (opsional)</label>
                <input type="text" value={form.nama_link} onChange={e => setForm({ ...form, nama_link: e.target.value })}
                  placeholder="Misal: Promosi Instagram"
                  className="w-full border border-[#dadce0] bg-white px-3 py-2.5 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8]" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-[#1a73e8] transition hover:bg-[#f8f9fa]">Batal</button>
                <button type="submit" className="bg-[#0E6187] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#084c63]">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#202124]/50 sm:items-center sm:p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-2xl border border-[#dadce0] bg-white p-5 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)] sm:p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-[#5f6368]" />
                <h2 className="text-lg font-medium text-[#202124]">Import Data Affiliate</h2>
              </div>
              <button onClick={() => setShowImport(false)} className="p-2 text-[#5f6368] transition hover:bg-[#f1f3f4]"><X size={20} /></button>
            </div>

            {/* File upload */}
            <div className="mb-4">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-[#dadce0] bg-[#f8f9fa] px-4 py-6 text-center transition hover:border-[#8ab4f8] hover:bg-[#f1f3f4]">
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f) }} />
                <Upload size={24} className="text-[#5f6368]" />
                <p className="text-sm font-medium text-[#3c4043]">
                  {importFile ? importFile.name : 'Pilih file Excel (kolom Nama & Email)'}
                </p>
                <p className="text-[11px] text-[#80868b]">Format: Nama | Email — akun role Affiliate dibuat otomatis dengan password acak</p>
              </label>
            </div>

            {/* Preview */}
            {importRows.length > 0 && (
              <div className="mb-4 max-h-56 overflow-y-auto border border-[#dadce0]">
                <table className="w-full text-left text-sm text-[#3c4043]">
                  <thead className="sticky top-0 bg-[#f8f9fa] text-xs text-[#5f6368]">
                    <tr>
                      <th className="border-b border-[#dadce0] px-3 py-2 font-medium">#</th>
                      <th className="border-b border-[#dadce0] px-3 py-2 font-medium">Nama</th>
                      <th className="border-b border-[#dadce0] px-3 py-2 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.map((r, i) => (
                      <tr key={i} className={i % 2 ? 'bg-white' : 'bg-[#f8f9fa]/50'}>
                        <td className="border-b border-[#e8eaed] px-3 py-1.5 text-[#80868b]">{i + 1}</td>
                        <td className="border-b border-[#e8eaed] px-3 py-1.5 font-medium text-[#202124]">{r.nama}</td>
                        <td className="border-b border-[#e8eaed] px-3 py-1.5 text-[#5f6368]">{r.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className="mb-4 border border-[#dadce0]">
                <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-3">
                  {importResult.failed === 0
                    ? <CheckCircle size={16} className="text-[#188038]" />
                    : <X size={16} className="text-[#d93025]" />}
                  <p className="text-sm font-semibold text-[#202124]">
                    {importResult.success} berhasil, {importResult.failed} gagal
                  </p>
                </div>
                {importResult.created.length > 0 && (
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-sm text-[#3c4043]">
                      <thead className="sticky top-0 bg-[#f8f9fa] text-xs text-[#5f6368]">
                        <tr>
                          <th className="border-b border-[#e8eaed] px-4 py-2 font-medium">Nama</th>
                          <th className="border-b border-[#e8eaed] px-4 py-2 font-medium">Email</th>
                          <th className="border-b border-[#e8eaed] px-4 py-2 font-medium">Password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.created.map((c, i) => (
                          <tr key={i}>
                            <td className="border-b border-[#e8eaed] px-4 py-1.5 font-medium text-[#202124]">{c.nama}</td>
                            <td className="border-b border-[#e8eaed] px-4 py-1.5 text-[#5f6368]">{c.email}</td>
                            <td className="border-b border-[#e8eaed] px-4 py-1.5"><code className="bg-[#f1f3f4] px-1.5 py-0.5 text-xs text-[#3c4043]">{c.password}</code></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="max-h-32 overflow-y-auto px-4 py-2">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="py-0.5 text-xs text-[#c5221f]">Baris {err.row}: {err.message}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 text-sm font-medium text-[#1a73e8] transition hover:bg-[#f8f9fa]">Tutup</button>
              <button type="button" onClick={handleImportSubmit} disabled={importRows.length === 0 || importing}
                className="inline-flex items-center gap-2 bg-[#137333] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#188038] disabled:opacity-50">
                {importing && <Loader2 size={14} className="animate-spin" />}
                Import {importRows.length > 0 ? `(${importRows.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailAffiliate && (
        <div className="fixed inset-0 z-50 flex bg-[#202124]/50 sm:items-center sm:justify-center sm:p-4" onClick={() => setDetailAffiliate(null)}>
          <div className="h-full w-full overflow-y-auto bg-white sm:max-h-[calc(100vh-2rem)] sm:max-w-6xl sm:overflow-y-auto sm:border sm:border-[#dadce0] sm:shadow-[0_1px_3px_rgba(60,64,67,0.15),0_8px_24px_rgba(60,64,67,0.15)]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dadce0] bg-white px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-center gap-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(detailAffiliate.affiliate.name)}&background=0D1F3C&color=fff&size=40`}
                  className="h-10 w-10 shrink-0 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="min-w-0">
                  <h2 className="text-lg font-medium text-[#202124]">{detailAffiliate.affiliate.name}</h2>
                  <p className="text-xs text-[#5f6368] truncate">{detailAffiliate.affiliate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-medium sm:text-xs ${
                  detailAffiliate.affiliate.status === 'AKTIF'
                    ? 'border-[#a8dab5] bg-white text-[#137333]'
                    : 'border-[#dadce0] bg-white text-[#5f6368]'
                }`}>
                  <span className={`h-1.5 w-1.5 ${detailAffiliate.affiliate.status === 'AKTIF' ? 'bg-[#188038]' : 'bg-[#9aa0a6]'}`} />
                  {detailAffiliate.affiliate.status}
                </span>
                <button onClick={() => setDetailAffiliate(null)} className="p-2 text-[#5f6368] transition hover:bg-[#f1f3f4]"><X size={20} /></button>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="border border-[#dadce0] bg-white p-3 text-center">
                  <p className="text-xs font-medium text-[#5f6368]">Total Link</p>
                  <p className="mt-1 text-xl font-medium text-[#202124]">{detailAffiliate.stats.total_links}</p>
                </div>
                <div className="border border-[#dadce0] bg-white p-3 text-center">
                  <p className="text-xs font-medium text-[#5f6368]">Total Views</p>
                  <p className="mt-1 text-xl font-medium text-[#202124]">{detailAffiliate.stats.total_views}</p>
                </div>
                <div className="border border-[#dadce0] bg-white p-3 text-center">
                  <p className="text-xs font-medium text-[#5f6368]">Total Kandidat</p>
                  <p className="mt-1 text-xl font-medium text-[#202124]">{detailAffiliate.stats.total_pendaftar}</p>
                </div>
                <div className="border border-[#dadce0] bg-white p-3 text-center">
                  <p className="text-xs font-medium text-[#5f6368]">Total Komisi</p>
                  <p className="mt-1 text-xl font-medium text-[#202124]">Rp {Number(detailAffiliate.stats.komisi_paid + detailAffiliate.stats.komisi_pending).toLocaleString('id-ID')}</p>
                  {detailAffiliate.stats.komisi_pending > 0 && (
                    <p className="mt-0.5 text-[10px] text-[#b06000]">+ Rp {Number(detailAffiliate.stats.komisi_pending).toLocaleString('id-ID')} pending</p>
                  )}
                </div>
              </div>

              {/* Data Diri + Wilayah + Rekening Bank — side by side */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="overflow-hidden border border-[#dadce0] bg-white">
                  <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-3">
                    <User size={16} className="text-[#1a73e8]" />
                    <h3 className="text-sm font-medium text-[#202124]">Data Diri</h3>
                  </div>
                  <div className="space-y-3 px-4 py-3">
                    <div>
                      <p className="text-xs text-[#5f6368]">Nama Lengkap</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Email</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">No. WhatsApp</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.no_hp || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Bergabung</p>
                      <p className="text-sm font-medium text-[#202124]">
                        {new Date(detailAffiliate.affiliate.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Alamat</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.alamat || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden border border-[#dadce0] bg-white">
                  <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-3">
                    <MapPin size={16} className="text-[#137333]" />
                    <h3 className="text-sm font-medium text-[#202124]">Wilayah</h3>
                  </div>
                  <div className="space-y-3 px-4 py-3">
                    <div>
                      <p className="text-xs text-[#5f6368]">Provinsi</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.provinsi || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Kabupaten / Kota</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.kabupaten || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Kecamatan</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.kecamatan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Desa / Kelurahan</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.desa || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden border border-[#dadce0] bg-white">
                  <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-3">
                    <Landmark size={16} className="text-[#1a73e8]" />
                    <h3 className="text-sm font-medium text-[#202124]">Rekening Bank</h3>
                  </div>
                  <div className="space-y-3 px-4 py-3">
                    <div>
                      <p className="text-xs text-[#5f6368]">Nama Bank</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.bank || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">No. Rekening</p>
                      <p className="font-mono text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.no_rekening || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#5f6368]">Nama Pemilik Rekening</p>
                      <p className="text-sm font-medium text-[#202124]">{detailAffiliate.affiliate.nama_rekening || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Akses Login */}
              <div className="overflow-hidden border border-[#dadce0] bg-white">
                <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-3">
                  <KeyRound size={16} className="text-[#b06000]" />
                  <h3 className="text-sm font-medium text-[#202124]">Akses Login</h3>
                  <span className="ml-auto text-[10px] text-[#80868b]">untuk login affiliate di halaman utama</span>
                </div>
                <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[#5f6368]">Email</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="text-sm font-medium text-[#202124] break-all">{detailAffiliate.affiliate.email}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(detailAffiliate.affiliate.email); setCopiedLogin('email'); setTimeout(() => setCopiedLogin(null), 1500) }}
                        className="shrink-0 p-1 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#1a73e8]"
                        title="Salin email"
                      >
                        {copiedLogin === 'email' ? <CheckCircle size={14} className="text-[#188038]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#5f6368]">Password</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {detailAffiliate.affiliate.password_plain ? (
                        <>
                          <p className="font-mono text-sm font-medium text-[#202124]">{showPassword ? detailAffiliate.affiliate.password_plain : '••••••••'}</p>
                          <button
                            onClick={() => setShowPassword(v => !v)}
                            className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold text-[#5f6368] transition hover:bg-[#f1f3f4] hover:text-[#3c4043]"
                          >
                            {showPassword ? 'Sembunyikan' : 'Lihat'}
                          </button>
                          <button
                            onClick={() => { navigator.clipboard.writeText(detailAffiliate.affiliate.password_plain!); setCopiedLogin('pass'); setTimeout(() => setCopiedLogin(null), 1500) }}
                            className="shrink-0 p-1 text-[#80868b] transition hover:bg-[#f8f9fa] hover:text-[#1a73e8]"
                            title="Salin password"
                          >
                            {copiedLogin === 'pass' ? <CheckCircle size={14} className="text-[#188038]" /> : <Copy size={14} />}
                          </button>
                        </>
                      ) : (
                        <p className="text-sm text-[#80868b]">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="overflow-hidden border border-[#dadce0] bg-white">
                <div className="flex items-center gap-2 border-b border-[#e8eaed] px-4 py-3">
                  <Link2 size={16} className="text-[#1a73e8]" />
                  <h3 className="text-sm font-medium text-[#202124]">Link Affiliate</h3>
                  <span className="ml-auto bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{detailAffiliate.links.length} link</span>
                </div>
                <div className="px-4 py-3">
                  {detailAffiliate.links.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[#80868b]">Belum ada link affiliate</p>
                  ) : (
                    <div className="space-y-2">
                      {detailAffiliate.links.map(link => (
                        <div key={link.id} className="overflow-hidden border border-[#dadce0]">
                          <button
                            onClick={() => toggleLink(link.id)}
                            className="flex w-full items-center gap-2 px-3 py-3 text-left transition hover:bg-[#f8f9fa] sm:gap-3 sm:px-4"
                          >
                            {expandedLinks[link.id] ? <ChevronDown size={16} className="shrink-0 text-[#80868b]" /> : <ChevronRight size={16} className="shrink-0 text-[#80868b]" />}
                            <Link2 size={14} className="shrink-0 text-[#1a73e8]" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#202124]">{link.nama_link || link.kode}</p>
                              <p className="truncate text-[10px] text-[#80868b] sm:text-xs">{linkBase}{link.kode}</p>
                            </div>
                            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                              <span className="text-xs text-[#5f6368]">{link.product?.nama}</span>
                              {link.product?.komisi && (
                                <span className="bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-medium text-[#1967d2]">Rp {Number(link.product.komisi).toLocaleString('id-ID')}/org</span>
                              )}
                              <span className="bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{link.views} views</span>
                              <span className="bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{link.pendaftar_count} kandidat</span>
                              {link.total_komisi > 0 && (
                                <span className="bg-[#fef7e0] px-2 py-0.5 text-[10px] font-medium text-[#b06000]">Rp {Number(link.total_komisi).toLocaleString('id-ID')}</span>
                              )}
                            </div>
                          </button>
                          {/* Mobile stats row */}
                          <div className="flex flex-wrap gap-1.5 border-t border-[#e8eaed] px-3 py-2 sm:hidden">
                            <span className="bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{link.product?.nama}</span>
                            {link.product?.komisi && (
                              <span className="bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-medium text-[#1967d2]">Rp {Number(link.product.komisi).toLocaleString('id-ID')}/org</span>
                            )}
                            <span className="bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{link.views} views</span>
                            <span className="bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]">{link.pendaftar_count} kandidat</span>
                            {link.total_komisi > 0 && (
                              <span className="bg-[#fef7e0] px-2 py-0.5 text-[10px] font-medium text-[#b06000]">Rp {Number(link.total_komisi).toLocaleString('id-ID')}</span>
                            )}
                          </div>
                          {expandedLinks[link.id] && (
                            <div className="border-t border-[#e8eaed] px-3 py-3 sm:px-4">
                              {link.pendaftar.length === 0 ? (
                                <p className="py-3 text-center text-xs text-[#80868b]">Belum ada kandidat</p>
                              ) : (
                                <div className="space-y-2">
                                  {link.pendaftar.map(p => (
                                    <div key={p.id} className="flex flex-col gap-2 bg-[#f8f9fa] px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
                                      <div className="flex items-center gap-2 sm:flex-1">
                                        <img
                                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=24`}
                                          className="h-6 w-6 shrink-0"
                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-xs font-semibold text-[#202124]">{p.nama}</p>
                                          <p className="truncate text-[10px] text-[#5f6368]">{p.email}</p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 pl-8 sm:pl-0">
                                        {p.product?.komisi && (
                                          <span className="bg-[#e8f0fe] px-1.5 py-0.5 text-[10px] font-medium text-[#1a73e8]">Rp {Number(p.product.komisi).toLocaleString('id-ID')}/org</span>
                                        )}
                                        <span className={`px-1.5 py-0.5 text-[10px] font-medium ${ p.status_pendaftaran === 'disetujui' ? 'bg-[#e6f4ea] text-[#137333]' :
                                          p.status_pendaftaran === 'pending' ? 'bg-[#fef7e0] text-[#b06000]' :
                                          'bg-[#fce8e6] text-[#c5221f]'
                                        }`}>{p.status_pendaftaran}</span>
                                        {p.status_kandidat === 'Mengundurkan Diri' ? (
                                          <span className="bg-[#fce8e6] px-1.5 py-0.5 text-[10px] font-medium text-[#c5221f]">Mengundurkan Diri</span>
                                        ) : (p.komisi_diperoleh > 0 || p.komisi_pending > 0) && (
                                          <span className="text-[10px] font-medium text-[#b06000]">
                                            {p.komisi_diperoleh > 0 ? `Rp ${Number(p.komisi_diperoleh).toLocaleString('id-ID')}` : `Rp ${Number(p.komisi_pending).toLocaleString('id-ID')} (pending)`}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-[#80868b]">
                                          {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                      </div>
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

            {/* Mobile close button at bottom */}
            <div className="sticky bottom-0 border-t border-[#dadce0] bg-white p-4 sm:hidden">
              <button onClick={() => setDetailAffiliate(null)} className="w-full border border-[#dadce0] bg-white py-2.5 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
