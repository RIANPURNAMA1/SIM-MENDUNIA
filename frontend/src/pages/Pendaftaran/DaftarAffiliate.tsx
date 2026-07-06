import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Gift, User, Mail, Lock, Phone, MapPin, Upload, DollarSign, CheckCircle, Loader, Tag } from 'lucide-react'
import { affiliateLinkApi, pendaftarApi, couponApi } from '../../services/api'

interface LinkData {
  kode: string
  affiliate: { id: number; name: string; email: string }
  product: { id: number; nama: string; deskripsi: string; harga: number }
}

export default function DaftarAffiliate() {
  const { kode } = useParams<{ kode: string }>()
  const [link, setLink] = useState<LinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    nama: '', email: '', password: '', password_confirmation: '',
    telepon: '', alamat: '', nominal: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [kodeKupon, setKodeKupon] = useState('')
  const [validasiKupon, setValidasiKupon] = useState<{ valid: boolean; diskon?: number; nominal_setelah_diskon?: number; message?: string } | null>(null)

  useEffect(() => {
    if (kode) {
      affiliateLinkApi.getByKode(kode)
        .then(res => setLink(res.data))
        .catch(() => setError('Link tidak valid atau sudah tidak aktif'))
        .finally(() => setLoading(false))
    }
  }, [kode])

  async function cekKupon() {
    if (!kodeKupon || !link) return
    try {
      const res = await couponApi.validate({
        kode: kodeKupon,
        product_id: link.product.id,
        nominal: Number(form.nominal || link.product.harga),
      })
      setValidasiKupon(res.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Kupon tidak valid'
      setValidasiKupon({ valid: false, message: msg })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kode) return

    if (form.password !== form.password_confirmation) {
      setError('Password tidak cocok')
      return
    }

    setSubmitting(true)
    setError('')

    const fd = new FormData()
    fd.append('kode_link', kode)
    fd.append('nama', form.nama)
    fd.append('email', form.email)
    fd.append('password', form.password)
    if (kodeKupon) fd.append('kode_kupon', kodeKupon)
    if (form.telepon) fd.append('telepon', form.telepon)
    if (form.alamat) fd.append('alamat', form.alamat)
    fd.append('nominal', form.nominal)
    fd.append('bukti_pembayaran', file!)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <Loader size={28} className="text-[#0D1F3C] animate-spin" />
      </div>
    )
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
    <div className="min-h-screen bg-[#f0f2f5] px-4 py-10">
      <div className="max-w-4xl mx-auto fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/logo-sm.png" alt="Mendunia" className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-extrabold text-[#0D1F3C] tracking-tight">Pendaftaran Program</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left - Program & Affiliate Info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Program Card */}
            <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0D1F3C] to-[#1a2d4a] rounded-xl flex items-center justify-center shadow-md">
                  <Gift size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#606770] uppercase tracking-wider">Program</p>
                  <p className="text-sm font-extrabold text-[#1c1e21]">{link?.product?.nama}</p>
                </div>
              </div>
              {link?.product?.deskripsi && (
                <p className="text-sm text-[#606770] mb-3 ml-[52px]">{link?.product?.deskripsi}</p>
              )}
              <div className="ml-[52px]">
                <p className="text-2xl font-extrabold text-[#0D1F3C]">
                  Rp {Number(link?.product?.harga || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Affiliate Card */}
            <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <User size={18} className="text-amber-700" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#606770] uppercase tracking-wider">Affiliate</p>
                  <p className="text-sm font-extrabold text-[#1c1e21]">{link?.affiliate?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Registration Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-[0_2px_4px_rgba(0,0,0,.1),0_8px_16px_rgba(0,0,0,.1)] p-5 pb-6">
              <h2 className="text-lg font-extrabold text-[#1c1e21] mb-1">Form Pendaftaran</h2>
              <p className="text-sm text-[#606770] mb-5">Isi data diri Anda untuk mendaftar</p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-700 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text" required value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                    placeholder="Nama Lengkap"
                    className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
                  />
                  <input
                    type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
                  />
                  <input
                    type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
                  />
                  <input
                    type="password" required value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })}
                    placeholder="Konfirmasi Password"
                    className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
                  />
                  <input
                    type="text" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })}
                    placeholder="Telepon (opsional)"
                    className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
                  />
                  <input
                    type="number" min={0} required value={form.nominal} onChange={e => setForm({ ...form, nominal: e.target.value })}
                    placeholder="Nominal Pembayaran"
                    className="w-full h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6]"
                  />
                </div>

                <textarea
                  value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Alamat (opsional)" rows={2}
                  className="w-full px-4 py-3 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6] resize-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text" value={kodeKupon} onChange={e => { setKodeKupon(e.target.value.toUpperCase()); setValidasiKupon(null) }}
                        placeholder="Kode Kupon"
                        className="flex-1 h-[52px] px-4 bg-[#f5f6f7] border border-[#dddfe2] rounded-lg focus:bg-white focus:border-[#0D1F3C] focus:ring-1 focus:ring-[#0D1F3C] outline-none transition-all text-[17px] text-[#1c1e21] placeholder:text-[#9ca0a6] font-mono"
                      />
                      <button type="button" onClick={cekKupon} disabled={!kodeKupon}
                        className="px-4 h-[52px] bg-[#0D1F3C] text-white rounded-lg text-sm font-bold hover:bg-[#1a2d4a] disabled:opacity-50 transition-colors flex-none">
                        Cek
                      </button>
                    </div>
                    {validasiKupon && (
                      <div className={`mt-2 p-2.5 rounded-lg text-sm ${validasiKupon.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {validasiKupon.valid ? (
                          <>Diskon: Rp {Number(validasiKupon.diskon).toLocaleString('id-ID')} → Bayar: Rp {Number(validasiKupon.nominal_setelah_diskon).toLocaleString('id-ID')}</>
                        ) : (
                          validasiKupon.message
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file" accept="image/*,.pdf" required onChange={e => setFile(e.target.files?.[0] || null)}
                      className="w-full h-[52px] pt-3.5 px-4 text-sm text-[#606770] file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#f5f6f7] file:text-[#0D1F3C] hover:file:bg-[#e4e6eb] file:cursor-pointer cursor-pointer bg-[#f5f6f7] border border-[#dddfe2] rounded-lg"
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full h-[48px] bg-[#0D1F3C] text-white rounded-lg font-bold text-xl hover:bg-[#1a2d4a] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center mt-1">
                  {submitting ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
