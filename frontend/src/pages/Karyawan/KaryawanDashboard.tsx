import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { absensiKaryawanApi, agendaApi, kelasSenseiApi, APP_URL } from '../../services/api'
import { Camera, CheckCircle, X, Calendar,
  Users, Bell,
  ChevronRight, LogOut,
  QrCode, FileText, History, Clock, ClipboardList,
} from 'lucide-react'
import Swal from 'sweetalert2'
import { Html5Qrcode } from 'html5-qrcode'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'
import ThemeToggle from '../../components/ThemeToggle'

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function formatTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateLong() {
  const d = new Date()
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${dayNames[d.getDay()].slice(0, 3)} ${d.getDate().toString().padStart(2, '0')}`
}

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`
}

interface RiwayatItem {
  id: any
  tanggal: string
  jam_masuk: string | null
  jam_keluar: string | null
  status: string
  role?: string | null
  shift?: { nama: string } | null
}

const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
const fullDayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Kompres foto absen hingga mendekati target ukuran (10 KB) dengan menurunkan resolusi & kualitas JPEG
function compressCanvasToTarget(video: HTMLVideoElement, targetBytes: number): Promise<Blob | null> {
  const attempts = [
    { width: 640, height: 360, quality: 0.7 },
    { width: 480, height: 270, quality: 0.6 },
    { width: 400, height: 225, quality: 0.5 },
    { width: 360, height: 200, quality: 0.4 },
    { width: 320, height: 180, quality: 0.35 },
  ]
  return new Promise((resolve) => {
    const tmp = document.createElement('canvas')
    let i = 0
    const step = () => {
      if (i >= attempts.length) {
        resolve(null)
        return
      }
      const a = attempts[i++]
      tmp.width = a.width
      tmp.height = a.height
      const ctx = tmp.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(video, 0, 0, a.width, a.height)
      tmp.toBlob((b) => {
        if (b && b.size <= targetBytes) resolve(b)
        else step()
      }, 'image/jpeg', a.quality)
    }
    step()
  })
}

