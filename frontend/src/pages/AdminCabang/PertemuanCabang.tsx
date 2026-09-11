import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { pertemuanApi } from '../../services/api'
import PertemuanCards, { PertemuanKelasItem } from '../../components/PertemuanCards'

export default function PertemuanCabang() {
  const [items, setItems] = useState<PertemuanKelasItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await pertemuanApi.adminCabangKelas()
        setItems(res.data.kelas || [])
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-[#0E6187]/10 flex items-center justify-center">
            <History size={18} className="text-[#0E6187]" />
          </span>
          Riwayat Pertemuan Kelas
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Pantau isian materi, foto bukti, latihan & ulangan di tiap pertemuan kelas cabang Anda.
        </p>
      </div>
      <PertemuanCards items={items} basePath="/admin-cabang/pertemuan" loading={loading} emptyText="Belum ada kelas." />
    </div>
  )
}