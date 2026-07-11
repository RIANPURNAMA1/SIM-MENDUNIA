import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chart, registerables } from 'chart.js'
import {
  Briefcase, Users, CalendarCheck, MapPin, Clock, Timer,
  Calendar, ArrowRight, Circle, FileText,
  CheckCircle, Camera, QrCode, LogOut, UserCheck, X,
} from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import Swal from 'sweetalert2'
import { absensiKaryawanApi } from '../../services/api'
import type { Absensi } from '../../types'

Chart.register(...registerables)

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Pagi'
  if (h < 15) return 'Siang'
  if (h < 18) return 'Sore'
  return 'Malam'
}

function formatDateLong() {
  const d = new Date()
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function formatDateShort(d: Date) {
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const mockPengajuan = [
  { name: 'Lutfi Nurul Hasanah', date: 'Selasa, 10 Februari 2026', type: 'SAKIT', color: 'red' },
  { name: 'Lutfi Nurul Hasanah', date: 'Senin, 09 Februari 2026', type: 'IZIN', color: 'teal' },
]

export default function AbsensiKaryawan() {
  const donutRef = useRef<HTMLCanvasElement | null>(null)
  const donutChartRef = useRef<Chart | null>(null)
  const [time, setTime] = useState(formatTime())
  const [currentTime, setCurrentTime] = useState(new Date())

  const [absenMasuk, setAbsenMasuk] = useState(false)
  const [absenPulang, setAbsenPulang] = useState(false)
  const [jamMasuk, setJamMasuk] = useState('')
  const [jamKeluar, setJamKeluar] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [showQrScanner, setShowQrScanner] = useState(false)
  const qrScannerRef = useRef<Html5Qrcode | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; long: number } | null>(null)

  const [todayData, setTodayData] = useState({
    hadir: 0,
    terlambat: 0,
    belumAbsen: 20,
    izinSakit: 0,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTime())
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!donutRef.current) return
    if (donutChartRef.current) donutChartRef.current.destroy()

    const { hadir, terlambat, belumAbsen, izinSakit } = todayData

    donutChartRef.current = new Chart(donutRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Hadir', 'Terlambat', 'Belum Absen', 'Cuti / Izin / Sakit'],
        datasets: [{
          data: [hadir, terlambat, belumAbsen, izinSakit],
          backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '78%',
        plugins: { legend: { display: false } },
      },
    })

    return () => {
      if (donutChartRef.current) donutChartRef.current.destroy()
    }
  }, [todayData])

  const openQrScanner = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, long: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: true, timeout: 5000 },
    )
    setShowQrScanner(true)
  }

  useEffect(() => {
    if (!showQrScanner) {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {})
        qrScannerRef.current.clear().catch(() => {})
        qrScannerRef.current = null
      }
      return
    }

    const scanner = new Html5Qrcode('qr-scanner-employee')
    qrScannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        scanner.stop().catch(() => {})
        qrScannerRef.current = null
        setShowQrScanner(false)

        Swal.fire({
          title: 'Memproses...',
          text: 'Silakan tunggu',
          didOpen: () => Swal.showLoading(),
          allowOutsideClick: false,
        })

        absensiKaryawanApi.scanQr(decodedText, userCoords?.lat, userCoords?.long)
          .then((res) => {
            Swal.fire({
              icon: 'success',
              title: 'Berhasil!',
              text: res.data.message,
              footer: res.data.cabang ? `Cabang: ${res.data.cabang}` : undefined,
            })
            if (res.data.status === 'pulang') {
              setAbsenPulang(true)
              setJamKeluar(res.data.jam)
            } else {
              setAbsenMasuk(true)
              setJamMasuk(res.data.jam)
            }
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
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {})
        qrScannerRef.current.clear().catch(() => {})
        qrScannerRef.current = null
      }
    }
  }, [showQrScanner])

  const handleAbsenMasuk = async () => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      setAbsenMasuk(true)
      setJamMasuk(formatTime())
      setTodayData((prev) => ({
        ...prev,
        hadir: prev.hadir + 1,
        belumAbsen: Math.max(0, prev.belumAbsen - 1),
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleAbsenPulang = async () => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      setAbsenPulang(true)
      setJamKeluar(formatTime())
    } finally {
      setIsLoading(false)
    }
  }

  const today = currentTime

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <CalendarCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Selamat {getGreeting()}, Karyawan</h1>
            <p className="text-sm text-slate-500">{formatDateLong()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <Timer size={16} className="text-blue-600" />
            {time} WIB
          </span>
        </div>
      </div>

      {/* Absensi Masuk/Pulang */}
      <div className="mb-4 rounded-lg bg-gradient-to-r from-[#0D1F3C] to-[#1a2d4a] p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-bold">Absensi Hari Ini</h3>
            <p className="mt-0.5 text-sm text-blue-200">{formatDateLong()}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              {absenMasuk && (
                <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="font-medium text-green-300">Masuk: {jamMasuk}</span>
                </div>
              )}
              {absenPulang && (
                <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5">
                  <CheckCircle size={16} className="text-blue-400" />
                  <span className="font-medium text-blue-300">Pulang: {jamKeluar}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full gap-3 md:w-auto">
            {!absenMasuk ? (
              <button onClick={handleAbsenMasuk} disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:opacity-60 md:flex-none">
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <><LogOut size={18} className="rotate-180" /> Absen Masuk</>
                )}
              </button>
            ) : !absenPulang ? (
              <button onClick={handleAbsenPulang} disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400 disabled:opacity-60 md:flex-none">
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <><LogOut size={18} /> Absen Pulang</>
                )}
              </button>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-green-400/30 bg-green-600/20 px-6 py-3 text-sm font-semibold text-green-300 md:flex-none">
                <CheckCircle size={18} /> Selesai
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={openQrScanner}
                className="rounded-lg bg-white/10 p-3 transition hover:bg-white/20"
                title="Scan QR"
              >
                <QrCode size={20} />
              </button>
              <button className="rounded-lg bg-white/10 p-3 transition hover:bg-white/20" title="Foto Selfie">
                <Camera size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: 3 Cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Paket Aktif</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase size={24} className="flex-shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Layanan</p>
                <p className="text-sm font-semibold text-slate-800">Absenku Bimasakti</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users size={24} className="flex-shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Karyawan</p>
                <p className="text-sm font-semibold text-slate-800">20 dari Maksimal 30 Karyawan</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CalendarCheck size={24} className="flex-shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Masa Aktif</p>
                <p className="text-sm font-semibold text-slate-800">14 Agustus 2025 - 14 Februari 2026</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Karyawan</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck size={28} className="text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Laki - Laki</p>
                <p className="font-bold text-slate-800">45% <span className="text-[10px] font-normal text-slate-400">(9 Orang)</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck size={28} className="text-orange-400" />
              <div>
                <p className="text-xs text-slate-500">Perempuan</p>
                <p className="font-bold text-slate-800">55% <span className="text-[10px] font-normal text-slate-400">(11 Orang)</span></p>
              </div>
            </div>
            <div className="col-span-2 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-xs text-slate-500">Total Karyawan</span>
              <span className="text-lg font-bold text-[#0D1F3C]">20 Orang</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Pengaturan</h3>
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            <Link to="/cabang" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <MapPin size={14} /> Lokasi Absensi
            </Link>
            <Link to="/izin-cuti" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <FileText size={14} /> Approval Izin
            </Link>
            <Link to="/shift" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <Clock size={14} /> Jam Kerja
            </Link>
            <Link to="/approval-lembur" className="flex items-center gap-1 font-medium text-teal-600 hover:underline">
              <Calendar size={14} /> Approval Lembur
            </Link>
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-8" alt="Google Play" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" className="h-8" alt="App Store" />
          </div>
        </div>
      </div>

      {/* Row 2: Rekap + Pengajuan */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Rekap Absensi Hari Ini</h3>
            <span className="text-xs font-medium text-slate-400">{formatDateLong()}</span>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="relative h-48 w-48 flex-shrink-0">
              <canvas ref={donutRef} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-slate-500">Belum Absen</span>
                <span className="text-2xl font-bold text-slate-800">{todayData.belumAbsen}</span>
              </div>
            </div>

            <div className="w-full flex-1 text-sm">
              <div className="grid grid-cols-1 gap-1">
                {[
                  { label: 'Hadir', value: todayData.hadir, color: 'text-blue-600' },
                  { label: 'Terlambat', value: todayData.terlambat, color: 'text-orange-500' },
                  { label: 'Belum Absen', value: todayData.belumAbsen, color: 'text-red-600', highlight: true },
                  { label: 'Cuti / Izin / Sakit', value: todayData.izinSakit, color: 'text-teal-600' },
                ].map((item) => (
                  <div key={item.label}
                    className={`flex justify-between p-2 ${item.highlight ? 'bg-red-50/50' : 'border-b border-slate-50'}`}>
                    <span className={item.highlight ? 'font-medium text-slate-700' : 'text-slate-500'}>{item.label}</span>
                    <span className={`font-bold ${item.color}`}>
                      {item.value} <small className="font-normal italic text-slate-400">Karyawan</small>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-teal-600">
                  <Calendar size={14} /> Kalender Absensi
                </button>
                <Link to="/data-kehadiran"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500 px-4 py-2 text-xs font-medium text-teal-600 transition hover:bg-teal-50">
                  Lihat Semua
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 border-l-4 border-blue-600 pl-3 text-sm font-bold uppercase text-slate-700">Daftar Pengajuan</h3>
          <div className="custom-scrollbar max-h-[300px] space-y-4 overflow-y-auto pr-2">
            {mockPengajuan.map((item, i) => (
              <div key={i} className={`rounded-lg bg-slate-50 p-3 border-l-4 ${item.color === 'red' ? 'border-red-500' : 'border-teal-500'}`}>
                <div className="mb-1 flex items-start justify-between">
                  <p className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <Clock size={12} /> {item.date}
                  </p>
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold text-white ${item.color === 'red' ? 'bg-red-500' : 'bg-teal-500'}`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-xs font-bold uppercase text-slate-700">{item.name}</p>
                <p className="text-[10px] text-slate-400">Belum Disetujui oleh Admin</p>
              </div>
            ))}
          </div>
          <Link to="/izin-cuti"
            className="mt-6 flex w-full items-center justify-center gap-1 rounded-lg border border-blue-600 py-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-50">
            LIHAT SEMUA <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Riwayat Absensi */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <CalendarCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Riwayat Absensi Saya</h3>
              <p className="text-[11px] text-slate-400">5 absensi terakhir</p>
            </div>
          </div>
          <Link to="/data-kehadiran" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
            Lihat Semua <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 text-left font-semibold">Tanggal</th>
                <th className="px-5 py-3 text-left font-semibold">Shift</th>
                <th className="px-5 py-3 text-left font-semibold">Jam Masuk</th>
                <th className="px-5 py-3 text-left font-semibold">Jam Pulang</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tanggal: '04 Jul 2026', shift: 'Pagi (07:00 - 15:00)', masuk: '06:58', pulang: '15:02', status: 'Hadir' },
                { tanggal: '03 Jul 2026', shift: 'Pagi (07:00 - 15:00)', masuk: '07:15', pulang: '15:00', status: 'Terlambat' },
                { tanggal: '02 Jul 2026', shift: 'Pagi (07:00 - 15:00)', masuk: '06:55', pulang: '15:05', status: 'Hadir' },
                { tanggal: '01 Jul 2026', shift: 'Pagi (07:00 - 15:00)', masuk: '07:00', pulang: '15:00', status: 'Hadir' },
                { tanggal: '30 Jun 2026', shift: 'Pagi (07:00 - 15:00)', masuk: '-', pulang: '-', status: 'Izin' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-slate-50 transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">{row.tanggal}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{row.shift}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className={`font-medium ${row.masuk === '-' ? 'text-slate-400' : 'text-slate-800'}`}>{row.masuk}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <span className={`font-medium ${row.pulang === '-' ? 'text-slate-400' : 'text-slate-800'}`}>{row.pulang}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      row.status === 'Hadir' ? 'bg-green-50 text-green-700'
                      : row.status === 'Terlambat' ? 'bg-orange-50 text-orange-600'
                      : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Circle size={8} className="fill-current" /> {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* QR Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <QrCode size={18} className="text-blue-600" />
                Scan QR Absensi
              </h3>
              <button
                onClick={() => setShowQrScanner(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="aspect-square bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                <div id="qr-scanner-employee" className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-blue-400 rounded-xl opacity-70" />
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center mt-3">
                Arahkan kamera ke QR code cabang
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
