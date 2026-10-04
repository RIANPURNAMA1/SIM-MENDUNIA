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
    if (items.length === 0) return <span className="text-xs text-[#80868b]">-</span>
    return (
      <div className="space-y-0.5">
        {items.slice(0, 4).map((item, idx) => {
          const total = sumHargaDeep(item)
          return (
            <div key={idx} className="text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center bg-[#e8f0fe] px-1.5 py-0.5 font-semibold text-[#1967d2]">{item.name}</span>
                {total > 0 && <span className="text-[#5f6368]">Rp {total.toLocaleString('id-ID')}</span>}
              </div>
              {item.children && item.children.length > 0 && (
                <div className="ml-3 border-l border-[#dadce0] pl-1.5 space-y-0.5">
                  {item.children.filter(c => c.harga > 0).slice(0, 3).map((c, ci) => (
                    <div key={ci} className="flex items-center gap-1 text-[10px] text-[#80868b]">
                      <span>{c.name}</span>
                      <span>Rp {c.harga.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {items.length > 4 && <span className="text-[10px] text-[#80868b]">+{items.length - 4} lainnya</span>}
      </div>
    )
  }

  const statusBadge = (status: string) => {
    const dot = status === 'aktif' ? 'bg-[#188038]' : 'bg-[#e8eaed]'
    return (
      <span className="inline-flex items-center gap-1.5 border border-[#dadce0] bg-white px-2 py-1 text-[11px] font-medium text-[#5f6368] ">
        <span className={`h-1.5 w-1.5 ${dot}`} />
        {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
      </span>
    )
  }

  const activeProducts = products.filter(p => p.status === 'aktif')

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[#5f6368]" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 transition-colors hover:text-[#1a73e8]">
          <LayoutDashboard size={13} />
          <span>Beranda</span>
        </Link>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="text-[#5f6368]">Program &amp; Affiliate</span>
        <ChevronRight size={12} className="text-[#9aa0a6]" />
        <span className="font-medium text-[#3c4043]">Data Product</span>
      </nav>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 border-b border-[#dadce0] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
            <Package size={20} />
          </div>
          <div>
            <h1 className="text-xl font-medium text-[#202124]">Data Product / Program</h1>
            <p className="text-sm text-[#5f6368]">Kelola program dan produk affiliate</p>
          </div>
        </div>
        <Link to="/data-product/tambah"
          className="inline-flex items-center gap-2 bg-[#0E6187] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#084c63] focus:outline-none focus:border-[#188038]">
          <Plus size={16} /> Tambah Produk
        </Link>
      </div>

      {/* Link Pendaftaran */}
      {activeProducts.length > 0 && (
        <div className="mb-4 border border-[#dadce0] bg-white p-4 ">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
              <LinkIcon size={14} />
            </div>
            <h2 className="text-sm font-bold text-[#3c4043]">Link Pendaftaran (Non-Affiliate)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {activeProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-2 border border-[#e8eaed] bg-[#f8f9fa] px-3 py-2.5 hover:border-[#1a73e8]/20 hover:bg-[#f5f6fa] transition-all group">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex h-7 w-7 items-center justify-center bg-white flex-none overflow-hidden">
                    {p.gambar ? (
                      <img src={`${APP_URL}/storage/${p.gambar}`} alt={p.nama} className="h-full w-full object-cover" />
                    ) : (
                      <GraduationCap size={14} className="text-[#1a73e8]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#3c4043] truncate">{p.nama}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {p.batch && <span className="text-[9px] font-bold text-[#1a73e8] bg-[#d2e3fc] px-1.5 py-0.5">{p.batch.nama_batch}</span>}
                      <p className="text-[10px] text-[#80868b] font-medium">Rp {Number(p.harga).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => copyLink(p)}
                  className="flex-none border border-[#dadce0] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#5f6368] transition hover:border-[#1a73e8]/30 hover:bg-[#0a4d6b] hover:text-white group/btn">
                  {copiedId === p.id ? (
                    <span className="text-[#137333] group-hover/btn:text-white flex items-center gap-1"><Check size={11} /> Tersalin</span>
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
      <div className="mb-4 p-4 ">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#80868b]" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full border border-[#dadce0] bg-white py-2 pl-9 pr-3 text-sm text-[#3c4043] outline-none transition placeholder:text-[#80868b] focus:border-[#1a73e8] focus:border-[#1a73e8]" />
          </div>
          <button onClick={() => setSearch('')}
            className="inline-flex items-center justify-center gap-2 border border-[#dadce0] bg-white px-3 py-2 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-[#dadce0] bg-white ">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-left text-sm text-[#3c4043]">
            <thead className="text-sm text-[#5f6368]">
              <tr>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3">Nama Produk</th>
                <th className="text-xs font-medium text-[#5f6368] hidden px-4 py-3 md:table-cell">Batch</th>
                <th className="text-xs font-medium text-[#5f6368] hidden px-4 py-3 lg:table-cell">Kategori / Harga</th>
                <th className="text-xs font-medium text-[#5f6368] hidden px-4 py-3 xl:table-cell">Deskripsi</th>
                <th className="text-xs font-medium text-[#5f6368] hidden px-4 py-3 lg:table-cell">Komisi Tier</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-right">Total</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Status</th>
                <th className="text-xs font-medium text-[#5f6368] hidden px-4 py-3 md:table-cell text-center">Affiliate</th>
                <th className="text-xs font-medium text-[#5f6368] px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#f1f3f4] text-[#80868b]"><Package size={24} /></div>
                    <p className="mt-3 text-sm font-medium text-[#5f6368]">Belum ada produk</p>
                  </td>
                </tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="bg-white transition hover:bg-[#f8f9fa]">
                  <td className="border-b border-[#e8eaed] px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.gambar ? (
                        <img src={`${APP_URL}/storage/${p.gambar}`} alt={p.nama} className="h-10 w-10 border border-[#dadce0] object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center bg-[#e8f0fe]"><Package size={16} className="text-[#1a73e8]" /></div>
                      )}
                      <span className="text-sm font-semibold text-[#202124]">{p.nama}</span>
                    </div>
                  </td>
                  <td className="border-b border-[#e8eaed] hidden px-4 py-3 md:table-cell">
                    {p.batch ? (
                      <span className="inline-flex items-center gap-1 border border-[#aecbfa] bg-[#e8f0fe] px-2 py-1 text-[11px] font-semibold text-[#1967d2]">
                        <Layers size={11} /> {p.batch.nama_batch}
                      </span>
                    ) : (
                      <span className="text-xs text-[#80868b]">-</span>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] hidden px-4 py-3 lg:table-cell">{renderKategoriDisplay(p)}</td>
                  <td className="border-b border-[#e8eaed] hidden px-4 py-3 text-sm text-[#5f6368] max-w-xs truncate xl:table-cell">{p.deskripsi || '-'}</td>
                  <td className="border-b border-[#e8eaed] hidden px-4 py-3 lg:table-cell">
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
                              <span className="font-semibold text-[#137333]">{name}</span>
                              <div className="ml-1 space-y-0.5">
                                {tiers.map((t, i) => (
                                  <div key={i} className="flex items-center gap-1 text-[#5f6368]">
                                    <span className="text-[10px]">{t.min_orang}-{t.max_orang || '∞'} org:</span>
                                    <span className="font-medium text-[#b06000]">Rp {Number(t.komisi).toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs text-[#80868b]">-</span>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-right text-sm font-semibold text-[#202124]">Rp {Number(p.harga).toLocaleString('id-ID')}</td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">{statusBadge(p.status)}</td>
                  <td className="border-b border-[#e8eaed] hidden px-4 py-3 text-center md:table-cell">
                    {p.is_affiliable !== false ? (
                      <span className="inline-flex items-center gap-1 bg-[#e6f4ea] px-2 py-0.5 text-[10px] font-medium text-[#137333]"><Check size={10} /> Bisa</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-[#f1f3f4] px-2 py-0.5 text-[10px] font-medium text-[#5f6368]"><X size={10} /> Tidak</span>
                    )}
                  </td>
                  <td className="border-b border-[#e8eaed] px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => navigate(`/data-product/edit/${p.id}`)} className="border border-[#dadce0] bg-white p-2 text-[#5f6368] transition hover:border-[#fdd663] hover:bg-[#fef7e0] hover:text-[#b06000]" title="Edit"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(p.id)} className="border border-[#dadce0] bg-white p-2 text-[#5f6368] transition hover:border-[#f6aea9] hover:bg-[#fce8e6] hover:text-[#c5221f]" title="Hapus"><Trash2 size={15} /></button>
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
