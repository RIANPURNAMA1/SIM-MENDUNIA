function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect, useMemo } from 'react'
import { Search, CheckCircle, XCircle, FileText, Eye, Trash2, CheckSquare, RotateCcw, Users, CreditCard, X, Loader, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { pendaftarApi } from '../../services/api'

interface PendaftarItem {
  id: number
  nama: string
  email: string
  telepon: string | null
  nominal: number | null
  diskon: number | null
  bukti_pembayaran: string | null
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  product: { nama: string } | null
  user: { id: number; name: string } | null
}

export default function Pendaftar() {
  const [data, setData] = useState<PendaftarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDaftar, setFilterDaftar] = useState('')
  const [filterBayar, setFilterBayar] = useState('')
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [riwayatModal, setRiwayatModal] = useState<{ id: number; nama: string } | null>(null)
  const [riwayatData, setRiwayatData] = useState<any[]>([])
  const [riwayatLoading, setRiwayatLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  function fetchData() {
    setLoading(true)
    pendaftarApi.list({}).then(res => {
      setData(res.data)
      setLoading(false)
    })
  }

  function handleApprove(id: number) {
    if (confirm('Setujui pendaftar ini?')) pendaftarApi.approve(id).then(fetchData)
  }

  function handleReject(id: number) {
    if (confirm('Tolak pendaftar ini?')) pendaftarApi.reject(id).then(fetchData)
  }

  function handleVerifyPayment(id: number) {
    pendaftarApi.verifyPayment(id).then(fetchData)
  }

  function handleDelete(id: number) {
    if (confirm('Yakin ingin menghapus pendaftar ini?')) pendaftarApi.destroy(id).then(fetchData)
  }

  function openRiwayat(id: number, nama: string) {
    setRiwayatModal({ id, nama })
    setRiwayatLoading(true)
    pendaftarApi.riwayatPembayaran(id).then(res => {
      setRiwayatData(res.data)
    }).catch(() => {}).finally(() => setRiwayatLoading(false))
  }

  function resetFilter() {
    setSearch('')
    setFilterDaftar('')
    setFilterBayar('')
  }

  const filtered = useMemo(() => {
    return data.filter(p => {
      const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
      const matchDaftar = !filterDaftar || p.status_pendaftaran === filterDaftar
      const matchBayar = !filterBayar || p.status_pembayaran === filterBayar
      return matchSearch && matchDaftar && matchBayar
    })
  }, [data, search, filterDaftar, filterBayar])

  const stats = useMemo(() => ({
    total: data.length,
    aktif: data.filter(p => p.status_pendaftaran === 'disetujui').length,
    pending: data.filter(p => p.status_pendaftaran === 'pending').length,
    ditolak: data.filter(p => p.status_pendaftaran === 'ditolak').length,
    verified: data.filter(p => p.status_pembayaran === 'verified').length,
  }), [data])

  const statusDaftarBadge = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      pending: { dot: 'bg-amber-500', label: 'Pending' },
      disetujui: { dot: 'bg-emerald-500', label: 'Disetujui' },
      ditolak: { dot: 'bg-red-500', label: 'Ditolak' },
    }
    const s = map[status] || { dot: 'bg-slate-300', label: status }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    )
  }

  const statusBayarBadge = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      unpaid: { dot: 'bg-slate-400', label: 'Belum Bayar' },
      processing: { dot: 'bg-blue-500', label: 'Proses' },
      verified: { dot: 'bg-emerald-500', label: 'Terverifikasi' },
    }
    const s = map[status] || { dot: 'bg-slate-300', label: status }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Pendaftaran</h1>
            <p className="text-sm text-slate-500">Kelola pendaftar dari link affiliate</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Pending', value: stats.pending },
          { label: 'Disetujui', value: stats.aktif },
          { label: 'Ditolak', value: stats.ditolak },
          { label: 'Pembayaran Verified', value: stats.verified },
        ].map(s => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="text-lg font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
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
          <select value={filterDaftar} onChange={e => setFilterDaftar(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status Daftar</option>
            <option value="pending">Pending</option>
            <option value="disetujui">Disetujui</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <select value={filterBayar} onChange={e => setFilterBayar(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
            <option value="">Semua Status Bayar</option>
            <option value="unpaid">Belum Bayar</option>
            <option value="processing">Proses</option>
            <option value="verified">Terverifikasi</option>
          </select>
          <button
            onClick={resetFilter}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
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
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Nama</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 font-medium">Program</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Nominal</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-right font-medium">Diskon</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status Daftar</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Status Bayar</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Bukti</th>
              <th scope="col" className="border border-slate-200 px-4 py-3 text-center font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200/70" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-40 rounded bg-slate-200/70" />
                        <div className="h-2.5 w-24 rounded bg-slate-100" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-200 px-6 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Users size={24} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">Tidak ada pendaftar</p>
                </td>
              </tr>
            ) : (
              filtered.map(p => (
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
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-medium text-slate-800">
                    {p.nominal ? `Rp ${Number(p.nominal).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-medium text-emerald-600">
                    {p.diskon ? `Rp ${Number(p.diskon).toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">{statusDaftarBadge(p.status_pendaftaran)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center">{statusBayarBadge(p.status_pembayaran)}</td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {p.bukti_pembayaran ? (
                      <button onClick={() => setPreviewImg(`http://localhost:8000/storage/${p.bukti_pembayaran}`)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
                        <Eye size={15} />
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      {p.status_pendaftaran === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(p.id)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600" title="Setujui">
                            <CheckCircle size={15} />
                          </button>
                          <button onClick={() => handleReject(p.id)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" title="Tolak">
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {p.status_pembayaran === 'processing' && (
                        <button onClick={() => handleVerifyPayment(p.id)}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Verifikasi Pembayaran">
                          <CheckSquare size={15} />
                        </button>
                      )}
                      <Link to={`/pendaftar/${p.id}/invoice`}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600" title="Invoice">
                        <Receipt size={15} />
                      </Link>
                      <button onClick={() => openRiwayat(p.id, p.nama)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" title="Riwayat Pembayaran">
                        <CreditCard size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id)}
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
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          Menampilkan {filtered.length} dari {data.length} pendaftar
        </div>
      </div>

      {/* Riwayat Pembayaran Modal */}
      {riwayatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRiwayatModal(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Riwayat Pembayaran — {riwayatModal.nama}</h2>
              <button onClick={() => setRiwayatModal(null)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {riwayatLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader size={20} className="animate-spin text-gray-400" />
                </div>
              ) : riwayatData.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">Belum ada riwayat pembayaran</div>
              ) : (
                riwayatData.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Pembayaran {riwayatData.length - i}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">Rp {fmt(Number(r.jumlah))}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'ditolak' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {r.status === 'verified' ? 'Lunas' : r.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                      </span>
                      {r.bukti_pembayaran ? (
                        <a
                          href={`http://localhost:8000/storage/${r.bukti_pembayaran}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        >
                          <Eye size={14} />
                        </a>
                      ) : (
                        <span className="rounded-lg border border-gray-200 p-1.5 text-gray-300">
                          <Eye size={14} />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-gray-100 px-5 py-3 text-center">
              <button onClick={() => setRiwayatModal(null)} className="text-sm text-gray-500 hover:text-gray-700">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Bukti */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewImg(null)}>
          <div className="max-w-lg rounded-xl bg-white p-2 shadow-xl" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Bukti Pembayaran" className="max-h-[70vh] max-w-full rounded-lg" />
            <div className="pb-1 pt-2 text-center">
              <button onClick={() => setPreviewImg(null)} className="text-sm text-slate-500 hover:text-slate-700">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
