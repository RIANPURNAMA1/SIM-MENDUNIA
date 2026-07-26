import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, CheckCircle, Clock, XCircle, CreditCard, Package, Check, Copy, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Building2, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface PendaftarData {
  id: number
  nama: string
  email: string
  status_pendaftaran: string
  status_pembayaran: string
  batch_id: number | null
  created_at: string
  product: { id: number; nama: string; harga: number } | null
}

interface SiswaData {
  id: number
  user_id: number
  nama: string
  nik: string | null
  no_registrasi: string | null
  jenis_kelamin: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  agama: string | null
  alamat: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  pendidikan_terakhir: string | null
  tahun_lulus: string | null
  tinggi_badan: string | null
  berat_badan: string | null
  goldar: string | null
  ukuran_baju: string | null
  status_pernikahan: string | null
  no_hp: string | null
  no_hp_ortu: string | null
  nama_ortu: string | null
  foto: string | null
  status: string
  batch_id: number | null
  batch_relasi?: { id: number; nama_batch: string } | null
  keterangan: string | null
}

interface KategoriItem {
  id: number
  nama: string
  harga: number
  komisi: number
  dibayar: number
  sisa: number
  jatuh_tempo_hari: number
  due_at: string | null
  kode_unik: number
  total_transfer: number
  payment_code: string | null
}

interface BankAccount {
  id: number
  bank_name: string
  bank_logo: string | null
  account_holder: string
  account_number: string
  branch: string | null
  additional_info: string | null
  is_active: boolean
}

interface CheckoutData {
  pendaftar: {
    id: number
    nama: string
    email: string
    telepon: string
    created_at: string
    tanggal_persetujuan: string | null
    status_pendaftaran: string
    status_pembayaran: string
  }
  product: { id: number; nama: string; harga: number } | null
  keuangan: {
    harga_produk: number
    diskon: number
    total_tagihan: number
    total_dibayar: number
    sisa: number
  }
  company: {
    bank_nama: string | null
    bank_nomor_rekening: string | null
    bank_pemilik: string | null
    company_name: string
  }
  bank_accounts: BankAccount[]
  payment_settings: {
    manual_payment_enabled: boolean
    unique_code_max: number
    unique_code_operation: string
  }
  no_invoice: string
  kategori_items?: KategoriItem[]
}

function fmt(n: number | string) {
  return 'Rp ' + Number(n).toLocaleString('id-ID').replace(/,/g, '.')
}

