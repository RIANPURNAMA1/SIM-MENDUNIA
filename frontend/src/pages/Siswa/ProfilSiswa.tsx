import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileApi, APP_URL } from '../../services/api'
import { User, Camera, Save, Lock, LogOut, Mail } from 'lucide-react'
import Swal from 'sweetalert2'

const inputCls = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400'

export default function ProfilSiswa() {
  const { user, logout, fetchUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!user?.id) return
    setLoading(false)
    ;(async () => {
      try {
        const res = await fetch(`${APP_URL}/siswa-dashboard`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const data = await res.json()
        const u = data.user || {}
        setForm({
          name: u.name || user.name || '',
        })
      } catch {
        setForm(f => ({ ...f, name: user.name || f.name }))
      }
    })()
  }, [user?.id, user?.name])

  const fotoUrl = user?.foto_profil ? `${APP_URL}/uploads/foto_profil/${user.foto_profil}` : null
  const previewUrl = fotoPreview || fotoUrl

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFotoFile(f)
    setFotoPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      Swal.fire({ icon: 'error', title: 'Nama wajib diisi' })
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      if (fotoFile) fd.append('foto_profil', fotoFile)
      await profileApi.update(fd)
      await fetchUser()
      setFotoFile(null)
      setFotoPreview(null)
      Swal.fire({ icon: 'success', title: 'Profil diperbarui', timer: 1500, showConfirmButton: false })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memperbarui profil'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      Swal.fire({ icon: 'error', title: 'Konfirmasi password tidak cocok' })
      return
    }
    if (passwordForm.new_password.length < 8) {
      Swal.fire({ icon: 'error', title: 'Password minimal 8 karakter' })
      return
    }
    setSaving(true)
    try {
      await profileApi.changePassword(passwordForm)
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' })
      Swal.fire({ icon: 'success', title: 'Password berhasil diubah', timer: 1500, showConfirmButton: false })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mengubah password'
      Swal.fire({ icon: 'error', title: 'Gagal', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({ icon: 'question', title: 'Yakin ingin logout?', showCancelButton: true, confirmButtonText: 'Logout', cancelButtonText: 'Batal' })
    if (result.isConfirmed) {
      await logout()
      window.location.href = '/login'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0E6187] text-white">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Profil Saya</h1>
            <p className="text-sm text-slate-500">Kelola akun dan password</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 transition hover:ring-[#0E6187]"
          >
            {previewUrl ? (
              <img src={previewUrl} alt={user?.name || 'Foto profil'} className="h-full w-full object-cover" />
            ) : (
              <User size={32} className="text-slate-400" />
            )}
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#0E6187] text-white">
              <Camera size={12} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
          <div className="text-center sm:text-left">
            <p className="text-base font-semibold text-slate-800">{user?.name || '-'}</p>
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
              <Mail size={14} />
              {user?.email || '-'}
            </p>
            <div className="mt-2">
              <span className="inline-flex rounded-full bg-[#0E6187]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0E6187]">
                {user?.role || 'KANDIDAT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-sm font-bold text-slate-800">Akun</h2>
        <div className="grid gap-4 sm:max-w-xl">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Nama / Username <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nama akun" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0E6187] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0a4a6a] disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-1 text-sm font-bold text-slate-800">Ganti Password</h2>
        <p className="mb-4 text-xs text-slate-500">Password minimal 8 karakter.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password Saat Ini <span className="text-red-500">*</span></label>
            <input type="password" className={inputCls} value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} placeholder="Password lama" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Password Baru <span className="text-red-500">*</span></label>
            <input type="password" className={inputCls} value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} placeholder="Min. 8 karakter" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Konfirmasi Password Baru <span className="text-red-500">*</span></label>
            <input type="password" className={inputCls} value={passwordForm.new_password_confirmation} onChange={e => setPasswordForm(f => ({ ...f, new_password_confirmation: e.target.value }))} placeholder="Ulangi password baru" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Lock size={15} />
            {saving ? 'Menyimpan...' : 'Ganti Password'}
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  )
}
