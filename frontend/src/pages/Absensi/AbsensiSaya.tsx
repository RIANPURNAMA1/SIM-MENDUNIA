import { useState, useEffect, useRef } from 'react'
import {
  Clock, CalendarDays, QrCode, X, CheckCircle,
  AlertCircle, History, ChevronRight, Award
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import Swal from 'sweetalert2'
import api from '../../services/api'

export default function AbsensiSaya() {
  const [siswa, setSiswa] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [kelasAktif, setKelasAktif] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showQr, setShowQr] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; long: number } | null>(null)
  const [showNilaiModal, setShowNilaiModal] = useState(false)
  const [nilaiBatchName, setNilaiBatchName] = useState('')
  const [nilaiData, setNilaiData] = useState<any>({ daily: [], overall_avg: null, total_penilaian: 0, total_hari: 0 })
  const [nilaiLoading, setNilaiLoading] = useState(false)

  useEffect(() => {
    api.get('/siswa/absensi-saya')
      .then(res => {
        setSiswa(res.data.siswa)
        setRiwayat(res.data.riwayat)
        setKelasAktif(res.data.kelas_aktif || [])
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

        api.post('/siswa/scan-qr', { barcode: decodedText.trim(), lat: userCoords?.lat, long: userCoords?.long })
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
              setKelasAktif(r.data.kelas_aktif || [])
            }).catch(() => {})
          })
          .catch((err) => {
            const msg = err?.response?.data?.message || err.message || 'Terjadi kesalahan'
            Swal.fire({
              icon: 'error',
              title: 'Gagal',
              text: msg,
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

  const openNilaiModal = async (batchId: number, batchName: string, level: string) => {
    setNilaiBatchName(batchName)
    setShowNilaiModal(true)
    setNilaiLoading(true)
    try {
      const res = await api.get(`/siswa/nilai-saya/${batchId}`, { params: { level } })
      setNilaiData(res.data)
    } catch {
      setNilaiData([])
    } finally {
      setNilaiLoading(false)
    }
  }

  const getDisplayStatus = (a: any) => {
    if (!a.jam_masuk) return 'belum_hadir'
    const s = (a.status || '').toLowerCase()
    if (s === 'terlambat') return 'terlambat'
    if (s === 'izin') return 'izin'
    if (s === 'sakit') return 'sakit'
    return 'hadir'
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      hadir: 'bg-emerald-100 text-emerald-700',
      izin: 'bg-amber-100 text-amber-700',
      sakit: 'bg-red-100 text-red-700',
      alpha: 'bg-slate-100 text-slate-500',
      terlambat: 'bg-orange-100 text-orange-700',
      belum_hadir: 'bg-slate-100 text-slate-400',
    }
    return map[status] || 'bg-slate-100 text-slate-500'
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      hadir: 'Hadir',
      izin: 'Izin',
      sakit: 'Sakit',
      alpha: 'Alpha',
      terlambat: 'Terlambat',
      belum_hadir: 'Belum Hadir',
    }
    return map[status] || status
  }

  const statusIcon = (status: string) => {
    const map: Record<string, typeof CheckCircle> = {
      hadir: CheckCircle,
      izin: AlertCircle,
      sakit: AlertCircle,
      alpha: X,
      terlambat: Clock,
      belum_hadir: X,
    }
    const Icon = map[status] || X
    return <Icon size={14} />
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const today = riwayat.find(r => {
    const t = new Date()
    const rd = new Date(r.tanggal)
    return rd.toDateString() === t.toDateString()
  })

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <h1 className="text-lg font-bold text-gray-900 sm:text-2xl">Absensi Saya</h1>
          <p className="text-xs text-gray-500 sm:text-sm mt-0.5">Jadwal shift dan riwayat kehadiran</p>
        </div>
      </div>

      {!siswa ? (
        <div className="p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-400">Data siswa tidak ditemukan</p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4">

          {/* Absensi Hari Ini + QR — Meta-style compact cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border px-4 py-3.5 flex items-center gap-3 ${
              today
                ? today.status === 'hadir' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                : 'bg-white border-gray-200'
            }`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                today ? today.status === 'hadir' ? 'bg-emerald-100' : 'bg-amber-100' : 'bg-gray-100'
              }`}>
                {today
                  ? <span className={today.status === 'hadir' ? 'text-emerald-600' : 'text-amber-600'}>{statusIcon(today.status)}</span>
                  : <Clock size={16} className="text-gray-400" />
                }
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Absen Hari Ini</p>
                <p className={`text-sm font-bold ${today ? 'text-gray-900' : 'text-gray-400'}`}>
                  {today ? statusLabel(getDisplayStatus(today)) : 'Belum'}
                </p>
              </div>
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
              className="rounded-xl bg-[#0E6187] text-white px-4 py-3.5 flex items-center gap-3 active:scale-[0.97] transition-transform"
            >
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <QrCode size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wide">Absensi</p>
                <p className="text-sm font-bold">Scan QR</p>
              </div>
            </button>
          </div>

          {/* Jadwal Shift — horizontal compact */}
          {siswa.shift && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#0E6187] flex items-center justify-center">
                  <Clock size={12} className="text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Jadwal Shift</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#0E6187]/[0.04] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 font-medium uppercase">Masuk</p>
                  <p className="text-lg font-bold text-[#0E6187]">
                    {siswa.shift.jam_masuk ? new Date(`2000-01-01T${siswa.shift.jam_masuk}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </p>
                </div>
                <div className="text-gray-300 font-bold">—</div>
                <div className="flex-1 bg-[#0E6187]/[0.04] rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-500 font-medium uppercase">Pulang</p>
                  <p className="text-lg font-bold text-[#0E6187]">
                    {siswa.shift.jam_pulang ? new Date(`2000-01-01T${siswa.shift.jam_pulang}`).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>Shift: <strong className="text-gray-800">{siswa.shift.nama_shift}</strong></span>
                {siswa.batchRelasi && <span>Batch: <strong className="text-gray-800">{siswa.batchRelasi.nama_batch || siswa.batchRelasi.nama}</strong></span>}
              </div>
            </div>
          )}

          {/* Kelas Aktif */}
          {kelasAktif.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#0E6187] flex items-center justify-center">
                  <CalendarDays size={12} className="text-white" />
                </div>
                <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Kelas Aktif</p>
              </div>

              {/* Mobile: card list */}
              <div className="divide-y divide-gray-50 sm:hidden">
                {kelasAktif.map((k, i) => (
                  <div key={k.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white bg-[#0E6187] rounded-full w-5 h-5 flex items-center justify-center">{i + 1}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          k.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                          k.status === 'belum_mulai' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {k.status === 'aktif' ? 'Aktif' : k.status === 'belum_mulai' ? 'Belum Mulai' : 'Selesai'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-800">Lvl {k.level}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{k.batch}</p>
                    <p className="text-xs text-gray-500 mb-2">Sensei: {k.sensei}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-2">
                      <span>{formatDate(k.tanggal_mulai)}</span>
                      <span>→</span>
                      <span>{formatDate(k.tanggal_selesai)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">Pertemuan <strong className="text-gray-800">{k.total_pertemuan}</strong></span>
                      <span className="text-gray-500">Absen <strong className="text-gray-800">{k.absen_terisi}</strong></span>
                      {k.alpa > 0 && <span className="text-red-600 font-semibold">Alpa {k.alpa}</span>}
                      {k.izin > 0 && <span className="text-amber-600 font-semibold">Izin {k.izin}</span>}
                    </div>
                    <button
                      onClick={() => openNilaiModal(k.batch_id, k.batch, k.level)}
                      className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#0E6187] bg-[#0E6187]/[0.05] hover:bg-[#0E6187]/[0.1] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Award size={13} />
                      Lihat Nilai
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">No</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Batch</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Level</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Sensei</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Mulai</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Selesai</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Pertemuan</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Absen</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Alpa</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Izin</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Status</th>
                      <th className="text-center px-4 py-2.5 font-medium text-gray-500 text-xs">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelasAktif.map((k, i) => (
                      <tr key={k.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-gray-800 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 text-gray-800 font-medium text-xs">{k.batch}</td>
                        <td className="px-4 py-2.5 text-gray-700 text-xs">{k.level}</td>
                        <td className="px-4 py-2.5 text-gray-700 text-xs">{k.sensei}</td>
                        <td className="px-4 py-2.5 text-gray-700 text-xs">{formatDate(k.tanggal_mulai)}</td>
                        <td className="px-4 py-2.5 text-gray-700 text-xs">{formatDate(k.tanggal_selesai)}</td>
                        <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{k.total_pertemuan}</td>
                        <td className="px-4 py-2.5 text-center text-gray-700 text-xs">{k.absen_terisi}</td>
                        <td className="px-4 py-2.5 text-center text-xs">
                          <span className={`font-semibold ${k.alpa > 0 ? 'text-red-600' : 'text-gray-700'}`}>{k.alpa}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs">
                          <span className={`font-semibold ${k.izin > 0 ? 'text-amber-600' : 'text-gray-700'}`}>{k.izin}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            k.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                            k.status === 'belum_mulai' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {k.status === 'aktif' ? 'Aktif' : k.status === 'belum_mulai' ? 'Belum Mulai' : 'Selesai'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => openNilaiModal(k.batch_id, k.batch, k.level)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0E6187] bg-[#0E6187]/[0.05] hover:bg-[#0E6187]/[0.1] px-2.5 py-1 rounded-md transition-colors"
                          >
                            <Award size={11} />
                            Lihat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Riwayat Absensi */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#0E6187] flex items-center justify-center">
                <History size={12} className="text-white" />
              </div>
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Riwayat Absensi</p>
            </div>

            {riwayat.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarDays size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Belum ada data absensi</p>
              </div>
            ) : (
              <>
                {/* Mobile: card list */}
                <div className="divide-y divide-gray-50 sm:hidden">
                  {riwayat.map((a, i) => {
                    const ds = getDisplayStatus(a)
                    return (
                      <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          ds === 'hadir' ? 'bg-emerald-100' :
                          ds === 'izin' ? 'bg-amber-100' :
                          ds === 'sakit' ? 'bg-red-100' :
                          ds === 'terlambat' ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          <span className={ds === 'hadir' ? 'text-emerald-600' : ds === 'izin' ? 'text-amber-600' : ds === 'sakit' ? 'text-red-600' : ds === 'terlambat' ? 'text-orange-600' : 'text-gray-400'}>
                            {statusIcon(ds)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(ds)}`}>
                              {statusLabel(ds)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            <span>Masuk: <strong className="text-gray-700">{a.jam_masuk || '-'}</strong></span>
                            <span>Pulang: <strong className="text-gray-700">{a.jam_keluar || '-'}</strong></span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Tanggal</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Jam Masuk</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Jam Pulang</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Status</th>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-500 text-xs">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayat.map((a, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 text-gray-800 font-medium text-xs">
                            {new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700 text-xs">{a.jam_masuk || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-700 text-xs">{a.jam_keluar || '-'}</td>
                          <td className="px-4 py-2.5">
                            {(() => {
                              const ds = getDisplayStatus(a)
                              return (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(ds)}`}>
                                  {statusIcon(ds)}
                                  {statusLabel(ds)}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{a.keterangan || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showQr && (
        <div className="fixed inset-0 z-50 bg-white sm:bg-black/60 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="h-full sm:h-auto sm:w-full sm:max-w-md bg-white sm:rounded-xl shadow-2xl border sm:border-gray-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#0E6187] text-white">
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
            <div className="flex-1 p-0 sm:p-4 flex flex-col min-h-0">
              <div className="flex-1 bg-black sm:rounded-xl overflow-hidden relative flex items-center justify-center min-h-0">
                <div id="qr-reader" className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-white/40 rounded-xl opacity-70" />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center py-3 sm:mt-3 shrink-0">
                Arahkan kamera ke QR code yang disediakan oleh sensei/admin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nilai Modal */}
      {showNilaiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setShowNilaiModal(false)}>
          <div className="w-full sm:max-w-lg sm:mx-4 bg-white sm:rounded-xl shadow-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0E6187] flex items-center justify-center">
                  <Award size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Nilai Saya</p>
                  <p className="text-[11px] text-gray-500">{nilaiBatchName} · Level {nilaiData?.daily?.[0] ? '' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowNilaiModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {nilaiLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-gray-200 border-t-[#0E6187] rounded-full animate-spin" />
                </div>
              ) : !nilaiData?.daily?.length ? (
                <div className="text-center py-12">
                  <Award size={36} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Belum ada data penilaian</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary card */}
                  <div className="rounded-xl bg-[#0E6187]/[0.04] border border-[#0E6187]/[0.08] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Rata-rata Keseluruhan</span>
                      <span className={`text-xl font-bold tabular-nums ${nilaiData.overall_avg >= 85 ? 'text-emerald-600' : nilaiData.overall_avg >= 70 ? 'text-[#0E6187]' : nilaiData.overall_avg >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                        {nilaiData.overall_avg}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-gray-500">
                      <span>{nilaiData.total_hari} hari penilaian</span>
                      <span>·</span>
                      <span>{nilaiData.total_penilaian} komponen</span>
                    </div>
                  </div>

                  {/* Per day */}
                  {nilaiData.daily.map((day: any, di: number) => (
                    <div key={di} className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {new Date(day.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        {day.rata_rata !== null && (
                          <span className={`text-sm font-bold tabular-nums ${day.rata_rata >= 85 ? 'text-emerald-600' : day.rata_rata >= 70 ? 'text-[#0E6187]' : day.rata_rata >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                            {day.rata_rata}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {day.komponen.map((comp: any, ci: number) => (
                          <div key={ci} className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-gray-600 font-medium">{comp.nama}</span>
                            <span className={`text-xs font-bold tabular-nums ${comp.nilai >= 85 ? 'text-emerald-600' : comp.nilai >= 70 ? 'text-gray-800' : comp.nilai >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                              {comp.nilai}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
