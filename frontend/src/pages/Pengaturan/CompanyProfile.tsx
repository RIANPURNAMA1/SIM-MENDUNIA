import { useState, useEffect } from 'react'
import { Building2, Upload } from 'lucide-react'
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
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
            Data tidak ditemukan
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] border border-blue-100">
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Profil Perusahaan</h1>
          <p className="text-sm text-slate-500">Atur informasi perusahaan untuk tampilan invoice</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <div className="p-5 space-y-5">
            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Logo Perusahaan</label>
              <p className="text-sm text-gray-500 mb-4">Upload logo untuk ditampilkan di invoice.</p>
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {(logoPreview || profile.logo_url) ? (
                    <img src={logoPreview || profile.logo_url!} alt="Logo" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 size={32} className="text-gray-300" />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload size={16} />
                  Pilih Logo
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Nama Brand / Perusahaan</label>
              <p className="text-sm text-gray-500 mb-3">Nama yang akan tampil sebagai judul di invoice.</p>
              <input
                type="text"
                name="company_name"
                value={profile.company_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-800 focus:border-[#0D1F3C] focus:outline-none focus:ring-1 focus:ring-[#0D1F3C]"
                required
              />
            </div>

            {/* PT Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Nama PT / Badan Hukum</label>
              <p className="text-sm text-gray-500 mb-3">Nama badan hukum yang akan tampil di invoice.</p>
              <input
                type="text"
                name="pt_name"
                value={profile.pt_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-800 focus:border-[#0D1F3C] focus:outline-none focus:ring-1 focus:ring-[#0D1F3C]"
                required
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Alamat</label>
              <p className="text-sm text-gray-500 mb-3">Alamat perusahaan untuk informasi di invoice.</p>
              <textarea
                name="address"
                value={profile.address || ''}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-800 focus:border-[#0D1F3C] focus:outline-none focus:ring-1 focus:ring-[#0D1F3C]"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email</label>
                <p className="text-sm text-gray-500 mb-3">Email kontak perusahaan.</p>
                <input
                  type="email"
                  name="email"
                  value={profile.email || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-800 focus:border-[#0D1F3C] focus:outline-none focus:ring-1 focus:ring-[#0D1F3C]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Telepon</label>
                <p className="text-sm text-gray-500 mb-3">Nomor telepon yang bisa dihubungi.</p>
                <input
                  type="text"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-gray-800 focus:border-[#0D1F3C] focus:outline-none focus:ring-1 focus:ring-[#0D1F3C]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D1F3C] px-5 py-2 text-sm font-medium text-white hover:bg-[#1a3054] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : null}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
