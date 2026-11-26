import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, CheckCircle, X, Plus, Users, User,
  ChevronRight, FileText, Clock,
  QrCode, History, BookOpen, ClipboardList, Camera, MapPin, Notebook,
  Award, BarChart3, Upload, Link2, Paperclip, Trash2, FileCheck2, Banknote,
  LogIn, LogOut, CalendarCheck, Layers, GraduationCap,
} from 'lucide-react'
import api, { guruKelasApi, jadwalLevelApi, APP_URL, quizReferenceApi } from '../../services/api'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

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

interface RefCategory {
  id: number
  name: string
}

interface MyReference {
  id: number
  title: string
  description: string | null
  link: string | null
  file_name: string | null
  file_url: string | null
  status: string
  note: string | null
  created_at: string
  category: { id: number; name: string } | null
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dayAbbr = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB']

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

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'clean'],
  ],
}

const quillFormats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'ordered', 'link']

function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold text-[#14182B]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] font-medium text-[#8B90A0]">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export default function GuruDashboard() {
  const navigate = useNavigate()
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
  const [selectedKelasId, setSelectedKelasId] = useState<number | null>(null)
  const [jadwalLevels, setJadwalLevels] = useState<Record<string, { tanggal_mulai: string; tanggal_selesai: string }>>({})

  const [showRefModal, setShowRefModal] = useState(false)
  const [refForm, setRefForm] = useState({ title: '', category_id: '', link: '', description: '' })
  const [refFile, setRefFile] = useState<File | null>(null)
  const [refSaving, setRefSaving] = useState(false)
  const [refCategories, setRefCategories] = useState<RefCategory[]>([])
  const [myReferences, setMyReferences] = useState<MyReference[]>([])
  const [refLoading, setRefLoading] = useState(false)

  const refStatusStyle: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600',
    diproses: 'bg-blue-50 text-blue-600',
    selesai: 'bg-emerald-50 text-emerald-600',
    ditolak: 'bg-red-50 text-red-600',
  }

  const openRefModal = useCallback(async () => {
    setShowRefModal(true)
    setRefLoading(true)
    try {
      const [metaRes, listRes] = await Promise.all([quizReferenceApi.guruMeta(), quizReferenceApi.guruList()])
      setRefCategories(metaRes.data.categories || [])
      setMyReferences(listRes.data.references || [])
    } catch { } finally {
      setRefLoading(false)
    }
  }, [])

  const handleKirimReferensi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refForm.title.trim()) {
      Swal.fire({ icon: 'warning', title: 'Judul wajib diisi', timer: 2000, showConfirmButton: false })
      return
    }
    if (!refForm.category_id) {
      Swal.fire({ icon: 'warning', title: 'Kategori wajib dipilih', timer: 2000, showConfirmButton: false })
      return
    }
    const hasTextRef = refForm.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
    if (!refFile && !refForm.link.trim() && !hasTextRef) {
      Swal.fire({ icon: 'warning', title: 'Isi soal di kolom teks, lampirkan file, atau isi link', timer: 2500, showConfirmButton: false })
      return
    }
    setRefSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', refForm.title)
      if (refForm.category_id) fd.append('category_id', refForm.category_id)
      if (refForm.description) fd.append('description', refForm.description)
      if (refForm.link.trim()) fd.append('link', refForm.link.trim())
      if (refFile) fd.append('file', refFile)
      const res = await quizReferenceApi.guruStore(fd)
      setMyReferences(prev => [res.data.reference, ...prev])
      setRefForm({ title: '', category_id: '', link: '', description: '' })
      setRefFile(null)
      Swal.fire({ icon: 'success', title: 'Referensi Terkirim', text: 'Menunggu diproses manager', timer: 2000, showConfirmButton: false })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.errors?.title?.[0] || 'Gagal mengirim referensi'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setRefSaving(false)
    }
  }

  const handleHapusReferensi = async (ref: MyReference) => {
    const confirm = await Swal.fire({
      title: 'Hapus referensi ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    })
    if (!confirm.isConfirmed) return
    try {
      await quizReferenceApi.guruDestroy(ref.id)
      setMyReferences(prev => prev.filter(r => r.id !== ref.id))
      Swal.fire({ icon: 'success', title: 'Dihapus', timer: 1500, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal menghapus' })
    }
  }

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
    if (duplicateKelas) {
      Swal.fire({ icon: 'warning', title: 'Duplikat', text: 'Kelas untuk batch & level ini sudah dibuat. Tidak boleh duplikat.' })
      return
    }
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
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kelas & kursus LMS dibuat otomatis', timer: 2000, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.message
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg || 'Gagal menambahkan kelas' })
    } finally {
      setSaving(false)
    }
  }

  const selectedJadwal = form.batch_id && form.level ? jadwalLevels[`${form.batch_id}-${form.level}`] : null

  const availableLevels = useMemo(() => {
    if (!form.batch_id) return []
    return Object.keys(jadwalLevels)
      .filter(key => key.startsWith(`${form.batch_id}-`))
      .map(key => key.split('-')[1])
      .sort()
  }, [form.batch_id, jadwalLevels])

  const duplicateKelas = form.batch_id && form.level ? kelasList.some(k =>
    k.batch_id === Number(form.batch_id) && String(k.level) === String(form.level)
  ) : false

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
        const payload: { kelas_id: number; foto: string; lat?: number; long?: number } = {
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

  const statusDotColor = absenStatus === 'pulang' ? 'bg-slate-300' : absenStatus === 'masuk' ? 'bg-[#4ADE80]' : 'bg-yellow-300'
  const statusLabel = absenStatus === 'pulang' ? 'Selesai Mengajar' : absenStatus === 'masuk' ? 'Sedang Mengajar' : 'Belum Absen'

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
  const todayStart = new Date(new Date().toDateString())
  const isKelasSelesai = (k: KelasItem) => new Date(k.tanggal_selesai) < todayStart
  const kelasLabel = (k: KelasItem) => k.batch_relasi?.nama_batch || `Batch #${k.batch_id}`
  const kelasPeriode = (k: KelasItem) => `${k.tanggal_mulai_formatted || k.tanggal_mulai} – ${k.tanggal_selesai_formatted || k.tanggal_selesai}`
  const scoreStyle = (v: number) =>
    v >= 170 ? 'bg-emerald-50 text-emerald-600' : v >= 140 ? 'bg-blue-50 text-[#0069b0]' : v >= 110 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'

  const riwayatKelasId = selectedKelasId ?? kelasList[0]?.id ?? null
  const riwayatKelas = kelasList.find(k => k.id === riwayatKelasId)
  const classRiwayat = riwayatKelas
    ? riwayat_sensei.filter(r =>
        r.kelas_sensei?.batch_relasi?.nama_batch === riwayatKelas.batch_relasi?.nama_batch &&
        String(r.kelas_sensei?.level) === String(riwayatKelas.level))
    : []
  const hadirCount = classRiwayat.filter(r => r.status === 'HADIR').length

  const renderAbsenAction = (k: KelasItem, full = false) => {
    const absen = absenPerKelas[k.id]
    const size = full ? 'w-full justify-center py-3 rounded-xl text-sm' : 'px-3 py-2 rounded-xl text-[11px]'
    if (isKelasSelesai(k) || absen?.jam_keluar) {
      return (
        <span className={`flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 ${size}`}>
          <CheckCircle size={full ? 16 : 13} /> Selesai
        </span>
      )
    }
    const mode: 'masuk' | 'pulang' = !absen ? 'masuk' : 'pulang'
    const Icon = mode === 'masuk' ? LogIn : LogOut
    return (
      <button onClick={() => startCamera(k.id, mode)} disabled={absenLoading[k.id]}
        className={`flex items-center gap-1.5 font-bold text-white transition active:scale-[0.97] disabled:opacity-50 ${
          mode === 'masuk'
            ? 'bg-[#0069b0] hover:bg-[#004d7a] shadow-md shadow-[#0069b0]/25'
            : 'bg-orange-500 hover:bg-orange-400 shadow-md shadow-orange-500/25'
        } ${size}`}>
        {absenLoading[k.id] ? 'Memproses...' : (
          <>
            <Icon size={full ? 16 : 13} />
            {full ? (mode === 'masuk' ? 'Absen Masuk' : 'Absen Pulang') : (mode === 'masuk' ? 'Masuk' : 'Pulang')}
          </>
        )}
      </button>
    )
  }

  const quickMenu: { icon: typeof BookOpen; label: string; tone: string; href?: string; action?: () => void }[] = [
    { icon: Plus, label: 'Tambah Kelas', tone: 'bg-sky-50 text-sky-600', action: () => setShowModal(true) },
    { icon: ClipboardList, label: 'Data Siswa', tone: 'bg-blue-50 text-blue-600', href: '/guru-data-siswa' },
    { icon: Notebook, label: 'Penilaian', tone: 'bg-violet-50 text-violet-600', href: '/guru-data-siswa' },
    { icon: BookOpen, label: 'Kelas Mendunia', tone: 'bg-indigo-50 text-indigo-600', href: '/guru-lms' },
    { icon: FileText, label: 'Izin Sensei', tone: 'bg-amber-50 text-amber-600', href: '/izin-sensei' },
    { icon: Clock, label: 'Lembur', tone: 'bg-orange-50 text-orange-600', href: '/lembur-karyawan' },
    { icon: History, label: 'Riwayat Absen', tone: 'bg-teal-50 text-teal-600', href: '/riwayat-absensi-karyawan' },
    { icon: Upload, label: 'Referensi Quiz', tone: 'bg-pink-50 text-pink-600', action: () => openRefModal() },
    { icon: Banknote, label: 'Pengajuan Gaji', tone: 'bg-emerald-50 text-emerald-600', href: '/guru-pengajuan-gaji' },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-28">
      {/* ===== HERO HEADER ===== */}
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-br from-[#0079c9] via-[#0069b0] to-[#00426f] px-5 pt-6 pb-24">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.07]" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/[0.05]" />
        <div className="pointer-events-none absolute right-10 bottom-10 h-16 w-16 rounded-full border border-white/10" />

        <div className="relative mx-auto max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-2 ring-white/25">
                {user?.foto_profil && user.foto_profil.trim() ? (
                  <img src={`${APP_URL}/uploads/foto_profil/${user.foto_profil}`} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <User size={22} className="text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/70">{greeting},</p>
                <p className="truncate text-base font-bold leading-tight text-white">{guru?.nama || user.name}</p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-white/60">Sensei · {guru?.mata_pelajaran || 'Guru'}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center rounded-2xl bg-white/10 px-3 py-1.5 ring-1 ring-white/15">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">{dayAbbr[new Date().getDay()]}</span>
              <span className="text-lg font-bold leading-none text-white">{new Date().getDate()}</span>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[44px] font-bold leading-none tracking-tight text-white tabular-nums">{time}</p>
              <p className="mt-2 text-xs font-medium text-white/70">{formatDateLong()} · WIB</p>
            </div>
            <div className="mb-1 flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">
              <span className={`h-2 w-2 rounded-full ${statusDotColor} ${absenStatus === 'masuk' ? 'animate-pulse' : ''}`} />
              <span className="text-[11px] font-bold text-white">{statusLabel}</span>
            </div>
          </div>

          {(shiftInfo || cabangNames) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {shiftInfo && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                  <Clock size={12} /> {shiftInfo.nama_shift} · {shiftInfo.jam_masuk.slice(0, 5)}–{shiftInfo.jam_pulang.slice(0, 5)}
                </span>
              )}
              {cabangNames && (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90">
                  <MapPin size={12} className="shrink-0" /> <span className="truncate">{cabangNames}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="relative mx-auto -mt-16 max-w-lg space-y-6 px-4">
        {/* ===== STATS ===== */}
        <div className="grid grid-cols-3 divide-x divide-[#F0F1F5] rounded-2xl border border-[#E5E7EF] bg-white py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {[
            { label: 'Kelas Hari Ini', value: kelas_aktif.length, icon: CalendarCheck, tone: 'text-[#0069b0]' },
            { label: 'Total Kelas', value: total_kelas, icon: Layers, tone: 'text-violet-600' },
            { label: 'Hadir Bulan Ini', value: kehadiran_bulan_ini, icon: CheckCircle, tone: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center px-2 text-center">
              <s.icon size={16} className={s.tone} />
              <p className="mt-1.5 text-xl font-bold text-[#14182B] tabular-nums">{s.value ?? 0}</p>
              <p className="text-[10px] font-semibold leading-tight text-[#8B90A0]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ===== KELAS HARI INI ===== */}
        <section>
          <SectionTitle title="Kelas Hari Ini" right={<span className="rounded-full bg-[#0069b0]/[0.08] px-2.5 py-1 text-[11px] font-bold text-[#0069b0]">{kelas_aktif.length} kelas</span>} />
          {kelas_aktif.length > 0 ? (
            <div className="space-y-3">
              {kelas_aktif.map(k => {
                const absen = absenPerKelas[k.id]
                return (
                  <div key={k.id} className="rounded-2xl border border-[#E5E7EF] bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#0069b0]/[0.08] text-[#0069b0]">
                        <span className="text-[9px] font-bold uppercase leading-none tracking-wider">Lv</span>
                        <span className="text-lg font-bold leading-tight">{k.level}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-bold leading-snug text-[#14182B]">{kelasLabel(k)}</p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#8B90A0]">
                          <Calendar size={11} className="shrink-0" /> {kelasPeriode(k)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#F4F5F8] px-3 py-2">
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-[#8B90A0]"><LogIn size={11} /> Masuk</p>
                        <p className="text-sm font-bold text-[#14182B] tabular-nums">{absen?.jam_masuk ? absen.jam_masuk.slice(0, 5) : '--:--'}</p>
                      </div>
                      <div className="rounded-xl bg-[#F4F5F8] px-3 py-2">
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-[#8B90A0]"><LogOut size={11} /> Pulang</p>
                        <p className="text-sm font-bold text-[#14182B] tabular-nums">{absen?.jam_keluar ? absen.jam_keluar.slice(0, 5) : '--:--'}</p>
                      </div>
                    </div>
                    <div className="mt-3">{renderAbsenAction(k, true)}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D6D9E1] bg-white px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F5F8]">
                <Calendar size={22} className="text-[#8B90A0]" strokeWidth={1.6} />
              </div>
              <p className="text-sm font-bold text-[#14182B]">Tidak ada kelas hari ini</p>
              <p className="mt-1 text-xs text-[#8B90A0]">Nikmati waktu istirahat Anda, Sensei</p>
            </div>
          )}
        </section>

        {/* ===== MENU CEPAT ===== */}
        <section>
          <SectionTitle title="Menu Cepat" />
          <div className="grid grid-cols-3 gap-2.5">
            {quickMenu.map(item => (
              <button key={item.label} onClick={() => item.href ? navigate(item.href) : item.action?.()}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#E5E7EF] bg-white px-2 py-3.5 transition hover:border-[#D6D9E1] hover:shadow-sm active:scale-95">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon size={19} strokeWidth={2} />
                </div>
                <span className="text-center text-[11px] font-semibold leading-tight text-[#4B5063]">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ===== BATCH & NILAI ===== */}
        {batchNilaiList.some(batch => batch.levels.some(lvl => lvl.total_penilaian > 0)) && (
          <section>
            <SectionTitle title="Batch & Nilai" right={<BarChart3 size={15} className="text-[#8B90A0]" />} />
            <div className="space-y-3">
              {batchNilaiList.map(batch => (
                <div key={batch.id} className="rounded-2xl border border-[#E5E7EF] bg-white p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0069b0]/[0.08]">
                      <GraduationCap size={18} className="text-[#0069b0]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold leading-snug text-[#14182B]">{batch.nama_batch}</p>
                      <p className="text-[11px] font-medium text-[#8B90A0]">{batch.total_siswa} siswa</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {batch.levels.map(lvl => {
                      const key = `${batch.id}-${lvl.level}`
                      const isExpanded = expandedLevel === key
                      return (
                        <div key={key} className={`overflow-hidden rounded-xl border transition-colors ${isExpanded ? 'border-[#0069b0]/30' : 'border-[#F0F1F5]'}`}>
                          <button onClick={() => setExpandedLevel(isExpanded ? null : key)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 transition-colors hover:bg-[#FAFBFD]">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F5F8] text-[11px] font-bold text-[#4B5063]">
                              L{lvl.level}
                            </span>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-xs font-bold text-[#14182B]">Level {lvl.level}</p>
                              <p className="text-[10px] font-medium text-[#8B90A0]">{lvl.total_penilaian} penilaian</p>
                            </div>
                            {lvl.avg !== null ? (
                              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${scoreStyle(lvl.avg)}`}>{lvl.avg}</span>
                            ) : (
                              <span className="text-xs font-medium text-[#C5C8D4]">—</span>
                            )}
                            <ChevronRight size={15} className={`shrink-0 text-[#C5C8D4] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                          {isExpanded && (
                            <div className="space-y-2 border-t border-[#F0F1F5] bg-[#FAFBFD] px-3 pb-3">
                              {lvl.categories.length === 0 ? (
                                <p className="pt-3 text-center text-[11px] font-medium text-[#8B90A0]">Belum ada komponen penilaian untuk level ini</p>
                              ) : lvl.categories.map((cat, ci) => (
                                <div key={ci} className="pt-2.5">
                                  <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-[#4B5063]">{cat.nama}</span>
                                    {cat.avg !== null ? (
                                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${scoreStyle(cat.avg)}`}>{cat.avg}</span>
                                    ) : (
                                      <span className="text-[10px] text-[#C5C8D4]">—</span>
                                    )}
                                  </div>
                                  {cat.components.length > 0 && (
                                    <div className="ml-1 space-y-1 border-l-2 border-[#E5E7EF] pl-3">
                                      {cat.components.map((comp, cpi) => (
                                        <div key={cpi} className="flex items-center justify-between gap-2">
                                          <span className="text-[11px] font-medium text-[#8B90A0]">{comp.nama}</span>
                                          <span className="text-[11px] font-semibold text-[#4B5063] tabular-nums">{comp.avg ?? '—'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
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

        {/* ===== KELAS SENSEI ===== */}
        <section>
          <SectionTitle title="Kelas Sensei" right={
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1 rounded-full bg-[#0069b0] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm shadow-[#0069b0]/25 transition hover:bg-[#004d7a] active:scale-95">
              <Plus size={13} /> Tambah
            </button>
          } />
          {kelasList.length > 0 ? (
            <div className="divide-y divide-[#F0F1F5] overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white">
              {kelasList.map(k => (
                <div key={k.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#0069b0]/[0.08]">
                    <Users size={17} className="text-[#0069b0]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold leading-snug text-[#14182B]">{kelasLabel(k)}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-[#8B90A0]">
                      <span className="font-bold text-[#0069b0]">Level {k.level}</span>
                      <span>·</span>
                      <span>{kelasPeriode(k)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">{renderAbsenAction(k)}</div>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={() => setShowModal(true)}
              className="w-full rounded-2xl border border-dashed border-[#D6D9E1] bg-white px-5 py-7 text-center transition hover:border-[#0069b0]/40">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0069b0]/[0.08]">
                <Plus size={22} className="text-[#0069b0]" />
              </div>
              <p className="text-sm font-bold text-[#14182B]">Belum ada kelas</p>
              <p className="mt-1 text-xs text-[#8B90A0]">Ketuk di sini untuk membuat kelas baru</p>
            </button>
          )}
        </section>

        {/* ===== RIWAYAT ABSENSI ===== */}
        <section>
          <SectionTitle
            title="Riwayat Absensi"
            subtitle={`${monthNamesID[new Date().getMonth()]} ${new Date().getFullYear()}`}
            right={riwayatKelas ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">{hadirCount} hari hadir</span>
            ) : undefined}
          />
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EF] bg-white">
            {kelasList.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-4 pt-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {kelasList.map(k => {
                  const active = riwayatKelasId === k.id
                  return (
                    <button key={k.id} onClick={() => setSelectedKelasId(k.id)}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        active ? 'border-[#0069b0] bg-[#0069b0] text-white' : 'border-[#E5E7EF] bg-white text-[#4B5063] hover:bg-[#F4F5F8]'
                      }`}>
                      {kelasLabel(k)} · L{k.level}
                    </button>
                  )
                })}
              </div>
            )}

            {!riwayatKelas || classRiwayat.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4F5F8]">
                  <History size={22} className="text-[#8B90A0]" strokeWidth={1.6} />
                </div>
                <p className="text-sm font-bold text-[#14182B]">{riwayatKelas ? 'Belum ada riwayat absensi' : 'Belum ada kelas'}</p>
                <p className="mt-1 text-xs text-[#8B90A0]">{riwayatKelas ? 'Absensi untuk kelas ini akan muncul di sini' : 'Riwayat akan muncul setelah Anda memiliki kelas'}</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F1F5] border-t border-[#F0F1F5]">
                {classRiwayat.map(r => {
                  const d = new Date(r.tanggal)
                  const dayIdx = d.getDay()
                  const status = r.status
                  const statusStyle =
                    status === 'HADIR' ? 'bg-[#DCFCE7] text-[#15803D]' :
                    status === 'TERLAMBAT' ? 'bg-[#FEF3C7] text-[#B45309]' :
                    status === 'LIBUR' ? 'bg-[#F0F1F5] text-[#6B7280]' :
                    'bg-[#FEE2E2] text-[#B91C1C]'
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-xl bg-[#F4F5F8]">
                        <span className="text-[9px] font-bold tracking-wider text-[#8B90A0]">{dayAbbr[dayIdx]}</span>
                        <span className="text-base font-bold leading-tight text-[#14182B]">{d.getDate()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#14182B]">{dayNames[dayIdx]}, {d.getDate()} {monthNamesID[d.getMonth()]}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-[#4B5063] tabular-nums">
                          <span className="flex items-center gap-1"><LogIn size={11} className="text-[#0069b0]" />{r.jam_masuk ? r.jam_masuk.slice(0, 5) : '--:--'}</span>
                          <span className="flex items-center gap-1"><LogOut size={11} className="text-orange-500" />{r.jam_keluar ? r.jam_keluar.slice(0, 5) : '--:--'}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}>{status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg sm:mx-3 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Tambah Kelas Baru</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTambahKelas} className="p-5 space-y-4">
              <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>
                  <select value={form.batch_id} onChange={e => setForm(f => ({ ...f, batch_id: e.target.value, level: '' }))}
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
                    {availableLevels.map(l => <option key={l} value={l}>Level {l}</option>)}
                  </select>
                </div>
              </div>
              {form.batch_id && form.level && !selectedJadwal && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Jadwal belum diatur untuk batch & level ini. Silakan hubungi admin untuk mengatur jadwal terlebih dahulu.
                </div>
              )}
              {duplicateKelas && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 flex gap-1.5">
                  <X size={13} className="shrink-0 mt-0.5" />
                  Kelas untuk batch & level ini sudah dibuat. Tidak boleh duplikat — pilih batch/level lain.
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
                <button type="submit" disabled={saving || !selectedJadwal || duplicateKelas}
                  className="rounded-lg bg-[#0069b0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL REFERENSI QUIZ ===== */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setShowRefModal(false)}>
          <div className="w-full max-w-lg sm:mx-3 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] flex flex-col pb-[env(safe-area-inset-bottom)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">Kirim Referensi Quiz</h3>
              <button onClick={() => setShowRefModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[11px] text-blue-700 leading-relaxed">
                Kirim referensi soal (tulis langsung di kolom teks, unggah file PDF, atau isi link) beserta judul &amp; kategori. Manager akan membuat soal quiz berdasarkan referensi Anda.
              </div>
              {refLoading ? (
                <div className="text-center py-6 text-sm text-gray-400">Memuat...</div>
              ) : (
                <form onSubmit={handleKirimReferensi} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Judul Referensi <span className="text-red-500">*</span></label>
                    <input value={refForm.title} onChange={e => setRefForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="cth: Soal Latihan Kata Kerja N5"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Kategori <span className="text-red-500">*</span></label>
                    <select value={refForm.category_id} onChange={e => setRefForm(f => ({ ...f, category_id: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]">
                      <option value="">Pilih Kategori...</option>
                      {refCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                        <Paperclip size={12} /> File Referensi <span className="text-gray-400">(PDF, max 10MB)</span>
                      </label>
                      <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg px-3 py-4 cursor-pointer transition ${refFile ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:border-[#0069b0]'}`}>
                        <Upload size={16} className={refFile ? 'text-emerald-500' : 'text-[#8B90A0]'} />
                        <span className={`text-xs font-semibold ${refFile ? 'text-emerald-600' : 'text-gray-500'} truncate`}>
                          {refFile ? refFile.name : 'Pilih file PDF'}
                        </span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" className="hidden"
                          onChange={e => setRefFile(e.target.files?.[0] || null)} />
                      </label>
                      {refFile && (
                        <button type="button" onClick={() => setRefFile(null)}
                          className="mt-1 text-[11px] text-red-500 hover:text-red-600 font-semibold">Hapus file</button>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                        <Link2 size={12} /> Link Referensi <span className="text-gray-400">(opsional)</span>
                      </label>
                      <input value={refForm.link} onChange={e => setRefForm(f => ({ ...f, link: e.target.value }))}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0069b0] focus:outline-none focus:ring-1 focus:ring-[#0069b0]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Soal / Referensi Teks <span className="text-gray-400">(Opsional)</span></label>
                    <div className="ref-quill overflow-hidden rounded-lg border border-gray-300 focus-within:border-[#0069b0] focus-within:ring-1 focus-within:ring-[#0069b0]">
                      <ReactQuill
                        theme="snow"
                        value={refForm.description}
                        onChange={value => setRefForm(f => ({ ...f, description: value }))}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Tulis soal-soal yang ingin diajukan langsung di sini (boleh diberi format/bold/daftar)..." />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <button type="button" onClick={() => setShowRefModal(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                      Tutup
                    </button>
                    <button type="submit" disabled={refSaving}
                      className="rounded-lg bg-[#0069b0] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004d7a] transition disabled:opacity-50 flex items-center gap-1.5">
                      {refSaving ? 'Mengirim...' : 'Kirim Referensi'}
                    </button>
                  </div>
                </form>
              )}
              <div>
                <h4 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase mb-3">Riwayat Pengajuan Saya</h4>
                {myReferences.length === 0 ? (
                  <p className="text-center py-5 text-xs text-[#8B90A0]">Belum ada referensi yang dikirim</p>
                ) : (
                  <div className="divide-y divide-[#F0F1F5] rounded-lg border border-[#E5E7EF] overflow-hidden">
                    {myReferences.map(r => (
                      <div key={r.id} className="flex items-start gap-3 px-3 py-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                          <FileCheck2 size={14} className="text-[#0069b0]" strokeWidth={1.8} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#14182B] truncate">{r.title}</p>
                          <p className="text-[11px] text-[#8B90A0] font-medium">
                            {r.category?.name || 'Tanpa kategori'}
                            {r.file_name ? ` · ${r.file_name}` : ''}
                            <span className="mx-1">·</span>
                            {new Date(r.created_at + (r.created_at.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {r.note && <p className="text-[11px] text-rose-500 font-medium mt-0.5">Catatan manager: {r.note}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${refStatusStyle[r.status] || 'bg-gray-100 text-gray-500'}`}>
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                          </span>
                          {r.status === 'pending' && (
                            <button onClick={() => handleHapusReferensi(r)} className="text-[#8B90A0] hover:text-red-500 transition">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
