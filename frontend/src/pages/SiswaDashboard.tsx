import { useState, useEffect } from 'react'
import { User, CheckCircle, Clock, XCircle, CreditCard, Package, Edit3, X, Upload, Camera } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface PendaftarData {
  id: number
  nama: string
  email: string
  status_pendaftaran: string
  status_pembayaran: string
  created_at: string
  product: { id: number; nama: string; harga: number } | null
}

interface SiswaData {
  id: number
  user_id: number
  nama: string
  jenis_kelamin: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  agama: string | null
  alamat: string | null
  no_hp: string | null
  foto: string | null
  status: string
}

interface UserData {
  id: number
  name: string
  email: string
  no_hp: string | null
  alamat: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  jenis_kelamin: string | null
  agama: string | null
  nik: string | null
  pendidikan_terakhir: string | null
  foto_profil: string | null
  foto_ktp: string | null
  foto_ijazah: string | null
  foto_kk: string | null
}

export default function SiswaDashboard() {
  const { user } = useAuth()
  const [pendaftar, setPendaftar] = useState<PendaftarData | null>(null)
  const [siswa, setSiswa] = useState<SiswaData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', no_hp: '', alamat: '', tempat_lahir: '', tanggal_lahir: '',
    jenis_kelamin: '', agama: '', nik: '', pendidikan_terakhir: '',
  })
  const [files, setFiles] = useState<Record<string, File | null>>({
    foto_profil: null, foto_ktp: null, foto_ijazah: null, foto_kk: null, foto: null,
  })

  useEffect(() => {
    api.get('/siswa-dashboard')
      .then(res => {
        setPendaftar(res.data.pendaftar)
        setSiswa(res.data.siswa)
        setUserData(res.data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function openModal() {
    const u = userData || { name: user?.name || '', no_hp: '', alamat: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', agama: '', nik: '', pendidikan_terakhir: '' }
    setForm({
      name: u.name || '',
      no_hp: u.no_hp || '',
      alamat: u.alamat || '',
      tempat_lahir: u.tempat_lahir || '',
      tanggal_lahir: u.tanggal_lahir || '',
      jenis_kelamin: u.jenis_kelamin || '',
      agama: u.agama || '',
      nik: u.nik || '',
      pendidikan_terakhir: u.pendidikan_terakhir || '',
    })
    setFiles({ foto_profil: null, foto_ktp: null, foto_ijazah: null, foto_kk: null, foto: null })
    setShowModal(true)
  }

  function handleFileChange(field: string, e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setFiles(prev => ({ ...prev, [field]: e.target.files![0] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v) })

      const res = await api.post('/siswa/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUserData(res.data.user)
      setSiswa(res.data.siswa)
      setShowModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
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
  const fotoSrc = userData?.foto_profil
    ? `http://localhost:8000/${userData.foto_profil}`
    : null

  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white border border-blue-100">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Halo, {user?.name}!</h1>
            <p className="text-sm text-slate-500">Status pendaftaran Anda</p>
          </div>
        </div>
        {pendaftar && (
          <button onClick={openModal}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
            <Edit3 size={16} /> Lengkapi Data
          </button>
        )}
      </div>

      {pendaftar ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Status Pendaftaran */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-800">Status Pendaftaran</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <StatusIcon size={20} className={
                  pendaftar.status_pendaftaran === 'disetujui' ? 'text-emerald-500' :
                  pendaftar.status_pendaftaran === 'ditolak' ? 'text-red-500' : 'text-amber-500'
                } />
                <div>
                  <p className="text-xs text-slate-500">Status Pendaftaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[pendaftar.status_pendaftaran]}`}>
                    {pendaftar.status_pendaftaran}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-slate-500">Status Pembayaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentColor[pendaftar.status_pembayaran]}`}>
                    {pendaftar.status_pembayaran}
                  </span>
                </div>
              </div>
              {pendaftar.product && (
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-500">Program</p>
                    <p className="font-semibold text-slate-800">{pendaftar.product.nama}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Diri */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-800">Data Diri</h2>
            </div>
            <div className="space-y-3 p-5">
              {fotoSrc ? (
                <div className="mb-3 flex justify-center">
                  <img src={fotoSrc} alt="foto" className="h-20 w-20 rounded-full border-2 border-slate-200 object-cover" />
                </div>
              ) : (
                <div className="mb-3 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <User size={32} />
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nama</span>
                <span className="font-medium text-slate-800">{pendaftar.nama}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-800">{pendaftar.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">No. HP</span>
                <span className="font-medium text-slate-800">{userData?.no_hp || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tempat Lahir</span>
                <span className="font-medium text-slate-800">{userData?.tempat_lahir || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tanggal Lahir</span>
                <span className="font-medium text-slate-800">{userData?.tanggal_lahir || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Jenis Kelamin</span>
                <span className="font-medium text-slate-800">{userData?.jenis_kelamin || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Agama</span>
                <span className="font-medium text-slate-800">{userData?.agama || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Alamat</span>
                <span className="font-medium text-slate-800">{userData?.alamat || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tanggal Daftar</span>
                <span className="font-medium text-slate-800">
                  {new Date(pendaftar.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Dokumen */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-800">Dokumen</h2>
            </div>
            <div className="space-y-3 p-5">
              {[
                { label: 'KTP', field: 'foto_ktp', value: userData?.foto_ktp },
                { label: 'Ijazah', field: 'foto_ijazah', value: userData?.foto_ijazah },
                { label: 'Kartu Keluarga', field: 'foto_kk', value: userData?.foto_kk },
              ].map(doc => (
                <div key={doc.field} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <span className="text-sm text-slate-600">{doc.label}</span>
                  {doc.value ? (
                    <a href={`http://localhost:8000/${doc.value}`} target="_blank" rel="noreferrer"
                      className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600 transition hover:bg-blue-100">
                      Lihat
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Belum diupload</span>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <button onClick={openModal}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-2.5 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                  <Upload size={16} /> Lengkapi Data & Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User size={24} />
          </div>
          <p className="mt-3 text-sm text-slate-500">Belum ada data pendaftaran</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Lengkapi Data Diri</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Data Pribadi */}
              <div>
                <h3 className="mb-3 border-l-4 border-blue-600 pl-3 text-sm font-semibold text-slate-700">Data Pribadi</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NIK</label>
                    <input type="text" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tempat Lahir</label>
                    <input type="text" value={form.tempat_lahir} onChange={e => setForm({ ...form, tempat_lahir: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Lahir</label>
                    <input type="date" value={form.tanggal_lahir} onChange={e => setForm({ ...form, tanggal_lahir: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                    <select value={form.jenis_kelamin} onChange={e => setForm({ ...form, jenis_kelamin: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Agama</label>
                    <select value={form.agama} onChange={e => setForm({ ...form, agama: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Pilih</option>
                      <option>Islam</option>
                      <option>Kristen</option>
                      <option>Katolik</option>
                      <option>Hindu</option>
                      <option>Buddha</option>
                      <option>Konghucu</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat</label>
                    <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">No. HP</label>
                    <input type="text" value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pendidikan Terakhir</label>
                    <select value={form.pendidikan_terakhir} onChange={e => setForm({ ...form, pendidikan_terakhir: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                      <option value="">Pilih</option>
                      <option>SD/Sederajat</option>
                      <option>SMP/Sederajat</option>
                      <option>SMA/Sederajat</option>
                      <option>D1-D3</option>
                      <option>S1</option>
                      <option>S2</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Dokumen */}
              <div>
                <h3 className="mb-3 border-l-4 border-blue-600 pl-3 text-sm font-semibold text-slate-700">Upload Dokumen</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Profil</label>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                        <Camera size={16} />
                        {files.foto_profil ? files.foto_profil.name : 'Pilih file'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange('foto_profil', e)} />
                      </label>
                      {userData?.foto_profil && (
                        <a href={`http://localhost:8000/${userData.foto_profil}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline">Lihat</a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Siswa (untuk absensi)</label>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                        <Camera size={16} />
                        {files.foto ? files.foto.name : 'Pilih file'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange('foto', e)} />
                      </label>
                      {siswa?.foto && (
                        <a href={`http://localhost:8000/${siswa.foto}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline">Lihat</a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto KTP</label>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                        <Camera size={16} />
                        {files.foto_ktp ? files.foto_ktp.name : 'Pilih file'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange('foto_ktp', e)} />
                      </label>
                      {userData?.foto_ktp && (
                        <a href={`http://localhost:8000/${userData.foto_ktp}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline">Lihat</a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Ijazah</label>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                        <Camera size={16} />
                        {files.foto_ijazah ? files.foto_ijazah.name : 'Pilih file'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange('foto_ijazah', e)} />
                      </label>
                      {userData?.foto_ijazah && (
                        <a href={`http://localhost:8000/${userData.foto_ijazah}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline">Lihat</a>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kartu Keluarga</label>
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600">
                        <Camera size={16} />
                        {files.foto_kk ? files.foto_kk.name : 'Pilih file'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange('foto_kk', e)} />
                      </label>
                      {userData?.foto_kk && (
                        <a href={`http://localhost:8000/${userData.foto_kk}`} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline">Lihat</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {saving ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan</>
                  ) : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
