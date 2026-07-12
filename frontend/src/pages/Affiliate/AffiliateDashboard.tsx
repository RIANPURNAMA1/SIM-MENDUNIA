import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link2, Eye, Users, CheckCircle, Clock, Copy, CheckCircle as CheckIcon, Wallet, Banknote, User, Table, LayoutDashboard, Plus, X, Package, ExternalLink, Info } from 'lucide-react'
import { affiliateDashboardApi, affiliateLinkApi } from '../../services/api'

interface Product {
  id: number
  nama: string
  harga: number
  komisi: number | null
}

interface DashboardData {
  affiliate: { name: string; email: string; telepon: string | null; alamat: string | null }
  stats: { total_links: number; total_views: number; total_pendaftar: number; pending: number; disetujui: number; komisi_pending: number; komisi_paid: number }
  links: { id: number; kode: string; nama_link: string | null; views: number; pendaftar_count: number; product: { nama: string; harga: number } }[]
  pendaftar: { id: number; nama: string; email: string; nominal: number; status_pendaftaran: string; status_pembayaran: string; created_at: string; product: { nama: string } }[]
}

function toast(msg: string) {
  const el = document.createElement('div')
  el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-slate-800 text-white px-5 py-3 text-sm font-medium shadow-lg animate-slide-up'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300) }, 2000)
}

