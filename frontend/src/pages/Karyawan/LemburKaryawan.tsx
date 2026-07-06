import { useState, useEffect, useRef } from 'react'
import { lemburApi } from '../../services/api'
import { Clock, Camera, X, CheckCircle, ArrowLeft, Image } from 'lucide-react'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function formatDate(d: Date) {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTime() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateTime(str: string) {
  const d = new Date(str)
  return `${formatDate(d)} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

interface LemburItem {
  id: number
  jam_masuk: string | null
  jam_keluar: string | null
  keterangan: string
  foto: string
  status: string
  created_at: string | null
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default function LemburKaryawan() {
  const [loading, setLoading] = useState(true)
  const [riwayat, setRiwayat] = useState<LemburItem[]>([])
  const [aktif, setAktif] = useState<LemburItem | null>(null)
  const [time, setTime] = useState(formatTime())

  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<'masuk' | 'keluar'>('masuk')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [keterangan, setKeterangan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [aktifRes, sayaRes] = await Promise.all([
        lemburApi.aktif().catch(() => ({ data: { data: null } })),
        lemburApi.saya().catch(() => ({ data: [] })),
      ])
      setAktif(aktifRes?.data?.data || null)
      setRiwayat(Array.isArray(sayaRes?.data) ? sayaRes.data : sayaRes?.data?.data || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async (mode: 'masuk' | 'keluar') => {
    setCameraMode(mode)
    setKeterangan('')
    setImagePreview(null)
    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setShowCamera(false)
      Swal.fire({ icon: 'error', title: 'Kamera Tidak Tersedia', text: 'Pastikan izin kamera diberikan' })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setImagePreview(dataUrl)
    stopCamera()
  }

  const handleSubmit = async () => {
    if (!keterangan.trim()) {
      Swal.fire({ icon: 'warning', title: 'Keterangan Wajib Diisi', text: 'Tuliskan keterangan pekerjaan lembur' })
      return
    }
    if (!imagePreview) {
      Swal.fire({ icon: 'warning', title: 'Foto Wajib Diambil', text: 'Ambil foto sebagai bukti lembur' })
      return
    }
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('foto', imagePreview)
      formData.append('keterangan', keterangan.trim())
      formData.append('tipe', cameraMode === 'masuk' ? 'MASUK' : 'KELUAR')
      await lemburApi.store(formData)
      Swal.fire({
        icon: 'success',
        title: cameraMode === 'masuk' ? 'Lembur Dimulai' : 'Lembur Selesai',
        timer: 2000,
        showConfirmButton: false,
      })
      setImagePreview(null)
      setKeterangan('')
      loadData()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memproses lembur'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const fotoUrl = (foto: string) => `http://localhost:8000/uploads/lembur/${foto}`

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      {/* Header */}
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center gap-3">
        <a href="/dashboard-karyawan" className="text-[#8B90A0] hover:text-[#14182B] transition-colors">
          <ArrowLeft size={20} />
        </a>
        <div>
          <h1 className="text-sm font-bold text-[#14182B]">Lembur</h1>
          <p className="text-[11px] text-[#8B90A0] font-medium">Pengajuan lembur karyawan</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
        {/* Clock Card */}
        <div className="relative rounded-2xl bg-[#0069b0] p-6 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.03]" />
          <p className="text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase mb-3">Lembur · mendunia.id</p>
          <p className="text-5xl font-bold text-white tabular-nums tracking-tight">{time}</p>
          <p className="text-[11px] text-white/50 font-medium mt-1">Waktu Indonesia Barat</p>
        </div>

        {/* Active Status */}
        {aktif ? (
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-sm font-bold text-[#14182B]">Sedang Lembur</span>
              {statusBadge(aktif.status)}
            </div>
            <p className="text-xs text-[#8B90A0] mb-1">Mulai: {aktif.jam_masuk ? formatDateTime(aktif.jam_masuk) : '-'}</p>
            {aktif.foto && (
              <div className="mt-2">
                <img src={fotoUrl(aktif.foto)} alt="Bukti masuk" className="w-20 h-20 rounded-lg object-cover border border-[#E5E7EF]" />
              </div>
            )}
            <button
              onClick={() => startCamera('keluar')}
              disabled={isSubmitting}
              className="mt-4 w-full py-3 rounded-xl bg-[#0069b0] text-white text-sm font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-50"
            >
              Selesaikan Lembur
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[#8B90A0]" />
              <span className="text-sm font-bold text-[#14182B]">Belum Ada Lembur Aktif</span>
            </div>
            <p className="text-xs text-[#8B90A0] mb-4">Mulai lembur dengan mengambil foto dan mengisi keterangan</p>
            <button
              onClick={() => startCamera('masuk')}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#0069b0] text-white text-sm font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-50"
            >
              Mulai Lembur
            </button>
          </div>
        )}

        {/* Riwayat Lembur */}
        <section className="bg-white rounded-xl border border-[#E5E7EF] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-[13px] font-bold text-[#14182B]">Riwayat Lembur</h3>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#8B90A0]">Memuat...</p>
            </div>
          ) : riwayat.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-[#4B5063]">Belum ada riwayat lembur</p>
            </div>
          ) : (
            <div>
              {riwayat.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-5 py-3.5 border-t border-[#F0F1F5]">
                  <div className="w-9 h-9 rounded-lg bg-[#0069b0]/[0.06] flex items-center justify-center flex-none">
                    <Clock size={15} className="text-[#0069b0]" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-[#14182B]">
                        {r.jam_masuk ? formatDateTime(r.jam_masuk) : '-'}
                      </span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-[11px] text-[#8B90A0] font-medium mt-0.5">
                      {r.jam_keluar ? `Selesai: ${formatDateTime(r.jam_keluar)}` : 'Belum selesai'}
                    </p>
                    <p className="text-[11px] text-[#4B5063] mt-1 line-clamp-2">{r.keterangan}</p>
                    {r.foto && (
                      <button onClick={() => {
                        Swal.fire({
                          imageUrl: fotoUrl(r.foto),
                          imageAlt: 'Bukti Lembur',
                          width: 400,
                          showConfirmButton: false,
                        })
                      }} className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[#0069b0] hover:underline">
                        <Image size={12} /> Lihat Bukti
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video ref={videoRef} autoPlay playsInline muted className="flex-1 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <button onClick={stopCamera} className="absolute top-5 left-5 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="pointer-events-auto px-4 pb-6">
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tuliskan keterangan pekerjaan lembur..."
                className="w-full bg-black/50 text-white text-sm rounded-xl p-3 border border-white/20 placeholder-white/50 mb-3 resize-none"
                rows={2}
              />
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-[4px] border-white/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl"
                >
                  <div className="w-16 h-16 rounded-full bg-white" />
                </button>
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Preview + Confirm */}
      {imagePreview && !showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <img src={imagePreview} alt="Preview" className="flex-1 w-full h-full object-cover" />
          <div className="absolute top-5 left-5">
            <button onClick={() => { setImagePreview(null); startCamera(cameraMode) }} className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="absolute bottom-8 left-4 right-4 pointer-events-auto">
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Tuliskan keterangan pekerjaan lembur..."
              className="w-full bg-black/50 text-white text-sm rounded-xl p-3 border border-white/20 placeholder-white/50 mb-3 resize-none"
              rows={2}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-white text-[#0069b0] text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : cameraMode === 'masuk' ? 'Mulai Lembur' : 'Selesaikan Lembur'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <KaryawanBottomNav activeTab="home" absenStatus="belum" hasJadwal={false} />
    </div>
  )
}
