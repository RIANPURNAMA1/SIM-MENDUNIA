import { useState, useEffect } from 'react'
import { CreditCard, CheckCircle, Clock, XCircle, Package } from 'lucide-react'
import api from '../../services/api'

export default function PembayaranSiswa() {
  const [pendaftar, setPendaftar] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/siswa-dashboard')
      .then(res => setPendaftar(res.data.pendaftar))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  const paymentColor: Record<string, string> = {
    unpaid: 'bg-slate-100 text-slate-600',
    processing: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
  }

  const paymentIcon: Record<string, typeof Clock> = {
    unpaid: Clock,
    processing: Clock,
    verified: CheckCircle,
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembayaran</h1>
        <p className="text-sm text-gray-500 mt-1">Informasi pembayaran pendaftaran Anda</p>
      </div>

      {pendaftar ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-gray-800">Status Pembayaran</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              {pendaftar.status_pembayaran === 'verified' ? (
                <CheckCircle size={20} className="text-emerald-500" />
              ) : (
                <Clock size={20} className="text-amber-500" />
              )}
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className={`inline-block mt-0.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${paymentColor[pendaftar.status_pembayaran] || 'bg-slate-100 text-slate-600'}`}>
                  {pendaftar.status_pembayaran}
                </span>
              </div>
            </div>

            {pendaftar.product && (
              <div className="flex items-center gap-3">
                <Package size={20} className="text-purple-600" />
                <div>
                  <p className="text-sm text-slate-500">Program</p>
                  <p className="font-semibold text-gray-800">{pendaftar.product.nama}</p>
                </div>
              </div>
            )}

            {pendaftar.nominal > 0 && (
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm text-slate-500">Nominal</p>
                  <p className="font-semibold text-gray-800">Rp {Number(pendaftar.nominal).toLocaleString('id-ID')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-400">Belum ada data pembayaran</p>
        </div>
      )}
    </div>
  )
}
