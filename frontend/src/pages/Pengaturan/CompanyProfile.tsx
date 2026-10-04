import { useState, useEffect } from 'react'
import { Building2, Upload, Loader, CreditCard } from 'lucide-react'
import { companyProfileApi } from '../../services/api'
import type { CompanyProfile } from '../../types'

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    companyProfileApi.get()
      .then(res => setProfile(res.data.data))
      .catch(() => setError('Gagal memuat data profil'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => prev ? { ...prev, [name]: value } : null)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSuccess('')
    setError('')

    try {
      const formData = new FormData()
      formData.append('company_name', profile.company_name)
      formData.append('pt_name', profile.pt_name)
      formData.append('address', profile.address || '')
      formData.append('email', profile.email || '')
      formData.append('phone', profile.phone || '')
      formData.append('bank_nama', profile.bank_nama || '')
      formData.append('bank_nomor_rekening', profile.bank_nomor_rekening || '')
      formData.append('bank_pemilik', profile.bank_pemilik || '')
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const res = await companyProfileApi.update(formData)
      setProfile(res.data.data)
      setLogoFile(null)
      setLogoPreview(null)
      setSuccess('Profil perusahaan berhasil diperbarui')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Gagal menyimpan profil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4 flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#1a73e8] border-t-[#1a73e8] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="bg-white border border-[#dadce0] p-6">
          <div className="flex min-h-[200px] items-center justify-center text-sm text-[#5f6368]">
            Data tidak ditemukan
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-[#dadce0] bg-[#f1f3f4] text-[#5f6368]">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-medium text-[#202124]">Profil Perusahaan</h1>
          <p className="text-sm text-[#5f6368]">Atur informasi perusahaan untuk tampilan invoice</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-[#e6f4ea] border border-[#a8dab5] px-4 py-3 text-sm text-[#137333]">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-[#fce8e6] border border-[#f28b82] px-4 py-3 text-sm text-[#c5221f]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-[#dadce0] overflow-hidden mb-4">
          <div className="p-5 space-y-5">
            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-[#202124] mb-1">Logo Perusahaan</label>
              <p className="text-sm text-[#5f6368] mb-4">Upload logo untuk ditampilkan di invoice.</p>
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden border border-[#dadce0] bg-[#f8f9fa]">
                  {(logoPreview || profile.logo_url) ? (
                    <img src={logoPreview || profile.logo_url!} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 size={32} className="text-[#80868b]" />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 border border-[#dadce0] bg-white px-4 py-2 text-sm font-medium text-[#3c4043] hover:bg-[#f8f9fa] transition-colors">
                  <Upload size={16} />
                  Pilih Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            <hr className="border-[#dadce0]" />

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-[#202124] mb-1">Nama Brand / Perusahaan</label>
              <p className="text-sm text-[#5f6368] mb-3">Nama yang akan tampil sebagai judul di invoice.</p>
              <input
                type="text"
                name="company_name"
                value={profile.company_name}
                onChange={handleChange}
                className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                required
              />
            </div>

            {/* PT Name */}
            <div>
              <label className="block text-sm font-semibold text-[#202124] mb-1">Nama PT / Badan Hukum</label>
              <p className="text-sm text-[#5f6368] mb-3">Nama badan hukum yang akan tampil di invoice.</p>
              <input
                type="text"
                name="pt_name"
                value={profile.pt_name}
                onChange={handleChange}
                className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-[#202124] mb-1">Alamat</label>
              <p className="text-sm text-[#5f6368] mb-3">Alamat perusahaan untuk informasi di invoice.</p>
              <textarea
                name="address"
                value={profile.address || ''}
                onChange={handleChange}
                rows={3}
                className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-[#202124] mb-1">Email</label>
                <p className="text-sm text-[#5f6368] mb-3">Email kontak perusahaan.</p>
                <input
                  type="email"
                  name="email"
                  value={profile.email || ''}
                  onChange={handleChange}
                  className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#202124] mb-1">Telepon</label>
                <p className="text-sm text-[#5f6368] mb-3">Nomor telepon yang bisa dihubungi.</p>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                />
              </div>
            </div>

            <hr className="border-[#dadce0]" />

            {/* Bank Info */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={16} className="text-[#5f6368]" />
                <label className="block text-sm font-semibold text-[#202124]">Informasi Rekening Bank</label>
              </div>
              <p className="text-sm text-[#5f6368] mb-3">Rekening yang ditampilkan di halaman pembayaran.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Nama Bank</label>
                  <input
                    type="text"
                    name="bank_nama"
                    value={profile.bank_nama || ''}
                    onChange={handleChange}
                    placeholder="BCA"
                    className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    name="bank_nomor_rekening"
                    value={profile.bank_nomor_rekening || ''}
                    onChange={handleChange}
                    placeholder="1831813364"
                    className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#3c4043] mb-1">Atas Nama</label>
                  <input
                    type="text"
                    name="bank_pemilik"
                    value={profile.bank_pemilik || ''}
                    onChange={handleChange}
                    placeholder="PT. Nama Perusahaan"
                    className="w-full border border-[#dadce0] px-4 py-2 text-sm text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:border-[#1a73e8]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#0E6187] px-5 py-2 text-sm font-medium text-white hover:bg-[#084c63] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : null}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
