import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, MapPin, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface PertemuanKelasItem {
  id: number
  nama_kelas: string
  sensei?: string | null
  batch?: string | null
  cabang?: string | null
  level: number | string
  tanggal_mulai: string
  tanggal_selesai: string
  total_pertemuan: number
  terisi: number
  persen_terisi: number
  sisa_pertemuan?: number
  status?: 'aktif' | 'selesai' | 'dibatalkan' | null
}

const STATUS_STYLE: Record<string, { label: string; chip: string }> = {
  aktif: { label: 'Aktif', chip: 'bg-emerald-50 text-emerald-600' },
  selesai: { label: 'Selesai', chip: 'bg-slate-100 text-slate-500' },
  dibatalkan: { label: 'Dibatalkan', chip: 'bg-rose-50 text-rose-600' },
}

interface Props {
  items: PertemuanKelasItem[]
  basePath: string
  loading?: boolean
  emptyText?: string
}

export default function PertemuanCards({ items, basePath, loading, emptyText }: Props) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="h-4 w-2/3 bg-slate-100 rounded mb-3" />
            <div className="h-3 w-1/2 bg-slate-100 rounded mb-2" />
            <div className="h-2 bg-slate-100 rounded-full mb-4" />
            <div className="h-9 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <Users size={36} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-400">{emptyText || 'Belum ada kelas.'}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(k => {
        const status = STATUS_STYLE[k.status ?? 'aktif'] ?? STATUS_STYLE.aktif
        const judul = k.batch || k.nama_kelas || `Kelas ${k.id}`
        const lengkap = k.total_pertemuan > 0 && k.terisi >= k.total_pertemuan
        const sisa = k.sisa_pertemuan ?? Math.max(0, k.total_pertemuan - k.terisi)
        return (
        <button key={k.id} onClick={() => navigate(`${basePath}/${k.id}`)}
          className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-[#0E6187]/40 hover:shadow-lg hover:shadow-slate-200/60 transition-all group">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#0E6187]/10 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-[#0E6187]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate" title={judul}>{judul}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {k.level ? `Level ${k.level}` : 'Tanpa level'}{k.sensei ? ` · ${k.sensei}` : ''}
                </p>
              </div>
            </div>
            <span className={`shrink-0 mt-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${status.chip}`}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
            <CalendarDays size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{k.tanggal_mulai} – {k.tanggal_selesai}</span>
          </div>
          <p className="flex items-center gap-2 text-[10px] text-slate-500 mb-4">
            <MapPin size={11} className="text-slate-400 shrink-0" /> <span className="truncate">{k.cabang || 'Tanpa cabang'}</span>
          </p>

          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Riwayat pertemuan</span>
            <span className="text-[11px] font-black tabular-nums shrink-0">
              <span className={lengkap ? 'text-emerald-500' : 'text-[#0E6187]'}>{k.terisi}</span>
              <span className="text-slate-300">/{k.total_pertemuan}</span>
              {!lengkap && sisa > 0 && (
                <span className="ml-1.5 text-[10px] font-bold text-amber-500">sisa {sisa}</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-all duration-500 ${
              lengkap ? 'bg-emerald-400' : 'bg-[#0E6187]'
            }`} style={{ width: `${k.persen_terisi}%` }} />
          </div>

          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors ${
            lengkap
              ? 'bg-slate-100 text-slate-600 group-hover:bg-emerald-500 group-hover:text-white'
              : 'bg-[#0E6187]/10 text-[#0E6187] group-hover:bg-[#0E6187] group-hover:text-white'
          }`}>
            {lengkap ? <CheckCircle2 size={12} /> : null}
            {lengkap ? 'Lihat Riwayat' : 'Isi / Lihat Riwayat'}
            <ArrowRight size={11} className="opacity-60" />
          </span>
        </button>
        )
      })}
    </div>
  )
}