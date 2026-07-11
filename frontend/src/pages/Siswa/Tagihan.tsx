function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Search, Receipt, CheckCircle, Clock, AlertCircle, Loader, RotateCcw, DollarSign, X } from 'lucide-react'
import api, { pendaftarApi } from '../../services/api'

interface TagihanItem {
  id: number
  nama: string
  email: string
  nominal: number | null
  diskon: number | null
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  product: { nama: string; harga: number } | null
}

export default function Tagihan() {
  const [data, setData] = useState<TagihanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalBayar, setModalBayar] = useState<TagihanItem | null>(null)
  const [jumlahBayar, setJumlahBayar] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    pendaftarApi.list({}).then(res => {
      setData(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return data.filter(p => {
      const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !filterStatus || p.status_pembayaran === filterStatus
      return matchSearch && matchStatus
    })
  }, [data, search, filterStatus])

  const stats = useMemo(() => {
    const total = data.reduce((sum, p) => sum + Number(p.product?.harga || 0) - Number(p.diskon || 0), 0)
    const paid = data.reduce((sum, p) => sum + Number(p.nominal || 0), 0)
    return {
      total: total,
      paid: paid,
      outstanding: total - paid,
      count: data.length,
    }
  }, [data])

  const statusBadge = (status: string, dibayar: number, tagihan: number) => {
    const isLunas = dibayar >= tagihan && tagihan > 0
    const map: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
      unpaid: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Belum Bayar', icon: AlertCircle },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Proses', icon: Clock },
      partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Belum Lunas', icon: Clock },
      verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Lunas', icon: CheckCircle },
    }
    const key = status === 'verified' && !isLunas ? 'partial' : status
    const s = map[key] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: Clock }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
        <Icon size={12} />
        {s.label}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Receipt size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Tagihan</h1>
            <p className="text-sm text-slate-500">Kelola tagihan pendaftaran</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Tagihan</p>
          <p className="text-lg font-bold text-slate-800">Rp {fmt(stats.total)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Terkumpul</p>
          <p className="text-lg font-bold text-emerald-700">Rp {fmt(stats.paid)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-red-600">Outstanding</p>
          <p className="text-lg font-bold text-red-600">Rp {fmt(stats.outstanding)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Pendaftar</p>
          <p className="text-lg font-bold text-slate-800">{stats.count}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="processing">Proses</option>
            <option value="partial">Belum Lunas</option>
            <option value="verified">Lunas</option>
          </select>
          <button
            onClick={() => { setSearch(''); setFilterStatus('') }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-sm text-slate-600">
            <tr>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Pendaftar</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Program</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Tagihan</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Dibayar</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Sisa</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Invoice</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="border border-slate-200 px-4 py-3">
                    <div className="h-4 w-full rounded bg-slate-200/70" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Receipt size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada tagihan</p>
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const harga = Number(p.product?.harga || 0)
                const diskon = Number(p.diskon || 0)
                const tagihan = harga - diskon
                const dibayar = Number(p.nominal || 0)
                const sisa = Math.max(0, tagihan - dibayar)
                return (
                  <tr key={p.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=e5e7eb&color=6b7280&size=28`}
                          className="h-8 w-8 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{p.nama}</div>
                          <div className="text-xs text-slate-500">{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-600">{p.product?.nama || '-'}</td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-800">
                      Rp {fmt(tagihan)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                      Rp {fmt(dibayar)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-red-600">
                      {sisa > 0 ? `Rp ${fmt(sisa)}` : '-'}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {statusBadge(p.status_pembayaran, dibayar, tagihan)}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <Link
                        to={`/pendaftar/${p.id}/invoice`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <FileText size={13} />
                        Invoice
                      </Link>
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      <button
                        onClick={() => { setModalBayar(p); setJumlahBayar('') }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <DollarSign size={13} />
                        Bayar Manual
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          Menampilkan {filtered.length} dari {data.length} tagihan
        </div>
      </div>
      {/* Modal Bayar Manual */}
      {modalBayar && (() => {
        const tagihan = (modalBayar.product?.harga || 0) - (modalBayar.diskon || 0)
        const dibayar = modalBayar.nominal || 0
        const sisa = Math.max(0, tagihan - dibayar)
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Input Pembayaran Manual</h2>
                  <p className="text-[11px] text-slate-400">Catat pembayaran langsung dari admin</p>
                </div>
              </div>
              <button onClick={() => setModalBayar(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Data Kandidat */}
            <div className="px-6 pt-4 pb-3">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(modalBayar.nama)}&background=e5e7eb&color=6b7280&size=32`}
                  className="h-8 w-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{modalBayar.nama}</p>
                  <p className="text-xs text-slate-500">{modalBayar.email}</p>
                </div>
              </div>
            </div>

            {/* Table Ringkasan */}
            <div className="px-6 pb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="pb-2 text-left font-semibold">Deskripsi</th>
                    <th className="pb-2 text-right font-semibold">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-600">Tagihan</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">Rp {fmt(tagihan)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-600">Dibayar</td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">Rp {fmt(dibayar)}</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-2.5 text-slate-600">Sisa</td>
                    <td className="py-2.5 text-right font-bold text-red-600">Rp {fmt(sisa)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Form Input */}
            <div className="border-t border-slate-100 px-6 py-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Jumlah Pembayaran</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">Rp</span>
                <input
                  type="number"
                  value={jumlahBayar}
                  onChange={e => setJumlahBayar(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {Number(jumlahBayar) > sisa && (
                <p className="mt-1 text-xs text-amber-600">Melebihi sisa tagihan</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-[11px] text-slate-400">Pembayaran akan langsung tercatat</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setModalBayar(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  disabled={!jumlahBayar || Number(jumlahBayar) <= 0 || saving}
                  onClick={async () => {
                    if (!modalBayar || !jumlahBayar || Number(jumlahBayar) <= 0) return
                    setSaving(true)
                    try {
                      await api.post(`/pendaftar/${modalBayar.id}/bayar-manual`, { jumlah: Number(jumlahBayar) })
                      const res = await pendaftarApi.list({})
                      setData(res.data)
                      setModalBayar(null)
                    } catch (err) {
                      console.error(err)
                    } finally {
                      setSaving(false)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>Menyimpan...</>
                  ) : (
                    <>Simpan Pembayaran</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
