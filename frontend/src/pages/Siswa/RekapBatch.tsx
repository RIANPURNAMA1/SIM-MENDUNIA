function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

import { useState, useEffect } from 'react'
import {
  Layers, ChevronDown, ChevronUp, Receipt, CheckCircle, Clock, AlertCircle, Loader,
  X
} from 'lucide-react'
import api from '../../services/api'

interface KategoriInfo {
  id: number
  kode: string
  nama: string
}

interface DetailItem {
  kategori_id: number
  kode: string
  nama: string
  biaya: number
  dibayar: number
  sisa: number
}

interface RekapItem {
  id: number
  nama: string
  email: string
  program: string
  total_biaya: number
  total_dibayar: number
  total_sisa: number
  status_pembayaran: string
  status_pendaftaran: string
  detail: DetailItem[]
}

interface BatchRekap {
  batch_id: number
  batch: string
  kuota: number | null
  siswas_count: number
  total_biaya: number
  total_dibayar: number
  total_sisa: number
  items: RekapItem[]
}

export default function RekapBatch() {
  const [data, setData] = useState<BatchRekap[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [kategoris, setKategoris] = useState<KategoriInfo[]>([])
  const [grand, setGrand] = useState({ total_biaya: 0, total_dibayar: 0, total_sisa: 0 })

  useEffect(() => {
    api.get('/rekap-per-batch').then(res => {
      const d: BatchRekap[] = res.data.data || []
      setData(d)
      setKategoris(res.data.kategoris || [])
      setGrand({
        total_biaya: res.data.grand_total_biaya || 0,
        total_dibayar: res.data.grand_total_dibayar || 0,
        total_sisa: res.data.grand_total_sisa || 0,
      })
      const init: Record<number, boolean> = {}
      d.forEach(b => { init[b.batch_id] = true })
      setExpanded(init)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const toggleBatch = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
      unpaid: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Belum Bayar', icon: AlertCircle },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Proses', icon: Clock },
      partial: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Belum Lunas', icon: Clock },
      verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Lunas', icon: CheckCircle },
    }
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status, icon: Clock }
    const Icon = s.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
        <Icon size={11} />{s.label}
      </span>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Rekap Per Batch</h1>
            <p className="text-sm text-slate-500">Rincian pembayaran kandidat per kategori biaya</p>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Biaya</p>
          <p className="text-lg font-bold text-slate-800">Rp {fmt(grand.total_biaya)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-emerald-600">Terkumpul</p>
          <p className="text-lg font-bold text-emerald-700">Rp {fmt(grand.total_dibayar)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-red-600">Outstanding</p>
          <p className="text-lg font-bold text-red-600">Rp {fmt(grand.total_sisa)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader size={24} className="animate-spin text-slate-400" /></div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Receipt size={24} /></div>
          <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data per batch</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(batch => (
            <div key={batch.batch_id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => toggleBatch(batch.batch_id)}
                className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1F3C]/10"><Layers size={15} className="text-[#0D1F3C]" /></div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{batch.batch}</p>
                    <p className="text-[11px] text-slate-500">{batch.siswas_count} kandidat</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-slate-500">Biaya <span className="font-semibold text-slate-700">Rp {fmt(batch.total_biaya)}</span></p>
                    <p className="text-xs text-slate-500">Dibayar <span className="font-semibold text-emerald-700">Rp {fmt(batch.total_dibayar)}</span></p>
                  </div>
                  {expanded[batch.batch_id] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              {expanded[batch.batch_id] && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-[11px] text-slate-700">
                    <thead className="bg-slate-50 text-[10px] text-slate-600 uppercase tracking-wide">
                      <tr>
                        <th className="border border-slate-200 px-2 py-2 text-center w-8">No</th>
                        <th className="border border-slate-200 px-2 py-2 min-w-[140px]">Nama Kandidat</th>
                        {kategoris.map(k => (
                          <th key={k.id} className="border border-slate-200 px-2 py-2 text-right min-w-[70px]">{k.kode}</th>
                        ))}
                        <th className="border border-slate-200 px-2 py-2 text-right min-w-[80px]">Total Bayar</th>
                        <th className="border border-slate-200 px-2 py-2 text-right min-w-[80px]">Total Biaya</th>
                        <th className="border border-slate-200 px-2 py-2 text-right min-w-[80px]">Sisa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batch.items.map((item, idx) => (
                        <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                          <td className="border border-slate-200 px-2 py-2 text-center text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-200 px-2 py-2">
                            <p className="font-semibold text-slate-800 truncate">{item.nama}</p>
                            <p className="text-[9px] text-slate-400 truncate">{item.email}</p>
                          </td>
                          {kategoris.map(k => {
                            const d = item.detail.find(d => d.kategori_id === k.id)
                            return (
                              <td key={k.id} className={`border border-slate-200 px-2 py-2 text-right ${d && d.dibayar > 0 ? 'font-semibold text-emerald-700' : 'text-slate-400'}`}>
                                {d && d.dibayar > 0 ? fmt(d.dibayar) : '-'}
                              </td>
                            )
                          })}
                          <td className="border border-slate-200 px-2 py-2 text-right font-semibold text-slate-800">{fmt(item.total_dibayar)}</td>
                          <td className="border border-slate-200 px-2 py-2 text-right font-semibold text-slate-700">{fmt(item.total_biaya)}</td>
                          <td className={`border border-slate-200 px-2 py-2 text-right font-semibold ${item.total_sisa > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {item.total_sisa > 0 ? fmt(item.total_sisa) : '0'}
                          </td>
                        </tr>
                      ))}
                      {/* Subtotal row */}
                      <tr className="bg-slate-50 font-semibold text-xs">
                        <td colSpan={2} className="border border-slate-200 px-2 py-2 text-slate-600">Subtotal {batch.batch}</td>
                        {kategoris.map(k => {
                          const totalKat = batch.items.reduce((sum, item) => {
                            const d = item.detail.find(d => d.kategori_id === k.id)
                            return sum + (d?.dibayar || 0)
                          }, 0)
                          return (
                            <td key={k.id} className={`border border-slate-200 px-2 py-2 text-right ${totalKat > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {totalKat > 0 ? fmt(totalKat) : '-'}
                            </td>
                          )
                        })}
                        <td className="border border-slate-200 px-2 py-2 text-right text-slate-800">{fmt(batch.total_dibayar)}</td>
                        <td className="border border-slate-200 px-2 py-2 text-right text-slate-700">{fmt(batch.total_biaya)}</td>
                        <td className={`border border-slate-200 px-2 py-2 text-right ${batch.total_sisa > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(batch.total_sisa)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