export default function AffiliateDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)
  const [showBuatLink, setShowBuatLink] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [linkName, setLinkName] = useState('')
  const [creating, setCreating] = useState(false)

  const tab = searchParams.get('tab') || 'dashboard'

  const fetchData = useCallback(() => {
    setLoading(true)
    affiliateDashboardApi.index()
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function copyLink(kode: string, id: number) {
    navigator.clipboard.writeText(`${window.location.origin}/daftar/${kode}`)
    setCopied(id)
    toast('Link tersalin!')
    setTimeout(() => setCopied(null), 2000)
  }

  function setTab(t: string) {
    setSearchParams(t === 'dashboard' ? {} : { tab: t })
  }

  function openBuatLink() {
    affiliateLinkApi.availableProducts().then(res => setProducts(res.data))
    setSelectedProduct('')
    setLinkName('')
    setShowBuatLink(true)
  }

  async function buatLink(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    setCreating(true)
    try {
      await affiliateLinkApi.myStore({ product_id: Number(selectedProduct), nama_link: linkName || undefined })
      setShowBuatLink(false)
      toast('Link berhasil dibuat!')
      fetchData()
    } catch { } finally { setCreating(false) }
  }

  if (loading) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <X size={28} className="text-red-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600">Gagal memuat data</p>
        <button onClick={fetchData} className="mt-3 rounded-lg bg-[#0D1F3C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0a1628]">Coba Lagi</button>
      </div>
    )
  }

  const { affiliate, stats, links, pendaftar } = data

  return (
    <>
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white">
            <Link2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Dashboard Affiliate</h1>
            <p className="text-sm text-slate-500">Pantau dan kelola link affiliate Anda</p>
          </div>
        </div>
        <button onClick={openBuatLink}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.97]">
          <Plus size={16} /> Buat Link Baru
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button onClick={() => setTab('dashboard')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${tab === 'dashboard' ? 'bg-[#0D1F3C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        <button onClick={() => setTab('pendaftar')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${tab === 'pendaftar' ? 'bg-[#0D1F3C] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Table size={16} />
          Data Pendaftar
          {pendaftar.length > 0 && (
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === 'pendaftar' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {pendaftar.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'dashboard' ? (
        <>
          {/* Affiliate Profile */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0D1F3C] text-white shrink-0">
                <User size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-slate-800">{affiliate.name}</h2>
                <p className="text-sm text-slate-500">{affiliate.email}</p>
                {(affiliate.telepon || affiliate.alamat) && (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                    {affiliate.telepon && <span>Telp: {affiliate.telepon}</span>}
                    {affiliate.alamat && <span>Alamat: {affiliate.alamat}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Link', value: stats.total_links, icon: Link2, color: 'text-blue-600 bg-blue-50', hint: 'Jumlah link affiliate yang Anda buat' },
              { label: 'Total Views', value: stats.total_views, icon: Eye, color: 'text-purple-600 bg-purple-50', hint: 'Berapa kali link Anda dilihat' },
              { label: 'Total Pendaftar', value: stats.total_pendaftar, icon: Users, color: 'text-emerald-600 bg-emerald-50', hint: 'Jumlah pendaftar melalui link Anda' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50', hint: 'Menunggu persetujuan admin' },
            ].map(s => (
              <div key={s.label} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-slate-500">{s.label}</p>
                      <span className="relative" title={s.hint}>
                        <Info size={11} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" />
                      </span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Komisi */}
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: 'Komisi Pending', value: stats.komisi_pending, icon: Wallet, color: 'text-amber-600 bg-amber-50', hint: 'Komisi yang belum dicairkan' },
              { label: 'Komisi Dibayar', value: stats.komisi_paid, icon: Banknote, color: 'text-emerald-600 bg-emerald-50', hint: 'Total komisi yang sudah dibayarkan' },
            ].map(s => (
              <div key={s.label} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-slate-500">{s.label}</p>
                      <Info size={11} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-help" title={s.hint} />
                    </div>
                    <p className="text-xl font-bold text-slate-800">Rp {Number(s.value).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Links + Pendaftar */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-sm font-bold text-slate-800">Link Saya</h2>
                {links.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">{links.length}</span>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {links.map(link => (
                  <div key={link.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{link.nama_link || 'Link ' + link.kode}</p>
                      <p className="text-xs text-slate-400">{link.product?.nama} · Rp {Number(link.product?.harga || 0).toLocaleString('id-ID')}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Eye size={12} /> {link.views}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {link.pendaftar_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a href={`${window.location.origin}/daftar/${link.kode}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                        <ExternalLink size={15} />
                      </a>
                      <button onClick={() => copyLink(link.kode, link.id)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${copied === link.id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                        {copied === link.id ? <><CheckIcon size={13} /> Tersalin</> : <><Copy size={13} /> Salin</>}
                      </button>
                    </div>
                  </div>
                ))}
                {links.length === 0 && (
                  <div className="flex flex-col items-center px-5 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <Link2 size={22} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-500">Belum ada link</p>
                    <p className="mt-1 text-xs text-slate-400">Klik "Buat Link Baru" untuk memulai</p>
                    <button onClick={openBuatLink} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">
                      <Plus size={14} /> Buat Link
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h2 className="text-sm font-bold text-slate-800">Pendaftar Terbaru</h2>
                {pendaftar.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">{pendaftar.length}</span>
                )}
              </div>
              <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                {pendaftar.slice(0, 10).map(p => (
                  <div key={p.id} className="px-5 py-3.5 transition hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.nama}</p>
                        <p className="text-xs text-slate-400">{p.product?.nama}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        p.status_pendaftaran === 'disetujui' ? 'bg-emerald-100 text-emerald-700' :
                        p.status_pendaftaran === 'ditolak' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status_pendaftaran === 'disetujui' ? 'Disetujui' :
                         p.status_pendaftaran === 'ditolak' ? 'Ditolak' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
                {pendaftar.length === 0 && (
                  <div className="flex flex-col items-center px-5 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <Users size={22} className="text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-500">Belum ada pendaftar</p>
                    <p className="mt-1 text-xs text-slate-400">Bagikan link Anda untuk mendapatkan pendaftar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Data Pendaftar Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-bold text-slate-800">Data Pendaftar</h2>
            </div>
            {pendaftar.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Users size={26} className="text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">Belum ada pendaftar</p>
                <p className="mt-1 text-xs text-slate-400">Bagikan link affiliate Anda untuk mulai mendapatkan pendaftar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nama</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Email</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Program</th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendaftar.map(p => (
                      <tr key={p.id} className="border-t border-slate-100 bg-white transition hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">{p.nama}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">{p.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.product?.nama || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>

      {/* Modal Buat Link Baru */}
      {showBuatLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowBuatLink(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Buat Link Baru</h2>
              <button onClick={() => setShowBuatLink(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={buatLink} className="px-5 py-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Pilih Produk <span className="text-red-500">*</span></label>
                <select required value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — Rp {Number(p.harga).toLocaleString('id-ID')}{p.komisi ? ` (komisi: Rp ${Number(p.komisi).toLocaleString('id-ID')})` : ''}
                    </option>
                  ))}
                </select>
                {products.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">Belum ada produk aktif. Hubungi admin.</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nama Link <span className="text-slate-400 font-normal">(opsional)</span></label>
                <input type="text" placeholder="Misal: Promosi Instagram" value={linkName} onChange={e => setLinkName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={creating || !selectedProduct}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.98]">
                  {creating ? 'Membuat...' : 'Buat Link'}
                </button>
                <button type="button" onClick={() => setShowBuatLink(false)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
