import { useState, useEffect } from 'react'
import { User, CheckCircle, Camera, ChevronDown } from 'lucide-react'
import api from '../../services/api'

interface PendaftarData {
  id: number
  nama: string
  email: string
  created_at: string
  product: { id: number; nama: string; harga: number } | null
}

interface SiswaData {
  id: number
  user_id: number
  nama: string
  nik: string | null
  no_registrasi: string | null
  jenis_kelamin: string | null
  tempat_lahir: string | null
  tanggal_lahir: string | null
  agama: string | null
  alamat: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  provinsi: string | null
  pendidikan_terakhir: string | null
  tahun_lulus: string | null
  tinggi_badan: string | null
  berat_badan: string | null
  goldar: string | null
  ukuran_baju: string | null
  status_pernikahan: string | null
  no_hp: string | null
  no_hp_ortu: string | null
  nama_ortu: string | null
  foto: string | null
  status: string
  batch_id: number | null
  batch_relasi?: { id: number; nama_batch: string } | null
  keterangan: string | null
}

interface UserData {
  id: number; name: string; email: string; no_hp: string | null; alamat: string | null
  tempat_lahir: string | null; tanggal_lahir: string | null; jenis_kelamin: string | null
  agama: string | null; nik: string | null; pendidikan_terakhir: string | null
  foto_profil: string | null; foto_ktp: string | null; foto_ijazah: string | null; foto_kk: string | null
}

const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm"
const selectClass = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm appearance-none cursor-pointer"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"
const cardClass = "bg-white border border-gray-200 rounded-lg shadow-sm"

const steps = [
  { id: 'pribadi', label: 'Data Pribadi' },
  { id: 'alamat', label: 'Alamat' },
  { id: 'tambahan', label: 'Info Tambahan' },
  { id: 'keluarga', label: 'Data Keluarga' },
  { id: 'dokumen', label: 'Upload Dokumen' },
]

