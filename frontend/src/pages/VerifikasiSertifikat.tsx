import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Loader2, Search, ShieldCheck } from 'lucide-react'
import { quizApi } from '../services/api'
import type { RincianBagian } from '../components/quiz/CertificateCard'

type SertifikatPublik = {
  nomor: string
  kode_verifikasi: string
  judul: string
  penerbit: string
  kandidat_nama: string
  kandidat_nik: string | null
  batch_nama: string | null
  level: string | null
  nilai: number
  nilai_lulus: number
  lulus: boolean
  benar: number
  total_soal: number
  rincian_bagian: RincianBagian[]
  tanggal_indah: string
  expired: boolean
}

type Status = 'memuat' | 'valid' | 'tidak-ada' | 'gagal'

/**
 * Halaman verifikasi keaslian sertifikat yang bisa dibuka siapa pun, termasuk
 * penerima sertifikat yang belum punya akun.
 *
 * Endpoint publik sengaja tidak mengembalikan foto dan nomor registrasi, dan
 * NIK hanya ditampilkan empat digit terakhir.
 */
export default function VerifikasiSertifikat() {
  const { kode } = useParams<{ kode: string }>()
  const [input, setInput] = useState(kode ?? '')
  const [status, setStatus] = useState<Status>('memuat')
  const [sertifikat, setSertifikat] = useState<SertifikatPublik | null>(null)
  const [pesan, setPesan] = useState('')

  useEffect(() => {
    if (!kode) {
      setStatus('tidak-ada')
      return
    }
    setStatus('memuat')
    quizApi.verifikasiSertifikat(kode)
      .then(res => {
        setSertifikat(res.data.sertifikat)
        setStatus('valid')
      })
      .catch(err => {
        if (err?.response?.status === 404) {
          setPesan('Sertifikat dengan kode tersebut tidak ditemukan. Periksa kembali kode yang tercetak pada sertifikat.')
          setStatus('tidak-ada')
        } else {
          setPesan('Gagal memuat data sertifikat. Coba beberapa saat lagi.')
          setStatus('gagal')
        }
      })
  }, [kode])

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Verifikasi Sertifikat</h1>
          <p className="mt-1 text-sm text-slate-500">
            Masukkan kode yang tercetak pada sertifikat untuk memeriksa keasliannya.
          </p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            const bersih = input.trim().toUpperCase()
            if (bersih) window.location.href = `/verifikasi-sertifikat/${bersih}`
          }}
          className="mb-6 flex gap-2"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder="Contoh: 4S9AN8AY"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 font-mono text-sm uppercase tracking-widest text-slate-800 focus:border-[#0E6187] focus:outline-none focus:ring-1 focus:ring-[#0E6187]"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a4d6b]"
          >
            <Search className="h-4 w-4" /> Periksa
          </button>
        </form>

        {status === 'memuat' && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-white py-10 text-sm text-slate-500 ring-1 ring-slate-200">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data sertifikat...
          </div>
        )}

        {(status === 'tidak-ada' || status === 'gagal') && (
          <div className="rounded-lg bg-white p-6 text-center ring-1 ring-slate-200">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">Sertifikat tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">{pesan}</p>
          </div>
        )}

        {status === 'valid' && sertifikat && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
            <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Sertifikat ini sah</p>
                <p className="text-xs text-emerald-700">Diterbitkan oleh {sertifikat.penerbit}</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nama</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800">{sertifikat.kandidat_nama}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nomor</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{sertifikat.nomor}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Judul</p>
                  <p className="mt-0.5 text-sm text-slate-700">{sertifikat.judul}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Diterbitkan</p>
                  <p className="mt-0.5 text-sm text-slate-700">{sertifikat.tanggal_indah}</p>
                </div>
                {sertifikat.kandidat_nik && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">NIK</p>
                    <p className="mt-0.5 font-mono text-sm text-slate-700">{sertifikat.kandidat_nik}</p>
                  </div>
                )}
                {sertifikat.batch_nama && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Batch</p>
                    <p className="mt-0.5 text-sm text-slate-700">{sertifikat.batch_nama}</p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Nilai</p>
                <p className="text-3xl font-bold tabular-nums text-slate-900">{sertifikat.nilai}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {sertifikat.benar}/{sertifikat.total_soal} benar ·{' '}
                  <span className={sertifikat.lulus ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                    {sertifikat.lulus ? 'Lulus' : 'Belum lulus'} (batas {sertifikat.nilai_lulus})
                  </span>
                </p>
              </div>

              {sertifikat.rincian_bagian.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Persentase per bagian
                  </p>
                  <ul className="space-y-2">
                    {sertifikat.rincian_bagian.map(baris => (
                      <li key={baris.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-slate-700">{baris.name}</span>
                        <span className="shrink-0 tabular-nums text-slate-500">
                          {baris.correct}/{baris.total} ·{' '}
                          <span className="font-semibold text-slate-800">{Number(baris.percent) || 0}%</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sertifikat.expired && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                  Masa berlaku sertifikat ini sudah habis.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
