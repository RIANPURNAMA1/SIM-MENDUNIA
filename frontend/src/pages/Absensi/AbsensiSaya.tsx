import { useState, useEffect, useRef } from 'react'
import {
  Clock, CalendarDays, QrCode, X, CheckCircle,
  AlertCircle, History
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import Swal from 'sweetalert2'
import api from '../../services/api'

export default function AbsensiSaya() {
  const [siswa, setSiswa] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQr, setShowQr] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; long: number } | null>(null)

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
    if (!showQr) return

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().catch(() => {}).then(() => scanner.clear().catch(() => {}))
        scannerRef.current = null
        setShowQr(false)

        Swal.fire({
          title: 'Memproses...',
          text: 'Silakan tunggu',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
        })

        api.post('/absensi-karyawan/scan-qr', { barcode: decodedText, lat: userCoords?.lat, long: userCoords?.long })
          .then((res) => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil!',
              text: res.data.message,
              footer: res.data.cabang ? `Cabang: ${res.data.cabang}` : undefined,
            })
            api.get('/siswa/absensi-saya').then(r => {
              setSiswa(r.data.siswa)
              setRiwayat(r.data.riwayat)
            }).catch(() => {})
          })
          .catch((err) => {
            Swal.fire({
              icon: 'error',
              title: 'Gagal',
              text: err.message || 'Terjadi kesalahan',
            })
          })
      },
      () => {}
    ).catch(() => {})

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).then(() => {
          scannerRef.current?.clear().catch(() => {})
        })
        scannerRef.current = null
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
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0D1F3C] rounded-full animate-spin" />
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Absensi Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Jadwal shift dan riwayat kehadiran</p>
      </div>

      {!siswa ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-400">Data siswa tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                    <Clock size={15} />
                  </span>
                  Jadwal Shift
                </h2>
              </div>
              {siswa.shift ? (
                <div className="p-5 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Shift</p>
                    <p className="font-semibold text-gray-800 text-lg">{siswa.shift.nama_shift}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-[#0D1F3C]/5 rounded-lg p-3 text-center">
                      <p className="text-xs text-[#0D1F3C] font-medium">Jam Masuk</p>
                      <p className="font-bold text-gray-800 text-xl">
                        {siswa.shift.jam_masuk
                          ? new Date(`2000-01-01T${siswa.shift.jam_masuk}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </p>
                    </div>
                    <div className="flex-1 bg-[#0D1F3C]/5 rounded-lg p-3 text-center">
                      <p className="text-xs text-[#0D1F3C] font-medium">Jam Pulang</p>
                      <p className="font-bold text-gray-800 text-xl">
                        {siswa.shift.jam_pulang
                          ? new Date(`2000-01-01T${siswa.shift.jam_pulang}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </p>
                    </div>
                  </div>
                  {siswa.kelasRelasi && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Kelas</p>
                      <p className="font-semibold text-gray-800">{siswa.kelasRelasi.nama}</p>
                    </div>
                  )}
                  {siswa.batchRelasi && (
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Batch</p>
                      <p className="font-semibold text-gray-800">{siswa.batchRelasi.nama}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center text-gray-400 text-sm">
                  Belum ada jadwal shift
                </div>
              )}
            </div>

            <button
              onClick={() => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => setUserCoords({ lat: pos.coords.latitude, long: pos.coords.longitude }),
                  () => setUserCoords(null),
                  { enableHighAccuracy: true, timeout: 5000 },
                )
                setShowQr(true)
              }}
              className="w-full bg-[#0D1F3C] hover:bg-[#0D1F3C]/90 text-white rounded-xl px-5 py-4 font-semibold flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              <QrCode size={22} />
              Absensi dengan QR
            </button>

            {today ? (
              <div className={`rounded-xl px-5 py-4 border flex items-center gap-3 ${
                today.status === 'hadir'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                {statusIcon(today.status)}
                <div>
                  <p className="text-xs text-gray-500">Absensi Hari Ini</p>
                  <p className="font-semibold capitalize text-gray-800">{today.status}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-5 py-4 flex items-center gap-3">
                <Clock size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Absensi Hari Ini</p>
                  <p className="font-semibold text-gray-400">Belum absen</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                  <History size={15} />
                </span>
                <h2 className="font-semibold text-gray-800">Riwayat Absensi</h2>
              </div>
              {riwayat.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">Belum ada data absensi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Tanggal</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Jam Masuk</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Jam Pulang</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayat.map((a, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
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

      {showQr && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0D1F3C] text-white">
                  <QrCode size={15} />
                </span>
                Scan QR Absensi
              </h3>
              <button
                onClick={() => setShowQr(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="aspect-square bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/40 rounded-xl opacity-70" />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">
                Arahkan kamera ke QR code yang disediakan oleh sensei/admin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
