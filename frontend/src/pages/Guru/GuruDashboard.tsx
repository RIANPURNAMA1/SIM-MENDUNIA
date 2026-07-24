import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Calendar, CheckCircle, X, Plus, Users, User,
  ChevronRight, FileText, Clock,
  QrCode, History, BookOpen, ClipboardList, Camera, MapPin, Notebook,
  Award, BarChart3,
} from 'lucide-react'
import api, { guruKelasApi, jadwalLevelApi, APP_URL } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

interface GuruData {
  id: number
  nama: string
  nip: string | null
  mata_pelajaran: string | null
  status: string
}

interface Batch {
  id: number
  nama_batch: string
}

interface KelasItem {
  id: number
  nama_kelas: string
  level: string
  batch_id: number | null
  batch_relasi: { id: number; nama_batch: string } | null
  tanggal_mulai: string
  tanggal_selesai: string
  tanggal_mulai_formatted?: string
  tanggal_selesai_formatted?: string
  catatan: string | null
  status: string
}

interface DashboardData {
  guru: GuruData | null
  user: { id: number; name: string; email: string; foto_profil: string | null }
  kelas_aktif: KelasItem[]
  total_kelas: number
  kehadiran_bulan_ini: number
  riwayat_sensei: {
    id: number
    tanggal: string
    jam_masuk: string | null
    jam_keluar: string | null
    status: string
    kelas_sensei: { nama_kelas: string; level: number; batch_relasi?: { id: number; nama_batch: string } | null } | null
  }[]
  shifts?: { id: number; nama_shift: string; kode_shift: string; jam_masuk: string; jam_pulang: string; toleransi: number }[]
  cabangs?: { id: number; kode_cabang: string; nama_cabang: string; status_pusat: string }[]
}

