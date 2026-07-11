import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { absensiKaryawanApi, agendaApi, kelasSenseiApi } from '../../services/api'
import { Camera, MapPin, CheckCircle, X, Calendar,
  Plus, Users, User,
  ChevronRight, Briefcase, LogIn, LogOut,
  QrCode, FileText, History, Clock, ClipboardList,
} from 'lucide-react'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

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

export default function KaryawanDashboard() {
  const { user } = useAuth()
  const [time, setTime] = useState(formatTime())
  const [activeTab, setActiveTab] = useState('home')

  const [absenStatus, setAbsenStatus] = useState<'belum' | 'masuk' | 'pulang'>('belum')
  const [jamMasuk, setJamMasuk] = useState('')
  const [jamKeluar, setJamKeluar] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error' | 'ok'>('idle')

  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'masuk' | 'pulang'>('masuk')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
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

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      stopCamera()
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append('foto', blob, 'absen.jpg')
        if (coordsRef.current) {
          formData.append('latitude', String(coordsRef.current.latitude))
          formData.append('longitude', String(coordsRef.current.longitude))
        }

        if (cameraMode === 'masuk') {
          await absensiKaryawanApi.masuk(formData as unknown as Record<string, unknown>)
          setAbsenStatus('masuk')
          setJamMasuk(formatTime())
          Swal.fire({ icon: 'success', title: 'Absen Masuk Berhasil', timer: 2000, showConfirmButton: false })
        } else {
          await absensiKaryawanApi.pulang(formData as unknown as Record<string, unknown>)
          setAbsenStatus('pulang')
          setJamKeluar(formatTime())
          Swal.fire({ icon: 'success', title: 'Absen Pulang Berhasil', timer: 2000, showConfirmButton: false })
        }
        loadData()
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal melakukan absensi'
        Swal.fire({ icon: 'error', title: 'Absensi Gagal', text: msg })
      } finally {
        setIsSubmitting(false)
      }
    }, 'image/jpeg', 0.8)
  }, [cameraMode, stopCamera])

  const statusLabel = () => {
    if (absenStatus === 'pulang') return 'Selesai'
    if (absenStatus === 'masuk') return 'Sedang Bekerja'
    return 'Belum Absen'
  }

  const statusDotColor = () => {
    if (absenStatus === 'pulang') return 'bg-[#7C8AA5]'
    if (absenStatus === 'masuk') return 'bg-[#4ADE80]'
    return 'bg-[#0069b0]'
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      {/* Brand accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      {/* Top Bar */}
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eef1f6] overflow-hidden flex items-center justify-center flex-none">
            {user?.foto_profil && user.foto_profil.trim() ? (
              <img src={`http://localhost:8000/uploads/karyawan/${user.foto_profil}`} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : (
              <User size={20} className="text-[#8B90A0]" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#14182B] leading-tight">{user?.name || 'Karyawan'}</p>
            <p className="text-[11px] text-[#8B90A0] font-medium">{user?.jabatan || 'Karyawan'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F4F5F8] border border-[#E5E7EF]">
          <Calendar size={12} className="text-[#8B90A0]" />
          <span className="text-[11px] font-semibold text-[#4B5063]">{formatDateShort(new Date().toISOString())}</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
        {/* Hero Attendance Card */}
        <div className="relative rounded-2xl bg-[#0069b0] p-6 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.03]" />
          <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-[#0069b0]/[0.08]" />

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
        </div>

        {/* Jadwal Shift Hari Ini */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Jadwal Shift Hari Ini</h3>
          </div>
          {jadwal.length > 0 ? (
            <div className="space-y-3">
              {jadwal.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-center gap-3 pl-3 border-l-2 border-[#0069b0]">
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#14182B]">{s.nama}</p>
                      <p className="text-[11px] text-[#8B90A0] font-medium">Status aktif</p>
                    </div>
                    <p className="text-sm font-bold text-[#0069b0] tabular-nums">{s.jam_mulai}–{s.jam_selesai}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar size={22} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-[#4B5063]">Tidak ada jadwal shift hari ini</p>
              <p className="text-xs text-[#8B90A0] mt-1">{formatDateLong()}</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-4">Menu Cepat</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: QrCode, label: 'Scan QR' },
              { icon: FileText, label: 'Izin/Sakit', href: '/pengajuan-izin' },
              { icon: History, label: 'Riwayat', href: '/riwayat-absensi-karyawan' },
              { icon: Clock, label: 'Lembur', href: '/lembur-karyawan' },
              { icon: Calendar, label: 'Jadwal', href: '/jadwal-karyawan' },
              ...(user?.role === 'GURU' || user?.jabatan === 'Guru' ? [{ icon: ClipboardList, label: 'Data Siswa', href: '/guru-data-siswa' }] : []),
              ...(user?.jabatan === 'Guru' ? [{ icon: Users, label: 'Sensei' }] : []),
            ].map((item, i) => (
              <button key={i} onClick={() => item.href && (window.location.href = item.href)} className="flex flex-col items-center gap-2 py-3 rounded-lg hover:bg-[#F4F5F8] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center">
                  <item.icon size={17} className="text-[#0069b0]" strokeWidth={1.8} />
                </div>
                <span className="text-[10.5px] font-semibold text-[#4B5063] leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Agenda Hari Ini */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Agenda Hari Ini</h3>
            <button className="flex items-center gap-1 text-xs font-bold text-[#0069b0] hover:text-[#004d7a] transition-colors">
              <Plus size={13} /> Tambah
            </button>
          </div>
          {agendaList.length > 0 ? (
            <div className="divide-y divide-[#F0F1F5]">
              {agendaList.slice(0, 3).map(a => (
                <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                    <Calendar size={15} className="text-[#0069b0]" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#14182B] truncate">{a.judul}</p>
                    <p className="text-xs text-[#8B90A0] font-medium">{a.tanggal} · {a.waktu}</p>
                  </div>
                  <ChevronRight size={15} className="text-[#D5D8E3]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-[#4B5063]">Belum ada agenda hari ini</p>
              <p className="text-xs text-[#8B90A0] mt-1">Ketuk "Tambah" untuk membuat agenda</p>
            </div>
          )}
        </section>

        {/* Kelas Sensei — only for Guru */}
        {user?.jabatan === 'Guru' && (
          <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Kelas Sensei</h3>
              <button className="flex items-center gap-1 text-xs font-bold text-[#0069b0] hover:text-[#004d7a] transition-colors">
                <Plus size={13} /> Tambah
              </button>
            </div>
            {kelasList.length > 0 ? (
              <div className="divide-y divide-[#F0F1F5]">
                {kelasList.slice(0, 3).map(k => (
                  <div key={k.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                      <Users size={15} className="text-[#0069b0]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#14182B] truncate">{k.nama}</p>
                      <p className="text-xs text-[#8B90A0] font-medium">{k.hari}</p>
                    </div>
                    <ChevronRight size={15} className="text-[#D5D8E3]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-[#4B5063]">Belum ada kelas aktif</p>
                <p className="text-xs text-[#8B90A0] mt-1">Tambahkan kelas baru untuk mulai absen</p>
              </div>
            )}
          </section>
        )}

        {/* Riwayat Absensi */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="text-[13px] font-bold text-[#14182B]">Riwayat Absensi</h3>
              <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                {monthNamesID[new Date().getMonth()]} {new Date().getFullYear()}
                <span className="mx-1.5">·</span>
                {riwayat.filter(r => r.status === 'hadir' && new Date(r.tanggal).getMonth() === new Date().getMonth()).length} Hari Hadir
              </p>
            </div>
            <a href="/riwayat-absensi-karyawan" className="text-[#8B90A0] hover:text-[#14182B] transition-colors">
              <ChevronRight size={18} />
            </a>
          </div>

          {/* Filter Pills */}
          <div className="px-5 pb-2 flex gap-1.5 overflow-x-auto scrollbar-none">
            {['Semua', 'Karyawan', 'Sensei', 'Hadir', 'Terlambat', 'Alpa'].map(f => (
              <button key={f} onClick={() => setRiwayatFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${
                  riwayatFilter === f
                    ? 'bg-[#0069b0] text-white'
                    : 'bg-[#F4F5F8] text-[#6B7280] hover:bg-[#E5E7EF]'
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
                    status === 'HADIR' ? 'bg-[#DCFCE7] text-[#15803D]' :
                    status === 'LIBUR' ? 'bg-[#F0F1F5] text-[#6B7280]' :
                    status === 'IZIN' ? 'bg-[#FEF3C7] text-[#B45309]' :
                    'bg-[#FEE2E2] text-[#B91C1C]'
                  return (
                    <div key={r.id} className="flex items-start gap-3 px-5 py-3.5 border-t border-[#F0F1F5] first:border-t-0">
                      <div className="flex flex-col items-center w-10 flex-none">
                        <span className="text-[10px] font-bold text-[#8B90A0] tracking-wider">{dayAbbr[dayIdx]}</span>
                        <span className="text-lg font-bold text-[#14182B] -mt-0.5">{tgl}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold text-[#6B7280] bg-[#F0F1F5] px-1.5 py-0.5 rounded-sm tracking-wide">{r.role || 'KARYAWAN'}</span>
                          <span className="text-xs font-semibold text-[#14182B] truncate">{r.shift?.nama || 'Dateng Pagi'}</span>
                        </div>
                        <p className="text-[11px] text-[#8B90A0] font-medium">{fullDayNames[dayIdx]}, {tgl} {monthNamesID[d.getMonth()]}</p>
                        <div className="flex items-center gap-2 mt-1 tabular-nums">
                          <span className="text-xs font-semibold text-[#14182B]">{r.jam_masuk ? r.jam_masuk.slice(0, 8) : '—'}</span>
                          <span className="text-[10px] text-[#C5C8D4]">—</span>
                          <span className="text-xs font-semibold text-[#14182B]">{r.jam_keluar ? r.jam_keluar.slice(0, 8) : '—'}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold self-center ${statusStyle}`}>{status}</span>
                    </div>
                  )
                })}</div>
              : <div className="text-center py-8 px-5">
                  <p className="text-sm font-semibold text-[#4B5063]">Belum ada riwayat absensi</p>
                </div>
          })()}
        </section>
      </div>

      {/* Camera Modal — Full Screen */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />
          {/* Close button */}
          <button onClick={stopCamera} className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10">
            <X size={20} />
          </button>
          {/* Title */}
          <p className="absolute top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-white drop-shadow-lg z-10">
            Absen {cameraMode === 'masuk' ? 'Masuk' : 'Pulang'}
          </p>
          {/* Capture button */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
            <button onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-[4px] border-white/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl">
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Bottom Navigation */}
      <KaryawanBottomNav
        activeTab={activeTab}
        absenStatus={absenStatus}
        hasJadwal={jadwal.length > 0}
        onAbsenClick={() => absenStatus === 'pulang' ? null : startCamera(absenStatus === 'masuk' ? 'pulang' : 'masuk')}
      />
    </div>
  )
}