import { useEffect, useState } from 'react'
import { Wallet, ChevronDown, ChevronRight, CheckCircle, Clock, Banknote, Layers } from 'lucide-react'
import api from '../../services/api'

interface KomisiItem {
  id: number
  jumlah: number
  status: string
  created_at: string
  pendaftar: { nama: string; product: string } | null
  kategori: string | null
}

interface AffiliateGroup {
  affiliate_id: number
  affiliate_nama: string
  affiliate_email: string
  bank: string
  nama_rekening: string
  no_rekening: string
  total_komisi: number
  total_pending: number
  total_paid: number
  total_cair: number
  items: KomisiItem[]
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

function statusBadge(status: string) {
  if (status === 'paid') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
      <CheckCircle size={10} />
      Paid
    </span>
  )
  if (status === 'cair') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
      <Banknote size={10} />
      Cair
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      <Clock size={10} />
      Pending
    </span>
  )
}

export default function DataPencairanKomisi() {
  const [data, setData] = useState<BatchGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/komisi-affiliate')
      .then(res => setData(Array.isArray(res.data) ? res.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const totalKomisi = data.reduce((s, b) => s + b.total_komisi, 0)
  const totalPending = data.reduce((s, b) => s + b.total_pending, 0)
  const totalPaid = data.reduce((s, b) => s + b.total_paid, 0)
  const totalCair = data.reduce((s, b) => s + b.total_cair, 0)
  const totalAffiliates = data.reduce((s, b) => s + b.affiliates.length, 0)

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Data Pencairan Komisi</h1>
            <p className="text-sm text-slate-500">{data.length} batch</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Komisi</p>
          <p className="text-lg font-bold text-slate-800">Rp {fmt(totalKomisi)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-amber-600">Pending</p>
          <p className="text-lg font-bold text-amber-700">Rp {fmt(totalPending)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-blue-600">Cair</p>
          <p className="text-lg font-bold text-blue-700">Rp {fmt(totalCair)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Paid</p>
          <p className="text-lg font-bold text-emerald-700">Rp {fmt(totalPaid)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Affiliate</p>
          <p className="text-lg font-bold text-slate-800">{totalAffiliates}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
            <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Wallet size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data komisi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map(batch => (
            <BatchSection key={batch.batch_id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  )
}

function BatchSection({ batch }: { batch: BatchGroup }) {
  const [openBatch, setOpenBatch] = useState(true)
  const totalAffiliates = batch.affiliates.length

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpenBatch(!openBatch)}
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E6187] text-white text-xs font-bold">
            <Layers size={16} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800">Batch {batch.batch_nama}</h3>
            <p className="text-xs text-slate-500">{totalAffiliates} affiliate &middot; Rp {fmt(batch.total_komisi)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {batch.total_pending > 0 && <span className="text-amber-600 font-medium">Pending: Rp {fmt(batch.total_pending)}</span>}
          {batch.total_cair > 0 && <span className="text-blue-600 font-medium">Cair: Rp {fmt(batch.total_cair)}</span>}
          {batch.total_paid > 0 && <span className="text-emerald-600 font-medium">Paid: Rp {fmt(batch.total_paid)}</span>}
          {openBatch ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </button>

      {openBatch && (
        <div className="divide-y divide-slate-100">
          {batch.affiliates.map(group => (
            <AffiliateCard key={group.affiliate_id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}

function AffiliateCard({ group }: { group: AffiliateGroup }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0E6187] text-xs font-bold text-white">
            {group.affiliate_nama.charAt(0)}
          </div>
          <div className="min-w-0 text-left">
            <h3 className="text-sm font-bold text-slate-800 truncate">{group.affiliate_nama}</h3>
            <p className="text-xs text-slate-500 truncate">{group.affiliate_email}</p>
          </div>
          <div className="ml-auto flex items-center gap-4 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-sm font-bold text-slate-800">Rp {fmt(group.total_komisi)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-sm font-bold text-amber-600">{group.total_pending > 0 ? `Rp ${fmt(group.total_pending)}` : '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Cair</p>
              <p className="text-sm font-bold text-blue-600">{group.total_cair > 0 ? `Rp ${fmt(group.total_cair)}` : '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Paid</p>
              <p className="text-sm font-bold text-emerald-600">{group.total_paid > 0 ? `Rp ${fmt(group.total_paid)}` : '-'}</p>
            </div>
            {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500">
            <span><strong>Bank:</strong> {group.bank}</span>
            <span><strong>Nama Rekening:</strong> {group.nama_rekening}</span>
            <span><strong>No. Rekening:</strong> {group.no_rekening}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse text-left text-sm text-slate-700">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="border border-slate-200 px-3 py-2 font-medium">Kandidat</th>
                  <th className="border border-slate-200 px-3 py-2 font-medium">Program</th>
                  <th className="border border-slate-200 px-3 py-2 text-right font-medium">Jumlah</th>
                  <th className="border border-slate-200 px-3 py-2 text-center font-medium">Status</th>
                  <th className="border border-slate-200 px-3 py-2 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map(item => (
                  <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800">
                      {item.pendaftar?.nama || '-'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {item.pendaftar?.product || '-'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-right text-sm font-bold text-slate-800">
                      Rp {fmt(item.jumlah)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-center">
                      {statusBadge(item.status)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
