import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { guruProfileApi, profileApi, APP_URL } from '../../services/api'
import { User, Camera, ChevronLeft, Save, Lock, LogOut } from 'lucide-react'
import Swal from 'sweetalert2'
import KaryawanBottomNav from '../../components/KaryawanBottomNav'

const jenisKelaminOptions = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
]

const agamaOptions = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']

const statusPernikahanOptions = ['BELUM MENIKAH', 'MENIKAH', 'CERAI']

export default function GuruProfil() {
  const { user, logout } = useAuth()
  const [guru, setGuru] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    no_hp: '',
    alamat: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    agama: '',
    status_pernikahan: '',
    pendidikan_terakhir: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })

  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!user?.id) return
    loadData()
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const res = await guruProfileApi.profile()
      const d = res.data
      const guruData = d.guru
      const userData = d.user
      setGuru(guruData)
      setForm({
        name: userData.name || '',
        no_hp: userData.no_hp || '',
        alamat: userData.alamat || '',
        tempat_lahir: userData.tempat_lahir || '',
        tanggal_lahir: userData.tanggal_lahir || '',
        jenis_kelamin: userData.jenis_kelamin || '',
        agama: userData.agama || '',
        status_pernikahan: userData.status_pernikahan || '',
        pendidikan_terakhir: userData.pendidikan_terakhir || '',
      })
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, val]) => fd.append(key, val))
      if (fotoFile) fd.append('foto_profil', fotoFile)
      await profileApi.update(fd)
      setEditing(false)
      setFotoFile(null)
      setFotoPreview(null)
      Swal.fire({ icon: 'success', title: 'Profil diperbarui', timer: 1500, showConfirmButton: false })
      loadData()
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
      setShowPasswordForm(false)
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
      window.location.href = `${APP_URL}/logout-app`
    }
  }

  const fotoUrl = user?.foto_profil
    ? `${APP_URL}/uploads/foto_profil/${user.foto_profil}`
    : null

  const previewUrl = fotoPreview || fotoUrl

  const guruUser = user

  const infoRow = (label: string, value: string | null | undefined) => (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F0F1F5] last:border-b-0">
      <span className="text-xs font-medium text-[#8B90A0]">{label}</span>
      <span className="text-xs font-semibold text-[#14182B] text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F8] pb-24 flex items-center justify-center">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0E6187]/10 border-t-[#0E6187] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F5F8] pb-24">
      <div className="h-[3px] bg-gradient-to-r from-[#0069b0] via-[#0069b0] to-[#0069b0]" />

      {/* Header */}
      <div className="bg-white px-5 py-3.5 border-b border-[#E5E7EF] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/guru-data-siswa" className="text-[#8B90A0] hover:text-[#14182B] transition-colors">
            <ChevronLeft size={20} />
          </a>
          <h1 className="text-sm font-bold text-[#14182B]">Profil</h1>
        </div>
        {!editing && !showPasswordForm && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="text-[11px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-3 py-1.5 rounded-lg hover:bg-[#0069b0]/[0.1] transition-colors">
              Edit
            </button>
            <button onClick={() => setShowPasswordForm(true)} className="text-[11px] font-bold text-[#0069b0] bg-[#0069b0]/[0.06] px-3 py-1.5 rounded-lg hover:bg-[#0069b0]/[0.1] transition-colors">
              Password
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4 max-w-lg mx-auto">
        {/* Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#0069b0]/[0.08] flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
              {previewUrl ? (
                <img src={previewUrl} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-[#0069b0]" strokeWidth={1.5} />
              )}
            </div>
            {editing && (
              <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#0069b0] text-white flex items-center justify-center shadow-md hover:bg-[#004d7a] transition-colors">
                <Camera size={14} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setFotoFile(f)
                setFotoPreview(URL.createObjectURL(f))
              }
            }} />
          </div>
          <p className="text-sm font-bold text-[#14182B] mt-3">{guru?.nama || guruUser?.name || '—'}</p>
          <p className="text-[11px] text-[#8B90A0] font-medium">{guru?.mata_pelajaran ? `Sensei · ${guru.mata_pelajaran}` : 'Sensei'}</p>
        </div>

        {/* Edit Form */}
        {editing ? (
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-5 space-y-4">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Edit Profil</h3>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Nama Lengkap</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">No. HP</label>
              <input value={form.no_hp} onChange={e => setForm(p => ({ ...p, no_hp: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Tempat Lahir</label>
              <input value={form.tempat_lahir} onChange={e => setForm(p => ({ ...p, tempat_lahir: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Tanggal Lahir</label>
              <input type="date" value={form.tanggal_lahir} onChange={e => setForm(p => ({ ...p, tanggal_lahir: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Jenis Kelamin</label>
              <div className="flex gap-2">
                {jenisKelaminOptions.map(o => (
                  <button key={o.value} type="button" onClick={() => setForm(p => ({ ...p, jenis_kelamin: o.value }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      form.jenis_kelamin === o.value ? 'border-[#0069b0] bg-[#0069b0]/[0.04] text-[#0069b0]' : 'border-[#E5E7EF] text-[#8B90A0]'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Agama</label>
              <select value={form.agama} onChange={e => setForm(p => ({ ...p, agama: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]">
                <option value="">— Pilih —</option>
                {agamaOptions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Status Pernikahan</label>
              <select value={form.status_pernikahan} onChange={e => setForm(p => ({ ...p, status_pernikahan: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]">
                <option value="">— Pilih —</option>
                {statusPernikahanOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Pendidikan Terakhir</label>
              <input value={form.pendidikan_terakhir} onChange={e => setForm(p => ({ ...p, pendidikan_terakhir: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Alamat</label>
              <textarea value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0] resize-none" />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setEditing(false); setFotoFile(null); setFotoPreview(null) }}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E7EF] text-sm font-bold text-[#4B5063] hover:bg-[#F4F5F8] transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#0069b0] text-white text-sm font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        ) : showPasswordForm ? (
          /* Change Password */
          <div className="bg-white rounded-xl border border-[#E5E7EF] p-5 space-y-4">
            <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Ubah Password</h3>
            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Password Saat Ini</label>
              <input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Password Baru</label>
              <input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B5063] mb-1">Konfirmasi Password Baru</label>
              <input type="password" value={passwordForm.new_password_confirmation} onChange={e => setPasswordForm(p => ({ ...p, new_password_confirmation: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EF] text-sm text-[#14182B] focus:outline-none focus:ring-2 focus:ring-[#0069b0]/20 focus:border-[#0069b0]" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowPasswordForm(false); setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' }) }}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E7EF] text-sm font-bold text-[#4B5063] hover:bg-[#F4F5F8] transition-colors">
                Batal
              </button>
              <button onClick={handleChangePassword} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#0069b0] text-white text-sm font-bold hover:bg-[#004d7a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Lock size={15} /> {saving ? 'Menyimpan...' : 'Ubah Password'}
              </button>
            </div>
          </div>
        ) : (
          /* Info Display */
          <>
            <div className="bg-white rounded-xl border border-[#E5E7EF] overflow-hidden">
              <div className="px-5 pt-4 pb-2">
                <h3 className="text-[11px] font-bold tracking-[0.08em] text-[#4B5063] uppercase">Data Guru</h3>
              </div>
              <div className="px-5 pb-4">
                {infoRow('NIP', guru?.nip)}
                {infoRow('Email', guruUser?.email)}
                {infoRow('Mata Pelajaran', guru?.mata_pelajaran)}
                {infoRow('No. HP', guruUser?.no_hp)}
                {infoRow('Tempat Lahir', guruUser?.tempat_lahir)}
                {infoRow('Tanggal Lahir', guruUser?.tanggal_lahir)}
                {infoRow('Jenis Kelamin', guruUser?.jenis_kelamin === 'L' ? 'Laki-laki' : guruUser?.jenis_kelamin === 'P' ? 'Perempuan' : null)}
                {infoRow('Agama', guruUser?.agama)}
                {infoRow('Status Pernikahan', guruUser?.status_pernikahan)}
                {infoRow('Pendidikan Terakhir', guruUser?.pendidikan_terakhir)}
                {infoRow('Alamat', guruUser?.alamat)}
              </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              className="w-full py-3 rounded-xl border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </div>

      <KaryawanBottomNav activeTab="profil" absenStatus="belum" hasJadwal={false} />
    </div>
  )
}
