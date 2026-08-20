import { useEffect, useState, useCallback } from 'react'
import { Wallet, ChevronDown, ChevronRight, Search, RotateCcw, CheckSquare, Square, Loader2 } from 'lucide-react'
import api from '../../services/api'
import Swal from 'sweetalert2'

interface KomisiItem {
  id: number
  jumlah: number
  status: string
  created_at: string
  pendaftar: { nama: string; email: string; telepon: string; product: string } | null
  kategori: string | null
}

interface PendaftarDetail {
  id: number
  nama: string
  email: string
  telepon: string | null
  product: string | null
  kategori: string | null
  komisi_status: string | null
  komisi_jumlah: number
  status_pendaftaran: string
  created_at: string
}

interface AffiliateGroup {
  affiliate_id: number
  affiliate_nama: string
  affiliate_email: string
  no_hp: string
  bank: string
  nama_rekening: string
  no_rekening: string
  total_komisi: number
  total_pending: number
  total_paid: number
  total_cair: number
  items: KomisiItem[]
  pendaftar: PendaftarDetail[]
  batch_id?: number
}

interface BatchGroup {
  batch_id: number
  batch_nama: string
  total_komisi: number
  total_pending: number
  total_paid: number
  total_cair: number
  affiliates: AffiliateGroup[]
}

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export default function DataPencairanKomisi() {
  const [data, setData] = useState<BatchGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedAffiliate, setExpandedAffiliate] = useState<number | null>(null)
  const [loadingBayar, setLoadingBayar] = useState<number | null>(null)

  useEffect(() => {
    api.get('/komisi-affiliate')
      .then(res => setData(Array.isArray(res.data) ? res.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const allRows = data.flatMap(batch =>
    batch.affiliates.map(aff => ({ ...aff, batch_id: batch.batch_id, batch_nama: batch.batch_nama }))
  )

  const filtered = allRows.filter(aff =>
    !search || aff.affiliate_nama.toLowerCase().includes(search.toLowerCase()) ||
    aff.affiliate_email.toLowerCase().includes(search.toLowerCase()) ||
    aff.no_rekening.includes(search) || aff.no_hp.includes(search)
  )

  const totalKomisi = allRows.reduce((s, a) => s + a.total_komisi, 0)

  const allPaidIds = allRows.filter(a => a.items.every(i => i.status === 'paid')).map(a => a.affiliate_id)
  const somePaidIds = allRows.filter(a => a.items.some(i => i.status === 'paid') && !a.items.every(i => i.status === 'paid')).map(a => a.affiliate_id)

  const handleBayar = useCallback(async (affiliateId: number, nama: string) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Pembayaran',
      html: `Tandai komisi <strong>${nama}</strong> sudah dibayar?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Sudah Dibayar',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0E6187',
      reverseButtons: true,
    })
    if (!result.isConfirmed) return

    setLoadingBayar(affiliateId)
    try {
      await api.post(`/komisi-affiliate/${affiliateId}/bayar`)
      const res = await api.get('/komisi-affiliate')
      setData(Array.isArray(res.data) ? res.data : [])
      Swal.fire({
        title: 'Berhasil',
        text: 'Komisi berhasil ditandai sudah dibayar',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch {
      Swal.fire('Gagal', 'Gagal membayarkan komisi', 'error')
    } finally {
      setLoadingBayar(null)
    }
  }, [])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Pencairan Komisi</h1>
            <p className="text-sm text-slate-500">{filtered.length} affiliate</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Komisi</p>
          <p className="text-lg font-bold text-slate-800">Rp {fmt(totalKomisi)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Affiliate</p>
          <p className="text-lg font-bold text-slate-800">{filtered.length}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama affiliate, email, no rekening, atau no hp..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button onClick={() => setSearch('')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Wallet size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data komisi</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="border border-slate-200 px-4 py-3 font-medium w-10">No</th>
                <th className="border border-slate-200 px-4 py-3 font-medium w-10">Bayar</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Nama Affiliate</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">No. Rekening</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">No. HP</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Batch</th>
                <th className="border border-slate-200 px-4 py-3 text-right font-medium">Total Komisi</th>
                <th className="border border-slate-200 px-4 py-3 font-medium">Status</th>
                <th className="border border-slate-200 px-4 py-3 text-center font-medium w-10">Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((aff, idx) => {
                const affKey = `${aff.batch_id}-${aff.affiliate_id}`
                const open = expandedAffiliate === affKey
                return (
                  <>
                    <tr key={affKey} className="bg-white transition hover:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-3 text-xs text-slate-500">{idx + 1}</td>
                      <td className="border border-slate-200 px-3 py-3 text-center">
                        {loadingBayar === aff.affiliate_id ? (
                          <Loader2 size={16} className="animate-spin text-slate-400 mx-auto" />
                        ) : (
                          <button
                            onClick={() => handleBayar(aff.affiliate_id, aff.affiliate_nama)}
                            disabled={allPaidIds.includes(aff.affiliate_id)}
                            className="inline-flex items-center justify-center transition disabled:opacity-50"
                            title={allPaidIds.includes(aff.affiliate_id) ? 'Sudah dibayar' : 'Klik untuk tandai sudah dibayar'}
                          >
                            {allPaidIds.includes(aff.affiliate_id) ? (
                              <CheckSquare size={20} className="text-emerald-600 drop-shadow-sm" strokeWidth={2.5} />
                            ) : somePaidIds.includes(aff.affiliate_id) ? (
                              <CheckSquare size={20} className="text-amber-500 drop-shadow-sm" strokeWidth={2.5} />
                            ) : (
                              <Square size={20} className="text-slate-400 hover:text-emerald-500 transition-colors" strokeWidth={2} />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="border border-slate-200 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E6187] text-xs font-bold text-white">
                            {aff.affiliate_nama.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{aff.affiliate_nama}</p>
                            <p className="text-xs text-slate-500">{aff.affiliate_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600">{aff.no_rekening || '-'}</td>
                      <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600">{aff.no_hp || '-'}</td>
                      <td className="border border-slate-200 px-4 py-3 text-xs text-slate-600">{aff.batch_nama}</td>
                      <td className="border border-slate-200 px-4 py-3 text-right text-sm font-bold text-slate-800">Rp {fmt(aff.total_komisi)}</td>
                      <td className="border border-slate-200 px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {aff.total_pending > 0 && <span className="text-[10px] text-amber-600 font-medium">{fmt(aff.total_pending)} Pending</span>}
                          {aff.total_cair > 0 && <span className="text-[10px] text-blue-600 font-medium">{fmt(aff.total_cair)} Cair</span>}
                          {aff.total_paid > 0 && <span className="text-[10px] text-emerald-600 font-medium">{fmt(aff.total_paid)} Paid</span>}
                        </div>
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        <button onClick={() => setExpandedAffiliate(open ? null : affKey)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                    </tr>
                    {open && (
                      <tr key={`detail-${affKey}`}>
                        <td colSpan={9} className="border border-slate-200 bg-slate-50/50 p-0">
                          <div className="p-4">
                            <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span><strong>Bank:</strong> {aff.bank || '-'}</span>
                              <span><strong>Nama Rekening:</strong> {aff.nama_rekening || '-'}</span>
                              <span><strong>No. Rekening:</strong> {aff.no_rekening || '-'}</span>
                              <span><strong>No. HP:</strong> {aff.no_hp || '-'}</span>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                              <table className="w-full min-w-[500px] border-collapse text-left text-sm text-slate-700">
                                <thead>
                                  <tr className="bg-white text-xs text-slate-500">
                                    <th className="border border-slate-200 px-3 py-2 font-medium">Kandidat</th>
                                    <th className="border border-slate-200 px-3 py-2 font-medium">Email</th>
                                    <th className="border border-slate-200 px-3 py-2 font-medium">No. HP</th>
                                    <th className="border border-slate-200 px-3 py-2 font-medium">Program</th>
                                    <th className="border border-slate-200 px-3 py-2 font-medium">Tanggal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {aff.pendaftar && aff.pendaftar.length > 0 ? aff.pendaftar.map(item => (
                                    <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                                      <td className="border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800">
                                        {item.nama || '-'}
                                      </td>
                                      <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                        {item.email || '-'}
                                      </td>
                                      <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                        {item.telepon || '-'}
                                      </td>
                                      <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600">
                                        {item.product || '-'}
                                      </td>
                                      <td className="border border-slate-200 px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </td>
                                    </tr>
                                  )) : (
                                    <tr>
                                      <td colSpan={5} className="border border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                                        Belum ada kandidat
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}