import { useEffect, useState } from 'react'
import { Handshake, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../../services/api'

interface Item {
  id: number
  affiliate_link_id: number
  nama: string
  pasukan: string
  email: string
  no_registrasi: string
  status: string
  status_kandidat: string | null
  komisi_status: string
  komisi_jumlah: number
}

interface Batch {
  batch_id: number
  batch_nama: string
  total: number
  total_komisi: number
  total_komisi_paid: number
  items: Item[]
}

interface Cabang {
  cabang_id: number
  cabang_nama: string
  total: number
  batches: Batch[]
}

export default function ClosingPasukan() {
  const [data, setData] = useState<Cabang[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/closing-pasukan')
      .then(res => setData(Array.isArray(res.data) ? res.data : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <Handshake size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Closing Pasukan</h1>
            <p className="text-sm text-slate-500">Rekap penutupan pasukan per cabang</p>
          </div>
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
            <Handshake size={24} />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-600">Belum ada data closing</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map(cabang => (
            <CabangCard key={cabang.cabang_id} cabang={cabang} />
          ))}
        </div>
      )}
    </div>
  )
}

function CabangCard({ cabang }: { cabang: Cabang }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E6187] text-white text-xs font-bold">
            {cabang.cabang_nama.charAt(0)}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800">{cabang.cabang_nama}</h3>
            <p className="text-xs text-slate-500">Total: {cabang.total}</p>
          </div>
        </div>
        {open ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          {cabang.batches.map(batch => (
            <div key={batch.batch_id} className="p-4">
              <h4 className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <span>Batch {batch.batch_nama} &middot; {batch.total} kandidat</span>
                {batch.total_komisi > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold normal-case tracking-normal text-emerald-700">
                    Komisi: Rp {batch.total_komisi.toLocaleString('id-ID')}
                  </span>
                )}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse text-left text-sm text-slate-700">
                  <thead>
                    <tr className="text-xs text-slate-500">
                      <th className="border border-slate-200 px-3 py-2 font-medium w-10">No</th>
                      <th className="border border-slate-200 px-3 py-2 font-medium">Nama Kandidat</th>
                      <th className="border border-slate-200 px-3 py-2 font-medium hidden sm:table-cell">Email</th>
                      <th className="border border-slate-200 px-3 py-2 font-medium">Pasukan</th>
                      <th className="border border-slate-200 px-3 py-2 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batch.items.map((item, idx) => (
                      <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                        <td className="border border-slate-200 px-3 py-2 text-center text-xs text-slate-400">{idx + 1}</td>
                        <td className="border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800">
                          {item.nama}
                          <span className="block text-[10px] text-slate-400">{item.no_registrasi}</span>
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600 hidden sm:table-cell">{item.email}</td>
                        <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">{item.pasukan}</td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {item.status_kandidat === 'Mengundurkan Diri' ? (
                            <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-semibold text-red-700">
                              Mengundurkan Diri
                            </span>
                          ) : (
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              item.status === 'disetujui' ? 'bg-emerald-50 text-emerald-700' :
                              item.status === 'ditolak' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {item.status === 'disetujui' ? 'Disetujui' :
                               item.status === 'ditolak' ? 'Ditolak' : 'Pending'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
