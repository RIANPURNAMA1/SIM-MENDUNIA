import { useState, useEffect } from 'react'
import { Package, Copy, Check, Plus, X, ExternalLink, Eye, Users, Loader } from 'lucide-react'
import api, { APP_URL, affiliateLinkApi } from '../../services/api'

interface Program {
  id: number
  nama: string
  slug: string
  status: string
  is_affiliable: boolean
  deskripsi: string | null
  harga: number
  gambar: string | null
  batch: { id: number; nama_batch: string } | null
}

interface Product {
  id: number
  nama: string
  harga: number
  komisi: number | null
}

interface AffiliateLink {
  id: number
  kode: string
  nama_link: string | null
  views: number
  pendaftar_count: number
  product: { id: number; nama: string; harga: number; komisi: number | null } | null
}

function toast(msg: string) {
  const el = document.createElement('div')
  el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-slate-800 text-white px-5 py-3 text-sm font-medium shadow-lg animate-slide-up'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300) }, 2000)
}

export default function AffiliatePrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [links, setLinks] = useState<AffiliateLink[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [linkName, setLinkName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  function fetchData() {
    setLoading(true)
    Promise.all([
      api.get('/products'),
      api.get('/affiliate/my-links'),
    ])
      .then(([prodRes, linksRes]) => {
        const all = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data || [])
        setPrograms(all.filter((p: Program) => p.status === 'aktif' && p.is_affiliable !== false))
        setLinks(Array.isArray(linksRes.data) ? linksRes.data : (linksRes.data.data || []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const linkedProductIds = new Set(links.map(l => l.product?.id).filter(Boolean) as number[])

  function openBuatLink(productId?: number) {
    affiliateLinkApi.availableProducts().then(res => {
      const all = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setProducts(all.filter((p: Product) => !linkedProductIds.has(p.id)))
    })
    setSelectedProduct(productId ? String(productId) : '')
    setLinkName('')
    setShowModal(true)
  }

  function salinExisting(productId: number) {
    const link = links.find(l => l.product?.id === productId)
    if (link) {
      navigator.clipboard.writeText(`${window.location.origin}/daftar/${link.kode}`)
      setCopiedId(link.id)
      toast('Link tersalin!')
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  async function buatLink(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return
    if (linkedProductIds.has(Number(selectedProduct))) {
      toast('Produk ini sudah memiliki link')
      setShowModal(false)
      return
    }
    setCreating(true)
    try {
      const res = await affiliateLinkApi.myStore({ product_id: Number(selectedProduct), nama_link: linkName || undefined })
      const kode = res.data.kode
      const url = `${window.location.origin}/daftar/${kode}`
      navigator.clipboard.writeText(url)
      toast('Link berhasil dibuat & tersalin!')
      setShowModal(false)
      fetchData()
    } catch {
      toast('Gagal membuat link')
    } finally {
      setCreating(false)
    }
  }

  function copyLink(kode: string, id: number) {
    navigator.clipboard.writeText(`${window.location.origin}/daftar/${kode}`)
    setCopiedId(id)
    toast('Link tersalin!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const programMap = new Map(programs.map(p => [p.id, p]))

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Program Saya</h1>
            <p className="text-sm text-slate-500">Daftar program yang tersedia</p>
          </div>
        </div>
        <button onClick={() => openBuatLink()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.97]">
          <Plus size={16} /> Buat Link Baru
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : (
        <>
          {/* Link Saya (Cards) */}
          {links.length > 0 && (
            <div className="mb-4">
              <h2 className="mb-3 text-sm font-bold text-slate-700">Link Saya</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map(link => {
                  const prog = link.product ? programMap.get(link.product.id) : undefined
                  return (
                    <div key={link.id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      {prog?.gambar ? (
                        <img src={`${APP_URL}/storage/${prog.gambar}`} alt={prog.nama} className="w-full h-40 object-cover" />
                      ) : (
                        <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                          <Package size={40} className="text-slate-300" />
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-semibold text-slate-800">{link.nama_link || prog?.nama || link.product?.nama || 'Link ' + link.kode}</h3>
                          {prog?.batch && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{prog.batch.nama_batch}</span>
                          )}
                          <p className="mt-1 text-xs text-slate-400">{link.product?.nama} · Rp {Number(link.product?.harga || 0).toLocaleString('id-ID')}</p>
                          {link.product?.komisi && (
                            <p className="text-[11px] font-medium text-blue-600">Komisi: Rp {Number(link.product.komisi).toLocaleString('id-ID')}/kandidat</p>
                          )}
                        </div>
                        {prog?.deskripsi && (
                          <p className="text-xs text-slate-500 line-clamp-2">{prog.deskripsi}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Eye size={12} /> {link.views}</span>
                          <span className="flex items-center gap-1"><Users size={12} /> {link.pendaftar_count}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <code className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">{link.kode}</code>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a href={`${window.location.origin}/daftar/${link.kode}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                              <ExternalLink size={14} />
                            </a>
                            <button onClick={() => copyLink(link.kode, link.id)}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${copiedId === link.id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                              {copiedId === link.id ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Salin</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Program Cards (for unlinked programs) */}
          {programs.filter(p => !links.some(l => l.product?.id === p.id)).length > 0 && (
            <div className="mb-4">
              {(links.length > 0) && (
                <h2 className="mb-3 text-sm font-bold text-slate-700">Program Lainnya</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.filter(p => !links.some(l => l.product?.id === p.id)).map(p => (
                  <div key={p.id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {p.gambar ? (
                      <img src={`${APP_URL}/storage/${p.gambar}`} alt={p.nama} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                        <Package size={40} className="text-slate-300" />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{p.nama}</h3>
                        {p.batch && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{p.batch.nama_batch}</span>
                        )}
                      </div>
                      {p.deskripsi && (
                        <p className="text-xs text-slate-500 line-clamp-2">{p.deskripsi}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-sm font-bold text-[#0E6187]">Rp {Number(p.harga).toLocaleString('id-ID')}</span>
                        <button
                          onClick={() => openBuatLink(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0a4a6a] transition-colors"
                        >
                          <Plus size={13} /> Buat Link
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {programs.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Package size={24} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">Belum ada program tersedia</p>
            </div>
          )}
        </>
      )}

      {/* Modal Buat Link Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Buat Link Baru</h2>
              <button onClick={() => setShowModal(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={buatLink} className="px-5 py-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Pilih Produk <span className="text-red-500">*</span></label>
                <select required value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  <option value="">-- Pilih Produk --</option>
                  {products.filter(p => !linkedProductIds.has(p.id)).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nama} — Rp {Number(p.harga).toLocaleString('id-ID')}{p.komisi ? ` (komisi: Rp ${Number(p.komisi).toLocaleString('id-ID')}/kandidat)` : ''}
                    </option>
                  ))}
                </select>
                {products.filter(p => !linkedProductIds.has(p.id)).length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">Semua produk sudah memiliki link.</p>
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
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
