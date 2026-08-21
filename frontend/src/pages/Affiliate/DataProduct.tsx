import { useState, useEffect } from 'react'
import {
  Package, Plus, Edit3, Trash2, X, Search, RotateCcw, Link as LinkIcon,
  Check, GraduationCap, ExternalLink, ChevronRight, LayoutDashboard,
  Layers,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { productApi, APP_URL } from '../../services/api'

interface KategoriItem {
  name: string
  harga: number
  komisi: number
  children: KategoriItem[]
  trigger_type: string
  trigger_value: string | null
  due_type: string
  due_value: string | null
  reminder_setting: string[] | null
  reminder_hour: string
  channel: string
  template_pesan: string | null
  template_email: string | null
  subject_email: string | null
}

interface KomisiTier {
  id?: number
  kategori_id: number | null
  kategori_name?: string
  batch_id: number | null
  min_orang: number
  max_orang: number | null
  komisi: number
  urutan: number
}

interface Product {
  id: number
  nama: string
  slug: string
  deskripsi: string | null
  kategori_items: KategoriItem[] | null
  harga: number
  komisi: number | null
  status: string
  is_affiliable: boolean
  batch_id: number | null
  gambar: string | null
  batch?: { id: number; nama_batch: string } | null
  biaya_kategoris: (BiayaKategori & { pivot: { harga: number; komisi: number } })[]
  komisi_tiers: KomisiTier[]
}

function sumHargaDeep(item: KategoriItem): number {
  const own = item.harga || 0
  const kids = (item.children || []).reduce((s, c) => s + sumHargaDeep(c), 0)
  return own + kids
}

export default function DataProduct() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => { fetchProducts() }, [])
  function fetchProducts() { productApi.list().then(res => setProducts(res.data)) }

  const filtered = products.filter(p => !search || p.nama.toLowerCase().includes(search.toLowerCase()))

  function handleDelete(id: number) {
    if (confirm('Yakin ingin menghapus produk ini?')) productApi.destroy(id).then(fetchProducts)
  }

  function copyLink(p: Product) {
    navigator.clipboard.writeText(`${window.location.origin}/daftar-program/${p.slug}`).then(() => {
      setCopiedId(p.id); setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function renderKategoriDisplay(p: Product) {
    const items = p.kategori_items && p.kategori_items.length > 0 ? p.kategori_items : []
    if (items.length === 0) return <span className="text-xs text-slate-400">-</span>
    return (
      <div className="space-y-0.5">
        {items.slice(0, 4).map((item, idx) => {
          const total = sumHargaDeep(item)
          return (
            <div key={idx} className="text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">{item.name}</span>
                {total > 0 && <span className="text-slate-500">Rp {total.toLocaleString('id-ID')}</span>}
              </div>
              {item.children && item.children.length > 0 && (
                <div className="ml-3 border-l border-slate-200 pl-1.5 space-y-0.5">
                  {item.children.filter(c => c.harga > 0).slice(0, 3).map((c, ci) => (
                    <div key={ci} className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>{c.name}</span>
                      <span>Rp {c.harga.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {items.length > 4 && <span className="text-[10px] text-slate-400">+{items.length - 4} lainnya</span>}
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const dot = status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  const activeProducts = products.filter(p => p.status === 'aktif')

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#0E6187]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-slate-500">Program &amp; Affiliate</span>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-medium text-slate-700">Data Product</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white border border-blue-100">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Product / Program</h1>
            <p className="text-sm text-slate-500">Kelola program dan produk affiliate</p>
          </div>
        </div>
        <Link to="/data-product/tambah"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1">
          <Plus size={16} /> Tambah Produk
        </Link>
      </div>

      {/* Link Pendaftaran */}
      {activeProducts.length > 0 && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0E6187]">
              <LinkIcon size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-slate-700">Link Pendaftaran (Non-Affiliate)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-[#0E6187]/20 hover:bg-[#f5f6fa] transition-all group">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-sm flex-none overflow-hidden">
                    {p.gambar ? (
                      <img src={`${APP_URL}/storage/${p.gambar}`} alt={p.nama} className="h-full w-full object-cover" />
                    ) : (
                      <GraduationCap size={14} className="text-[#0E6187]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.nama}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.batch && <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">{p.batch.nama_batch}</span>}
                      <p className="text-[10px] text-slate-400 font-medium">Rp {Number(p.harga).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => copyLink(p)}
                  className="flex-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-[#0E6187]/30 hover:bg-[#0E6187] hover:text-white group/btn">
                  {copiedId === p.id ? (
                    <span className="text-emerald-600 group-hover/btn:text-white flex items-center gap-1"><Check size={11} /> Tersalin</span>
                  ) : (
                    <span className="flex items-center gap-1"><ExternalLink size={11} /> Salin Link</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={() => setSearch('')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 font-medium">Nama Produk</th>
                <th className="hidden border border-slate-200 px-4 py-3 font-medium md:table-cell">Batch</th>
                <th className="hidden border border-slate-200 px-4 py-3 font-medium lg:table-cell">Kategori / Harga</th>
                <th className="hidden border border-slate-200 px-4 py-3 font-medium xl:table-cell">Deskripsi</th>
                <th className="hidden border border-slate-200 px-4 py-3 font-medium lg:table-cell">Komisi Tier</th>
                <th className="border border-slate-200 px-4 py-3 text-right font-medium">Total</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
                <th className="hidden border border-slate-200 px-4 py-3 text-center font-medium md:table-cell">Affiliate</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-200 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Package size={24} /></div>
                    <p className="mt-3 text-sm font-medium text-slate-600">Belum ada produk</p>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.gambar ? (
                        <img src={`${APP_URL}/storage/${p.gambar}`} alt={p.nama} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Package size={16} className="text-blue-600" /></div>
                      )}
                      <span className="text-sm font-semibold text-slate-800">{p.nama}</span>
                    </div>
                  </td>
                  <td className="hidden border border-slate-200 px-4 py-3 md:table-cell">
                    {p.batch ? (
                      <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                        <Layers size={11} /> {p.batch.nama_batch}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="hidden border border-slate-200 px-4 py-3 lg:table-cell">{renderKategoriDisplay(p)}</td>
                  <td className="hidden border border-slate-200 px-4 py-3 text-sm text-slate-500 max-w-xs truncate xl:table-cell">{p.deskripsi || '-'}</td>
                  <td className="hidden border border-slate-200 px-4 py-3 lg:table-cell">
                    {p.komisi_tiers && p.komisi_tiers.length > 0 ? (
                      <div className="space-y-1">
                        {(() => {
                          const grouped: Record<string, typeof p.komisi_tiers> = {}
                          p.komisi_tiers.forEach(t => {
                            let key = 'Global'
                            if (t.kategori_id && p.biaya_kategoris) {
                              const bk = p.biaya_kategoris.find((bk: any) => bk.id === t.kategori_id)
                              if (bk) {
                                const parentMatch = p.kategori_items?.find((item: any) => item.name.toLowerCase() === bk.nama?.toLowerCase())
                                key = parentMatch?.name || bk.nama || 'Global'
                              }
                            } else if (t.kategori_name) {
                              key = t.kategori_name
                            }
                            if (!grouped[key]) grouped[key] = []
                            const isDuplicate = grouped[key].some(
                              g => g.min_orang === t.min_orang && g.max_orang === t.max_orang && g.komisi === t.komisi
                            )
                            if (!isDuplicate) grouped[key].push(t)
                          })
                          return Object.entries(grouped).map(([name, tiers]) => (
                            <div key={name} className="text-[11px]">
                              <span className="font-semibold text-emerald-700">{name}</span>
                              <div className="ml-1 space-y-0.5">
                                {tiers.map((t, i) => (
                                  <div key={i} className="flex items-center gap-1 text-slate-500">
                                    <span className="text-[10px]">{t.min_orang}-{t.max_orang || '∞'} org:</span>
                                    <span className="font-medium text-amber-600">Rp {Number(t.komisi).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800">Rp {Number(p.harga).toLocaleString('id-ID')}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center">{statusBadge(p.status)}</td>
                  <td className="hidden border border-slate-200 px-4 py-3 text-center md:table-cell">
                    {p.is_affiliable !== false ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"><Check size={10} /> Bisa</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500"><X size={10} /> Tidak</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => navigate(`/data-product/edit/${p.id}`)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600" title="Edit"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