interface BatchNilai {
  id: number
  nama_batch: string
  total_siswa: number
  levels: {
    level: string
    avg: number | null
    total_penilaian: number
    categories: {
      nama: string
      avg: number | null
      total_penilaian: number
      components: { nama: string; avg: number | null; total_penilaian: number }[]
    }[]
  }[]
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']
const LEVELS = ['1', '2', '3', '4']

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

export default function GuruDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(formatTime())

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ batch_id: '', level: '', tanggal_mulai: '', tanggal_selesai: '', catatan: '' })
  const [saving, setSaving] = useState(false)

  const [absenLoading, setAbsenLoading] = useState<Record<number, boolean>>({})
  const [absenPerKelas, setAbsenPerKelas] = useState<Record<number, { jam_masuk: string | null; jam_keluar: string | null }>>({})

  const [showCamera, setShowCamera] = useState(false)
  const [cameraKelasId, setCameraKelasId] = useState<number | null>(null)
  const [cameraMode, setCameraMode] = useState<'masuk' | 'pulang'>('masuk')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const [batchNilaiList, setBatchNilaiList] = useState<BatchNilai[]>([])
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null)
  const [jadwalLevels, setJadwalLevels] = useState<Record<string, { tanggal_mulai: string; tanggal_selesai: string }>>({})

  const absenStatus: 'belum' | 'masuk' | 'pulang' = kelasList.some(k => absenPerKelas[k.id]?.jam_masuk && !absenPerKelas[k.id]?.jam_keluar)
    ? 'masuk'
    : kelasList.some(k => absenPerKelas[k.id]?.jam_keluar)
      ? 'pulang'
      : 'belum'

  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchDashboard = useCallback(async () => {
    try {
      const dashRes = await api.get('/guru-dashboard')
      setData(prev => prev ? { ...prev, ...dashRes.data } : dashRes.data)
    } catch { }
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/guru-dashboard'),
      guruKelasApi.list(),
      guruKelasApi.batchDanNilai(),
      jadwalLevelApi.list(),
    ]).then(([dashRes, kelasRes, nilaiRes, jadwalRes]) => {
      setData(dashRes.data)
      setKelasList(kelasRes.data.kelas)
      setBatches(kelasRes.data.batches || [])
      setBatchNilaiList(nilaiRes.data.batches || [])
      setJadwalLevels(jadwalRes.data.jadwal || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Poll riwayat setiap 30 detik agar data real-time tanpa refresh
  useEffect(() => {
    const poll = setInterval(fetchDashboard, 30000)
    return () => clearInterval(poll)
  }, [fetchDashboard])

  useEffect(() => {
    if (!kelasList.length) return
    kelasList.forEach(k => checkAbsenStatus(k.id))
  }, [kelasList])

  const checkAbsenStatus = async (kelasId: number) => {
    try {
      const res = await guruKelasApi.cekAbsen(kelasId)
      if (res.data.absen) {
        setAbsenPerKelas(prev => ({ ...prev, [kelasId]: { jam_masuk: res.data.absen.jam_masuk, jam_keluar: res.data.absen.jam_keluar } }))
      }
    } catch { }
  }

  const handleTambahKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    const jadwalKey = `${form.batch_id}-${form.level}`
    const jadwal = jadwalLevels[jadwalKey]
    if (!jadwal) return
    setSaving(true)
    try {
      const batchName = batches.find(b => b.id === Number(form.batch_id))?.nama_batch || ''
      const res = await guruKelasApi.store({
        nama_kelas: batchName,
        batch_id: form.batch_id ? Number(form.batch_id) : null,
        level: form.level,
        tanggal_mulai: jadwal.tanggal_mulai,
        tanggal_selesai: jadwal.tanggal_selesai,
        catatan: form.catatan || null,
      })
      setKelasList(prev => [res.data.data, ...prev])
      setShowModal(false)
      setForm({ batch_id: '', level: '', tanggal_mulai: '', tanggal_selesai: '', catatan: '' })
      fetchDashboard()
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kelas berhasil ditambahkan', timer: 2000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menambahkan kelas' })
    } finally {
      setSaving(false)
    }
  }

  const selectedJadwal = form.batch_id && form.level ? jadwalLevels[`${form.batch_id}-${form.level}`] : null

  const startCamera = useCallback(async (kelasId: number, mode: 'masuk' | 'pulang') => {
    setCameraKelasId(kelasId)
    setCameraMode(mode)
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
    if (!videoRef.current || !canvasRef.current || cameraKelasId === null) return
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
      const kelasId = cameraKelasId
      setAbsenLoading(prev => ({ ...prev, [kelasId]: true }))
      try {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
        })
        const payload: Record<string, unknown> = {
          kelas_id: kelasId,
          foto: base64,
        }
        if (coordsRef.current) {
          payload.lat = coordsRef.current.latitude
          payload.long = coordsRef.current.longitude
        }
        if (cameraMode === 'masuk') {
          const res = await guruKelasApi.absenMasuk(payload)
          if (res.data.success) {
            setAbsenPerKelas(prev => ({ ...prev, [kelasId]: { jam_masuk: res.data.data.jam_masuk, jam_keluar: null } }))
            fetchDashboard()
            Swal.fire({ icon: 'success', title: 'Absen Masuk Berhasil', timer: 2000, showConfirmButton: false })
          }
        } else {
          const res = await guruKelasApi.absenPulang(payload)
          if (res.data.success) {
            setAbsenPerKelas(prev => ({ ...prev, [kelasId]: { jam_masuk: prev[kelasId]?.jam_masuk || '', jam_keluar: res.data.data.jam_keluar } }))
            fetchDashboard()
            Swal.fire({ icon: 'success', title: 'Absen Pulang Berhasil', timer: 2000, showConfirmButton: false })
          }
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Gagal melakukan absensi'
        Swal.fire({ icon: 'error', title: 'Absensi Gagal', text: msg })
      } finally {
        setAbsenLoading(prev => ({ ...prev, [kelasId]: false }))
        setCameraKelasId(null)
      }
    }, 'image/jpeg', 0.8)
  }, [cameraMode, cameraKelasId, stopCamera])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] flex items-center justify-center">
        <p className="text-sm text-gray-500">Gagal memuat data</p>
      </div>
    )
  }

  const { guru, user, kelas_aktif, total_kelas, kehadiran_bulan_ini, riwayat_sensei, shifts, cabangs } = data

  const shiftInfo = shifts && shifts.length > 0 ? shifts[0] : null
  const cabangNames = cabangs && cabangs.length > 0 ? cabangs.map(c => c.nama_cabang).join(', ') : ''

  const statusDotColor = absenStatus === 'pulang' ? 'bg-[#7C8AA5]' : absenStatus === 'masuk' ? 'bg-[#4ADE80]' : 'bg-[#0069b0]'
  const statusLabel = absenStatus === 'pulang' ? 'Selesai' : absenStatus === 'masuk' ? 'Sedang Mengajar' : 'Belum Absen'

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      {/* Brand accent line */}
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      {/* Top Bar */}
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#eef1f6] overflow-hidden flex items-center justify-center flex-none">
              {user?.foto_profil && user.foto_profil.trim() ? (
                <img src={`${APP_URL}/uploads/karyawan/${user.foto_profil}`} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <User size={20} className="text-[#8B90A0]" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-[#14182B] leading-tight">{guru?.nama || user.name}</p>
              <p className="text-[11px] text-[#8B90A0] font-medium">Sensei · {guru?.mata_pelajaran || 'Guru'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F4F5F8] border border-[#E5E7EF] shrink-0">
            <Calendar size={12} className="text-[#8B90A0]" />
            <span className="text-[11px] font-semibold text-[#4B5063]">{formatDateShort(new Date().toISOString())}</span>
          </div>
        </div>
        {(shiftInfo || cabangNames) && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#F0F1F5]">
            {shiftInfo && (
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#4B5063] bg-[#F4F5F8] px-2 py-1 rounded-md">
                <Clock size={11} className="text-[#8B90A0]" />
                Shift: {shiftInfo.nama_shift} · {shiftInfo.jam_masuk.slice(0, 5)}-{shiftInfo.jam_pulang.slice(0, 5)}
              </div>
            )}
            {cabangNames && (
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#4B5063] bg-[#F4F5F8] px-2 py-1 rounded-md">
                <MapPin size={11} className="text-[#8B90A0]" />
                {cabangNames}
              </div>
            )}
          </div>
        )}
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
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
              <span className="text-[10px] font-bold text-white">{statusLabel}</span>
            </div>
          </div>

          <div className="relative mb-4">
            <p className="text-5xl font-bold text-white tabular-nums tracking-tight">{time}</p>
            <p className="text-[11px] text-white/50 font-medium mt-1">Waktu Indonesia Barat</p>
          </div>

          {kelas_aktif.length > 0 && (
            <div className="relative flex flex-wrap gap-2 mt-2">
              {kelas_aktif.slice(0, 2).map(k => {
                const absen = absenPerKelas[k.id]
                const batchNama = k.batch_relasi?.nama_batch
                return (
                  <div key={k.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1.5">
                    <BookOpen size={11} className="text-blue-300" />
                    <span className="text-xs font-bold text-white">{batchNama || `Batch #${k.batch_id}`}</span>
                    {absen?.jam_masuk && (
                      <span className="text-[10px] text-green-300">{absen.jam_masuk.slice(0, 5)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Jadwal Kelas Hari Ini */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Kelas Hari Ini</h3>
            <span className="text-[11px] font-bold text-[#0069b0]">{kelas_aktif.length} kelas</span>
          </div>
          {kelas_aktif.length > 0 ? (
            <div className="space-y-3">
              {kelas_aktif.map(k => {
                const absen = absenPerKelas[k.id]
                const batchNama = k.batch_relasi?.nama_batch
                return (
                  <div key={k.id} className="flex items-center gap-3 pl-3 border-l-2 border-[#0069b0]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#14182B]">{batchNama || `Batch #${k.batch_id}`}</p>
                        <span className="text-[10px] font-semibold text-[#8B90A0] bg-[#F4F5F8] px-1.5 py-0.5 rounded">Level {k.level}</span>
                      </div>
                      <p className="text-[11px] text-[#8B90A0] font-medium">
                        {k.tanggal_mulai_formatted || k.tanggal_mulai} – {k.tanggal_selesai_formatted || k.tanggal_selesai}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!absen ? (
                        <button onClick={() => startCamera(k.id, 'masuk')} disabled={absenLoading[k.id]}
                          className="text-[11px] font-bold text-white bg-[#0069b0] px-3 py-1.5 rounded-lg hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                          {absenLoading[k.id] ? '...' : 'Masuk'}
                        </button>
                      ) : !absen.jam_keluar ? (
                        <button onClick={() => startCamera(k.id, 'pulang')} disabled={absenLoading[k.id]}
                          className="text-[11px] font-bold text-white bg-orange-500 px-3 py-1.5 rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50">
                          {absenLoading[k.id] ? '...' : 'Pulang'}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <CheckCircle size={12} /> Selesai
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar size={22} className="mx-auto text-[#D5D8E3] mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-[#4B5063]">Tidak ada kelas hari ini</p>
              <p className="text-xs text-[#8B90A0] mt-1">{formatDateLong()}</p>
            </div>
          )}
        </section>

        {/* Batch & Nilai */}
        {batchNilaiList.some(batch => batch.levels.some(lvl => lvl.total_penilaian > 0)) && (
          <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Batch & Nilai</h3>
              <BarChart3 size={14} className="text-[#8B90A0]" />
            </div>
            <div className="space-y-4">
              {batchNilaiList.map(batch => (
                <div key={batch.id}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#0069b0]/[0.08] flex items-center justify-center shrink-0">
                      <BookOpen size={14} className="text-[#0069b0]" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#14182B] truncate">{batch.nama_batch}</p>
                      <p className="text-[10px] text-[#8B90A0] font-medium">{batch.total_siswa} siswa</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {batch.levels.map(lvl => {
                      const key = `${batch.id}-${lvl.level}`
                      const isExpanded = expandedLevel === key
                      return (
                        <div key={key} className="rounded-lg border border-[#F0F1F5] overflow-hidden">
                          <button
                            onClick={() => setExpandedLevel(isExpanded ? null : key)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAFBFD] transition-colors"
                          >
                            <span className="text-[11px] font-bold text-[#0069b0] bg-[#0069b0]/[0.07] w-7 h-7 rounded-md flex items-center justify-center shrink-0">
                              L{lvl.level}
                            </span>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#14182B]">Level {lvl.level}</span>
                                <span className="text-[10px] text-[#8B90A0] font-medium">{lvl.total_penilaian} penilaian</span>
                              </div>
                            </div>
                            {lvl.avg !== null ? (
                              <span className={`text-sm font-bold tabular-nums ${lvl.avg >= 85 ? 'text-emerald-600' : lvl.avg >= 70 ? 'text-[#0069b0]' : lvl.avg >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                                {lvl.avg}
                              </span>
                            ) : (
                              <span className="text-xs text-[#C5C8D4] font-medium">—</span>
                            )}
                            <ChevronRight size={14} className={`text-[#C5C8D4] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          {isExpanded && lvl.categories.length > 0 && (
                            <div className="px-3 pb-3 space-y-2 border-t border-[#F0F1F5]">
                              {lvl.categories.map((cat, ci) => (
                                <div key={ci} className="pt-2">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-semibold text-[#4B5063]">{cat.nama}</span>
                                    {cat.avg !== null ? (
                                      <span className={`text-xs font-bold tabular-nums ${cat.avg >= 85 ? 'text-emerald-600' : cat.avg >= 70 ? 'text-[#0069b0]' : cat.avg >= 55 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {cat.avg}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-[#C5C8D4]">—</span>
                                    )}
                                  </div>
                                  {cat.components.length > 0 && (
                                    <div className="space-y-1 ml-2 border-l-2 border-[#F0F1F5] pl-3">
                                      {cat.components.map((comp, cpi) => (
                                        <div key={cpi} className="flex items-center justify-between">
                                          <span className="text-[10px] text-[#8B90A0] font-medium">{comp.nama}</span>
                                          {comp.avg !== null ? (
                                            <span className="text-[10px] font-semibold text-[#4B5063] tabular-nums">{comp.avg}</span>
                                          ) : (
                                            <span className="text-[10px] text-[#C5C8D4]">—</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {isExpanded && lvl.categories.length === 0 && (
                            <div className="px-3 pb-3 pt-2 border-t border-[#F0F1F5]">
                              <p className="text-[10px] text-[#C5C8D4] font-medium text-center">Belum ada komponen penilaian untuk level ini</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu Cepat */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-4">Menu Cepat</h3>
          <div className="grid grid-cols-5 gap-2">
            {[
              { icon: BookOpen, label: 'Kelas', action: () => setShowModal(true) },
              { icon: ClipboardList, label: 'Data Siswa', href: '/guru-data-siswa' },
              { icon: Notebook, label: 'Penilaian', href: '/guru-data-siswa' },
              { icon: FileText, label: 'Izin/Sakit', href: '/pengajuan-izin' },
              { icon: History, label: 'Riwayat', href: '/riwayat-absensi-karyawan' },
              { icon: Clock, label: 'Lembur', href: '/lembur-karyawan' },
              { icon: BookOpen, label: 'LMS', href: '/guru-lms' },
            ].map((item, i) => (
              <button key={i} onClick={() => item.href ? window.location.href = item.href : item.action?.()}
                className="flex flex-col items-center gap-2 py-3 rounded-lg hover:bg-[#F4F5F8] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center">
                  <item.icon size={17} className="text-[#0069b0]" strokeWidth={1.8} />
                </div>
                <span className="text-[10.5px] font-semibold text-[#4B5063] leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Kelas Sensei */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Kelas Sensei</h3>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#0069b0] hover:text-[#004d7a] transition-colors">
              <Plus size={13} /> Tambah
            </button>
          </div>
          {kelasList.length > 0 ? (
            <div className="divide-y divide-[#F0F1F5]">
              {kelasList.map(k => {
                const absen = absenPerKelas[k.id]
                const batchNama = k.batch_relasi?.nama_batch
                return (
                  <div key={k.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                      <Users size={15} className="text-[#0069b0]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#14182B] truncate">{batchNama || `Batch #${k.batch_id}`}</p>
                        <span className="text-[10px] font-semibold text-[#8B90A0] bg-[#F4F5F8] px-1.5 py-0.5 rounded shrink-0">Level {k.level}</span>
                      </div>
                      <p className="text-[11px] text-[#8B90A0] font-medium">
                        {k.tanggal_mulai_formatted || k.tanggal_mulai} – {k.tanggal_selesai_formatted || k.tanggal_selesai}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!absen ? (
                        <button onClick={() => startCamera(k.id, 'masuk')} disabled={absenLoading[k.id]}
                          className="text-[10px] font-bold text-white bg-[#0069b0] px-2.5 py-1.5 rounded-lg hover:bg-[#004d7a] transition-colors disabled:opacity-50">
                          {absenLoading[k.id] ? '...' : 'Masuk'}
                        </button>
                      ) : !absen.jam_keluar ? (
                        <button onClick={() => startCamera(k.id, 'pulang')} disabled={absenLoading[k.id]}
                          className="text-[10px] font-bold text-white bg-orange-500 px-2.5 py-1.5 rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50">
                          {absenLoading[k.id] ? '...' : 'Pulang'}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                          <CheckCircle size={11} /> Selesai
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm font-semibold text-[#4B5063]">Belum ada kelas</p>
              <p className="text-xs text-[#8B90A0] mt-1">Ketuk "Tambah" untuk membuat kelas baru</p>
            </div>
          )}
        </section>

        {/* Riwayat Absensi */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h3 className="text-[13px] font-bold text-[#14182B]">Riwayat Absensi</h3>
              <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                {monthNamesID[new Date().getMonth()]} {new Date().getFullYear()}
                <span className="mx-1.5">·</span>
                {riwayat_sensei.filter(r => r.status === 'HADIR').length} Hari Hadir
              </p>
            </div>
            <ChevronRight size={18} className="text-[#8B90A0]" />
          </div>

          {riwayat_sensei.length > 0 ? (
            <div>
              {riwayat_sensei.map(r => {
                const d = new Date(r.tanggal)
                const dayIdx = d.getDay()
                const tgl = d.getDate()
                const status = r.status
                const statusStyle =
                  status === 'HADIR' ? 'bg-[#DCFCE7] text-[#15803D]' :
                  status === 'TERLAMBAT' ? 'bg-[#FEF3C7] text-[#B45309]' :
                  status === 'LIBUR' ? 'bg-[#F0F1F5] text-[#6B7280]' :
                  'bg-[#FEE2E2] text-[#B91C1C]'
                return (
                  <div key={r.id} className="flex items-start gap-3 px-5 py-3.5 border-t border-[#F0F1F5]">
                    <div className="flex flex-col items-center w-10 flex-none">
                      <span className="text-[10px] font-bold text-[#8B90A0] tracking-wider">{dayAbbr[dayIdx]}</span>
                      <span className="text-lg font-bold text-[#14182B] -mt-0.5">{tgl}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold text-[#6B7280] bg-[#F0F1F5] px-1.5 py-0.5 rounded-sm tracking-wide">SENSEI</span>
                        <span className="text-xs font-semibold text-[#14182B] truncate">{r.kelas_sensei?.batch_relasi?.nama_batch || r.kelas_sensei?.nama_kelas || '-'}</span>
                      </div>
                      <p className="text-[11px] text-[#8B90A0] font-medium">{dayNames[dayIdx]}, {tgl} {monthNamesID[d.getMonth()]}</p>
                      <div className="flex items-center gap-2 mt-1 tabular-nums">
                        <span className="text-xs font-semibold text-[#14182B]">{r.jam_masuk ? r.jam_masuk.slice(0, 8) : '—'}</span>
                        <span className="text-[10px] text-[#C5C8D4]">—</span>
                        <span className="text-xs font-semibold text-[#14182B]">{r.jam_keluar ? r.jam_keluar.slice(0, 8) : '—'}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold self-center ${statusStyle}`}>{status}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-5">
              <p className="text-sm font-semibold text-[#4B5063]">Belum ada riwayat absensi</p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Navigation */}
      <KaryawanBottomNav
        activeTab="home"
        absenStatus={absenStatus}
        hasJadwal={kelas_aktif.length > 0}
        homeHref="/guru-dashboard"
        jadwalHref="/guru-dashboard"
        laporanHref="/guru-dashboard"
        profilHref="/guru-profil"
      />

      {/* ===== MODAL TAMBAH KELAS ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg mx-3 bg-white rounded-xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Tambah Kelas Baru</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTambahKelas} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>
                  <select value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="">Pilih Batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.nama_batch}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Level <span className="text-red-500">*</span></label>
                  <select required value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                    <option value="">Pilih Level</option>
                    {LEVELS.map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
              </div>
              {form.batch_id && form.level && !selectedJadwal && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Jadwal belum diatur untuk batch & level ini. Silakan hubungi admin untuk mengatur jadwal terlebih dahulu.
                </div>
              )}
              {selectedJadwal && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Mulai</label>
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {new Date(selectedJadwal.tanggal_mulai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Selesai</label>
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      {new Date(selectedJadwal.tanggal_selesai + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Catatan <span className="text-gray-400">(Opsional)</span></label>
                <textarea value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0] resize-none" rows={2} placeholder="Tambahkan catatan jika diperlukan..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                  Batal
                </button>
                <button type="submit" disabled={saving || !selectedJadwal}
                  className="rounded-lg bg-[#0069b0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CAMERA MODAL ===== */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={stopCamera}>
          <div className="relative w-full max-w-sm mx-3 bg-black rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover" style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                {cameraMode === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
              </span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                <button onClick={stopCamera}
                  className="px-4 py-2 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition">
                  Batal
                </button>
                <button onClick={capturePhoto}
                  className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform">
                  <div className="w-10 h-10 rounded-full bg-white" />
                </button>
                <div className="w-16" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