export default function KaryawanDashboard() {
  const { user, logout } = useAuth()
  const [time, setTime] = useState(formatTime())
  const [activeTab, setActiveTab] = useState('home')

  const [absenStatus, setAbsenStatus] = useState<'belum' | 'masuk' | 'pulang'>('belum')
  const [jamMasuk, setJamMasuk] = useState('')
  const [jamKeluar, setJamKeluar] = useState('')
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error' | 'ok'>('idle')

  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'masuk' | 'pulang'>('masuk')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [processing, setProcessing] = useState(false)
  const submittingRef = useRef(false)

  const [showQrScanner, setShowQrScanner] = useState(false)
  const qrScannerRef = useRef<Html5Qrcode | null>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; long: number } | null>(null)

  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [riwayatFilter, setRiwayatFilter] = useState('Semua')
  const [jadwal, setJadwal] = useState<{ nama: string; jam_mulai: string; jam_selesai: string }[]>([])
  const [agendaList, setAgendaList] = useState<{ id: number; judul: string; tanggal: string; waktu: string }[]>([])
  const [kelasList, setKelasList] = useState<{ id: number; nama: string; hari: string }[]>([])

  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    loadData()
    absensiKaryawanApi.shiftSaya().then(res => {
      const shift = res.data?.data
      if (shift) setJadwal([shift])
    }).catch(() => {})
  }, [user?.id])

  async function loadData() {
    try {
      const [cekRes, riwayatRes, agendaRes, kelasRes] = await Promise.all([
        absensiKaryawanApi.cek().catch(() => ({ data: null })),
        absensiKaryawanApi.riwayat({ limit: 10 }).catch(() => ({ data: [] })),
        agendaApi.list().catch(() => ({ data: [] })),
        kelasSenseiApi.list().catch(() => ({ data: [] })),
      ])

      const cekData = cekRes?.data?.data
      if (cekData) {
        if (cekData.jam_masuk && cekData.jam_keluar) {
          setAbsenStatus('pulang')
          setJamMasuk(cekData.jam_masuk)
          setJamKeluar(cekData.jam_keluar)
        } else if (cekData.jam_masuk) {
          setAbsenStatus('masuk')
          setJamMasuk(cekData.jam_masuk)
        }
      }

      const riwayatData = Array.isArray(riwayatRes?.data) ? riwayatRes.data : riwayatRes?.data?.data || []
      setRiwayat(riwayatData)
      setAgendaList(Array.isArray(agendaRes?.data) ? agendaRes.data : [])
      setKelasList(Array.isArray(kelasRes?.data) ? kelasRes.data : [])
    } catch {
    }
  }

  // --- Camera ---
  const startCamera = useCallback(async (mode: 'masuk' | 'pulang') => {
    setCameraMode(mode)

    // Minta izin GPS
    coordsRef.current = null
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        )
        coordsRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      } catch {
        Swal.fire({ icon: 'error', title: 'Lokasi Tidak Ditemukan', text: 'Aktifkan GPS untuk melakukan absensi' })
        return
      }
    } else {
      Swal.fire({ icon: 'error', title: 'GPS Tidak Didukung', text: 'Perangkat Anda tidak mendukung GPS' })
      return
    }

    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setShowCamera(false)
      Swal.fire({ icon: 'error', title: 'Kamera Tidak Tersedia', text: 'Pastikan izin kamera diberikan' })
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }, [])

  const openQrScanner = useCallback(() => {
    setUserCoords(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, long: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    )
    setShowQrScanner(true)
  }, [])

  const stopQrScanner = useCallback(async () => {
    const s = qrScannerRef.current
    qrScannerRef.current = null
    if (!s) return
    try {
      await s.stop()
    } catch (e) {
      // stop() dipanggil saat start() masih ber-transisi -> tunggu lalu ulangi
      await new Promise(r => setTimeout(r, 150))
      try { await s.stop() } catch {}
    }
    try { await s.clear() } catch {}
  }, [])

  useEffect(() => {
    if (!showQrScanner) {
      stopQrScanner()
      return
    }

    const scanner = new Html5Qrcode('qr-scanner-dashboard')
    qrScannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (decodedText) => {
        stopQrScanner()
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
            loadData()
          })
          .catch((err) => {
            Swal.fire({
              icon: 'error',
              title: 'Gagal',
              text: err?.response?.data?.message || err.message || 'Terjadi kesalahan',
            })
          })
      },
      () => {}
    ).catch(() => {})

    return () => {
      stopQrScanner()
    }
  }, [showQrScanner])

  const capturePhoto = useCallback(async () => {
    if (submittingRef.current) return
    if (!videoRef.current || !canvasRef.current) return
    submittingRef.current = true
    setProcessing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      submittingRef.current = false
      setProcessing(false)
      return
    }
    ctx.drawImage(video, 0, 0)
    const blob = await compressCanvasToTarget(video, 10 * 1024)
    if (!blob) {
      submittingRef.current = false
      setProcessing(false)
      return
    }
      try {
      const formData = new FormData()
      formData.append('foto', blob, 'absen.jpg')
      if (coordsRef.current) {
        formData.append('latitude', String(coordsRef.current.latitude))
        formData.append('longitude', String(coordsRef.current.longitude))
      }

        const todayKey = new Date().toLocaleDateString('en-CA')
        if (cameraMode === 'masuk') {
          const res = await absensiKaryawanApi.masuk(formData as unknown as Record<string, unknown>)
          setAbsenStatus('masuk')
          setJamMasuk(formatTime())
          setRiwayat(prev => [
            {
              id: `today-${Date.now()}`,
              tanggal: todayKey,
              jam_masuk: res?.data?.data?.jam_masuk || formatTime(),
              jam_keluar: null,
              status: (res?.data?.data?.status || 'HADIR').toLowerCase(),
              role: 'KARYAWAN',
              shift: jadwal[0] ? { nama: jadwal[0].nama } : null,
            },
            ...prev.filter(r => r.tanggal !== todayKey),
          ])
          stopCamera()
          Swal.fire({ icon: 'success', title: 'Absen Masuk Berhasil', timer: 2000, showConfirmButton: false })
        } else {
          const res = await absensiKaryawanApi.pulang(formData as unknown as Record<string, unknown>)
          setAbsenStatus('pulang')
          setJamKeluar(formatTime())
          setRiwayat(prev => prev.map(r =>
            r.tanggal === todayKey ? { ...r, jam_keluar: res?.data?.data?.jam_keluar || formatTime() } : r
          ))
          stopCamera()
          Swal.fire({ icon: 'success', title: 'Absen Pulang Berhasil', timer: 2000, showConfirmButton: false })
        }
        await loadData()
      } catch (e: any) {
        const msg = e?.response?.data?.message || (e instanceof Error ? e.message : 'Gagal melakukan absensi')
        stopCamera()
        Swal.fire({ icon: 'error', title: 'Absensi Gagal', text: msg })
      } finally {
        submittingRef.current = false
        setProcessing(false)
      }
  }, [cameraMode, stopCamera, jadwal])

  const statusLabel = () => {
    if (absenStatus === 'pulang') return 'Selesai'
    if (absenStatus === 'masuk') return 'Sedang Bekerja'
    return 'Belum Absen'
  }

  const statusDotColor = () => {
    if (absenStatus === 'pulang') return 'bg-[#7C8AA5]'
    if (absenStatus === 'masuk') return 'bg-[#4ADE80]'
    return 'bg-white/90'
  }

  const firstName = (user?.name || 'Karyawan').split(' ')[0]
  const initials = (user?.name?.charAt(0) || 'K').toUpperCase()
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  function handleLogout() {
    Swal.fire({
      icon: 'question',
      title: 'Yakin ingin logout?',
      text: 'Anda akan keluar dari akun Kelas Mendunia.',
      showCancelButton: true,
      confirmButtonText: 'Logout',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#0E6187',
    }).then(async result => {
      if (result.isConfirmed) {
        await logout()
        window.location.href = '/login'
      }
    })
  }

  const quickMenuItems = [
    { icon: QrCode, label: 'Scan QR', action: openQrScanner },
    { icon: FileText, label: 'Izin/Sakit', href: '/pengajuan-izin' },
    { icon: History, label: 'Riwayat', href: '/riwayat-absensi-karyawan' },
    { icon: Clock, label: 'Lembur', href: '/lembur-karyawan' },
    { icon: Calendar, label: 'Jadwal', href: '/jadwal-karyawan' },
    ...(user?.role === 'GURU' || user?.jabatan === 'Guru' ? [{ icon: ClipboardList, label: 'Data Siswa', href: '/guru-data-siswa' }] : []),
    ...(user?.jabatan === 'Guru' ? [{ icon: Users, label: 'Sensei' }] : []),
  ]

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-24">
      {/* ============ Top App Bar ============ */}
      <header className="bg-[#0E6187] px-4 pb-16 pt-5 text-white animate-fade-in">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between animate-fade-in delay-75">
            <div className="flex items-center gap-2">
              <img src="/logo-sm1.png" alt="Kelas Mendunia" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="Notifikasi"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
              >
                <Bell size={18} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400 ring-2 ring-[#0E6187]" />
              </button>
              <a
                href="/profil-karyawan"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/30 transition hover:ring-white/60 active:scale-95"
              >
                {user?.foto_profil && user.foto_profil.trim() ? (
                  <img src={`${APP_URL}/uploads/foto_profil/${user.foto_profil}`} alt="Profil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{initials}</span>
                )}
              </a>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
          <div className="mt-6 animate-fade-up delay-100">
            <p className="text-[13px] font-medium text-teal-100">Selamat datang kembali</p>
            <h1 className="mt-0.5 text-2xl font-bold">Halo, {firstName}!</h1>
            <p className="mt-1 text-[13px] text-teal-100">{dateStr}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-10 max-w-lg space-y-4 px-4">
        {/* Hero Attendance Card */}
        <section className="relative overflow-hidden rounded-2xl bg-[#0E6187] p-6 shadow-lg border-2 border-yellow-400 animate-fade-up delay-150">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.03]" />
          <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/[0.06]" />

          <div className="relative flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">Absensi · mendunia.id</p>
              <p className="text-xs text-white/60 mt-1">{formatDateLong()}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor()}`} />
              <span className="text-[10px] font-bold text-white">{statusLabel()}</span>
            </div>
          </div>

          <div className="relative mb-4">
            <p className="text-5xl font-bold text-white tabular-nums tracking-tight">{time}</p>
            <p className="text-[11px] text-white/50 font-medium mt-1">Waktu Indonesia Barat</p>
          </div>

          {absenStatus === 'masuk' && jamMasuk && (
            <div className="relative inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 mb-1">
              <CheckCircle size={12} className="text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Masuk {jamMasuk}</span>
            </div>
          )}
          {absenStatus === 'pulang' && jamKeluar && (
            <div className="relative inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1.5">
              <CheckCircle size={12} className="text-blue-400" />
              <span className="text-xs font-bold text-blue-300">Pulang {jamKeluar}</span>
            </div>
          )}
        </section>

        {/* Jadwal Shift Hari Ini */}
        <section className="rounded-xl bg-white p-4 shadow-sm animate-fade-up delay-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Jadwal Shift Hari Ini</h2>
            {jadwal.length > 0 && <span className="text-[11px] font-semibold text-[#0E6187]">{jadwal.length} shift</span>}
          </div>
          {jadwal.length > 0 ? (
            <div className="mt-3 space-y-2.5">
              {jadwal.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[#0E6187]/10">
                    <Clock size={16} className="text-[#0E6187]" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{s.nama}</p>
                    <p className="text-[11px] font-medium text-slate-400">Status aktif</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[#0E6187] tabular-nums">{s.jam_mulai}–{s.jam_selesai}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <Calendar size={22} className="mx-auto mb-2 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-500">Tidak ada jadwal shift hari ini</p>
              <p className="mt-1 text-xs text-slate-400">{formatDateLong()}</p>
            </div>
          )}
        </section>

        {/* Menu Cepat */}
        <section className="rounded-xl bg-white p-4 shadow-sm animate-fade-up delay-250">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Menu Cepat</h2>
            <span className="text-[11px] text-slate-400">{quickMenuItems.length} menu</span>
          </div>
          <div className="-mx-4 mt-3 flex items-stretch gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            {quickMenuItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  onClick={() => {
                    const it = item as { href?: string; action?: () => void }
                    if (it.action) it.action()
                    else if (it.href) window.location.href = it.href
                  }}
                  className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5 transition-all duration-200 hover:-translate-y-1 active:scale-95"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E6187]/10 text-[#0E6187] transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
                    <Icon size={20} />
                  </div>
                  <span className="text-center text-[10px] font-medium leading-tight text-slate-600 group-hover:text-slate-900">{item.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Agenda Hari Ini */}
        <section className="rounded-xl bg-white p-4 shadow-sm animate-fade-up delay-300">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Agenda Hari Ini</h2>
            {agendaList.length > 0 && <span className="text-[11px] font-semibold text-[#0E6187]">{agendaList.length} agenda</span>}
          </div>
          {agendaList.length > 0 ? (
            <div className="mt-3 divide-y divide-slate-100">
              {agendaList.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#0E6187]/10">
                    <Calendar size={15} className="text-[#0E6187]" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-700">{a.judul}</p>
                    <p className="text-xs font-medium text-slate-400">{a.tanggal} · {a.waktu}</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">Belum ada agenda hari ini</p>
              <p className="mt-1 text-xs text-slate-400">Agenda yang dibuat akan tampil di sini</p>
            </div>
          )}
        </section>

        {/* Kelas Sensei — only for Guru */}
        {user?.jabatan === 'Guru' && (
          <section className="rounded-xl bg-white p-4 shadow-sm animate-fade-up delay-350">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Kelas Sensei</h2>
              {kelasList.length > 0 && <span className="text-[11px] font-semibold text-[#0E6187]">{kelasList.length} kelas</span>}
            </div>
            {kelasList.length > 0 ? (
              <div className="mt-3 divide-y divide-slate-100">
                {kelasList.slice(0, 3).map(k => (
                  <div key={k.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[#0E6187]/10">
                      <Users size={15} className="text-[#0E6187]" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700">{k.nama}</p>
                      <p className="text-xs font-medium text-slate-400">{k.hari}</p>
                    </div>
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                <p className="text-sm font-semibold text-slate-500">Belum ada kelas aktif</p>
                <p className="mt-1 text-xs text-slate-400">Tambahkan kelas baru untuk mulai absen</p>
              </div>
            )}
          </section>
        )}

        {/* Riwayat Absensi */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm animate-fade-up delay-350">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Riwayat Absensi</h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {monthNamesID[new Date().getMonth()]} {new Date().getFullYear()}
                <span className="mx-1.5">·</span>
                {riwayat.filter(r => r.status === 'hadir' && new Date(r.tanggal).getMonth() === new Date().getMonth()).length} Hari Hadir
              </p>
            </div>
            <a href="/riwayat-absensi-karyawan" className="text-slate-300 transition-colors hover:text-slate-500">
              <ChevronRight size={18} />
            </a>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {['Semua', 'Karyawan', 'Sensei', 'Hadir', 'Terlambat', 'Alpa'].map(f => (
              <button key={f} onClick={() => setRiwayatFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  riwayatFilter === f
                    ? 'bg-[#0E6187] text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          {(() => {
            const filtered = riwayatFilter === 'Semua'
              ? riwayat
              : riwayat.filter(r => {
                  const st = r.status?.toLowerCase()
                  if (riwayatFilter === 'Hadir') return st === 'hadir'
                  if (riwayatFilter === 'Terlambat') return st === 'terlambat'
                  if (riwayatFilter === 'Alpa') return st === 'alpa'
                  if (riwayatFilter === 'Karyawan') return r.role === 'KARYAWAN'
                  if (riwayatFilter === 'Sensei') return r.role === 'SENSEI'
                  return true
                })
            return filtered.length > 0
              ? <div>{filtered.map(r => {
                  const d = new Date(r.tanggal)
                  const dayIdx = d.getDay()
                  const tgl = d.getDate()
                  const status = r.status === 'hadir' ? 'HADIR' : r.status === 'libur' ? 'LIBUR' : r.status === 'izin' ? 'IZIN' : r.status?.toUpperCase() || '—'
                  const statusStyle =
                    status === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                    status === 'LIBUR' ? 'bg-slate-100 text-slate-500' :
                    status === 'IZIN' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  return (
                    <div key={r.id} className="flex items-start gap-3 border-t border-slate-100 px-4 py-3.5 first:border-t-0">
                      <div className="flex w-10 flex-none flex-col items-center">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400">{dayAbbr[dayIdx]}</span>
                        <span className="-mt-0.5 text-lg font-bold text-slate-700">{tgl}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-1.5">
                          <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-500">{r.role || 'KARYAWAN'}</span>
                          <span className="truncate text-xs font-semibold text-slate-700">{r.shift?.nama || 'Dateng Pagi'}</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400">{fullDayNames[dayIdx]}, {tgl} {monthNamesID[d.getMonth()]}</p>
                        <div className="mt-1 flex items-center gap-2 tabular-nums">
                          <span className="text-xs font-semibold text-slate-700">{r.jam_masuk ? r.jam_masuk.slice(0, 8) : '—'}</span>
                          <span className="text-[10px] text-slate-300">—</span>
                          <span className="text-xs font-semibold text-slate-700">{r.jam_keluar ? r.jam_keluar.slice(0, 8) : '—'}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 self-center rounded-md px-2 py-1 text-[10px] font-bold ${statusStyle}`}>{status}</span>
                    </div>
                  )
                })}</div>
              : <div className="px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">Belum ada riwayat absensi</p>
                </div>
          })()}
        </section>
      </div>

      {/* QR Scanner Modal */}
      {showQrScanner && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <QrCode size={18} className="text-[#0E6187]" />
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
                <div id="qr-scanner-dashboard" className="w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-[#0E6187] rounded-xl opacity-70" />
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center mt-3">
                Arahkan kamera ke QR code cabang untuk absen masuk/pulang
              </p>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />

          {/* Close button */}
          <button onClick={stopCamera} className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
            <X size={20} />
          </button>
          {/* Title */}
          <p className="absolute top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-white drop-shadow-lg z-10">
            Absen {cameraMode === 'masuk' ? 'Masuk' : 'Pulang'}
          </p>

          {/* Instruction */}
          <div className="absolute z-10 left-1/2 -translate-x-1/2 text-center" style={{ top: '26%' }}>
            <p className="text-xs font-semibold drop-shadow-lg text-white/70">
              Posisikan wajah Anda pada layar, lalu tekan tombol foto
            </p>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Capture button */}
          <button
            onClick={capturePhoto}
            disabled={processing}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 disabled:opacity-50"
          >
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 backdrop-blur-sm transition-transform active:scale-90">
              <span className="h-12 w-12 rounded-full bg-white" />
            </span>
            <span className="text-[11px] font-bold text-white/80">Ambil Foto</span>
          </button>

          {/* Loading animasi saat proses ambil foto & kirim absensi */}
          {processing && (
            <div className="absolute inset-0 z-[20] bg-black/75 flex flex-col items-center justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-[#4ADE80]/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#4ADE80] animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-[#4ADE80]/20" />
                <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-[#4ADE80] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera size={28} className="text-[#4ADE80]" />
                </div>
              </div>
              <p className="text-white text-sm font-bold mt-5">Mengambil Foto...</p>
              <p className="text-white/60 text-xs mt-1">Memproses absensi Anda, tunggu sebentar</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <KaryawanBottomNav
        activeTab={activeTab}
        absenStatus={absenStatus}
        hasJadwal={jadwal.length > 0}
        onAbsenClick={() => absenStatus === 'pulang' ? null : startCamera(absenStatus === 'masuk' ? 'pulang' : 'masuk')}
      />

      <ThemeToggle floating className="bottom-28" />
    </div>
  )
}