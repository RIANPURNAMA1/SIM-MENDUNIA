import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  User, Loader, Shield,
} from 'lucide-react'
import { affiliateLinkApi, pendaftarApi, couponApi, batchApi, paymentSettingApi } from '../../services/api'

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

interface Wilayah {
  id: string
  name: string
}

const API_BASE = 'https://cdn.jsdelivr.net/gh/izzulabadi/api-wilayah-indonesia-2026@v1.0.4/api'

export default function DaftarAffiliate() {
  const { kode } = useParams<{ kode: string }>()
  const [link, setLink] = useState<LinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const [provinsi, setProvinsi] = useState('')
  const [kabupaten, setKabupaten] = useState('')
  const [kecamatan, setKecamatan] = useState('')
  const [desa, setDesa] = useState('')
  const [provinsiList, setProvinsiList] = useState<Wilayah[]>([])
  const [kabupatenList, setKabupatenList] = useState<Wilayah[]>([])
  const [kecamatanList, setKecamatanList] = useState<Wilayah[]>([])
  const [desaList, setDesaList] = useState<Wilayah[]>([])
  const [wilayahLoading, setWilayahLoading] = useState({ provinsi: false, kabupaten: false, kecamatan: false, desa: false })
  const [paymentSettings, setPaymentSettings] = useState<{ manual_payment_enabled: boolean; unique_code_max: number; unique_code_operation: string } | null>(null)
  const [previewKodeUnik] = useState(() => {
    const key = `preview_kode_unik_${kode}`
    const saved = sessionStorage.getItem(key)
    if (saved) return Number(saved)
    const val = Math.floor(Math.random() * 99) + 1
    sessionStorage.setItem(key, String(val))
    return val
  })

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

  const totalDisplay = (() => {
    if (validasiKupon?.valid && validasiKupon.nominal_setelah_diskon !== undefined) {
      return validasiKupon.nominal_setelah_diskon
    }
    return selectedTotal
  })()

  useEffect(() => {
    batchApi.list().then(res => setBatches(res.data.data || [])).catch(() => {})
    paymentSettingApi.getPublicSettings().then(res => setPaymentSettings(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`${API_BASE}/provinces.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => setProvinsiList(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!provinsi) { setKabupatenList([]); setKabupaten(""); setKecamatanList([]); setKecamatan(""); setDesaList([]); setDesa(""); return }
    setWilayahLoading(p => ({ ...p, kabupaten: true }))
    fetch(`${API_BASE}/regencies/${provinsi}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => { setKabupatenList(data); setWilayahLoading(p => ({ ...p, kabupaten: false })) })
      .catch(() => setWilayahLoading(p => ({ ...p, kabupaten: false })))
  }, [provinsi])

  useEffect(() => {
    if (!kabupaten) { setKecamatanList([]); setKecamatan(""); setDesaList([]); setDesa(""); return }
    setWilayahLoading(p => ({ ...p, kecamatan: true }))
    fetch(`${API_BASE}/districts/${kabupaten}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => { setKecamatanList(data); setWilayahLoading(p => ({ ...p, kecamatan: false })) })
      .catch(() => setWilayahLoading(p => ({ ...p, kecamatan: false })))
  }, [kabupaten])

  useEffect(() => {
    if (!kecamatan) { setDesaList([]); setDesa(""); return }
    setWilayahLoading(p => ({ ...p, desa: true }))
    fetch(`${API_BASE}/villages/${kecamatan}.json`)
      .then(r => r.json())
      .then((data: Wilayah[]) => { setDesaList(data); setWilayahLoading(p => ({ ...p, desa: false })) })
      .catch(() => setWilayahLoading(p => ({ ...p, desa: false })))
  }, [kecamatan])

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

    setError('')

    const errors: Record<string, string> = {}
    if (!nama.trim()) errors.nama = "Nama lengkap wajib diisi"
    if (!email.trim()) errors.email = "Alamat email wajib diisi"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid"
    if (!password) errors.password = "Password wajib diisi"
    else if (password.length < 6) errors.password = "Password minimal 6 karakter"
    if (!telepon.trim()) errors.telepon = "Nomor WhatsApp wajib diisi"
    else if (!/^[0-9]+$/.test(telepon.replace(/[\s\-+()]/g, ""))) errors.telepon = "Nomor WhatsApp hanya boleh berisi angka"
    setFieldErrors(errors)
    setTouched({ nama: true, email: true, password: true, telepon: true })
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)

    const fd = new FormData()
    fd.append('kode_link', kode)
    fd.append('nama', nama)
    fd.append('email', email)
    fd.append('password', password)
    if (kodeKupon) fd.append('kode_kupon', kodeKupon)
    if (telepon) fd.append('telepon', telepon)
    if (alamat) fd.append('alamat', alamat)
    if (provinsi) fd.append('provinsi', provinsiList.find(p => p.id === provinsi)?.name || provinsi)
    if (kabupaten) fd.append('kabupaten', kabupatenList.find(r => r.id === kabupaten)?.name || kabupaten)
    if (kecamatan) fd.append('kecamatan', kecamatanList.find(d => d.id === kecamatan)?.name || kecamatan)
    if (desa) fd.append('desa', desaList.find(v => v.id === desa)?.name || desa)
    if (batchId) fd.append('batch_id', batchId)
    fd.append('kode_unik', String(previewKodeUnik))

    pendaftarApi.daftar(fd)
      .then(res => {
        const pendaftarId = res.data?.id
        window.location.href = `/checkout-berhasil/${pendaftarId}`
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Terjadi kesalahan')
      })
      .finally(() => setIsSubmitting(false))
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  function validateField(name: string, value: string) {
    let msg = ''
    if (name === 'nama' && !value.trim()) msg = 'Nama lengkap wajib diisi'
    else if (name === 'email') {
      if (!value.trim()) msg = 'Alamat email wajib diisi'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = 'Format email tidak valid'
    } else if (name === 'password') {
      if (!value) msg = 'Password wajib diisi'
      else if (value.length < 6) msg = 'Password minimal 6 karakter'
    } else if (name === 'telepon') {
      if (!value.trim()) msg = 'Nomor WhatsApp wajib diisi'
      else if (!/^[0-9]+$/.test(value.replace(/[\s\-+()]/g, ''))) msg = 'Nomor WhatsApp hanya boleh berisi angka'
    }
    setFieldErrors(prev => {
      const next = { ...prev }
      if (msg) next[name] = msg
      else delete next[name]
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (error && !link) {
    return (
      <div className="min-h-screen bg-[#0E6187] flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-xl max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-red-500">!</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Link Tidak Valid</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <a href="/login" className="inline-block w-full py-2.5 bg-[#0E6187] text-white font-bold rounded-lg text-sm">
            Kembali ke Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E6187]">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo-sm.png" alt="Mendunia" className="w-6 md:w-7 h-6 md:h-7" />
            <span className="text-base md:text-xl font-bold text-gray-900 tracking-tight">Mendunia.id</span>
          </a>
          <a href="/login" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={14} className="text-gray-500" />
            </div>
            <span className="hidden sm:inline">Masuk</span>
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Affiliate Recommendation Bar */}
        {link?.affiliate && (
          <div className="mb-4 bg-white border border-gray-200 rounded-lg p-2.5 md:p-3 flex items-center gap-2.5 shadow-sm">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <User size={12} className="text-amber-700" />
            </div>
            <p className="text-xs md:text-sm text-gray-600 truncate">
              Anda direkomendasikan oleh <span className="font-semibold text-gray-900">{link.affiliate.name}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Detail Pesanan */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Detail Pesanan</h2>

              <div className="pb-4 mb-4 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800 leading-snug">{link?.product?.nama}</p>
                <p className="text-lg font-bold text-[#0E6187] mt-1">
                  {paymentSettings?.manual_payment_enabled && paymentSettings.unique_code_max > 0
                    ? fmt(paymentSettings.unique_code_operation === 'subtract'
                      ? selectedTotal - previewKodeUnik
                      : selectedTotal + previewKodeUnik)
                    : fmt(selectedTotal)
                  }
                </p>
              </div>

              {validasiKupon?.valid && validasiKupon.nominal_setelah_diskon !== undefined && (
                <div className="flex justify-between text-sm text-green-600 pb-4 mb-4 border-b border-gray-100">
                  <span>Diskon</span>
                  <span>-{fmt(selectedTotal - validasiKupon.nominal_setelah_diskon)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-[#0E6187]">
                  {paymentSettings?.manual_payment_enabled && paymentSettings.unique_code_max > 0
                    ? fmt(paymentSettings.unique_code_operation === 'subtract'
                      ? selectedTotal - previewKodeUnik
                      : selectedTotal + previewKodeUnik)
                    : fmt(totalDisplay)
                  }
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Shield size={14} className="text-green-600" />
                <span>Secure 100%</span>
              </div>
            </div>

            {/* Voucher Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Voucher Diskon</h3>
              <p className="text-xs text-gray-500 mb-3">Masukkan kode diskon jika memilikinya</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kodeKupon}
                  onChange={(e) => { setKodeKupon(e.target.value.toUpperCase()); setValidasiKupon(null); }}
                  placeholder="Masukkan disini kode diskonnya"
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#0E6187] focus:border-[#0E6187] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={cekKupon}
                  disabled={!kodeKupon}
                  className="px-4 py-2 bg-[#0E6187] text-white rounded text-sm font-medium hover:bg-[#1a5e6f] disabled:opacity-50 transition-colors"
                >
                  Terapkan
                </button>
              </div>
              {validasiKupon && (
                <div className={`mt-2 p-2 rounded text-xs ${validasiKupon.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {validasiKupon.valid
                    ? `Berhasil! Total: ${fmt(validasiKupon.nominal_setelah_diskon || 0)}`
                    : validasiKupon.message}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Form Pendaftaran */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-1">
                  Sudah mempunyai akun?{' '}
                  <a href="/login" className="text-[#0E6187] font-semibold hover:underline">Login</a>
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-2">Buat Akun Baru</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Isi data-data di bawah untuk bisa mengakses member area serta informasi terkait pembelian.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => { setNama(e.target.value); if (touched.nama) validateField('nama', e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, nama: true })); validateField('nama', nama); }}
                    placeholder="Masukkan nama lengkap"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.nama ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#0E6187]'}`}
                  />
                  {fieldErrors.nama ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.nama}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Masukkan nama lengkap untuk kemudahan jika suatu saat diperlukan pencarian data.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Alamat Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (touched.email) validateField('email', e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, email: true })); validateField('email', email); }}
                    placeholder="Alamat Email"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#0E6187]'}`}
                  />
                  {fieldErrors.email ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Kami mengirimkan informasi akses dan transaksi pembelian ke alamat email ini.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Buat Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (touched.password) validateField('password', e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, password: true })); validateField('password', password); }}
                    placeholder="Buat Password"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#0E6187]'}`}
                  />
                  {fieldErrors.password ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Tuliskan password yang akan digunakan untuk website ini. Pastikan untuk menyimpan atau mengingat password yang ditulis.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => { setTelepon(e.target.value); if (touched.telepon) validateField('telepon', e.target.value); }}
                    onBlur={() => { setTouched(p => ({ ...p, telepon: true })); validateField('telepon', telepon); }}
                    placeholder="08123456789"
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors ${fieldErrors.telepon ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#0E6187]'}`}
                  />
                  {fieldErrors.telepon ? (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.telepon}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">
                      Masukkan nomor WhatsApp aktif untuk notifikasi transaksi.
                    </p>
                  )}
                </div>

                {/* Section Alamat */}
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Informasi Alamat</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Provinsi</label>
                      <select
                        value={provinsi}
                        onChange={(e) => { setProvinsi(e.target.value); fetchKabupaten(e.target.value); }}
                        disabled={wilayahLoading.provinsi}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors focus:border-[#0E6187] appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">{wilayahLoading.provinsi ? 'Memuat...' : 'Pilih Provinsi'}</option>
                        {provinsiList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Kabupaten / Kota</label>
                      <select
                        value={kabupaten}
                        onChange={(e) => { setKabupaten(e.target.value); fetchKecamatan(e.target.value); }}
                        disabled={!provinsi || wilayahLoading.kabupaten}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors focus:border-[#0E6187] appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">{wilayahLoading.kabupaten ? 'Memuat...' : 'Pilih Kabupaten/Kota'}</option>
                        {kabupatenList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Kecamatan</label>
                      <select
                        value={kecamatan}
                        onChange={(e) => { setKecamatan(e.target.value); fetchDesa(e.target.value); }}
                        disabled={!kabupaten || wilayahLoading.kecamatan}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors focus:border-[#0E6187] appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">{wilayahLoading.kecamatan ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                        {kecamatanList.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Desa / Kelurahan</label>
                      <select
                        value={desa}
                        onChange={(e) => setDesa(e.target.value)}
                        disabled={!kecamatan || wilayahLoading.desa}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors focus:border-[#0E6187] appearance-none cursor-pointer disabled:opacity-50"
                      >
                        <option value="">{wilayahLoading.desa ? 'Memuat...' : 'Pilih Desa/Kelurahan'}</option>
                        {desaList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Lengkap</label>
                      <textarea
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        placeholder="Masukkan alamat lengkap (jalan, RT/RW, nomor rumah)"
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors focus:border-[#0E6187] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Batch Selection */}
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Pilih Batch <span className="text-gray-400 font-normal text-xs">(opsional)</span></h3>
                  <select
                    value={batchId}
                    onChange={e => setBatchId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0E6187]/20 outline-none transition-colors focus:border-[#0E6187] appearance-none cursor-pointer"
                  >
                    <option value="">Belum ditentukan</option>
                    {batches.map(b => {
                      const penuh = b.is_penuh && b.kuota !== null && (b.siswas_count ?? 0) >= b.kuota
                      return (
                        <option key={b.id} value={b.id} disabled={penuh}>
                          {b.nama_batch}{penuh ? ' (Penuh)' : b.kuota ? ` (${b.siswas_count ?? 0}/${b.kuota})` : ''}
                        </option>
                      )
                    })}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1.5">Opsional — admin dapat menentukan batch nanti</p>
                </div>

                {/* Ringkasan Pembayaran */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Ringkasan Pembayaran</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Bayar</span>
                    <span className="text-lg font-bold text-[#0E6187]">
                      {paymentSettings?.manual_payment_enabled && paymentSettings.unique_code_max > 0
                        ? fmt(paymentSettings.unique_code_operation === 'subtract'
                          ? totalDisplay - previewKodeUnik
                          : totalDisplay + previewKodeUnik)
                        : fmt(totalDisplay)
                      }
                    </span>
                  </div>
                </div>

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

                <p className="text-xs text-emerald-600 text-center flex items-center justify-center gap-1">
                  <Shield size={12} /> Informasi Pribadi Anda Aman di sini
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-[#42b72a] text-white rounded-lg text-sm font-bold hover:bg-[#3ba124] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader size={16} className="animate-spin" /> Memproses...</>
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
