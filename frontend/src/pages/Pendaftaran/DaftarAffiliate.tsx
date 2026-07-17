import { useState, useEffect, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  GraduationCap, CheckCircle, User,
  FileText, ChevronRight, Loader, Tag,
} from 'lucide-react'
import { affiliateLinkApi, pendaftarApi, couponApi, batchApi } from '../../services/api'

interface KategoriItem {
  name: string
  harga: number
  komisi: number
  children: KategoriItem[]
}

interface LinkData {
  kode: string
  affiliate: { id: number; name: string; email: string }
  product: { id: number; nama: string; deskripsi: string; harga: number; kategori_items?: KategoriItem[] }
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
  { id: 3, label: 'Ringkasan', desc: 'Konfirmasi pendaftaran' },
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
  const [kodeKupon, setKodeKupon] = useState('')
  const [validasiKupon, setValidasiKupon] = useState<{
    valid: boolean
    diskon?: number
    nominal_setelah_diskon?: number
    message?: string
  } | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchId, setBatchId] = useState('')
  const [successInfo, setSuccessInfo] = useState<{ noRegistrasi: string; invoiceUrl: string; pendaftarId: number | null } | null>(null)

  function getFlattenedItems(items: KategoriItem[], parentOnly = false): { item: KategoriItem; depth: number }[] {
    const result: { item: KategoriItem; depth: number }[] = []
    function walk(list: KategoriItem[], depth: number) {
      for (const item of list) {
        if (item.harga > 0) {
          result.push({ item, depth })
        }
        if (!parentOnly && item.children?.length) walk(item.children, depth + 1)
      }
    }
    walk(items, 0)
    return result
  }

  const selectedTotal = (() => {
    if (!link?.product?.kategori_items?.length) return link?.product?.harga || 0
    const flat = getFlattenedItems(link.product.kategori_items, true)
    if (flat.length === 0) return 0
    return flat[0].item.harga || 0
  })()

  const [provinsi, setProvinsi] = useState('')
  const [kabupaten, setKabupaten] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([])
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([])
  const [loadingRegencies, setLoadingRegencies] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingVillages, setLoadingVillages] = useState(false)

  useEffect(() => {
    batchApi.list().then(res => setBatches(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => setProvinces(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!provinsi) { setRegencies([]); setKabupaten(""); setDistricts([]); setKecamatan(""); setVillages([]); setDesa(""); return }
    setLoadingRegencies(true)
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinsi}.json`)
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { setRegencies(data); setLoadingRegencies(false) })
      .catch(() => setLoadingRegencies(false))
  }, [provinsi])

  useEffect(() => {
    if (!kabupaten) { setDistricts([]); setKecamatan(""); setVillages([]); setDesa(""); return }
    setLoadingDistricts(true)
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${kabupaten}.json`)
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { setDistricts(data); setLoadingDistricts(false) })
      .catch(() => setLoadingDistricts(false))
  }, [kabupaten])

  useEffect(() => {
    if (!kecamatan) { setVillages([]); setDesa(""); return }
    setLoadingVillages(true)
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${kecamatan}.json`)
      .then(r => r.json())
      .then((data: { id: string; name: string }[]) => { setVillages(data); setLoadingVillages(false) })
      .catch(() => setLoadingVillages(false))
  }, [kecamatan])

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

  const totalDisplay = (() => {
    if (validasiKupon?.valid && validasiKupon.nominal_setelah_diskon !== undefined) {
      return validasiKupon.nominal_setelah_diskon
    }
    return selectedTotal
  })()

  async function cekKupon() {
    if (!kodeKupon || !link) return
    try {
      const res = await couponApi.validate({
        kode: kodeKupon,
        product_id: link.product.id,
        nominal: selectedTotal,
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
    if (provinsi) fd.append('provinsi', provinces.find(p => p.id === provinsi)?.name || provinsi)
    if (kabupaten) fd.append('kabupaten', regencies.find(r => r.id === kabupaten)?.name || kabupaten)
    if (kecamatan) fd.append('kecamatan', districts.find(d => d.id === kecamatan)?.name || kecamatan)
    if (desa) fd.append('desa', villages.find(v => v.id === desa)?.name || desa)
    if (batchId) fd.append('batch_id', batchId)

    pendaftarApi.daftar(fd)
      .then(res => {
        const noReg = res.data?.no_registrasi || res.data?.noRegistrasi || '-'
        const invoiceUrl = res.data?.invoice_url || `/pendaftar/${res.data?.id}/invoice`
        setSuccessInfo({ noRegistrasi: noReg, invoiceUrl, pendaftarId: res.data?.id || null })
        setSuccess(true)
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
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
        <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
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
          <a href={`${window.location.origin}/login`}
            className="inline-block mt-6 h-10 px-6 bg-[#0E6187] text-white rounded-lg font-bold text-sm hover:bg-[#1a5e6f] transition-colors leading-10">
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
          <p className="text-sm text-[#606770] mb-6">Data pendaftaran Anda telah tersimpan.</p>
          <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 text-left mb-6">
            <p className="text-xs text-gray-500 mb-1">Nomor Invoice</p>
            <p className="text-sm font-mono font-bold text-gray-900">{successInfo?.noRegistrasi || '-'}</p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Sistem telah mengirim notifikasi WhatsApp berisi tautan pembayaran. Silakan cek WhatsApp Anda untuk menyelesaikan pembayaran.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`/bayar/${successInfo?.pendaftarId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0E6187] text-white rounded-lg text-sm font-semibold hover:bg-[#1a5e6f] transition-colors"
            >
              <FileText size={16} /> Bayar Sekarang
            </a>
            <a
              href={successInfo?.invoiceUrl || '#'}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Lihat Invoice
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10 fade-in">
        <div className="mb-6 md:mb-8">
          <h1 className="text-base md:text-xl font-bold text-gray-900">Daftar Program Di Mendunia.id</h1>
          <p className="text-gray-600 text-sm md:text-base mt-1 md:mt-2 leading-relaxed">
            Temukan program pelatihan bahasa dan persiapan kerja terbaik untuk
            mewujudkan impian karir global Anda.
          </p>
          <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 md:p-4 flex items-center justify-between gap-3 shadow-sm animate-slide-down">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center shrink-0">
                <GraduationCap size={16} className="text-[#0E6187]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 font-medium">Program Dipilih</p>
                <p className="text-xs md:text-sm font-bold text-gray-900 truncate">{link?.product?.nama}</p>
              </div>
            </div>
            <p className="text-sm md:text-lg font-bold text-[#0E6187] shrink-0">
              Rp {Number(selectedTotal).toLocaleString('id-ID')}
            </p>
          </div>
          {link?.affiliate && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg p-2.5 md:p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <User size={12} className="text-amber-700" />
              </div>
              <p className="text-xs md:text-sm text-gray-600 truncate">
                Anda direkomendasikan oleh <span className="font-semibold text-gray-900">{link.affiliate.name}</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          {/* LEFT SIDEBAR: Stepper — hidden on mobile */}
          <div className="hidden md:block w-full md:w-1/4 flex-shrink-0 fade-in" style={{ animationDelay: '0.1s' }}>
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
                            ? 'bg-[#0E6187] border-[#0E6187] text-white'
                            : isPassed
                              ? 'bg-[#e8eaf0] border-[#e8eaf0] text-[#0E6187]'
                              : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {isPassed ? <CheckCircle size={14} /> : s.id}
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-semibold ${isActive || isPassed ? 'text-[#0E6187]' : 'text-gray-400'}`}>
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
          </div>

          {/* RIGHT MAIN CONTENT: Form Area */}
          <div className="w-full md:w-3/4 fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Mobile horizontal stepper */}
            <div className="md:hidden mb-4">
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                {steps.map((s, i) => {
                  const isActive = step === s.id
                  const isPassed = step > s.id
                  return (
                    <div key={s.id} className="flex items-center gap-1.5 flex-1">
                      {i > 0 && (
                        <div className={`h-0.5 flex-1 ${isPassed || isActive ? 'bg-[#0E6187]' : 'bg-gray-200'}`} />
                      )}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shrink-0 ${
                            isActive
                              ? 'bg-[#0E6187] border-[#0E6187] text-white'
                              : isPassed
                                ? 'bg-[#e8eaf0] border-[#e8eaf0] text-[#0E6187]'
                                : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle size={10} /> : s.id}
                        </div>
                        <span className={`text-[9px] mt-1 leading-tight text-center ${isActive ? 'text-[#0E6187] font-semibold' : isPassed ? 'text-[#0E6187]' : 'text-gray-400'}`}>
                          {s.label}
                        </span>
                      </div>
                      {i === steps.length - 1 && <div className="h-0.5 flex-1" />}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-4 md:px-8 py-4 md:py-5 border-b border-gray-200">
                <h2 className="text-base md:text-xl text-gray-800 font-medium">
                  {step}. {steps[step - 1].label}
                </h2>
              </div>

              <div className="p-4 md:p-8 fade-in" key={step}>
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={
                    step === 3
                      ? handleSubmit
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
                          <User size={16} className="text-[#0E6187]" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-800">Data Pendaftar</h3>
                          <p className="text-sm text-gray-500">
                            Silakan isi informasi dasar pendaftar di bawah ini.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 md:p-6">
                        <h4 className="text-xs font-bold text-[#0E6187] uppercase tracking-wider mb-4">
                          1. Informasi Dasar
                        </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Nama Lengkap</label>
                            <input
                              type="text"
                              required
                              value={nama}
                              onChange={e => setNama(e.target.value)}
                              placeholder="Nama Lengkap"
                              className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Password</label>
                            <input
                              type="password"
                              required
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              minLength={6}
                              placeholder="Password (Min. 6 Karakter)"
                              className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Konfirmasi Password</label>
                          <input
                            type="password"
                            required
                            value={passwordConfirmation}
                            onChange={e => setPasswordConfirmation(e.target.value)}
                            minLength={6}
                            placeholder="Konfirmasi Password"
                            className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                          />
                        </div>

                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1 md:hidden">Email Aktif</label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Alamat Email Aktif"
                            className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                          />
                        </div>

                        <div className="mt-5 pt-5 border-t border-gray-200">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Pilih Batch <span className="text-gray-400 font-normal">(opsional)</span></label>
                          <select
                            value={batchId}
                            onChange={e => setBatchId(e.target.value)}
                            className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm appearance-none cursor-pointer"
                          >
                            <option value="">Belum ditentukan</option>
                            {batches.map((b) => {
                              const penuh = b.is_penuh && b.kuota !== null && (b.siswas_count ?? 0) >= b.kuota
                              return (
                                <option key={b.id} value={b.id} disabled={penuh}>
                                  {b.nama_batch}{penuh ? ' (Penuh)' : b.kuota ? ` (${b.siswas_count ?? 0}/${b.kuota})` : ''}
                                </option>
                              )
                            })}
                           </select>
                          <p className="text-[11px] text-gray-400 mt-1.5">Opsional — admin dapat menentukan batch nanti</p>
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
                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 md:p-6">
                          <h4 className="text-xs font-bold text-[#0E6187] uppercase tracking-wider mb-4">
                           2. Detail Kontak
                         </h4>

                        <div className="space-y-3 md:space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Nomor WhatsApp <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              required
                              value={telepon}
                              onChange={e => setTelepon(e.target.value)}
                              placeholder="08123456789"
                              className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                            <textarea
                              required
                              value={alamat}
                              onChange={e => setAlamat(e.target.value)}
                              placeholder="Alamat Lengkap"
                              rows={3}
                              className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Provinsi</label>
                              <select
                                value={provinsi}
                                onChange={e => { setProvinsi(e.target.value); setKabupaten(""); setKecamatan(""); setDesa(""); }}
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm"
                              >
                                <option value="">Pilih Provinsi</option>
                                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Kabupaten / Kota</label>
                              <select
                                value={kabupaten}
                                onChange={e => { setKabupaten(e.target.value); setKecamatan(""); setDesa(""); }}
                                disabled={!provinsi || loadingRegencies}
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                <option value="">{loadingRegencies ? 'Memuat...' : 'Pilih Kabupaten'}</option>
                                {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Kecamatan</label>
                              <select
                                value={kecamatan}
                                onChange={e => { setKecamatan(e.target.value); setDesa(""); }}
                                disabled={!kabupaten || loadingDistricts}
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                <option value="">{loadingDistricts ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Desa / Kelurahan</label>
                              <select
                                value={desa}
                                onChange={e => setDesa(e.target.value)}
                                disabled={!kecamatan || loadingVillages}
                                className="w-full px-4 py-3 md:py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm disabled:bg-gray-50 disabled:text-gray-400"
                              >
                                <option value="">{loadingVillages ? 'Memuat...' : 'Pilih Desa'}</option>
                                {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8">
                      <div className="bg-[#f8f9fc] border border-[#e8eaf0] rounded-lg p-4 md:p-6">
                        <h4 className="text-xs font-bold text-[#0E6187] uppercase tracking-wider mb-4">
                          3. Ringkasan Pendaftaran
                        </h4>

                        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white border border-gray-200 rounded text-sm">
                          <p className="text-gray-500 mb-1">Program yang dipilih:</p>
                          <p className="font-semibold text-gray-900">{link?.product?.nama}</p>

                          {link?.product?.kategori_items && link.product.kategori_items.length > 0 && (() => {
                            const flat = getFlattenedItems(link.product.kategori_items!, true)
                            if (flat.length === 0) return null
                            const firstItem = flat[0]
                            return (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Kategori Pembayaran:</p>
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5 py-1.5 px-2.5 rounded bg-blue-50 border border-blue-200">
                                    <span className="text-xs font-medium text-gray-700">{firstItem.item.name}</span>
                                    <span className="ml-auto text-xs font-bold text-gray-900">
                                      Rp {Number(firstItem.item.harga).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                </div>
                                {flat.length > 1 && (
                                  <p className="text-[11px] text-gray-400 mt-2">Pembayaran tahapan lainnya dilakukan setelah pendaftaran</p>
                                )}
                              </div>
                            )
                          })()}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs font-semibold text-gray-700">Total yang harus dibayar</span>
                            <p className="font-bold text-base md:text-lg text-[#0E6187]">
                              Rp {Number(totalDisplay).toLocaleString('id-ID')}
                            </p>
                          </div>
                          {validasiKupon?.valid && (
                            <p className="text-[11px] text-green-600 mt-1">
                              Kupon diterapkan: Hemat Rp {Number(selectedTotal - (validasiKupon.nominal_setelah_diskon || 0)).toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>

                        <div className="mb-4 md:mb-6">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Kode Kupon (Opsional)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={kodeKupon}
                              onChange={e => {
                                setKodeKupon(e.target.value.toUpperCase())
                                setValidasiKupon(null)
                              }}
                              placeholder="Masukkan kode kupon"
                              className="flex-1 w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none transition-colors text-sm font-mono"
                            />
                            <button
                              type="button"
                              onClick={cekKupon}
                              disabled={!kodeKupon}
                              className="px-6 py-2.5 bg-[#0E6187] text-white rounded text-sm font-medium hover:bg-[#1a5e6f] disabled:opacity-50 transition-colors"
                            >
                              Terapkan
                            </button>
                          </div>
                          {validasiKupon && (
                            <div
                              className={`mt-2 p-3 rounded text-sm ${validasiKupon.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                            >
                              {validasiKupon.valid
                                ? `Total setelah kupon: Rp ${Number(validasiKupon.nominal_setelah_diskon).toLocaleString('id-ID')}`
                                : validasiKupon.message}
                            </div>
                          )}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4">
                          <div className="flex items-start gap-2.5 md:gap-3">
                            <Tag size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs md:text-sm font-semibold text-amber-800">Cara Pembayaran</p>
                              <p className="text-[11px] md:text-xs text-amber-700 mt-1 leading-relaxed">
                                Setelah menekan tombol <strong>Daftar</strong>, sistem akan membuat Nomor Invoice dan mengirimkan notifikasi WhatsApp berisi tautan pembayaran ke nomor telepon Anda. Silakan cek WhatsApp untuk menyelesaikan pembayaran.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Area */}
                  <div className="mt-6 md:mt-8 flex flex-col gap-3 md:gap-4">
                    {step === 3 && (
                      <label className="flex items-start gap-2 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          required
                          className="w-4 h-4 text-[#0E6187] border-gray-300 rounded focus:ring-[#0E6187] mt-0.5 shrink-0"
                        />
                        <span className="leading-relaxed">
                          Saya menyetujui syarat & ketentuan Mendunia dan memastikan data benar.
                        </span>
                      </label>
                    )}

                    <div className="flex gap-3">
                      {step > 1 && (
                        <button
                          type="button"
                          onClick={() => setStep(s => s - 1)}
                          className="flex-1 px-4 py-3 md:py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Kembali
                        </button>
                      )}
                      {step < 3 ? (
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 md:py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors flex items-center justify-center gap-2"
                        >
                          Selanjutnya
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-6 py-3 md:py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {submitting ? (
                            <><Loader size={16} className="animate-spin" /> Mendaftarkan...</>
                          ) : (
                            <><FileText size={16} /> Daftar</>
                          )}
                        </button>
                      )}
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
