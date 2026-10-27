import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import api from '../services/api'

interface VerifikasiData {
  valid: boolean
  message?: string
  no_invoice?: string
  pendaftar?: {
    nama: string
    email: string
    no_registrasi: string
    created_at: string
  }
  product?: string | null
  batch?: string | null
  keuangan?: {
    total_tagihan: number
    total_dibayar: number
    sisa: number
  }
  status_pendaftaran?: string
  status_pembayaran?: string
}
export default function Verifikasi() {
  const { noInvoice: noInvoiceParam, '*': splat } = useParams()
  const [searchParams] = useSearchParams()
  const legacyPath = noInvoiceParam && splat ? `${noInvoiceParam}/${splat}` : noInvoiceParam || splat || ''
  const noInvoice = searchParams.get('inv') || legacyPath || ''
  const [data, setData] = useState<VerifikasiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!noInvoice) return
    setLoading(true)
    api
      .get('/verifikasi', { params: { inv: noInvoice } })
      .then((res) => {
        setData(res.data)
        setError(false)
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Invoice dengan nomor tersebut tidak ditemukan atau tidak valid.'
        setError(true)
        setData(null)
        setErrorMsg(msg)
      })
      .finally(() => setLoading(false))
  }, [noInvoice])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-6">
        <div className="text-center mb-5">
          <ShieldCheck className="mx-auto h-10 w-10 text-green-500 mb-2" />
          <h1 className="text-xl font-bold text-slate-800">Verifikasi Pembayaran</h1>
          <p className="text-sm text-slate-500">Invoice menunggu verifikasi</p>
        </div>

        {/* Info pendaftar */}
        {data && (
          <div className="rounded-lg bg-slate-50 p-4 space-y-2 mb-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Nama</span>
              <span className="text-sm font-medium text-slate-800">{data.pendaftar?.nama || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm text-slate-700">{data.pendaftar?.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Program</span>
              <span className="text-sm text-slate-700">{data.product || '-'}{data.batch ? ` (${data.batch})` : ''}</span>
            </div>
            {data.keuangan && (
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Tagihan</span>
                  <span className="text-sm font-semibold text-slate-800">Rp {data.keuangan.total_tagihan.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Dibayar</span>
                  <span className="text-sm font-semibold text-green-600">Rp {data.keuangan.total_dibayar.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        {data && (
          <div className="flex justify-center mb-5">
            <span className={`text-xs px-3 py-1 rounded-full ${data.status_pembayaran === 'Menunggu Verifikasi' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              {data.status_pembayaran || '-'}
            </span>
          </div>
        )}

        {/* Aksi */}
        {data?.status_pembayaran === 'Menunggu Verifikasi' && !success && (
          <button
            onClick={async () => {
              setLoading(true)
              try {
                await api.post('/verifikasi/konfirmasi', { no_invoice: noInvoice })
                setSuccess(true)
                setTimeout(() => {
                  setLoading(false)
                  setSuccess(false)
                  window.location.href = '/'
                }, 2000)
              } catch (err) {
                setError(true)
                setErrorMsg('Gagal melakukan verifikasi')
                setLoading(false)
              }
            }}
            className="w-full py-3 px-4 bg-[#0E6187] text-white font-semibold text-base rounded-lg transition-colors hover:bg-[#1a3a5c] flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            Konfirmasi Pembayaran
          </button>
        )}

        {data?.status_pembayaran === 'Menunggu Verifikasi' && success && (
          <div className="text-center py-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-green-600 font-medium">Verifikasi berhasil!</p>
            <p className="text-xs text-slate-500 mt-1">Mengalihkan ke halaman utama...</p>
          </div>
        )}

        {data && data.status_pembayaran !== 'Menunggu Verifikasi' && (
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Invoice ini sudah <span className="font-medium text-slate-700">{data.status_pembayaran}</span>.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Diproses oleh <strong>Sistem Informasi Manajemen MENDUNIA</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
