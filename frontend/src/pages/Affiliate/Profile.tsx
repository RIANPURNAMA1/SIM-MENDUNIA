import { useState, useEffect } from 'react'
import { User, Save, Lock, Eye, EyeOff, Loader, CheckCircle, XCircle } from 'lucide-react'
import { profileApi } from '../../services/api'
import api from '../../services/api'

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    no_hp: '',
    alamat: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    bank: '',
    no_rekening: '',
    nama_rekening: '',
  })

  const [password, setPassword] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })

  useEffect(() => {
    api.get('/auth/user')
      .then(res => {
        const u = res.data
        setForm({
          name: u.name || '',
          email: u.email || '',
          no_hp: u.no_hp || '',
          alamat: u.alamat || '',
          provinsi: u.provinsi || '',
          kabupaten: u.kabupaten || '',
          kecamatan: u.kecamatan || '',
          desa: u.desa || '',
          bank: u.bank || '',
          no_rekening: u.no_rekening || '',
          nama_rekening: u.nama_rekening || '',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('no_hp', form.no_hp)
      fd.append('alamat', form.alamat)
      fd.append('provinsi', form.provinsi)
      fd.append('kabupaten', form.kabupaten)
      fd.append('kecamatan', form.kecamatan)
      fd.append('desa', form.desa)
      fd.append('bank', form.bank)
      fd.append('no_rekening', form.no_rekening)
      fd.append('nama_rekening', form.nama_rekening)
      await profileApi.update(fd)
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
    } catch {
      setMessage({ type: 'error', text: 'Gagal menyimpan profil' })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPassword(true)
    setMessage(null)
    try {
      await profileApi.changePassword(password)
      setMessage({ type: 'success', text: 'Password berhasil diubah!' })
      setPassword({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengubah password'
      setMessage({ type: 'error', text: msg })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 max-w-3xl mx-auto">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Profil Saya</h1>
            <p className="text-sm text-slate-500">Kelola data diri dan pengaturan akun</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
          message.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-slate-800">Data Diri</h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Nama Lengkap <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
              <input type="email" value={form.email} disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">No. WhatsApp</label>
              <input type="text" value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Alamat</label>
              <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Provinsi</label>
              <input type="text" value={form.provinsi} readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Kabupaten / Kota</label>
              <input type="text" value={form.kabupaten} readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Kecamatan</label>
              <input type="text" value={form.kecamatan} readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Desa / Kelurahan</label>
              <input type="text" value={form.desa} readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-3.5 flex justify-end">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a4a6e] disabled:opacity-50 active:scale-[0.97]">
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </form>

      {/* Bank Info */}
      <form onSubmit={handleSave} className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-slate-800">Rekening Bank</h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Nama Bank</label>
              <input type="text" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">No. Rekening</label>
              <input type="text" value={form.no_rekening} onChange={e => setForm({ ...form, no_rekening: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Nama Pemilik Rekening</label>
              <input type="text" value={form.nama_rekening} onChange={e => setForm({ ...form, nama_rekening: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-3.5 flex justify-end">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0E6187] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a4a6e] disabled:opacity-50 active:scale-[0.97]">
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Menyimpan...' : 'Simpan Rekening'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-slate-800">Ubah Password</h2>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password Saat Ini</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password.current_password}
                onChange={e => setPassword({ ...password, current_password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password Baru</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={password.new_password}
                onChange={e => setPassword({ ...password, new_password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Konfirmasi Password Baru</label>
            <input type="password" value={password.new_password_confirmation}
              onChange={e => setPassword({ ...password, new_password_confirmation: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-3.5 flex justify-end">
          <button type="submit" disabled={changingPassword || !password.current_password || !password.new_password || !password.new_password_confirmation}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.97]">
            {changingPassword ? <Loader size={16} className="animate-spin" /> : <Lock size={16} />}
            {changingPassword ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
