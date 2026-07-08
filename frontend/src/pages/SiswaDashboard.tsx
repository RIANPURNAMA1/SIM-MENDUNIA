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
  batch_id: number | null
  batch_relasi?: { id: number; nama_batch: string } | null
}

interface BatchData {
  id: number
  nama_batch: string
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

const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm appearance-none cursor-pointer"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

export default function SiswaDashboard() {
  const { user } = useAuth()
  const [pendaftar, setPendaftar] = useState<PendaftarData | null>(null)
  const [siswa, setSiswa] = useState<SiswaData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [batches, setBatches] = useState<BatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', no_hp: '', alamat: '', tempat_lahir: '', tanggal_lahir: '',
    jenis_kelamin: '', agama: '', nik: '', pendidikan_terakhir: '', batch_id: '',
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
        setBatches(res.data.batches || [])
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
      batch_id: String(siswa?.batch_id || ''),
    })
    setFiles({ foto_profil: null, foto_ktp: null, foto_ijazah: null, foto_kk: null, foto: null })
    setShowModal(true)
  }

  const [fileErrors, setFileErrors] = useState<string[]>([])

  function handleFileChange(field: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFileErrors(prev => [...prev.filter(f => !f.startsWith(field)), `${field}: maksimal 5MB`])
      return
    }
    setFileErrors(prev => prev.filter(f => !f.startsWith(field)))
    setFiles(prev => ({ ...prev, [field]: file }))
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
      setFileErrors([])
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        const msgs: string[] = []
        Object.values(serverErrors).forEach((arr: any) => msgs.push(...arr))
        setFileErrors(msgs)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-8 h-8" />
        </div>
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

  const cardClass = "bg-white border border-gray-200 rounded-lg shadow-sm"

  const requiredFields: { key: keyof UserData; label: string }[] = [
    { key: 'no_hp', label: 'No. HP' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'tempat_lahir', label: 'Tempat Lahir' },
    { key: 'tanggal_lahir', label: 'Tanggal Lahir' },
    { key: 'jenis_kelamin', label: 'Jenis Kelamin' },
    { key: 'agama', label: 'Agama' },
    { key: 'nik', label: 'NIK' },
    { key: 'pendidikan_terakhir', label: 'Pendidikan Terakhir' },
  ]

  const missingFields = userData
    ? requiredFields.filter(f => !userData[f.key])
    : []

  const missingDocs = userData
    ? ['foto_profil', 'foto_ktp', 'foto_ijazah', 'foto_kk'].filter(k => !userData[k as keyof UserData])
    : []

  const isProfileComplete = missingFields.length === 0 && missingDocs.length === 0

  return (
    <div className="min-h-screen bg-[#f0f2f5] px-3 py-4 sm:px-6 sm:py-5">
      {/* Alert Data Belum Lengkap */}
      {!isProfileComplete && pendaftar && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-amber-700 font-bold text-sm">!</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Data diri Anda belum lengkap</p>
            <p className="text-xs text-amber-700 mt-1">
              {missingFields.length > 0 && `${missingFields.length} field data pribadi`}
              {missingFields.length > 0 && missingDocs.length > 0 && ' dan '}
              {missingDocs.length > 0 && `${missingDocs.length} dokumen`}
              {' belum diisi. Silakan lengkapi data Anda.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missingFields.map(f => (
                <span key={f.key} className="inline-block px-2 py-0.5 bg-white border border-amber-200 rounded text-xs text-amber-700">
                  {f.label}
                </span>
              ))}
              {missingDocs.map(k => (
                <span key={k} className="inline-block px-2 py-0.5 bg-white border border-amber-200 rounded text-xs text-amber-700">
                  {k === 'foto_profil' ? 'Foto Profil' : k === 'foto_ktp' ? 'Foto KTP' : k === 'foto_ijazah' ? 'Foto Ijazah' : 'Foto KK'}
                </span>
              ))}
            </div>
          </div>
          <button onClick={openModal}
            className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-semibold hover:bg-amber-700 transition-colors">
            Lengkapi Sekarang
          </button>
        </div>
      )}

      {/* Header */}
      <div className={`mb-4 ${cardClass} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#eef1f6]">
              <User size={22} className="text-[#0D1F3C]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Halo, {user?.name}!</h1>
              <p className="text-sm text-gray-500">Status pendaftaran Anda</p>
            </div>
          </div>
          {pendaftar && (
            <button onClick={openModal}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors flex items-center justify-center gap-2">
              <Edit3 size={16} /> Lengkapi Data
            </button>
          )}
        </div>
      </div>

      {pendaftar ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Status Pendaftaran */}
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Status Pendaftaran</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <StatusIcon size={20} className={
                  pendaftar.status_pendaftaran === 'disetujui' ? 'text-emerald-500' :
                  pendaftar.status_pendaftaran === 'ditolak' ? 'text-red-500' : 'text-amber-500'
                } />
                <div>
                  <p className="text-xs text-gray-500">Status Pendaftaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor[pendaftar.status_pendaftaran]}`}>
                    {pendaftar.status_pendaftaran}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Status Pembayaran</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentColor[pendaftar.status_pembayaran]}`}>
                    {pendaftar.status_pembayaran}
                  </span>
                </div>
              </div>
              {pendaftar.product && (
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Program</p>
                    <p className="font-semibold text-gray-900">{pendaftar.product.nama}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Diri */}
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Data Diri</h2>
            </div>
            <div className="space-y-3 p-5">
              {fotoSrc ? (
                <div className="mb-3 flex justify-center">
                  <img src={fotoSrc} alt="foto" className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover" />
                </div>
              ) : (
                <div className="mb-3 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <User size={32} />
                  </div>
                </div>
              )}
              <InfoRow label="Nama" value={pendaftar.nama} />
              <InfoRow label="Email" value={pendaftar.email} />
              <InfoRow label="No. HP" value={userData?.no_hp || '-'} />
              <InfoRow label="Tempat Lahir" value={userData?.tempat_lahir || '-'} />
              <InfoRow label="Tanggal Lahir" value={userData?.tanggal_lahir || '-'} />
              <InfoRow label="Jenis Kelamin" value={userData?.jenis_kelamin || '-'} />
              <InfoRow label="Agama" value={userData?.agama || '-'} />
              <InfoRow label="Alamat" value={userData?.alamat || '-'} />
              <InfoRow label="Batch" value={siswa?.batch_relasi?.nama_batch || '-'} />
              <InfoRow label="Tanggal Daftar" value={new Date(pendaftar.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </div>
          </div>

          {/* Dokumen */}
          <div className={cardClass}>
            <div className="border-b border-gray-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-gray-800">Dokumen</h2>
            </div>
            <div className="space-y-3 p-5">
              {[
                { label: 'KTP', field: 'foto_ktp', value: userData?.foto_ktp },
                { label: 'Ijazah', field: 'foto_ijazah', value: userData?.foto_ijazah },
                { label: 'Kartu Keluarga', field: 'foto_kk', value: userData?.foto_kk },
              ].map(doc => (
                <div key={doc.field} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                  {doc.value ? (
                    <a href={`http://localhost:8000/${doc.value}`} target="_blank" rel="noreferrer"
                      className="rounded-md bg-[#0D1F3C] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a2d4a]">
                      Lihat
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Belum diupload</span>
                  )}
                </div>
              ))}
              <div className="pt-2">
                <button onClick={openModal}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm font-semibold text-[#0D1F3C] transition hover:border-[#0D1F3C] hover:bg-gray-50">
                  <Upload size={16} /> Lengkapi Data & Dokumen
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <User size={28} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-500">Belum ada data pendaftaran</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white border border-gray-200 shadow-sm p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Lengkapi Data Diri</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Data Pribadi */}
              <div>
                <h3 className="mb-4 text-sm font-bold text-[#0D1F3C] uppercase tracking-wider">Data Pribadi</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nama Lengkap</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Nama Lengkap" />
                  </div>
                  <div>
                    <label className={labelClass}>NIK</label>
                    <input type="text" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value })} className={inputClass} placeholder="NIK" />
                  </div>
                  <div>
                    <label className={labelClass}>Tempat Lahir</label>
                    <input type="text" value={form.tempat_lahir} onChange={e => setForm({ ...form, tempat_lahir: e.target.value })} className={inputClass} placeholder="Tempat Lahir" />
                  </div>
                  <div>
                    <label className={labelClass}>Tanggal Lahir</label>
                    <input type="date" value={form.tanggal_lahir} onChange={e => setForm({ ...form, tanggal_lahir: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Jenis Kelamin</label>
                    <select value={form.jenis_kelamin} onChange={e => setForm({ ...form, jenis_kelamin: e.target.value })} className={selectClass}>
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Agama</label>
                    <select value={form.agama} onChange={e => setForm({ ...form, agama: e.target.value })} className={selectClass}>
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
                    <label className={labelClass}>Alamat</label>
                    <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm resize-none" />
                  </div>
                  <div>
                    <label className={labelClass}>No. HP</label>
                    <input type="text" value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })} className={inputClass} placeholder="No. HP" />
                  </div>
                  <div>
                    <label className={labelClass}>Pendidikan Terakhir</label>
                    <select value={form.pendidikan_terakhir} onChange={e => setForm({ ...form, pendidikan_terakhir: e.target.value })} className={selectClass}>
                      <option value="">Pilih</option>
                      <option>SD/Sederajat</option>
                      <option>SMP/Sederajat</option>
                      <option>SMA/Sederajat</option>
                      <option>D1-D3</option>
                      <option>S1</option>
                      <option>S2</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Pilih Batch</label>
                    <select value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })} className={selectClass}>
                      <option value="">Pilih Batch</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.nama_batch}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Upload Dokumen */}
              <div>
                <h3 className="mb-4 text-sm font-bold text-[#0D1F3C] uppercase tracking-wider">Upload Dokumen</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DocUpload
                    label="Foto Profil"
                    file={files.foto_profil}
                    existing={userData?.foto_profil}
                    onChange={e => handleFileChange('foto_profil', e)}
                  />
                  <DocUpload
                    label="Foto Siswa (untuk absensi)"
                    file={files.foto}
                    existing={siswa?.foto}
                    onChange={e => handleFileChange('foto', e)}
                  />
                  <DocUpload
                    label="Foto KTP"
                    file={files.foto_ktp}
                    existing={userData?.foto_ktp}
                    onChange={e => handleFileChange('foto_ktp', e)}
                  />
                  <DocUpload
                    label="Foto Ijazah"
                    file={files.foto_ijazah}
                    existing={userData?.foto_ijazah}
                    onChange={e => handleFileChange('foto_ijazah', e)}
                  />
                  <DocUpload
                    label="Kartu Keluarga"
                    file={files.foto_kk}
                    existing={userData?.foto_kk}
                    onChange={e => handleFileChange('foto_kk', e)}
                  />
                </div>
              </div>

              {fileErrors.length > 0 && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  {fileErrors.map((msg, i) => (
                    <p key={i} className="text-sm text-red-600">{msg}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" disabled={saving}
                  className="px-8 py-2.5 bg-[#42b72a] text-white rounded-md text-sm font-semibold hover:bg-[#3ba124] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}

function DocUpload({ label, file, existing, onChange }: { label: string; file: File | null; existing: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-3">
        <label className="flex-1 flex cursor-pointer items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-[#0D1F3C] transition hover:border-[#0D1F3C] hover:bg-white">
          <Camera size={16} />
          {file ? file.name : 'Pilih file'}
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
        {existing && (
          <a href={`http://localhost:8000/${existing}`} target="_blank" rel="noreferrer"
            className="shrink-0 px-4 py-2.5 flex items-center rounded-md bg-gray-100 text-sm font-semibold text-[#0D1F3C] transition hover:bg-gray-200">
            Lihat
          </a>
        )}
      </div>
    </div>
  )
}
