import { useState, useEffect, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  GraduationCap, CheckCircle, Loader, User, MessageCircle,
  Upload, FileText, X,
} from 'lucide-react'
import { affiliateLinkApi, pendaftarApi, couponApi, batchApi } from '../../services/api'

interface LinkData {
  kode: string
  affiliate: { id: number; name: string; email: string }
  product: { id: number; nama: string; deskripsi: string; harga: number }
}

interface Batch {
  id: number
  nama_batch: string
  kuota: number | null
  siswas_count?: number
  is_penuh?: boolean
}

const steps = [
  { id: 1, label: 'Data Diri', desc: 'Informasi dasar pendaftar' },
  { id: 2, label: 'Kontak', desc: 'Informasi komunikasi' },
  { id: 3, label: 'Pembayaran', desc: 'Selesaikan transaksi' },
]

export default function DaftarAffiliate() {
  const { kode } = useParams<{ kode: string }>()
  const [link, setLink] = useState<LinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [telepon, setTelepon] = useState('')
  const [alamat, setAlamat] = useState('')
  const [bankAsal, setBankAsal] = useState('')
  const [namaRekening, setNamaRekening] = useState('')
  const [nominal, setNominal] = useState('')
  const [bukti, setBukti] = useState<File | null>(null)
  const [kodeKupon, setKodeKupon] = useState('')
  const [validasiKupon, setValidasiKupon] = useState<{
    valid: boolean
    diskon?: number
    nominal_setelah_diskon?: number
    message?: string
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchId, setBatchId] = useState('')
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    batchApi.list().then(res => setBatches(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (kode) {
      affiliateLinkApi.getByKode(kode)
        .then(res => {
          setLink(res.data)
        })
        .catch(() => setError('Link tidak valid atau sudah tidak aktif'))
        .finally(() => setLoading(false))
    }
  }, [kode])

  useEffect(() => {
    if (bukti && bukti.type.startsWith('image/')) {
      const url = URL.createObjectURL(bukti)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [bukti])

  async function cekKupon() {
    if (!kodeKupon || !link) return
    try {
      const res = await couponApi.validate({
        kode: kodeKupon,
        product_id: link.product.id,
        nominal: link.product.harga,
      })
      setValidasiKupon(res.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Kupon tidak valid'
      setValidasiKupon({ valid: false, message: msg })
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!kode) return

    if (password !== passwordConfirmation) {
      setError('Password tidak cocok')
      return
    }

    setSubmitting(true)
    setError('')

    const fd = new FormData()
    fd.append('kode_link', kode)
    fd.append('nama', nama)
    fd.append('email', email)
    fd.append('password', password)
    if (kodeKupon) fd.append('kode_kupon', kodeKupon)
    if (telepon) fd.append('telepon', telepon)
    if (alamat) fd.append('alamat', alamat)
    if (bankAsal) fd.append('bank_asal', bankAsal)
    if (namaRekening) fd.append('nama_rekening', namaRekening)
    if (batchId) fd.append('batch_id', batchId)
    fd.append('nominal', nominal)
    fd.append('bukti_pembayaran', bukti!)

    pendaftarApi.daftar(fd)
      .then(res => {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = res.data.redirect || '/dashboard-kandidat'
        }, 1500)
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan')
      })
      .finally(() => setSubmitting(false))
  }

  function nextStep() {
    if (step === 1 && (!nama || !email || !password || !passwordConfirmation)) {
      setError('Harap isi Nama, Email, Password, dan Konfirmasi Password')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Password tidak cocok')
      return
    }
    if (step === 2 && (!telepon || !alamat)) {
      setError('Harap isi Nomor Telepon dan Alamat Lengkap')
      return
    }
    setError('')
    setStep(s => Math.min(s + 1, 3))
  }

  function handleBuktiChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setFileError('')
    if (file && file.size > 5 * 1024 * 1024) {
      setFileError('Ukuran file maksimal 5MB')
      e.target.value = ''
      return
    }
    setBukti(file)
  }

  function handleFinalSubmit(e: FormEvent) {
    if (!bukti) {
      setError('Harap upload bukti pembayaran')
      return
    }
    if (fileError) return
    handleSubmit(e)
  }

  const Navbar = () => (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">Mendunia.id</span>
        </a>
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <User size={16} className="text-gray-500" />
            </div>
            <span>Masuk</span>
          </a>
        </div>
      </div>
    </nav>
  )

  const LoadingScreen = () => (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
        <img src="/logo-sm.png" alt="Mendunia" className="w-8 h-8" />
      </div>
    </div>
  )

  if (loading) {
    return <LoadingScreen />
  }

  if (error && !link) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-8 max-w-md w-full text-center fade-in">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-red-500">!</span>
          </div>
          <h1 className="text-xl font-bold text-[#1c1e21] mb-2">Link Tidak Valid</h1>
          <p className="text-sm text-[#606770]">{error}</p>
          <a href="http://localhost:5173/login"
            className="inline-block mt-6 h-10 px-6 bg-[#0D1F3C] text-white rounded-lg font-bold text-sm hover:bg-[#1a2d4a] transition-colors leading-10">
            Kembali ke Login
          </a>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-8 max-w-md w-full text-center fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-[#1c1e21] mb-2">Pendaftaran Berhasil!</h1>
          <p className="text-sm text-[#606770]">Anda akan dialihkan ke dashboard...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#0D1F3C]/30 border-t-[#0D1F3C] rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 fade-in">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Daftar Program Di Mendunia.id</h1>
          <p className="text-gray-600 text-base mt-2 leading-relaxed">
            Temukan program pelatihan bahasa dan persiapan kerja terbaik untuk
            mewujudkan impian karir global Anda.
          </p>
          <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm animate-slide-down">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center">
                <GraduationCap size={20} className="text-[#0D1F3C]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Program Dipilih</p>
                <p className="text-sm font-bold text-gray-900">{link?.product?.nama}</p>
              </div>
            </div>
            <p className="text-lg font-bold text-[#0D1F3C]">
              Rp {Number(link?.product?.harga || 0).toLocaleString('id-ID')}
            </p>
          </div>
          {link?.affiliate && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-amber-700" />
              </div>
              <p className="text-sm text-gray-600">
                Anda direkomendasikan oleh <span className="font-semibold text-gray-900">{link.affiliate.name}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* LEFT SIDEBAR: Stepper & Contact Card */}
          <div className="w-full md:w-1/4 flex-shrink-0 fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200 -z-10"></div>
              <div className="space-y-6">
                {steps.map((s) => {
                  const isActive = step === s.id
                  const isPassed = step > s.id
                  return (
                    <div key={s.id} className="flex gap-4">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold border-2 z-10 ${
                          isActive
                            ? 'bg-[#0D1F3C] border-[#0D1F3C] text-white'
                            : isPassed
                              ? 'bg-[#e8eaf0] border-[#e8eaf0] text-[#0D1F3C]'
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle size={14} /> : s.id}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-semibold ${isActive || isPassed ? 'text-[#0D1F3C]' : 'text-gray-400'}`}>
                          {s.label}
                        </p>
                        {(isActive || isPassed) && (
                          <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-12 bg-white border border-gray-200 rounded-lg p-5 shadow-sm fade-in" style={{ animationDelay: '0.15s' }}>
              <h4 className="text-sm font-bold text-gray-800 mb-1">BUTUH BANTUAN?</h4>
              <p className="text-xs text-gray-500 mb-4">
                Tulis pesan kepada kami dan kami akan menyelesaikannya
              </p>
              <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#eef1f6] text-[#0D1F3C] rounded-md text-sm font-semibold hover:bg-[#e4e7ec] transition-colors">
                <MessageCircle size={16} /> HUBUNGI KAMI
              </button>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT: Form Area */}
          <div className="w-full md:w-3/4 fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-8 py-5 border-b border-gray-200">
                <h2 className="text-xl text-gray-800 font-medium">
                  {step}. {steps[step - 1].label}
                </h2>
              </div>

              <div className="p-8 fade-in" key={step}>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={
                    step === 3
                      ? handleFinalSubmit
                      : (e) => {
                          e.preventDefault()
                          nextStep()
                        }
                  }
                >
                  {step === 1 && (
                    <div className="space-y-8">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eef1f6] flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-[#0D1F3C]" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">Data Pendaftar</h3>
                          <p className="text-sm text-gray-500">
                            Silakan isi informasi dasar pendaftar di bawah ini.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                        <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                          1. Informasi Dasar
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="sr-only">Nama Lengkap</label>
                            <input
                              type="text"
                              required
                              value={nama}
                              onChange={e => setNama(e.target.value)}
                              placeholder="Nama Lengkap"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="sr-only">Password</label>
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              minLength={6}
                              placeholder="Password (Min. 6 Karakter)"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="sr-only">Konfirmasi Password</label>
                          <input
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={e => setPasswordConfirmation(e.target.value)}
                            minLength={6}
                            placeholder="Konfirmasi Password"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                          />
                        </div>

                        <div>
                          <label className="sr-only">Email Aktif</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Alamat Email Aktif"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Batch</label>
                          <select
                            value={batchId}
                            onChange={e => setBatchId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm appearance-none cursor-pointer"
                          >
                            <option value="">Pilih Batch</option>
                            {batches.map((b) => {
                              const penuh = b.is_penuh && b.kuota !== null && (b.siswas_count ?? 0) >= b.kuota
                              return (
                                <option key={b.id} value={b.id} disabled={penuh}>
                                  {b.nama_batch}{penuh ? ' (Penuh)' : b.kuota ? ` (${b.siswas_count ?? 0}/${b.kuota})` : ''}
                                </option>
                              )
                            })}
                           </select>
                          {batchId && (() => {
                            const selectedBatch = batches.find(b => String(b.id) === batchId)
                            if (selectedBatch?.is_penuh) {
                              return (
                                <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                  Kelas ini sudah penuh. Silakan pilih batch lain.
                                </p>
                              )
                            }
                            return null
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8">
                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                          <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                           2. Detail Kontak
                         </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={telepon}
                              onChange={e => setTelepon(e.target.value)}
                              placeholder="08123456789"
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                            <textarea
                              required
                              value={alamat}
                              onChange={e => setAlamat(e.target.value)}
                              placeholder="Alamat Lengkap"
                              rows={3}
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-6">
                        <h4 className="text-xs font-bold text-[#0D1F3C] uppercase tracking-wider mb-4">
                          3. Ringkasan & Pembayaran
                        </h4>

                        <div className="mb-6 p-4 bg-white border border-gray-200 rounded text-sm">
                          <p className="text-gray-500 mb-1">Program yang dipilih:</p>
                          <p className="font-semibold text-gray-900">{link?.product?.nama}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">Harga Program</span>
                            <p className="font-bold text-[#0D1F3C]">
                              Rp {Number(link?.product?.harga || 0).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dari Bank <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={bankAsal}
                            onChange={e => setBankAsal(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm appearance-none cursor-pointer"
                          >
                            <option value="">Pilih Bank</option>
                            <option value="BCA">BCA</option>
                            <option value="BNI">BNI</option>
                            <option value="BRI">BRI</option>
                            <option value="Mandiri">Mandiri</option>
                            <option value="CIMB Niaga">CIMB Niaga</option>
                            <option value="BSI">BSI</option>
                            <option value="Danamon">Danamon</option>
                            <option value="Permata">Permata</option>
                            <option value="OCBC NISP">OCBC NISP</option>
                            <option value="Maybank">Maybank</option>
                            <option value="Panin">Panin</option>
                            <option value="Mega">Mega</option>
                            <option value="BTN">BTN</option>
                            <option value="BTPN">BTPN</option>
                            <option value="BJB">BJB</option>
                            <option value="Sea Bank">Sea Bank</option>
                            <option value="Neo Commerce">Neo Commerce</option>
                            <option value="Jago">Jago</option>
                            <option value="GoPay">GoPay</option>
                            <option value="OVO">OVO</option>
                            <option value="DANA">DANA</option>
                            <option value="LinkAja">LinkAja</option>
                            <option value="ShopeePay">ShopeePay</option>
                            <option value="E-Wallet Lainnya">E-Wallet Lainnya</option>
                            <option value="Bank Lainnya">Bank Lainnya</option>
                          </select>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Pemilik Rekening <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={namaRekening}
                            onChange={e => setNamaRekening(e.target.value)}
                            placeholder="Sesuai nama di rekening/bank"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                          />
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nominal Pembayaran <span className="text-xs text-gray-400 font-normal">(isi jumlah yang ingin dibayarkan sekarang)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Rp</span>
                            <input
                              type="text"
                              required
                              value={nominal ? Number(nominal).toLocaleString('id-ID') : ''}
                              onChange={e => {
                                const raw = e.target.value.replace(/\./g, '').replace(/,.*$/, '')
                                if (raw === '' || /^\d+$/.test(raw)) setNominal(raw)
                              }}
                              placeholder="0"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Kode Kupon (Opsional)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={kodeKupon}
                                onChange={e => {
                                  setKodeKupon(e.target.value.toUpperCase())
                                  setValidasiKupon(null)
                                }}
                                placeholder="Masukkan kode kupon"
                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm font-mono"
                              />
                              <button
                                type="button"
                                onClick={cekKupon}
                                disabled={!kodeKupon}
                                className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded text-sm font-medium hover:bg-[#1a2d4a] disabled:opacity-50 transition-colors"
                              >
                                Terapkan
                              </button>
                            </div>
                            {validasiKupon && (
                              <div
                                className={`mt-2 p-3 rounded text-sm ${validasiKupon.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                              >
                                {validasiKupon.valid
                                  ? `Berhasil! Total Bayar: Rp ${Number(validasiKupon.nominal_setelah_diskon).toLocaleString('id-ID')}`
                                  : validasiKupon.message}
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upload Bukti Pembayaran
                            </label>

                            {bukti && previewUrl ? (
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white mb-3">
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="w-full h-48 object-contain bg-[#f7f8fa]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setBukti(null)}
                                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : bukti && !previewUrl ? (
                              <div className="relative rounded-lg border border-gray-200 bg-white p-4 mb-3 flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-none">
                                  <FileText size={20} className="text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{bukti.name}</p>
                                  <p className="text-xs text-gray-500">PDF</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setBukti(null)}
                                  className="w-7 h-7 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-none"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : null}

                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                  <p className="text-sm text-gray-500 font-semibold">
                                    {bukti ? 'Ganti file' : 'Klik untuk upload'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    .JPG, .PNG, atau .PDF
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  required
                                  onChange={handleBuktiChange}
                                />
                              </label>
                            </div>
                            {fileError && (
                              <p className="mt-2 text-sm text-red-600">{fileError}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Area */}
                  <div className="mt-8 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-gray-500 flex-1">
                      {step === 3 && (
                        <>
                          <input
                            type="checkbox"
                            required
                            className="w-4 h-4 text-[#0D1F3C] border-gray-300 rounded focus:ring-[#0D1F3C]"
                          />
                          <span>
                            Saya menyetujui syarat & ketentuan Mendunia dan memastikan data benar.
                          </span>
                        </>
                      )}
                    </label>

                    <div className="flex gap-3">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={() => setStep(s => s - 1)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Kembali
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center gap-2"
                      >
                        {submitting ? (
                          <Loader size={16} className="animate-spin" />
                        ) : step === 3 ? (
                          'Kirim Pendaftaran'
                        ) : (
                          'Selanjutnya'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
