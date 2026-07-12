import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, CheckCircle, Clock, XCircle, CreditCard, Package } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface PendaftarData {
  id: number
  nama: string
  email: string
  status_pendaftaran: string
  status_pembayaran: string
  batch_id: number | null
  created_at: string
  product: { id: number; nama: string; harga: number } | null
}

interface SiswaData {
  id: number
  user_id: number
  nama: string
  nik: string | null
  no_registrasi: string | null
  jenis_kelamin: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  agama: string | null
  alamat: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  pendidikan_terakhir: string | null
  tahun_lulus: string | null
  tinggi_badan: string | null
  berat_badan: string | null
  goldar: string | null
  ukuran_baju: string | null
  status_pernikahan: string | null
  no_hp: string | null
  no_hp_ortu: string | null
  nama_ortu: string | null
  foto: string | null
  status: string
  batch_id: number | null
  batch_relasi?: { id: number; nama_batch: string } | null
  keterangan: string | null
}

export default function SiswaDashboard() {
  const { user } = useAuth()
  const [pendaftar, setPendaftar] = useState<PendaftarData | null>(null)
  const [siswa, setSiswa] = useState<SiswaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [jadwalLevels, setJadwalLevels] = useState<Record<string, { tanggal_mulai: string; tanggal_selesai: string }>>({})

  useEffect(() => {
    api.get('/siswa-dashboard')
      .then(res => {
        setPendaftar(res.data.pendaftar)
        setSiswa(res.data.siswa)
        setJadwalLevels(res.data.jadwal_levels || {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    disetujui: 'bg-emerald-100 text-emerald-700',
    ditolak: 'bg-red-100 text-red-600',
  }

  const paymentColor: Record<string, string> = {
    unpaid: 'bg-slate-100 text-slate-600',
    processing: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
  }

  const statusIcon: Record<string, typeof Clock> = {
    pending: Clock,
    disetujui: CheckCircle,
    ditolak: XCircle,
  }

  const StatusIcon = pendaftar ? statusIcon[pendaftar.status_pendaftaran] || Clock : Clock

  const cardClass = "bg-white border border-gray-200 rounded-lg shadow-sm"

  const isDataLengkap = siswa?.nik && siswa?.alamat && siswa?.jenis_kelamin && siswa?.agama

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-3 py-4 sm:px-6 sm:py-5">
      {/* Alert Data Belum Lengkap */}
      {!isDataLengkap && pendaftar && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-amber-700 font-bold text-sm">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Data diri Anda belum lengkap</p>
            <p className="text-xs text-amber-700 mt-1">
              Silakan lengkapi data diri dan upload dokumen Anda.
            </p>
          </div>
          <Link to="/siswa-dashboard/data-diri"
            className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-semibold hover:bg-amber-700 transition-colors">
            Lengkapi Sekarang
          </Link>
        </div>
      )}

      {/* Header */}
      <div className={`mb-4 ${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eef1f6]">
              <User size={22} className="text-[#0D1F3C]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Halo, {user?.name}!</h1>
              <p className="text-sm text-gray-500">Status pendaftaran Anda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Tahapan */}
      {(siswa?.batch_id || pendaftar?.batch_id) && Object.keys(jadwalLevels).length > 0 && (
        <div className={`${cardClass} mb-4`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Timeline Tahapan</h2>
          </div>
          <div className="p-5">
            <TimelineStages jadwalLevels={jadwalLevels} />
          </div>
        </div>
      )}

      {pendaftar ? (<>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Status Pendaftaran */}
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Status Pendaftaran</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <StatusIcon size={20} className={
                  pendaftar.status_pendaftaran === 'disetujui' ? 'text-emerald-500' :
                  pendaftar.status_pendaftaran === 'ditolak' ? 'text-red-500' : 'text-amber-500'
                } />
                <div>
                  <p className="text-xs text-gray-500">Status Pendaftaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[pendaftar.status_pendaftaran]}`}>
                    {pendaftar.status_pendaftaran}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Status Pembayaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentColor[pendaftar.status_pembayaran]}`}>
                    {pendaftar.status_pembayaran}
                  </span>
                </div>
              </div>
              {pendaftar.product && (
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Program</p>
                    <p className="font-semibold text-gray-900">{pendaftar.product.nama}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Lengkapi Data */}
          <div className={`${cardClass} lg:col-span-2`}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Kelola Data</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/siswa-dashboard/data-diri"
                  className="rounded-lg border border-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C]/10 text-[#0D1F3C]">
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Data Diri & Dokumen</p>
                    <p className="text-xs text-gray-500">Lengkapi profil dan upload dokumen</p>
                  </div>
                </Link>
                <div className="rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Status Lengkapi</p>
                    <p className="text-xs text-gray-500">{isDataLengkap ? 'Data sudah lengkap' : 'Belum lengkap'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>) : (
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <User size={28} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500">Belum ada data pendaftaran</p>
        </div>
      )}
    </div>
  )
}

function TimelineStages({ jadwalLevels }: { jadwalLevels: Record<string, { tanggal_mulai: string; tanggal_selesai: string }> }) {
  const stages = [
    { level: -4, label: 'Wawancara' },
    { level: -3, label: 'Rapat Orang Tua' },
    { level: -2, label: 'MCU' },
    { level: -1, label: 'Pembukaan Kelas' },
    { level: 1, label: 'Level 1' },
    { level: 2, label: 'Level 2' },
    { level: 3, label: 'Level 3' },
    { level: 4, label: 'Level 4' },
  ]

  const today = new Date().toISOString().slice(0, 10)

  function getStatus(key: string) {
    const j = jadwalLevels[key]
    if (!j) return 'none'
    if (today < j.tanggal_mulai) return 'upcoming'
    if (today >= j.tanggal_mulai && today <= j.tanggal_selesai) return 'active'
    return 'done'
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const colorMap = {
    none: { dot: 'bg-gray-300', line: 'bg-gray-200', text: 'text-gray-400' },
    upcoming: { dot: 'bg-blue-400', line: 'bg-gray-200', text: 'text-gray-500' },
    active: { dot: 'bg-emerald-500', line: 'bg-emerald-400', text: 'text-emerald-700' },
    done: { dot: 'bg-slate-600', line: 'bg-slate-400', text: 'text-slate-700' },
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {stages.map((s, idx) => {
        const key = String(s.level)
        const status = getStatus(key)
        const c = colorMap[status]
        const j = jadwalLevels[key]
        return (
          <div key={s.level} className="flex items-start shrink-0">
            <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
              <div className={`w-4 h-4 rounded-full ${c.dot} border-2 border-white shadow-sm flex items-center justify-center`}>
                {status === 'done' && <CheckCircle size={10} className="text-white" />}
                {status === 'active' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
              <div className={`mt-2 text-center ${status === 'none' ? 'opacity-50' : ''}`}>
                <p className={`text-[10px] font-semibold ${c.text} leading-tight`}>{s.label}</p>
                {j ? (
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                    {formatDate(j.tanggal_mulai)}<br />s/d {formatDate(j.tanggal_selesai)}
                  </p>
                ) : (
                  <p className="text-[9px] text-gray-300 mt-0.5 italic">Belum diatur</p>
                )}
                {status === 'active' && (
                  <span className="mt-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                    BERLANGSUNG
                  </span>
                )}
              </div>
            </div>
            {idx < stages.length - 1 && (
              <div className={`w-8 h-0.5 mt-2 ${c.line} shrink-0`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
