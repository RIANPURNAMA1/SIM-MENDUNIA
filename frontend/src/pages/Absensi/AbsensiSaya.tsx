import { useState, useEffect, useRef } from 'react'
import {
  Clock, CalendarDays, QrCode, X, CheckCircle,
  AlertCircle, History
} from 'lucide-react'
import api from '../../services/api'

export default function AbsensiSaya() {
  const [siswa, setSiswa] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQr, setShowQr] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scannerActive, setScannerActive] = useState(false)

  useEffect(() => {
    api.get('/siswa/absensi-saya')
      .then(res => {
        setSiswa(res.data.siswa)
        setRiwayat(res.data.riwayat)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!showQr) {
      setScannerActive(false)
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
      return
    }
    setScannerActive(true)
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setScannerActive(false))
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
    }
  }, [showQr])

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      hadir: 'bg-emerald-100 text-emerald-700',
      izin: 'bg-amber-100 text-amber-700',
      sakit: 'bg-red-100 text-red-700',
      alpha: 'bg-slate-100 text-slate-500',
      terlambat: 'bg-orange-100 text-orange-700',
    }
    return map[status] || 'bg-slate-100 text-slate-500'
  }

  const statusIcon = (status: string) => {
    const map: Record<string, typeof CheckCircle> = {
      hadir: CheckCircle,
      izin: AlertCircle,
      sakit: AlertCircle,
      alpha: X,
      terlambat: Clock,
    }
    const Icon = map[status] || X
    return <Icon size={14} />
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const today = riwayat.find(r => {
    const t = new Date()
    const rd = new Date(r.tanggal)
    return rd.toDateString() === t.toDateString()
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Absensi Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Jadwal shift dan riwayat kehadiran</p>
      </div>

      {!siswa ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-400">Data siswa tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — Shift & QR */}
          <div className="lg:col-span-1 space-y-4">
            {/* Shift card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  Jadwal Shift
                </h2>
              </div>
              {siswa.shift ? (
                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Shift</p>
                    <p className="font-semibold text-gray-800 text-lg">{siswa.shift.nama_shift}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600 font-medium">Jam Masuk</p>
                      <p className="font-bold text-gray-800 text-xl">
                        {siswa.shift.jam_masuk
                          ? new Date(`2000-01-01T${siswa.shift.jam_masuk}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 font-medium">Jam Pulang</p>
                      <p className="font-bold text-gray-800 text-xl">
                        {siswa.shift.jam_pulang
                          ? new Date(`2000-01-01T${siswa.shift.jam_pulang}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </p>
                    </div>
                  </div>
                  {siswa.kelasRelasi && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Kelas</p>
                      <p className="font-semibold text-gray-800">{siswa.kelasRelasi.nama}</p>
                    </div>
                  )}
                  {siswa.batchRelasi && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Batch</p>
                      <p className="font-semibold text-gray-800">{siswa.batchRelasi.nama}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center text-slate-400 text-sm">
                  Belum ada jadwal shift
                </div>
              )}
            </div>

            {/* QR button */}
            <button
              onClick={() => setShowQr(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-4 font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <QrCode size={22} />
              Absensi dengan QR
            </button>

            {/* Status hari ini */}
            {today ? (
              <div className={`rounded-xl px-5 py-4 border flex items-center gap-3 ${
                today.status === 'hadir'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                {statusIcon(today.status)}
                <div>
                  <p className="text-xs text-slate-500">Absensi Hari Ini</p>
                  <p className="font-semibold capitalize text-gray-800">{today.status}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 flex items-center gap-3">
                <Clock size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Absensi Hari Ini</p>
                  <p className="font-semibold text-slate-400">Belum absen</p>
                </div>
              </div>
            )}
          </div>

          {/* Right column — Riwayat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <History size={18} className="text-slate-500" />
                <h2 className="font-semibold text-gray-800">Riwayat Absensi</h2>
              </div>
              {riwayat.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">Belum ada data absensi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Tanggal</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Jam Masuk</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Jam Pulang</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Status</th>
                        <th className="text-left px-5 py-3 font-medium text-slate-500">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayat.map((a, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-5 py-3 text-gray-800 font-medium">
                            {new Date(a.tanggal).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="px-5 py-3 text-gray-700">{a.jam_masuk || '-'}</td>
                          <td className="px-5 py-3 text-gray-700">{a.jam_keluar || '-'}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusBadge(a.status)}`}>
                              {statusIcon(a.status)}
                              {a.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500">{a.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <QrCode size={18} className="text-blue-600" />
                Scan QR Absensi
            </h3>
              <button
                onClick={() => setShowQr(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="aspect-square bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                {scannerActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-8">
                    <QrCode size={48} className="text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Arahkan kamera ke QR code yang disediakan oleh sensei/admin
                    </p>
                  </div>
                )}
                {/* Overlay scan area */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-blue-400 rounded-xl opacity-70" />
                </div>
              </div>
              {!scannerActive && (
                <button
                  onClick={() => {
                    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                      .then(stream => {
                        if (videoRef.current) videoRef.current.srcObject = stream
                        setScannerActive(true)
                      })
                      .catch(() => {})
                  }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-semibold transition-colors"
                >
                  Mulai Kamera
                </button>
              )}
              <p className="text-xs text-slate-400 text-center mt-3">
                Pastikan Anda terhubung dengan internet dan mengizinkan akses kamera
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