export default function SiswaDashboard() {
  const { user } = useAuth()
  const [pendaftar, setPendaftar] = useState<PendaftarData | null>(null)
  const [siswa, setSiswa] = useState<SiswaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [jadwalLevels, setJadwalLevels] = useState<Record<string, { tanggal_mulai: string; tanggal_selesai: string }>>({})

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [countdowns, setCountdowns] = useState<Record<number, { days: number; hours: number; minutes: number; seconds: number; expired: boolean; deadline: Date }>>({})

  useEffect(() => {
    api.get('/siswa-dashboard')
      .then(res => {
        const p = res.data.pendaftar
        setPendaftar(p)
        setSiswa(res.data.siswa)
        setJadwalLevels(res.data.jadwal_levels || {})
        if (p && p.status_pembayaran === 'unpaid') {
          setShowPaymentModal(true)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!pendaftar || pendaftar.status_pembayaran === 'verified' || !showPaymentModal) return
    if (checkoutData) return
    setCheckoutLoading(true)
    api.get(`/pendaftaran/bayar/${pendaftar.id}`)
      .then(res => {
        if (res.data?.pendaftar) setCheckoutData(res.data)
        else if (res.data?.data?.pendaftar) setCheckoutData(res.data.data)
      })
      .catch(() => {})
      .finally(() => setCheckoutLoading(false))
  }, [pendaftar, showPaymentModal, checkoutData])

  useEffect(() => {
    if (!checkoutData?.kategori_items?.length) return

    function updateCountdowns() {
      const now = new Date()
      const newCountdowns: typeof countdowns = {}
      for (const k of checkoutData!.kategori_items!) {
        if (k.sisa <= 0) continue

        let deadline: Date
        if (k.due_at) {
          deadline = new Date(k.due_at)
        } else {
          const baseDate = checkoutData!.pendaftar.tanggal_persetujuan
            ? new Date(checkoutData!.pendaftar.tanggal_persetujuan)
            : new Date(checkoutData!.pendaftar.created_at)
          deadline = new Date(baseDate.getTime() + k.jatuh_tempo_hari * 24 * 60 * 60 * 1000)
        }

        const diff = deadline.getTime() - now.getTime()
        const expired = diff <= 0
        const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24))
        const hours = Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((Math.abs(diff) % (1000 * 60)) / 1000)
        newCountdowns[k.id] = { days, hours, minutes, seconds, expired, deadline }
      }
      setCountdowns(newCountdowns)
    }

    updateCountdowns()
    const interval = setInterval(updateCountdowns, 1000)
    return () => clearInterval(interval)
  }, [checkoutData])

  function copyToClipboard(text: string, field?: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field || 'default')
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', timeZoneName: 'short',
    }).replace(/\./g, ':')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    disetujui: 'bg-emerald-100 text-emerald-700',
    ditolak: 'bg-red-100 text-red-600',
  }

  const paymentColor: Record<string, string> = {
    unpaid: 'bg-slate-100 text-slate-600',
    processing: 'bg-amber-100 text-amber-700',
    verified: 'bg-emerald-100 text-emerald-700',
  }

  const statusIcon: Record<string, typeof Clock> = {
    pending: Clock,
    disetujui: CheckCircle,
    ditolak: XCircle,
  }

  const StatusIcon = pendaftar ? statusIcon[pendaftar.status_pendaftaran] || Clock : Clock

  const cardClass = "bg-white border border-gray-200 rounded-lg shadow-sm"

  const isDataLengkap = siswa?.nik && siswa?.alamat && siswa?.jenis_kelamin && siswa?.agama

  const showPaymentBanner = pendaftar && pendaftar.status_pembayaran !== 'verified'

  const unpaidItems = (checkoutData?.kategori_items || []).filter(k => Number(k.sisa) > 0)
  const paidItems = (checkoutData?.kategori_items || []).filter(k => Number(k.sisa) <= 0)
  const firstKategori = unpaidItems[0] || checkoutData?.kategori_items?.[0]
  const fkHarga = firstKategori ? Number(firstKategori.harga) : 0
  const fkSisa = firstKategori ? Number(firstKategori.sisa) : 0
  const fkTotalTransfer = firstKategori ? Number(firstKategori.total_transfer) : 0
  const fkKodeUnik = firstKategori ? Number(firstKategori.kode_unik) : 0
  const totalBayar = firstKategori
    ? (fkSisa > 0 ? fkSisa : fkHarga)
    : (checkoutData ? (checkoutData.keuangan.sisa > 0 ? Number(checkoutData.keuangan.sisa) : Number(checkoutData.keuangan.total_tagihan)) : 0)
  const totalTransfer = fkTotalTransfer > 0 ? fkTotalTransfer : (totalBayar + fkKodeUnik)
  const kodeUnik = fkKodeUnik
  const paymentCode = firstKategori?.payment_code ?? null
  const primaryCountdown = firstKategori ? countdowns[firstKategori.id] : null
  const activeBankAccounts = (checkoutData?.bank_accounts || []).filter(b => b.is_active)
  const bankName = checkoutData?.company?.bank_nama || 'BCA'
  const bankOwner = checkoutData?.company?.bank_pemilik || 'PT. INDONESIA SUKSES MENDUNIA'
  const paymentEnabled = checkoutData?.payment_settings?.manual_payment_enabled ?? false

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-3 py-4 sm:px-6 sm:py-5">
      {showPaymentBanner && (
        <div className={`mb-4 p-4 border rounded-lg flex items-start gap-3 ${
          pendaftar?.status_pembayaran === 'processing'
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
            pendaftar?.status_pembayaran === 'processing' ? 'bg-amber-100' : 'bg-red-100'
          }`}>
            {pendaftar?.status_pembayaran === 'processing' ? (
              <Clock size={16} className="text-amber-600" />
            ) : (
              <CreditCard size={16} className="text-red-600" />
            )}
          </div>
          <div className="flex-1">
            {pendaftar?.status_pembayaran === 'processing' ? (
              <>
                <p className="text-sm font-semibold text-amber-800">Pembayaran sedang diproses</p>
                <p className="text-xs text-amber-700 mt-1">
                  Bukti pembayaran Anda sedang menunggu verifikasi dari admin.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-red-800">Anda memiliki tagihan yang belum dibayar</p>
                <p className="text-xs text-red-700 mt-1">
                  Silakan selesaikan pembayaran untuk melanjutkan proses pendaftaran.
                </p>
              </>
            )}
          </div>
          {pendaftar?.status_pembayaran !== 'processing' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">
              Bayar Sekarang
            </button>
          )}
        </div>
      )}

      {!isDataLengkap && pendaftar && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-amber-700 font-bold text-sm">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Data diri Anda belum lengkap</p>
            <p className="text-xs text-amber-700 mt-1">
              Silakan lengkapi data diri dan upload dokumen Anda.
            </p>
          </div>
          <Link to="/siswa-dashboard/data-diri"
            className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-semibold hover:bg-amber-700 transition-colors">
            Lengkapi Sekarang
          </Link>
        </div>
      )}

      <div className={`mb-4 ${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eef1f6]">
              <User size={22} className="text-[#0E6187]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Halo, {user?.name}!</h1>
              <p className="text-sm text-gray-500">Status pendaftaran Anda</p>
            </div>
          </div>
        </div>
      </div>

      {(siswa?.batch_id || pendaftar?.batch_id) && Object.keys(jadwalLevels).length > 0 && (
        <div className={`${cardClass} mb-4`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Timeline Tahapan</h2>
          </div>
          <div className="p-5">
            <TimelineStages jadwalLevels={jadwalLevels} />
          </div>
        </div>
      )}

      {pendaftar ? (<>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Status Pendaftaran</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <StatusIcon size={20} className={
                  pendaftar.status_pendaftaran === 'disetujui' ? 'text-emerald-500' :
                  pendaftar.status_pendaftaran === 'ditolak' ? 'text-red-500' : 'text-amber-500'
                } />
                <div>
                  <p className="text-xs text-gray-500">Status Pendaftaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[pendaftar.status_pendaftaran]}`}>
                    {pendaftar.status_pendaftaran}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-[#0E6187]" />
                <div>
                  <p className="text-xs text-gray-500">Status Pembayaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentColor[pendaftar.status_pembayaran]}`}>
                    {pendaftar.status_pembayaran}
                  </span>
                </div>
              </div>
              {pendaftar.product && (
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-[#0E6187]" />
                  <div>
                    <p className="text-xs text-gray-500">Program</p>
                    <p className="font-semibold text-gray-900">{pendaftar.product.nama}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`${cardClass} lg:col-span-2`}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Kelola Data</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/siswa-dashboard/data-diri"
                  className="rounded-lg border border-gray-200 p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187]/10 text-[#0E6187]">
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Data Diri & Dokumen</p>
                    <p className="text-xs text-gray-500">Lengkapi profil dan upload dokumen</p>
                  </div>
                </Link>
                <div className="rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187]/10 text-[#0E6187]">
                    <CheckCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Status Lengkapi</p>
                    <p className="text-xs text-gray-500">{isDataLengkap ? 'Data sudah lengkap' : 'Belum lengkap'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>) : (
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <User size={28} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500">Belum ada data pendaftaran</p>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-4 px-4">
          <div className="w-full max-w-[460px] my-4">
            <div className="relative">
              <button
                onClick={() => { setShowPaymentModal(false); setShowDetail(false) }}
                className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-500" />
              </button>

              {checkoutLoading || !checkoutData ? (
                <div className="bg-white rounded-2xl p-10 text-center">
                  <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
                  </div>
                  <p className="mt-4 text-sm text-gray-500">Memuat data pembayaran...</p>
                </div>
              ) : (
                <div className="font-sans">
                  <div className="bg-white rounded-t-2xl pt-8 pb-6 px-6 relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#00C853] rounded-full border-[3px] border-[#0E6187] flex items-center justify-center shadow-sm">
                      <Check size={26} className="text-white" strokeWidth={3} />
                    </div>

                    <div className="text-center mb-6">
                      <h1 className="text-[22px] font-bold text-gray-800">{checkoutData.pendaftar.nama},</h1>
                      <p className="text-[15px] text-gray-600">Silakan lakukan pembayaran</p>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-gray-500 leading-tight max-w-[100px]">Batas Pembayaran</span>
                      {primaryCountdown && (
                        <div className="flex gap-4">
                          {[
                            { val: primaryCountdown.days, label: 'Hari' },
                            { val: primaryCountdown.hours, label: 'Jam' },
                            { val: primaryCountdown.minutes, label: 'Menit' },
                            { val: primaryCountdown.seconds, label: 'Detik' },
                          ].map(({ val, label }) => (
                            <div key={label} className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-red-500 tabular-nums tracking-widest">
                                {String(val).padStart(2, '0').split('').join(' ')}
                              </span>
                              <span className="text-[10px] text-red-500 font-medium">{label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {primaryCountdown && (
                      <div className="text-right text-[11px] text-gray-500 mb-2">
                        Jatuh Tempo {formatDate(primaryCountdown.deadline.toISOString())}
                      </div>
                    )}

                    {firstKategori && firstKategori.sisa > 0 && (() => {
                      const k = firstKategori
                      const cd = countdowns[k.id]
                      if (!cd) return null
                      return (
                        <div className="mb-4">
                          <div className={`flex items-center justify-between rounded-md px-3 py-2 text-[12px] ${
                            cd.expired ? 'bg-red-50 border border-red-200' : 'bg-[#FFF9E5] border border-yellow-100'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${cd.expired ? 'text-red-600' : 'text-gray-800'}`}>{k.nama}</span>
                              <span className="text-gray-400">•</span>
                              <span className={`font-medium ${cd.expired ? 'text-red-500' : 'text-gray-600'}`}>
                                {fmt(k.sisa > 0 ? k.sisa : k.harga)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                              {cd.expired ? (
                                <span className="text-red-600">Lewat {cd.days} hari</span>
                              ) : (
                                <span className="text-amber-700">
                                  {cd.days > 0 && <>{cd.days}h </>}
                                  {cd.hours}j {cd.minutes}m
                                </span>
                              )}
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{formatDate(cd.deadline.toISOString()).split(',').slice(0, 2).join(',')}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {paidItems.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {paidItems.map(k => (
                          <span key={k.id} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
                            <Check size={10} /> {k.nama} Lunas
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="bg-[#FFF9E5] rounded-md p-4 flex gap-3 items-start border border-yellow-100">
                      <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                      <div className="text-[13px] text-gray-700 leading-snug space-y-2">
                        {primaryCountdown && (
                          <div>
                            <p className="font-bold mb-0.5">Batas Pembayaran</p>
                            <p>Silakan selesaikan pembayaran sebelum <strong>{formatDate(primaryCountdown.deadline.toISOString())}</strong>.</p>
                          </div>
                        )}
                        <div>
                          <p className="font-bold mb-0.5">Verifikasi Pembayaran</p>
                          <p>Pembayaran yang berhasil akan diverifikasi kurang dari 15 menit dan paling lambat 1×24 jam setelah bukti pembayaran diterima.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-5 bg-white">
                    <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] border-dashed border-gray-300 -translate-y-1/2" />
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2" />
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2" />
                  </div>

                  <div className="bg-white py-6 px-6">
                    {firstKategori && (
                      <div className="mb-4 bg-[#E8FAFF] rounded-md p-3 text-center border border-blue-100">
                        <p className="text-[13px] text-gray-600 mb-1">Silakan bayar kategori:</p>
                        <p className="text-[15px] font-bold text-[#0E6187]">{firstKategori.nama}</p>
                      </div>
                    )}

                    {paymentCode && (
                      <div className="mb-4 bg-gray-50 rounded-md p-3 flex justify-between items-center border border-gray-100">
                        <span className="text-[12px] text-gray-500">Kode Pembayaran</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold font-mono text-gray-800">{paymentCode}</span>
                          <button onClick={() => copyToClipboard(paymentCode, 'payment_code')} className="p-1 rounded hover:bg-gray-200 transition-colors">
                            <Copy size={12} className={copiedField === 'payment_code' ? 'text-green-500' : 'text-gray-400'} />
                          </button>
                        </div>
                      </div>
                    )}

                    <h2 className="text-[15px] font-bold text-gray-800 mb-4">Tolong transfer ke</h2>

                    {activeBankAccounts.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {activeBankAccounts.map(acc => (
                          <div key={acc.id} className="border border-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-3 mb-2">
                              {acc.bank_logo ? (
                                <img src={`/storage/${acc.bank_logo}`} alt={acc.bank_name} className="w-8 h-8 rounded object-contain" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-[#0E6187]/10 flex items-center justify-center">
                                  <Building2 size={14} className="text-[#0E6187]" />
                                </div>
                              )}
                              <span className="text-[13px] font-bold text-gray-800">{acc.bank_name} a.n {acc.account_holder}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-[11px] text-gray-400">No. Rekening</p>
                                <p className="text-[14px] font-bold font-mono text-red-500">{acc.account_number}</p>
                              </div>
                              <button onClick={() => copyToClipboard(acc.account_number, `rek-${acc.id}`)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                                {copiedField === `rek-${acc.id}` ? 'Tersalin' : 'Salin'}
                                <Copy size={12} className={copiedField === `rek-${acc.id}` ? 'text-green-500' : ''} />
                              </button>
                            </div>
                            {acc.additional_info && (
                              <p className="mt-1.5 text-[11px] text-gray-400">{acc.additional_info}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-end mb-4">
                        <span className="text-[13px] font-bold text-gray-800">
                          {bankName} a.n {bankOwner}
                        </span>
                      </div>
                    )}

                    <div className="border-t border-gray-100 my-4" />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[13px] font-bold text-gray-800 mb-0.5">Nominal Tagihan</p>
                        <span className="text-[15px] font-medium text-gray-700">{fmt(totalBayar)}</span>
                      </div>

                      {kodeUnik > 0 && paymentEnabled && (
                        <>
                          <div className="border-t border-gray-100 my-2" />
                          <div className="flex justify-between items-center">
                            <p className="text-[13px] font-bold text-gray-800 mb-0.5">Total yang harus ditransfer</p>
                            <div className="text-right">
                              <p className="text-[17px] font-bold text-red-500">{fmt(totalTransfer)}</p>
                              <button
                                onClick={() => copyToClipboard(String(totalTransfer).replace(/[^0-9]/g, ''), 'nominal')}
                                className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors ml-auto">
                                {copiedField === 'nominal' ? 'Tersalin' : 'Salin'}
                                <Copy size={14} className={copiedField === 'nominal' ? 'text-green-500' : ''} />
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {(!kodeUnik || !paymentEnabled) && (
                        <div className="flex justify-between items-center">
                          <p className="text-[13px] font-bold text-gray-800 mb-0.5">Total Pembayaran</p>
                          <div className="text-right">
                            <p className="text-[17px] font-bold text-red-500">{fmt(totalBayar)}</p>
                            <button
                              onClick={() => copyToClipboard(String(totalBayar).replace(/[^0-9]/g, ''), 'nominal')}
                              className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors ml-auto">
                              {copiedField === 'nominal' ? 'Tersalin' : 'Salin'}
                              <Copy size={14} className={copiedField === 'nominal' ? 'text-green-500' : ''} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 bg-[#E8FAFF] rounded-md p-3 text-center text-[12px] text-gray-700 leading-relaxed">
                      <span className="font-bold">Penting!</span> Mohon transfer sesuai nominal hingga digit terakhir yaitu{' '}
                      <span className="font-bold text-red-500">{fmt(kodeUnik > 0 && paymentEnabled ? totalTransfer : totalBayar)}</span> agar pembayaran dapat diverifikasi dengan lebih mudah.
                    </div>
                  </div>

                  <div className="relative h-5 bg-white">
                    <div className="absolute top-1/2 left-4 right-4 border-t-[1.5px] border-dashed border-gray-300 -translate-y-1/2" />
                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2" />
                    <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E6187] rounded-full -translate-y-1/2" />
                  </div>

                  <div className="bg-white rounded-b-2xl py-6 px-6">
                    <button
                      onClick={() => setShowDetail(!showDetail)}
                      className="w-full flex items-center justify-center gap-2 text-[13px] font-bold text-gray-800 mb-5">
                      Lihat Detail Pesanan
                      {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showDetail && (
                      <div className="mb-4 text-[13px] space-y-2 text-gray-600 bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between">
                          <span>Nama:</span>
                          <span className="font-medium text-gray-800">{checkoutData.pendaftar.nama}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Email:</span>
                          <span className="font-medium text-gray-800">{checkoutData.pendaftar.email}</span>
                        </div>
                        {checkoutData.keuangan.diskon > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Diskon:</span>
                            <span>-{fmt(checkoutData.keuangan.diskon)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6 text-[13px]">
                      <div className="text-gray-800">
                        <p>Invoice ID: {checkoutData.no_invoice}</p>
                        <p className="mt-0.5">{checkoutData.product?.nama || '-'}</p>
                        {firstKategori && (
                          <p className="mt-0.5 text-[#0E6187] font-semibold">{firstKategori.nama} — {fmt(fkHarga)}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-6" />

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[12px] text-gray-500 max-w-[150px] leading-snug">
                        Konfirmasi pembayaran melalui halaman ini:
                      </span>
                      <a
                        href={`/konfirmasi-pembayaran/${checkoutData.pendaftar.id}`}
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold py-2.5 px-6 rounded-md text-[13px] transition-colors whitespace-nowrap">
                        KONFIRMASI
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TimelineStages({ jadwalLevels }: { jadwalLevels: Record<string, { tanggal_mulai: string; tanggal_selesai: string }> }) {
  const stages = [
    { level: -4, label: 'Wawancara' },
    { level: -3, label: 'Rapat Orang Tua' },
    { level: -2, label: 'MCU' },
    { level: -1, label: 'Pembukaan Kelas' },
    { level: 1, label: 'Level 1' },
    { level: 2, label: 'Level 2' },
    { level: 3, label: 'Level 3' },
    { level: 4, label: 'Level 4' },
  ]

  const today = new Date().toISOString().slice(0, 10)

  function getStatus(key: string) {
    const j = jadwalLevels[key]
    if (!j) return 'none'
    if (today < j.tanggal_mulai) return 'upcoming'
    if (today >= j.tanggal_mulai && today <= j.tanggal_selesai) return 'active'
    return 'done'
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const colorMap = {
    none: { dot: 'bg-gray-300', line: 'bg-gray-200', text: 'text-gray-400' },
    upcoming: { dot: 'bg-blue-400', line: 'bg-gray-200', text: 'text-gray-500' },
    active: { dot: 'bg-emerald-500', line: 'bg-emerald-400', text: 'text-emerald-700' },
    done: { dot: 'bg-slate-600', line: 'bg-slate-400', text: 'text-slate-700' },
  }

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {stages.map((s, idx) => {
        const key = String(s.level)
        const status = getStatus(key)
        const c = colorMap[status]
        const j = jadwalLevels[key]
        return (
          <div key={s.level} className="flex items-start shrink-0">
            <div className="flex flex-col items-center" style={{ minWidth: 110 }}>
              <div className={`w-4 h-4 rounded-full ${c.dot} border-2 border-white shadow-sm flex items-center justify-center`}>
                {status === 'done' && <CheckCircle size={10} className="text-white" />}
                {status === 'active' && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              </div>
              <div className={`mt-2 text-center ${status === 'none' ? 'opacity-50' : ''}`}>
                <p className={`text-[10px] font-semibold ${c.text} leading-tight`}>{s.label}</p>
                {j ? (
                  <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                    {formatDate(j.tanggal_mulai)}<br />s/d {formatDate(j.tanggal_selesai)}
                  </p>
                ) : (
                  <p className="text-[9px] text-gray-300 mt-0.5 italic">Belum diatur</p>
                )}
                {status === 'active' && (
                  <span className="mt-1 inline-block rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                    BERLANGSUNG
                  </span>
                )}
              </div>
            </div>
            {idx < stages.length - 1 && (
              <div className={`w-8 h-0.5 mt-2 ${c.line} shrink-0`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
