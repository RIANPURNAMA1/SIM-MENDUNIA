import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react'
import axios from 'axios'

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

  useEffect(() => {
    if (!noInvoice) return
    setLoading(true)
    axios
      .get('/api/verifikasi', { params: { inv: noInvoice } })
      .then((res) => {
        setData(res.data)
        setError(false)
      })
      .catch(() => {
        setError(true)
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [noInvoice])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">Memverifikasi dokumen...</p>
        </div>
      </div>
    )
  }

  if (error || !data || !data.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-800">Dokumen Tidak Valid</h1>
          <p className="mt-2 text-sm text-slate-500">
            Invoice dengan nomor <strong className="text-slate-700">{noInvoice}</strong> tidak ditemukan atau tidak valid.
          </p>
          <p className="mt-1 text-xs text-slate-400">Hubungi admin untuk informasi lebih lanjut.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-green-200 bg-white p-8 shadow-xl">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-14 w-14 text-green-500" />
            <h1 className="mt-3 text-2xl font-bold text-green-700">Dokumen Asli</h1>
            <p className="mt-1 text-sm text-green-600">
              Invoice ini telah diverifikasi dan sah secara elektronik.
            </p>
          </div>

          <div className="mt-6 space-y-3 rounded-xl bg-green-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              <span className="text-sm text-green-800">
                <strong>No. Invoice:</strong> {data.no_invoice}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Nama Pendaftar</span>
              <span className="text-sm font-semibold text-slate-800">{data.pendaftar?.nama}</span>
            </div>
            {data.product && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Program</span>
                <span className="text-sm font-semibold text-slate-800">{data.product}</span>
              </div>
            )}
            {data.batch && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Batch</span>
                <span className="text-sm font-semibold text-slate-800">{data.batch}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Tanggal Daftar</span>
              <span className="text-sm font-semibold text-slate-800">
                {new Date(data.pendaftar!.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-sm text-slate-500">Status Pendaftaran</span>
              <span className={`text-sm font-semibold ${data.status_pendaftaran === 'Diterima' ? 'text-green-600' : 'text-yellow-600'}`}>
                {data.status_pendaftaran}
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-slate-500">Status Pembayaran</span>
              <span className={`text-sm font-semibold ${data.status_pembayaran === 'Lunas' ? 'text-green-600' : 'text-yellow-600'}`}>
                {data.status_pembayaran}
              </span>
            </div>
          </div>

          {data.keuangan && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ringkasan Keuangan
              </h3>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Tagihan</span>
                  <span className="font-semibold text-slate-800">Rp {data.keuangan.total_tagihan.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Dibayar</span>
                  <span className="font-semibold text-green-600">Rp {data.keuangan.total_dibayar.toLocaleString('id-ID')}</span>
                </div>
                {data.keuangan.sisa > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Sisa</span>
                    <span className="font-semibold text-red-500">Rp {data.keuangan.sisa.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Dokumen ini diproses secara elektronik oleh <strong>Sistem Informasi Manajemen MENDUNIA</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