export default function DataDiri() {
  const [pendaftar, setPendaftar] = useState<PendaftarData | null>(null)
  const [siswa, setSiswa] = useState<SiswaData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState(0)

  const [formPribadi, setFormPribadi] = useState({ name: '', nik: '', tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', agama: '' })
  const [formAlamat, setFormAlamat] = useState({ alamat: '', desa: '', kecamatan: '', kabupaten: '', provinsi: '' })
  const [formTambahan, setFormTambahan] = useState({ no_hp: '', pendidikan_terakhir: '', tahun_lulus: '', tinggi_badan: '', berat_badan: '', goldar: '', ukuran_baju: '', status_pernikahan: '', keterangan: '' })
  const [formKeluarga, setFormKeluarga] = useState({ nama_ortu: '', no_hp_ortu: '' })
  const [files, setFiles] = useState<Record<string, File | null>>({ foto_profil: null, foto: null, foto_ktp: null, foto_ijazah: null, foto_kk: null })

  const [savingPribadi, setSavingPribadi] = useState(false)
  const [savingAlamat, setSavingAlamat] = useState(false)
  const [savingTambahan, setSavingTambahan] = useState(false)
  const [savingKeluarga, setSavingKeluarga] = useState(false)
  const [savingDokumen, setSavingDokumen] = useState(false)

  const [successPribadi, setSuccessPribadi] = useState(false)
  const [successAlamat, setSuccessAlamat] = useState(false)
  const [successTambahan, setSuccessTambahan] = useState(false)
  const [successKeluarga, setSuccessKeluarga] = useState(false)
  const [successDokumen, setSuccessDokumen] = useState(false)

  const [errors, setErrors] = useState<string[]>([])

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

  useEffect(() => {
    if (!userData && !siswa) return
    const u = userData || {} as Partial<UserData>
    const s = siswa || {} as Partial<SiswaData>
    setFormPribadi({
      name: u.name || '',
      nik: s.nik || u.nik || '',
      tempat_lahir: s.tempat_lahir || u.tempat_lahir || '',
      tanggal_lahir: s.tanggal_lahir || u.tanggal_lahir || '',
      jenis_kelamin: s.jenis_kelamin || u.jenis_kelamin || '',
      agama: s.agama || u.agama || '',
    })
    setFormAlamat({
      alamat: s.alamat || u.alamat || '',
      desa: s.desa || '',
      kecamatan: s.kecamatan || '',
      kabupaten: s.kabupaten || '',
      provinsi: s.provinsi || '',
    })
    setFormTambahan({
      no_hp: s.no_hp || u.no_hp || '',
      pendidikan_terakhir: s.pendidikan_terakhir || u.pendidikan_terakhir || '',
      tahun_lulus: s.tahun_lulus || '',
      tinggi_badan: s.tinggi_badan || '',
      berat_badan: s.berat_badan || '',
      goldar: s.goldar || '',
      ukuran_baju: s.ukuran_baju || '',
      status_pernikahan: s.status_pernikahan || '',
      keterangan: s.keterangan || '',
    })
    setFormKeluarga({
      nama_ortu: s.nama_ortu || '',
      no_hp_ortu: s.no_hp_ortu || '',
    })
  }, [userData, siswa])

  function flashSuccess(setter: React.Dispatch<React.SetStateAction<boolean>>) {
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  async function savePribadi() {
    setSavingPribadi(true)
    setErrors([])
    try {
      const res = await api.post('/siswa/profile', formPribadi)
      setUserData(res.data.user)
      setSiswa(res.data.siswa)
      flashSuccess(setSuccessPribadi)
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        const msgs: string[] = []
        Object.values(serverErrors).forEach((arr: any) => msgs.push(...arr))
        setErrors(msgs)
      }
    } finally { setSavingPribadi(false) }
  }

  async function saveAlamat() {
    setSavingAlamat(true)
    setErrors([])
    try {
      const res = await api.post('/siswa/profile', formAlamat)
      setUserData(res.data.user)
      setSiswa(res.data.siswa)
      flashSuccess(setSuccessAlamat)
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        const msgs: string[] = []
        Object.values(serverErrors).forEach((arr: any) => msgs.push(...arr))
        setErrors(msgs)
      }
    } finally { setSavingAlamat(false) }
  }

  async function saveTambahan() {
    setSavingTambahan(true)
    setErrors([])
    try {
      const res = await api.post('/siswa/profile', formTambahan)
      setUserData(res.data.user)
      setSiswa(res.data.siswa)
      flashSuccess(setSuccessTambahan)
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        const msgs: string[] = []
        Object.values(serverErrors).forEach((arr: any) => msgs.push(...arr))
        setErrors(msgs)
      }
    } finally { setSavingTambahan(false) }
  }

  async function saveKeluarga() {
    setSavingKeluarga(true)
    setErrors([])
    try {
      const res = await api.post('/siswa/profile', formKeluarga)
      setUserData(res.data.user)
      setSiswa(res.data.siswa)
      flashSuccess(setSuccessKeluarga)
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        const msgs: string[] = []
        Object.values(serverErrors).forEach((arr: any) => msgs.push(...arr))
        setErrors(msgs)
      }
    } finally { setSavingKeluarga(false) }
  }

  function handleFileChange(field: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setErrors([`${field}: maksimal 5MB`])
      return
    }
    setErrors([])
    setFiles(prev => ({ ...prev, [field]: file }))
  }

  async function saveDokumen() {
    setSavingDokumen(true)
    setErrors([])
    try {
      const fd = new FormData()
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v) })
      const res = await api.post('/siswa/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUserData(res.data.user)
      setSiswa(res.data.siswa)
      setFiles({ foto_profil: null, foto: null, foto_ktp: null, foto_ijazah: null, foto_kk: null })
      flashSuccess(setSuccessDokumen)
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        const msgs: string[] = []
        Object.values(serverErrors).forEach((arr: any) => msgs.push(...arr))
        setErrors(msgs)
      }
    } finally { setSavingDokumen(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#0D1F3C]/10 border-t-[#0D1F3C] animate-spin" />
          <img src="/logo-sm.png" alt="Mendunia" className="w-7 h-7" />
        </div>
      </div>
    )
  }

  const fotoSrc = userData?.foto_profil ? `http://localhost:8000/${userData.foto_profil}` : null
  const hasData = (field: string) => {
    const s = siswa as any
    const u = userData as any
    return !!(s?.[field] || u?.[field])
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
      {/* Header */}
      <div className={`${cardClass} p-4 sm:p-5`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1F3C] text-white">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Lengkapi Data Diri</h1>
            <p className="text-sm text-gray-500">Isi data Anda step by step, setiap step bisa disimpan terpisah</p>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className={`${cardClass} p-2`}>
        <div className="flex gap-1 overflow-x-auto">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx
            const done = stepDone(step.id, siswa, userData)
            return (
              <button
                key={step.id}
                onClick={() => { setActiveStep(idx); setErrors([]) }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#0D1F3C] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {done ? <CheckCircle size={12} /> : idx + 1}
                </span>
                {step.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          {errors.map((msg, i) => (
            <p key={i} className="text-sm text-red-600">{msg}</p>
          ))}
        </div>
      )}

      {/* Step 1: Data Pribadi */}
      {activeStep === 0 && (
        <div className={`${cardClass}`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Data Pribadi</h2>
            <p className="text-xs text-gray-500 mt-0.5">Nama, identitas, dan data dasar Anda</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nama Lengkap</label>
                <input type="text" value={formPribadi.name} onChange={e => setFormPribadi({ ...formPribadi, name: e.target.value })} className={inputClass} placeholder="Nama Lengkap" />
              </div>
              <div>
                <label className={labelClass}>NIK</label>
                <input type="text" value={formPribadi.nik} onChange={e => setFormPribadi({ ...formPribadi, nik: e.target.value })} className={inputClass} placeholder="16 digit NIK" maxLength={16} />
              </div>
              <div>
                <label className={labelClass}>Tempat Lahir</label>
                <input type="text" value={formPribadi.tempat_lahir} onChange={e => setFormPribadi({ ...formPribadi, tempat_lahir: e.target.value })} className={inputClass} placeholder="Tempat Lahir" />
              </div>
              <div>
                <label className={labelClass}>Tanggal Lahir</label>
                <input type="date" value={formPribadi.tanggal_lahir} onChange={e => setFormPribadi({ ...formPribadi, tanggal_lahir: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Jenis Kelamin</label>
                <select value={formPribadi.jenis_kelamin} onChange={e => setFormPribadi({ ...formPribadi, jenis_kelamin: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Agama</label>
                <select value={formPribadi.agama} onChange={e => setFormPribadi({ ...formPribadi, agama: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option>Islam</option>
                  <option>Kristen</option>
                  <option>Katolik</option>
                  <option>Hindu</option>
                  <option>Buddha</option>
                  <option>Konghucu</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={savePribadi} disabled={savingPribadi}
                className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a3a5c] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                {savingPribadi ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan</>
                ) : successPribadi ? (
                  <><CheckCircle size={16} /> Tersimpan!</>
                ) : 'Simpan Data Pribadi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Alamat */}
      {activeStep === 1 && (
        <div className={`${cardClass}`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Alamat</h2>
            <p className="text-xs text-gray-500 mt-0.5">Domisili dan alamat lengkap</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Alamat Lengkap</label>
                <textarea value={formAlamat.alamat} onChange={e => setFormAlamat({ ...formAlamat, alamat: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#0D1F3C] focus:border-[#0D1F3C] outline-none transition-colors text-sm resize-none" placeholder="Alamat lengkap" />
              </div>
              <div>
                <label className={labelClass}>Desa/Kelurahan</label>
                <input type="text" value={formAlamat.desa} onChange={e => setFormAlamat({ ...formAlamat, desa: e.target.value })} className={inputClass} placeholder="Desa/Kelurahan" />
              </div>
              <div>
                <label className={labelClass}>Kecamatan</label>
                <input type="text" value={formAlamat.kecamatan} onChange={e => setFormAlamat({ ...formAlamat, kecamatan: e.target.value })} className={inputClass} placeholder="Kecamatan" />
              </div>
              <div>
                <label className={labelClass}>Kabupaten/Kota</label>
                <input type="text" value={formAlamat.kabupaten} onChange={e => setFormAlamat({ ...formAlamat, kabupaten: e.target.value })} className={inputClass} placeholder="Kabupaten/Kota" />
              </div>
              <div>
                <label className={labelClass}>Provinsi</label>
                <input type="text" value={formAlamat.provinsi} onChange={e => setFormAlamat({ ...formAlamat, provinsi: e.target.value })} className={inputClass} placeholder="Provinsi" />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={saveAlamat} disabled={savingAlamat}
                className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a3a5c] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                {savingAlamat ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan</>
                ) : successAlamat ? (
                  <><CheckCircle size={16} /> Tersimpan!</>
                ) : 'Simpan Alamat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Info Tambahan */}
      {activeStep === 2 && (
        <div className={`${cardClass}`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Info Tambahan</h2>
            <p className="text-xs text-gray-500 mt-0.5">Kontak, pendidikan, fisik, dan batch</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>No. HP</label>
                <input type="text" value={formTambahan.no_hp} onChange={e => setFormTambahan({ ...formTambahan, no_hp: e.target.value })} className={inputClass} placeholder="No. HP" />
              </div>
              <div>
                <label className={labelClass}>Pendidikan Terakhir</label>
                <select value={formTambahan.pendidikan_terakhir} onChange={e => setFormTambahan({ ...formTambahan, pendidikan_terakhir: e.target.value })} className={selectClass}>
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
                <label className={labelClass}>Tahun Lulus</label>
                <input type="text" value={formTambahan.tahun_lulus} onChange={e => setFormTambahan({ ...formTambahan, tahun_lulus: e.target.value })} className={inputClass} placeholder="Contoh: 2024" maxLength={4} />
              </div>
              <div>
                <label className={labelClass}>Tinggi Badan (cm)</label>
                <input type="number" value={formTambahan.tinggi_badan} onChange={e => setFormTambahan({ ...formTambahan, tinggi_badan: e.target.value })} className={inputClass} placeholder="cm" />
              </div>
              <div>
                <label className={labelClass}>Berat Badan (kg)</label>
                <input type="number" value={formTambahan.berat_badan} onChange={e => setFormTambahan({ ...formTambahan, berat_badan: e.target.value })} className={inputClass} placeholder="kg" />
              </div>
              <div>
                <label className={labelClass}>Golongan Darah</label>
                <select value={formTambahan.goldar} onChange={e => setFormTambahan({ ...formTambahan, goldar: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option>A</option><option>B</option><option>AB</option><option>O</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Ukuran Baju</label>
                <select value={formTambahan.ukuran_baju} onChange={e => setFormTambahan({ ...formTambahan, ukuran_baju: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Status Pernikahan</label>
                <select value={formTambahan.status_pernikahan} onChange={e => setFormTambahan({ ...formTambahan, status_pernikahan: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option>Belum Nikah</option><option>Nikah</option><option>Cerai</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Keterangan</label>
                <input type="text" value={formTambahan.keterangan} onChange={e => setFormTambahan({ ...formTambahan, keterangan: e.target.value })} className={inputClass} placeholder="Keterangan (opsional)" />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={saveTambahan} disabled={savingTambahan}
                className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a3a5c] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                {savingTambahan ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan</>
                ) : successTambahan ? (
                  <><CheckCircle size={16} /> Tersimpan!</>
                ) : 'Simpan Info Tambahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Data Keluarga */}
      {activeStep === 3 && (
        <div className={`${cardClass}`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Data Keluarga</h2>
            <p className="text-xs text-gray-500 mt-0.5">Informasi orang tua / wali</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nama Orang Tua / Wali</label>
                <input type="text" value={formKeluarga.nama_ortu} onChange={e => setFormKeluarga({ ...formKeluarga, nama_ortu: e.target.value })} className={inputClass} placeholder="Nama Orang Tua" />
              </div>
              <div>
                <label className={labelClass}>No. HP Orang Tua / Wali</label>
                <input type="text" value={formKeluarga.no_hp_ortu} onChange={e => setFormKeluarga({ ...formKeluarga, no_hp_ortu: e.target.value })} className={inputClass} placeholder="No. HP Orang Tua" />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={saveKeluarga} disabled={savingKeluarga}
                className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a3a5c] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                {savingKeluarga ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan</>
                ) : successKeluarga ? (
                  <><CheckCircle size={16} /> Tersimpan!</>
                ) : 'Simpan Data Keluarga'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Upload Dokumen */}
      {activeStep === 4 && (
        <div className={`${cardClass}`}>
          <div className="border-b border-gray-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-gray-800">Upload Dokumen</h2>
            <p className="text-xs text-gray-500 mt-0.5">Foto dan dokumen pendukung (maks. 5MB per file)</p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DocUpload label="Foto Profil" file={files.foto_profil} existing={userData?.foto_profil} onChange={e => handleFileChange('foto_profil', e)} />
              <DocUpload label="Foto Siswa (untuk absensi)" file={files.foto} existing={siswa?.foto} onChange={e => handleFileChange('foto', e)} />
              <DocUpload label="Foto KTP" file={files.foto_ktp} existing={userData?.foto_ktp} onChange={e => handleFileChange('foto_ktp', e)} />
              <DocUpload label="Foto Ijazah" file={files.foto_ijazah} existing={userData?.foto_ijazah} onChange={e => handleFileChange('foto_ijazah', e)} />
              <DocUpload label="Kartu Keluarga" file={files.foto_kk} existing={userData?.foto_kk} onChange={e => handleFileChange('foto_kk', e)} />
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={saveDokumen} disabled={savingDokumen}
                className="px-6 py-2.5 bg-[#0D1F3C] text-white rounded-md text-sm font-semibold hover:bg-[#1a3a5c] transition-colors disabled:opacity-70 inline-flex items-center gap-2">
                {savingDokumen ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Menyimpan</>
                ) : successDokumen ? (
                  <><CheckCircle size={16} /> Tersimpan!</>
                ) : 'Simpan Dokumen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function stepDone(id: string, siswa: SiswaData | null, userData: UserData | null) {
  const s = siswa as any
  const u = userData as any
  switch (id) {
    case 'pribadi': return !!(s?.nik || u?.nik)
    case 'alamat': return !!(s?.alamat || u?.alamat)
    case 'tambahan': return !!(s?.no_hp || u?.no_hp)
    case 'keluarga': return !!s?.nama_ortu
    case 'dokumen': return !!(userData?.foto_profil || userData?.foto_ktp || userData?.foto_ijazah || userData?.foto_kk || siswa?.foto)
    default: return false
  }
}

function DocUpload({ label, file, existing, onChange }: { label: string; file: File | null; existing: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-3 mt-1">
        <label className="flex-1 flex cursor-pointer items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-[#0D1F3C] transition hover:border-[#0D1F3C] hover:bg-white">
          <Camera size={16} />
          {file ? <span className="truncate max-w-[120px]">{file.name}</span> : 'Pilih file'}
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
