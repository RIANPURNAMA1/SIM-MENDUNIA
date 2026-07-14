import { useState, useEffect } from 'react'
import { Tag, X } from 'lucide-react'
import { kategoriPengeluaranApi } from '../../services/api'

interface Kategori {
  id: number
  nama: string
  kode: string
  urutan: number
}

export default function AdminCabangKategoriPengeluaran() {
  const [data, setData] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    kategoriPengeluaranApi.list()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
            <Tag size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Kategori Pengeluaran</h1>
            <p className="text-sm text-slate-500">{data.length} kategori tersedia</p>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-left text-sm text-slate-700">
          <thead className="text-sm text-slate-600">
            <tr>
              <th className="border border-slate-200 px-4 py-3 font-medium">No</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Kode</th>
              <th className="border border-slate-200 px-4 py-3 font-medium">Nama Kategori</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={3} className="border border-slate-200 px-4 py-3">
                    <div className="h-3 bg-slate-200/70 rounded w-full animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={3} className="border border-slate-200 px-6 py-10 text-center">
                  <p className="text-sm font-medium text-slate-600">Belum ada kategori</p>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr key={item.id} className="bg-white transition hover:bg-slate-50">
                  <td className="border border-slate-200 px-4 py-3 text-sm">{idx + 1}</td>
                  <td className="border border-slate-200 px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-lg">
                      {item.kode}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-sm font-medium">{item.nama}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
