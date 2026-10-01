import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, CheckCircle2, Loader2, RefreshCw, ShieldCheck, User } from 'lucide-react'
import { detectFace, loadFaceModels, type DetectedFace } from '../../utils/faceDetector'
import { quizApi } from '../../services/api'

type Props = {
  paketId: number
  judul: string
  /** Dipanggil setelah foto tersimpan; token diteruskan ke pemanggilan start. */
  onLanjut: (sertifikatFotoToken: string) => void
  onBatal: () => void
  sedangMemulai?: boolean
}

type Status = 'idle' | 'menyiapkan' | 'siap' | 'menembak' | 'mengunggah' | 'gagal'

const RASIO = 3 / 4
const MAKS_SISI = 1200
const POSISI_WAJAH = 0.38

type Potongan = { sx: number; sy: number; sw: number; sh: number }

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

const hitungPotongan = (vw: number, vh: number, face: DetectedFace | null): Potongan => {
  let sh = vh
  let sw = Math.round(sh * RASIO)
  if (sw > vw) {
    sw = vw
    sh = Math.round(sw / RASIO)
  }

  const cxWajah = face && face.width > 0 ? face.x + face.width / 2 : vw / 2
  const sx = Math.round(clamp(cxWajah - sw / 2, 0, vw - sw))

  let sy = 0
  if (face && face.height > 0) {
    const cyWajah = face.y + face.height / 2
    sy = Math.round(clamp(cyWajah - sh * POSISI_WAJAH, 0, vh - sh))
  }

  return { sx, sy, sw, sh }
}

/**
 * Step pra-ujian untuk paket bersertifikat.
 *
 * Kandidat wajib mengambil foto identitas sebelum ujian benar-benar dimulai.
 * Foto dikirim ke server, yang membalas token sekali pakai. Token itulah yang
 * dipakai saat start, sehingga backend tidak akan memulai percobaan tanpa
 * bukti foto yang benar-benar diunggah dari perangkat ini.
 */
export default function SertifikatFotoStep({ paketId, judul, onLanjut, onBatal, sedangMemulai = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef<number | null>(null)
  const wajahRef = useRef<DetectedFace | null>(null)

  const [status, setStatus] = useState<Status>('menyiapkan')
  const [pesan, setPesan] = useState('Menyiapkan kamera...')
  const [wajahOke, setWajahOke] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    if (loopRef.current) {
      window.clearTimeout(loopRef.current)
      loopRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const cekWajah = useCallback(async () => {
    const video = videoRef.current
    if (!video || video.readyState < 2) {
      loopRef.current = window.setTimeout(cekWajah, 700)
      return
    }
    try {
      const det = await detectFace(video)
      wajahRef.current = det
      // Menoleh ditolak agar foto terbaca dengan jelas, tapi tetap snapshot muka.
      setWajahOke(!!det && !det.turned)
      setStatus(prev => {
        if (prev !== 'menyiapkan') return prev
        setPesan(det ? (det.turned ? 'Posisikan wajah menghadap kamera' : 'Wajah terdeteksi, siap mengambil foto') : 'Wajah belum terdeteksi')
        return 'siap'
      })
    } catch {
      // Model wajah tidak tersedia (mis. offline). Foto tetap boleh diambil;
      // hanya pemeriksaan wajah yang dilewati.
      setWajahOke(true)
      setStatus(prev => (prev === 'menyiapkan' ? 'siap' : prev))
    }
    loopRef.current = window.setTimeout(cekWajah, 700)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      await loadFaceModels()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      cekWajah()
    } catch {
      setStatus('gagal')
      setPesan('Kamera tidak bisa diakses. Izinkan akses kamera lalu coba lagi.')
    }
  }, [cekWajah])

  useEffect(() => {
    startCamera()
    return stopStream
  }, [startCamera, stopStream])

  const jepret = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    // Wajah harus terdeteksi dan menghadap kamera supaya foto sertifikat jelas.
    if (!wajahOke) {
      setPesan('Wajah belum terdeteksi atau sedang menoleh. Posisikan wajah menghadap kamera lalu coba lagi.')
      return
    }

    setStatus('menembak')

    const { sx, sy, sw, sh } = hitungPotongan(video.videoWidth, video.videoHeight, wajahRef.current)
    const skala = Math.min(1, MAKS_SISI / Math.max(sw, sh))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(sw * skala))
    canvas.height = Math.max(1, Math.round(sh * skala))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'

    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) {
      setStatus('gagal')
      setPesan('Foto gagal dibuat. Silakan coba lagi.')
      return
    }

    setPreview(URL.createObjectURL(blob))
    setStatus('mengunggah')
    setPesan('Mengunggah foto identitas...')

    const fd = new FormData()
    fd.append('photo', blob, 'wajah.jpg')
    try {
      const res = await quizApi.uploadFotoSertifikat(paketId, fd)
      setToken(res.data.sertifikat_foto_token)
      setWajahOke(true)
      setStatus('siap')
      setPesan('Foto tersimpan. Anda bisa lanjut memulai ujian.')
      stopStream()
    } catch (err: any) {
      setStatus('gagal')
      setPesan(err?.response?.data?.message || 'Foto gagal diunggah. Silakan coba lagi.')
    }
  }

  const ulang = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setToken(null)
    setWajahOke(false)
    wajahRef.current = null
    setStatus('menyiapkan')
    setPesan('Menyiapkan kamera...')
    stopStream()
    startCamera()
  }

  const sibuk = ['menyiapkan', 'menembak', 'mengunggah'].includes(status)
  const bisaLanjut = !!token && !sedangMemulai

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Verifikasi Identitas</h2>
            <p className="text-xs text-slate-500">{judul}</p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-slate-600">
            Ujian ini bersertifikat. Ambil foto wajah Anda terlebih dahulu. Foto ini yang akan tercetak pada
            sertifikat dan tidak dapat diubah setelah ujian dimulai.
          </p>

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-900">
            {preview ? (
              <img src={preview} alt="Pratinjau foto identitas" className="h-full w-full object-cover" />
            ) : (
              <>
                <video ref={videoRef} muted playsInline className="h-full w-full -scale-x-100 object-cover" />
                {status === 'menyiapkan' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-white">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0">
                  <div
                    className="absolute left-1/2 h-[62%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-white/50"
                    style={{ top: `${POSISI_WAJAH * 100}%` }}
                  />
                </div>
              </>
            )}

            {token && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-emerald-600/90 py-2 text-xs font-semibold text-white">
                <CheckCircle2 className="h-4 w-4" /> Foto identitas tersimpan
              </div>
            )}
          </div>

          <div
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ${
              status === 'gagal'
                ? 'bg-rose-50 text-rose-700'
                : wajahOke
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-50 text-slate-600'
            }`}
          >
            {status === 'gagal' ? (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : wajahOke ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>{pesan}</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {!token ? (
              <button
                type="button"
                onClick={jepret}
                disabled={sibuk || status === 'gagal' || !wajahOke}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'mengunggah' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" /> Ambil Foto
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={ulang}
                  disabled={sedangMemulai}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" /> Ambil Ulang
                </button>
                <button
                  type="button"
                  onClick={() => token && onLanjut(token)}
                  disabled={!bisaLanjut}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sedangMemulai ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan ujian...
                    </>
                  ) : (
                    'Mulai Ujian'
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onBatal}
              disabled={sedangMemulai}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
